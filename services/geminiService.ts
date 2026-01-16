
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
          studentContent: { type: Type.STRING },
          isConversation: { type: Type.BOOLEAN },
          durationMinutes: { type: Type.NUMBER },
          backgroundQuestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-4 follow-up questions related to the main studentContent question." }
        },
        required: ["title", "description", "teacherNotes", "studentContent"]
      }
    },
    quiz: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctIndex: { type: Type.NUMBER },
          explanation: { type: Type.STRING, description: "Explicação em Português Brasileiro sobre a resposta correta." }
        },
        required: ["question", "options", "correctIndex", "explanation"]
      }
    },
    icebreaker: { type: Type.STRING },
    closingActivity: { type: Type.STRING },
    homework: { type: Type.STRING },
  },
  required: ["title", "sections", "homework"]
};

export const generateLessonImage = async (prompt: string): Promise<string | undefined> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A realistic, high-quality cinematic photograph for an educational English book illustrating: ${prompt}. Horizontal 16:9, professional lighting, 4k resolution, no text in image.` }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
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
  const prompt = `Crie um plano de aula FASCINANTE em Inglês (Level: ${params.level}).
    TEMA OBRIGATÓRIO: Use fatos reais de Ciência, História ou Curiosidades relacionados a ${params.vocabularyFocus}.
    FOCO GRAMATICAL: ${params.grammarTopic}.
    
    REGRAS DE FORMATAÇÃO (ESTRITAS):
    - NO studentContent, JAMAIS use símbolos # ou ##.
    - Use parágrafos fluídos com quebras de linha duplas (\n\n) entre eles.
    - Use APENAS ** para destacar vocabulário essencial.
    - Teacher Notes em PORTUGUÊS.`;

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
}): Promise<LessonPlan> => {
  const prompt = `Crie um "Quick Power Lesson" de nível ${params.level} focado em "${params.vocabularyFocus.toUpperCase()}".
    
    REGRAS DE CONTEÚDO (ESTRITAS):
    1. SEÇÃO 0 (READING): Escreva um texto rico de 3-4 parágrafos. Use a gramática "${params.grammarTopic}". 
       IMPORTANTE: Ao final do texto, coloque o delimitador "||VOCAB||" seguido de uma lista de 5 palavras-chave com tradução.
    2. QUIZ: O campo "quiz" deve ter EXATAMENTE 5 perguntas de múltipla escolha sobre o texto.
    3. CONVERSATION (SEÇÕES 1 a 10): Cada uma deve conter 1 pergunta instigante no "studentContent" E 3 "backgroundQuestions" (perguntas de suporte) no array específico.
    
    ESTRUTURA JSON:
    - sections: 11 objetos.
    - quiz: 5 objetos.
    - backgroundQuestions: OBRIGATÓRIO para seções 1-10.`;

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
  const prompt = `Crie uma dinâmica de aula de inglês de alto impacto.
    NÍVEL: ${level}
    TIPO DE DINÂMICA: ${type}
    
    ESTRUTURA DO CONTEÚDO (JSON):
    - title: Nome criativo da dinâmica.
    - targetSkills: Habilidades focadas (ex: Speaking, Critical Thinking).
    - setupInstructions: Como o professor deve organizar a sala (em Português).
    - activitySteps: Passo a passo detalhado (em Português).
    - studentMaterial: O que aparecerá na tela para os alunos (em Inglês).
    - backupQuestions: 5 perguntas de suporte para manter a conversa fluindo (em Inglês).`;

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
  const prompt = `Generate an English exam for level ${level}. Focus on real-world interesting topics. NO markdown headers.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });
  return response.text;
};
