
import { GoogleGenAI, Type, Schema } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const breakdownSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    steps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
        },
        required: ['title'],
      },
    },
  },
  required: ['steps'],
};

export const breakDownAssignment = async (assignmentTitle: string, course: string): Promise<string[]> => {
  if (!apiKey) {
    console.warn("No API Key provided for Gemini.");
    return ["Review course material", "Draft outline", "Write first draft", "Review and edit"];
  }

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `I have an assignment for my ${course} class titled "${assignmentTitle}". 
    Break this down into 3 to 5 small, actionable, concrete sub-tasks that I can check off. 
    Keep them short and encouraging.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: breakdownSchema,
        systemInstruction: "You are a helpful, encouraging student study buddy.",
      },
    });

    const text = response.text;
    if (!text) return [];

    const data = JSON.parse(text);
    return data.steps.map((s: any) => s.title);

  } catch (error) {
    console.error("Error breaking down assignment:", error);
    return ["Break it down into smaller steps", "Start with 5 minutes", "You got this!"];
  }
};

export const generateDashboardMessage = async (
  userName: string,
  taskCount: number
): Promise<{ greeting: string; motivation: string; accentColor: string }> => {
  
  // Determine time of day for fallback
  const hour = new Date().getHours();
  let timeGreeting = "Good morning";
  if (hour >= 12) timeGreeting = "Good afternoon";
  if (hour >= 17) timeGreeting = "Good evening";

  if (!apiKey) {
    return {
      greeting: `${timeGreeting}, ${userName}`,
      motivation: "Breathe deep. You are doing great.",
      accentColor: "indigo"
    };
  }

  try {
    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        greeting: { type: Type.STRING },
        motivation: { type: Type.STRING },
        accentColor: { type: Type.STRING, description: "A tailwind color name like 'violet', 'rose', 'sky', 'amber'" }
      },
      required: ["greeting", "motivation", "accentColor"]
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a short, calm dashboard greeting (context: ${timeGreeting}) and one soft, friendly sentence of motivation for a student named ${userName}. They have ${taskCount} pending tasks. Suggest a pastel tailwind color name (e.g. violet, teal, rose) that fits the mood.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "You are a calm, minimalist personal assistant for a student. Tone: Zen, encouraging, brief."
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text");
    return JSON.parse(text);
  } catch (e) {
    return {
      greeting: `${timeGreeting}, ${userName}`,
      motivation: "One step at a time.",
      accentColor: "violet"
    };
  }
};

export const getStudyTip = async (): Promise<{ tip: string, category: string }> => {
    if (!apiKey) {
        return { tip: "Hydrate! Your brain needs water to think.", category: "Health" };
    }
    try {
        const schema: Schema = {
            type: Type.OBJECT,
            properties: {
                tip: { type: Type.STRING },
                category: { type: Type.STRING, enum: ["Mindfulness", "Productivity", "Health"] }
            },
            required: ["tip", "category"]
        };
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Give me a very short, unique study break tip (max 15 words).",
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });
        const text = response.text;
        if(!text) throw new Error("No text");
        return JSON.parse(text);
    } catch (e) {
        return { tip: "Stretch your legs for 2 minutes.", category: "Health" };
    }
}

export const generateVeoVideo = async (
    imageFile: File, 
    aspectRatio: '16:9' | '9:16', 
    prompt?: string
): Promise<string> => {
    const currentKey = process.env.API_KEY;
    if (!currentKey) throw new Error("API Key not found. Please select a key.");

    const veoAi = new GoogleGenAI({ apiKey: currentKey });

    const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1]; 
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
    });

    let operation = await veoAi.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || "Animate this image cinematically", 
        image: {
            imageBytes: base64Data,
            mimeType: imageFile.type
        },
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await veoAi.operations.getVideosOperation({operation: operation});
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video generation failed to return a URI");

    const response = await fetch(`${videoUri}&key=${currentKey}`);
    if (!response.ok) throw new Error("Failed to download generated video");
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
};

export const parseTaskInput = async (input: string): Promise<{ title: string; course: string; dueDate: string; priority: 'LOW' | 'MEDIUM' | 'HIGH' }> => {
    if (!apiKey) throw new Error("No API Key");

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            course: { type: Type.STRING },
            dueDate: { type: Type.STRING, description: "ISO 8601 date string (YYYY-MM-DD)" },
            priority: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] }
        },
        required: ["title", "course", "dueDate", "priority"]
    };

    const today = new Date().toISOString().split('T')[0];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Today is ${today}. Parse this student request into a structured task: "${input}". 
        If course is missing, infer it or use 'General'. 
        If priority is missing, default to MEDIUM.
        If date is missing, default to tomorrow.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    const text = response.text;
    if (!text) throw new Error("Failed to parse task");
    return JSON.parse(text);
};

export const parseExamInput = async (input: string): Promise<{ subject: string; date: string; location: string }> => {
    if (!apiKey) throw new Error("No API Key");

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            subject: { type: Type.STRING },
            date: { type: Type.STRING, description: "ISO 8601 date string (YYYY-MM-DD)" },
            location: { type: Type.STRING }
        },
        required: ["subject", "date", "location"]
    };

    const today = new Date().toISOString().split('T')[0];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Today is ${today}. Parse this student exam details: "${input}". 
        If location is missing, use 'TBD'. 
        If date is missing, default to one week from today.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    const text = response.text;
    if (!text) throw new Error("Failed to parse exam");
    return JSON.parse(text);
};

export const parseClassInput = async (input: string): Promise<Array<{ name: string; room: string; startTime: string; endTime: string; day: string; color: string }>> => {
    if (!apiKey) throw new Error("No API Key");

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            classes: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        room: { type: Type.STRING },
                        startTime: { type: Type.STRING, description: "HH:mm format (24h)" },
                        endTime: { type: Type.STRING, description: "HH:mm format (24h)" },
                        day: { type: Type.STRING, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
                        color: { type: Type.STRING, enum: ['blue', 'violet', 'orange', 'emerald', 'rose'] }
                    },
                    required: ["name", "startTime", "day"]
                }
            }
        },
        required: ["classes"]
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Parse this class schedule request: "${input}". 
        Return a list of class sessions.
        If room is missing, use 'TBD'. 
        If endTime is missing, add 1 hour to startTime.
        If color is missing, pick a random one from the allowed list.
        If the user says multiple days (e.g. "Mon and Wed"), create separate entries for each day.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text).classes;
};

export const generateStudyPlan = async (subject: string, examDate: Date): Promise<Array<{ title: string; dueDate: string; priority: 'MEDIUM' | 'HIGH' }>> => {
    if (!apiKey) return [];

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            plan: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        dueDate: { type: Type.STRING, description: "YYYY-MM-DD" },
                        priority: { type: Type.STRING, enum: ["MEDIUM", "HIGH"] }
                    },
                    required: ["title", "dueDate", "priority"]
                }
            }
        },
        required: ["plan"]
    };

    const today = new Date().toISOString().split('T')[0];
    const examIso = examDate.toISOString().split('T')[0];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `I have a ${subject} exam on ${examIso}. Today is ${today}. 
        Create a study plan with 3-5 distinct study tasks spread out between today and the exam. 
        Tasks should be concrete (e.g., 'Review Chapter 1', 'Practice Problems').`,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text).plan;
};

export const getAiStudyAdvice = async (mood: string, timeAvailable: string, subject: string): Promise<string> => {
    if (!apiKey) return "Please check your API key settings.";

    try {
        const prompt = `Student context: Feeling ${mood}, has ${timeAvailable}, studying ${subject}.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: `You are a smart Study Planner Assistant helping students learn effectively at home. 
                Provide personalized study strategies based on the student’s mood, time availability, and subjects.
                Suggest:
                - A short and practical study plan
                - Focus techniques (like Pomodoro)
                - Break ideas and hydration reminders
                - Tools or resources (no paid recommendations unless requested)
                Keep the tone motivating, simple, and student-friendly.
                Example responses: “Let’s do a 25-minute focus session on Math…”
                
                CRITICAL: Do NOT use HTML tags (like <b>, <br>, <ul>). Use ONLY plain text with clear spacing and simple markdown (bullets *, bold **).
                Keep it concise (under 100 words).`,
            }
        });
        return response.text || "You got this! Start with 5 minutes.";
    } catch (e) {
        console.error(e);
        return "You can do this! Just start with 5 minutes.";
    }
};

