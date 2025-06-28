import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle, XCircle, Clock, Award } from 'lucide-react'
import { useLearning } from '../contexts/LearningContext'
import { generateQuizQuestions, gradeTheoryAnswer, QuizQuestion } from '../lib/groq'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function Quiz() {
  const { planId, day } = useParams<{ planId: string; day: string }>()
  const navigate = useNavigate()
  const { getLearningPlan, saveQuizResult, getQuizResult } = useLearning()
  const [plan, setPlan] = useState<any>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<any[]>([])
  const [userAnswers, setUserAnswers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState(1800) // 30 minutes

  const dayNumber = parseInt(day!)

  useEffect(() => {
    if (planId && day) {
      loadQuizData()
    }
  }, [planId, day])

  useEffect(() => {
    if (questions.length > 0 && !completed) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmitQuiz()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [questions, completed])

  const loadQuizData = async () => {
    try {
      const planData = await getLearningPlan(planId!)
      setPlan(planData)

      // Check if quiz already completed
      const existingResult = await getQuizResult(planId!, dayNumber)
      if (existingResult) {
        setResults(existingResult)
        setCompleted(true)
        setLoading(false)
        return
      }

      // Generate new quiz questions
      const dayData = planData.plan_data.days[dayNumber - 1]
      const quizQuestions = await generateQuizQuestions(
        planData.topic,
        dayData,
        planData.level
      )
      
      setQuestions(quizQuestions)
      setUserAnswers(new Array(quizQuestions.length).fill(''))
    } catch (error) {
      toast.error('Failed to load quiz')
      navigate(`/plan/${planId}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (answer: string) => {
    const newAnswers = [...userAnswers]
    newAnswers[currentQuestion] = answer
    setUserAnswers(newAnswers)
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmitQuiz = async () => {
    setSubmitting(true)
    try {
      const gradedAnswers = []
      let totalScore = 0

      for (let i = 0; i < questions.length; i++) {
        const question = questions[i]
        const userAnswer = userAnswers[i]

        if (question.type === 'mcq') {
          const isCorrect = userAnswer === question.correctAnswer
          const score = isCorrect ? question.points : 0
          totalScore += score

          gradedAnswers.push({
            questionId: question.id,
            userAnswer,
            correctAnswer: question.correctAnswer,
            score,
            maxScore: question.points,
            feedback: isCorrect ? 'Correct!' : `Incorrect. The correct answer is ${question.correctAnswer}`,
          })
        } else {
          // Theory question - grade with AI
          const grading = await gradeTheoryAnswer(
            question.question,
            userAnswer,
            plan.plan_data.days[dayNumber - 1].title
          )
          
          const score = Math.round((grading.score / 10) * question.points)
          totalScore += score

          gradedAnswers.push({
            questionId: question.id,
            userAnswer,
            score,
            maxScore: question.points,
            feedback: grading.feedback,
            idealAnswer: grading.idealAnswer,
          })
        }
      }

      setAnswers(gradedAnswers)
      await saveQuizResult(planId!, dayNumber, questions, gradedAnswers, totalScore)
      
      setResults({
        score: totalScore,
        total_questions: questions.length,
        answers: gradedAnswers,
      })
      setCompleted(true)
    } catch (error) {
      toast.error('Failed to submit quiz')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return 'text-green-500'
    if (percentage >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  if (loading) {
    return <LoadingSpinner text="Loading quiz..." />
  }

  if (completed && results) {
    const totalPossible = questions.reduce((sum, q) => sum + q.points, 0)
    const percentage = Math.round((results.score / totalPossible) * 100)

    return (
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        <div className="card text-center mb-6 sm:mb-8">
          <Award className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Quiz Completed!</h1>
          <div className="text-4xl sm:text-6xl font-bold mb-4">
            <span className={getScoreColor(results.score, totalPossible)}>
              {results.score}/{totalPossible}
            </span>
          </div>
          <p className="text-lg sm:text-xl text-dark-400 mb-4 sm:mb-6">
            You scored {percentage}% on Day {dayNumber} quiz
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Link to={`/plan/${planId}`} className="btn-primary">
              Continue Learning
            </Link>
            <Link to="/dashboard" className="btn-secondary">
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="space-y-4 sm:space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold">Detailed Results</h2>
          {questions.map((question, index) => {
            const answer = results.answers[index]
            return (
              <div key={question.id} className="card">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 space-y-2 sm:space-y-0">
                  <h3 className="font-semibold text-sm sm:text-base">Question {index + 1}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`${getScoreColor(answer.score, answer.maxScore)} text-sm sm:text-base`}>
                      {answer.score}/{answer.maxScore} points
                    </span>
                    {answer.score === answer.maxScore ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>
                
                <p className="mb-4 text-sm sm:text-base">{question.question}</p>
                
                <div className="space-y-2 text-sm sm:text-base">
                  <div>
                    <span className="font-medium">Your Answer: </span>
                    <span className="break-words">{answer.userAnswer || 'No answer provided'}</span>
                  </div>
                  
                  {question.type === 'mcq' && (
                    <div>
                      <span className="font-medium">Correct Answer: </span>
                      <span className="text-green-400">{answer.correctAnswer}</span>
                    </div>
                  )}
                  
                  {answer.idealAnswer && (
                    <div>
                      <span className="font-medium">Ideal Answer: </span>
                      <p className="text-dark-300 mt-1">{answer.idealAnswer}</p>
                    </div>
                  )}
                  
                  <div className="bg-dark-700 rounded-lg p-3 mt-3">
                    <span className="font-medium">Feedback: </span>
                    <p className="text-dark-300">{answer.feedback}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">Quiz Not Available</h1>
        <Link to={`/plan/${planId}`} className="btn-primary">
          Back to Learning Plan
        </Link>
      </div>
    )
  }

  const currentQ = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 space-y-3 sm:space-y-0">
        <Link
          to={`/plan/${planId}`}
          className="flex items-center space-x-2 text-dark-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Plan</span>
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-primary-500" />
            <span className={`font-mono text-sm sm:text-base ${timeLeft < 300 ? 'text-red-500' : ''}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <span className="text-dark-400 text-sm sm:text-base">
            Question {currentQuestion + 1} of {questions.length}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6 sm:mb-8">
        <div className="w-full bg-dark-700 rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <motion.div
        key={currentQuestion}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="card mb-6 sm:mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
          <h2 className="text-lg sm:text-xl font-semibold">
            Question {currentQuestion + 1}
          </h2>
          <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm">
            {currentQ.points} points
          </span>
        </div>

        <p className="text-base sm:text-lg mb-6">{currentQ.question}</p>

        {currentQ.type === 'mcq' ? (
          <div className="space-y-3">
            {currentQ.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerChange(option.charAt(0))}
                className={`w-full text-left p-3 sm:p-4 rounded-lg border-2 transition-colors text-sm sm:text-base ${
                  userAnswers[currentQuestion] === option.charAt(0)
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-dark-600 hover:border-dark-500'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        ) : (
          <textarea
            value={userAnswers[currentQuestion] || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Type your answer here..."
            className="input-field h-24 sm:h-32 resize-none text-sm sm:text-base"
          />
        )}
      </motion.div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto order-2 sm:order-1"
        >
          Previous
        </button>

        <div className="flex flex-wrap justify-center gap-2 order-1 sm:order-2">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestion(index)}
              className={`w-8 h-8 rounded-full text-sm ${
                index === currentQuestion
                  ? 'bg-primary-500 text-white'
                  : userAnswers[index]
                  ? 'bg-green-500 text-white'
                  : 'bg-dark-600 text-dark-300'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {currentQuestion === questions.length - 1 ? (
          <button
            onClick={handleSubmitQuiz}
            disabled={submitting}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto order-3"
          >
            {submitting ? <LoadingSpinner size="sm" /> : 'Submit Quiz'}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="btn-primary w-full sm:w-auto order-3"
          >
            Next
          </button>
        )}
      </div>
    </div>
  )
}