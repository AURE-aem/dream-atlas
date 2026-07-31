import OpenAI from "openai";

export const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    })
  : null;