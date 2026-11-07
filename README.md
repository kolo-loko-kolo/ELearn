# ELearn - Personal English Learning Assistant 🚀

A distraction-free, mobile-first Progressive Web App (PWA) designed for serious English learners, built with **Next.js 15, TypeScript, Tailwind CSS, IndexedDB (Dexie)**, and browser-native Speech APIs.

---

## 🌟 Core Features

### 1. 🧠 Smart Vocabulary & SRS Flashcards (`/vocab/review` & `/vocab`)
- **SuperMemo 2 (SM-2) Spaced Repetition**: Dynamic intervals (1d, 3d, 6d... based on quality ratings 1-4 and ease factors).
- **3D Flip Flashcards**: Smooth interactive card flips with phonetic transcriptions, definitions, parts of speech, and bilingual examples.
- **Keyboard Shortcuts**:
  - <kbd>Space</kbd>: Flip card / Show answer
  - <kbd>1</kbd>: Again (reset interval)
  - <kbd>2</kbd>: Hard (+1.2x)
  - <kbd>3</kbd>: Good (standard SM-2)
  - <kbd>4</kbd>: Easy (+bonus interval)
  - <kbd>R</kbd>: Replay pronunciation audio
- **Celebration Effects**: Confetti on completing your daily review deck.
- **Vocab Management**: Instant auto-fill lookup via Free Dictionary API and optional Gemini AI insights. Filter by tags (`#Daily`, `#Tech`, `#GRE`) and status (Due, Learning, Mastered).

### 2. 📖 Context Reading & Word Mining (`/reader`)
- Read curated articles or paste any English text.
- **Click-to-Collect**: Tap any word in the text to inspect definitions and mine it directly into your SRS flashcards with 1-click.
- Automatically preserves the surrounding sentence as the example context.

### 3. 🎙️ Shadowing & Pronunciation Trainer (`/practice`)
- Sentence-level shadowing practice:
  1. **Listen**: Native text-to-speech with US/UK accent options and speed control (0.8x / 1.0x).
  2. **Speak**: Browser speech recognition (`webkitSpeechRecognition`).
  3. **Feedback**: Real-time accuracy score (0-100%) and word-by-word visual breakdown (green for accurate words, red strike-through for missed/mispronounced words).
- Includes conversational, business, tech, idiom sentences, and automatic loading of example sentences from your own vocabulary deck!

### 4. 📊 Habit & Progress Dashboard (`/`)
- Daily goal progress bars (reviews due vs. completed, new words added).
- Continuous habit streak tracker.
- **GitHub-style Contribution Heatmap** representing review frequency across the past 16 weeks.

### 5. ⚙️ Settings & Data Safety (`/settings`)
- **Offline-First & Local Storage**: Everything is stored in your browser's IndexedDB via Dexie. Zero backend required.
- **JSON Backup / Restore**: 1-click export and import of your entire dictionary, review history, and articles.
- **Voice Preferences**: Toggle between US and UK accents, adjust speech rate.
- **Optional Gemini API**: Provide your Google Gemini API key for root etymology breakdown, mnemonics, and natural collocations.

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
