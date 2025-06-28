import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
})

export interface LearningPlan {
  topic: string
  totalDays: number
  level: string
  dailyTime: string
  days: DayPlan[]
}

export interface DayPlan {
  day: number
  title: string
  subtopics: Subtopic[]
  objectives: string[]
}

export interface Subtopic {
  id: string
  title: string
  explanation: string
  keyPoints: string[]
  estimatedTime: string
}

export interface QuizQuestion {
  id: string
  type: 'mcq' | 'theory'
  question: string
  options?: string[]
  correctAnswer?: string
  points: number
}

export async function generateLearningPlan(
  topic: string,
  days: number,
  level: string,
  dailyTime: string
): Promise<LearningPlan> {
  const prompt = `Create a comprehensive ${days}-day learning plan for "${topic}" at ${level} level with ${dailyTime} daily study time.

CRITICAL REQUIREMENTS FOR EXPLANATIONS:
- Each subtopic explanation must be 700-800 words minimum
- Write detailed, comprehensive explanations that cover:
  * Theoretical foundations and core concepts
  * Practical applications and real-world examples
  * Step-by-step processes where applicable
  * Industry best practices and standards
  * Common challenges and how to overcome them
  * Connections to related concepts and broader field knowledge
- Use professional, educational language appropriate for the specified level
- Include specific examples, case studies, or scenarios
- Explain both the "what" and "why" behind each concept
- Make content progressively more complex across days

Return a JSON object with this exact structure:
{
  "topic": "${topic}",
  "totalDays": ${days},
  "level": "${level}",
  "dailyTime": "${dailyTime}",
  "days": [
    {
      "day": 1,
      "title": "Day title",
      "subtopics": [
        {
          "id": "unique-id",
          "title": "Subtopic title",
          "explanation": "Write 700-800 words covering theoretical foundations, practical applications, real-world examples, step-by-step processes, industry standards, common challenges, and connections to broader concepts. Include specific examples and detailed explanations of core principles.",
          "keyPoints": ["detailed technical point 1", "detailed technical point 2", "detailed technical point 3", "detailed technical point 4", "detailed technical point 5"],
          "estimatedTime": "30 minutes"
        }
      ],
      "objectives": ["specific measurable objective 1", "specific measurable objective 2"]
    }
  ]
}

CONTENT QUALITY STANDARDS:
- Explanations should be comprehensive and detailed (700-800 words each)
- Include technical depth appropriate for the specified level
- Provide context and background for each concept
- Connect concepts to broader field knowledge and industry practices
- Make content progressively more complex across days
- Ensure each day builds logically on previous knowledge
- Include practical examples, case studies, and real-world applications
- Explain implementation details and best practices

Make sure:
- Each day has 2-3 subtopics based on daily time available (fewer subtopics = more detailed content)
- Content progresses logically from fundamentals to advanced topics
- Include comprehensive practical examples and real-world applications
- Tailor complexity and depth to the specified level
- Each explanation is substantial and educational (700-800 words minimum)`

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational content creator and industry professional with deep expertise in technical subjects. Create comprehensive, detailed learning content that meets professional and academic standards. Write detailed explanations of 700-800 words for each subtopic. Always return valid JSON without any markdown formatting or additional text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama3-70b-8192', // Using the larger model for better content generation
      temperature: 0.7,
      max_tokens: 8192, // Fixed: Changed from 16000 to 8192 to comply with API limit
      response_format: { type: "json_object" }
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('No content received from Groq')

    return JSON.parse(content)
  } catch (error) {
    console.error('Error generating learning plan:', error)
    throw new Error('Failed to generate learning plan')
  }
}

