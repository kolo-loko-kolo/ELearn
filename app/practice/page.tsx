'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { PracticeSentence, PronunciationResult, UserSettings } from '@/types';
import { TextToSpeech, startSpeechRecognition, judgePronunciation, SpeechRecognitionController } from '@/lib/speech';
import { PronunciationJudge } from '@/components/PronunciationJudge';
import { Button } from '@/components/ui/Button';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  ChevronRight, 
  ChevronLeft, 
  Shuffle
} from 'lucide-react';

const PRESET_SENTENCES: PracticeSentence[] = [
  {
    id: '1',
    category: 'Daily',
    text: 'Could you please let me know when the next train is scheduled to arrive?',
    translation: '请问你能告诉我下一班火车预计什么时候到达吗？',
    difficulty: 'Easy',
  },
  {
    id: '2',
    category: 'Daily',
    text: 'I would love to grab a cup of coffee and catch up on everything.',
    translation: '我很想一起喝杯咖啡，聊聊近况。',
    difficulty: 'Easy',
  },
  {
    id: '3',
    category: 'Business',
    text: 'We need to align our strategic priorities before presenting to the stakeholders.',
    translation: '在向利益相关者汇报之前，我们需要统一战略优先级。',
    difficulty: 'Medium',
  },
  {
    id: '4',
    category: 'Business',
    text: 'Let us take a step back and evaluate the return on investment for this initiative.',
    translation: '让我们退一步，评估一下这项举措的投资回报率。',
    difficulty: 'Medium',
  },
  {
    id: '5',
    category: 'Tech',
    text: 'The new microservice architecture significantly improves system reliability and throughput.',
    translation: '新的微服务架构显著提升了系统的可靠性与吞吐量。',
    difficulty: 'Hard',
  },
  {
    id: '6',
    category: 'Tech',
    text: 'Continuous integration and automated testing prevent regressions in production.',
    translation: '持续集成与自动化测试可防止生产环境中出现功能倒退。',
    difficulty: 'Hard',
  },
  {
    id: '7',
    category: 'Idioms',
    text: 'Actions speak louder than words when building trust with teammates.',
    translation: '在与团队成员建立信任时，行动胜于雄辩。',
    difficulty: 'Medium',
  },
  {
    id: '8',
    category: 'Idioms',
    text: 'Every cloud has a silver lining if you keep an optimistic mindset.',
    translation: '只要保持乐观心态，黑暗中总有一线光明。',
    difficulty: 'Easy',
  },
  {
    id: '9',
    category: 'Business',
    text: 'Critical thinking requires us to examine fundamental assumptions with intellectual humility.',
    translation: '批判性思维要求我们以求真谦逊的态度审视根本假设。',
    difficulty: 'Hard',
  },
  {
    id: '10',
    category: 'Daily',
    text: 'Consistent daily effort compounds into extraordinary cognitive breakthroughs over time.',
    translation: '日积月累的持续努力最终会汇聚成非凡的认知突破。',
    difficulty: 'Medium',
  },
  {
    id: '11',
    category: 'Tech',
    text: 'Artificial intelligence thrives when combined with nuanced human emotional empathy.',
    translation: '当人工智能与细腻的人类同理心相结合时，能发挥最大效能。',
    difficulty: 'Hard',
  },
  {
    id: '12',
    category: 'Idioms',
    text: 'Where there is a will, there is always an ingenious way forward.',
    translation: '有志者事竟成，总能找到巧妙的前行之道。',
    difficulty: 'Easy',
  },
  {
    id: '13',
    category: 'Business',
    text: 'Effective leadership is about empowering others to achieve more than they believed possible.',
    translation: '卓有成效的领导力在于赋能他人，实现超越他们预期的成就。',
    difficulty: 'Medium',
  },
  {
    id: '14',
    category: 'Daily',
    text: 'A profound epiphany often strikes when you permit your mind to rest in quiet contemplation.',
    translation: '深刻的顿悟往往在你允许大脑在静谧沉思中休息时悄然降临。',
    difficulty: 'Medium',
  },
];

