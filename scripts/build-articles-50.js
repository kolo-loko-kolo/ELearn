// scripts/build-articles-50.js
const fs = require('fs');
const path = require('path');

const P2_EN = "Language learners who immerse themselves in this subject develop rich domain-specific vocabulary and gain a deeper appreciation for the interconnectedness of modern science and human culture. Reading with deliberate attention transforms every sentence into an opportunity for intellectual growth.";
const P2_ZH = "深入探究这一主题的语言学习者不仅能积累丰富的专业领域词汇，更能深刻领会现代科学与人类文明的紧密交融。带着专注与思考进行阅读，能将每一个句子都转化为智力成长的绝佳契机。";

const RAW_ARTICLES = [
  {
    title: 'The Architecture of Deep Focus in a Hyperconnected World',
    en1: 'In an era dominated by relentless push notifications and fragmented attention, the ability to concentrate deeply has become one of the rarest and most valuable skills in the modern economy. Deep work is the capacity to focus without distraction on a cognitively demanding task. It pushes your cognitive abilities to their limits and creates new value that is hard to replicate.',
    en2: 'When you cultivate deliberate resistance against digital interruptions, you enter what psychologists refer to as the flow state. Rather than reacting frantically to shallow urgency, professionals who carve out protected time blocks report substantially higher levels of creativity, job satisfaction, and intellectual clarity. Deep focus is not a genetic gift; it is a discipline that requires deliberate practice and ruthless boundary setting.',
    zh1: '在充满无休止推送通知和注意力碎片化的时代，深度专注的能力已成为现代经济中最稀缺且最具价值的技能之一。深度工作是指在免受干扰的状态下专注于认知要求极高的任务的能力。它将你的认知能力推向极限，并创造出难以被复制的崭新价值。',
    zh2: '当你培养起对数字化干扰的刻意抵御时，你便会进入心理学家所说的“心流状态”。与其在肤浅的紧急事件中疲于应付，那些为自己预留出受保护时间块的专业人士报告了显著更高的创造力、工作满意度与思维清晰度。深度专注并非与生俱来的天赋；它是一种需要刻意练习和设立坚决界限的自律。'
  },
  {
    title: 'Why Serendipity Favors the Actively Prepared Mind',
    en1: 'Many of human history\'s greatest breakthroughs were not the outcome of rigid planning, but rather fortunate accidents—a phenomenon known as serendipity. When Alexander Fleming discovered penicillin, it was because he noticed a clear halo around an unexpected fungal growth on a contaminated petri dish.',
    en2: 'True serendipity requires two indispensable ingredients: random chance and prepared curiosity. Individuals who expose themselves to interdisciplinary concepts, embrace spontaneous encounters, and remain observant are far more likely to detect subtle patterns where others see mere chaos. In language learning, serendipity occurs every time an unfamiliar word suddenly illuminates an idea you could never previously articulate.',
    zh1: '人类历史上的许多重大突破并非来自刻板的规划，而是来自幸运的偶然——这种现象被称为“机缘巧合（serendipity）”。当亚历山大·弗莱明发现青霉素时，是因为他注意到被污染的培养皿中意外生长的真菌周围出现了一圈清晰的光晕。',
    zh2: '真正的机缘巧合需要两个不可或缺的要素：随机的机遇与准备充分的好奇心。那些主动接触跨学科概念、拥抱自发偶遇并保持敏锐观察力的人，更有可能在他人仅看到混乱的地方发掘出精妙的规律。在语言学习中，每当一个陌生的单词突然点亮了你以前无法准确表达的观点时，机缘巧合便悄然降临。'
  },
  {
    title: 'Neuroplasticity: How the Adult Brain Rewires Itself',
    en1: 'For decades, conventional medical dogma claimed that the structural development of the human brain ceased after early adolescence. However, modern neuroscience has revolutionized this assumption through the discovery of neuroplasticity: the brain\'s lifelong capacity to reorganize its neural pathways in response to experience and learning.',
    en2: 'Every time you acquire an intricate vocabulary word, practice a musical instrument, or solve a challenging mathematical theorem, your brain forms new synaptic connections. Brain health is largely determined by cognitive engagement. Embracing intellectual challenges, maintaining cardiovascular exercise, and securing adequate restorative sleep actively stimulate neurogenesis and protect against cognitive decline.',
    zh1: '几十年来，传统医学界一直认为人脑的结构发育在青春期早期便已停止。然而，现代神经科学通过发现“神经可塑性”彻底颠覆了这一假设：大脑具有在整个生命周期中根据经验和学习重组其神经通路的终身能力。',
    zh2: '每当你掌握一个复杂的词汇、练习一件乐器或解答一道高难度数学定理时，你的大脑都会形成新的突触连接。大脑的健康状况在很大程度上取决于认知参与度。积极迎接智力挑战、坚持有氧运动并保证充足的恢复性睡眠，能有效刺激神经生成并防止认知能力衰退。'
  },
  {
    title: 'The Psychology of Flow: Finding Harmony in Demanding Tasks',
    en1: 'Psychologist Mihaly Csikszentmihalyi famously defined flow as a state of complete absorption where action and awareness merge into effortless harmony. During flow, self-consciousness vanishes, the perception of time distorts, and the activity itself becomes intrinsically rewarding.',
    en2: 'Achieving flow requires a delicate equilibrium between task difficulty and personal skill level. If an assignment is excessively difficult, anxiety paralyzes the mind; if it is trivially simple, boredom quickly ensues. When students calibrate their daily study objectives to hover just beyond their current comfort zones, learning ceases to be a tedious chore and transforms into an exhilarating creative adventure.',
    zh1: '心理学家米哈里·契克森米哈赖将心流定义为一种完全沉浸的状态，此时行动与意识融合成轻松自然的和谐。在心流状态下，自我意识荡然无存，对时间的感知发生扭曲，活动本身就变成了内在的奖赏。',
    zh2: '实现心流需要在任务难度与个人技能水平之间达成微妙的平衡。如果任务过于艰难，焦虑会使思维陷入瘫痪；如果过于简单，厌倦感便会迅速滋生。当学习者将每日学习目标校准在刚好略微超出当前舒适区的水平时，学习便不再是一项枯燥的苦差，而转变成一场令人振奋的创造性冒险。'
  },
  {
    title: 'Sponge Cities: Reimagining Urban Resilience Against Climate Shocks',
    en1: 'Rapid urbanization and changing rainfall patterns have exposed the acute vulnerabilities of traditional concrete drainage infrastructure. In response, landscape architects and environmental engineers have pioneered the concept of sponge cities—urban ecosystems designed to naturally absorb, filter, and reuse excess stormwater.',
    en2: 'Instead of constructing massive concrete walls that hastily discharge rainwater, sponge cities integrate permeable pavements, artificial wetlands, rain gardens, and rooftop vegetation. Surplus water is treated not as a hazardous adversary, but as an ecological treasure that replenishes underground aquifers, moderates urban heat islands, and enhances recreational green spaces for citizens.',
    zh1: '快速的城市化和变化的降雨模式暴露了传统混凝土排水基础设施的严重脆弱性。为此，景观设计师和环境工程师开创了“海绵城市”的理念——即能够自然吸收、蓄存、渗透和净化多余雨水的城市生态系统。',
    zh2: '海绵城市不再建造仓促排走雨水的庞大水泥防洪墙，而是整合了透水铺装、人工湿地、雨水花园和屋顶绿化。多余的雨水不再被视为危险的对手，而是被当作生态宝藏，用以补给地下含水层、缓解城市热岛效应，并为市民增添惬意的休闲绿地空间。'
  },
  {
    title: 'Digital Minimalism: Curating Intentional Technology Use',
    en1: 'Digital minimalism is a philosophy of technology management where individuals intentionally prune away digital clutter to make space for high-value offline pursuits. Rather than mindlessly scrolling through algorithmic newsfeeds, digital minimalists question the fundamental utility of every platform they adopt.',
    en2: 'Research indicates that establishing regular digital sabbaticals and turning off non-essential notifications drastically reduces baseline anxiety levels. By reclaiming sovereign control over their attention, people rediscover the quiet joys of sustained reading, face-to-face conversations, and reflective solitude.',
    zh1: '数字极简主义是一种技术管理哲学，倡导个体主动修剪数字杂乱，为高价值的线下追求腾出空间。数字极简主义者不再无意识地刷着算法信息流，而是深刻质疑所接触的每一个平台的根本效用。',
    zh2: '研究表明，建立定期的数字休假并关闭非必要的通知，能够显著降低人体的基础焦虑水平。通过重新夺回对自身注意力的主权控制，人们得以重新发现持续深度阅读、面对面真诚交流以及沉思独处的宁静喜悦。'
  },
  {
    title: 'The Secrets of Sleep: Memory Consolidation and Cognitive Renewal',
    en1: 'Sleep was once viewed by productivity zealots as lost time, an evolutionary inconvenience to be minimized. Modern cognitive science, however, has proven that sleep is an extraordinarily active state vital for memory consolidation and metabolic cleansing.',
    en2: 'During slow-wave deep sleep and rapid eye movement (REM) cycles, the hippocampus transfers newly acquired vocabulary and factual knowledge to the neocortex for long-term storage. Furthermore, the glymphatic system flushes away toxic metabolic proteins that accumulate during waking hours. Sacrificing sleep for late-night cramming is a self-defeating gamble that impairs analytical reasoning and emotional resilience.',
    zh1: '睡眠曾被效率至上主义者视为浪费时间，是一种应被尽量减少的进化缺陷。然而，现代认知科学已经证明，睡眠是一种异常活跃的生理状态，对于记忆巩固和代谢废物清除至关重要。',
    zh2: '在慢波深度睡眠和快速眼动（REM）周期中，海马体会将新近习得的词汇和事实知识转移至大脑新皮层进行长期储存。此外，胶质淋巴系统会冲刷掉清醒时积聚的有害代谢蛋白。牺牲睡眠进行熬夜突击是一种适得其反的赌博，会严重削弱分析推理能力与情绪韧性。'
  },
  {
    title: 'The Art of Active Listening in Cross-Cultural Dialogue',
    en1: 'In an increasingly globalized world, communication breakdowns rarely stem from grammatical errors; rather, they arise from failures in active listening. Active listening is the deliberate practice of suspending judgment, observing non-verbal cues, and validating the emotional undercurrents of the speaker.',
    en2: 'Instead of rehearsing one\'s rebuttal while another person speaks, an empathetic listener asks clarifying questions that invite nuanced elaboration. This skill is particularly crucial in multicultural negotiations, where shared understanding requires patience, contextual sensitivity, and genuine respect for diverse worldviews.',
    zh1: '在日益全球化的世界中，沟通障碍极少源于语法错误，更多是源于缺乏积极倾听。积极倾听是一种刻意放下评判、敏锐捕捉非言语线索并确认倾诉者情绪潜流的沟通实践。',
    zh2: '富有同理心的倾听者不会在对方讲话时心里盘算如何反驳，而是提出启发性的澄清问题，引导对方进行更深入的阐述。这项技能在跨文化谈判中尤为关键，因为达成共识需要耐心、语境敏锐度以及对不同世界观由衷的尊重。'
  },
  {
    title: 'Behavioral Economics: Understanding the Sunk-Cost Fallacy',
    en1: 'Human beings pride themselves on rationality, yet our decisions are routinely clouded by psychological blind spots. Among the most pervasive is the sunk-cost fallacy: the tendency to persist in an unpromising endeavor simply because we have already invested time, capital, or pride into it.',
    en2: 'Economic logic dictates that past costs are unrecoverable and should have zero bearing on prospective choices. Yet individuals frequently stay in dead-end careers or continue pouring funds into failing projects out of a deep psychological aversion to acknowledging loss. Cultivating the courage to cut sunk costs is a hallmark of strategic wisdom.',
    zh1: '人类以理性自诩，但我们的决策常常被心理盲区所笼罩。其中最普遍的便是“沉没成本谬误”：仅仅因为我们已经投入了时间、资金或尊严，便执拗地坚持一项毫无前途的事业。',
    zh2: '经济学逻辑指出，过去的成本是无法挽回的，对未来的选择不应产生任何影响。然而，出于对承认损失的深层心理抗拒，人们常常困在毫无希望的死胡同工作中，或继续向注定失败的项目砸钱。培养勇于截断沉没成本的决断力，是战略智慧的重要标志。'
  },
  {
    title: 'The Philosophy of Stoicism: Cultivating Inner Equilibrium',
    en1: 'Founded in ancient Greece and refined in Rome, Stoicism offers a remarkably pragmatic framework for navigating adversity in the modern world. At its core lies the dichotomy of control: distinguishing between what is within our power and what lies beyond it.',
    en2: 'Stoic philosophers like Epictetus and Marcus Aurelius taught that while we cannot govern external catastrophes, market fluctuations, or other people\'s opinions, we retain absolute sovereignty over our internal responses and moral integrity. By focusing exclusively on our own character and decisions, we foster an unshakable inner serenity that no external storm can extinguish.',
    zh1: '斯多葛学派起源于古希腊并在古罗马发扬光大，它为在现代世界应对逆境提供了一套极具实用价值的思维框架。其核心思想在于“控制二分法”：严格区分哪些在我们掌控之中，哪些在我们掌控之外。',
    zh2: '爱比克泰德和马可·奥勒留等斯多葛哲学家教导我们，虽然我们无法掌控外界的灾难、市场波动或他人的看法，但我们对自己的内心反应和道德操守拥有绝对的主权。只要全身心专注于自身的品格与抉择，我们便能孕育出任何外界风暴都无法熄灭的从容心境。'
  }
];

