import { PronunciationResult } from '@/types';

/**
 * Text-to-Speech wrapper using browser window.speechSynthesis
 */
export class TextToSpeech {
  private static voices: SpeechSynthesisVoice[] = [];
  private static isInitialized = false;

  private static initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    const load = () => {
      TextToSpeech.voices = window.speechSynthesis.getVoices();
      TextToSpeech.isInitialized = true;
    };

    load();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = load;
    }
  }

  public static speak(
    text: string,
    options: {
      lang?: 'en-US' | 'en-GB';
      rate?: number;
      pitch?: number;
      onEnd?: () => void;
    } = {}
  ): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser.');
      return;
    }

    if (!TextToSpeech.isInitialized) {
      TextToSpeech.initVoices();
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const lang = options.lang || 'en-US';
    utterance.lang = lang;
    utterance.rate = options.rate || 0.95;
    utterance.pitch = options.pitch || 1.0;

    // Try finding the most natural native voice matching the language
    const matchedVoice = TextToSpeech.voices.find(
      (v) => v.lang.replace('_', '-') === lang && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Online'))
    ) || TextToSpeech.voices.find((v) => v.lang.replace('_', '-').startsWith(lang.split('-')[0]));

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    if (options.onEnd) {
      utterance.onend = options.onEnd;
    }

    window.speechSynthesis.speak(utterance);
  }

  public static stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

/**
 * Speech Recognition Wrapper (Web Speech API)
 */
export interface SpeechRecognitionController {
  stop: () => void;
  abort: () => void;
}

interface IWindowSpeechRecognition {
  new (): ISpeechRecognition;
}

interface ISpeechRecognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: (event: ISpeechRecognitionEvent) => void;
  onerror: (event: { error: string }) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

export function startSpeechRecognition({
  lang = 'en-US',
  onInterimResult,
  onFinalResult,
  onError,
  onEnd,
}: {
  lang?: string;
  onInterimResult?: (text: string) => void;
  onFinalResult: (text: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}): SpeechRecognitionController | null {
  if (typeof window === 'undefined') return null;

  const SpeechRecognitionConstructor: IWindowSpeechRecognition | undefined =
    (window as unknown as { SpeechRecognition?: IWindowSpeechRecognition; webkitSpeechRecognition?: IWindowSpeechRecognition }).SpeechRecognition ||
    (window as unknown as { SpeechRecognition?: IWindowSpeechRecognition; webkitSpeechRecognition?: IWindowSpeechRecognition }).webkitSpeechRecognition;

  if (!SpeechRecognitionConstructor) {
    if (onError) {
      onError('Speech Recognition is not supported by your browser. Please use Chrome, Edge, or Safari.');
    }
    return null;
  }

  try {
    const recognition = new SpeechRecognitionConstructor();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    let finalTranscript = '';

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += (finalTranscript ? ' ' : '') + item[0].transcript;
        } else {
          interim += item[0].transcript;
        }
      }

      if (interim && onInterimResult) {
        onInterimResult(interim);
      }
      if (finalTranscript) {
        onFinalResult(finalTranscript);
      }
    };

    recognition.onerror = (event: { error: string }) => {
      console.warn('Speech recognition error:', event.error);
      if (onError) {
        let msg = 'Recognition error: ' + event.error;
        if (event.error === 'not-allowed') {
          msg = 'Microphone permission denied. Please enable microphone permissions in your browser.';
        } else if (event.error === 'no-speech') {
          msg = 'No speech was detected. Please try again.';
        }
        onError(msg);
      }
    };

    recognition.onend = () => {
      if (onEnd) onEnd();
    };

    recognition.start();

    return {
      stop: () => {
        try {
          recognition.stop();
        } catch {
          // ignore
        }
      },
      abort: () => {
        try {
          recognition.abort();
        } catch {
          // ignore
        }
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to start microphone';
    if (onError) onError(errorMsg);
    return null;
  }
}

/**
 * Compare target sentence with spoken transcript and calculate accuracy
 */
export function judgePronunciation(targetSentence: string, spokenTranscript: string): PronunciationResult {
  // Normalize strings
  const cleanWord = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/gi, '').trim();

  const targetTokens = targetSentence
    .split(/\s+/)
    .map((w) => ({ raw: w, clean: cleanWord(w) }))
    .filter((w) => w.clean.length > 0);

  const spokenTokens = spokenTranscript
    .split(/\s+/)
    .map(cleanWord)
    .filter((w) => w.length > 0);

  let matchedCount = 0;
  const spokenUsed = new Array(spokenTokens.length).fill(false);

  // Compare words in an approximate sequential alignment
  const wordResults = targetTokens.map((t, idx) => {
    // Look within a small window around the expected position
    const searchStart = Math.max(0, idx - 2);
    const searchEnd = Math.min(spokenTokens.length, idx + 3);

    let matchIdx = -1;
    // Exact match first
    for (let j = searchStart; j < searchEnd; j++) {
      if (!spokenUsed[j] && spokenTokens[j] === t.clean) {
        matchIdx = j;
        break;
      }
    }

    // If no exact match, check whole spoken list for exact match
    if (matchIdx === -1) {
      for (let j = 0; j < spokenTokens.length; j++) {
        if (!spokenUsed[j] && spokenTokens[j] === t.clean) {
          matchIdx = j;
          break;
        }
      }
    }

    if (matchIdx !== -1) {
      spokenUsed[matchIdx] = true;
      matchedCount++;
      return {
        original: t.raw,
        matched: true,
        spoken: spokenTokens[matchIdx],
      };
    }

    return {
      original: t.raw,
      matched: false,
    };
  });

  const score = targetTokens.length > 0
    ? Math.round((matchedCount / targetTokens.length) * 100)
    : 0;

  return {
    transcript: spokenTranscript,
    score,
    words: wordResults,
  };
}