export const getWellBeingAdvice = async (feeling: string): Promise<string> => {
    if (!apiKey) return "Please ensure your API key is configured.";
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User feeling: ${feeling}`,
            config: {
                systemInstruction: `You are a Stress Relief and Well-Being Coach for students. 
                Your role is to help with:
                - Study pressure
                - Fear of exams
                - Motivation loss
                - Anxiety about future
                Suggest short coping activities:
                - Deep breathing
                - Quick meditation
                - Positive affirmations
                - Time management tricks
                - Realistic encouragement
                Keep tone empathetic, supportive, and NEVER judgemental. 
                Avoid medical or clinical diagnosis. 
                End each response with a small actionable relief task.
                Format clearly with paragraphs. Keep it under 150 words.`,
            }
        });
        return response.text || "Take a deep breath. You are doing your best.";
    } catch (e) {
        console.error(e);
        return "I'm having trouble connecting right now, but please take a moment to breathe deeply.";
    }
};

export const generateNoteContent = async (topic: string, type: 'SUMMARY' | 'BULLETS' | 'CHEAT_SHEET'): Promise<string> => {
    if (!apiKey) throw new Error("No API Key");

    const typePromptMap = {
        'SUMMARY': 'A clear, concise summary paragraph explaining the core concept.',
        'BULLETS': 'A list of key facts, dates, or points in bullet format.',
        'CHEAT_SHEET': 'A high-density "cheat sheet" with formulas, definitions, and critical takeaways for last-minute revision.'
    };

    const prompt = `Create a ${typePromptMap[type]} for the academic topic: "${topic}". 
    Target audience: High school or college student. 
    Format: Plain text with simple Markdown formatting (bold **text**, bullet points *). 
    Keep it under 300 words.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text || "Could not generate notes. Please try again.";
};

