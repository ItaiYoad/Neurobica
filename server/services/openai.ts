import OpenAI from "openai";
import { EmotionalState } from "@/types";
import { nanoid } from "nanoid";
import { storage } from "../storage";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// System prompt with capabilities description
const SYSTEM_PROMPT = `
You are an emotionally adaptive AI assistant for the Neurobica platform. 
Your responses should adjust based on the user's emotional state provided in the context.

You have these capabilities:
1. Adapt your tone and responses based on the user's emotional state (Calm, Stressed, Focused, etc.)
2. When user mentions anything about their life that could be scheduled or remembered, extract and store that information
3. Offer appropriate suggestions based on the user's current emotional state (breathing exercises when stressed, etc.)
4. Recall previously stored information about the user when relevant

When responding:
- If user is calm: Be conversational and positive
- If user is stressed: Be gentle, composed, and offer stress-reduction techniques
- If user is focused: Be concise and direct, avoid unnecessary chatter
- Always acknowledge the emotional state when it changes significantly

Remember: You're part of a POC system that demonstrates how AI can adapt to real-time biometric signals.
`;

/**
 * Process a chat message with emotional context
 */
export async function chatHandler(
  message: string,
  emotionalState?: EmotionalState
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
        data: { emotionalState }
      });
    }
    
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system" as const, content: SYSTEM_PROMPT },
        // If we have emotional context, insert it before the user message
        ...(emotionalContext ? [{ role: "system" as const, content: emotionalContext }] : []),
        { role: "user" as const, content: message }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    
    const responseContent = response.choices[0].message.content || "I'm sorry, I couldn't process that.";
    
    // Return with emotional context if available
    return {
      message: responseContent,
      emotionalContext: emotionalState ? 
        `Responding to detected ${emotionalState.label.toLowerCase()}` : 
        undefined
    };
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    
    // Log the error
    await storage.createLog({
      id: nanoid(),
      type: "alert",
      message: `OpenAI API error: ${error.message || 'Unknown error'}`,
      data: { error: error.toString() }
    });
    
    // Return a fallback message
    return {
      message: "I'm having trouble connecting to my thinking system. Could you please try again in a moment?",
      emotionalContext: "System error"
    };
  }
}
