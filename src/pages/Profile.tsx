import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Calendar, Award, TrendingUp, BookOpen } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useLearning } from '../contexts/LearningContext'
import { supabase } from '../lib/supabase'

export default function Profile() {
  const { user } = useAuth()
  const { learningPlans } = useLearning()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    totalPlans: 0,
    completedQuizzes: 0,
    averageScore: 0,
    totalStudyTime: 0,
  })

  useEffect(() => {
    if (user) {
      loadProfile()
      calculateStats()
    }
  }, [user, learningPlans])

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const calculateStats = async () => {
    if (!user) return

    try {
      // Get quiz results
      const { data: quizResults } = await supabase
        .from('quiz_results')
        .select('score, total_questions')
        .eq('user_id', user.id)

      const totalQuizzes = quizResults?.length || 0
      const averageScore = totalQuizzes > 0 
        ? Math.round(quizResults.reduce((sum, result) => sum + (result.score / (result.total_questions * 2)) * 100, 0) / totalQuizzes)
        : 0

      // Calculate total study time (estimate based on plans)
      const totalStudyTime = learningPlans.reduce((total, plan) => {
        const timeValue = parseInt(plan.daily_time.split(' ')[0]) || 30
        return total + (timeValue * plan.duration_days)
      }, 0)

      setStats({
        totalPlans: learningPlans.length,
        completedQuizzes: totalQuizzes,
        averageScore,
        totalStudyTime,
      })
    } catch (error) {
      console.error('Error calculating stats:', error)
    }
  }

  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-6 sm:mb-8"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          
          <div className="text-center sm:text-left flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              {profile?.full_name || user?.user_metadata?.full_name || 'User'}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm sm:text-base text-dark-400">
              <div className="flex items-center justify-center sm:justify-start space-x-1">
                <Mail className="w-4 h-4" />
                <span className="truncate">{user?.email}</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(user?.created_at || '').toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card text-center p-4 sm:p-6"
        >
          <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-primary-500 mx-auto mb-2" />
          <div className="text-xl sm:text-2xl font-bold">{stats.totalPlans}</div>
          <div className="text-dark-400 text-xs sm:text-sm">Learning Plans</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card text-center p-4 sm:p-6"
        >
          <Award className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 mx-auto mb-2" />
          <div className="text-xl sm:text-2xl font-bold">{stats.completedQuizzes}</div>
          <div className="text-dark-400 text-xs sm:text-sm">Quizzes Completed</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card text-center p-4 sm:p-6"
        >
          <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mx-auto mb-2" />
          <div className="text-xl sm:text-2xl font-bold">{stats.averageScore}%</div>
          <div className="text-dark-400 text-xs sm:text-sm">Average Score</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card text-center p-4 sm:p-6"
        >
          <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 mx-auto mb-2" />
          <div className="text-xl sm:text-2xl font-bold">{formatStudyTime(stats.totalStudyTime)}</div>
          <div className="text-dark-400 text-xs sm:text-sm">Total Study Time</div>
        </motion.div>
      </div>

      {/* Learning Plans History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card"
      >
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Learning History</h2>
        
        {learningPlans.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-dark-600 mx-auto mb-4" />
            <p className="text-dark-400">No learning plans yet</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {learningPlans.map((plan, index) => (
              <div
                key={plan.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-dark-700 rounded-lg space-y-2 sm:space-y-0"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm sm:text-base truncate">{plan.topic}</h3>
                  <div className="text-xs sm:text-sm text-dark-400">
                    {plan.duration_days} days • {plan.level} • {plan.daily_time}
                  </div>
                  <div className="text-xs text-dark-500">
                    Started {new Date(plan.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex justify-end">
                  {plan.is_active && (
                    <span className="bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                      Active
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}