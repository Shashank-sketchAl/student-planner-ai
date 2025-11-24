
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

// --- NEW AI FEATURES ---

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
                Format the output with simple HTML tags (e.g., <b>, <br>) or Markdown for readability if needed, but plain text is fine. Keep it concise (under 100 words).`,
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
