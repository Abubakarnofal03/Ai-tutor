# NeuraLearn - AI-Powered Learning Platform

A modern, AI-powered learning platform that creates personalized learning plans, interactive quizzes, and provides AI tutoring support.

## Features

- 🧠 **AI-Powered Learning Plans**: Generate comprehensive, personalized learning plans using Groq AI
- 📚 **Interactive Content**: Rich markdown content with code highlighting and mathematical notation
- 🎯 **Adaptive Quizzes**: AI-generated quizzes with automatic grading
- 💬 **AI Tutor**: Ask questions and get detailed explanations from AI
- 🔊 **Text-to-Speech**: Listen to learning content with built-in TTS
- 📊 **Progress Tracking**: Monitor your learning journey with detailed analytics
- 📱 **Responsive Design**: Optimized for all devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **AI**: Groq API (Llama 3 70B)
- **Build Tool**: Vite
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Groq API key

### Environment Setup

1. Clone the repository
2. Copy `.env.example` to `.env`
3. Fill in your environment variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GROQ_API_KEY=your_groq_api_key
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key (optional)
```

### Installation

```bash
npm install
npm run dev
```

### Database Setup

The application uses Supabase with the following tables:
- `profiles` - User profiles
- `learning_plans` - AI-generated learning plans
- `daily_progress` - User progress tracking
- `quiz_results` - Quiz scores and answers

Run the migration file in your Supabase SQL editor to set up the database schema.

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Netlify

1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard

### Deploy to Vercel

1. Connect your repository to Vercel
2. Framework preset: Vite
3. Add environment variables in Vercel dashboard

## Configuration

### Supabase Setup

1. Create a new Supabase project
2. Run the database migration
3. Configure Row Level Security (RLS) policies
4. Disable email confirmation in Auth settings

### Groq API Setup

1. Sign up at [Groq Console](https://console.groq.com)
2. Create an API key
3. Add to environment variables

## Features Overview

### Learning Plans
- AI-generated comprehensive learning plans
- Customizable duration (7-365 days)
- Skill level adaptation (beginner, intermediate, advanced)
- Daily time commitment options

### Interactive Learning
- Rich markdown content rendering
- Code syntax highlighting
- Mathematical notation support
- Text-to-speech functionality

### Assessment System
- Multiple choice questions
- Theory questions with AI grading
- Instant feedback and explanations
- Progress tracking

### AI Tutor
- Context-aware question answering
- Detailed explanations with examples
- Markdown-formatted responses
- Real-time interaction

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support, please open an issue on GitHub or contact the development team.