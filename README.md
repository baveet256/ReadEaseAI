# ReadEaseAI

> **AI-Powered Accessibility Platform for Inclusive Reading Experiences**

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Claude AI](https://img.shields.io/badge/Claude-Sonnet%204.5-orange)](https://www.anthropic.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

ReadEaseAI transforms PDF documents into personalized, accessible reading experiences tailored for individuals with diverse learning needs and disabilities. Powered by Claude AI and OpenAI, our platform adapts content in real-time to support dyslexia, visual impairments, autism, and ADHD.

---

## 📋 Table of Contents

- [Features](#-features)
- [Disability-Specific Modes](#-disability-specific-modes)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Architecture](#-architecture)
- [Contributing](#-contributing)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## ✨ Features

### Core Capabilities

- **🎯 Multi-Modal Accessibility**: Four specialized reading modes optimized for different disabilities
- **🤖 AI-Powered Transformation**: Claude Sonnet 4.5 intelligently adapts content structure and complexity
- **🔊 Text-to-Speech**: Natural voice narration powered by OpenAI TTS
- **📚 PDF Intelligence**: Advanced document parsing with context-aware extraction
- **🎨 Customizable Display**: Adaptive fonts, spacing, and visual layouts
- **♿ WCAG Compliant**: Designed with accessibility-first principles

### AI Features

- **Semantic Simplification**: Multi-level text complexity reduction
- **Conversational Q&A**: Interactive document exploration with memory
- **Structured Learning**: Auto-generated lessons with quizzes and visual aids
- **Content Chunking**: ADHD-optimized micro-lessons with engagement tracking
- **Voice Navigation**: Hands-free document interaction for blind users

---

## 🧩 Disability-Specific Modes

### 1. Dyslexia Support (`/dyslexia`)

**Optimized for reading comprehension challenges**

- ✅ **OpenDyslexic Font**: Specialized typeface with weighted bottoms
- ✅ **Adjustable Letter Spacing**: 0-5px customization via sidebar
- ✅ **Three Reading Levels**:
  - **Mild**: Simplified sentence structure (15-20 words)
  - **Moderate**: Middle-school vocabulary (≤15 words/sentence)
  - **Severe**: Elementary-level language (≤10 words/sentence)
- ✅ **Color Overlays**: Reduce visual stress
- ✅ **Text-to-Speech**: Synchronized audio reading

**AI Processing**: Claude analyzes text complexity and rewrites content while preserving meaning (api/levels)

---

### 2. Visual Impairment / Blindness (`/blindness`)

**Complete audio-first experience**

- ✅ **Conversational AI Assistant**: Ask questions about document content
- ✅ **Voice-Controlled Navigation**: Spacebar-activated speech recognition
- ✅ **PDF-to-Narration Conversion**: Describes text AND images
- ✅ **Keyboard-Only Controls**: Full accessibility without mouse
- ✅ **Conversation Memory**: Context-aware dialogue across questions

**Interaction Flow**:
1. Press & hold SPACEBAR → Ask question
2. Release SPACEBAR → Submit query
3. Claude analyzes document → Generates spoken answer
4. Press SPACEBAR during playback → Interrupt/new question

**AI Processing**:
- `/api/narrate` - Converts PDF to conversational narration
- `/api/conversation` - Handles Q&A with document context

---

### 3. Autism Spectrum Support (`/autism`)

**Structured, predictable learning environment**

- ✅ **Chunked Content**: Manageable sections with clear progression
- ✅ **Concrete Examples**: Abstract concepts explained literally
- ✅ **Visual Vocabulary Aids**: Term → Definition → Example tables
- ✅ **Interactive Assessments**:
  - True/False with explanations
  - Multiple choice (4 options)
  - Short answer with rubrics
- ✅ **"Draw-It" Visual Learning**: Diagram instructions with labels
- ✅ **Spaced Repetition**: Auto-generated review schedule
- ✅ **Age Personalization**: Content adapts to grade level

**AI Processing**: `/api/generate-lesson` returns strict JSON schema:
```json
{
  "summary": ["5-7 bullet points"],
  "vocabulary": [{"term": "...", "definition": "...", "example": "..."}],
  "questions": {
    "trueFalse": {...},
    "multipleChoice": {...},
    "shortAnswer": {...}
  },
  "drawIt": {"title": "...", "labels": [...], "caption": "..."},
  "reviewPlan": ["Tomorrow", "In 3 days"]
}
```

---

### 4. ADHD Support (`/adhd`)

**Engagement-optimized micro-learning**

- ✅ **Micro-Lessons**: 100-150 word chunks with emoji anchors
- ✅ **Focus Timer**: 25-minute Pomodoro sessions
- ✅ **Gamified Progress**: 🌱→🌿→🌳→🏆 milestone tracking
- ✅ **Active Highlighting**: Visual focus on current section
- ✅ **Break Reminders**: Prevents burnout
- ✅ **Interactive Checkpoints**: Quick questions after each chunk
- ✅ **6 Voice Options**: Personalize narration (alloy, echo, fable, onyx, nova, shimmer)

**Content Structure**:
```
📌 Quick Summary (3-5 bullets)
  ↓
🎯 Micro-Lesson 1 (100-150 words)
  ↓
✅ Checkpoint Question
  ↓
🎯 Micro-Lesson 2...
```

**AI Processing**: `/api/convert` transforms PDFs with ADHD-specific constraints (short sentences, emojis, whitespace optimization)

---

## 🛠 Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.2.4 | React framework with App Router |
| **React** | 19.0.0 | UI library |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 4.x | Utility-first styling |
| **Radix UI** | Latest | Accessible component primitives |
| **Lucide React** | 0.487.0 | Icon library |
| **react-markdown** | 10.1.0 | Markdown rendering |

### Backend / AI

| Technology | Version | Purpose |
|------------|---------|---------|
| **Claude AI** | Sonnet 4.5 | Document processing, Q&A, content transformation |
| **OpenAI** | 4.91.1 | Text-to-Speech (TTS-1, TTS-1-HD) |
| **pdf-parse** | 1.1.1 | PDF text extraction |
| **pdfjs-dist** | 5.1.91 | PDF rendering |
| **Web Speech API** | Native | Browser speech recognition (blindness mode) |

### Infrastructure

- **Vercel**: Deployment platform
- **Vercel Analytics**: Usage tracking
- **Environment Variables**: Secure API key management

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **pnpm** (recommended) or npm/yarn
- **Anthropic API Key** ([Get one here](https://console.anthropic.com/))
- **OpenAI API Key** ([Get one here](https://platform.openai.com/api-keys))

---

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ReadEaseAI.git
   cd ReadEaseAI
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your API keys:
   ```env
   ANTHROPIC_API_KEY=your_anthropic_key_here
   OPENAI_API_KEY=your_openai_key_here
   ```

4. **Run the development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
# Required
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx

# Optional
NODE_ENV=development
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

---

## 💻 Usage

### Basic Workflow

1. **Select Accessibility Mode**: Choose from Dyslexia, Blindness, Autism, or ADHD on the home page
2. **Upload PDF**: Drag & drop or select a PDF document
3. **AI Processing**: Document is analyzed and transformed (10-30 seconds)
4. **Customized Reading**: Interact with content optimized for your needs

### Mode-Specific Tips

#### Dyslexia Mode
- Use the sidebar to adjust letter spacing (find your sweet spot)
- Try different reading levels to match your comfort
- Enable TTS for audio reinforcement

#### Blindness Mode
- Press and HOLD spacebar to ask questions
- Navigate with Tab/Enter for keyboard-only control
- Ask: "Summarize page 3" or "What is the main argument?"

#### Autism Mode
- Progress through sections linearly for predictable structure
- Use the Draw-It section for visual reinforcement
- Review vocabulary before diving into content

#### ADHD Mode
- Set a realistic timer goal (start with 10 minutes)
- Complete checkpoints to maintain engagement
- Celebrate milestones (track your 🌱→🌿→🌳→🏆 journey)

---

## 🔌 API Documentation

### Core Endpoints

#### `POST /api/narrate`
**Convert PDF to audio narration**

```typescript
Request:
{
  file: Buffer,          // PDF file as buffer
  fileName: string       // Original filename
}

Response:
{
  narration: string,     // Conversational narration text
  success: boolean
}
```

**Model**: Claude Sonnet 4.5 (4000 tokens)

---

#### `POST /api/conversation`
**Q&A with document context**

```typescript
Request:
{
  question: string,
  documentContext: string,
  conversationHistory: Message[]
}

Response:
{
  answer: string,        // Audio-optimized response
  success: boolean
}
```

**Model**: Claude Sonnet 4.5 (1000 tokens)

---

#### `POST /api/generate-lesson`
**Generate autism-friendly structured lesson**

```typescript
Request:
{
  file: Buffer,
  age: number,
  sectionNumber: number
}

Response:
{
  summary: string[],
  vocabulary: Vocabulary[],
  questions: Questions,
  drawIt: DrawItSection,
  reviewPlan: string[]
}
```

**Model**: Claude Sonnet 4.5 (4000 tokens)

---

#### `POST /api/convert`
**Transform PDF for ADHD mode**

```typescript
Request:
{
  file: Buffer,
  mode: "adhd" | "dyslexic" | "deaf" | "autism"
}

Response:
{
  converted: string,     // Markdown content with "---" separators
  success: boolean
}
```

**Model**: Claude Sonnet 4.5 (4000 tokens)

---

#### `POST /api/parse`
**Extract and clean PDF text for dyslexia**

```typescript
Request:
{
  file: Buffer,
  useAI?: boolean        // Default: false
}

Response:
{
  text: string,          // Cleaned, dyslexia-friendly text
  success: boolean
}
```

**Model**: Claude Sonnet 4.5 (4096 tokens) - if useAI=true

---

#### `POST /api/levels`
**Adjust reading complexity level**

```typescript
Request:
{
  text: string,
  level: "mild" | "moderate" | "severe"
}

Response:
{
  summary: string,
  rephrased: string
}
```

**Model**: Claude Sonnet 4.5 (4096 tokens, temp: 0.3)

---

#### `POST /api/tts`
**Generate Text-to-Speech audio**

```typescript
Request:
{
  text: string,
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"
}

Response:
{
  audio: string          // Base64-encoded MP3
}
```

**Model**: OpenAI TTS-1

---

## 🏗 Architecture

### Project Structure

```
ReadEaseAI/
├── src/
│   ├── app/
│   │   ├── api/                    # API Routes
│   │   │   ├── ai-process/         # Reading level simplification
│   │   │   ├── conversation/       # Blindness Q&A
│   │   │   ├── convert/            # ADHD content transformation
│   │   │   ├── generate-lesson/    # Autism lesson generation
│   │   │   ├── narrate/            # PDF to narration
│   │   │   ├── parse/              # PDF parsing
│   │   │   ├── tts/                # Text-to-Speech
│   │   │   └── tts_adhd/           # ADHD-specific TTS
│   │   │
│   │   ├── adhd/                   # ADHD mode pages
│   │   ├── autism/                 # Autism mode pages
│   │   ├── blindness/              # Blindness mode pages
│   │   ├── dyslexia/               # Dyslexia mode pages
│   │   ├── processed/              # Dyslexia reader view
│   │   ├── reader/                 # ADHD chunked reader
│   │   ├── refined/                # Alternative dyslexia reader
│   │   │
│   │   ├── fonts/                  # Font files (OpenDyslexic)
│   │   ├── layout.tsx              # Root layout with global sidebar
│   │   ├── page.tsx                # Home page (mode selection)
│   │   └── globals.css             # Global styles
│   │
│   ├── components/
│   │   ├── ui/                     # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── FileUploader.tsx
│   │   │   ├── fontSelector.tsx
│   │   │   ├── input.tsx
│   │   │   ├── slider.tsx
│   │   │   └── ...
│   │   └── app-sidebar.tsx         # Global sidebar (font/spacing controls)
│   │
│   ├── hooks/
│   │   └── use-mobile.ts           # Mobile detection hook
│   │
│   └── lib/
│       └── utils.ts                # Utility functions
│
├── public/
│   └── fonts/                      # Public font assets
│
├── .env                            # Environment variables (gitignored)
├── .env.example                    # Environment template
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
├── next.config.ts                  # Next.js config
├── tailwind.config.ts              # Tailwind config
├── components.json                 # shadcn/ui config
└── README.md                       # This file
```

### Data Flow

```
User uploads PDF
       ↓
Next.js API Route
       ↓
PDF Parser (pdf-parse)
       ↓
Claude AI Processing
  ├─ Narration generation
  ├─ Text simplification
  ├─ Lesson structuring
  └─ Q&A answering
       ↓
OpenAI TTS (optional)
       ↓
Client-side rendering
  ├─ Custom fonts
  ├─ Accessibility controls
  └─ Interactive UI
```

---

## 🤝 Contributing

We welcome contributions from the community! Here's how to get started:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
   - Follow TypeScript best practices
   - Maintain accessibility standards
   - Test across all disability modes
4. **Commit with descriptive messages**
   ```bash
   git commit -m "feat(dyslexia): add color overlay customization"
   ```
5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Code Standards

- **TypeScript**: Strict mode enabled, no implicit `any`
- **Accessibility**: WCAG 2.1 Level AA compliance
- **Formatting**: Use Prettier (run `pnpm format`)
- **Linting**: Pass ESLint checks (`pnpm lint`)
- **Testing**: Include tests for new features

### Areas We Need Help

- 🌍 **Internationalization**: Support for non-English languages
- 📱 **Mobile Optimization**: Enhanced touch interfaces
- 🎨 **Design**: Improved visual accessibility
- 🧪 **Testing**: Unit/integration test coverage
- 📖 **Documentation**: Tutorials and user guides
- ♿ **Accessibility**: Additional disability modes (e.g., hearing impairment)

---

## 🗺 Roadmap

See [FUTURE_ROADMAP.md](FUTURE_ROADMAP.md) for detailed expansion plans including:

- **Multi-Agent Systems**: AI orchestration with LangGraph
- **RAG Integration**: Vector database for document intelligence
- **MCP Support**: Model Context Protocol for extensibility
- **Advanced Features**: Eye-tracking, spatial audio, haptic feedback
- **Personalization**: User profiles and adaptive learning

---

## 📊 Performance

- **PDF Processing**: 10-30 seconds (varies by document size)
- **Text-to-Speech**: Real-time streaming
- **API Response Times**:
  - Narration: ~15-20s (4000 tokens)
  - Q&A: ~3-5s (1000 tokens)
  - Lesson Generation: ~20-25s (4000 tokens)
- **Browser Support**: Chrome, Firefox, Safari (latest 2 versions)

---

## 🔒 Privacy & Security

- **No Data Storage**: PDFs are processed in-memory and discarded
- **API Key Security**: Keys stored in environment variables, never exposed to client
- **HTTPS Only**: All communication encrypted in transit
- **Client-Side Processing**: Where possible, processing happens in browser (Web Speech API)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Anthropic**: For Claude AI and accessibility research
- **OpenAI**: For TTS capabilities
- **Radix UI**: For accessible component primitives
- **Vercel**: For hosting and deployment infrastructure
- **OpenDyslexic**: For the dyslexia-friendly font

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/ReadEaseAI/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/ReadEaseAI/discussions)
- **Email**: support@readease.ai

---

## 🌟 Star History

If this project helps you or someone you know, please consider starring it on GitHub! ⭐

---

<div align="center">

**Built with ❤️ for accessibility and inclusion**

[Website](https://readease.ai) • [Documentation](https://docs.readease.ai) • [Demo](https://demo.readease.ai)

</div>
