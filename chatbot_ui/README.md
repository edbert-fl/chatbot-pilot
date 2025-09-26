# Chatbot UI - Next.js Frontend

A modern Next.js frontend for the Chatbot Pilot application, replacing the original Flask-based UI.

## Features

- **Modern React Components**: Built with Next.js 15 and React 19
- **TypeScript Support**: Full type safety throughout the application
- **Tailwind CSS**: Modern styling with custom color scheme matching the original design
- **Component-Based Architecture**: Modular components for different UI elements
- **Flow Management**: Handles conversational flows and user selections
- **Real-time Chat**: Interactive chat interface with backend integration
- **Responsive Design**: Works on desktop and mobile devices

## Components

- **ChatMessage**: Renders individual chat messages with embedded components
- **ButtonGroup**: Interactive button groups for user selections
- **ContactForm**: Contact information collection form
- **SendMessage**: Pre-generated message review and sending
- **BookDemo**: Demo booking link component
- **StatusIndicator**: Backend connection status indicator

## API Routes

- `/api/chat` - Chat endpoint that proxies to the Python backend
- `/api/health` - Health check endpoint
- `/api/flows` - Flow configuration endpoint

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file with:
   ```
   RAG_API_BASE=http://127.0.0.1:8000
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Make sure the Python backend is running**:
   ```bash
   # In the main project directory
   source .venv/bin/activate
   python server.py
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   ├── globals.css    # Global styles
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Main page component
├── components/        # React components
└── types/            # TypeScript type definitions
```

## Key Features Implemented

- ✅ Chat interface with message history
- ✅ Flow-based conversation management
- ✅ Interactive button groups for selections
- ✅ Contact form with pre-filled messages
- ✅ Message generation and review
- ✅ Backend integration via API routes
- ✅ Responsive design with Tailwind CSS
- ✅ TypeScript for type safety

## Differences from Original Flask UI

- **Modern Framework**: Uses Next.js instead of Flask
- **Component Architecture**: React components instead of HTML templates
- **Type Safety**: TypeScript throughout
- **Better State Management**: React hooks for state
- **API Routes**: Next.js API routes instead of Flask routes
- **Modern Styling**: Tailwind CSS instead of custom CSS

## Backend Integration

The Next.js frontend connects to the existing Python backend via API routes that proxy requests to the Flask server running on port 8000. This maintains compatibility with the existing RAG system while providing a modern frontend experience.