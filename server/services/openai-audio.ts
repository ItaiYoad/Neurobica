/**
 * OpenAI Audio Service
 * 
 * Handles interactions with OpenAI's Whisper (speech-to-text) and TTS (text-to-speech) endpoints
 */

import OpenAI from 'openai';
import fs from 'fs';
import { createReadStream } from 'fs';
import { Readable } from 'stream';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Convert speech to text using OpenAI's Whisper API
 * @param audioBuffer Audio data buffer
 * @param fileName Temporary file name
 * @param options Additional options for transcription
 * @returns Transcription result
 */
export async function speechToText(
  audioBuffer: Buffer,
  fileName: string = 'audio.mp3',
  options: {
    language?: string;
    prompt?: string;
  } = {}
): Promise<string> {
  try {
    // Write buffer to temporary file
    const tempPath = `/tmp/${fileName}`;
    fs.writeFileSync(tempPath, audioBuffer);
    
    // Create file read stream for API
    const audioStream = createReadStream(tempPath);
    
    const response = await openai.audio.transcriptions.create({
      file: audioStream,
      model: 'whisper-1',
      language: options.language,
      prompt: options.prompt,
    });
    
    // Clean up temporary file
    fs.unlinkSync(tempPath);
    
    return response.text;
  } catch (error: any) {
    console.error('Speech-to-text error:', error);
    throw new Error(`Failed to transcribe audio: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Convert text to speech using OpenAI's TTS API
 * @param text Text to convert to speech
 * @param options TTS options
 * @returns Audio buffer and content type
 */
export async function textToSpeech(
  text: string,
  options: {
    voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
    speed?: number;
  } = {}
): Promise<{ audio: Buffer; contentType: string }> {
  try {
    const voice = options.voice || 'nova'; // Default voice
    const speed = options.speed || 1.0; // Default speed
    
    // Use direct response method with arraybuffer format
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice,
      input: text,
      speed,
      response_format: 'mp3', // Explicitly request mp3 format
    });
    
    // Get audio data as arrayBuffer
    const arrayBuffer = await response.arrayBuffer();
    
    // Convert to Buffer
    const buffer = Buffer.from(arrayBuffer);
    
    return {
      audio: buffer,
      contentType: 'audio/mpeg', // OpenAI returns audio/mpeg format
    };
  } catch (error: any) {
    console.error('Text-to-speech error:', error);
    throw new Error(`Failed to generate speech: ${error?.message || 'Unknown error'}`);
  }
}