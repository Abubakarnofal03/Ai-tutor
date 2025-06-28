import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      learning_plans: {
        Row: {
          id: string
          user_id: string
          topic: string
          duration_days: number
          level: string
          daily_time: string
          plan_data: any
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          topic: string
          duration_days: number
          level: string
          daily_time: string
          plan_data: any
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          topic?: string
          duration_days?: number
          level?: string
          daily_time?: string
          plan_data?: any
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
      }
      daily_progress: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          day_number: number
          subtopic_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          day_number: number
          subtopic_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          day_number?: number
          subtopic_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
        }
      }
      quiz_results: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          day_number: number
          questions: any
          answers: any
          score: number
          total_questions: number
          completed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          day_number: number
          questions: any
          answers: any
          score: number
          total_questions: number
          completed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          day_number?: number
          questions?: any
          answers?: any
          score?: number
          total_questions?: number
          completed_at?: string
          created_at?: string
        }
      }
    }
  }
}