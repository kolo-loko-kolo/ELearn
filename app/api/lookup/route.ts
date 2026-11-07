import { NextRequest, NextResponse } from 'next/server';
import { CET_3000_WORDS } from '@/lib/cetVocab3000';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawWord = searchParams.get('word') || '';
  const cleanWord = rawWord.trim().toLowerCase().replace(/^[^\w']+|[^\w']+$/g, '');

  if (!cleanWord) {
    return NextResponse.json({ error: 'Word parameter is required' }, { status: 400 });
  }

  // 1. Check if it matches any CET 3000 words for instant high quality offline result
  const cetMatch = CET_3000_WORDS.find((s) => s.word.toLowerCase() === cleanWord);
  if (cetMatch) {
    return NextResponse.json({
      word: cetMatch.word,
      phonetic: `/${cetMatch.word}/`,
      pos: cetMatch.pos || 'noun',
      translation: cetMatch.translation || '',
      definition: cetMatch.definition || '',
      exampleSentence: `Mastering "${cetMatch.word}" is essential for excelling in the CET examination.`,
      exampleTranslation: `掌握 "${cetMatch.word}" 对在大学英语四六级考试中取得佳绩至关重要。`,
    });
  }

  let translation = '';
  let phonetic = '';
  let pos = 'noun';
  let definition = '';
  let exampleSentence = '';
  let audioUrl = '';

  // 2. Fetch Chinese translation from Youdao suggest API
  try {
    const youdaoRes = await fetch(
      `https://dict.youdao.com/suggest?num=1&doctype=json&q=${encodeURIComponent(cleanWord)}`,
      { next: { revalidate: 86400 } }
    );
    if (youdaoRes.ok) {
      const youdaoData = await youdaoRes.json();
      const firstEntry = youdaoData?.data?.entries?.[0];
      if (firstEntry?.explain) {
        translation = firstEntry.explain;
        // Sometimes explain contains part of speech like "adj. 普遍存在的"
        const posMatch = translation.match(/^([a-z]+)\.\s*(.+)$/i);
        if (posMatch) {
          const abbrev = posMatch[1].toLowerCase();
          if (abbrev.startsWith('n')) pos = 'noun';
          else if (abbrev.startsWith('v')) pos = 'verb';
          else if (abbrev.startsWith('adj')) pos = 'adjective';
          else if (abbrev.startsWith('adv')) pos = 'adverb';
          translation = posMatch[2].trim();
        }
      }
    }
  } catch (err) {
    console.warn('Youdao suggest fetch failed:', err);
  }

  // 3. Fallback to MyMemory if Youdao didn't return a translation
  if (!translation) {
    try {
      const myMemoryRes = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanWord)}&langpair=en|zh-CN`,
        { next: { revalidate: 86400 } }
      );
      if (myMemoryRes.ok) {
        const memData = await myMemoryRes.json();
        const text = memData?.responseData?.translatedText;
        if (text && text.toLowerCase() !== cleanWord) {
          translation = text;
        }
      }
    } catch (err) {
      console.warn('MyMemory fetch failed:', err);
    }
  }

  // 4. Fetch phonetic, audio, English definition, and example sentence from dictionaryapi
  try {
    const dictRes = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`,
      { next: { revalidate: 86400 } }
    );
    if (dictRes.ok) {
      const data = await dictRes.json();
      if (Array.isArray(data) && data.length > 0) {
        const first = data[0];
        phonetic =
          first.phonetic ||
          first.phonetics?.find((p: { text?: string }) => p.text)?.text ||
          '';
        audioUrl =
          first.phonetics?.find((p: { audio?: string }) => p.audio && p.audio.length > 0)?.audio || '';

        const firstMeaning = first.meanings?.[0];
        if (firstMeaning) {
          if (!pos || pos === 'noun') {
            pos = firstMeaning.partOfSpeech || pos;
          }
          const firstDef = firstMeaning.definitions?.[0];
          if (firstDef) {
            definition = firstDef.definition || '';
            exampleSentence = firstDef.example || '';
          }
        }
      }
    }
  } catch (err) {
    console.warn('Dictionaryapi fetch failed:', err);
  }

  return NextResponse.json({
    word: cleanWord,
    phonetic,
    pos,
    translation: translation || (definition ? '' : '暂未找到中文释义，可手动输入'),
    definition,
    exampleSentence,
    audioUrl,
  });
}
