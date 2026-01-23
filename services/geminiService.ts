
import { GoogleGenAI, Type } from "@google/genai";
import { LessonPlan, CEFRLevel, StudentCount, Duration } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const lessonPlanSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          teacherNotes: { type: Type.STRING, description: "Instruções para o professor em Português Brasileiro." },
          studentContent: { type: Type.STRING, description: "Content for the student. MUST BE IN ENGLISH." },
          isConversation: { type: Type.BOOLEAN },
          durationMinutes: { type: Type.NUMBER },
          backgroundQuestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-4 follow-up questions related to the main studentContent question. MUST BE IN ENGLISH." }
        },
        required: ["title", "description", "teacherNotes", "studentContent"]
      }
    },
    quiz: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING, description: "Quiz question in ENGLISH." },
          options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Options in ENGLISH." },
          correctIndex: { type: Type.NUMBER },
          explanation: { type: Type.STRING, description: "Explicação em Português Brasileiro sobre a resposta correta." }
        },
        required: ["question", "options", "correctIndex", "explanation"]
      }
    },
    icebreaker: { type: Type.STRING, description: "Activity description in ENGLISH." },
    closingActivity: { type: Type.STRING, description: "Activity description in ENGLISH." },
    homework: { type: Type.STRING, description: "Homework description in ENGLISH." },
  },
  required: ["title", "sections", "homework"]
};

export const generateLessonImage = async (prompt: string): Promise<string | undefined> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A hyper-realistic, ultra-detailed professional cinematic photograph. 8k resolution, stunning lighting, masterwork quality. Topic: ${prompt}. Pure subject matter, sharp focus, vibrant colors. DO NOT show any people, DO NOT show text, DO NOT show classrooms or school supplies. Aesthetic and inspiring visual.` }]
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4"
        }
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
  } catch (e) {
    console.error("Failed to generate image", e);
  }
  return undefined;
};

export const generateLessonPlan = async (params: {
  level: CEFRLevel;
  studentCount: StudentCount;
  duration: Duration;
  grammarTopic: string;
  vocabularyFocus: string;
  includeExplanations: boolean;
  generateImage: boolean;
  generateText: boolean;
  generateAudio: boolean;
  audioVoice: string;
  audioAccent: string;
  includeConversationQuestions: boolean;
  icebreaker: boolean;
  closing: boolean;
  homework: boolean;
}): Promise<LessonPlan> => {
  const prompt = `Crie um plano de aula FASCINANTE de Inglês (Level: ${params.level}).
    TEMA OBRIGATÓRIO: Use fatos reais de Ciência, História ou Curiosidades relacionados a ${params.vocabularyFocus}.
    FOCO GRAMATICAL (MANDATÓRIO): Você DEVE usar a gramática "${params.grammarTopic}" extensivamente no conteúdo.
    
    REGRAS DE IDIOMA (CRÍTICO):
    - "title", "studentContent" e "quiz questions/options" DEVEM estar em INGLÊS.
    - "teacherNotes" e "explanation" DEVEM estar em PORTUGUÊS BRASILEIRO.
    
    REGRAS DE FORMATAÇÃO:
    - NO studentContent, JAMAIS use símbolos # ou ##.
    - Use parágrafos fluídos com quebras de linha duplas (\\n\\n).
    - Use APENAS ** para destacar vocabulário essencial.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: lessonPlanSchema,
    },
  });

  const rawData = JSON.parse(response.text);
  return {
    ...rawData,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    level: params.level,
    studentCount: params.studentCount,
    duration: params.duration,
    grammarTopic: params.grammarTopic,
    vocabularyFocus: params.vocabularyFocus
  };
};

export const generateQuickLessonPlan = async (params: {
  level: CEFRLevel;
  studentCount: StudentCount;
  grammarTopic: string;
  vocabularyFocus: string;
  extraInfo?: string;
}): Promise<LessonPlan> => {
  const isC1 = params.level === 'C1';
  const isB = params.level === 'B1' || params.level === 'B2';
  const paragraphsCount = isC1 ? 3 : (isB ? 2 : 1);

  const prompt = `Create a "Quick Power Lesson" level ${params.level}.
    CORE TOPIC (Vocabulary): "${params.vocabularyFocus.toUpperCase()}".
    CORE GRAMMAR (Mandatory): "${params.grammarTopic.toUpperCase()}".
    
    STRICT CONTENT RULES:
    1. Every single section of this lesson MUST naturally incorporate the grammar "${params.grammarTopic}".
    2. The reading text MUST use the grammar topic at least 3 times.
    3. Every conversation question MUST be structured to encourage the student to use "${params.grammarTopic}".
    
    STRICT STRUCTURE RULES:
    1. The "sections" array MUST have EXACTLY 11 items.
    2. sections[0]: The main READING text (${paragraphsCount} paragraph(s)) about ${params.vocabularyFocus}.
    3. sections[1] to [10]: Ten distinct CONVERSATION questions that use or target ${params.grammarTopic}.
    4. Each conversation section MUST have 3 "backgroundQuestions" for the teacher in English.
    5. The "quiz" array MUST have EXACTLY 5 items.
    
    STRICT LANGUAGE RULES:
    - title, studentContent, backgroundQuestions, quiz: ALL IN ENGLISH.
    - teacherNotes, explanation: BRAZILIAN PORTUGUESE.
    
    ${params.extraInfo ? `ADDITIONAL CONTEXT/TONE: ${params.extraInfo}` : ''}
    
    Separate reading paragraphs with \\n\\n.
    At the very end of sections[0].studentContent, add the delimiter "||VOCAB||" followed by 10 vocab words.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: lessonPlanSchema,
    },
  });

  const rawData = JSON.parse(response.text);
  return {
    ...rawData,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    level: params.level,
    studentCount: params.studentCount,
    duration: '1h',
    grammarTopic: params.grammarTopic,
    vocabularyFocus: params.vocabularyFocus,
    isQuickLesson: true
  };
};

export const generatePlaygroundActivity = async (level: CEFRLevel, type: string) => {
  const prompt = `English dynamic activity. Level: ${level}, Type: ${type}. 
    RULES: Title and Materials in ENGLISH. Instructions in ENGLISH. 
    Format: JSON.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          targetSkills: { type: Type.STRING },
          setupInstructions: { type: Type.STRING },
          activitySteps: { type: Type.STRING },
          studentMaterial: { type: Type.STRING },
          backupQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["title", "targetSkills", "setupInstructions", "activitySteps", "studentMaterial", "backupQuestions"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateExam = async (level: CEFRLevel) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `English exam level ${level}. MUST BE IN ENGLISH. No markdown headers.`,
  });
  return response.text;
};
