import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const openaiInstance = createOpenAI({
    baseURL: process.env.AI_ENDPOINT,
    apiKey: process.env.AI_API_KEY,
  });
  const result = streamText({
    model: openaiInstance(process.env.AI_MODEL as string),
    messages,
  });

  return result.toDataStreamResponse();
}
