import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Clock, Target, ArrowRight } from 'lucide-react'
import { generateLearningPlan } from '../lib/groq'
import { useLearning } from '../contexts/LearningContext'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    topic: '',
    days: 7,
    level: 'beginner',
    dailyTime: '30 minutes'
  })
  const [loading, setLoading] = useState(false)
  const { createLearningPlan } = useLearning()
  const navigate = useNavigate()

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async () => {
    if (!formData.topic.trim()) {
      toast.error('Please enter a topic to learn')
      return
    }

    setLoading(true)
    try {
      const planData = await generateLearningPlan(
        formData.topic,
        formData.days,
        formData.level,
        formData.dailyTime
      )
      
      const planId = await createLearningPlan(planData)
      navigate(`/plan/${planId}`)
    } catch (error) {
      toast.error('Failed to create learning plan. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    {
      title: 'What do you want to learn?',
      icon: BookOpen,
      content: (
        <div className="space-y-4">
          <input
            type="text"
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            className="input-field text-base sm:text-lg"
            placeholder="e.g., JavaScript, Machine Learning, Photography..."
          />
          <p className="text-dark-400 text-sm">
            Be specific! The more detailed your topic, the better your learning plan will be.
          </p>
        </div>
      )
    },
    {
      title: 'How many days do you want to complete it in?',
      icon: Clock,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                onClick={() => setFormData({ ...formData, days })}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-colors ${
                  formData.days === days
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-dark-600 hover:border-dark-500'
                }`}
              >
                <div className="text-xl sm:text-2xl font-bold">{days}</div>
                <div className="text-xs sm:text-sm text-dark-400">days</div>
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-2 justify-center">
            <span className="text-dark-400 text-sm sm:text-base">Custom:</span>
            <input
              type="number"
              min="1"
              max="365"
              value={formData.days}
              onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) || 7 })}
              className="input-field w-16 sm:w-20 text-center"
            />
            <span className="text-dark-400 text-sm sm:text-base">days</span>
          </div>
        </div>
      )
    },
    {
      title: 'What is your current level?',
      icon: Target,
      content: (
        <div className="space-y-3 sm:space-y-4">
          {[
            { value: 'beginner', label: 'Beginner', desc: 'New to this topic' },
            { value: 'intermediate', label: 'Intermediate', desc: 'Some experience' },
            { value: 'advanced', label: 'Advanced', desc: 'Looking to deepen knowledge' }
          ].map((level) => (
            <button
              key={level.value}
              onClick={() => setFormData({ ...formData, level: level.value })}
              className={`w-full p-3 sm:p-4 rounded-lg border-2 text-left transition-colors ${
                formData.level === level.value
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-dark-600 hover:border-dark-500'
              }`}
            >
              <div className="font-semibold text-sm sm:text-base">{level.label}</div>
              <div className="text-xs sm:text-sm text-dark-400">{level.desc}</div>
            </button>
          ))}
        </div>
      )
    },
    {
      title: 'How much time can you give daily?',
      icon: Clock,
      content: (
        <div className="space-y-3 sm:space-y-4">
          {[
            '15 minutes',
            '30 minutes',
            '1 hour',
            '2 hours'
          ].map((time) => (
            <button
              key={time}
              onClick={() => setFormData({ ...formData, dailyTime: time })}
              className={`w-full p-3 sm:p-4 rounded-lg border-2 text-left transition-colors ${
                formData.dailyTime === time
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-dark-600 hover:border-dark-500'
              }`}
            >
              <span className="text-sm sm:text-base">{time}</span>
            </button>
          ))}
        </div>
      )
    }
  ]

  const currentStep = steps[step - 1]

  return (
    <div className="min-h-screen flex items-center justify-center py-6 sm:py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        {/* Progress Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs sm:text-sm text-dark-400">Step {step} of {steps.length}</span>
            <span className="text-xs sm:text-sm text-dark-400">{Math.round((step / steps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-dark-700 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-4 sm:mb-6">
            <currentStep.icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-500 flex-shrink-0" />
            <h2 className="text-lg sm:text-2xl font-bold">{currentStep.title}</h2>
          </div>

          {currentStep.content}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-6 sm:mt-8 space-x-4">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
            >
              Back
            </button>

            {step < steps.length ? (
              <button
                onClick={handleNext}
                disabled={step === 1 && !formData.topic.trim()}
                className="btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <span>Create Plan</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Summary */}
        {step > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 sm:mt-6 p-3 sm:p-4 bg-dark-800 rounded-lg border border-dark-700"
          >
            <h3 className="font-semibold mb-2 text-sm sm:text-base">Your Learning Plan Summary:</h3>
            <div className="text-xs sm:text-sm text-dark-400 space-y-1">
              <div>📚 Topic: {formData.topic || 'Not specified'}</div>
              <div>📅 Duration: {formData.days} days</div>
              <div>🎯 Level: {formData.level}</div>
              <div>⏰ Daily Time: {formData.dailyTime}</div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}