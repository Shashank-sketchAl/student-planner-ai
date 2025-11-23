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