import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54323';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Health check function
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('categories').select('count').limit(1);
    console.log('🔥 Supabase Health Check:', error ? 'Failed' : 'Success');
    return !error;
  } catch (error) {
    console.error('🔥 Supabase Health Check Failed:', error);
    return false;
  }
};

// Database type definitions will be generated later
export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: number;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      sections: {
        Row: {
          id: number;
          category_id: number | null;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          category_id?: number | null;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          category_id?: number | null;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      questions: {
        Row: {
          id: number;
          section_id: number | null;
          original_json: any;
          question_text: string;
          correct_answer: string;
          rationale: string | null;
          difficulty_level: number | null;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          section_id?: number | null;
          original_json: any;
          question_text: string;
          correct_answer: string;
          rationale?: string | null;
          difficulty_level?: number | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          section_id?: number | null;
          original_json?: any;
          question_text?: string;
          correct_answer?: string;
          rationale?: string | null;
          difficulty_level?: number | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          email: string;
          role: string | null;
          display_name: string | null;
          created_at: string;
          last_active: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: string | null;
          display_name?: string | null;
          created_at?: string;
          last_active?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: string | null;
          display_name?: string | null;
          created_at?: string;
          last_active?: string;
        };
      };
      quiz_sessions: {
        Row: {
          id: string;
          user_id: string | null;
          session_type: string;
          section_id: number | null;
          total_questions: number;
          time_limit: number | null;
          started_at: string;
          completed_at: string | null;
          score: number | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_type: string;
          section_id?: number | null;
          total_questions: number;
          time_limit?: number | null;
          started_at?: string;
          completed_at?: string | null;
          score?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          session_type?: string;
          section_id?: number | null;
          total_questions?: number;
          time_limit?: number | null;
          started_at?: string;
          completed_at?: string | null;
          score?: number | null;
        };
      };
      quiz_attempts: {
        Row: {
          id: string;
          session_id: string;
          question_id: number;
          selected_answer: string | null;
          is_correct: boolean | null;
          time_taken: number;
          attempted_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          question_id: number;
          selected_answer?: string | null;
          is_correct?: boolean | null;
          time_taken?: number;
          attempted_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          question_id?: number;
          selected_answer?: string | null;
          is_correct?: boolean | null;
          time_taken?: number;
          attempted_at?: string;
        };
      };
      question_options: {
        Row: {
          id: number;
          question_id: number;
          option_key: string;
          option_text: string;
        };
        Insert: {
          id?: number;
          question_id: number;
          option_key: string;
          option_text: string;
        };
        Update: {
          id?: number;
          question_id?: number;
          option_key?: string;
          option_text?: string;
        };
      };
    };
  };
};