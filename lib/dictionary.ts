export interface DictionaryEntry {
  word: string;
  phonetic?: string;
  phonetics?: { text?: string; audio?: string }[];
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
      example?: string;
      synonyms?: string[];
    }[];
  }[];
}

export interface ExtractedWordInfo {
  word: string;
  phonetic: string;
  pos: string;
  translation?: string;
  definition: string;
  exampleSentence?: string;
  audioUrl?: string;
}

const memoryCache = new Map<string, ExtractedWordInfo>();

export async function lookupWord(word: string): Promise<ExtractedWordInfo | null> {
  const cleanWord = word.trim().toLowerCase().replace(/^[^\w']+|[^\w']+$/g, '');
  if (!cleanWord) return null;

  if (memoryCache.has(cleanWord)) {
    return memoryCache.get(cleanWord)!;
  }

  // 1. Try internal Next.js API route first (which aggregates Youdao Chinese + Dictionary API)
  try {
    const apiRes = await fetch(`/api/lookup?word=${encodeURIComponent(cleanWord)}`);
    if (apiRes.ok) {
      const data: ExtractedWordInfo = await apiRes.json();
      if (data && data.word) {
        memoryCache.set(cleanWord, data);
        return data;
      }
    }
  } catch {
    // API route fetch failed, proceed to fallback
  }

  // 2. Direct fallback in case API route is unavailable
  try {
    // Fallback: Youdao suggest directly or DictionaryAPI
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);
    if (!res.ok) {
      return {
        word: cleanWord,
        phonetic: '',
        pos: 'unknown',
        translation: '',
        definition: '',
      };
    }

    const data: DictionaryEntry[] = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const first = data[0];
    const phonetic =
      first.phonetic ||
      first.phonetics?.find((p) => p.text)?.text ||
      '';
    const audioUrl = first.phonetics?.find((p) => p.audio && p.audio.length > 0)?.audio;

    const firstMeaning = first.meanings?.[0];
    const pos = firstMeaning?.partOfSpeech || 'noun';
    const firstDef = firstMeaning?.definitions?.[0];
    const definition = firstDef?.definition || '';
    const exampleSentence = firstDef?.example || '';

    const result: ExtractedWordInfo = {
      word: cleanWord,
      phonetic,
      pos,
      translation: '',
      definition,
      exampleSentence,
      audioUrl,
    };

    memoryCache.set(cleanWord, result);
    return result;
  } catch (err) {
    console.warn('Dictionary lookup failed:', err);
    return {
      word: cleanWord,
      phonetic: '',
      pos: 'unknown',
      translation: '',
      definition: '',
    };
  }
}

/**
 * Optional Gemini API analysis for rich word memory hooks, root breakdown, and collocations
 */
export async function getGeminiWordInsights(word: string, apiKey: string): Promise<{
  roots?: string;
  mnemonic?: string;
  chineseMeaning?: string;
  contextSentence?: string;
} | null> {
  if (!apiKey) return null;

  try {
    const prompt = `Provide concise English learning insights for the word "${word}" in JSON format with fields:
- "chineseMeaning": Chinese concise translation
- "roots": Word root/etymology breakdown (one sentence)
- "mnemonic": A short, vivid memory aid or mnemonic
- "contextSentence": A natural, everyday example sentence with Chinese translation
Respond ONLY with valid JSON.`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      }),
    });

    if (!res.ok) return null;
    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      return JSON.parse(text);
    }
  } catch (err) {
    console.warn('Gemini request failed', err);
  }
  return null;
}
