# TaskFlow: AI-Powered Smart Task Management System

TaskFlow is a modern, high-performance task management application built with **Next.js 15**, **MongoDB**, and **OpenAI**. It goes beyond simple to-do lists by integrating a conversational AI assistant that can schedule tasks, generate long-term goal plans, and analyze user productivity patterns through behavioral metrics.

## Key Features

### 1. Intelligent Task Management
- **Full CRUD Operations**: Create, read, update, and delete tasks with ease.
- **Smart Filtering**: Automatic sorting of running, due, and completed tasks.
- **Real-time Synchronization**: Frontend state remains in sync with the MongoDB backend.

### 2. Conversational AI Assistant
- **Task Scheduling**: Use natural language to add tasks (e.g., "Schedule a meeting for tomorrow at 2 PM").
- **Goal Planning**: Generate multi-day, structured plans for complex goals using GPT-4o-mini.
- **Contextual Querying**: Ask questions about your schedule (e.g., "How many tasks did I finish today?").
- **Voice Commands**: Integrated **Whisper AI** for voice-to-task transcription.

### 3. Productivity Analytics
- **Behavioral Analysis**: AI analyzes your task history to generate performance metrics like "Focus," "Discipline," and "Planning Quality."
- **Visual Progress**: Real-time progress bars for both tasks and long-term goals.

### 4. Robust Security
- **JWT Authentication**: Secure login and registration system.
- **Unified Security Wrapper**: Every API route (except auth) is protected by a `withAuth` higher-order function.
- **Token-Based Auth**: Uses `Authorization: Bearer <token>` headers for all communication.

---

## 🛠 Tech Stack

- **Frontend**: React 19, Next.js 15 (App Router), Tailwind CSS 4.
- **Backend**: Next.js API Routes (Edge-ready logic).
- **Database**: MongoDB (via `mongodb` driver).
- **AI/ML**: OpenAI GPT-4o-mini, OpenAI Whisper (Transcriptions).
- **Authentication**: JsonWebToken (JWT), Bcrypt.js (Password hashing).

---

## 🔒 Security Model

The application implements a centralized security architecture:

- **Server-Side Validation**: Located in `src/lib/withAuth.ts`, this utility intercepts requests, validates the JWT, and extracts the user's identity.
- **Sanitized Payloads**: User identity (email) is never passed in request bodies; it is derived directly from the verified server-side token to prevent impersonation attacks.
- **Secure Storage**: Tokens are stored in `localStorage` and managed through a consistent `useContext`-like pattern in the main entry point.

---

## 📂 Folder Structure

```text
src/
├── app/
│   ├── api/             # Secure backend routes (tasks, goals, AI, stats)
│   ├── layout.tsx       # Main app shell and providers
│   └── page.tsx         # Dashboard landing page and auth gate
├── components/          # Reusable UI (AIChat, RunningTasks, Stats, etc.)
├── lib/                 # Core utilities (MongoDB client, Auth wrappers)
├── services/            # Frontend-to-Backend API abstraction layer
├── types/               # TypeScript interfaces and shared types
└── utils/               # AI prompts and formatting helpers
```

---

## ⚙️ Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd task-manager
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

---

## AI Integration Details

### Prompt Engineering
The system uses specialized system prompts (`src/utils/prompt.ts`) to ensure the AI acts as a "precise task auditor." It uses **Few-Shot Prompting** and **Chain-of-Thought** reasoning to correctly categorize user intents into:
- `task`: Adding or modifying individual items.
- `goal`: Creating complex, nested sub-task structures.
- `information`: Querying existing user data.
- `chat`: General productivity advice.

### Cost Efficiency
Every AI interaction includes server-side logging of token usage and estimated cost to ensure monitoring of API consumption.

---


