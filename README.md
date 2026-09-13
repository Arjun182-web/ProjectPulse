# ProjectPulse — Project Intelligence

> AI-powered project communication intelligence for architecture, design and construction projects.

ProjectPulse turns project communication into structured, actionable project intelligence.

Instead of leaving important decisions, responsibilities, deadlines and dependencies buried inside conversations, ProjectPulse extracts them automatically and presents them in a project-management friendly interface.

---

## Problem

Architecture, design and construction projects generate large amounts of communication across meetings, messages and discussions.

Important information can easily get buried:

- What was decided?
- Who is responsible?
- What needs to happen next?
- When is it due?
- What work is currently blocked?
- Which stakeholders are affected?
- What project risks are emerging?

ProjectPulse addresses this communication-to-coordination gap.

---

## Solution

ProjectPulse analyzes project communication using AI and converts unstructured messages into structured project intelligence.

A communication can be transformed into:

- Project summary
- Decisions
- Actions
- Responsible people
- Deadlines
- Stakeholders and roles
- Dependencies
- Risks and alerts

The extracted information is persisted as Project Memory, allowing the project team to ask questions about previously captured communication.

---

## Key Features

### 1. AI Communication Analysis

Paste a project communication and ProjectPulse extracts structured information using Gemini.

It identifies:

- Summary
- Decisions
- Actions
- Responsibilities
- Deadlines
- Stakeholders
- Dependencies
- Risks and alerts

### 2. Action Tracking

Actions are displayed with:

- Task
- Responsible person
- Deadline
- Priority
- Status

This makes responsibilities visible instead of leaving them buried inside conversations.

### 3. Coordination Intelligence

ProjectPulse identifies dependencies between tasks and highlights downstream work that is blocked.

For example:

`Revised drawing → Fabrication`

If fabrication depends on an approved revised drawing, ProjectPulse surfaces the dependency and explains why the work is blocked.

### 4. Stakeholder Intelligence

ProjectPulse extracts people and their project roles from communication.

This helps identify who is involved in decisions and who is responsible for project actions.

### 5. Project Memory

Analyzed communications are persisted as project memory.

The system maintains a history of:

- Previous summaries
- Decisions
- Actions
- Stakeholders
- Deadlines
- Dependencies
- Alerts

### 6. Ask ProjectPulse

Users can ask natural-language questions about the stored project memory.

Examples:

- "What work is currently blocked?"
- "Who is responsible for the revised bedroom drawing?"
- "What decisions were made?"
- "What are the current project risks?"

### 7. Voice Interaction

ProjectPulse supports voice-based interaction using browser speech recognition.

Users can ask questions such as:

> "What work is currently blocked?"

The system converts speech into text and uses the project intelligence to respond.

---

## Hackathon Alignment

ProjectPulse addresses three ArchScale Guild Intern Technology Hackathon tracks.

### AS-01 — Coordination

**Stakeholder & Role Management**

- Extracts stakeholders and their roles.

**Project Activity & Change Tracking**

- Stores analyzed project communications as Project Memory.

**Impact Identification**

- Identifies dependencies, blocked work and coordination risks.

### AS-02 — Communication

**Conversation Capture**

- Accepts project communication as input.

**Intelligent Summarization**

- Generates concise project summaries.

**Action Extraction**

- Extracts decisions, tasks, responsibilities and deadlines.

### AS-03 — Voice

**Speech-to-Text**

- Converts spoken questions into text using browser speech recognition.

**Speech-to-Command / Intent Understanding**

- Interprets spoken project questions and retrieves relevant project intelligence.

---

## Architecture

```text
                    ┌─────────────────────┐
                    │     User Input      │
                    │ Communication /     │
                    │ Voice Question      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React Frontend    │
                    │                     │
                    │ Overview            │
                    │ Communication       │
                    │ Actions             │
                    │ Stakeholders        │
                    │ Coordination        │
                    │ Project Memory      │
                    │ Ask ProjectPulse    │
                    └──────────┬──────────┘
                               │
                         REST API
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Express Backend   │
                    │                     │
                    │ /api/analyze        │
                    │ /api/analyze/memory │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     Gemini AI       │
                    │                     │
                    │ Summarization       │
                    │ Decision Extraction │
                    │ Action Extraction   │
                    │ Dependency Analysis│
                    │ Risk Detection      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Project Memory    │
                    │ projectMemory.json  │
                    └─────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend

- React — User interface
- Vite — Frontend development and build tooling
- Tailwind CSS — UI styling
- Lucide React — Interface icons
- Web Speech API — Browser-based voice interaction

### Backend

- Node.js — Runtime environment
- Express.js — REST API server
- CORS — Cross-origin communication
- dotenv — Environment variable management

### AI

- Google Gemini API — Project communication analysis
- Structured JSON responses
- Schema-constrained AI output
- Retry handling
- Model fallback handling

### Storage

- JSON-based Project Memory
- Local persistent storage using `projectMemory.json`

---

## 📋 Prerequisites

Before running ProjectPulse locally, make sure you have:

- Node.js 18 or later
- npm
- A Google Gemini API key
- Git
- A modern web browser with Web Speech API support for voice interaction

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Arjun182-web/ProjectPulse.git
```

Move into the project directory:

```bash
cd ProjectPulse
```

### 2. Install Frontend Dependencies

Open a terminal and run:

```bash
cd client
npm install
```

### 3. Install Backend Dependencies

Open another terminal and run:

```bash
cd server
npm install
```

### 4. Configure the Gemini API

Inside the server folder, create:

```text
.env
```

Add:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
```

A safe configuration template is already provided:

```text
server/.env.example
```

**Important**

Never commit the real `.env` file to GitHub.

The `.env` file is excluded through `.gitignore`.

### 5. Start the Backend

From the server directory:

```bash
npm run dev
```

The backend will normally run on:

```text
http://localhost:5000
```

### 6. Start the Frontend

From the client directory:

```bash
npm run dev
```

The frontend will normally run on:

```text
http://localhost:5173
```

Open the frontend URL in your browser.