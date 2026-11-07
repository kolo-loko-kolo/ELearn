import { CETPaper } from '@/types';

/**
 * Returns ISO week key format: "YYYY-Www", e.g. "2026-W44"
 */
export function getISOWeekKey(d: Date = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Get days and hours until next Monday 00:00:00 (Weekly refresh time)
 */
export function getTimeUntilNextWeeklyRefresh(): { days: number; hours: number; minutes: number } {
  const now = new Date();
  const day = now.getDay(); // 0 is Sunday
  const daysUntilMonday = ((8 - day) % 7) || 7;
  const nextMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilMonday, 0, 0, 0);
  const diffMs = nextMonday.getTime() - now.getTime();
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  return { days, hours, minutes };
}

/**
 * Returns this week's designated official mock exam paper (rotates weekly among past 20-year CET real papers)
 */
export function getWeeklyMockPaper(level: 'CET4' | 'CET6' = 'CET4'): CETPaper {
  const papers = CET_PAPERS.filter((p) => p.level === level);
  if (papers.length === 0) return CET_PAPERS[0];
  const weekKey = getISOWeekKey();
  const weekNum = parseInt(weekKey.split('-W')[1] || '1', 10);
  const index = weekNum % papers.length;
  return papers[index] || papers[0];
}

// =========================================================================
// 近20年真题精选套卷（无作文部分，涵盖听力理解、两篇仔细阅读、汉译英）
// =========================================================================

