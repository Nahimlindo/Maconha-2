
import { GoogleGenAI, Type } from "@google/genai";

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

export const explainCalculation = async (expression: string, result: string) => {
  const ai = getAiClient();
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Explique detalhadamente como chegamos ao resultado de ${result} a partir da expressão ${expression}. Use uma linguagem simples e didática.`,
      config: {
        systemInstruction: "Você é um professor de matemática amigável e didático. Sua tarefa é explicar cálculos passo a passo.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: {
              type: Type.STRING,
              description: "Uma visão geral simples do cálculo."
            },
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Uma lista de passos lógicos para resolver a conta."
            }
          },
          required: ["explanation", "steps"]
        }
      }
    });

    if (!response.text) return null;
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Erro ao chamar Gemini:", error);
    return null;
  }
};

export const solveWordProblem = async (problem: string) => {
  const ai = getAiClient();
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: problem,
      config: {
        systemInstruction: "Você é um assistente de matemática avançado. Resolva o problema de texto fornecido, mostre o cálculo matemático final e explique o raciocínio.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            expression: { type: Type.STRING, description: "A expressão matemática simplificada." },
            result: { type: Type.STRING, description: "O valor numérico final." },
            reasoning: { type: Type.STRING, description: "O raciocínio por trás da solução." }
          },
          required: ["expression", "result", "reasoning"]
        }
      }
    });

    if (!response.text) return null;
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Erro ao resolver problema de texto:", error);
    return null;
  }
};
