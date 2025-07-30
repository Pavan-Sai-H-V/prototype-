# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Tech Stack
- **Mobile:** React Native (v0.74+)
- **Backend:** Node.js (v18+), Express
- **Database:** MongoDB (with Mongoose ODM)
- **Notifications:** Firebase Cloud Messaging (FCM)
- **Auth:** [Add selected method, e.g., JWT or OAuth2]
- **Testing:** Jest (API and components)

# Project Structure
- `backend/`
  - `models/`: MongoDB schemas (prescriptions, reminders)
  - `routes/`: Express API endpoints
  - `jobs/`: Background scheduled jobs
  - `utils/`: Notification and date helpers
- `mobile/`
  - `screens/MedRemindersScreen.js`: Today's reminders, mark taken/missed
  - `components/MedicineReminderCard.js`: Reusable UI for a medicine reminder
  - `services/api.js`: Handles mobile API calls
  - `services/notifications.js`: FCM integration

# Core Commands
- **Backend Start:** `npm run dev` (in `backend/`)
- **Run Jobs:** Auto-start with backend, see `jobs/scheduler.js`
- **Mobile Start:** `npx react-native start` & `npx react-native run-ios` OR `run-android`
- **MongoDB Local:** `npm run mongo` (add to scripts if needed)
- **Testing:** `npm run test` (backend), `npm test` (mobile)

# Coding Conventions
- **APIs:**
  - All endpoints RESTful, return JSON
  - Adhere to OpenAPI spec for parameter and error definitions
- **Models:**
  - Use Mongoose Schema for type safety and middleware
- **Notifications:**
  - Use FCM (Firebase) for push; dev credentials in `.env`
  - Send at scheduled reminder time (see Jobs)
- **Components:**
  - Prefer functional/React Hooks
  - No class components
- **General:**
  - Prettier+ESLint on commit (`npx prettier --write`, `npm run lint`)

# Workflow
- **Prescription:** When doctor creates a prescription, backend schedules reminders using background job.
- **Reminder Trigger:** Cron job (every minute) checks for due reminders, sends push via FCM.
- **User Acknowledgement:** Patients can mark each medicine as _taken_ or _missed_ in app, status updates backend.
- **Testing:** Use test seeds for time-based reminders in development.

# Do Not Section
- Do not commit .env or secrets.
- Do not use setTimeout for reminders (use job scheduler).
- Do not edit `node_modules/`; use PRs for any package changes.
- Do not bypass API for reminder status; always use endpoints.

# Testing Instructions
- Backend: `npm run test` (for API and logic)
- Mobile: `npm test`
- Use time mocks for reminders (see `jobs/scheduler.test.js`)
- Ensure at least one push is triggered in test mode

# Environment Setup
- Node.js v18+, npm v9+
- MongoDB running locally (default port 27017)
- Firebase project/credentials for push notifications
- Install deps:
  - `cd backend && npm ci`
  - `cd mobile && npm ci`

# Repository Etiquette
- **Branch names:** `feature/prescription-schema`, `fix/reminder-job`
- **Always open PRs for new features**
- **Link items to tracked issues**
- **Document major API changes in README and CLAUDE.md**

# Unexpected Behaviors & Warnings
- Mongo/Mongoose may trigger time zone issues—store UTC times, convert in client.
- Local FCM may not trigger if device emulation is misconfigured; see mobile debug logs.
- Reminder scheduler does not backfill missed notifications if backend is offline.

# Example Prompts for Claude (Few-Shots)
- “Generate a Mongoose schema for a prescription with medicine name, dose, schedule, and patient reference.”
- “Add an Express route to fetch today’s reminders for a patient, sorted by time.”
- “Write a cron job that scans for reminders due in the next minute and triggers FCM push.”
- “Produce a React Native component that lists current reminders and lets user mark each as taken/missed, syncing with API.”
- “Show how to configure FCM for both iOS and Android in React Native, ensuring notifications show when app is in foreground and background.”

**Best Practices:**
- Add concrete sample requests/responses for every API endpoint in `docs/`
- Keep this CLAUDE.md in sync with actual project structure and adapt as team workflows evolve
- Review notification handling after real-device testing and update instructions as needed
- Use local time mocking to simulate real reminder events for better end-to-end dev experience
