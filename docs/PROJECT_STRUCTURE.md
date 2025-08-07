# LMQB Project Structure

This document describes the organization of the Lifestyle Medicine Question Bank (LMQB) project, designed for modular development by AI agents.

## Project Overview

LMQB is a web-based question bank application with the following architecture:
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Self-hosted Supabase (PostgreSQL + Auth + Real-time)
- **Deployment**: Docker containers on Proxmox

## Directory Structure

```
lmqb/
├── .claude/                    # Claude agent configurations (ignored by git)
│   └── agents/                 # Individual agent definitions
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/            # Basic UI components (shadcn/ui)
│   │   │   ├── layout/        # Layout components (Header, Sidebar)
│   │   │   ├── quiz/          # Quiz-specific components
│   │   │   ├── admin/         # Admin panel components
│   │   │   └── statistics/    # Statistics and analytics components
│   │   ├── pages/             # Route components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── stores/            # Zustand state management
│   │   ├── utils/             # Utility functions and configurations
│   │   └── types/             # TypeScript type definitions
│   ├── public/                # Static assets
│   └── [config files]         # Vite, TypeScript, Tailwind configs
├── backend/                   # Supabase backend configuration
│   ├── supabase/
│   │   ├── config/           # Supabase configuration files
│   │   ├── migrations/       # Database migrations
│   │   └── seed/            # Database seed data
│   ├── edge-functions/       # Supabase Edge Functions
│   └── docker/              # Docker compose for self-hosting
├── data/                     # Question bank data
│   └── questions/           # JSON question files by category/section
├── docs/                    # Project documentation
│   ├── API.md              # API documentation
│   ├── DEPLOYMENT.md       # Deployment instructions
│   └── DEVELOPMENT.md      # Development setup guide
├── scripts/                # Utility scripts
│   ├── import-questions.js # Question import script
│   └── backup.sh          # Database backup script
└── [root files]           # Package.json, README, etc.
```

## Component Organization

### Frontend Components

#### UI Components (`frontend/src/components/ui/`)
Basic reusable components following shadcn/ui patterns:
- Button, Input, Card, Dialog, etc.
- Consistent design system implementation

#### Layout Components (`frontend/src/components/layout/`)
- `Header.tsx`: Main navigation and user menu
- `Sidebar.tsx`: Navigation sidebar for main sections
- `Layout.tsx`: Overall application layout wrapper

#### Quiz Components (`frontend/src/components/quiz/`)
- `QuizModeSelector.tsx`: Choose between random/section/timed modes
- `QuestionCard.tsx`: Individual question display and answer selection
- `QuizTimer.tsx`: Timer component for timed quizzes
- `AnswerFeedback.tsx`: Instant feedback display with rationale
- `QuizResults.tsx`: End-of-quiz results and statistics

#### Admin Components (`frontend/src/components/admin/`)
- `QuestionEditor.tsx`: Individual question editing interface
- `BulkImporter.tsx`: JSON file upload and import functionality
- `UserManagement.tsx`: User role and access management
- `AdminDashboard.tsx`: Overall admin statistics and controls

#### Statistics Components (`frontend/src/components/statistics/`)
- `StatsOverview.tsx`: Personal performance summary
- `ProgressChart.tsx`: Visual progress tracking over time
- `CategoryBreakdown.tsx`: Performance analysis by category/section

### Backend Structure

#### Database (`backend/supabase/migrations/`)
- `001_initial_schema.sql`: Core table definitions
- `002_row_level_security.sql`: Security policies and permissions
- Additional migrations for schema updates

#### Edge Functions (`backend/edge-functions/`)
Custom serverless functions for business logic:
- Quiz session management
- Statistics calculations
- Bulk question imports
- Admin operations

## Data Flow

### Quiz Session Flow
1. User selects quiz mode and parameters
2. Frontend calls Edge Function to create session
3. Questions are fetched and quiz state is initialized
4. User answers are submitted and validated
5. Results are calculated and stored
6. Statistics are updated in real-time

### Authentication Flow
1. User submits credentials to Supabase Auth
2. JWT token is issued and stored
3. RLS policies enforce data access rules
4. User profile is automatically created/updated

## Development Guidelines

### AI Agent Responsibilities

Each agent should focus on specific areas:

- **RequirementsAnalyst**: Analyze user needs and create specifications
- **SystemArchitect**: Design system components and data flow
- **CodeGenerator**: Implement React components and Edge Functions
- **TestEngineer**: Create comprehensive test suites
- **SecurityAuditor**: Review security policies and authentication
- **DocumentationScribe**: Maintain API docs and user guides
- **DeploymentOrchestrator**: Manage Docker and deployment configs

### Coding Standards

- **TypeScript**: Strict mode enabled, comprehensive type coverage
- **React**: Functional components with hooks, proper error boundaries
- **Styling**: Tailwind CSS with consistent design tokens
- **State Management**: Zustand for client state, Supabase for server state
- **Testing**: Vitest for unit tests, 85% coverage requirement
- **Security**: RLS policies, input validation, secure API design

### File Naming Conventions

- Components: PascalCase (e.g., `QuestionCard.tsx`)
- Hooks: camelCase with 'use' prefix (e.g., `useAuth.ts`)
- Utils: camelCase (e.g., `apiHelpers.ts`)
- Types: PascalCase interfaces (e.g., `User`, `QuizSession`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS`)

## Integration Points

### Frontend ↔ Backend
- Supabase client for database operations
- Real-time subscriptions for live updates
- Edge Functions for complex business logic
- JWT tokens for authentication

### Data Preservation
- Original JSON structure maintained in `questions.original_json`
- Normalized data in separate tables for efficient querying
- Export functionality preserves exact original format

### Self-Hosting Integration
- Docker Compose for complete stack deployment
- Environment variable configuration
- Nginx reverse proxy for static file serving
- PostgreSQL data persistence with backup strategies

This structure enables independent development by multiple AI agents while maintaining system coherence and data integrity.