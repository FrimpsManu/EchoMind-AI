import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl || '', supabaseKey || '');

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseKey;
};

export async function searchSimilarMessages(content: string, limit = 5) {
  try {
    // First, get the embedding for the search content
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: content,
        model: 'text-embedding-ada-002'
      })
    });

    const { data: [{ embedding }] } = await embeddingResponse.json();

    // Search for similar messages using the embedding
    const { data: similarMessages, error } = await supabase
      .rpc('match_messages', {
        query_embedding: embedding,
        match_threshold: 0.7,
        match_count: limit
      });

    if (error) throw error;
    return similarMessages;
  } catch (error) {
    console.error('Error searching similar messages:', error);
    return [];
  }
}

export async function saveMessage(content: string, role: 'user' | 'assistant', conversationId: string) {
  try {
    // First, verify the conversation exists
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      throw new Error('Conversation not found');
    }

    // Get embedding for the message
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: content,
        model: 'text-embedding-ada-002'
      })
    });

    const { data: [{ embedding }] } = await embeddingResponse.json();

    // Save message with embedding
    const { error } = await supabase
      .from('messages')
      .insert({
        content,
        role,
        embedding,
        conversation_id: conversationId
      });

    if (error) throw error;

    // If this is the first user message in the conversation, update the conversation title
    if (role === 'user') {
      const { data: messages } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('role', 'user');

      if (messages && messages.length === 1) {
        // This is the first user message, update the conversation title
        const title = content.length > 50 ? `${content.substring(0, 47)}...` : content;
        await supabase
          .from('conversations')
          .update({ title })
          .eq('id', conversationId);
      }
    }
  } catch (error) {
    console.error('Error saving message:', error);
    throw error; // Re-throw the error to handle it in the component
  }
}

export async function createConversation(title: string = 'New Chat') {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .insert({ title })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create conversation');
    
    return data;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
}

export async function updateMessage(messageId: string, updates: {
  content?: string;
  is_pinned?: boolean;
}) {
  const { error } = await supabase
    .from('messages')
    .update(updates)
    .eq('id', messageId);

  if (error) throw error;
}

export async function toggleMessagePin(messageId: string, isPinned: boolean) {
  return updateMessage(messageId, { is_pinned: isPinned });
}