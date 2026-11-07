# ELearn - Personal English Learning Assistant 🚀

A distraction-free, mobile-first Progressive Web App (PWA) designed for serious English learners, built with **Next.js 15, TypeScript, Tailwind CSS, IndexedDB (Dexie)**, and browser-native Speech APIs.

---

## 🌟 Core Features

### 1. 🧠 Smart Vocabulary & SRS Flashcards (`/vocab/review` & `/vocab`)
- **CET 3000 Core Vocabulary**: Preloaded with 3,000 high-frequency CET-4/6 core exam words with varied contextual examples.
- **Optimized 3-Tier Spaced Repetition**:
  - <kbd>1</kbd> **困难 (Hard)**: 1-day interval; routed to Home *Difficult Words Breakthrough* for targeted re-study.
  - <kbd>2</kbd> **良好 (Good)**: Refreshes after at least 10 days.
  - <kbd>3</kbd> **容易 (Easy)**: Refreshes after at least 100 days.
- **Daily 20-Word Session**: Strictly 20 words per day (due reviews + date-hashed fresh words), with zero rollover overflow from skipped days.
- **Dictation Test (单词默写测验)**: Reverse spelling challenge after deck completion to solidify active recall.
- **3D Flip Flashcards & Audio**: Smooth card flip, phonetic notation, native US/UK audio playback.

### 2. 🎓 CET-4 & CET-6 Exam Prep & Daily Drills (`/cet`)
- **Full Mock Exam**: Complete real exam papers from past 20 years (Listening, Reading, Translation) with authentic 710-score report and countdown timer. Limited to 1 test per week.
- **Daily Targeted Drills (每日专项精炼)**: Refreshes every day with:
  - 1 Full Listening Section (4 questions with audio playback & scripts)
  - 2 In-depth Reading Passages (10 questions with detailed analysis)
  - Chinese-to-English Translation Practice with key scoring point comparison.

### 3. 📖 Short Article Reader & Word Mining (`/reader`)
- **50 Bilingual Curated Articles**: Full authentic library with 2 daily featured articles refreshed every morning.
- **Listen to Article (听文章)**: Fluent, full-text speech synthesis with US/UK accent switching and instant stop/play controls.
- **Bilingual Translation (文章释义)**: Toggle paragraph-by-paragraph Chinese translations on demand.
- **Click-to-Collect**: Click any unfamiliar English word to view instant definitions and mine it directly into your SRS flashcard deck (matures in 10 days).

### 4. 🎙️ Shadowing & Pronunciation Trainer (`/practice`)
- Sentence-level shadowing practice:
  1. **Listen**: Native text-to-speech with US/UK accent options and speed control.
  2. **Speak**: Browser speech recognition (`webkitSpeechRecognition`).
  3. **Feedback**: Real-time accuracy score (0-100%) and word-by-word visual breakdown (green for accurate words, red strike-through for missed words).
- Supports authentic spoken, business, technology expressions, and example sentences from your vocabulary.

### 5. 📊 Habit & Progress Dashboard (`/`)
- **Accumulated Study Days (累计学习天数)**: Tracks days where daily study progress $\ge 50\%$; never resets on skipped days.
- **Vocabulary Mastery Stats**: Real-time counts for *Total Words*, *Due Today*, *Reviewed (已复习)*, and *Multi-Reviewed (多次复习 $\ge 3$次)*.
- **Difficult Words Breakthrough (困难词汇重点攻坚)**: Pinpoints struggling words; completing a restudy automatically promotes them to "良好".
- **GitHub-style Contribution Heatmap**: Tracks study consistency across the past 16 weeks.

### 6. ⚙️ Settings & Data Safety (`/settings`)
- **Dark / Light Theme**: Seamless toggle between Dark, Light, and System modes.
- **Offline-First & Local Storage**: IndexedDB via Dexie. Zero backend required, 100% private.
- **JSON Backup / Restore**: 1-click export and import of your entire dictionary, review history, and articles.
- **Voice Preferences**: Toggle between US and UK accents, adjust speech rate.

---

## 🛠️ Tech Stack
- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS (Linear/Notion minimalist aesthetic, dark/light mode responsive)
- **Database**: IndexedDB via Dexie & `dexie-react-hooks`
- **Speech**: Browser Web Speech API (`SpeechSynthesis` & `SpeechRecognition`)
- **PWA**: Web App Manifest (`manifest.json`), service worker, and standalone mobile support

---

## 🚀 Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for production
```bash
npm run build
npm start
```

---

## 📱 Mobile Installation (PWA)
- **iOS Safari**: Tap "Share" -> "Add to Home Screen".
- **Android Chrome**: Tap Menu (three dots) -> "Install App".
