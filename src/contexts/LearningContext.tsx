import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { LearningPlan } from '../lib/groq'
import toast from 'react-hot-toast'

interface LearningContextType {
  learningPlans: any[]
  activePlan: any | null
  loading: boolean
  createLearningPlan: (planData: LearningPlan) => Promise<string>
  getLearningPlan: (planId: string) => Promise<any>
  updateProgress: (planId: string, dayNumber: number, subtopicId: string, completed: boolean) => Promise<void>
  getProgress: (planId: string, dayNumber: number) => Promise<any[]>
  saveQuizResult: (planId: string, dayNumber: number, questions: any[], answers: any[], score: number) => Promise<void>
  getQuizResult: (planId: string, dayNumber: number) => Promise<any | null>
  refreshPlans: () => Promise<void>
}

const LearningContext = createContext<LearningContextType | undefined>(undefined)

export function useLearning() {
  const context = useContext(LearningContext)
  if (context === undefined) {
    throw new Error('useLearning must be used within a LearningProvider')
  }
  return context
}

export function LearningProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [learningPlans, setLearningPlans] = useState<any[]>([])
  const [activePlan, setActivePlan] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      refreshPlans()
    } else {
      setLearningPlans([])
      setActivePlan(null)
    }
  }, [user])

  const refreshPlans = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('learning_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching learning plans:', error)
        // Don't show error toast for missing tables during initial setup
        if (error.code !== '42P01') {
          toast.error('Failed to load learning plans')
        }
        return
      }

      setLearningPlans(data || [])
      
      // Set active plan (most recent active one)
      const active = data?.find(plan => plan.is_active)
      setActivePlan(active || null)
    } catch (error) {
      console.error('Error fetching learning plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const createLearningPlan = async (planData: LearningPlan): Promise<string> => {
    if (!user) throw new Error('User not authenticated')

    try {
      // Deactivate other plans
      await supabase
        .from('learning_plans')
        .update({ is_active: false })
        .eq('user_id', user.id)

      const { data, error } = await supabase
        .from('learning_plans')
        .insert([
          {
            user_id: user.id,
            topic: planData.topic,
            duration_days: planData.totalDays,
            level: planData.level,
            daily_time: planData.dailyTime,
            plan_data: planData,
            is_active: true,
          },
        ])
        .select()
        .single()

      if (error) throw error

      await refreshPlans()
      toast.success('Learning plan created successfully!')
      
      return data.id
    } catch (error) {
      console.error('Error creating learning plan:', error)
      toast.error('Failed to create learning plan')
      throw error
    }
  }

  const getLearningPlan = async (planId: string) => {
    try {
      const { data, error } = await supabase
        .from('learning_plans')
        .select('*')
        .eq('id', planId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching learning plan:', error)
      throw error
    }
  }

  const updateProgress = async (planId: string, dayNumber: number, subtopicId: string, completed: boolean) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('daily_progress')
        .upsert([
          {
            user_id: user.id,
            plan_id: planId,
            day_number: dayNumber,
            subtopic_id: subtopicId,
            completed,
            completed_at: completed ? new Date().toISOString() : null,
          },
        ])

      if (error) throw error
    } catch (error) {
      console.error('Error updating progress:', error)
      toast.error('Failed to update progress')
    }
  }

  const getProgress = async (planId: string, dayNumber: number) => {
    if (!user) return []

    try {
      const { data, error } = await supabase
        .from('daily_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('plan_id', planId)
        .eq('day_number', dayNumber)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching progress:', error)
      return []
    }
  }

  const saveQuizResult = async (planId: string, dayNumber: number, questions: any[], answers: any[], score: number) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('quiz_results')
        .insert([
          {
            user_id: user.id,
            plan_id: planId,
            day_number: dayNumber,
            questions,
            answers,
            score,
            total_questions: questions.length,
            completed_at: new Date().toISOString(),
          },
        ])

      if (error) throw error
      toast.success(`Quiz completed! Score: ${score}/${questions.length * 2}`)
    } catch (error) {
      console.error('Error saving quiz result:', error)
      toast.error('Failed to save quiz result')
    }
  }

  const getQuizResult = async (planId: string, dayNumber: number) => {
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('user_id', user.id)
        .eq('plan_id', planId)
        .eq('day_number', dayNumber)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle() // Use maybeSingle instead of single to avoid errors when no rows

      if (error) {
        console.error('Error fetching quiz result:', error)
        return null
      }
      return data
    } catch (error) {
      console.error('Error fetching quiz result:', error)
      return null
    }
  }

  const value = {
    learningPlans,
    activePlan,
    loading,
    createLearningPlan,
    getLearningPlan,
    updateProgress,
    getProgress,
    saveQuizResult,
    getQuizResult,
    refreshPlans,
  }

  return <LearningContext.Provider value={value}>{children}</LearningContext.Provider>
}