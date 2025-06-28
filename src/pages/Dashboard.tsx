import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, BookOpen, Clock, Target, TrendingUp, Calendar, Award } from 'lucide-react'
import { useLearning } from '../contexts/LearningContext'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Dashboard() {
  const { user } = useAuth()
  const { learningPlans, activePlan, loading, refreshPlans } = useLearning()

  useEffect(() => {
    refreshPlans()
  }, [])

  const getTodayLesson = (plan: any) => {
    if (!plan?.plan_data?.days) return null
    
    const startDate = new Date(plan.created_at)
    const today = new Date()
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const currentDay = Math.min(daysDiff + 1, plan.plan_data.days.length)
    
    return plan.plan_data.days[currentDay - 1] || null
  }

  const getProgress = (plan: any) => {
    const startDate = new Date(plan.created_at)
    const today = new Date()
    const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const totalDays = plan.duration_days
    
    return Math.min((daysPassed / totalDays) * 100, 100)
  }

  if (loading) {
    return <LoadingSpinner text="Loading your dashboard..." />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Welcome back, {user?.user_metadata?.full_name || 'Learner'}! 👋
        </h1>
        <p className="text-sm sm:text-base text-dark-400">
          {activePlan 
            ? `Continue your journey learning ${activePlan.topic}`
            : 'Ready to start your learning journey?'
          }
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4 sm:p-6"
        >
          <div className="flex items-center space-x-2 sm:space-x-3">
            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-primary-500 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xl sm:text-2xl font-bold">{learningPlans.length}</div>
              <div className="text-xs sm:text-sm text-dark-400 truncate">Learning Plans</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-4 sm:p-6"
        >
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Target className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xl sm:text-2xl font-bold">
                {activePlan ? Math.round(getProgress(activePlan)) : 0}%
              </div>
              <div className="text-xs sm:text-sm text-dark-400 truncate">Progress</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-4 sm:p-6"
        >
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xl sm:text-2xl font-bold">
                {activePlan?.daily_time || '0 min'}
              </div>
              <div className="text-xs sm:text-sm text-dark-400 truncate">Daily Goal</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-4 sm:p-6"
        >
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Award className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xl sm:text-2xl font-bold">0</div>
              <div className="text-xs sm:text-sm text-dark-400 truncate">Achievements</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Today's Lesson */}
      {activePlan && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-3 sm:space-y-0">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-primary-500" />
              <span>Today's Lesson</span>
            </h2>
            <Link
              to={`/plan/${activePlan.id}`}
              className="btn-primary text-center sm:text-left"
            >
              Continue Learning
            </Link>
          </div>

          {(() => {
            const todayLesson = getTodayLesson(activePlan)
            return todayLesson ? (
              <div>
                <h3 className="font-semibold text-base sm:text-lg mb-3">{todayLesson.title}</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 text-sm sm:text-base">Subtopics:</h4>
                    <ul className="space-y-1">
                      {todayLesson.subtopics?.slice(0, 3).map((subtopic: any, index: number) => (
                        <li key={index} className="text-dark-400 text-xs sm:text-sm">
                          • {subtopic.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-sm sm:text-base">Objectives:</h4>
                    <ul className="space-y-1">
                      {todayLesson.objectives?.slice(0, 3).map((objective: string, index: number) => (
                        <li key={index} className="text-dark-400 text-xs sm:text-sm">
                          • {objective}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <p className="text-dark-400 mb-4">You've completed all lessons! 🎉</p>
                <Link to="/onboarding" className="btn-primary">
                  Start New Topic
                </Link>
              </div>
            )
          })()}
        </motion.div>
      )}

      {/* Learning Plans */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <h2 className="text-xl sm:text-2xl font-semibold">Your Learning Plans</h2>
        <Link to="/onboarding" className="btn-primary flex items-center justify-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>New Plan</span>
        </Link>
      </div>

      {learningPlans.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card text-center py-8 sm:py-12"
        >
          <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-dark-600 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold mb-2">No Learning Plans Yet</h3>
          <p className="text-sm sm:text-base text-dark-400 mb-4 sm:mb-6 px-4">
            Create your first personalized learning plan to get started!
          </p>
          <Link to="/onboarding" className="btn-primary">
            Create Your First Plan
          </Link>
        </motion.div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {learningPlans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card hover:border-primary-500 transition-colors duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-base sm:text-lg mb-1 truncate">{plan.topic}</h3>
                  <p className="text-dark-400 text-xs sm:text-sm">
                    {plan.duration_days} days • {plan.level} • {plan.daily_time}
                  </p>
                </div>
                {plan.is_active && (
                  <span className="bg-primary-500 text-white text-xs px-2 py-1 rounded-full flex-shrink-0 ml-2">
                    Active
                  </span>
                )}
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{Math.round(getProgress(plan))}%</span>
                </div>
                <div className="w-full bg-dark-700 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgress(plan)}%` }}
                  />
                </div>
              </div>

              <Link
                to={`/plan/${plan.id}`}
                className="btn-secondary w-full text-center text-sm sm:text-base"
              >
                Continue Learning
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}