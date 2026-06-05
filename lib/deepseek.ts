import OpenAI from "openai";

export const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY!,
  baseURL: "https://api.deepseek.com",
});

export const MODELS = {
  chat: "deepseek-chat",
  reasoner: "deepseek-reasoner",
} as const;

export async function chat(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  opts: { model?: string; temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const response = await deepseek.chat.completions.create({
    model: opts.model ?? MODELS.chat,
    messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 4096,
  });
  return response.choices[0].message.content ?? "";
}