export async function generateQuizQuestions(
  topic: string,
  dayContent: DayPlan,
  level: string
): Promise<QuizQuestion[]> {
  const prompt = `Generate 5 quiz questions for Day ${dayContent.day} of learning "${topic}" at ${level} level.

Day content:
Title: ${dayContent.title}
Subtopics: ${dayContent.subtopics.map(s => s.title).join(', ')}

Return a JSON object with a "questions" array containing this exact structure:
{
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "question": "Question text",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correctAnswer": "A",
      "points": 2
    },
    {
      "id": "q2",
      "type": "theory",
      "question": "Theory question requiring explanation",
      "points": 4
    }
  ]
}

Requirements:
- 3 MCQ questions (2 points each)
- 2 theory questions (4 points each)
- Questions should test understanding, not just memorization
- MCQ options should be plausible but clearly distinguishable
- Theory questions should require 2-3 sentence explanations`

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert quiz creator. Always return valid JSON without any markdown formatting or additional text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama3-70b-8192',
      temperature: 0.6,
      max_tokens: 3000,
      response_format: { type: "json_object" }
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('No content received from Groq')

    const parsed = JSON.parse(content)
    return parsed.questions || []
  } catch (error) {
    console.error('Error generating quiz questions:', error)
    throw new Error('Failed to generate quiz questions')
  }
}

export async function gradeTheoryAnswer(
  question: string,
  userAnswer: string,
  context: string
): Promise<{ score: number; feedback: string; idealAnswer: string }> {
  const prompt = `Grade this theory answer and provide feedback.

Question: ${question}
Context: ${context}
Student Answer: ${userAnswer}

Evaluate the answer and return a JSON object with this structure:
{
  "score": 7,
  "feedback": "Detailed feedback explaining what was good and what could be improved",
  "idealAnswer": "A comprehensive ideal answer"
}

Scoring criteria (out of 10):
- Accuracy and correctness (40%)
- Completeness and depth (30%)
- Clarity and organization (20%)
- Use of relevant examples (10%)

Be constructive and encouraging in feedback.`

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert educator providing fair and constructive assessment. Always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama3-70b-8192',
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('No content received from Groq')

    try {
      return JSON.parse(content)
    } catch (parseError) {
      console.error('Failed to parse Groq response as JSON:', content)
      // Return a fallback response if JSON parsing fails
      return {
        score: 5,
        feedback: 'Unable to process your answer at this time. Please try again.',
        idealAnswer: 'Answer evaluation temporarily unavailable.'
      }
    }
  } catch (error) {
    console.error('Error grading theory answer:', error)
    throw new Error('Failed to grade answer')
  }
}

export async function askTutorQuestion(
  question: string,
  context: string,
  topic: string
): Promise<string> {
  const prompt = `You are an AI tutor helping a student learn "${topic}". 

Current lesson context: ${context}

Student question: ${question}

FORMATTING REQUIREMENTS:
- Use proper markdown formatting for your response
- Use code blocks (\`\`\`) for any code examples
- Use inline code (\`) for technical terms, functions, or short code snippets
- Use mathematical notation with LaTeX-style formatting when needed (e.g., $x^2 + y^2 = z^2$)
- Use bullet points and numbered lists for clarity
- Use headers (##, ###) to organize complex explanations
- Use **bold** for important concepts and *italics* for emphasis
- Use blockquotes (>) for important notes or warnings
- Include practical examples in properly formatted code blocks
- Structure your response with clear sections when explaining complex topics

CONTENT REQUIREMENTS:
- Provide comprehensive, detailed explanations (aim for 400-600 words)
- Include step-by-step breakdowns when applicable
- Give practical examples and real-world applications
- Explain both the "what" and "why" behind concepts
- Connect the answer to broader concepts in the field
- Include best practices and common pitfalls
- Suggest further learning resources when relevant
- Use industry-standard terminology and practices

Provide a helpful, clear, and encouraging response that follows professional educational standards.`

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a patient, knowledgeable AI tutor with expertise in technical subjects. Provide clear, well-formatted explanations using proper markdown formatting. Always structure your responses professionally with appropriate formatting for code, mathematics, and technical content. Write comprehensive responses of 400-600 words.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama3-70b-8192',
      temperature: 0.7,
      max_tokens: 2500 // Increased for more detailed responses
    })

    return completion.choices[0]?.message?.content || 'Sorry, I could not process your question.'
  } catch (error) {
    console.error('Error asking tutor question:', error)
    throw new Error('Failed to get tutor response')
  }
}