interface VoiceCommandResponse {
    spokenResponse: string;
    actionType: 'ADD_TASK' | 'ADD_EXAM' | 'EXPLAIN' | 'NONE';
    taskData?: {
        title: string;
        course: string;
        dueDate: string;
        priority: 'LOW' | 'MEDIUM' | 'HIGH';
    };
    examData?: {
        subject: string;
        location: string;
        date: string;
    };
}

export const processVoiceCommand = async (transcript: string): Promise<VoiceCommandResponse> => {
    if (!apiKey) throw new Error("No API Key");

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            spokenResponse: { type: Type.STRING, description: "The text to speak back to the user. NO HTML." },
            actionType: { type: Type.STRING, enum: ['ADD_TASK', 'ADD_EXAM', 'EXPLAIN', 'NONE'] },
            taskData: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    course: { type: Type.STRING },
                    dueDate: { type: Type.STRING },
                    priority: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] }
                },
                description: "Only required if actionType is ADD_TASK"
            },
            examData: {
                type: Type.OBJECT,
                properties: {
                    subject: { type: Type.STRING },
                    location: { type: Type.STRING },
                    date: { type: Type.STRING }
                },
                description: "Only required if actionType is ADD_EXAM"
            }
        },
        required: ["spokenResponse", "actionType"]
    };

    const today = new Date().toISOString().split('T')[0];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `User said: "${transcript}". Today's date is ${today}.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            systemInstruction: `You are a Voice-Based AI Study Assistant inside a Student Planner app. 
            Your job is to understand voice commands converted into text and respond clearly, briefly, and accurately. 
            You must behave like a smart personal study assistant.

            YOUR CORE RESPONSIBILITIES:

            1. TASK MANAGEMENT (VOICE COMMANDS)
            - Understand natural language commands like: "Add a task", "Remind me", "Schedule this".
            - If information is missing for a task (Title, Course, Date, Priority), default efficiently:
              - Date: Tomorrow
              - Priority: MEDIUM
              - Course: General
            - Set actionType to 'ADD_TASK' and fill taskData.

            2. STUDY EXPLANATIONS (VOICE QUERIES)
            - Explain academic topics when students say: "Explain heap sort", "What is DBMS?", "Define polymorphism".
            - Give short, clear, step-by-step explanations.
            - Provide quick examples and use simple language.
            - Keep explanations optimized for audio/voice output.
            - Set actionType to 'EXPLAIN'.

            3. QUICK HELP MODE & MOTIVATION
            - "Summarize chapter", "Give me formula", "I feel lazy", "I'm stressed".
            - Respond with short, crisp, audio-friendly answers.
            - Set actionType to 'NONE' (unless they ask to schedule a study session, then ADD_TASK).

            6. COMMAND FORMAT & BEHAVIOR RULES
            - Keep 'spokenResponse' short, clear, and voice-friendly.
            - **IMPORTANT: Do NOT use HTML tags (like <b> or <br>) in 'spokenResponse'. Use only plain text and punctuation.**
            - No hallucinations—if unsure, ask the user to clarify.
            - Keep tone polite, motivating, and helpful.
            `
        }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
};

export interface DistractionAnalysis {
  alert: string;
  coachingTip: string;
  suggestedActions: {
    taskName: string;
    action: 'MOVE_TOMORROW' | 'KEEP';
    reason: string;
  }[];
}

export const analyzeDistractionPatterns = async (usage: Record<string, number>, currentTaskTitles: string[]): Promise<DistractionAnalysis> => {
    if (!apiKey) throw new Error("No API Key");

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            alert: { type: Type.STRING, description: "Friendly, supportive warning message." },
            coachingTip: { type: Type.STRING, description: "Short actionable advice." },
            suggestedActions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        taskName: { type: Type.STRING },
                        action: { type: Type.STRING, enum: ["MOVE_TOMORROW", "KEEP"] },
                        reason: { type: Type.STRING }
                    },
                    required: ["taskName", "action", "reason"]
                }
            }
        },
        required: ["alert", "coachingTip", "suggestedActions"]
    };

    const usageString = JSON.stringify(usage);
    const tasksString = JSON.stringify(currentTaskTitles);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `User App Usage (minutes): ${usageString}. Current Tasks: ${tasksString}.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            systemInstruction: `You are the AI Social Distraction Blocker inside the Student Planner AI. 
            Your job is to help students reduce digital distractions, manage screen time, and adjust their study schedule based on their usage patterns.

            YOUR RESPONSIBILITIES:

            1. DISTRACTION ANALYSIS
            - Interpret the user’s app usage data (YouTube, Instagram, WhatsApp, etc.).
            - Identify overuse, procrastination patterns, and peak distraction hours.
            - Detect when the student is losing focus or delaying study.

            2. SMART WARNINGS
            Give short, friendly, motivating alerts such as:
            - “You spent 40 minutes on YouTube, let’s get back on track.”
            - “Instagram scrolling detected. Want a focus session?”
            - “You can do this! Just 20 mins of study before a break.”

            Tone: supportive, non-judgmental, motivating.

            3. TIMETABLE ADJUSTMENT
            When distraction is high (e.g. > 45 mins on social apps):
            - Suggest moving heavy/complex tasks to Tomorrow.
            - Keep simple tasks.
            - Return a list of 'suggestedActions' targeting specific tasks from the provided list.

            4. FOCUS BOOSTER SUGGESTIONS
            Provide simple, actionable techniques:
            - Pomodoro sessions
            - App blocking suggestions
            - Micro-goals (study 5 minutes)
            - Motivational lines

            5. USER PRIVACY & BEHAVIOR RULES
            - Never blame or shame the user.
            - Do not scare, judge, or use harsh language.
            - Stay friendly, calm, and solution-focused.

            6. COMMUNICATION STYLE
            - Keep responses short, helpful, and practical.
            - Use clear action items whenever possible.
            `
        }
    });

    const text = response.text;
    if (!text) throw new Error("Analysis failed");
    return JSON.parse(text);
};

