# FitCircle AI

FitCircle AI is a full-stack fitness tracking app for strength training, recovery, nutrition, and social accountability. It is built as a responsive React app with Supabase-backed auth and data storage.

The app focuses on day-to-day workout logging: users can follow a scheduled strength program, customize their weekly plan, save drafts while training, log recovery walks or rest days with one tap, and review workout history across devices.

## Features

- Dashboard with today's scheduled plan, body-weight tracking, nutrition summary, and weekly strength-training progress.
- Strength workout logger with set-by-set weight, reps, resistance type, optional RIR, previous performance, exercise notes, and exercise guides.
- Workout drafts that save locally and sync to Supabase for signed-in users.
- Finished workout history with reset confirmation for accidental logs.
- Recovery Walk and Rest Day templates that are tracked separately from strength-training weekly progress.
- Custom workout schedules with presets for 5-day, 4-day, and 3-day training splits.
- Add, edit, or skip exercises for a specific workout day.
- Nutrition tracking for calories, protein, carbs, fats, and fiber.
- Food search support through USDA when an API key is configured.
- Groups for shared accountability, invite codes, member management, workout feed, and auto-sharing.
- Settings for display name, current weight, RIR tracking, exercise guide visibility, and weekly schedule.
- AI Coach preview page for planned workout guidance, progress analysis, and personal Q&A.
- Responsive layout for desktop and mobile.

## Tech Stack

- React 19
- Vite 8
- React Router
- TanStack Query
- Supabase Auth and Database
- Recharts
- Framer Motion
- Lucide React icons
- Vercel serverless API route for USDA food search

## Getting Started

### Prerequisites

- Node.js
- npm
- Supabase project

### Install

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Optional for USDA-backed food search:

```bash
USDA_API_KEY=your_usda_api_key
```

### Database

The Supabase schema and migrations live in:

```bash
supabase/schema.sql
supabase/migrations/
```

The schema includes profiles, workout sessions, workout sets, workout drafts, nutrition tracking, groups, group memberships, and shared workout feed data.

### Run Locally

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## App Areas

### Dashboard

Shows the user's current day plan, nutrition status, current weight, and weekly progress. Weekly progress counts only scheduled strength-training sessions, so Recovery Walk and Rest Day logs do not inflate the strength target.

### Workout

Supports strength workouts, recovery walks, and rest days. Strength workouts use detailed set logging, while walk/rest days use a simplified one-tap completion flow. Finished days can be reset after confirmation.

### Nutrition

Tracks daily calories and macros, supports custom targets, manual entries, and food search.

### Groups

Lets users create or join groups, manage members and invite codes, view shared workouts, and auto-share completed workouts.

### Settings

Lets users manage profile details, workout logging preferences, exercise guide visibility, and the weekly workout schedule.

## Project Structure

```text
src/
  components/       Shared UI, workout, and group components
  context/          Auth context
  data/             Workout programs and exercise catalog data
  hooks/            React Query hooks
  pages/            Dashboard, Workout, Nutrition, Groups, Progress, Coach, Settings
  providers/        App-level providers
  services/         Supabase, workouts, nutrition, groups, profile, food search
  styles/           Global responsive styles
  utils/            Date and workout metric helpers

api/
  food-search.js    Vercel serverless API route for USDA food lookup

supabase/
  schema.sql
  migrations/
```

## Notes

FitCircle AI is currently a web app. Apple Watch support has been considered, but the near-term focus is keeping the mobile and desktop workout logging flow clean and reliable.
