// scripts/build-3000-words.js
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('1. Fetching raw CET4 and CET6 vocabulary...');
  const [t4, t6] = await Promise.all([
    fetch('https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/3%20%E5%9B%9B%E7%BA%A7-%E4%B9%B1%E5%BA%8F.txt').then(r => r.text()),
    fetch('https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/4%20%E5%85%AD%E7%BA%A7-%E4%B9%B1%E5%BA%8F.txt').then(r => r.text())
  ]);

  console.log('2. Parsing raw word lines...');
  const parseLines = (text, defaultTag) => {
    const list = [];
    for (const line of text.split('\n')) {
      const parts = line.trim().split('\t');
      if (parts.length >= 2) {
        const rawWord = parts[0].trim().toLowerCase();
        const rawDef = parts[1].trim();
        // Clean word: only letters and hyphens
        if (/^[a-z]+(-[a-z]+)?$/.test(rawWord) && rawWord.length >= 2 && rawDef) {
          list.push({ word: rawWord, def: rawDef, tag: defaultTag });
        }
      }
    }
    return list;
  };

  const cet4List = parseLines(t4, '#四级');
  const cet6List = parseLines(t6, '#六级');

  console.log(`Parsed ${cet4List.length} CET4 words and ${cet6List.length} CET6 words.`);

  // Combine and deduplicate
  const seenWords = new Set();
  const all3000 = [];

  // Pick 1800 CET-4 words
  for (const item of cet4List) {
    if (!seenWords.has(item.word)) {
      seenWords.add(item.word);
      all3000.push(item);
      if (all3000.length >= 1800) break;
    }
  }

  // Pick 1200 CET-6 words to make exactly 3000
  for (const item of cet6List) {
    if (!seenWords.has(item.word)) {
      seenWords.add(item.word);
      all3000.push(item);
      if (all3000.length >= 3000) break;
    }
  }

  // If still less than 3000, add remaining from CET-4
  if (all3000.length < 3000) {
    for (const item of cet4List) {
      if (!seenWords.has(item.word)) {
        seenWords.add(item.word);
        all3000.push(item);
        if (all3000.length >= 3000) break;
      }
    }
  }

  console.log(`Selected exactly ${all3000.length} unique words.`);

  // Parse POS and clean translation
  const structuredWords = all3000.slice(0, 3000).map((item, index) => {
    let pos = 'noun';
    let translation = item.def;

    const posMatch = item.def.match(/^([a-z]+)\.\s*(.+)$/i);
    if (posMatch) {
      const abbrev = posMatch[1].toLowerCase();
      if (abbrev.startsWith('n')) pos = 'noun';
      else if (abbrev.startsWith('v')) pos = 'verb';
      else if (abbrev.startsWith('adj')) pos = 'adjective';
      else if (abbrev.startsWith('adv')) pos = 'adverb';
      else if (abbrev.startsWith('prep')) pos = 'preposition';
      else if (abbrev.startsWith('conj')) pos = 'conjunction';
      translation = posMatch[2].trim();
    }

    const orderIndex = index;
    const dayIndex = Math.floor(index / 20); // 0 to 149 (150 days * 20 words = 3000)

    return {
      word: item.word,
      pos,
      translation,
      definition: translation,
      tags: [item.tag, item.tag === '#四级' ? '#四级高频' : '#六级进阶'],
      orderIndex,
      dayIndex,
    };
  });

  const outFilePath = path.join(__dirname, '..', 'lib', 'cetVocab3000.ts');
  const fileContent = `// Auto-generated 3,000 CET-4 & CET-6 Vocabulary Dataset
// 3,000 words structured across a 150-day learning cycle (20 words / day)
export interface CETVocabItem {
  word: string;
  pos: string;
  translation: string;
  definition: string;
  tags: string[];
  orderIndex: number;
  dayIndex: number; // 0 to 149
}

export const CET_3000_WORDS: CETVocabItem[] = ${JSON.stringify(structuredWords, null, 2)};
`;

  fs.writeFileSync(outFilePath, fileContent, 'utf-8');
  console.log(`Successfully generated ${outFilePath} with 3000 words! File size: ${(fs.statSync(outFilePath).size / 1024).toFixed(1)} KB`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
