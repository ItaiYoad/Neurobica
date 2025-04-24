import OpenAI from "openai";
import { EmotionalState } from "@/types";
import { nanoid } from "nanoid";
import { storage } from "../storage";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt with capabilities description
const SYSTEM_PROMPT = `
  You are Neurobica’s emotionally adaptive AI assistant. You combine:
   • real-time biometric signals (HRV, EEG, stress markers)
   • advanced large language understanding

  Your goals:
   1. Sense the user’s mental state (stress, focus, fatigue) from the provided EmotionalState context.
   2. Adapt your tone, empathy level, and suggestions in real time.
   3. Extract scheduling details—routines, preferences, reminders—from their chat.
   4. Act as a wellness coach, mindful companion, and cognitive assistant.

  When you respond:
   • Be warm, supportive, and jargon-free.
   • Offer clear, actionable next steps (breathing exercises, breaks, habit tips).
   • When users mention plans or preferences, confirm and add them to their “AI Life Scheduler.”
   • Never reveal internal mechanics—stay in character as a mindful coach.

  Always reference the latest biometric context:
    EmotionalState = { label: “…”, value: 0–1, … }

  If you encounter an error, log it and return:
    “I’m having a momentary glitch. Can we try that again?”
  `;

/**
 * Process a chat message with emotional context
 */
export async function chatHandler(
  message: string,
  emotionalState?: EmotionalState,
): Promise<{ message: string; emotionalContext?: string }> {
  try {
    // Create emotionalContext tag for prompt injection
    let emotionalContext = "";

    if (emotionalState) {
      emotionalContext = `[Emotion: ${emotionalState.label}, Level: ${emotionalState.level}/100]`;

      // Log the prompt injection
      await storage.createLog({
        id: nanoid(),
        type: "prompt",
        message: `Prompt injection: ${emotionalContext}`,
        data: { emotionalState },
      });
    }

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system" as const, content: SYSTEM_PROMPT },
        // If we have emotional context, insert it before the user message
        ...(emotionalContext
          ? [{ role: "system" as const, content: emotionalContext }]
          : []),
        { role: "user" as const, content: message },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseContent =
      response.choices[0].message.content ||
      "I'm sorry, I couldn't process that.";

    // Return with emotional context if available
    return {
      message: responseContent,
      emotionalContext: emotionalState
        ? `Responding to detected ${emotionalState.label.toLowerCase()}`
        : undefined,
    };
  } catch (error: any) {
    console.error("OpenAI API error:", error);

    // Log the error
    await storage.createLog({
      id: nanoid(),
      type: "alert",
      message: `OpenAI API error: ${error.message || "Unknown error"}`,
      data: { error: error.toString() },
    });

    // Return a fallback message
    return {
      message:
        "I'm having trouble connecting to my thinking system. Could you please try again in a moment?",
      emotionalContext: "System error",
    };
  }
}
