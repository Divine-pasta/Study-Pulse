# StudyPulse — 100% Offline Student Study Companion

A lightweight, offline-first Android study companion built with **Expo (TypeScript)**. Designed with a static, zero-shader **Liquid Glass** aesthetic and true **AMOLED Pitch-Black** mode for 60fps performance on entry-level Android devices.

## Features
- **100% Offline Storage:** All syllabi, exam dates, milestones, and tasks are stored locally via `AsyncStorage` with JSON export/import backup.
- **AMOLED Dark & Crisp Light Themes:** One-tap theme toggle in the persistent header.
- **Interactive Syllabus Tree:** Expandable `Subject → Chapter → Topic` checklist with live completion stats, preset templates (NEET, JEE, UPSC, Class 12 Boards), and full CRUD editing.
- **Exam Countdown & Pacing:** Real-time days/hours countdown, daily topic pacing calculator, custom interactive calendar picker, and mock exam milestones.
- **Subject-Tagged To-Do Manager:** Quick task creation, subject tags, editing, and collapsible completed list.

## Local Setup

```bash
# 1. Create project or clone repository
git clone <your-repo-url>
cd studypulse-offline

# 2. Install dependencies & align Expo SDK versions
npm install
npx expo install --fix

# 3. Start Metro bundler (scan QR with Expo Go on Android)
npx expo start