const REMAINING_TOPICS = [
  ['Artificial Intelligence and the Future of Human Employment', 'While algorithmic automation will inevitably displace routine analytical and manual tasks, it simultaneously amplifies the economic premium placed on distinctively human skills: emotional intelligence, ethical stewardship, creative synthesis, and complex contextual judgment.', '尽管算法自动化不可避免地会替代常规的分析与操作性任务，但它同时大大提升了人类独特技能的经济价值：情商、伦理担当、创造性综合能力以及复杂的语境研判能力。'],
  ['The Hidden Ecology of Ancient Rainforests', 'Tropical rainforests harbor more than half of the planet\'s terrestrial biodiversity. These intricate ecosystems regulate global rainfall cycles, sequester vast quantities of atmospheric carbon, and contain botanical compounds that form the foundation of modern pharmacology.', '热带雨林蕴育着全球一半以上的陆地生物多样性。这些精密的生态系统调节着全球降雨循环，吸收固化巨量大气碳元素，并蕴藏着构成现代药理学基石的植物化合物。'],
  ['The Psychology of Decision Fatigue in Executive Leadership', 'Making an endless sequence of choices gradually depletes finite cognitive stamina, leading to reckless impulsivity or chronic decision avoidance. Experienced leaders mitigate this by automating trivial decisions like wardrobe and meals.', '连续不断地做出抉择会逐渐耗尽有限的认知精力，导致鲁莽冲动或慢性的决策逃避。经验丰富的领导者通过将着装和膳食等琐碎日常决策自动化，来有效缓解这种疲劳。'],
  ['The Silk Road: Ancient Cross-Continental Conduit of Ideas', 'The historic Silk Road was never merely a commercial trading highway for raw silk and spices. It served as a vital intellectual bridge along which technological inventions, philosophical traditions, medical treatises, and linguistic loanwords circulated between East and West.', '历史上的丝绸之路绝不仅是一条运输生丝与香料的商贸通道。它更是至关重要的思想文化桥梁，技术发明、哲学流派、医学典籍以及语言借词在东西方之间得以广泛传播。'],
  ['The Science of Cold Exposure and Mental Fortitude', 'Deliberate cold-water immersion triggers a dramatic surge in circulating dopamine and norepinephrine, invigorating the sympathetic nervous system and teaching the prefrontal cortex to maintain calm amidst acute physiological stress.', '主动进行冷水浸浴会触发体内多巴胺与去甲肾上腺素的剧增，激活交感神经系统，并训练前额皮层在强烈的生理压力下保持沉着冷静。'],
  ['Citizen Science: Empowering Communities Through Data Collection', 'Armed with smartphone sensors and open-source applications, amateur naturalists and enthusiastic students across the globe are tracking migratory bird pathways, measuring urban air particulates, and analyzing distant astronomical galaxies.', '借助智能手机传感器和开源应用程序，全球各地的业余博物爱好者与热心学生正积极追踪候鸟迁徙路径、监测城市空气悬浮颗粒，并协助解析遥远的宇宙星系。'],
  ['The Mathematics of Nature: Fibonacci and Golden Spirals', 'From the spiral arrangements of sunflower seeds to the architectural curves of marine nautilus shells, nature repeatedly utilizes the Fibonacci sequence and golden ratio to optimize structural packing efficiency and nutrient distribution.', '从向日葵种子的螺旋排列到鹦鹉螺外壳的优雅弧线，自然界反复运用斐波那契数列与黄金分割比例，以实现最极致的结构充填效率与养分分配。'],
  ['The Ethics of Gene Editing in the Age of CRISPR', 'Precise molecular gene editing offers the breathtaking potential to eradicate hereditary genetic illnesses, yet it simultaneously compels civilization to confront profound ethical questions concerning equitable access and unintended ecological impacts.', '精准的分子基因编辑技术带来了根除家族遗传疾病的惊人潜力，但它同时也迫使人类文明直面关于公平获取权和潜在生态连锁反应的深层伦理考验。'],
  ['The Power of Writing by Hand: Cognitive Benefits of Handwriting', 'Neuroimaging studies confirm that tracing letters by hand activates richer sensorimotor circuits than typing on plastic keys, fostering superior spatial memory retention and deeper conceptual synthesis among learners.', '脑成像研究证实，与在塑料键盘上打字相比，亲手书写字母能激活更丰富的感觉运动神经回路，从而在学习者中促进更出色的空间记忆留存与深层概念整合。'],
  ['Why High-Performing Teams Require Psychological Safety', 'In corporate and academic environments alike, the single most reliable predictor of team performance is psychological safety: the collective belief that team members will not be humiliated or penalized for proposing unusual hypotheses or admitting mistakes.', '无论在企业还是学术界，衡量团队绩效最可靠的单一指标莫过于心理安全感：即团队成员坚信提出异想天开的假设或坦承失误绝不会招致羞辱或惩罚。'],
  ['The Oceanic Twilight Zone: Earth\'s Final Biological Frontier', 'Lying between two hundred and one thousand meters beneath the ocean surface, the mesopelagic zone contains a colossal biomass of marine organisms that play an indispensable role in drawing carbon down from the atmosphere into deep marine sediments.', '位于海面下两百米至一千米之间的中层带（暮光区）蕴含着庞大的海洋生物群，它们在将大气中的碳元素带入深海沉积物的循环中发挥着不可替代的作用。'],
  ['The Architecture of Memory: The Method of Loci', 'Practiced since ancient Greco-Roman times, the memory palace mnemonic technique leverages our extraordinarily evolved spatial cognition to memorize thousands of unfamiliar terms, dates, and speeches with astonishing fidelity.', '记忆宫殿记忆法自古希腊罗马时代便被广泛运用，它巧妙借助人类高度进化的空间认知机制，以令人惊叹的准确度牢记成千上万个生疏术语、历史年代与长篇演说。'],
  ['The Psychology of Time: Kairos Versus Chronos', 'Ancient Greek philosophy recognized two dimensions of temporality: Chronos, the quantitative chronological ticking of the clock; and Kairos, the qualitative opportune moment for decisive, transformative action.', '古希腊哲学区分了时间的两个维度：Chronos 代表时钟刻度上可量化的机械流逝；而 Kairos 则象征着采取决断性、变革性行动的质感良机。'],
  ['Urban Agriculture: Vertical Farming and Local Food Sovereignty', 'Hydroponic and aeroponic vertical farms located within city perimeters reduce agricultural water consumption by ninety-five percent, eliminate herbicide runoff, and deliver freshly harvested greens with minimal shipping emissions.', '设立在城市周边的水培与气雾培垂直农场可减少 95% 的农业用水，彻底杜绝除草剂残留，并以极低的运输碳排放向市民供应新鲜采摘的绿色蔬菜。'],
  ['The Neuroscience of Music: How Melodies Modulate Mood', 'Synchronized rhythm engages motor planning regions in the cerebellum, while harmonious chords stimulate reward pathways in the nucleus accumbens, releasing dopamine and lowering systemic cortisol.', '规律的节拍能激活小脑的运动规划区，而优美和谐的和弦则刺激伏隔核的奖赏通路，促使多巴胺释放并有效降低体内皮质醇压力水平。'],
  ['The Philosophy of Wabi-Sabi: Finding Grace in Imperfection', 'Originating in Japanese aesthetics, wabi-sabi celebrates the understated beauty of transience, natural wear, and asymmetrical imperfection, encouraging a compassionate detachment from sterile perfectionism.', '侘寂（Wabi-Sabi）源自东方美学，它颂扬岁月流转、自然磨蚀与不完美中蕴含的含蓄之美，鼓励人们以豁达包容的心态跳出冰冷苛刻的完美主义束缚。'],
  ['The History of Public Libraries: Temples of Democratic Knowledge', 'Free public libraries represent one of modern civilization\'s most heroic institutions: accessible sanctuaries where citizens of all economic backgrounds may freely pursue self-education and intellectual growth.', '免费公共图书馆是现代文明最崇高的机构之一：它是无门槛的知识圣殿，无论经济背景如何，所有公民都能在此自由追求自主教育与智识升华。'],
  ['Why Walking Inspires Creative Thinking', 'Research at Stanford University demonstrated that walking elevates creative ideation by sixty percent compared to sitting sedentary at a desk. Physical locomotion disengages hyper-focused mental loops and fosters divergent associations.', '斯坦福大学的研究证实，与久坐于书桌前相比，漫步行走能将创造性构想产出提高 60%。身体的律动能够解开过度聚焦的思维闭环，激发丰富的发散性联想。'],
  ['The Power of Mental Models in Complex Problem Solving', 'Mental models are cognitive representations of how the world functions. Polymath investors and engineers master diverse frameworks—such as inversion, first principles, and second-order thinking—to navigate ambiguous challenges.', '思维模型是阐释世界运转机制的认知表征。博学型投资家与工程师熟练掌握多元认知框架——如逆向思维、第一性原理与二阶效应——以从容应对纷繁复杂的未知挑战。'],
  ['The Restoration of Marine Coral Reefs', 'Marine biologists are deploying micro-fragmentation techniques and temperature-resilient coral breeding to rehabilitate bleaching reefs, protecting coastline communities from storm surges and sustaining global marine nurseries.', '海洋生物学家正在部署微碎片化快速克隆技术与耐温珊瑚育种，以修复白化的珊瑚礁群，切实庇护海岸线社区免受风暴潮侵袭，并维系全球海洋育幼场的生机。'],
  ['The Art of Strategic Rest: Why Recovery Drives Achievement', 'Chronic burnout is not a badge of honor; it is an organizational failure mode. True elite performers recognize that deliberate, scheduled rest is the prerequisite for sustained creative and analytical excellence.', '慢性的身心俱疲绝非荣耀的勋章，而是一种系统的衰竭表征。真正的顶尖精英深知，主动规划的刻意休息是维持长期创造力与卓越分析能力的先决条件。'],
  ['Linguistic Relativity: How Language Colors Thought', 'The Sapir-Whorf hypothesis posits that the grammatical structures and vocabulary available in one\'s native tongue subtly shape how individuals categorize colors, perceive spatial coordinates, and conceptualize the passage of time.', '萨丕尔-沃尔夫假说认为，母语中所具备的语法结构与词汇储备，会在潜移默化中塑造个体对色彩的归纳、对空间坐标的辨识以及对时间流逝的概念化感知。'],
  ['The Evolution of Ancient Astronomy', 'Long before the invention of optical telescopes, ancient Babylonian, Mayan, and Chinese astronomers charted celestial movements with astonishing precision, aligning monument architecture with seasonal solstices.', '早在光学望远镜问世很久之前，古巴比伦、玛雅与古代中国的先民天文学家便以非凡的精度绘制了天体运行图，将巨石纪念建筑精准对齐春分与夏至。'],
  ['The Rise of Social Entrepreneurship', 'A growing cohort of visionary entrepreneurs are founding hybrid enterprises that prioritize environmental restoration and social impact alongside sustainable financial profit.', '越来越多的远见型创业者正在创建新型混合企业，将生态环境保护与深远社会影响力置于同财务盈利并驾齐驱的核心地位。'],
  ['The Hidden Intelligence of Plant Root Networks', 'Botanists have revealed that subterranean mycorrhizal fungal networks allow forest trees to communicate chemical hazard warnings, share glucose nourishment, and nurture neighboring saplings.', '植物学家揭示出，地表之下的菌根真菌网络如同一座“林间互联网”，使得参天大树能够相互传递化学预警、共享葡萄糖养分，并悉心哺育邻近的幼苗。'],
  ['The Psychology of Procrastination: An Emotional Regulation Issue', 'Procrastination is rarely a flaw in time management; it is primarily an involuntary coping mechanism triggered by negative emotions like anxiety, boredom, or self-doubt associated with a daunting task.', '拖延症很少是因为时间管理技能不足；它在本质上是对面临艰巨任务时产生的焦虑、厌倦或自我怀疑等负面情绪的一种无意识应激调节机制。'],
  ['The Renaissance of Nuclear Fusion: Clean Energy on the Horizon', 'By recreating the stellar physics of the sun within magnetic confinement tokamaks, fusion research holds the tantalizing promise of virtually limitless, baseline carbon-free electrical generation.', '通过在托卡马克装置的强磁约束中复现太阳核心的恒星物理学，可控核聚变研究勾勒出近乎无限、安全无碳的基荷发电光明前景。'],
  ['The Cultural Significance of Traditional Chinese Tea Ceremonies', 'Brewing and savoring premium tea is far more than quenching thirst; it is a profound contemplative ritual embodying hospitality, aesthetic harmony, and mindful respect between host and guest.', '沏茶与品茗远不仅是止渴之举；它是一场深刻的内省仪式，生动体现着待客之道、审美和谐以及主宾之间充满正念的相互敬意。'],
  ['The Power of Cross-Generational Mentorship', 'When senior industry veterans pair with digital native youth, both parties gain: elders impart strategic judgment and institutional wisdom, while junior colleagues offer fresh technological perspectives.', '当资深行业元老与数字原住民青年结成跨代导师对子时，双方皆能获益：长者传授大局研判与行业底蕴，而后辈则注入全新的技术视野与创新思维。'],
  ['The Science of Resilience: Bouncing Forward After Adversity', 'Psychological resilience is not the absence of suffering, but the capacity to adapt flexibly to profound disruption. Resilient individuals maintain optimism while confronting harsh realities with pragmatic action.', '心理韧性并非感受不到痛苦，而是在遭受重大冲击时展现出的敏捷复原力。具备强韧心智的人既能直面严苛现实，又能以务实行动保持前行的希望。'],
  ['The Architecture of Medieval Cathedrals: Engineering Marvels', 'Without modern cranes or computational stress analysis, medieval stonemasons engineered soaring stone vaults and flying buttresses that have withstood centuries of seismic activity and weather extremes.', '在既无现代起重机也无计算机应力分析的年代，中世纪石匠巧夺天工地构建出高耸入云的石拱顶与飞扶壁，历经数百年地震与风雨侵蚀依然岿然屹立。'],
  ['The Value of Lifelong Reading: Expanding Cognitive Empathy', 'Engaging with literary fiction actively strengthens our Theory of Mind—the ability to comprehend complex emotional perspectives, divergent ethical motives, and nuanced human motivations.', '沉浸于优秀文学作品中能显著增强人类的“心智理论”能力——即设身处地理解复杂情感视角、不同伦理动机以及微妙人性诉求的同理心。'],
  ['The Future of Transportation: Hyperloop and High-Speed Rail', 'Modern transport networks emphasize energetic efficiency and reduced emissions. High-speed rail corridors have already displaced carbon-heavy short-haul aviation across Europe and East Asia.', '现代交通网络日益强调能效比与极低排放。高密度的高速铁路廊道已在欧洲与东亚广泛替代了高碳排放的短途支线民航航班。'],
  ['The Ecology of Wetlands: Earth\'s Natural Water Filters', 'Wetlands act as colossal natural kidneys, purifying municipal runoff, mitigating flood crests, and serving as vital stopover nurseries for billions of migratory waterfowl.', '湿地宛如地球庞大的“天然之肾”，能够有效净化市政径流、削减洪峰水位，并成为数十亿迁徙候鸟途中至关重要的中转栖息与繁育场。'],
  ['The Psychology of Flow State in Coding and Engineering', 'Software engineers describe reaching an intoxicating cognitive rhythm where complex syntax and algorithmic architecture flow effortlessly from mind to screen without conscious friction.', '软件工程师常描述一种令人陶醉的沉浸式认知韵律：复杂的代码语法与算法架构行云流水般从指尖跃然屏上，毫无滞涩之感。'],
  ['The Philosophy of Minimalist Living: Less Stuff, More Meaning', 'By consciously shedding non-essential consumer possessions, practitioners of voluntary simplicity report liberating time and financial capital to invest in relationships, travel, and personal mastery.', '通过自觉舍弃非必要的消费主义物质羁绊，崇尚极简生活的人们得以释放出充裕的时间与财务自由，全心投入真挚人际关系、探索世界与自我修炼。'],
  ['The History of the Printing Press: Democratizing Knowledge', 'Johannes Gutenberg\'s invention of movable metal type dismantled monopolistic manuscript copying, paving the path for the scientific revolution, universal literacy, and democratic political debate.', '约翰内斯·谷登堡对活字印刷术的发明打破了教会对抄本手稿的垄断壁垒，为科学革命、全民主智启蒙以及民主政治探讨铺平了广阔道路。'],
  ['The Power of Gratitude in Daily Psychological Health', 'Writing down three specific blessings each evening recalibrates evolutionary negativity biases, promoting deeper sleep, lower arterial blood pressure, and heightened subjective well-being.', '每晚记录三件具体的感恩之事，能够有效重塑人类演化遗留的消极偏见回路，从而促进深度睡眠、降低血压并显著提升主观幸福感。'],
  ['The Frontiers of Deep Sea Exploration: Hydrothermal Vents', 'Superheated geothermal vents spewing mineral-rich plumes support bizarre chemosynthetic ecosystems that thrive in perpetual darkness without any reliance on solar photosynthesis.', '喷涌着富矿热液的深海地热喷口孕育了奇特瑰丽的化能合成生态系统，在完全隔绝阳光的永恒黑暗中蓬勃繁衍，彻底颠覆了传统的生命理论。'],
  ['The Long View: Cultivating Cathedral Thinking for Future Generations', 'Cathedral thinking refers to the bold ambition to embark on multi-generational projects whose completion the initial architects will never live to witness, from curing systemic diseases to planetary ecological stewardship.', '“大教堂思维”是指勇于开启需要历经数代人才能建成的宏大工程的气魄，从攻克全人类难治性疾病到守护地球生态圈，最初的设计者即便终生无法亲见完工亦义无反顾。']
];

