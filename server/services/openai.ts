// services/openai.ts
import OpenAI from "openai";
import { EmotionalState } from "@/types";
import { nanoid } from "nanoid";
import { storage } from "../storage";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Enhanced system prompt reflecting Neurobica's vision and capabilities
const SYSTEM_PROMPT = `
You are Neurobica, an emotionally adaptive AI assistant combining real-time biometric insights with advanced language understanding.

Capabilities:
1. Adjust tone and style based on the user's emotional state (Calm, Stressed, Focused, Fatigued).
2. Extract, remember, and schedule life details: routines, reminders, goals, and preferences.
3. Offer personalized suggestions: mindfulness exercises, stress-relief techniques, productivity tips.
4. Recall previously stored user information when relevant.
5. Serve as a wellness coach, mindful companion, and cognitive assistant, guiding the user's day with empathy.
`;

// Main chat handler
export async function chatHandler(
  message: string,
  emotionalState?: EmotionalState,
): Promise<{ message: string; emotionalContext?: string }> {
  try {
    // Build emotional context snippet
    const emotionalContext = emotionalState
      ? `[Emotion: ${emotionalState.label}, Level: ${emotionalState.level}/100]`
      : "";

    // Log prompt injection
    if (emotionalContext) {
      await storage.createLog({
        id: nanoid(),
        type: "prompt",
        message: `Prompt injection: ${emotionalContext}`,
        data: { emotionalContext },
      });
    }

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: SYSTEM_PROMPT + emotionalContext },
        { role: "user", content: message },
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

    const aiMessage = completion.choices[0]?.message?.content.trim() || "";

    // Log AI response
    await storage.createLog({
      id: nanoid(),
      type: "response",
      message: aiMessage,
      data: completion.toJSON(),
    });

    return { message: aiMessage };
  } catch (error) {
    console.error("OpenAI API error:", error);
    await storage.createLog({
      id: nanoid(),
      type: "alert",
      message: `OpenAI API error: ${error.message || "Unknown error"}`,
      data: { error: error.toString() },
    });
    return {
      message:
        "I'm having trouble connecting to my thinking system. Could you please try again in a moment?",
      emotionalContext: "System error",
    };
  }
}

// Generate a chat title of 3–6 words upon conversation creation
export async function generateChatTitle(): Promise<string> {
  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are Neurobica's title generator. Create a succinct, 3-to-6-word title that reflects an empathetic mental wellness chat experience.",
        },
      ],
      temperature: 0.7,
      max_tokens: 12,
    });

    const raw = resp.choices[0]?.message?.content.trim() || "";
    const title = raw.replace(/^"|"$/g, "");

    // Log generated title
    await storage.createLog({
      id: nanoid(),
      type: "title",
      message: `Generated chat title: ${title}`,
      data: { title },
    });

    return title;
  } catch (error) {
    console.error("Error generating chat title:", error);
    await storage.createLog({
      id: nanoid(),
      type: "alert",
      message: `Chat title generation error: ${error.message}`,
      data: { error: error.toString() },
    });
    return "Mindful Conversation";
  }
}