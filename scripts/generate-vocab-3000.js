// scripts/generate-vocab-3000.js
const fs = require('fs');
const path = require('path');

// Curated list of high-frequency CET-4 and CET-6 words with accurate phonetic, POS, translation, and examples
const CORE_CET_DATA = [
  // A
  { w: 'abandon', p: '/əˈbændən/', pos: 'verb', t: '放弃，抛弃；沉溺', ex: 'He refused to abandon his principles despite great pressure.', ext: '尽管面临巨大压力，他依然拒绝放弃自己的原则。', tag: '#四级' },
  { w: 'abnormal', p: '/æbˈnɔːrml/', pos: 'adjective', t: '反常的，异常的', ex: 'The laboratory reported abnormal test results after the experiment.', ext: '实验室在实验后报告了异常的检测结果。', tag: '#四级' },
  { w: 'abolish', p: '/əˈbɑːlɪʃ/', pos: 'verb', t: '废除，取消（制度、法律等）', ex: 'Many countries decided to abolish outdated trade tariffs.', ext: '许多国家决定废除过时的贸易关税。', tag: '#四级' },
  { w: 'abrupt', p: '/əˈbrʌpt/', pos: 'adjective', t: '突然的，唐突的；生硬的', ex: 'There was an abrupt change in the economic climate.', ext: '经济气候发生了突如其来的变化。', tag: '#四级' },
  { w: 'absorb', p: '/əbˈzɔːrb/', pos: 'verb', t: '吸收；吸引全部注意力', ex: 'Sponge cities are designed to absorb surplus rainwater.', ext: '海绵城市旨在吸收多余的雨水。', tag: '#四级' },
  { w: 'abstract', p: '/ˈæbstrækt/', pos: 'adjective', t: '抽象的，理论上的；n. 摘要', ex: 'Philosophical concepts can sometimes seem rather abstract.', ext: '哲学概念有时显得相当抽象。', tag: '#四级' },
  { w: 'absurd', p: '/əbˈsɜːrd/', pos: 'adjective', t: '荒谬的，荒唐可笑的', ex: 'It is absurd to suggest that technology alone can resolve social inequality.', ext: '认为单靠技术就能解决社会不平等是荒谬的。', tag: '#六级' },
  { w: 'abundance', p: '/əˈbʌndəns/', pos: 'noun', t: '丰富，充裕，大量', ex: 'The region is blessed with an abundance of natural resources.', ext: '该地区拥有丰富的自然资源。', tag: '#四级' },
  { w: 'academic', p: '/ˌækəˈdemɪk/', pos: 'adjective', t: '学术的，理论的；高等院校的', ex: 'She received high praise for her rigorous academic research.', ext: '她因严谨的学术研究而备受赞誉。', tag: '#四级' },
  { w: 'accelerate', p: '/əkˈseləreɪt/', pos: 'verb', t: '加速，促进', ex: 'Technological innovations continue to accelerate economic growth.', ext: '技术创新不断加速经济增长。', tag: '#四级' },
  { w: 'accessible', p: '/əkˈsesəbl/', pos: 'adjective', t: '易接近的；可利用的；平易近人的', ex: 'Public transportation should be accessible to all residents.', ext: '公共交通应当方便所有居民使用。', tag: '#四级' },
  { w: 'accommodate', p: '/əˈkɑːmədeɪt/', pos: 'verb', t: '提供住宿；容纳；适应', ex: 'The new auditorium can easily accommodate five hundred guests.', ext: '新礼堂可以轻松容纳五百位宾客。', tag: '#四级' },
  { w: 'accumulate', p: '/əˈkjuːmjəleɪt/', pos: 'verb', t: '积聚，积累', ex: 'Reading widely allows students to accumulate extensive knowledge.', ext: '博览群书能让学生积累广博的知识。', tag: '#四级' },
  { w: 'accurate', p: '/ˈækjərət/', pos: 'adjective', t: '准确的，精确的', ex: 'Accurate data is vital for making sound public policy decisions.', ext: '准确的数据对于做出明智的公共政策决策至关重要。', tag: '#四级' },
  { w: 'acknowledge', p: '/əkˈnɑːlɪdʒ/', pos: 'verb', t: '承认；告知收到；感谢', ex: 'He was willing to acknowledge his past misjudgments.', ext: '他愿意承认自己过去的误判。', tag: '#四级' },
  { w: 'acquire', p: '/əˈkwaɪər/', pos: 'verb', t: '获得，学到（技能、知识）', ex: 'It takes persistent deliberate practice to acquire fluency in English.', ext: '坚持不懈的刻意练习才能获得流利的英语。', tag: '#四级' },
  { w: 'adapt', p: '/əˈdæpt/', pos: 'verb', t: '使适应；改编', ex: 'Successful companies adapt rapidly to evolving market demands.', ext: '成功的公司能快速适应不断变化的市场需求。', tag: '#四级' },
  { w: 'adequate', p: '/ˈædɪkwət/', pos: 'adjective', t: '足够的，充足的；能胜任的', ex: 'Ensure you have adequate sleep before the standardized examination.', ext: '在标准化考试前确保有充足的睡眠。', tag: '#四级' },
  { w: 'adhere', p: '/ədˈhɪr/', pos: 'verb', t: '坚持，遵循（规则、原则）；粘附', ex: 'All participants must adhere strictly to academic integrity regulations.', ext: '所有参与者必须严格遵守学术诚信条例。', tag: '#六级' },
  { w: 'adjacent', p: '/əˈdʒeɪsnt/', pos: 'adjective', t: '邻近的，毗连的', ex: 'The science building is adjacent to the main campus library.', ext: '科技楼紧邻校园主图书馆。', tag: '#六级' },
];

console.log('Generating CET-4 & CET-6 3000 Words Dataset...');
