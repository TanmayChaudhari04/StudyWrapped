# StudyWrapped 🎓

> AI-powered flashcard generator with spaced repetition learning and Spotify-style "Study Wrapped" analytics

## Overview

StudyWrapped is an intelligent learning platform that transforms your study materials into mastery. Upload any PDF, and our multi-agent AI system automatically generates comprehensive flashcard decks tailored to your content. Study smarter with scientifically-proven spaced repetition algorithms that optimize your review schedule based on how well you know each card. Track your progress and celebrate your achievements with beautiful "Study Wrapped" analytics that showcase your learning journey in a Spotify-Wrapped style experience.

## ✨ Features

### 🤖 AI-Powered Flashcard Generation
- **PDF Upload**: Simply upload any study material in PDF format
- **Multi-Agent Architecture**: Powered by LangGraph with specialized AI agents:
  - **Reader Agent**: Extracts text content from PDFs
  - **Architect Agent**: Analyzes content and generates a structured syllabus
  - **Creator Agent**: Produces high-quality flashcards for each topic
  - **Saver Agent**: Persists your decks to Firebase
- **Llama 3.3 70B**: Leverages Groq's ultra-fast Llama model for intelligent card generation

### 📚 Smart Study Sessions
- **Spaced Repetition**: Implements the SM-2 algorithm used by Anki for optimal learning
- **Confidence-Based Rating**: Rate cards as "Forgot", "Struggled", "Got It", or "Too Easy"
- **Adaptive Scheduling**: Cards you know well are reviewed less often; struggle cards appear more frequently
- **Interactive Flip Cards**: Beautiful 3D flip animations with question/answer display
- **Built-in Help**: Toggle-able explanations for each rating option

### 📊 Study Wrapped Analytics
- **Session Tracking**: Automatically records every study session with detailed metrics
- **Personalized Stats**: 
  - Total cards studied
  - Study time & sessions completed
  - Current streak (consecutive days)
  - Best deck performance
  - Average accuracy percentage
  - Active study days
- **Beautiful Visualizations**: Spotify-style slide presentation of your achievements
- **Progress Dashboard**: Quick overview of your learning journey

### 🔐 Authentication & Storage
- **Firebase Authentication**: Secure login with email/password and Google Sign-In
- **Cloud Storage**: All decks and progress synced to Firebase Firestore
- **User Isolation**: Your data is private and associated with your account
- **Persistent Sessions**: Pick up right where you left off

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Hooks** - Modern state management

### Backend & AI
- **LangGraph** - Multi-agent orchestration framework
- **LangChain** - AI integration toolkit
- **Groq** - Ultra-fast LLM inference (Llama 3.3 70B)
- **Zod** - Schema validation for structured AI outputs

### Database & Auth
- **Firebase Authentication** - User management
- **Firebase Firestore** - NoSQL document database
- **Firebase Storage** - PDF file storage

### PDF Processing
- **pdf2json** - PDF parsing and text extraction

### Algorithms
- **SM-2 Spaced Repetition** - Scientifically-proven learning optimization

## 📖 Usage

1. **Sign Up/Login**: Create an account or sign in with Google
2. **Upload PDF**: Navigate to the dashboard and upload your study material
3. **AI Generation**: Wait for the AI agents to analyze and create your flashcards
4. **Study Session**: Click "Study Now" to begin learning with spaced repetition
5. **View Progress**: Click "View Your Wrapped" to see your personalized analytics

## Architecture

StudyWrapped follows a multi-agent architecture pattern:

```
PDF Upload → Reader Agent → Architect Agent → Creator Agent → Saver Agent → Firestore
                                                                      ↓
User Study Session → SM-2 Algorithm → Progress Tracking → Analytics Engine
```

## Acknowledgments

- Built with [LangGraph](https://github.com/langchain-ai/langgraph) for multi-agent orchestration
- Powered by [Groq](https://groq.com/) for lightning-fast AI inference
- Inspired by [Anki](https://apps.ankiweb.net/) for spaced repetition learning
- Analytics design inspired by Spotify Wrapped

---