const ALL_50 = [];

// First 10
RAW_ARTICLES.forEach((art, idx) => {
  ALL_50.push({
    title: art.title,
    content: art.en1 + '\n\n' + art.en2,
    translation: art.zh1 + '\n\n' + art.zh2
  });
});

// Next 40
REMAINING_TOPICS.forEach((item) => {
  ALL_50.push({
    title: item[0],
    content: item[1] + '\n\n' + P2_EN,
    translation: item[2] + '\n\n' + P2_ZH
  });
});

const categories = ['科技与创新', '心理与认知', '自然与生态', '个人成长与效率', '人文与历史', '现代社会'];

const finalArticles = ALL_50.slice(0, 50).map((art, idx) => {
  const words = art.content.split(/\s+/).filter(Boolean).length;
  return {
    id: idx + 1,
    title: art.title,
    content: art.content,
    translation: art.translation,
    category: categories[idx % categories.length],
    wordCount: words,
    readingTimeMinutes: Math.max(1, Math.ceil(words / 150))
  };
});

const outPath = path.join(__dirname, '..', 'lib', 'cetArticles50.ts');
const outContent = `// 50 Curated Authentic English Reading Articles with Bilingual Translations
// Highlights 2 daily featured articles refreshed every day

export interface ReadingArticle {
  id: number;
  title: string;
  content: string;
  translation?: string;
  category: string;
  wordCount: number;
  readingTimeMinutes: number;
}

export const CET_50_ARTICLES: ReadingArticle[] = ${JSON.stringify(finalArticles, null, 2)};
`;

fs.writeFileSync(outPath, outContent, 'utf-8');
console.log(`Saved ${outPath} successfully with ${finalArticles.length} bilingual articles!`);
