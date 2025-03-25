import OpenAI from 'openai';
import { searchSimilarMessages } from './supabase';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  console.warn('OpenAI API key is missing. Please check your environment variables.');
}

export const isValidApiKey = () => {
  return !!apiKey && apiKey.startsWith('sk-') && apiKey.length > 20;
};

export const openai = new OpenAI({ 
  apiKey: apiKey || 'dummy-key',
  dangerouslyAllowBrowser: true,
  maxRetries: 3,
  timeout: 30000
});

export async function generateAnswer(question: string): Promise<string> {
  if (!isValidApiKey()) {
    throw new Error('OpenAI API key is missing or invalid');
  }

  try {
    // Search for similar messages to provide context
    const similarMessages = await searchSimilarMessages(question);
    
    // Create a context from similar messages
    const context = similarMessages.length > 0
      ? `Previous relevant conversations:\n${similarMessages
          .map(msg => `- ${msg.content}`)
          .join('\n')}\n\nCurrent question: ${question}`
      : question;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are EchoMind, a helpful and intelligent AI assistant. Provide accurate and concise answers."
        },
        {
          role: "user",
          content: context
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    if (!completion?.choices?.[0]?.message?.content) {
      throw new Error('Failed to generate response');
    }

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error in generateAnswer:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('insufficient_quota')) {
        throw new Error('API quota exceeded. Please check your OpenAI account.');
      }
      if (error.message.includes('invalid_api_key')) {
        throw new Error('Invalid API key. Please check your OpenAI API key.');
      }
      if (error.message.includes('Failed to')) {
        throw error;
      }
    }
    
    throw new Error('An unexpected error occurred. Please try again.');
  }
}