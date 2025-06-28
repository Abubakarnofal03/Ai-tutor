import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  Circle, 
  Volume2, 
  MessageCircle, 
  Send, 
  BookOpen, 
  Clock,
  Target,
  ArrowLeft,
  Play
} from 'lucide-react'
import { useLearning } from '../contexts/LearningContext'
import { askTutorQuestion } from '../lib/groq'
import { ttsService } from '../lib/tts'
import LoadingSpinner from '../components/LoadingSpinner'
import MarkdownRenderer from '../components/MarkdownRenderer'
import toast from 'react-hot-toast'

export default function LearningPlan() {
  const { planId } = useParams<{ planId: string }>()
  const { getLearningPlan, updateProgress, getProgress } = useLearning()
  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentDay, setCurrentDay] = useState(1)
  const [progress, setProgress] = useState<any[]>([])
  const [questions, setQuestions] = useState<{ [key: string]: string }>({})
  const [answers, setAnswers] = useState<{ [key: string]: string }>({})
  const [loadingAnswer, setLoadingAnswer] = useState<string | null>(null)
  const [speaking, setSpeaking] = useState<string | null>(null)

  useEffect(() => {
    if (planId) {
      loadPlan()
    }
  }, [planId])

  useEffect(() => {
    if (plan) {
      loadProgress()
    }
  }, [plan, currentDay])

  const loadPlan = async () => {
    try {
      const planData = await getLearningPlan(planId!)
      setPlan(planData)
      
      // Calculate current day based on creation date
      const startDate = new Date(planData.created_at)
      const today = new Date()
      const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const calculatedDay = Math.min(Math.max(daysDiff + 1, 1), planData.plan_data.days.length)
      setCurrentDay(calculatedDay)
    } catch (error) {
      toast.error('Failed to load learning plan')
    } finally {
      setLoading(false)
    }
  }

  const loadProgress = async () => {
    const progressData = await getProgress(planId!, currentDay)
    setProgress(progressData)
  }

  const handleToggleComplete = async (subtopicId: string, completed: boolean) => {
    await updateProgress(planId!, currentDay, subtopicId, completed)
    await loadProgress()
    
    if (completed) {
      toast.success('Subtopic completed! 🎉')
    }
  }

  const isSubtopicCompleted = (subtopicId: string) => {
    return progress.some(p => p.subtopic_id === subtopicId && p.completed)
  }

  const handleAskQuestion = async (subtopicId: string) => {
    const question = questions[subtopicId]
    if (!question?.trim()) return

    setLoadingAnswer(subtopicId)
    try {
      const currentDayData = plan.plan_data.days[currentDay - 1]
      const subtopic = currentDayData.subtopics.find((s: any) => s.id === subtopicId)
      
      const answer = await askTutorQuestion(
        question,
        subtopic.explanation,
        plan.topic
      )
      
      setAnswers({ ...answers, [subtopicId]: answer })
      setQuestions({ ...questions, [subtopicId]: '' })
    } catch (error) {
      toast.error('Failed to get answer')
    } finally {
      setLoadingAnswer(null)
    }
  }

  const handleSpeak = async (text: string, subtopicId: string) => {
    if (speaking === subtopicId) {
      ttsService.stop()
      setSpeaking(null)
      return
    }

    setSpeaking(subtopicId)
    try {
      await ttsService.speak(text)
    } catch (error) {
      toast.error('Text-to-speech not available')
    } finally {
      setSpeaking(null)
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading your learning plan..." />
  }

  if (!plan) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">Learning Plan Not Found</h1>
        <Link to="/dashboard" className="btn-primary">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  const currentDayData = plan.plan_data.days[currentDay - 1]
  const totalDays = plan.plan_data.days.length

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Link
          to="/dashboard"
          className="flex items-center space-x-2 text-dark-400 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{plan.topic}</h1>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm sm:text-base text-dark-400">
              <span className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{plan.daily_time}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Target className="w-4 h-4" />
                <span>{plan.level}</span>
              </span>
              <span className="flex items-center space-x-1">
                <BookOpen className="w-4 h-4" />
                <span>{totalDays} days</span>
              </span>
            </div>
          </div>
          
          <div className="w-full lg:w-auto">
            <Link
              to={`/quiz/${planId}/${currentDay}`}
              className="btn-primary flex items-center justify-center space-x-2 w-full lg:w-auto"
            >
              <Play className="w-4 h-4" />
              <span>Take Quiz</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Day Navigation */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-3 sm:space-y-0">
          <h2 className="text-lg sm:text-xl font-semibold">Day {currentDay} of {totalDays}</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentDay(Math.max(1, currentDay - 1))}
              disabled={currentDay === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentDay(Math.min(totalDays, currentDay + 1))}
              disabled={currentDay === totalDays}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
            >
              Next
            </button>
          </div>
        </div>
        
        <div className="w-full bg-dark-700 rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentDay / totalDays) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Day Content */}
      {currentDayData && (
        <div className="space-y-6 sm:space-y-8">
          <div className="card">
            <h3 className="text-xl sm:text-2xl font-bold mb-4">{currentDayData.title}</h3>
            
            {currentDayData.objectives && (
              <div className="mb-6">
                <h4 className="font-semibold mb-3 text-sm sm:text-base">Today's Objectives:</h4>
                <ul className="space-y-2">
                  {currentDayData.objectives.map((objective: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Target className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                      <span className="text-dark-300 text-sm sm:text-base">{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Subtopics */}
          <div className="space-y-6">
            {currentDayData.subtopics.map((subtopic: any, index: number) => (
              <motion.div
                key={subtopic.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 space-y-3 sm:space-y-0">
                  <div className="flex items-start space-x-3 flex-1">
                    <button
                      onClick={() => handleToggleComplete(subtopic.id, !isSubtopicCompleted(subtopic.id))}
                      className="mt-1 flex-shrink-0"
                    >
                      {isSubtopicCompleted(subtopic.id) ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <Circle className="w-6 h-6 text-dark-400 hover:text-primary-500" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-lg sm:text-xl font-semibold mb-2">{subtopic.title}</h4>
                      <p className="text-dark-400 text-xs sm:text-sm mb-4">
                        Estimated time: {subtopic.estimatedTime}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleSpeak(subtopic.explanation, subtopic.id)}
                    className="btn-secondary flex items-center justify-center space-x-2 w-full sm:w-auto"
                    disabled={!ttsService.isSupported()}
                  >
                    <Volume2 className={`w-4 h-4 ${speaking === subtopic.id ? 'text-primary-500' : ''}`} />
                    <span>{speaking === subtopic.id ? 'Stop' : 'Listen'}</span>
                  </button>
                </div>

                {/* Enhanced explanation with better formatting */}
                <div className="mb-6 bg-dark-700/50 rounded-lg p-4 sm:p-6">
                  <div className="prose prose-invert max-w-none">
                    <div className="text-dark-200 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                      {subtopic.explanation}
                    </div>
                  </div>
                </div>

                {subtopic.keyPoints && (
                  <div className="mb-6">
                    <h5 className="font-semibold mb-3 text-primary-400 text-sm sm:text-base">Key Points:</h5>
                    <div className="grid gap-3">
                      {subtopic.keyPoints.map((point: string, pointIndex: number) => (
                        <div key={pointIndex} className="flex items-start space-x-3 p-3 bg-dark-700/30 rounded-lg">
                          <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                            {pointIndex + 1}
                          </span>
                          <span className="text-dark-200 leading-relaxed text-sm sm:text-base">{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ask Question */}
                <div className="border-t border-dark-700 pt-4 sm:pt-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <MessageCircle className="w-5 h-5 text-primary-500" />
                    <span className="font-medium text-primary-400 text-sm sm:text-base">Ask AI Tutor</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
                    <input
                      type="text"
                      value={questions[subtopic.id] || ''}
                      onChange={(e) => setQuestions({ ...questions, [subtopic.id]: e.target.value })}
                      placeholder="Ask a detailed question about this topic..."
                      className="input-field flex-1 text-sm sm:text-base"
                      onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion(subtopic.id)}
                    />
                    <button
                      onClick={() => handleAskQuestion(subtopic.id)}
                      disabled={!questions[subtopic.id]?.trim() || loadingAnswer === subtopic.id}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                      {loadingAnswer === subtopic.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {answers[subtopic.id] && (
                    <div className="bg-dark-700 rounded-lg p-4 sm:p-6 border border-primary-500/20">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse" />
                        <span className="font-medium text-primary-400 text-sm sm:text-base">AI Tutor Response:</span>
                      </div>
                      <MarkdownRenderer 
                        content={answers[subtopic.id]} 
                        className="text-dark-200 text-sm sm:text-base"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}