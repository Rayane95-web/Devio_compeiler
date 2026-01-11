
import { GoogleGenAI, Type } from "@google/genai";
import { Language, CodeOutput, DebugFrame } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const executeCode = async (
  language: Language,
  code: string,
  stdin: string
): Promise<CodeOutput> => {
  // Use gemini-3-pro-preview for complex code simulation tasks
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Act as a secure sandboxed code execution environment for ${language}. 
    Execute the following code with the provided standard input (stdin).
    Return the execution results exactly in JSON format.
    
    Code:
    ${code}
    
    Stdin:
    ${stdin}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          stdout: { type: Type.STRING },
          stderr: { type: Type.STRING },
          exitCode: { type: Type.INTEGER },
          executionTime: { type: Type.STRING },
          memoryUsage: { type: Type.STRING }
        },
        required: ["stdout", "stderr", "exitCode"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const debugCode = async (
  language: Language,
  code: string,
  breakpoints: number[]
): Promise<DebugFrame[]> => {
  // Use gemini-3-pro-preview for complex debugging trace generation
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Act as a debugger for ${language}. 
    Analyze the code and provide a step-by-step debug state at the following breakpoint lines: ${breakpoints.join(', ')}.
    If no breakpoints are provided, provide an execution trace for the first 5 significant lines.
    Return an array of debug frames in JSON. 
    
    IMPORTANT: The 'variables' field in each frame must be a JSON-encoded string of the variable state.
    
    Code:
    ${code}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            line: { type: Type.INTEGER },
            // Variables are dynamic, so we use Type.STRING and require a JSON string to comply with the non-empty Type.OBJECT rule
            variables: { 
              type: Type.STRING,
              description: 'A JSON-encoded string of the variables and their values at this frame.'
            },
            stackTrace: { type: Type.ARRAY, items: { type: Type.STRING } },
            explanation: { type: Type.STRING }
          },
          required: ["line", "variables", "stackTrace"]
        }
      }
    }
  });

  const frames = JSON.parse(response.text);
  // Post-process the frames to parse the variables string back into an object
  return frames.map((frame: any) => ({
    ...frame,
    variables: typeof frame.variables === 'string' ? JSON.parse(frame.variables) : frame.variables
  }));
};

export const getAIHint = async (
  language: Language,
  code: string,
  error: string
): Promise<string> => {
  // Use gemini-3-pro-preview for high-quality code reasoning and hints
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `I am writing ${language} code and encountered an error. 
    Help me debug it and provide a concise hint.
    
    Code:
    ${code}
    
    Error:
    ${error}
    `,
  });

  return response.text;
};

export const formatCode = async (
  language: Language,
  code: string
): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `You are an expert code formatter. Format the following ${language} code according to its industry-standard style guide (e.g., PEP 8 for Python, Prettier for JS, Google Style for Java/C++).
    Return ONLY the formatted code. DO NOT include markdown code blocks, language identifiers, or any explanations.
    
    Code:
    ${code}`,
  });

  return response.text?.trim() || code;
};
