# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Vite
- `npm run build` - Build production bundle
- `npm run lint` - Run ESLint on the codebase
- `npm run preview` - Preview the production build locally

## Version Management

The project uses automatic semantic versioning with Husky hooks:

- **Automatic**: Version is auto-bumped on push to main branch based on commit messages
  - `feat:` commits → minor version bump
  - `fix:`, `chore:`, etc. → patch version bump  
  - `BREAKING CHANGE` or `!` in commit → major version bump
- **Manual**: Use these commands for manual version control:
  - `npm run version:patch` - Bump patch version (1.0.0 → 1.0.1)
  - `npm run version:minor` - Bump minor version (1.0.0 → 1.1.0)
  - `npm run version:major` - Bump major version (1.0.0 → 2.0.0)
  - `npm run version:show` - Show current version

**Commit Convention**: Use conventional commits for automatic version detection:
- `feat: add new feature` - triggers minor bump
- `fix: resolve bug` - triggers patch bump
- `feat!: breaking change` - triggers major bump

## Architecture Overview

This is a React task management PWA ("Fantastic Task") built with Vite. The app features:

**Core Architecture:**
- Single-page React application using functional components and hooks
- Supabase backend with PostgreSQL database and authentication
- Row Level Security (RLS) policies for data protection
- Component-based architecture with reusable modal system
- PWA configuration with service worker and manifest

**Key Components:**
- `App.jsx` - Main application component managing state and routing between views
- `AuthModal.jsx` - Authentication modal with login/signup/family creation
- `TaskList.jsx` - Core task management with filtering by date
- `ProfileSelector.jsx` - Family member selector for switching profiles
- `FamilyInvitation.jsx` - Family invitation code management (admin only)
- `StatsBarChart.jsx` - Data visualization using Recharts
- `AllTasksEditor.jsx` - Bulk task management interface
- `Modal.jsx` - Reusable modal wrapper component

**Authentication & Hooks:**
- `useAuth.js` - Authentication context with signUp, signIn, signOut, resetPassword
- `useFamily.js` - Family management context with invitation system
- `useTasks.js` - Task management operations

**Database Schema:**
See `database/schema.sql` and `database/rls-policies.sql` for complete schema.

**Key Tables:**
- `families` - Family groups with admin roles
- `family_members` - Users within families with nicknames, avatar colors, points
- `tasks` - Family tasks with support for once-only, daily, weekly flexible, and monthly flexible recurring patterns
- `task_assignments` - Daily task assignments to specific members
- `task_completions` - Completed tasks with time spent and comments
- `points_transactions` - Point earning/spending history
- `family_invitation_codes` - Invitation codes for joining families

**Authentication:**
- Uses Supabase Auth with email/password
- Family invitation system with generated codes
- Row Level Security ensures users only see their family's data

**Key Features:**
- Family-based task management with multiple members
- User authentication and family invitation system
- Day-based task filtering and navigation
- Task completion tracking with comments and time spent
- Points-based gamification system
- Statistics visualization
- Role-based permissions (admin/member/child)
- PWA capabilities for offline use

**Styling:**
- Inline styles throughout (no external CSS frameworks)
- Blue theme (#82bcf4) with circular buttons
- Mobile-first responsive design
- React Icons for consistent iconography

**Setup Requirements:**
- Create a Supabase project and configure environment variables in `.env.local`
- Run the SQL scripts in `database/` to set up the schema and RLS policies
- Configure Supabase Auth settings for your domain

The app uses Norwegian language strings and is designed as a family productivity tool with gamification elements.