export default function PracticePage() {
  const words = useLiveQuery(() => db.words.toArray());
  const settingsDoc = useLiveQuery(() => db.settings.get('userSettings'));
  const accent = (settingsDoc?.value as UserSettings | undefined)?.accentPreference || 'en-US';

  // State
  const [selectedCategory, setSelectedCategory] = useState<string>('今日精选跟读');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [pronunciationResult, setPronunciationResult] = useState<PronunciationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioSpeed, setAudioSpeed] = useState<0.8 | 1.0>(1.0);

  const recognitionRef = useRef<SpeechRecognitionController | null>(null);

  // Daily dynamically rotating sentences (refreshed every day based on date)
  const todayFeaturedSentences = useMemo(() => {
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const list = PRESET_SENTENCES;
    const startIndex = (dayOfYear * 3) % list.length;
    const result: PracticeSentence[] = [];
    for (let i = 0; i < 6; i++) {
      result.push(list[(startIndex + i) % list.length]);
    }
    return result;
  }, []);

  // Combine presets with custom sentences from vocabulary list
  const allSentences: PracticeSentence[] = useMemo(() => {
    const wordList = words || [];
    const vocabSentences: PracticeSentence[] = wordList
      .filter((w) => w.exampleSentence && w.exampleSentence.trim().length > 10)
      .map((w, idx) => ({
        id: `vocab-${w.id || idx}`,
        category: 'Custom' as const,
        text: w.exampleSentence!.trim(),
        translation: w.exampleTranslation || `来自生词: ${w.word}`,
        difficulty: 'Medium' as const,
      }));

    return [...PRESET_SENTENCES, ...vocabSentences];
  }, [words]);

  const filteredSentences = useMemo(() => {
    if (selectedCategory === '今日精选跟读') return todayFeaturedSentences;
    if (selectedCategory === '全部') return allSentences;
    if (selectedCategory === '生词例句') return allSentences.filter((s) => s.category === 'Custom');
    const categoryMap: Record<string, string> = {
      '日常口语': 'Daily',
      '职场商务': 'Business',
      '技术工程': 'Tech',
      '地道习语': 'Idioms',
    };
    const targetCat = categoryMap[selectedCategory] || selectedCategory;
    return allSentences.filter((s) => s.category === targetCat);
  }, [allSentences, selectedCategory, todayFeaturedSentences]);

  const currentSentence = filteredSentences[currentIndex] || filteredSentences[0];

  // Play audio
  const handlePlayAudio = () => {
    if (!currentSentence) return;
    setIsPlayingAudio(true);
    TextToSpeech.speak(currentSentence.text, {
      lang: accent,
      rate: audioSpeed,
      onEnd: () => setIsPlayingAudio(false),
    });
  };

  // Start speech recognition recording
  const handleStartRecording = () => {
    setErrorMessage(null);
    setInterimText('');
    setPronunciationResult(null);

    const controller = startSpeechRecognition({
      lang: accent,
      onInterimResult: (text) => {
        setInterimText(text);
      },
      onFinalResult: (final) => {
        setInterimText('');
        if (currentSentence) {
          const result = judgePronunciation(currentSentence.text, final);
          setPronunciationResult(result);
        }
        setIsRecording(false);
      },
      onError: (err) => {
        setErrorMessage(err);
        setIsRecording(false);
      },
      onEnd: () => {
        setIsRecording(false);
      },
    });

    if (controller) {
      recognitionRef.current = controller;
      setIsRecording(true);
    }
  };

  // Stop recording manually
  const handleStopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleNext = () => {
    TextToSpeech.stop();
    if (recognitionRef.current) recognitionRef.current.abort();
    setIsRecording(false);
    setPronunciationResult(null);
    setInterimText('');
    setErrorMessage(null);
    setCurrentIndex((prev) => (prev + 1) % filteredSentences.length);
  };

  const handlePrev = () => {
    TextToSpeech.stop();
    if (recognitionRef.current) recognitionRef.current.abort();
    setIsRecording(false);
    setPronunciationResult(null);
    setInterimText('');
    setErrorMessage(null);
    setCurrentIndex((prev) => (prev - 1 + filteredSentences.length) % filteredSentences.length);
  };

  const handleShuffle = () => {
    const randomIndex = Math.floor(Math.random() * filteredSentences.length);
    setCurrentIndex(randomIndex);
    setPronunciationResult(null);
    setInterimText('');
  };

  const categories = ['今日精选跟读', '全部', '日常口语', '职场商务', '技术工程', '地道习语', '生词例句'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-serif">
            影子跟读与发音评测
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            聆听标准原生韵律，大声影子跟读，获取实时逐词识别与准确度评分。
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShuffle} className="gap-1.5">
            <Shuffle className="w-3.5 h-3.5" />
            <span>随机抽取</span>
          </Button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCategory(cat);
              setCurrentIndex(0);
              setPronunciationResult(null);
            }}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-sm'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Practice Card */}
      {currentSentence && (
        <div className="p-6 sm:p-8 rounded-3xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm space-y-6">
          {/* Top meta */}
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 font-medium">
                {currentSentence.category}
              </span>
              {currentSentence.difficulty && (
                <span className="text-[11px] text-zinc-400 font-mono">
                  {currentSentence.difficulty}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono">
                {currentIndex + 1} / {filteredSentences.length}
              </span>
            </div>
          </div>

          {/* Sentence Display (CRITICAL: translate="no" and notranslate class) */}
          <div className="space-y-3 my-2">
            <h2
              translate="no"
              className="notranslate text-2xl sm:text-3xl font-serif font-medium leading-relaxed text-zinc-900 dark:text-zinc-100"
            >
              &ldquo;{currentSentence.text}&rdquo;
            </h2>

            {currentSentence.translation && (
              <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 font-sans">
                {currentSentence.translation}
              </p>
            )}
          </div>

          {/* Audio & Recording Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            {/* Step 1: Listen */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="secondary"
                onClick={handlePlayAudio}
                className="gap-2 flex-1 sm:flex-initial"
              >
                <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-pulse text-indigo-600' : ''}`} />
                <span>{isPlayingAudio ? '正在播放...' : '1. 听原音示范'}</span>
              </Button>

              <button
                type="button"
                onClick={() => setAudioSpeed(audioSpeed === 1.0 ? 0.8 : 1.0)}
                className="text-xs px-2.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono hover:bg-zinc-50 dark:hover:bg-zinc-800"
                title="切换播放语速"
              >
                {audioSpeed}x
              </button>
            </div>

            {/* Step 2: Speak / Record */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {!isRecording ? (
                <Button
                  variant="primary"
                  onClick={handleStartRecording}
                  className="gap-2 flex-1 sm:flex-initial shadow-md"
                >
                  <Mic className="w-4 h-4" />
                  <span>2. 点击开始影子跟读</span>
                </Button>
              ) : (
                <Button
                  variant="danger"
                  onClick={handleStopRecording}
                  className="gap-2 flex-1 sm:flex-initial animate-pulse"
                >
                  <MicOff className="w-4 h-4" />
                  <span>完成跟读并评分</span>
                </Button>
              )}

              {/* Prev / Next buttons */}
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={handlePrev} title="上一句">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleNext} title="下一句">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Live Speech Recognition Transcript Indicator */}
          {isRecording && (
            <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping inline-block" />
                <span>正在聆听您的朗读... 请靠近麦克风清晰发音</span>
              </div>
              <p
                translate="no"
                className="notranslate text-sm font-mono italic text-zinc-700 dark:text-zinc-300"
              >
                {interimText || '...'}
              </p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs flex items-center gap-2">
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Pronunciation Feedback */}
          {pronunciationResult && (
            <PronunciationJudge
              result={pronunciationResult}
            />
          )}
        </div>
      )}
    </div>
  );
}