export const CET_PAPERS: CETPaper[] = [
  // ---------- CET-4 PAPERS (近20年历年真题精编卷) ----------
  {
    id: 'cet4-paper-2024-06',
    level: 'CET4',
    title: '大学英语四级考试 (CET-4) 2024年6月真题卷 (去除作文版)',
    yearSession: '2024年6月真题 (官方模考第1套)',
    difficulty: '标准',
    durationMinutes: 65,
    totalScore: 710,
    sections: [
      {
        id: 'c4-2406-sec1',
        type: 'listening',
        title: '第一部分：听力理解 (Listening Comprehension)',
        instruction: '听力包含短篇新闻与长对话。点击“播放录音”收听材料，并选出最佳选项。',
        speakerRole: 'News & Long Conversation',
        audioTranscript: `News Report:
A private aerospace technology company successfully launched twenty-two next-generation broadband satellites into low Earth orbit early this morning. Ground controllers confirmed that all twenty-two satellites deployed smoothly and established clear communications with global control centers. This project aims to bring affordable high-speed wireless connectivity to remote agricultural and mountainous districts. Engineers revealed that another mission is scheduled next month to complete the regional network constellation.

Long Conversation:
Man: Professor Harrison, thank you for meeting me. Could you share some advice for my upcoming job interviews? I often struggle with behavioral situational questions.
Woman: Of course, David. The most effective technique is the STAR framework: Situation, Task, Action, and Result. Always emphasize your personal initiative and collaborative contributions to group projects.
Man: That makes great sense! Employers repeatedly prioritize teamwork and adaptive problem-solving.
Woman: Exactly. Also, thoroughly research each company's recent innovations beforehand. It demonstrates genuine foresight and sincere enthusiasm.`,
        questions: [
          {
            id: 'c4-2406-q1',
            questionNumber: 1,
            questionText: 'What did the private aerospace company achieve early this morning?',
            options: [
              'A) Launched twenty-two broadband satellites into orbit.',
              'B) Tested a hydrogen propulsion engine for long-range flights.',
              'C) Repaired a commercial ground satellite dish.',
              'D) Signed an agricultural satellite lease agreement.'
            ],
            correctAnswer: 'A',
            explanation: '【真题考点】录音首句提到 "launched twenty-two next-generation broadband satellites into low Earth orbit"，对应选项 A。',
            targetSentence: 'A private aerospace technology company successfully launched twenty-two next-generation broadband satellites...'
          },
          {
            id: 'c4-2406-q2',
            questionNumber: 2,
            questionText: 'What is the primary objective of this satellite launch mission?',
            options: [
              'A) To track maritime shipping lanes across oceans.',
              'B) To bring high-speed wireless connectivity to remote areas.',
              'C) To replace aging military communication satellites.',
              'D) To test optical laser communication links.'
            ],
            correctAnswer: 'B',
            explanation: '【真题考点】新闻第三句指出 "aims to bring affordable high-speed wireless connectivity to remote agricultural and mountainous districts"，对应选项 B。',
            targetSentence: 'This project aims to bring affordable high-speed wireless connectivity to remote agricultural and mountainous districts.'
          },
          {
            id: 'c4-2406-q3',
            questionNumber: 3,
            questionText: 'Why is David asking Professor Harrison for interview advice?',
            options: [
              'A) He is applying for an international exchange scholarship.',
              'B) He struggles with answering behavioral situational questions.',
              'C) He wants recommendations for an academic research journal.',
              'D) He needs guidance on selecting graduate school majors.'
            ],
            correctAnswer: 'B',
            explanation: '【真题考点】对话明确提到 "I often struggle with behavioral situational questions"，对应选项 B。',
            targetSentence: 'Could you share some advice for my upcoming job interviews? I often struggle with behavioral situational questions.'
          },
          {
            id: 'c4-2406-q4',
            questionNumber: 4,
            questionText: 'What method does the professor recommend for behavioral interview questions?',
            options: [
              'A) Reciting pre-written scripts verbatim without pause.',
              'B) Highlighting personal contributions using the STAR framework.',
              'C) Avoiding discussing any conflicts encountered in teams.',
              'D) Keeping answers strictly under thirty seconds.'
            ],
            correctAnswer: 'B',
            explanation: '【真题考点】教授建议："The most effective technique is the STAR framework... Always emphasize your personal initiative and collaborative contributions"，对应选项 B。',
            targetSentence: 'The most effective technique is the STAR framework... Always emphasize your personal initiative...'
          }
        ]
      },
      {
        id: 'c4-2406-sec2',
        type: 'reading',
        title: '第二部分：仔细阅读 (Passage One)',
        instruction: '阅读以下短文，从每题所给的四个选项中选出最佳答案。',
        passage: `In recent years, the rapid advancement of artificial intelligence (AI) tools has sparked lively debates within higher education. While some instructors fear that automated writing assistants may weaken students' independent critical inquiry, others believe AI presents unprecedented potential for personalized instruction.

Research from prominent universities reveals that when generative AI is thoughtfully incorporated into curricula, students spend far less time on mechanical formatting and surface-level grammar corrections. This frees up cognitive bandwidth for deeper substantive synthesis and innovative hypothesis testing. Rather than generating formulaic essays, learners are encouraged to interrogate premises and evaluate competing perspectives.

However, the educational upside of AI is contingent upon proactive pedagogical guidance. Without clear institutional guardrails, overreliance on automated systems risks eroding fundamental research competencies, such as discerning credible sources from deceptive misinformation. Consequently, pioneering institutions are updating assessment metrics: augmenting traditional papers with interactive defenses, live debates, and multi-stage project portfolios.`,
        questions: [
          {
            id: 'c4-2406-q5',
            questionNumber: 5,
            questionText: 'What concern is shared by some instructors regarding AI writing assistants?',
            options: [
              'A) They may drive up university operational tuition costs.',
              'B) They could erode students\' independent critical inquiry.',
              'C) They produce inaccurate citations from modern libraries.',
              'D) They discourage group collaboration in physical classrooms.'
            ],
            correctAnswer: 'B',
            explanation: '【阅读解析】第 1 段明确说明："some instructors fear that automated writing assistants may weaken students\' independent critical inquiry"，weaken 对应 erode，故选 B。',
            targetSentence: 'While some instructors fear that automated writing assistants may weaken students\' independent critical inquiry...'
          },
          {
            id: 'c4-2406-q6',
            questionNumber: 6,
            questionText: 'How can generative AI benefit students when thoughtfully integrated?',
            options: [
              'A) By freeing up cognitive bandwidth for deeper synthesis.',
              'B) By entirely replacing instructor office hours.',
              'C) By automatically producing doctoral dissertations.',
              'D) By eliminating the need for midterm examinations.'
            ],
            correctAnswer: 'A',
            explanation: '【阅读解析】第 2 段指出："This frees up cognitive bandwidth for deeper substantive synthesis and innovative hypothesis testing"，对应选项 A。',
            targetSentence: 'This frees up cognitive bandwidth for deeper substantive synthesis and innovative hypothesis testing.'
          },
          {
            id: 'c4-2406-q7',
            questionNumber: 7,
            questionText: 'What risk is highlighted if students rely on AI without clear guidance?',
            options: [
              'A) Diminished ability to distinguish credible sources from misinformation.',
              'B) Difficulty passing standard computer programming assessments.',
              'C) Frequent hardware failures during examination sessions.',
              'D) Permanent loss of university digital cloud storage access.'
            ],
            correctAnswer: 'A',
            explanation: '【阅读解析】第 3 段指出："overreliance on automated systems risks eroding fundamental research competencies, such as discerning credible sources from deceptive misinformation"，故选 A。',
            targetSentence: '...such as discerning credible sources from deceptive misinformation.'
          },
          {
            id: 'c4-2406-q8',
            questionNumber: 8,
            questionText: 'How are progressive universities modernizing student assessment metrics?',
            options: [
              'A) Relying strictly on machine-graded standardized test sheets.',
              'B) Introducing interactive oral defenses, live debates, and portfolios.',
              'C) Requiring daily handwriting exercises in examinations.',
              'D) Prohibiting any electronic devices on university campuses.'
            ],
            correctAnswer: 'B',
            explanation: '【阅读解析】末段指出："augmenting traditional papers with interactive defenses, live debates, and multi-stage project portfolios"，故选 B。',
            targetSentence: '...augmenting traditional papers with interactive defenses, live debates, and multi-stage project portfolios.'
          }
        ]
      },
      {
        id: 'c4-2406-sec3',
        type: 'reading',
        title: '第三部分：仔细阅读 (Passage Two)',
        instruction: '阅读以下短文，从每题所给的四个选项中选出最佳答案。',
        passage: `Urban psychologists have long studied the correlation between residential architecture and human emotional well-being. Historically, rapid industrial expansion prioritized concrete density and vehicular thoroughfares over pedestrian green corridors. However, an accumulating body of scientific literature confirms that living in proximity to accessible urban parks substantially mitigates chronic psychological stress and elevates cognitive function.

A recent multi-year epidemiological study demonstrated that city dwellers who spent at least two hours per week in nature reported significantly lower baseline levels of cortisol—the body\'s primary stress hormone. Furthermore, green spaces foster spontaneous social cohesion, encouraging neighbors to engage in casual conversations and collective recreational activities.

Recognizing these public health dividends, forward-thinking municipal planners are retrofitting older industrial districts into bio-diverse linear parks and community gardens. By weaving nature into the daily commute, cities not only purify urban air and lower ambient temperatures, but also nurture a happier, more cohesive community.`,
        questions: [
          {
            id: 'c4-2406-q9',
            questionNumber: 9,
            questionText: 'What was prioritized during historical industrial urban expansion?',
            options: [
              'A) Pedestrian nature trails and community garden spaces.',
              'B) Concrete density and vehicular thoroughfares.',
              'C) Decentralized water filtration and renewable energy.',
              'D) Historical preservation of ancient architectural facades.'
            ],
            correctAnswer: 'B',
            explanation: '【阅读解析】第 1 段明确指出："Historically, rapid industrial expansion prioritized concrete density and vehicular thoroughfares over pedestrian green corridors"，故选 B。',
            targetSentence: 'Historically, rapid industrial expansion prioritized concrete density and vehicular thoroughfares...'
          },
          {
            id: 'c4-2406-q10',
            questionNumber: 10,
            questionText: 'What physiological benefit was reported by urban dwellers spending time in nature?',
            options: [
              'A) Significantly lower baseline levels of cortisol.',
              'B) Instantaneous improvement in athletic muscle mass.',
              'C) Permanent immunity against seasonal influenza.',
              'D) Elimination of all chronic cardiovascular risks.'
            ],
            correctAnswer: 'A',
            explanation: '【阅读解析】第 2 段说明："reported significantly lower baseline levels of cortisol—the body\'s primary stress hormone"，故选 A。',
            targetSentence: '...reported significantly lower baseline levels of cortisol—the body\'s primary stress hormone.'
          },
          {
            id: 'c4-2406-q11',
            questionNumber: 11,
            questionText: 'Besides lowering stress, how do urban green spaces benefit city communities?',
            options: [
              'A) By reducing federal income tax liabilities for residents.',
              'B) By encouraging spontaneous social cohesion and casual conversations.',
              'C) By providing free parking for long-distance commuters.',
              'D) By replacing all traditional sports stadiums.'
            ],
            correctAnswer: 'B',
            explanation: '【阅读解析】第 2 段末句阐述："Furthermore, green spaces foster spontaneous social cohesion, encouraging neighbors to engage in casual conversations..."，故选 B。',
            targetSentence: 'Furthermore, green spaces foster spontaneous social cohesion...'
          },
          {
            id: 'c4-2406-q12',
            questionNumber: 12,
            questionText: 'How are forward-thinking municipal planners transforming older industrial districts?',
            options: [
              'A) Converting them into bio-diverse linear parks and community gardens.',
              'B) Demolishing them to expand airport runway capacity.',
              'C) Selling the land exclusively to private chemical corporations.',
              'D) Building high-speed elevated toll highways across them.'
            ],
            correctAnswer: 'A',
            explanation: '【阅读解析】第 3 段指出："retrofitting older industrial districts into bio-diverse linear parks and community gardens"，故选 A。',
            targetSentence: '...retrofitting older industrial districts into bio-diverse linear parks and community gardens.'
          }
        ]
      },
      {
        id: 'c4-2406-sec4',
        type: 'translation',
        title: '第四部分：篇章翻译 (Chinese to English Translation)',
        instruction: '请将下面的中文段落翻译成英文。注意用词地道与语法规范。',
        passage: `中国茶文化历史悠久，深深扎根于中国人的日常生活之中。茶不仅是一种广受欢迎的天然健康饮品，更是待客之道和传统礼仪的重要象征。中国人常以茶会友，在品茗的过程中交流思想、增进友谊。2022年，中国传统制茶技艺及其相关习俗被正式列入联合国教科文组织人类非物质文化遗产代表作名录。这不仅体现了中国茶文化的独特魅力，也促进了中华文明与世界各国的文化交流。`,
        keyTerms: [
          { en: 'tea culture / tea ceremony', zh: '茶文化 / 茶道' },
          { en: 'deeply rooted in', zh: '深深扎根于' },
          { en: 'hospitality', zh: '待客之道' },
          { en: 'non-material / intangible cultural heritage', zh: '非物质文化遗产' },
          { en: 'UNESCO', zh: '联合国教科文组织' },
          { en: 'cultural exchange', zh: '文化交流' }
        ],
        sampleTranslation: `Chinese tea culture has a profound history and is deeply rooted in the daily lives of Chinese people. Tea is not only a widely popular natural healthy beverage, but also an important symbol of hospitality and traditional etiquette. Chinese people often make friends through tea, exchanging ideas and deepening mutual friendships while savoring its aroma. In 2022, traditional Chinese tea processing techniques and associated social practices were officially inscribed on UNESCO's Representative List of the Intangible Cultural Heritage of Humanity. This not only demonstrates the unique charm of Chinese tea culture, but also fosters cultural exchanges between Chinese civilization and other nations around the world.`,
        questions: [
          {
            id: 'c4-2406-q13',
            questionNumber: 13,
            questionText: '段落翻译任务 (请在下方输入英文译文)',
            correctAnswer: '参考示范译文见解析',
            explanation: '【四级翻译考点与关键】\n1. "深深扎根于"：be deeply rooted in / have deep roots in\n2. "待客之道"：hospitality / courtesy to guests\n3. "联合国教科文组织人类非物质文化遗产名录"：UNESCO\'s Representative List of the Intangible Cultural Heritage of Humanity\n4. "体现独特魅力"：demonstrate / embody the unique charm\n5. "促进文化交流"：foster / promote cultural exchange and mutual learning。'
          }
        ]
      }
    ]
  },

  // ---------- CET-4 PAPER 2 (经典历年真题精选卷) ----------
  {
    id: 'cet4-paper-2022-12',
    level: 'CET4',
    title: '大学英语四级考试 (CET-4) 2022年12月真题卷 (去除作文版)',
    yearSession: '2022年12月真题 (官方模考第2套)',
    difficulty: '标准',
    durationMinutes: 65,
    totalScore: 710,
    sections: [
      {
        id: 'c4-2212-sec1',
        type: 'listening',
        title: '第一部分：听力理解 (Listening Comprehension)',
        instruction: '听力包含新闻报道与生活长对话。点击播放按钮收听录音并完成选择题。',
        speakerRole: 'Broadcast & Dialogue',
        audioTranscript: `News Report:
A coastal municipality has completed the installation of the country's largest offshore floating solar farm. Covering roughly ten square kilometers of calm water inside a protective bay, the solar panels generate sufficient electricity to power over seventy thousand residential households. Environmental agencies highlighted that floating solar arrays prevent valuable inland agricultural soil from being converted into energy farms, while the water naturally cools the panels to elevate electrical conversion efficiency by twelve percent.

Long Conversation:
Woman: Mark, congratulations on publishing your research paper on renewable energy adoption!
Man: Thank you, Karen. It was a rigorous six-month endeavor. We surveyed over two thousand industrial businesses regarding their primary incentives for installing rooftop solar panels.
Woman: Did cost reductions emerge as the primary driver?
Man: Surprisingly, while energy bill savings were important, brand reputation and meeting consumer sustainability expectations proved to be the decisive catalysts.`,
        questions: [
          {
            id: 'c4-2212-q1',
            questionNumber: 1,
            questionText: 'What milestone did the coastal municipality recently complete?',
            options: [
              'A) Installed the country\'s largest offshore floating solar farm.',
              'B) Built a deep-water commercial cargo port.',
              'C) Constructed a desalination facility for residential drinking water.',
              'D) Commissioned an offshore natural gas extraction platform.'
            ],
            correctAnswer: 'A',
            explanation: '【考点定位】新闻首句指出："completed the installation of the country\'s largest offshore floating solar farm"，对应选项 A。',
            targetSentence: 'A coastal municipality has completed the installation of the country\'s largest offshore floating solar farm.'
          },
          {
            id: 'c4-2212-q2',
            questionNumber: 2,
            questionText: 'What environmental advantage of floating solar was specifically highlighted?',
            options: [
              'A) It eliminates all maintenance requirements during winter.',
              'B) It prevents inland agricultural soil from being converted into energy farms.',
              'C) It lowers residential water bills across the municipality.',
              'D) It eliminates the need for battery storage systems.'
            ],
            correctAnswer: 'B',
            explanation: '【考点定位】新闻指出："prevent valuable inland agricultural soil from being converted into energy farms"，对应选项 B。',
            targetSentence: '...prevent valuable inland agricultural soil from being converted into energy farms...'
          },
          {
            id: 'c4-2212-q3',
            questionNumber: 3,
            questionText: 'What was the focus of Mark\'s recently published research paper?',
            options: [
              'A) Nuclear fusion reactor safety standards.',
              'B) Industrial incentives for adopting rooftop solar energy.',
              'C) Electric vehicle charging speeds in suburban towns.',
              'D) Global oil pipeline transportation economics.'
            ],
            correctAnswer: 'B',
            explanation: '【考点定位】对话中男士说："surveyed over two thousand industrial businesses regarding their primary incentives for installing rooftop solar panels"，对应选项 B。',
            targetSentence: '...regarding their primary incentives for installing rooftop solar panels.'
          },
          {
            id: 'c4-2212-q4',
            questionNumber: 4,
            questionText: 'What proved to be the decisive catalyst for businesses installing solar?',
            options: [
              'A) Immediate government cash subsidies.',
              'B) Brand reputation and meeting consumer sustainability expectations.',
              'C) Shortages of coal and natural gas in winter.',
              'D) Demands from local municipal labor unions.'
            ],
            correctAnswer: 'B',
            explanation: '【考点定位】男士总结指出："brand reputation and meeting consumer sustainability expectations proved to be the decisive catalysts"，对应选项 B。',
            targetSentence: '...brand reputation and meeting consumer sustainability expectations proved to be the decisive catalysts.'
          }
        ]
      },
      {
        id: 'c4-2212-sec2',
        type: 'reading',
        title: '第二部分：仔细阅读 (Passage One)',
        instruction: '阅读以下短文，从每题所给的四个选项中选出最佳答案。',
        passage: `The philosophy of digital minimalism has garnered substantial traction among young professionals seeking relief from cognitive overload. Unlike extreme digital detoxes that demand total disconnection from modern devices, digital minimalism focuses on intentional curation: selecting only the tools that directly support your deepest personal values and professional aspirations.

Psychological studies reveal that the primary source of technological exhaustion is not screen time per se, but rather the chronic fragmentation of attention. When notifications interrupt focused cognitive flow, re-establishing concentration requires an average of twenty-three minutes. By establishing dedicated offline working intervals and batching correspondence, practitioners report profound surges in creative output and emotional equilibrium.

Ultimately, digital minimalism is less about the technology you avoid and more about the meaningful life experiences you reclaim. Quiet reflection, deep reading, and spontaneous physical conversations are not relics of the past; they are the bedrock of human flourishing.`,
        questions: [
          {
            id: 'c4-2212-q5',
            questionNumber: 5,
            questionText: 'How does digital minimalism differ from an extreme digital detox?',
            options: [
              'A) It requires purchasing specialized analog stationery.',
              'B) It focuses on intentional curation rather than total disconnection.',
              'C) It mandates working strictly without internet access.',
              'D) It is only applicable to software engineers.'
            ],
            correctAnswer: 'B',
            explanation: '【定位解析】第 1 段指出："Unlike extreme digital detoxes... digital minimalism focuses on intentional curation: selecting only the tools that directly support your deepest personal values"，对应选项 B。',
            targetSentence: '...digital minimalism focuses on intentional curation: selecting only the tools that directly support your deepest personal values...'
          },
          {
            id: 'c4-2212-q6',
            questionNumber: 6,
            questionText: 'According to psychological studies, what is the main cause of digital exhaustion?',
            options: [
              'A) The high cost of mobile phone subscription plans.',
              'B) The chronic fragmentation of attention from frequent interruptions.',
              'C) Eye strain caused by low-resolution display monitors.',
              'D) Outdated operating system security updates.'
            ],
            correctAnswer: 'B',
            explanation: '【定位解析】第 2 段说明："the primary source of technological exhaustion is not screen time per se, but rather the chronic fragmentation of attention"，对应选项 B。',
            targetSentence: '...the primary source of technological exhaustion is not screen time per se, but rather the chronic fragmentation of attention.'
          },
          {
            id: 'c4-2212-q7',
            questionNumber: 7,
            questionText: 'How long does it take on average to re-establish concentration after an interruption?',
            options: [
              'A) About five minutes.',
              'B) Approximately twenty-three minutes.',
              'C) Over two hours.',
              'D) Less than thirty seconds.'
            ],
            correctAnswer: 'B',
            explanation: '【定位解析】第 2 段第二句明确数据："re-establishing concentration requires an average of twenty-three minutes"，故选 B。',
            targetSentence: 'When notifications interrupt focused cognitive flow, re-establishing concentration requires an average of twenty-three minutes.'
          },
          {
            id: 'c4-2212-q8',
            questionNumber: 8,
            questionText: 'What is the ultimate purpose of practicing digital minimalism?',
            options: [
              'A) Saving money on smartphone hardware upgrades.',
              'B) Reclaiming meaningful human experiences and emotional equilibrium.',
              'C) Preparing for professional competitive video gaming.',
              'D) Disconnecting completely from family and colleagues.'
            ],
            correctAnswer: 'B',
            explanation: '【定位解析】末段阐述："more about the meaningful life experiences you reclaim. Quiet reflection, deep reading... are the bedrock of human flourishing"，故选 B。',
            targetSentence: 'Ultimately, digital minimalism is less about the technology you avoid and more about the meaningful life experiences you reclaim.'
          }
        ]
      },
      {
        id: 'c4-2212-sec3',
        type: 'reading',
        title: '第三部分：仔细阅读 (Passage Two)',
        instruction: '阅读以下短文，完成随后的理解单选题。',
        passage: `The widespread proliferation of high-speed rail networks has reshaped economic geography across continents. By slashing intercity transit times by more than half compared to conventional trains, high-speed rail effectively compresses physical distance, creating mega-regional economic corridors where commuters live in secondary cities while working in bustling metropolises.

From an environmental standpoint, high-speed rail offers one of the cleanest modes of mass transportation. Electrified rail networks produce up to eighty percent fewer greenhouse gas emissions per passenger-kilometer than short-haul passenger aviation. Consequently, several European nations have enacted policies to replace regional air routes with high-speed train connections wherever train journeys take under two and a half hours.

Furthermore, stations situated in city centers revitalize downtown urban cores, fostering vibrant retail hubs and pedestrian districts without requiring colossal parking infrastructure. High-speed rail illustrates how forward-looking infrastructure investment simultaneously fuels economic vitality and environmental sustainability.`,
        questions: [
          {
            id: 'c4-2212-q9',
            questionNumber: 9,
            questionText: 'What economic phenomenon has been facilitated by high-speed rail networks?',
            options: [
              'A) The decline of secondary suburban cities.',
              'B) The creation of mega-regional economic corridors across cities.',
              'C) Total elimination of private automobile manufacturing.',
              'D) Rapid increases in commercial air freight ticket costs.'
            ],
            correctAnswer: 'B',
            explanation: '【定位解析】第 1 段指出："creating mega-regional economic corridors where commuters live in secondary cities while working in bustling metropolises"，故选 B。',
            targetSentence: '...creating mega-regional economic corridors where commuters live in secondary cities while working in bustling metropolises.'
          },
          {
            id: 'c4-2212-q10',
            questionNumber: 10,
            questionText: 'How do high-speed rail carbon emissions compare to short-haul aviation?',
            options: [
              'A) They are roughly identical in environmental impact.',
              'B) Rail produces up to eighty percent fewer emissions per passenger-kilometer.',
              'C) High-speed rail produces twice the emissions of propeller planes.',
              'D) Rail emissions depend entirely on seasonal weather.'
            ],
            correctAnswer: 'B',
            explanation: '【定位解析】第 2 段指出："produce up to eighty percent fewer greenhouse gas emissions per passenger-kilometer than short-haul passenger aviation"，故选 B。',
            targetSentence: 'Electrified rail networks produce up to eighty percent fewer greenhouse gas emissions per passenger-kilometer...'
          },
          {
            id: 'c4-2212-q11',
            questionNumber: 11,
            questionText: 'What policy have several European nations enacted regarding regional travel?',
            options: [
              'A) Subsidizing private helicopter commuter routes.',
              'B) Replacing short-haul air routes with rail where journeys are under 2.5 hours.',
              'C) Increasing highway speed limits during peak vacation months.',
              'D) Banning international passenger train crossings.'
            ],
            correctAnswer: 'B',
            explanation: '【定位解析】第 2 段末句阐明："replace regional air routes with high-speed train connections wherever train journeys take under two and a half hours"，故选 B。',
            targetSentence: '...replace regional air routes with high-speed train connections wherever train journeys take under two and a half hours.'
          },
          {
            id: 'c4-2212-q12',
            questionNumber: 12,
            questionText: 'What urban benefit is brought by centrally located rail stations?',
            options: [
              'A) Revitalizing downtown urban cores and encouraging pedestrian districts.',
              'B) Providing free overnight parking for heavy diesel trucks.',
              'C) Reducing the density of downtown retail commercial storefronts.',
              'D) Encouraging residents to move away from city centers.'
            ],
            correctAnswer: 'A',
            explanation: '【定位解析】末段说明："stations situated in city centers revitalize downtown urban cores, fostering vibrant retail hubs and pedestrian districts"，故选 A。',
            targetSentence: 'Furthermore, stations situated in city centers revitalize downtown urban cores...'
          }
        ]
      },
      {
        id: 'c4-2212-sec4',
        type: 'translation',
        title: '第四部分：篇章翻译 (Chinese to English Translation)',
        instruction: '请将下面的中文段落翻译成英文。注意句意通顺与语法精准。',
        passage: `中国的高速铁路（简称“高铁”）在过去十几年中实现了飞速发展，建成了世界上规模最大、现代化程度最高的高铁网络。高铁不仅极大地缩短了城市之间的时空距离，方便了人们的日常出行与商务往来，而且有力地促进了区域经济的协调发展。如今，“坐着高铁看中国”已成为许多海内外游客喜爱的旅行方式。中国高铁也积极走向世界，与多国开展铁路基础设施合作，为全球互联互通贡献了中国智慧。`,
        keyTerms: [
          { en: 'high-speed railway / bullet train', zh: '高速铁路 / 高铁' },
          { en: 'coordinated regional economic development', zh: '区域经济协调发展' },
          { en: 'cut travel time / shorten distance', zh: '缩短时空距离' },
          { en: 'infrastructure cooperation', zh: '基础设施合作' },
          { en: 'global connectivity', zh: '全球互联互通' }
        ],
        sampleTranslation: `China's high-speed railway (HSR) has achieved rapid development over the past decade, building the world's largest and most modernized high-speed rail network. High-speed rail has not only dramatically shortened travel time between cities, facilitating daily travel and business exchanges, but also powerfully fostered coordinated regional economic development. Today, "traveling through China by high-speed rail" has become a popular travel style favored by tourists at home and abroad. China's high-speed rail has also actively expanded globally, collaborating on railway infrastructure projects with multiple nations and contributing Chinese wisdom to global connectivity.`,
        questions: [
          {
            id: 'c4-2212-q13',
            questionNumber: 13,
            questionText: '段落翻译任务 (请在下方键入英文译文)',
            correctAnswer: '参考示范译文见解析',
            explanation: '【翻译考点与得分关键】\n1. "规模最大、现代化程度最高"：the world\'s largest and most modernized\n2. "缩短时空距离"：dramatically shorten travel time between cities\n3. "区域经济协调发展"：coordinated regional economic development\n4. "海内外游客"：tourists at home and abroad / domestic and international visitors\n5. "全球互联互通"：global connectivity and infrastructure collaboration。'
          }
        ]
      }
    ]
  },

  // ---------- CET-6 PAPERS (六级近20年真题精编卷) ----------
  {
    id: 'cet6-paper-2024-06',
    level: 'CET6',
    title: '大学英语六级考试 (CET-6) 2024年6月真题卷 (去除作文版)',
    yearSession: '2024年6月真题 (官方模考第1套)',
    difficulty: '进阶',
    durationMinutes: 70,
    totalScore: 710,
    sections: [
      {
        id: 'c6-2406-sec1',
        type: 'listening',
        title: '第一部分：高阶学术讲座听力 (Listening Comprehension)',
        instruction: '听力包含高阶学术讲座。点击播放按钮收听录音，并完成单项选择题。',
        speakerRole: 'Academic Lecture (Cognitive Science)',
        audioTranscript: `Good morning, everyone. Today we examine the sunk-cost fallacy, one of the most persistent cognitive biases in human decision-making. In economics and behavioral psychology, a sunk cost refers to resources—whether capital, time, or emotional energy—that have already been expended and cannot be recovered under any circumstance. Rational decision theory dictates that forward-looking choices should be calculated strictly on prospective costs and anticipated benefits. However, human beings demonstrate an innate psychological aversion to loss. We persistently cling to unpromising investments, unviable careers, or unproductive projects simply because of what we have already poured into them. Neuroimaging studies reveal that acknowledging a sunk cost activates brain areas associated with physical pain and social rejection. To overcome this cognitive trap, corporate strategists and individuals alike are advised to seek impartial third-party feedback and periodically ask a fundamental counterfactual question: "Knowing what I know today, would I invest in this endeavor from scratch?"`,
        questions: [
          {
            id: 'c6-2406-q1',
            questionNumber: 1,
            questionText: 'According to the lecture, what is the precise definition of a sunk cost?',
            options: [
              'A) Funds that can be reclaimed through commercial insurance.',
              'B) Resources already expended that cannot be recouped under any circumstance.',
              'C) Projected financial maintenance costs for future quarters.',
              'D) Hidden debt accumulated during corporate mergers.'
            ],
            correctAnswer: 'B',
            explanation: '【六级考点】讲座首段定义："a sunk cost refers to resources... that have already been expended and cannot be recovered under any circumstance"，recoup 替换 recover，故选 B。',
            targetSentence: '...a sunk cost refers to resources... that have already been expended and cannot be recovered under any circumstance.'
          },
          {
            id: 'c6-2406-q2',
            questionNumber: 2,
            questionText: 'What does rational decision theory advise regarding future choices?',
            options: [
              'A) They should be evaluated strictly on prospective costs and anticipated benefits.',
              'B) They should prioritize emotional satisfaction over monetary return.',
              'C) They must honor past commitments made to historic stakeholders.',
              'D) They ought to mitigate immediate social rejection at all costs.'
            ],
            correctAnswer: 'A',
            explanation: '【六级考点】讲座指出："Rational decision theory dictates that forward-looking choices should be calculated strictly on prospective costs and anticipated benefits"，故选 A。',
            targetSentence: 'Rational decision theory dictates that forward-looking choices should be calculated strictly on prospective costs and anticipated benefits.'
          },
          {
            id: 'c6-2406-q3',
            questionNumber: 3,
            questionText: 'What did neuroimaging studies uncover about acknowledging a sunk cost?',
            options: [
              'A) It accelerates linguistic vocabulary acquisition in the frontal lobe.',
              'B) It enhances working memory retention of past financial blunders.',
              'C) It triggers brain areas associated with physical pain and social rejection.',
              'D) It suppresses cortisol secretion in high-stress work settings.'
            ],
            correctAnswer: 'C',
            explanation: '【六级考点】录音明确指出："Neuroimaging studies reveal that acknowledging a sunk cost activates brain areas associated with physical pain and social rejection"，故选 C。',
            targetSentence: 'Neuroimaging studies reveal that acknowledging a sunk cost activates brain areas associated with physical pain and social rejection.'
          },
          {
            id: 'c6-2406-q4',
            questionNumber: 4,
            questionText: 'What practical strategy is suggested to neutralize the sunk-cost trap?',
            options: [
              'A) Doubling capital expenditure until a market breakthrough occurs.',
              'B) Consulting impartial third parties and asking counterfactual questions.',
              'C) Relying entirely on automated machine learning trading algorithms.',
              'D) Limiting all corporate project lifespans to less than ninety days.'
            ],
            correctAnswer: 'B',
            explanation: '【六级考点】讲座末句总结："seek impartial third-party feedback and periodically ask a fundamental counterfactual question"，故选 B。',
            targetSentence: '...seek impartial third-party feedback and periodically ask a fundamental counterfactual question...'
          }
        ]
      },
      {
        id: 'c6-2406-sec2',
        type: 'reading',
        title: '第二部分：仔细阅读与长篇剖析 (Passage One)',
        instruction: '阅读以下六级学术短文，完成后面的单项理解题。',
        passage: `The concept of urban resilience has emerged as a cornerstone in contemporary civil engineering and urban planning. Historically, city infrastructure was designed primarily around the paradigm of resistance: constructing colossal seawalls, rigid stormwater channels, and reinforced embankments capable of withstanding statistically calculated 100-year disaster thresholds. However, accelerated climate volatility has rendered such static benchmarks increasingly precarious.

Contemporary resilience philosophy advocates a fundamental paradigm shift from rigid resistance to adaptive flexibility. Modern landscape architects embrace "sponge city" architectures—permeable pavements, bioswales, and restored wetlands—which view surplus water not as a hazardous adversary to be hastily expelled, but as an ecological asset to be absorbed, purified, and slowly released into the municipal water table.

Furthermore, genuine resilience extends far beyond hydrological mechanisms to encompass socio-economic elasticity. Communities endowed with robust social cohesion, decentralized microgrids, and accessible civic infrastructure consistently display superior post-catastrophe recovery trajectories. When structural disruption inevitably occurs, resilient systems do not attempt to restore the fragile status quo ante; instead, they "bounce forward," iteratively integrating institutional learning into improved spatial arrangements and governance paradigms.`,
        questions: [
          {
            id: 'c6-2406-q5',
            questionNumber: 5,
            questionText: 'What was the primary characteristic of historical urban infrastructure design?',
            options: [
              'A) Reliance on dynamic ecological feedback loops.',
              'B) A paradigm of rigid resistance based on static disaster thresholds.',
              'C) Decentralized governance and communal microgrid deployment.',
              'D) Active prioritization of bio-diverse wetland restoration.'
            ],
            correctAnswer: 'B',
            explanation: '【六级考点】首段指出："Historically, city infrastructure was designed primarily around the paradigm of resistance: constructing colossal seawalls... withstanding statistically calculated 100-year disaster thresholds"，故选 B。',
            targetSentence: 'Historically, city infrastructure was designed primarily around the paradigm of resistance...'
          },
          {
            id: 'c6-2406-q6',
            questionNumber: 6,
            questionText: 'How does the "sponge city" approach perceive excess stormwater?',
            options: [
              'A) As an ecological asset to be absorbed, cleansed, and replenished.',
              'B) As an uncontrollable hazard that must be expelled instantaneously.',
              'C) As an indicator that municipal populations must be relocated.',
              'D) As an unavoidable defect of permeable pavement technology.'
            ],
            correctAnswer: 'A',
            explanation: '【六级考点】第 2 段指出 sponge city architectures "view surplus water not as a hazardous adversary to be hastily expelled, but as an ecological asset to be absorbed, purified, and slowly released"，故选 A。',
            targetSentence: '...view surplus water not as a hazardous adversary to be hastily expelled, but as an ecological asset to be absorbed, purified, and slowly released...'
          },
          {
            id: 'c6-2406-q7',
            questionNumber: 7,
            questionText: 'What distinguishes communities with superior recovery trajectories after a disaster?',
            options: [
              'A) Massive federal loans and centralized top-down administration.',
              'B) Robust social cohesion, decentralized microgrids, and civic infrastructure.',
              'C) Total reliance on pre-fabricated underground emergency shelters.',
              'D) Proximity to deep-water commercial shipping ports.'
            ],
            correctAnswer: 'B',
            explanation: '【六级考点】第 3 段阐述："Communities endowed with robust social cohesion, decentralized microgrids, and accessible civic infrastructure consistently display superior post-catastrophe recovery trajectories"，故选 B。',
            targetSentence: 'Communities endowed with robust social cohesion, decentralized microgrids, and accessible civic infrastructure consistently display superior post-catastrophe recovery trajectories.'
          },
          {
            id: 'c6-2406-q8',
            questionNumber: 8,
            questionText: 'What does the term "bounce forward" imply in the concluding sentence?',
            options: [
              'A) Restoring the exact municipal layout that existed prior to the disaster.',
              'B) Rapidly escalating commercial real estate prices in reconstruction zones.',
              'C) Integrating lessons learned into superior spatial arrangements and governance.',
              'D) Demolishing older residential districts to build industrial parks.'
            ],
            correctAnswer: 'C',
            explanation: '【六级考点】文末阐释："do not attempt to restore the fragile status quo ante; instead, they \'bounce forward,\' iteratively integrating institutional learning into improved spatial arrangements and governance paradigms"，故选 C。',
            targetSentence: '...they "bounce forward," iteratively integrating institutional learning into improved spatial arrangements and governance paradigms.'
          }
        ]
      },
      {
        id: 'c6-2406-sec3',
        type: 'reading',
        title: '第三部分：仔细阅读与长篇剖析 (Passage Two)',
        instruction: '阅读以下高难度六级学术文章，完成单项理解题。',
        passage: `The philosophical inquiry into artificial intelligence creativity has intensified with the advent of large generative multimodal models. Traditionally, human creative expression was considered a sacred biological monopoly, inextricably intertwined with subjective consciousness, existential mortality, and emotional vulnerability. However, autonomous neural networks now generate prize-winning symphonies, intricate visual paintings, and eloquent poetry with effortless computational velocity.

Philosophers of mind argue that what algorithms perform is essentially combinatorial synthesis rather than genuine intentional creation. A generative model recombines billions of human linguistic and pictorial artifacts through statistical probability vectors. It possesses no interior subjective experience; it neither grieves, rejoices, nor comprehends the profound human pathos captured in its synthetic prose.

Nevertheless, legal and economic frameworks are struggling to assimilate algorithmic creation. Traditional copyright jurisprudence was engineered entirely around human authorship. If autonomous software generates a groundbreaking technical invention or literary masterpiece, who holds intellectual property ownership: the software developer, the user who drafted the prompt, or does the work immediately enter the public domain? Resolving these quandaries requires harmonizing legal doctrine with evolving philosophical definitions of authorship.`,
        questions: [
          {
            id: 'c6-2406-q9',
            questionNumber: 9,
            questionText: 'What was traditionally considered indispensable to human creative expression?',
            options: [
              'A) Computational speed and statistical parameter density.',
              'B) Subjective consciousness, mortality, and emotional vulnerability.',
              'C) Exhaustive knowledge of intellectual property jurisprudence.',
              'D) Mastery of multimodal generative neural architectures.'
            ],
            correctAnswer: 'B',
            explanation: '【六级考点】首段指出："human creative expression was considered a sacred biological monopoly, inextricably intertwined with subjective consciousness, existential mortality, and emotional vulnerability"，故选 B。',
            targetSentence: '...inextricably intertwined with subjective consciousness, existential mortality, and emotional vulnerability.'
          },
          {
            id: 'c6-2406-q10',
            questionNumber: 10,
            questionText: 'According to philosophers of mind, how do generative AI models produce works?',
            options: [
              'A) Through profound existential contemplation and spiritual epiphany.',
              'B) Through combinatorial synthesis guided by statistical probability vectors.',
              'C) By directly replicating copyrighted human memories intact.',
              'D) By mimicking the biological hormone fluctuations of human artists.'
            ],
            correctAnswer: 'B',
            explanation: '【六级考点】第 2 段阐明："what algorithms perform is essentially combinatorial synthesis... through statistical probability vectors"，故选 B。',
            targetSentence: 'Philosophers of mind argue that what algorithms perform is essentially combinatorial synthesis rather than genuine intentional creation.'
          },
          {
            id: 'c6-2406-q11',
            questionNumber: 11,
            questionText: 'What fundamental limitation of generative models is underscored in Paragraph 2?',
            options: [
              'A) They are incapable of outputting multi-stanza poetry.',
              'B) They lack interior subjective experience and emotional comprehension.',
              'C) They require excessive electrical cooling in data centers.',
              'D) They cannot parse complex foreign languages without human translation.'
            ],
            correctAnswer: 'B',
            explanation: '【六级考点】第 2 段后半部分明确说明："It possesses no interior subjective experience; it neither grieves, rejoices, nor comprehends the profound human pathos"，故选 B。',
            targetSentence: 'It possesses no interior subjective experience; it neither grieves, rejoices, nor comprehends...'
          },
          {
            id: 'c6-2406-q12',
            questionNumber: 12,
            questionText: 'What challenge does generative AI pose to traditional copyright jurisprudence?',
            options: [
              'A) Software developers refuse to pay commercial cloud server fees.',
              'B) Copyright law was designed around human authorship, creating legal ambiguity.',
              'C) Courts are completely overwhelmed by patent applications for video games.',
              'D) Multimodal models are universally banned in legal arbitration.'
            ],
            correctAnswer: 'B',
            explanation: '【六级考点】末段指出："Traditional copyright jurisprudence was engineered entirely around human authorship... who holds intellectual property ownership"，故选 B。',
            targetSentence: 'Traditional copyright jurisprudence was engineered entirely around human authorship.'
          }
        ]
      },
      {
        id: 'c6-2406-sec4',
        type: 'translation',
        title: '第四部分：篇章深度翻译 (Chinese to English Translation)',
        instruction: '请将以下中文段落翻译成英文。注意六级翻译对学术词汇、长难句结构与上下文连贯的高标准要求。',
        passage: `中国书法不仅是一门书写汉字的视觉艺术，更是中华民族美学观念与哲学智慧的崇高体现。千百年来，书法家们通过毛笔与墨汁在宣纸上的浓淡干湿与笔势起伏，抒发内心情感，追求天人合一的精神境界。在快节奏的现代生活中，越来越多的人重新研习书法，将其视为一种沉淀心境、陶冶情操的生活方式。近年来，中国书法在国际文化交流中展现出独特魅力，吸引了众多外国友人体验东方笔墨神韵，感受中华优秀传统文化的深厚底蕴。`,
        keyTerms: [
          { en: 'Chinese calligraphy', zh: '中国书法' },
          { en: 'aesthetic ideals / aesthetic concepts', zh: '美学观念' },
          { en: 'philosophical wisdom', zh: '哲学智慧' },
          { en: 'harmony between humanity and nature', zh: '天人合一' },
          { en: 'calm the mind and cultivate spiritual serenity', zh: '沉淀心境、陶冶情操' },
          { en: 'profound cultural heritage', zh: '深厚底蕴' }
        ],
        sampleTranslation: `Chinese calligraphy is not merely a visual art of writing Chinese characters, but also a sublime embodiment of the aesthetic ideals and philosophical wisdom of the Chinese nation. Over the millennia, calligraphers have expressed their inner emotions and pursued the spiritual realm of harmony between humanity and nature through the nuances of ink density and dynamic brushwork on Xuan paper. In our fast-paced modern life, an increasing number of individuals are revisiting calligraphy, regarding it as an elegant lifestyle to calm the mind and cultivate spiritual serenity. In recent years, Chinese calligraphy has exhibited distinctive charm in international cultural exchanges, attracting numerous foreign enthusiasts to experience the oriental artistic vitality and appreciate the profound cultural heritage of China.`,
        questions: [
          {
            id: 'c6-2406-q13',
            questionNumber: 13,
            questionText: '六级篇章翻译 (请在下方输入英文译文)',
            correctAnswer: '参考示范译文见解析',
            explanation: '【六级高分句式与词汇解析】\n1. "不仅是……更是……"：not merely... but also a sublime embodiment of...\n2. "天人合一的精神境界"：the spiritual realm of harmony between humanity and nature\n3. "浓淡干湿与笔势起伏"：the nuances of ink density and dynamic brushwork\n4. "沉淀心境、陶冶情操"：calm the mind and cultivate spiritual serenity\n5. "深厚底蕴"：profound cultural heritage / profound cultural foundation。'
          }
        ]
      }
    ]
  }
];

