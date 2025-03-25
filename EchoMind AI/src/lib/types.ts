export interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  isPlaying?: boolean;
  isPinned?: boolean;
  isEditing?: boolean;
  category?: string;
  conversationId?: string;
}

export interface SpeechOptions {
  rate: number;
  voice: SpeechSynthesisVoice | null;
  onEnd?: () => void;
}

export interface FilterOptions {
  category?: string;
  onlyPinned?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          title: string;
          category_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id?: string;
          title?: string;
          category_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          title?: string;
          category_id?: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          content: string;
          role: 'user' | 'assistant';
          embedding: number[];
          created_at: string;
          is_pinned: boolean;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          content: string;
          role: 'user' | 'assistant';
          embedding?: number[];
          created_at?: string;
          is_pinned?: boolean;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          content?: string;
          role?: 'user' | 'assistant';
          embedding?: number[];
          created_at?: string;
          is_pinned?: boolean;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          created_at?: string;
        };
      };
    };
    Functions: {
      match_messages: {
        Args: {
          query_embedding: number[];
          match_threshold: number;
          match_count: number;
        };
        Returns: {
          id: string;
          content: string;
          similarity: number;
        }[];
      };
    };
  };
}