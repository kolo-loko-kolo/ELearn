'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DEFAULT_SETTINGS, CustomArticle, resetApplicationData } from '@/lib/db';
import { UserSettings, Word, ReviewLog } from '@/types';
import { TextToSpeech } from '@/lib/speech';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/Logo';
import { 
  Download, 
  Upload, 
  Volume2, 
  RotateCcw, 
  Check, 
  ShieldCheck, 
  Smartphone,
  Sparkles,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { applyTheme, getStoredTheme, ThemeMode } from '@/lib/theme';

export default function SettingsPage() {
  const words = useLiveQuery(() => db.words.toArray()) || [];
  const reviewLogs = useLiveQuery(() => db.reviewLogs.toArray()) || [];
  const articles = useLiveQuery(() => db.articles.toArray()) || [];
  const settingsDoc = useLiveQuery(() => db.settings.get('userSettings'));

  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    if (settingsDoc?.value) {
      setSettings(settingsDoc.value as UserSettings);
    } else {
      setSettings((prev) => ({ ...prev, theme: getStoredTheme() }));
    }
  }, [settingsDoc]);

  // Handle Live Theme Switching
  const handleThemeChange = (mode: ThemeMode) => {
    const updated = { ...settings, theme: mode };
    setSettings(updated);
    applyTheme(mode);
    db.settings.put({
      key: 'userSettings',
      value: updated,
    });
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.settings.put({
      key: 'userSettings',
      value: settings,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Test Speech Voice
  const handleTestVoice = () => {
    TextToSpeech.speak('Welcome to ELearn. Practice makes perfect in your language journey.', {
      lang: settings.accentPreference,
      rate: settings.speechRate,
    });
  };

  // Export Data to JSON
  const handleExportData = () => {
    const backupData = {
      version: 1,
      appName: 'ELearn',
      exportedAt: new Date().toISOString(),
      words,
      reviewLogs,
      articles,
      settings,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ELearn_备份_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import Data from JSON
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed.words || !Array.isArray(parsed.words)) {
          throw new Error('无效的 ELearn 备份文件格式。');
        }

        if (confirm(`备份文件中包含 ${parsed.words.length} 个单词。确定要恢复吗？已存在的本地数据将自动合并。`)) {
          await db.transaction('rw', db.words, db.reviewLogs, db.articles, db.settings, async () => {
            for (const item of parsed.words) {
              const wordData: Omit<Word, 'id'> = {
                word: item.word,
                phonetic: item.phonetic,
                phoneticUs: item.phoneticUs,
                phoneticUk: item.phoneticUk,
                pos: item.pos,
                definition: item.definition,
                translation: item.translation,
                exampleSentence: item.exampleSentence,
                exampleTranslation: item.exampleTranslation,
                tags: item.tags || ['#日常'],
                notes: item.notes,
                createdAt: item.createdAt || Date.now(),
                updatedAt: item.updatedAt || Date.now(),
                repetition: item.repetition || 0,
                interval: item.interval || 0,
                easeFactor: item.easeFactor || 2.5,
                nextReviewDate: item.nextReviewDate,
                reviewCount: item.reviewCount || 0,
                lapses: item.lapses || 0,
              };

              const exists = await db.words.where('word').equalsIgnoreCase(item.word).first();
              if (!exists) {
                await db.words.add(wordData as Word);
              }
            }

            if (parsed.reviewLogs && Array.isArray(parsed.reviewLogs)) {
              for (const logItem of parsed.reviewLogs) {
                const logData: Omit<ReviewLog, 'id'> = {
                  wordId: logItem.wordId,
                  word: logItem.word,
                  rating: logItem.rating,
                  reviewDate: logItem.reviewDate,
                  reviewedAt: logItem.reviewedAt,
                  intervalBefore: logItem.intervalBefore,
                  intervalAfter: logItem.intervalAfter,
                };
                await db.reviewLogs.add(logData as ReviewLog);
              }
            }

            if (parsed.articles && Array.isArray(parsed.articles)) {
              for (const artItem of parsed.articles) {
                const artData: Omit<CustomArticle, 'id'> = {
                  title: artItem.title,
                  content: artItem.content,
                  createdAt: artItem.createdAt || Date.now(),
                };
                await db.articles.add(artData as CustomArticle);
              }
            }

            if (parsed.settings) {
              await db.settings.put({ key: 'userSettings', value: parsed.settings });
            }
          });

          setImportStatus('备份数据已成功导入！');
          setTimeout(() => setImportStatus(null), 3000);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '未知错误';
        alert('导入备份失败: ' + message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Reset to clean 3000 words & 50 articles
  const handleResetData = async () => {
    if (confirm('确定要重置整个应用数据吗？将清空所有学习记录并恢复为纯净的 3,000 四六级核心词库与 50 篇短文。')) {
      await resetApplicationData();
      alert('已成功重置应用数据为初始纯净状态！');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-serif">
          设置与数据管理
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          配置发音口音偏好、每日目标、AI 智能助记接口，以及本地全量数据的安全备份与恢复。
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 0: Appearance & Theme Mode (深浅色模式切换) */}
        <div className="p-6 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <Sun className="w-4 h-4 text-amber-500" />
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              界面外观与深浅色模式
            </h2>
          </div>

          <p className="text-xs text-zinc-500 leading-relaxed">
            选择符合您使用习惯的视觉显示模式。点击选项即可实时切换并即刻生效。
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Light Mode */}
            <button
              type="button"
              onClick={() => handleThemeChange('light')}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
                (settings.theme || 'dark') === 'light'
                  ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/30'
                  : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                  <Sun className="w-5 h-5" />
                </div>
                {(settings.theme || 'dark') === 'light' && (
                  <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                )}
              </div>
              <div>
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">浅色明亮模式</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">清爽亮色视感，适合日间光线充足环境</div>
              </div>
            </button>

            {/* Dark Mode */}
            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
                (settings.theme || 'dark') === 'dark'
                  ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/30'
                  : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-zinc-800 text-zinc-200 dark:bg-zinc-800 dark:text-zinc-100">
                  <Moon className="w-5 h-5" />
                </div>
                {(settings.theme || 'dark') === 'dark' && (
                  <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                )}
              </div>
              <div>
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">深色暗夜模式</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">极简沉浸深灰，夜间长久专注温和护眼</div>
              </div>
            </button>

            {/* System Mode */}
            <button
              type="button"
              onClick={() => handleThemeChange('system')}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
                settings.theme === 'system'
                  ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/30'
                  : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  <Monitor className="w-5 h-5" />
                </div>
                {settings.theme === 'system' && (
                  <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                )}
              </div>
              <div>
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">跟随系统外观</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">自动同步操作系统与浏览器的明暗偏好</div>
              </div>
            </button>
          </div>
        </div>

        {/* Section 1: Speech & Pronunciation */}
        <div className="p-6 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              语音与发音偏好
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                发音口音偏好
              </label>
              <select
                value={settings.accentPreference}
                onChange={(e) =>
                  setSettings({ ...settings, accentPreference: e.target.value as 'en-US' | 'en-GB' })
                }
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="en-US">美式英语 (US Accent)</option>
                <option value="en-GB">英式英语 (UK Accent)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  朗读播放语速
                </label>
                <span className="text-xs font-mono text-zinc-500">{settings.speechRate}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.2"
                step="0.05"
                value={settings.speechRate}
                onChange={(e) =>
                  setSettings({ ...settings, speechRate: parseFloat(e.target.value) })
                }
                className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestVoice}
              className="gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>试听发音效果</span>
            </Button>
          </div>
        </div>

        {/* Section 2: Daily Learning Goals */}
        <div className="p-6 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              每日定量目标
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                每日复习目标 (张/天)
              </label>
              <input
                type="number"
                min="5"
                max="200"
                value={settings.dailyReviewGoal}
                onChange={(e) =>
                  setSettings({ ...settings, dailyReviewGoal: parseInt(e.target.value) || 20 })
                }
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                每日新词目标 (个/天)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={settings.dailyNewWordGoal}
                onChange={(e) =>
                  setSettings({ ...settings, dailyNewWordGoal: parseInt(e.target.value) || 5 })
                }
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Optional Gemini AI API */}
        <div className="p-6 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              AI 智能助记扩展 (Gemini API)
            </h2>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Gemini API Key（选填）
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={settings.geminiApiKey || ''}
              onChange={(e) =>
                setSettings({ ...settings, geminiApiKey: e.target.value.trim() })
              }
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <p className="text-xs text-zinc-400">
              密钥仅安全存储在您的本地浏览器 IndexedDB 中，用于在录入生词时自动调用 Gemini 生成生动的词根助记、词源故事与地道例句。
            </p>
          </div>
        </div>

        {/* Save Changes Button */}
        <div className="flex items-center justify-between pt-2">
          {saveSuccess ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <Check className="w-4 h-4" />
              <span>偏好设置已成功保存！</span>
            </div>
          ) : (
            <div />
          )}

          <Button type="submit" variant="primary" className="shadow-md">
            保存偏好设置
          </Button>
        </div>
      </form>

      {/* Section 4: Data Safety, Backup & Restore */}
      <div className="p-6 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <Download className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            数据备份与本地持久化
          </h2>
        </div>

        <p className="text-xs text-zinc-500 leading-relaxed">
          您的全部学习进度、生词闪卡和打卡复习记录均保存在本地浏览器的 IndexedDB 数据库中，完全离线可用。建议定期导出 JSON 备份以确保数据长久安全。
        </p>

        {importStatus && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 text-xs flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{importStatus}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleExportData}
            className="w-full sm:w-auto gap-2"
          >
            <Download className="w-4 h-4" />
            <span>导出全量备份 (JSON)</span>
          </Button>

          <label className="w-full sm:w-auto">
            <span className="inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none border border-zinc-200 bg-transparent text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 text-sm px-4 py-2 h-10 gap-2 cursor-pointer w-full sm:w-auto">
              <Upload className="w-4 h-4" />
              <span>导入备份数据 (JSON)</span>
            </span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />
          </label>

          <Button
            type="button"
            variant="ghost"
            onClick={handleResetData}
            className="w-full sm:w-auto text-rose-500 hover:text-rose-600 gap-1.5 ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>恢复出厂示范词库</span>
          </Button>
        </div>
      </div>

      {/* Section 5: App Icon & Desktop Shortcut */}
      <div className="p-6 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <Smartphone className="w-4 h-4 text-indigo-500" />
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            应用图标与快捷方式
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
          <Logo className="w-16 h-16 rounded-2xl shadow-md border border-white/20 shrink-0" size={64} />
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Windows 专属桌面快捷方式
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              桌面上已创建包含高清专属图标的快捷方式，双击即可无地址栏沉浸式打开应用；任务栏与网页标题栏已全面绑定同一高清图标。
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-1 text-xs text-zinc-500">
          <p className="font-semibold text-zinc-700 dark:text-zinc-300">
            手机移动端 PWA 安装提示:
          </p>
          <ul className="space-y-1 list-disc pl-4">
            <li><strong>苹果 iOS (Safari)</strong>: 点击屏幕底部分享按钮 ➔ 选择 <em>“添加到主屏幕”</em>。</li>
            <li><strong>安卓 Android (Chrome/Edge)</strong>: 点击右上角菜单 ➔ 选择 <em>“安装应用”</em> 或 <em>“添加到主屏幕”</em>。</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
