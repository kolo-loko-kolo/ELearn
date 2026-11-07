'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { lookupWord, ExtractedWordInfo } from '@/lib/dictionary';
import { getTodayDateString, addDaysToDate } from '@/lib/srs';
import { TextToSpeech } from '@/lib/speech';
import { Word, UserSettings } from '@/types';
import { AudioButton } from '@/components/AudioButton';
import { Button } from '@/components/ui/Button';
import { 
  Sparkles, 
  Plus, 
  Check, 
  FileText, 
  Bookmark, 
  Languages,
  Volume2,
  Square,
  X
} from 'lucide-react';

export default function ReaderPage() {
  const today = getTodayDateString();

  const articles = useLiveQuery(() => db.articles.toArray());
  const words = useLiveQuery(() => db.words.toArray());
  const settingsDoc = useLiveQuery(() => db.settings.get('userSettings'));
  const accent = (settingsDoc?.value as UserSettings | undefined)?.accentPreference || 'en-US';

  // State
  const [selectedArticleId, setSelectedArticleId] = useState<number | 'custom'>(-1);
  const [customText, setCustomText] = useState('');
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [wordLookupResult, setWordLookupResult] = useState<ExtractedWordInfo | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [surroundingSentence, setSurroundingSentence] = useState('');
  const [justAddedWord, setJustAddedWord] = useState<string | null>(null);
  const [newArticleTitle, setNewArticleTitle] = useState('');
  const [isAddingArticle, setIsAddingArticle] = useState(false);
  const [showAllArticlesModal, setShowAllArticlesModal] = useState(false);
  const [articleSearchQuery, setArticleSearchQuery] = useState('');

  // Audio & Translation state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  // Stop speech when component unmounts
  useEffect(() => {
    return () => {
      TextToSpeech.stop();
    };
  }, []);

  // Daily 2 Featured Articles (refreshed every day based on calendar day)
  const todayFeatured = useMemo(() => {
    const list = articles || [];
    if (list.length === 0) return [];
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const idx1 = (dayOfYear * 2) % list.length;
    const idx2 = (dayOfYear * 2 + 1) % list.length;
    return [list[idx1], list[idx2]].filter(Boolean);
  }, [articles]);

  // Set default article when articles load
  const currentArticle = useMemo(() => {
    const list = articles || [];
    if (selectedArticleId === 'custom') {
      return {
        title: '自定义短文阅读',
        content: customText,
        translation: '',
      };
    }
    if (list.length > 0) {
      if (selectedArticleId === -1) {
        return todayFeatured[0] || list[0];
      }
      return list.find((a) => a.id === selectedArticleId) || list[0];
    }
    return {
      title: '短文阅读',
      content: '在此粘贴你的英文短文开始阅读采词。',
      translation: '',
    };
  }, [articles, selectedArticleId, customText, todayFeatured]);

  // Handle switching article: stops any ongoing audio playback
  const handleSelectArticle = (id: number | 'custom') => {
    TextToSpeech.stop();
    setIsPlayingAudio(false);
    setSelectedArticleId(id);
  };

  // Toggle Read Aloud (听文章)
  const handleToggleReadAloud = () => {
    if (isPlayingAudio) {
      TextToSpeech.stop();
      setIsPlayingAudio(false);
      return;
    }
    if (!currentArticle?.content) return;
    setIsPlayingAudio(true);
    TextToSpeech.speak(currentArticle.content, {
      lang: accent,
      rate: 0.9,
      onEnd: () => setIsPlayingAudio(false),
    });
  };

  // Clean word helper
  const cleanWord = (w: string) => w.replace(/^[^\w']+|[^\w']+$/g, '');

  // Handle clicking a word in the text (生词挖掘 / 采词)
  const handleWordClick = async (rawWord: string, sentence: string) => {
    const cleaned = cleanWord(rawWord).toLowerCase();
    if (!cleaned || cleaned.length < 2) return;

    setActiveWord(cleaned);
    setSurroundingSentence(sentence.trim());

    // Check if word already exists in local DB for instant display
    const localMatch = (words || []).find((w) => w.word.toLowerCase() === cleaned);
    if (localMatch && localMatch.translation) {
      setWordLookupResult({
        word: localMatch.word,
        phonetic: localMatch.phonetic || localMatch.phoneticUs || '',
        pos: localMatch.pos || 'noun',
        translation: localMatch.translation || '',
        definition: localMatch.definition || '',
        exampleSentence: localMatch.exampleSentence || '',
      });
      return;
    }

    setIsLookingUp(true);
    try {
      const res = await lookupWord(cleaned);
      setWordLookupResult(res);
    } finally {
      setIsLookingUp(false);
    }
  };

  // Check if word is already in user's vocabulary
  const existingWord = useMemo(() => {
    if (!activeWord) return null;
    const wordList = words || [];
    return wordList.find((w) => w.word.toLowerCase() === activeWord.toLowerCase());
  }, [words, activeWord]);

  // Collect word to deck (采入生词库)
  // Newly collected words mature in 10 days before joining the daily flashcard review queue
  const handleCollectWord = async () => {
    if (!activeWord || !wordLookupResult) return;

    const newWord: Word = {
      word: activeWord,
      phonetic: wordLookupResult.phonetic || '',
      pos: wordLookupResult.pos || 'noun',
      definition: wordLookupResult.definition || '',
      translation: wordLookupResult.translation || '',
      exampleSentence: surroundingSentence || wordLookupResult.exampleSentence || '',
      tags: ['#采词', '#短文阅读'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      repetition: 0,
      interval: 0,
      easeFactor: 2.5,
      nextReviewDate: addDaysToDate(today, 10),
      reviewCount: 0,
      lapses: 0,
    };

    await db.words.add(newWord);
    setJustAddedWord(activeWord);
    setTimeout(() => setJustAddedWord(null), 3000);
  };

  // Split text into paragraphs and interactive words
  const parsedParagraphs = useMemo(() => {
    const text = currentArticle?.content || '';
    const paragraphs = text.split(/\n\s*\n/);

    return paragraphs.map((para) => {
      const sentences = para.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [para];

      return sentences.map((sentence) => {
        const tokens = sentence.split(/(\s+|[.,!?;:()""'—–])/);
        return {
          sentence,
          tokens,
        };
      });
    });
  }, [currentArticle]);

  // Split Chinese translations into matching paragraphs
  const translationParagraphs = useMemo(() => {
    if (!currentArticle?.translation) return [];
    return currentArticle.translation.split(/\n\s*\n/);
  }, [currentArticle]);

  // Save custom article
  const handleSaveArticle = async () => {
    if (!customText.trim()) return;
    const title = newArticleTitle.trim() || `短文 ${new Date().toLocaleDateString()}`;
    const id = await db.articles.add({
      title,
      content: customText.trim(),
      createdAt: Date.now(),
    });
    handleSelectArticle(id as number);
    setIsAddingArticle(false);
    setNewArticleTitle('');
  };

  const articleList = articles || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-serif">
            短文阅读与生词挖掘
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            沉浸式阅读原版短文。支持文章全篇听读与双语释义对照，点击文中任意生词，即刻查阅释义并一键录入记忆闪卡。
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingArticle((prev) => !prev)}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>粘贴文本 / 新建文章</span>
          </Button>
        </div>
      </div>

      {/* Paste / New Article Form */}
      {isAddingArticle && (
        <div className="p-5 rounded-2xl border border-indigo-200 bg-indigo-50/40 dark:border-indigo-900/50 dark:bg-indigo-950/20 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              添加阅读材料
            </h3>
            <button
              onClick={() => setIsAddingArticle(false)}
              className="text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            type="text"
            placeholder="文章标题（选填）"
            value={newArticleTitle}
            onChange={(e) => setNewArticleTitle(e.target.value)}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <textarea
            rows={5}
            placeholder="在此粘贴你的英文论文片段、新闻报道、小说段落或工作材料..."
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-serif leading-relaxed"
          />

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleSelectArticle('custom');
                setIsAddingArticle(false);
              }}
            >
              不保存直接阅读
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={!customText.trim()}
              onClick={handleSaveArticle}
            >
              保存至文章库
            </Button>
          </div>
        </div>
      )}

      {/* Daily Featured 2 Articles & Article Selector */}
      <div className="flex flex-wrap items-center gap-2 pb-1 text-xs">
        <span className="text-zinc-400 font-medium flex items-center gap-1 mr-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>今日精选推荐 (每天更新 2 篇):</span>
        </span>

        {todayFeatured.map((art, idx) => (
          <button
            key={art.id}
            onClick={() => handleSelectArticle(art.id!)}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              selectedArticleId === art.id || (selectedArticleId === -1 && idx === 0)
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300'
            }`}
          >
            <span className="text-[10px] px-1 bg-white/20 rounded font-mono">今日 #{idx + 1}</span>
            <span className="max-w-[180px] truncate">{art.title}</span>
          </button>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAllArticlesModal(true)}
          className="h-7 text-xs gap-1 ml-auto"
        >
          <FileText className="w-3.5 h-3.5 text-zinc-500" />
          <span>浏览全库 50 篇短文</span>
        </Button>

        {customText && (
          <button
            onClick={() => handleSelectArticle('custom')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              selectedArticleId === 'custom'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-sm'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
            }`}
          >
            <span>自定义文本</span>
          </button>
        )}
      </div>

      {/* 50 Articles Library Search Modal */}
      {showAllArticlesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  全库 50 篇原版阅读短文
                </h3>
              </div>
              <button
                onClick={() => setShowAllArticlesModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="搜索文章标题或核心话题关键字..."
              value={articleSearchQuery}
              onChange={(e) => setArticleSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-zinc-100 dark:divide-zinc-800">
              {articleList
                .filter((art) =>
                  !articleSearchQuery.trim() ||
                  art.title.toLowerCase().includes(articleSearchQuery.toLowerCase()) ||
                  art.content.toLowerCase().includes(articleSearchQuery.toLowerCase())
                )
                .map((art, idx) => (
                  <button
                    key={art.id}
                    onClick={() => {
                      handleSelectArticle(art.id!);
                      setShowAllArticlesModal(false);
                    }}
                    className={`w-full text-left py-3 px-2 rounded-xl transition-colors flex items-center justify-between gap-3 ${
                      selectedArticleId === art.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 font-semibold'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-zinc-400">#{idx + 1}</span>
                        <h4 className="text-sm font-serif font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {art.title}
                        </h4>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-1">
                        {art.content.slice(0, 100)}...
                      </p>
                    </div>

                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 shrink-0 font-medium">
                      阅读此篇 →
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Reading Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Article Text with Audio & Translation */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm space-y-6">
          {/* Article Header Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-zinc-900 dark:text-zinc-100">
                {currentArticle?.title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span>💡 点击文中任意单词即可查释义并采入生词库</span>
              </div>
            </div>

            {/* Action Buttons: 听文章 + 文章释义 */}
            <div className="flex items-center gap-2 shrink-0">
              {/* 听文章 */}
              <Button
                variant={isPlayingAudio ? 'primary' : 'outline'}
                size="sm"
                onClick={handleToggleReadAloud}
                className={`gap-1.5 transition-all ${
                  isPlayingAudio
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm ring-2 ring-indigo-400/50'
                    : ''
                }`}
              >
                {isPlayingAudio ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current animate-pulse text-white" />
                    <span>停止朗读</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>听文章</span>
                  </>
                )}
              </Button>

              {/* 文章释义 */}
              <Button
                variant={showTranslation ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setShowTranslation((prev) => !prev)}
                className={`gap-1.5 transition-all ${
                  showTranslation
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                    : ''
                }`}
              >
                <Languages className="w-3.5 h-3.5 text-indigo-500" />
                <span>{showTranslation ? '隐藏释义' : '文章释义'}</span>
              </Button>
            </div>
          </div>

          {/* CRITICAL: translate="no" and notranslate class prevents browser translator from corrupting English reading text */}
          <article
            translate="no"
            className="notranslate space-y-6 text-base sm:text-lg leading-relaxed font-serif text-zinc-800 dark:text-zinc-200"
          >
            {parsedParagraphs.map((sentences, pIdx) => (
              <div key={pIdx} className="space-y-3">
                <p>
                  {sentences.map(({ sentence, tokens }) =>
                    tokens.map((token, tIdx) => {
                      const cleaned = cleanWord(token);
                      const isWord = /^[a-zA-Z]{2,}/.test(cleaned);

                      if (!isWord) {
                        return <span key={tIdx}>{token}</span>;
                      }

                      const isSelected = activeWord === cleaned.toLowerCase();
                      const isSaved = (words || []).some((w) => w.word.toLowerCase() === cleaned.toLowerCase());

                      return (
                        <span
                          key={tIdx}
                          translate="no"
                          onClick={() => handleWordClick(cleaned, sentence)}
                          className={`notranslate cursor-pointer rounded px-0.5 transition-all select-none ${
                            isSelected
                              ? 'bg-indigo-500 text-white dark:bg-indigo-600'
                              : isSaved
                              ? 'underline decoration-indigo-400/80 underline-offset-4 font-medium text-zinc-900 dark:text-zinc-100 hover:bg-indigo-50 dark:hover:bg-indigo-950/60'
                              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          {token}
                        </span>
                      );
                    })
                  )}
                </p>

                {/* Article Translation Paragraph (文章释义对照) */}
                {showTranslation && (
                  <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100/80 dark:border-indigo-900/50 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans animate-in fade-in">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                      <Languages className="w-3 h-3" />
                      <span>段落释义对照 · 第 {pIdx + 1} 段</span>
                    </div>
                    <p className="font-sans leading-relaxed">
                      {translationParagraphs[pIdx] || currentArticle?.translation || '当前自定义短文暂未录入中文对照释义'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </article>
        </div>

        {/* Right Col: Sleek Word Mining Sidebar Card (保留采词功能) */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 p-5 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  生词采集器
                </h3>
              </div>
              {activeWord && (
                <button
                  onClick={() => {
                    setActiveWord(null);
                    setWordLookupResult(null);
                  }}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {!activeWord ? (
              <div className="py-12 text-center text-zinc-400 space-y-2">
                <Sparkles className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-700" />
                <p className="text-xs">点击文章中的任意单词，即可在此查看发音与释义，并一键采入生词库。</p>
              </div>
            ) : isLookingUp ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-zinc-400">正在查询 &ldquo;{activeWord}&rdquo;...</span>
              </div>
            ) : wordLookupResult ? (
              <div className="space-y-4 animate-in fade-in">
                {/* Word & Audio */}
                <div>
                  <div className="flex items-center justify-between">
                    <h4
                      translate="no"
                      className="notranslate text-2xl font-bold font-serif text-zinc-900 dark:text-zinc-100"
                    >
                      {wordLookupResult.word}
                    </h4>
                    <AudioButton text={wordLookupResult.word} lang={accent} size="md" />
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    {wordLookupResult.phonetic && (
                      <span
                        translate="no"
                        className="notranslate text-xs font-mono text-zinc-500"
                      >
                        {wordLookupResult.phonetic}
                      </span>
                    )}
                    {wordLookupResult.pos && (
                      <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                        {wordLookupResult.pos}
                      </span>
                    )}
                  </div>
                </div>

                {/* Chinese Meaning & Definition */}
                <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100/80 dark:border-indigo-900/60 space-y-1.5">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                    中文释义
                  </span>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                    {wordLookupResult.translation || wordLookupResult.definition || '暂无释义，可采入后补充'}
                  </p>
                  {wordLookupResult.definition && wordLookupResult.translation && (
                    <div className="pt-1.5 border-t border-indigo-100 dark:border-indigo-900/40">
                      <span className="text-[10px] text-zinc-400 block mb-0.5">英文官方解释:</span>
                      <p
                        translate="no"
                        className="notranslate text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans"
                      >
                        {wordLookupResult.definition}
                      </p>
                    </div>
                  )}
                </div>

                {/* Context Sentence */}
                {surroundingSentence && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                        原文出处语境
                      </span>
                      <AudioButton text={surroundingSentence} lang={accent} size="sm" />
                    </div>
                    <p
                      translate="no"
                      className="notranslate text-xs text-zinc-600 dark:text-zinc-400 italic bg-zinc-50/50 dark:bg-zinc-800/30 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800 font-serif"
                    >
                      &ldquo;{surroundingSentence}&rdquo;
                    </p>
                  </div>
                )}

                {/* Mining / Collection Status */}
                <div className="pt-2">
                  {existingWord ? (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="font-medium">已在生词库中</span>
                      </div>
                      <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                        加入满10天后入库复习
                      </span>
                    </div>
                  ) : justAddedWord === activeWord ? (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="font-medium">成功采入生词库！</span>
                    </div>
                  ) : (
                    <Button
                      onClick={handleCollectWord}
                      className="w-full gap-2 shadow-sm font-semibold"
                    >
                      <Plus className="w-4 h-4" />
                      <span>采入生词库 (+SRS)</span>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-zinc-400">
                未查询到该单词释义。
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
