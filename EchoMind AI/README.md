# EchoMind AI

A modern, feature-rich AI chat assistant built with React, TypeScript, and Supabase. EchoMind AI provides an intuitive interface for having intelligent conversations with an AI, complete with voice interactions, message management, and conversation history.

![EchoMind AI Screenshot](https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/bot.svg)

## Features

- 🤖 Intelligent AI conversations powered by OpenAI's GPT models
- 🎨 Beautiful, responsive UI with light/dark mode support
- 🗣️ Voice input and text-to-speech capabilities
- 📝 Message management (edit, pin, copy)
- 🔍 Conversation search and history
- ⌨️ Keyboard shortcuts for power users
- 🔒 Secure data storage with Supabase
- 📱 Mobile-friendly design
- 📂 Conversation categorization
- 🔄 Real-time updates
- 🎯 Vector similarity search for context-aware responses

## Tech Stack

- **Frontend:**
  - React 18 with TypeScript
  - Tailwind CSS for styling
  - Lucide Icons for beautiful UI elements
  - React Hotkeys Hook for keyboard shortcuts
  - Web Speech API for voice features

- **Backend & Database:**
  - Supabase for:
    - PostgreSQL database
    - Vector embeddings (pgvector)
    - Row Level Security (RLS)
    - Real-time subscriptions
  - OpenAI API for:
    - GPT-4 conversations
    - Text embeddings

- **Development:**
  - Vite for fast development and building
  - ESLint for code quality
  - PostCSS for CSS processing
  - TypeScript for type safety

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/echomind-ai.git
   cd echomind-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your API keys:
     ```env
     VITE_OPENAI_API_KEY=your_openai_api_key
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Keyboard Shortcuts

- `⌘/Ctrl + Enter` - Submit message
- `⌘/Ctrl + K` - Focus search
- `⌘/Ctrl + N` - New chat
- `Esc` - Clear input

## Features in Detail

### AI Chat
- Real-time conversations with OpenAI's GPT models
- Context-aware responses using vector similarity search
- Markdown support for code blocks and formatting
- LaTeX rendering for mathematical expressions

### Voice Interactions
- Speech-to-text input for hands-free usage
- Text-to-speech output with voice control
- Voice playback controls for messages
- Multiple voice options

### Message Management
- Pin important messages for quick access
- Edit your messages after sending
- Copy message content to clipboard
- Detailed timestamp display
- Message reactions and feedback

### History and Search
- Full-text search across conversations
- Conversation categorization and folders
- Bulk delete conversations
- Persistent storage with Supabase
- Vector-based similar message search

### UI/UX Features
- Responsive design for all devices
- Dark/light theme with system preference sync
- Smooth animations and transitions
- Loading states and error handling
- Real-time updates
- Accessibility features

## Database Schema

The application uses Supabase with the following main tables:

### conversations
- `id` (uuid, primary key)
- `created_at` (timestamp)
- `user_id` (uuid, references auth.users)
- `title` (text)
- `category_id` (uuid, references categories)

### messages
- `id` (uuid, primary key)
- `conversation_id` (uuid, references conversations)
- `content` (text)
- `role` (text) - 'user' or 'assistant'
- `embedding` (vector) - for semantic search
- `created_at` (timestamp)
- `is_pinned` (boolean)
- `reactions` (jsonb)

### categories
- `id` (uuid, primary key)
- `name` (text)
- `color` (text)
- `created_at` (timestamp)

## Security

- Row Level Security (RLS) policies for data protection
- Secure API key handling with environment variables
- Input sanitization and validation
- Rate limiting on API requests
- Secure WebSocket connections

## Performance

- Optimized vector similarity search
- Efficient message rendering
- Lazy loading for conversation history
- Debounced search inputs
- Memoized React components

## Contributing

1. Fork the repository
2. Create your feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes:
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. Push to the branch:
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use functional components and hooks
- Write clean, documented code
- Add tests for new features
- Follow the existing code style
- Update documentation as needed

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [OpenAI](https://openai.com/) for the GPT API
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Lucide](https://lucide.dev/) for the beautiful icons
- [Tailwind CSS](https://tailwindcss.com/) for the styling system
- [Vite](https://vitejs.dev/) for the build tooling

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.