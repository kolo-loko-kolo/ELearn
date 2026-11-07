'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Word, UserSettings } from '@/types';
import { lookupWord, getGeminiWordInsights } from '@/lib/dictionary';
import { getTodayDateString, isWordDue } from '@/lib/srs';
import { AudioButton } from '@/components/AudioButton';
import { Button } from '@/components/ui/Button';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Sparkles, 
  X, 
  BookOpen,
  Tag as TagIcon,
  ChevronDown
} from 'lucide-react';

export default function VocabPage() {
  const searchParams = useSearchParams();
  const today = getTodayDateString();

  const words = useLiveQuery(() => db.words.toArray());
  const settingsDoc = useLiveQuery(() => db.settings.get('userSettings'));
  const settings = settingsDoc?.value as UserSettings | undefined;
  const accent = settings?.accentPreference || 'en-US';

  // Filters & Search with Debounce for ultra-smooth performance
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('全部');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'learning' | 'mastered'>('all');

  // Incremental rendering for high performance with 3,000 words
  const [visibleCount, setVisibleCount] = useState(40);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [isFetchingDefinition, setIsFetchingDefinition] = useState(false);

  // Form fields
  const [formWord, setFormWord] = useState('');
  const [formPhonetic, setFormPhonetic] = useState('');
  const [formPos, setFormPos] = useState('noun');
  const [formDefinition, setFormDefinition] = useState('');
  const [formTranslation, setFormTranslation] = useState('');
  const [formExample, setFormExample] = useState('');
  const [formExampleTranslation, setFormExampleTranslation] = useState('');
  const [formTags, setFormTags] = useState('#Daily');
  const [formNotes, setFormNotes] = useState('');

  // 120ms debounce for search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 120);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset pagination count on filter change
  useEffect(() => {
    setVisibleCount(40);
  }, [debouncedSearch, selectedTag, statusFilter]);

  const openAddModal = () => {
    setEditingWord(null);
    setFormWord('');
    setFormPhonetic('');
    setFormPos('noun');
    setFormDefinition('');
    setFormTranslation('');
    setFormExample('');
    setFormExampleTranslation('');
    setFormTags('#Daily');
    setFormNotes('');
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      openAddModal();
    }
  }, [searchParams]);

  // Extract all distinct tags with fast loop
  const allTags = useMemo(() => {
    const list = words || [];
    const set = new Set<string>();
    for (let i = 0; i < list.length; i++) {
      const tags = list[i].tags;
      if (tags) {
        for (let j = 0; j < tags.length; j++) {
          set.add(tags[j]);
        }
      }
    }
    return ['全部', ...Array.from(set)];
  }, [words]);

  // Fast filter words
  const filteredWords = useMemo(() => {
    const list = words || [];
    const query = debouncedSearch.toLowerCase().trim();

    return list.filter((item) => {
      const matchSearch =
        !query ||
        item.word.toLowerCase().includes(query) ||
        (item.definition && item.definition.toLowerCase().includes(query)) ||
        (item.translation && item.translation.includes(query)) ||
        (item.exampleSentence && item.exampleSentence.toLowerCase().includes(query));

      if (!matchSearch) return false;

      const matchTag = selectedTag === '全部' || (item.tags && item.tags.includes(selectedTag));
      if (!matchTag) return false;

      if (statusFilter === 'due') {
        return isWordDue(item.nextReviewDate, today);
      } else if (statusFilter === 'learning') {
        return Boolean(item.reviewCount && item.reviewCount >= 1);
      } else if (statusFilter === 'mastered') {
        return Boolean(item.reviewCount && item.reviewCount >= 3);
      }

      return true;
    });
  }, [words, debouncedSearch, selectedTag, statusFilter, today]);

  // Slice visible items (avoids mounting 3000 DOM elements at once)
  const visibleWords = useMemo(() => {
    return filteredWords.slice(0, visibleCount);
  }, [filteredWords, visibleCount]);

  const openEditModal = (w: Word) => {
    setEditingWord(w);
    setFormWord(w.word);
    setFormPhonetic(w.phonetic || w.phoneticUs || '');
    setFormPos(w.pos || 'noun');
    setFormDefinition(w.definition || '');
    setFormTranslation(w.translation || '');
    setFormExample(w.exampleSentence || '');
    setFormExampleTranslation(w.exampleTranslation || '');
    setFormTags(w.tags ? w.tags.join(', ') : '');
    setFormNotes(w.notes || '');
    setIsModalOpen(true);
  };

  const handleAutoLookup = async () => {
    if (!formWord.trim()) return;
    setIsFetchingDefinition(true);
    try {
      const info = await lookupWord(formWord.trim());
      if (info) {
        if (info.phonetic) setFormPhonetic(info.phonetic);
        if (info.pos) setFormPos(info.pos);
        if (info.translation) setFormTranslation(info.translation);
        if (info.definition) setFormDefinition(info.definition);
        if (info.exampleSentence && !formExample) setFormExample(info.exampleSentence);
      }

      if (settings?.geminiApiKey) {
        const insights = await getGeminiWordInsights(formWord.trim(), settings.geminiApiKey);
        if (insights) {
          if (insights.chineseMeaning) setFormTranslation(insights.chineseMeaning);
          if (insights.contextSentence && !formExample) setFormExample(insights.contextSentence);
          if (insights.roots) setFormNotes(`词根: ${insights.roots} | 助记: ${insights.mnemonic || ''}`);
        }
      }
    } finally {
      setIsFetchingDefinition(false);
    }
  };

  const handleSaveWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formWord.trim()) return;

    const parsedTags = formTags
      .split(/[,，\s]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    if (editingWord && editingWord.id) {
      await db.words.update(editingWord.id, {
        word: formWord.trim().toLowerCase(),
        phonetic: formPhonetic.trim(),
        pos: formPos,
        definition: formDefinition.trim(),
        translation: formTranslation.trim(),
        exampleSentence: formExample.trim(),
        exampleTranslation: formExampleTranslation.trim(),
        tags: parsedTags,
        notes: formNotes.trim(),
        updatedAt: Date.now(),
      });
    } else {
      const newWord: Word = {
        word: formWord.trim().toLowerCase(),
        phonetic: formPhonetic.trim(),
        pos: formPos,
        definition: formDefinition.trim(),
        translation: formTranslation.trim(),
        exampleSentence: formExample.trim(),
        exampleTranslation: formExampleTranslation.trim(),
        tags: parsedTags.length > 0 ? parsedTags : ['#Daily'],
        notes: formNotes.trim(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        repetition: 0,
        interval: 0,
        easeFactor: 2.5,
        nextReviewDate: today,
        reviewCount: 0,
        lapses: 0,
      };
      await db.words.add(newWord);
    }

    setIsModalOpen(false);
  };

  const handleDeleteWord = async (id?: number) => {
    if (!id) return;
    if (confirm('确定要从生词库中删除这个单词吗？')) {
      await db.words.delete(id);
    }
  };

  const wordList = words || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-serif">
            生词词库
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            包含 3,000 四六级真题核心词汇与个人生词库，支持即时搜索与智能释义。
          </p>
        </div>

        <Button onClick={openAddModal} className="gap-1.5 shadow-sm font-semibold">
          <Plus className="w-4 h-4" />
          <span>录入新单词</span>
        </Button>
      </div>

      {/* Search and Filters Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="搜索英文单词、中文释义、例句（3000词快速检索）..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-zinc-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl text-xs font-medium self-start sm:self-auto overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-100 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              全部 ({wordList.length})
            </button>
            <button
              onClick={() => setStatusFilter('learning')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === 'learning'
                  ? 'bg-white dark:bg-zinc-900 shadow-sm text-amber-600 dark:text-amber-400 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              已复习
            </button>
            <button
              onClick={() => setStatusFilter('mastered')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === 'mastered'
                  ? 'bg-white dark:bg-zinc-900 shadow-sm text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              多次复习 (3次+)
            </button>
          </div>
        </div>

        {/* Tag Filters */}
        {allTags.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-zinc-400 flex items-center gap-1 mr-1">
              <TagIcon className="w-3 h-3" />
              <span>标签分类:</span>
            </span>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                  selectedTag === tag
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Words List */}
      {filteredWords.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 space-y-3">
          <BookOpen className="w-8 h-8 mx-auto text-zinc-400" />
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            暂无匹配的词汇
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            尝试更换搜索词或筛选标签，也可以录入新单词。
          </p>
          <Button size="sm" variant="outline" onClick={openAddModal}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>录入新词</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
            <span>找到 {filteredWords.length} 个词汇</span>
            <span>当前已展示前 {visibleWords.length} 个</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {visibleWords.map((item) => {
              const isDue = isWordDue(item.nextReviewDate, today);

              return (
                <div
                  key={item.id}
                  className="group p-4 rounded-xl border border-zinc-200/80 bg-white hover:border-zinc-300 dark:border-zinc-800/80 dark:bg-zinc-900 dark:hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left section: Word, pronunciation, translations */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        translate="no"
                        className="notranslate text-lg font-bold font-serif text-zinc-900 dark:text-zinc-100"
                      >
                        {item.word}
                      </span>
                      <AudioButton text={item.word} lang={accent} size="sm" />
                      <span
                        translate="no"
                        className="notranslate text-xs font-mono text-zinc-400"
                      >
                        {item.phonetic || item.phoneticUs}
                      </span>
                      {item.pos && (
                        <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                          {item.pos}
                        </span>
                      )}
                      {typeof item.dayIndex === 'number' && (
                        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                          第{item.dayIndex + 1}天
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-snug">
                      {item.translation && (
                        <span className="font-medium mr-2">{item.translation}</span>
                      )}
                      {item.definition && (
                        <span className="text-xs text-zinc-500 font-serif">
                          {item.definition}
                        </span>
                      )}
                    </div>

                    {item.exampleSentence && (
                      <div className="pt-1 text-xs text-zinc-500 dark:text-zinc-400 font-serif">
                        <p translate="no" className="notranslate italic">
                          &ldquo;{item.exampleSentence}&rdquo;
                        </p>
                        {item.exampleTranslation && (
                          <p className="text-[11px] text-zinc-400 not-italic mt-0.5 font-sans">
                            {item.exampleTranslation}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right section: Tags, intervals, actions */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.tags?.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                        >
                          {t}
                        </span>
                      ))}
                      {isDue && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 font-medium">
                          今日待复习
                        </span>
                      )}
                      {item.interval >= 21 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 font-medium">
                          已掌握
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        title="编辑词汇"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteWord(item.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        title="删除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Button if filtered items exceed visibleCount */}
          {filteredWords.length > visibleCount && (
            <div className="pt-4 pb-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount((prev) => prev + 50)}
                className="text-xs font-semibold gap-1.5"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>加载更多 (还有 {filteredWords.length - visibleCount} 词)</span>
              </Button>
              <button
                type="button"
                onClick={() => setVisibleCount(filteredWords.length)}
                className="text-xs text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline"
              >
                一次性显示全部
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Word Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full border border-zinc-200 dark:border-zinc-800 p-6 shadow-xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {editingWord ? '编辑生词' : '录入新单词'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWord} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    英文单词 *
                  </label>
                  <div className="flex gap-1.5 mt-1">
                    <input
                      type="text"
                      required
                      placeholder="e.g. serendipity"
                      value={formWord}
                      onChange={(e) => setFormWord(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAutoLookup}
                      disabled={isFetchingDefinition || !formWord.trim()}
                      className="px-2 text-xs shrink-0"
                      title="调用权威词典API自动获取音标和中英文释义"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500 mr-1" />
                      <span>{isFetchingDefinition ? '查询中...' : '查词'}</span>
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    词性
                  </label>
                  <select
                    value={formPos}
                    onChange={(e) => setFormPos(e.target.value)}
                    className="w-full mt-1 px-2 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="noun">noun (名词)</option>
                    <option value="verb">verb (动词)</option>
                    <option value="adjective">adjective (形容词)</option>
                    <option value="adverb">adverb (副词)</option>
                    <option value="phrase">phrase (短语)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    国际音标
                  </label>
                  <input
                    type="text"
                    placeholder="/ˌserənˈdɪpəti/"
                    value={formPhonetic}
                    onChange={(e) => setFormPhonetic(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    主题标签 (以逗号隔开)
                  </label>
                  <input
                    type="text"
                    placeholder="#日常, #职场, #四六级"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  中文核心释义 *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 意外收获；不期而至的美好"
                  value={formTranslation}
                  onChange={(e) => setFormTranslation(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  英文详细释义 (可选)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. The occurrence and development of events by chance in a happy way."
                  value={formDefinition}
                  onChange={(e) => setFormDefinition(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  语境英文例句
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Finding that book at the old market was pure serendipity."
                  value={formExample}
                  onChange={(e) => setFormExample(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-serif"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  例句中文对照
                </label>
                <input
                  type="text"
                  placeholder="e.g. 在旧集市上发现那本书纯属意外之喜。"
                  value={formExampleTranslation}
                  onChange={(e) => setFormExampleTranslation(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  取消
                </Button>
                <Button type="submit" variant="primary">
                  保存词汇
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
