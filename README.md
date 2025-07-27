# React Component Generator

An AI-powered React Component Generator with user authentication and session management.

Specify what kind of React component you want to build and directly get the code and a live preview. Create multiple sessions, save your work, and iterate on components with AI assistance.

## Features

- 🤖 **AI-Powered Generation**: Uses OpenRouter API with Google Gemma model for component generation
- 🔐 **User Authentication**: Secure signup/login with JWT tokens
- 💾 **Session Management**: Save and manage multiple component generation sessions
- 🎨 **Live Preview**: Real-time component preview with Monaco editor
- 🎯 **Context-Aware**: AI understands existing code and can make targeted modifications
- 📱 **Responsive Design**: Built with TailwindCSS for modern styling
- 🗄️ **Database Persistence**: PostgreSQL with Prisma ORM for data storage

## Tech Stack

**Frontend:**
- Next.js 13 (App Router)
- TypeScript
- TailwindCSS
- Monaco Editor
- AI SDK for chat functionality

**Backend:**
- Express.js
- Prisma ORM
- PostgreSQL
- JWT Authentication
- bcrypt for password hashing

**AI Integration:**
- OpenRouter API
- Google Gemma 2 9B model

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenRouter API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd react-component-generator
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Set up environment variables**
   
   Copy `.env.local.example` to `.env.local` and fill in your values:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_API_BASE=http://localhost:4000
   ```
   
   Update `backend/.env` with your database configuration:
   ```env
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   DATABASE_URL="postgresql://username:password@localhost:5432/react_component_generator?schema=public"
   DATABASE_URL_DIRECT="postgresql://username:password@localhost:5432/react_component_generator?schema=public"
   PORT=4000
   ```

5. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

6. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

7. **Start the frontend development server**
   ```bash
   npm run dev
   ```

8. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## Usage

1. **Sign up or Login**: Create an account or login with existing credentials
2. **Create a Session**: Click "New Session" to start generating components
3. **Generate Components**: Type your component requirements in natural language
4. **Iterate and Refine**: Modify existing components by describing changes
5. **Save and Manage**: Your sessions are automatically saved and can be accessed later

## Example Prompts

- "Create a button component with a blue background and white text"
- "Make the button larger and add a hover effect"
- "Add a loading spinner to the button"
- "Create a card component with an image and description"
- "Make the card responsive with a grid layout"

## API Endpoints

### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user

### Sessions
- `GET /sessions` - List user sessions
- `POST /sessions` - Create new session
- `GET /sessions/:id` - Get specific session
- `PUT /sessions/:id` - Update session

### AI Chat
- `POST /api/chat` - Generate component code

## Contribute

We would love for you to contribute. Let's grow this project together and build something that enables engineers to achieve more.
