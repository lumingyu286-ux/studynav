/* ===========================================================
   只需要改这一个文件。

   分类格式：[分类名, 角标, [条目...]]
   条目格式：[名称, 网址, 说明]
             [名称, 网址, 说明, 'adult']  ← 第四项加 'adult'
                                            点击时会先弹年龄确认

   第二列是角标，会作为文字渲染进分类名左边那个红色方块，
   一到两个字最合适。
   顺序即显示顺序。成人内容排第一位。
   条目网址必须 http(s) 开头，其余协议会被 app.js 挡掉。

   用 var 不用 const：app.js 通篇是 ES5 写法。这里若用 const，
   老引擎直接解析失败，会被报成「sites.js 被拦截了」，把人往
   错误方向带。
   =========================================================== */

var SITE = {
  name: '备考导航',
  tagline: '考研、公考、语言、编程、文献 —— 要用的站都在这页',
  deployedOn: 'GitHub Pages / Cloudflare Pages',
};

var GROUPS = [

['成人内容', '18', [
  ['成人短剧',     'https://huangguoai.com',    'AI 成人短剧在线观看，仅限成年人', 'adult'],
  ['成人内容百科', 'https://chengrenbaike.com', '性知识与两性健康百科，仅限成年人', 'adult'],
]],

['升学与考公', '考', [
  ['研招网',       'https://yz.chsi.com.cn',  '考研报名、调剂与院校库'],
  ['学信网',       'https://www.chsi.com.cn', '学历学籍查询与认证'],
  /* 这条只能用 http：对方的 https 证书签给了别的域名
     （SEC_E_WRONG_PRINCIPAL），改成 https 访客会撞证书错误页。
     顶层导航不是子资源，不构成混合内容。 */
  ['国家公务员局', 'http://www.scs.gov.cn',   '国考公告与职位表'],
  ['中国教育考试网','https://www.neea.edu.cn','四六级、教资等考试报名'],
]],

['语言考试', '语', [
  ['雅思 IELTS',   'https://ielts.org',                   '官方报名与备考资料'],
  ['托福 TOEFL',   'https://www.ets.org/toefl',           'ETS 官方站'],
  ['多邻国英语测试','https://englishtest.duolingo.com',    '在家考的英语测试'],
  ['多邻国',       'https://www.duolingo.com',            '日常语言练习'],
]],

['公开课', '课', [
  ['中国大学 MOOC', 'https://www.icourse163.org',  '国内高校公开课'],
  ['国家智慧教育',  'https://www.smartedu.cn',     '公共教育资源'],
  ['Coursera',      'https://www.coursera.org',    '专业课程与证书'],
  ['edX',           'https://www.edx.org',         '高校在线课程'],
  ['MIT OpenCourseWare', 'https://ocw.mit.edu',    'MIT 课程全免费'],
  ['Khan Academy',  'https://www.khanacademy.org', '数学与基础科学'],
]],

['编程与技能', '码', [
  ['freeCodeCamp', 'https://www.freecodecamp.org', '从零到全栈的免费课程'],
  ['LeetCode',     'https://leetcode.cn',          '算法题与面试准备'],
  ['Codecademy',   'https://www.codecademy.com',   '交互式编程入门'],
  ['慕课网',       'https://www.imooc.com',        '国内 IT 实战课程'],
  ['菜鸟教程',     'https://www.runoob.com',       '语法速查与入门'],
  ['Exercism',     'https://exercism.org',         '带人工点评的编程练习'],
]],

['文献与论文', '文', [
  ['中国知网',    'https://www.cnki.net',          '中文期刊与学位论文'],
  ['万方数据',    'https://www.wanfangdata.com.cn','中文文献与标准'],
  ['Google 学术', 'https://scholar.google.com',    '论文检索与引用'],
  ['arXiv',       'https://arxiv.org',             '预印本，理工科为主'],
  ['Semantic Scholar', 'https://www.semanticscholar.org', 'AI 辅助的文献检索'],
  ['PubMed',      'https://pubmed.ncbi.nlm.nih.gov','生物医学文献'],
]],

['词典与翻译', '词', [
  ['有道词典',     'https://dict.youdao.com',              '中英互查与例句'],
  ['剑桥词典',     'https://dictionary.cambridge.org',     '英英释义与发音'],
  ['Merriam-Webster', 'https://www.merriam-webster.com',   '美式英语权威词典'],
  ['DeepL',        'https://www.deepl.com/translator',     '长句翻译质量好'],
  ['Linguee',      'https://www.linguee.com',              '双语例句对照'],
]],

['笔记与复习', '记', [
  ['Anki',     'https://apps.ankiweb.net', '间隔重复记忆卡片'],
  ['Quizlet',  'https://quizlet.com',      '背单词与知识点卡组'],
  ['Zotero',   'https://www.zotero.org',   '文献管理与引用生成'],
  ['Notion',   'https://www.notion.so',    '笔记与知识库'],
  ['Obsidian', 'https://obsidian.md',      '本地优先的双链笔记'],
]],

['工具与效率', '具', [
  ['Pomofocus',  'https://pomofocus.io',            '番茄钟计时'],
  ['iLovePDF',   'https://www.ilovepdf.com/zh-cn',  'PDF 合并、拆分与转换'],
  ['Overleaf',   'https://www.overleaf.com',        '在线写 LaTeX 论文'],
  ['Desmos',     'https://www.desmos.com/calculator','函数图像计算器'],
  ['WolframAlpha', 'https://www.wolframalpha.com',  '数学求解与步骤'],
]],

];