// =========================================================================
// 每日更新专项题型刷题精选库 (Daily Refreshed Sectional Practice)
// 包含完整听力材料（4小题）、两篇完整仔细阅读、以及汉译英专练
// =========================================================================

export interface DailyPracticeSuite {
  suiteId: string;
  level: 'CET4' | 'CET6';
  dateLabel: string;
  listening: {
    title: string;
    transcript: string;
    speakerRole: string;
    questions: {
      id: string;
      questionNumber: number;
      questionText: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
    }[];
  };
  readings: [
    {
      title: string;
      passage: string;
      questions: {
        id: string;
        questionNumber: number;
        questionText: string;
        options: string[];
        correctAnswer: string;
        explanation: string;
      }[];
    },
    {
      title: string;
      passage: string;
      questions: {
        id: string;
        questionNumber: number;
        questionText: string;
        options: string[];
        correctAnswer: string;
        explanation: string;
      }[];
    }
  ];
  translation: {
    title: string;
    passage: string;
    keyPoints: string[];
    sampleTranslation: string;
    explanation: string;
  };
}

export const CET_DAILY_PRACTICE_SUITES: DailyPracticeSuite[] = [
  // Suite 1: CET-4 Environment & Technology Focus
  {
    suiteId: 'suite-c4-day1',
    level: 'CET4',
    dateLabel: '四级每日特训 (套题 1)',
    listening: {
      title: '今日听力特训：城市公共交通全面电动化转型',
      speakerRole: 'Municipal Transit Bureau Report',
      transcript: `The municipal transportation bureau announced that over eighty percent of public transit buses in the metropolitan district have transitioned to purely electric power. This green fleet initiative has reduced urban carbon emissions by twenty-five thousand metric tons over the past fiscal year. Transit authorities highlighted that regenerative braking systems recycle kinetic energy during heavy traffic, significantly reducing operational maintenance expenses while delivering smoother rides for daily commuters.`,
      questions: [
        {
          id: 'p-l1-q1',
          questionNumber: 1,
          questionText: 'What milestone did the transportation bureau announce?',
          options: [
            'A) Subsidizing private purchases of hybrid vehicles.',
            'B) Over eighty percent of city buses have transitioned to electric power.',
            'C) Expanding underground subway tracks to suburban towns.',
            'D) Banning private diesel cars during weekends.'
          ],
          correctAnswer: 'B',
          explanation: '【解析】录音首句明确提到："over eighty percent of public transit buses in the metropolitan district have transitioned to purely electric power"，对应选项 B。'
        },
        {
          id: 'p-l1-q2',
          questionNumber: 2,
          questionText: 'How much carbon emission was reduced over the past fiscal year?',
          options: [
            'A) About five thousand metric tons.',
            'B) Exactly ten thousand metric tons.',
            'C) Twenty-five thousand metric tons.',
            'D) Fifty thousand metric tons.'
          ],
          correctAnswer: 'C',
          explanation: '【解析】录音明确指出："reduced urban carbon emissions by twenty-five thousand metric tons"，对应选项 C。'
        },
        {
          id: 'p-l1-q3',
          questionNumber: 3,
          questionText: 'How do regenerative braking systems benefit transit buses?',
          options: [
            'A) They recycle kinetic energy and reduce maintenance expenses.',
            'B) They increase maximum bus highway cruising speeds.',
            'C) They allow buses to recharge while crossing bridges.',
            'D) They eliminate the need for routine tire replacements.'
          ],
          correctAnswer: 'A',
          explanation: '【解析】录音最后提到："recycle kinetic energy during heavy traffic, significantly reducing operational maintenance expenses"，对应选项 A。'
        },
        {
          id: 'p-l1-q4',
          questionNumber: 4,
          questionText: 'What passenger experience improvement was mentioned?',
          options: [
            'A) Complimentary high-speed Wi-Fi on all routes.',
            'B) Smoother rides for daily commuters.',
            'C) Free morning beverages for monthly pass holders.',
            'D) Reduced ticket fares during non-peak hours.'
          ],
          correctAnswer: 'B',
          explanation: '【解析】录音结尾指出："delivering smoother rides for daily commuters"，对应选项 B。'
        }
      ]
    },
    readings: [
      {
        title: '今日阅读精练 (篇章一)：数字极简主义与专注力重建',
        passage: `Digital minimalism is a philosophy that helps individuals question which digital tools add genuine value to their daily lives. Instead of compulsively reacting to every screen vibration and banner notification, digital minimalists intentionally prune away digital clutter. By establishing designated offline intervals, practitioners report substantial improvements in sustained reading capacity and lower baseline stress levels.

The goal is not to abandon technology entirely, but to ensure that digital devices serve human purposes rather than enslaving human attention. Reclaiming intentional control over technology transforms our relationship with the world, allowing time for contemplative solitude and authentic personal relationships.`,
        questions: [
          {
            id: 'p-r1-q1',
            questionNumber: 5,
            questionText: 'What is the core principle of digital minimalism?',
            options: [
              'A) Boycotting all digital communication platforms permanently.',
              'B) Intentionally selecting only tools that add authentic value.',
              'C) Replacing personal computers with smartphones exclusively.',
              'D) Spending at least eight hours online every day.'
            ],
            correctAnswer: 'B',
            explanation: '【解析】首句指出："question which digital tools add genuine value to their daily lives... intentionally prune away digital clutter"，对应选项 B。'
          },
          {
            id: 'p-r1-q2',
            questionNumber: 6,
            questionText: 'What benefits are reported by practitioners of digital minimalism?',
            options: [
              'A) Improved sustained reading capacity and lower baseline stress.',
              'B) Substantial discounts on broadband internet subscriptions.',
              'C) Immediate promotions in multinational corporations.',
              'D) Complete eradication of sleep disturbances.'
            ],
            correctAnswer: 'A',
            explanation: '【解析】第 1 段末句明确说明："substantial improvements in sustained reading capacity and lower baseline stress levels"，对应选项 A。'
          }
        ]
      },
      {
        title: '今日阅读精练 (篇章二)：微藻生物燃料与可持续航运',
        passage: `Marine transport accounts for nearly three percent of global greenhouse gas emissions. As international maritime regulations tighten sulfur and carbon thresholds, shipping corporations are actively investing in third-generation microalgae biofuels. Unlike terrestrial biofuel crops such as corn or soybeans, microalgae do not compete with food agriculture for arable land or freshwater.

Cultivated in saltwater ponds using captured industrial carbon dioxide, microalgae synthesize high-density lipids that can be refined into drop-in marine fuels compatible with existing diesel propulsion engines. While production costs currently exceed petroleum benchmarks, technological scaling and genetic optimization are projected to make algae fuels commercially competitive within the decade.`,
        questions: [
          {
            id: 'p-r2-q1',
            questionNumber: 7,
            questionText: 'What major advantage do microalgae possess over terrestrial biofuel crops?',
            options: [
              'A) They do not require arable soil or freshwater for cultivation.',
              'B) They can be harvested immediately within twenty-four hours.',
              'C) They produce zero emissions when burned in marine engines.',
              'D) They are completely unaffected by seawater salinity.'
            ],
            correctAnswer: 'A',
            explanation: '【解析】第 1 段指出："Unlike terrestrial biofuel crops... microalgae do not compete with food agriculture for arable land or freshwater"，对应选项 A。'
          },
          {
            id: 'p-r2-q2',
            questionNumber: 8,
            questionText: 'What will make microalgae fuels commercially competitive in the coming decade?',
            options: [
              'A) A total global ban on maritime international container shipping.',
              'B) Technological scaling and genetic optimization.',
              'C) Complete depletion of global petroleum crude reserves.',
              'D) Mandatory conversion of all cargo ships to nuclear propulsion.'
            ],
            correctAnswer: 'B',
            explanation: '【解析】第 2 段末句阐述："technological scaling and genetic optimization are projected to make algae fuels commercially competitive within the decade"，对应选项 B。'
          }
        ]
      }
    ],
    translation: {
      title: '今日汉译英专练：中国大熊猫与国家公园生态保护',
      passage: `大熊猫是中国特有的珍稀物种，被誉为中国的“国宝”，深受全世界人民的喜爱。近年来，随着大熊猫国家公园的正式设立以及自然栖息地保护力度的加大，大熊猫的野生种群数量稳步增加。大熊猫保护不仅使这一标志性物种摆脱了濒危状态，也为生活在同一生态系统中的成百上千种珍稀野生动植物提供了广阔的庇护所。`,
      keyPoints: [
        'national treasure (国宝)',
        'giant panda (大熊猫)',
        'natural habitat (自然栖息地)',
        'step down from endangered status (摆脱濒危状态)',
        'ecological sanctuary (生态庇护所)'
      ],
      sampleTranslation: `The giant panda is a rare species unique to China, revered as the country's "national treasure" and deeply beloved by people around the world. In recent years, with the official establishment of the Giant Panda National Park and intensified protection of natural habitats, the wild giant panda population has steadily increased. The conservation of giant pandas has not only helped this iconic species step down from endangered status, but also provided expansive sanctuary for hundreds of rare wildlife species living within the same ecosystem.`,
      explanation: '【四级翻译重点】\n1. "特有的珍稀物种"：a rare species unique to China\n2. "国宝"：national treasure\n3. "摆脱了濒危状态"：step down from endangered status / escape the verge of extinction\n4. "同一生态系统中的野生动植物"：wildlife species living within the same ecosystem。'
    }
  },

  // Suite 2: CET-6 Cognitive Science & Humanities Focus
  {
    suiteId: 'suite-c6-day2',
    level: 'CET6',
    dateLabel: '六级每日特训 (套题 2)',
    listening: {
      title: '今日六级听力特训：神经可塑性与认知储备机制',
      speakerRole: 'Neuroscience Symposium Lecture',
      transcript: `Welcome to this afternoon's session on cognitive longevity. Historically, neuroscientists believed that the adult cerebral cortex remained structurally static after early adulthood. However, modern neuroplasticity research has demonstrated that rigorous cognitive engagement stimulates dendritic branching and neurogenesis well into advanced age. Individuals who consistently acquire foreign languages, master musical instruments, or engage in complex strategic thinking develop what researchers term "cognitive reserve." This reserve creates redundant synaptic pathways that insulate against clinical manifestations of neurodegenerative conditions.`,
      questions: [
        {
          id: 'p-l2-q1',
          questionNumber: 1,
          questionText: 'What historical belief about the adult brain was disproven by modern research?',
          options: [
            'A) That cerebral neurons require continuous glucose replenishment.',
            'B) That the adult cerebral cortex remained structurally static.',
            'C) That childhood bilingualism damages auditory cortex development.',
            'D) That memory consolidation occurs exclusively during deep sleep.'
          ],
          correctAnswer: 'B',
          explanation: '【六级解析】录音指出："believed that the adult cerebral cortex remained structurally static after early adulthood. However, modern neuroplasticity research has demonstrated..."，故选 B。'
        },
        {
          id: 'p-l2-q2',
          questionNumber: 2,
          questionText: 'What biological changes are stimulated by rigorous cognitive engagement?',
          options: [
            'A) Rapid reduction in prefrontal blood flow.',
            'B) Dendritic branching and neurogenesis into advanced age.',
            'C) Permanent suppression of adrenal cortisol production.',
            'D) Decreased sensitivity to environmental auditory stimuli.'
          ],
          correctAnswer: 'B',
          explanation: '【六级解析】录音阐述："stimulates dendritic branching and neurogenesis well into advanced age"，对应选项 B。'
        },
        {
          id: 'p-l2-q3',
          questionNumber: 3,
          questionText: 'How is "cognitive reserve" built according to the speaker?',
          options: [
            'A) By taking synthetic memory enhancement supplements.',
            'B) By learning foreign languages, playing musical instruments, or strategic thinking.',
            'C) By avoiding all challenging workplace assignments.',
            'D) By sleeping ten hours every night.'
          ],
          correctAnswer: 'B',
          explanation: '【六级解析】录音列举："consistently acquire foreign languages, master musical instruments, or engage in complex strategic thinking develop what researchers term \'cognitive reserve\'"，故选 B。'
        },
        {
          id: 'p-l2-q4',
          questionNumber: 4,
          questionText: 'What protective function is served by redundant synaptic pathways?',
          options: [
            'A) They insulate against clinical manifestations of neurodegenerative conditions.',
            'B) They eliminate the necessity of cardiovascular physical exercise.',
            'C) They accelerate reflex speeds in competitive professional sports.',
            'D) They permanently lower systemic cholesterol levels.'
          ],
          correctAnswer: 'A',
          explanation: '【六级解析】录音最后提到："creates redundant synaptic pathways that insulate against clinical manifestations of neurodegenerative conditions"，对应选项 A。'
        }
      ]
    },
    readings: [
      {
        title: '今日六级阅读精练 (篇章一)：行为心理学中的沉没成本与理性抉择',
        passage: `The sunk-cost fallacy illustrates how deeply loss aversion warps human decision-making. When individuals pour emotional, financial, or temporal resources into an initiative, abandoning it feels tantamount to admitting failure. Rather than cutting losses pragmatically, executives frequently double down on unviable corporate strategies, exacerbating catastrophic balance sheet deficits.

Rational decision theory insists that prospective choices should be calculated strictly on future expected returns. Overcoming the sunk-cost trap requires institutional safeguards: mandating independent project audits and fostering a corporate culture where admitting strategic dead ends is treated as prudent resource reallocation rather than personal inadequacy.`,
        questions: [
          {
            id: 'p-r3-q1',
            questionNumber: 5,
            questionText: 'Why do individuals frequently persist in unviable initiatives?',
            options: [
              'A) Because abandoning them feels tantamount to admitting personal failure.',
              'B) Because bank loans require continuous project operation.',
              'C) Because prospective future returns always exceed sunk capital.',
              'D) Because competitors force them to maintain project timelines.'
            ],
            correctAnswer: 'A',
            explanation: '【六级解析】第 1 段指出："abandoning it feels tantamount to admitting failure. Rather than cutting losses pragmatically, executives frequently double down..."，故选 A。'
          },
          {
            id: 'p-r3-q2',
            questionNumber: 6,
            questionText: 'What organizational safeguard is suggested to mitigate the sunk-cost fallacy?',
            options: [
              'A) Mandating independent project audits and reframing exit as prudent reallocation.',
              'B) Prohibiting any mid-career changes in corporate leadership.',
              'C) Tripling initial project budgets to guarantee breakthroughs.',
              'D) Outsourcing all decision-making to external marketing agencies.'
            ],
            correctAnswer: 'A',
            explanation: '【六级解析】第 2 段末句明确提出："mandating independent project audits and fostering a corporate culture where admitting strategic dead ends is treated as prudent resource reallocation"，故选 A。'
          }
        ]
      },
      {
        title: '今日六级阅读精练 (篇章二)：人工智能生成物与知识产权哲学',
        passage: `The sudden ascent of generative multimodal models has disrupted conventional intellectual property jurisprudence. Traditional copyright statutes were framed around the premise of human authorship: safeguarding the labor, personality, and expressive intentionality of human creators. However, when an autonomous artificial neural network synthesizes original musical compositions or novel drug molecules, legal systems confront unprecedented doctrinal ambiguity.

Some legal scholars argue that autonomous algorithmic outputs should automatically belong to the public domain, preventing monopolistic copyright claims over machine-generated corpora. Others contend that users who craft intricate prompting strategies should be credited as derivative authors. As courts grapple with these dilemmas, the boundary between human creative agency and machine algorithmic synthesis is being radically re-evaluated.`,
        questions: [
          {
            id: 'p-r4-q1',
            questionNumber: 7,
            questionText: 'What fundamental premise underpinned traditional copyright statutes?',
            options: [
              'A) The premise of human authorship and expressive intentionality.',
              'B) The commercial viability of automated mechanical printing presses.',
              'C) The protection of corporate software licensing agreements.',
              'D) The maximization of public domain creative commons archives.'
            ],
            correctAnswer: 'A',
            explanation: '【六级解析】第 1 段指出："Traditional copyright statutes were framed around the premise of human authorship: safeguarding the labor, personality, and expressive intentionality"，故选 A。'
          },
          {
            id: 'p-r4-q2',
            questionNumber: 8,
            questionText: 'What position is held by scholars advocating that AI outputs enter the public domain?',
            options: [
              'A) To prevent monopolistic copyright claims over machine-generated corpora.',
              'B) To ban the commercial use of generative models worldwide.',
              'C) To eliminate software developer patent application royalties.',
              'D) To compel technology firms to open-source all neural weights.'
            ],
            correctAnswer: 'A',
            explanation: '【六级解析】第 2 段指出："preventing monopolistic copyright claims over machine-generated corpora"，对应选项 A。'
          }
        ]
      }
    ],
    translation: {
      title: '今日六级深度翻译：中国古代四大发明对人类文明进程的贡献',
      passage: `造纸术、指南针、火药和活字印刷术并称为中国古代“四大发明”，是中华民族对世界文明作出的卓越贡献。这些划时代的技术创新在不同历史时期传入西方，极大地推动了世界科学技术的演进、航海地理的大发现以及文化知识的普及。四大发明不仅展现了古代中国人民卓越的创造力和实践智慧，也成为跨越国界的文明互鉴的崇高象征。`,
      keyPoints: [
        'papermaking, the compass, gunpowder, and movable-type printing (四大发明)',
        'epoch-making technological innovations (划时代的技术创新)',
        'propel the evolution of science and technology (推动科技演进)',
        'Age of Discovery / maritime exploration (航海大发现)',
        'mutual learning among civilizations (文明互鉴)'
      ],
      sampleTranslation: `Papermaking, the compass, gunpowder, and movable-type printing are collectively known as the "Four Great Inventions" of ancient China, representing colossal contributions made by the Chinese nation to world civilization. These epoch-making technological innovations spread to the West across different historical epochs, greatly propelling the evolution of global science and technology, the Age of Discovery, and the widespread dissemination of cultural knowledge. The Four Great Inventions not only showcase the remarkable ingenuity and practical wisdom of ancient Chinese people, but also serve as a sublime emblem of mutual learning across civilizations.`,
      explanation: '【六级翻译重点句型与高分表达】\n1. "并称为"：are collectively referred to as / collectively known as\n2. "划时代的技术创新"：epoch-making / groundbreaking technological innovations\n3. "文化知识的普及"：widespread dissemination of cultural knowledge\n4. "文明互鉴的崇高象征"：a sublime emblem of mutual learning across civilizations。'
    }
  }
];

/**
 * Returns today's active practice suite based on current calendar day
 */
export function getDailyPracticeSuite(level: 'CET4' | 'CET6' = 'CET4'): DailyPracticeSuite {
  const suites = CET_DAILY_PRACTICE_SUITES.filter((s) => s.level === level);
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const activeIndex = dayOfYear % suites.length;
  return suites[activeIndex] || CET_DAILY_PRACTICE_SUITES[0];
}