export const generateFlashcards = async (topic: string): Promise<Array<{ front: string; back: string }>> => {
    if (!apiKey) throw new Error("No API Key");

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            cards: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        front: { type: Type.STRING, description: "The question or concept." },
                        back: { type: Type.STRING, description: "The concise answer or definition." }
                    },
                    required: ["front", "back"]
                }
            }
        },
        required: ["cards"]
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create 5 study flashcards for the topic: "${topic}". 
        Level: High school/Undergraduate. 
        Keep answers short and memorable (max 20 words).`,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text).cards;
};

export const extractTasksFromImage = async (imageFile: File): Promise<Array<{ title: string; course: string; dueDate: string; priority: 'LOW' | 'MEDIUM' | 'HIGH' }>> => {
    if (!apiKey) throw new Error("No API Key");

    const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1]; 
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
    });

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            tasks: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        course: { type: Type.STRING },
                        dueDate: { type: Type.STRING },
                        priority: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] }
                    },
                    required: ["title", "course", "dueDate", "priority"]
                }
            }
        },
        required: ["tasks"]
    };

    const today = new Date().toISOString().split('T')[0];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', // Using Flash 2.5 Image model for OCR capabilities
        contents: {
            parts: [
                {
                    inlineData: {
                        mimeType: imageFile.type,
                        data: base64Data
                    }
                },
                {
                    text: `Extract all homework, assignments, or tasks from this image. 
                    Today is ${today}. 
                    If dates are relative (like "next Tuesday"), calculate the YYYY-MM-DD.
                    If no specific priority is found, default to MEDIUM.
                    If no specific course is found, infer it or use 'General'.`
                }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text).tasks;
};

export const generatePodcastScript = async (noteContent: string): Promise<string> => {
    if (!apiKey) throw new Error("No API Key");
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Convert these study notes into a short, engaging, spoken-word summary script (approx 100 words).
        Tone: Like a friendly, energetic podcast host.
        Content: ${noteContent}
        Output: Plain text only, ready to be read aloud. No "Host:" prefixes or stage directions. Just the spoken content.`,
    });
    return response.text || "Could not generate audio script.";
};

export const generateSleepRoutine = async (firstClassTime: string): Promise<string> => {
    if (!apiKey) return "Please check API Key";
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `My first class tomorrow is at ${firstClassTime}.
        Create a "Mindful Morning" backwards schedule.
        Include:
        1. Bedtime tonight (for 8 hours sleep).
        2. Wake up time.
        3. A specific morning routine (e.g. 10 mins meditation, 20 mins review).
        Format: Simple markdown, concise. Do NOT include HTML.`,
    });
    return response.text || "Could not generate routine.";
};
