# DocLoq - Document Management System

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Vite-7.2.4-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-4.1.18-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/Framer_Motion-12.23-FF0055?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion" />
</p>

A modern, secure document management system with blockchain verification, AI-powered assistance, and advanced security features including steganography watermarking and honey token tracking.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Running the Project](#-running-the-project)
- [Project Structure](#-project-structure)
- [Key Features Guide](#-key-features-guide)
- [Configuration](#-configuration)
- [Contributing](#-contributing)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

### 📁 Document Management
- **Folder Hierarchy** - Organize documents in nested folders
- **Drag & Drop Upload** - Easy file uploading with visual feedback
- **Document Preview** - View documents without downloading
- **Version History** - Track document changes over time
- **Trash & Recovery** - Soft delete with restore capability

### 🔐 Security Pipeline
- **SHA-256 Body Hash** - Cryptographic hash of document content
- **Head Hash Generation** - Hash of metadata (ID, user, timestamp)
- **Steganography Watermarking** - Invisible LSB watermarks for tracking
- **Honey Token Injection** - OSINT tracking for leak detection
- **Blockchain Verification** - Store hashes on Ethereum Sepolia network

### 🔍 Document Verification
- **Soft File Verification** - Verify using document hash
- **Hard File Verification** - QR code scanning or document upload
- **Fuzzy Hashing (SSDEEP)** - Match scanned/physical documents
- **Similarity Scoring** - Percentage match for altered documents

### 🤖 AI Assistant
- **Context-Aware Help** - AI chatbot on every page
- **Document Queries** - Ask questions about your documents
- **Smart Suggestions** - Proactive assistance

### 📊 Additional Features
- **Dashboard Analytics** - Visual insights and statistics
- **Task Management** - Calendar-integrated task tracking
- **Forms Builder** - Create and manage digital forms
- **Role Management** - Permission-based access control
- **OSINT Tracker** - Monitor honey token activations
- **Dark Mode** - Full dark/light theme support

---

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 19.2 |
| **Build Tool** | Vite 7.2 |
| **Styling** | Tailwind CSS 4.1 |
| **Animations** | Framer Motion 12.23 |
| **Routing** | React Router DOM 7.11 |
| **HTTP Client** | Axios 1.13 |
| **Drag & Drop** | @dnd-kit |
| **State Management** | Zustand (auth.store) |

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| **Node.js** | 18.x or higher | `node --version` |
| **npm** | 9.x or higher | `npm --version` |
| **Git** | Latest | `git --version` |

### Recommended IDE Setup
- **VS Code** with the following extensions:
  - ESLint
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native snippets
  - Prettier - Code formatter

---

## 🚀 Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/Rafeejooo/Docloq-Document-Management-System.git
cd docloq/document/frontend
```

Or if you received the project as a zip file:
```bash
unzip /Docloq-Document-Management-System.zip
cd docloq/document/frontend
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages listed in `package.json`.

### Step 3: Environment Configuration (Optional)

Create a `.env` file in the `frontend` directory if you need custom configuration:

```env
# API Configuration
VITE_API_URL=http://localhost:3000/api

# Blockchain Configuration
VITE_BLOCKCHAIN_NETWORK=sepolia
VITE_BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# Feature Flags
VITE_ENABLE_AI_ASSISTANT=true
VITE_ENABLE_BLOCKCHAIN=true
```

> **Note:** The application works with default mock data if no backend is configured.

---

## ▶️ Running the Project

### Development Mode

Start the development server with hot-reload:

```bash
npm run dev
```

The application will be available at:
```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/
```

### Production Build

Create an optimized production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

### Linting

Check for code quality issues:

```bash
npm run lint
```

---

## 📂 Project Structure

```
frontend/
├── public/                     # Static assets
├── src/
│   ├── App.jsx                 # Root component
│   ├── main.jsx                # Application entry point
│   │
│   ├── app/                    # Application core
│   │   ├── guards/             # Route protection
│   │   │   └── RequirePermission.jsx
│   │   ├── providers/          # Context providers
│   │   │   ├── AuthProvider.jsx
│   │   │   └── ThemeProvider.jsx
│   │   ├── routes/             # Route definitions
│   │   │   └── index.jsx
│   │   └── store/              # State management
│   │       └── auth.store.js
│   │
│   ├── components/             # Reusable components
│   │   ├── ai-assistant/       # AI chatbot
│   │   │   └── AIAssistant.jsx
│   │   ├── layout/             # Layout components
│   │   │   └── DashboardLayout.jsx
│   │   └── ui/                 # UI primitives
│   │       ├── Button.jsx
│   │       ├── Card.jsx
│   │       └── Input.jsx
│   │
│   ├── features/               # Feature modules
│   │   ├── auth/               # Authentication
│   │   │   ├── login.jsx
│   │   │   └── register.jsx
│   │   ├── chatbot/            # Chatbot feature
│   │   │   └── Chatbot.jsx
│   │   ├── dashboard/          # Main dashboard
│   │   │   └── Dashboard.jsx
│   │   ├── documents/          # Document management
│   │   │   ├── Documents.jsx   # Main documents page
│   │   │   ├── FolderHierarchy.jsx
│   │   │   ├── Trash.jsx
│   │   │   └── Verification.jsx
│   │   ├── forms/              # Forms builder
│   │   │   └── Forms.jsx
│   │   ├── osint-tracker/      # OSINT monitoring
│   │   │   └── OSINTTracker.jsx
│   │   ├── roles/              # Role management
│   │   │   └── RoleManagement.jsx
│   │   └── tasks/              # Task management
│   │       └── Tasks.jsx
│   │
│   ├── hooks/                  # Custom React hooks
│   ├── services/               # API services
│   ├── styles/                 # Global styles
│   │   └── main.css
│   └── utils/                  # Utility functions
│
├── index.html                  # HTML template
├── package.json                # Dependencies
├── tailwind.config.js          # Tailwind configuration
├── vite.config.js              # Vite configuration
├── postcss.config.js           # PostCSS configuration
└── eslint.config.js            # ESLint configuration
```

---

## 📖 Key Features Guide

### Document Upload Process

When uploading a document, the system performs:

1. **File Selection** - Choose files via drag-and-drop or file picker
2. **Content Extraction** - Parse document content
3. **Body Hash (SHA-256)** - Generate hash of document body
4. **Head Hash** - Generate hash of metadata (ID + User + Timestamp)
5. **Steganography Watermark** - Embed invisible tracking watermark using LSB
6. **Honey Token** - Inject tracking token for OSINT leak detection
7. **Blockchain Save** (Optional) - Store hash on Ethereum Sepolia

### Document Verification

Two verification methods are available:

#### Soft File (Hash Verification)
- Enter document's SHA-256 hash
- System checks if hash exists on blockchain
- Returns document info if verified

#### Hard File (Physical Document)
- **QR Scan** - Scan QR code embedded in document
- **Upload** - Upload scanned copy
- Uses SSDEEP fuzzy hashing for similarity matching
- Returns percentage match score

### Theme Configuration

The app supports dark/light mode. Theme preference is persisted in localStorage.

---

## ⚙️ Configuration

### Tailwind CSS

Custom theme colors are defined in `tailwind.config.js`:
- **Primary**: Indigo shades
- **Neutral**: Slate shades

### Vite Aliases

Path aliases are configured in `vite.config.js`:

```javascript
resolve: {
  alias: {
    '@': '/src'
  }
}
```

Use `@/` to import from the src directory:
```javascript
import Button from '@/components/ui/Button';
```

---

## 🤝 Contributing

### Getting Started

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Commit with descriptive messages**
   ```bash
   git commit -m "feat: add new verification method"
   ```
5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Open a Pull Request**

### Commit Convention

We follow conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

### Code Style

- Use functional components with hooks
- Follow the existing file structure
- Use Tailwind CSS for styling
- Add Framer Motion animations for interactive elements
- Maintain dark mode compatibility

---

## 🔧 Troubleshooting

### Common Issues

#### Node modules not found
```bash
rm -rf node_modules package-lock.json
npm install
```

#### Port already in use
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
# Or use a different port
npm run dev -- --port 3000
```

#### Tailwind styles not applying
```bash
# Rebuild Tailwind
npm run build
npm run dev
```

#### ESLint errors
```bash
# Auto-fix linting issues
npm run lint -- --fix
```

### Getting Help

If you encounter issues:
1. Check the browser console for errors
2. Ensure all dependencies are installed correctly
3. Verify Node.js version compatibility
4. Check the GitHub Issues for known problems

---

## 📄 License

This project is part of a capstone project. All rights reserved.

---

## 👥 Team

- **Project Lead**: [Your Name]
- **Contributors**: [Collaborator Names]

---

<p align="center">
  Made with ❤️ using React + Vite + Tailwind CSS
</p>
