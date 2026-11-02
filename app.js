/* 备考导航 --------------------------------------------------- */
(function () {
  'use strict';

  /* 第一件事：标记脚本已启动，把 HTML 里的 .boot 兜底块藏掉。
     app.js 被拦截时这行不会执行，兜底块就留在页面上，
     访客至少看到一句解释而不是一片空白。

     paintError() 注入的提示框用 .notice 而不是 .boot ——
     同名会被 .js-ok .boot{display:none} 一起藏掉，等于白写。 */
  document.documentElement.className += ' js-ok';

  var FAV_KEY   = 'sn-favs';
  var THEME_KEY = 'sn-theme';
  var ADULT_KEY = 'sn-adult-ok';

  var $ = function (id) { return document.getElementById(id); };

  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  function hostOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); }
    catch (e) { return String(url).replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, ''); }
  }

  /* --- 主题 ----------------------------------------------
     当前主题记在模块变量里，localStorage 只当尽力而为的持久化。
     每次回头读存储的话，隐私模式下写入失败、系统主题一翻转
     就把用户的手动选择改回去了。 */

  var themeNow = 'dark';
  var userPicked = false;

  function systemTheme() {
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches)
      ? 'light' : 'dark';
  }

  function applyTheme(t) {
    themeNow = (t === 'light') ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', themeNow);
    var btn = $('theme');
    /* 可见文字是「切换主题」，aria-label 必须包含它，
       否则语音控制念可见文字匹配不到这个按钮（WCAG 2.5.3）。 */
    if (btn) btn.setAttribute('aria-label', '切换主题，当前' + (themeNow === 'light' ? '浅色' : '深色'));
  }

  function initTheme() {
    var saved = load(THEME_KEY);
    userPicked = (saved === 'light' || saved === 'dark');
    applyTheme(userPicked ? saved : systemTheme());

    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: light)');
      var follow = function () { if (!userPicked) applyTheme(systemTheme()); };
      if (mq.addEventListener) mq.addEventListener('change', follow);
      else if (mq.addListener) mq.addListener(follow);
    }

    var btn = $('theme');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var next = themeNow === 'light' ? 'dark' : 'light';
      userPicked = true;
      store(THEME_KEY, next);
      applyTheme(next);
    });
  }

  /* --- 收藏 ---------------------------------------------- */

  var favs = [];

  function loadFavs() {
    try {
      var raw = JSON.parse(load(FAV_KEY) || '[]');
      favs = Object.prototype.toString.call(raw) === '[object Array]' ? raw : [];
    } catch (e) { favs = []; }
  }

  function isFav(url) {
    for (var i = 0; i < favs.length; i++) { if (favs[i] === url) return true; }
    return false;
  }

  function toggleFav(url) {
    var out = [], found = false;
    for (var i = 0; i < favs.length; i++) {
      if (favs[i] === url) { found = true; } else { out.push(favs[i]); }
    }
    if (!found) out.push(url);
    favs = out;
    store(FAV_KEY, JSON.stringify(favs));
  }

  /* --- 条目 ---------------------------------------------- */

  function makeItem(rec) {
    var wrap = document.createElement('div');
    wrap.className = 'item';

    var a = document.createElement('a');
    a.className = 'item-link';
    a.dataset.url = rec.url;
    a.dataset.name = rec.name;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';

    if (rec.adult) {
      /* 成人条目不给真 href：中键点击、右键「在新标签页打开」
         都不触发 click 事件，有真地址就能绕过年龄确认。
         地址放 data-url，由 click 处理器确认后再 open。 */
      a.dataset.adult = '1';
      a.href = '#';
      a.removeAttribute('target');
    } else {
      a.href = rec.url;
    }

    var n = document.createElement('span');
    n.className = 'item-name';
    n.textContent = rec.name;

    if (rec.adult) {
      var b = document.createElement('span');
      b.className = 'item-badge';
      b.textContent = '18+';
      n.appendChild(b);
    }
    a.appendChild(n);

    if (rec.note) {
      var p = document.createElement('span');
      p.className = 'item-note';
      p.textContent = rec.note;
      a.appendChild(p);
    }

    var h = document.createElement('span');
    h.className = 'item-host';
    h.textContent = hostOf(rec.url);
    a.appendChild(h);

    wrap.appendChild(a);

    var star = document.createElement('button');
    star.type = 'button';
    star.className = 'star';
    star.dataset.url = rec.url;
    star.dataset.name = rec.name;
    paintStar(star, isFav(rec.url));
    wrap.appendChild(star);

    return wrap;
  }

  function paintStar(btn, on) {
    btn.textContent = on ? '★' : '☆';
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', (on ? '取消收藏 ' : '收藏 ') + (btn.dataset.name || ''));
  }

  /* --- 渲染 ----------------------------------------------
     词条式两栏：左边一格是分类名，右边铺这一类的站点。
     像一张对照表，不是卡片堆。 */

  function paintAll() {
    $('brand-name').textContent = SITE.name || '备考导航';
    $('brand-tag').textContent = SITE.tagline || '';
    document.title = (SITE.name || '备考导航') + ' - 考研、公考、语言、编程与文献网址分类';
    $('foot-note').textContent = SITE.deployedOn
      ? '本页部署在 ' + SITE.deployedOn + '，收藏只存在你这台设备上。'
      : '收藏只存在你这台设备上，换浏览器就没了。';

    var host = $('groups');
    var total = 0, shownGroups = 0;

    GROUPS.forEach(function (g, gi) {
      /* 分类元组同样要校验。只校验条目行的话，分类写错一个
         （漏了外层数组、第三项不是数组）就会在 rows.forEach 上
         抛错，被外层 catch 兜成「格式有问题」，七个分类全没了 ——
         和下面那条「一处笔误不该把整页毙掉」的策略自相矛盾。 */
      if (Object.prototype.toString.call(g) !== '[object Array]' ||
          typeof g[0] !== 'string' || !g[0] ||
          Object.prototype.toString.call(g[2]) !== '[object Array]') {
        if (window.console && console.warn) {
          console.warn('sites.js：第 ' + (gi + 1) + ' 个分类格式不对，已跳过', g);
        }
        return;
      }
      var title = g[0], glyph = g[1], rows = g[2];

      var sect = document.createElement('section');
      sect.className = 'row';
      sect.dataset.group = title;

      var head = document.createElement('div');
      head.className = 'row-label';

      /* 角标是纯装饰的视觉锚点，对读屏器没有意义 */
      var g1 = document.createElement('span');
      g1.className = 'row-glyph';
      g1.textContent = glyph || '';
      g1.setAttribute('aria-hidden', 'true');

      var h2 = document.createElement('h2');
      h2.textContent = title;

      var sc = document.createElement('span');
      sc.className = 'tally';
      sc.textContent = '0';   // paintAll 末尾按实际渲染出的条数回填

      head.appendChild(g1);
      head.appendChild(h2);
      head.appendChild(sc);
      sect.appendChild(head);

      var rowsBox = document.createElement('div');
      rowsBox.className = 'items';

      var good = 0;
      rows.forEach(function (row, ri) {
        /* 格式不对的行跳过，不让它渲染成 href="undefined"、
           域名显示成字面量 undefined 的坏链接。
           不抛错：一处笔误不该把整页毙掉，访客还得用。 */
        /* 必须真的是数组：字符串也有 length、也能按下标取字符，
           所以误写成 'https://x.com' 这样的裸字符串会被放过，
           渲染成名字叫 h、href 是 t 的坏链接。 */
        /* 网址必须是 http(s)：sites.js 被宣传成「只需要改这一个
           文件」，也就是非作者最可能动的那个。不挡的话一条
           javascript: 开头的网址就是可点击执行的脚本。
           名称也要非空，否则渲染出没有名字的条目和
           「收藏 」这种没有宾语的 aria-label。 */
        if (Object.prototype.toString.call(row) !== '[object Array]' ||
            typeof row[0] !== 'string' || !row[0] ||
            typeof row[1] !== 'string' || !/^https?:\/\//i.test(row[1])) {
          if (window.console && console.warn) {
            console.warn('sites.js：分类「' + title + '」第 ' + (ri + 1) + ' 行格式不对，已跳过', row);
          }
          return;
        }
        var rec = {
          name: row[0], url: row[1], note: row[2] || '',
          adult: row[3] === 'adult', group: title
        };
        good++;
        rowsBox.appendChild(makeItem(rec));
      });

      sc.textContent = good;

      sect.appendChild(rowsBox);
      host.appendChild(sect);
      total += good;
      shownGroups++;
    });

    /* 用真正渲染出来的数，不是 GROUPS.length —— 有分类被跳过时
       页面上只有 8 段，却报「9 个分类」就对不上了。 */
    var stat = $('stat');
    if (stat) stat.textContent = shownGroups + ' 个分类 · ' + total + ' 个站点';
  }

  /* 收藏按钮用事件委托：条目会被重绘，逐个绑定会丢 */
  function wireStars() {
    document.addEventListener('click', function (e) {
      var btn = closestOf(e.target, '.star');
      if (!btn) return;
      var url = btn.dataset.url;
      toggleFav(url);
      var all = document.querySelectorAll('.star[data-url="' + cssEscape(url) + '"]');
      for (var i = 0; i < all.length; i++) paintStar(all[i], isFav(url));
      /* 开着「只看收藏」时取消收藏，那一条要立刻消失 */
      if (favOnly && ready) filter(localQuery());
    });
  }

  function cssEscape(s) { return String(s).replace(/["\\]/g, '\\$&'); }

  /* Element.closest 在 IE11 / 老 Android WebView 上没有。
     原先写成 el.closest ? el.closest(sel) : null，那些引擎上
     星标和 18+ 链接会「看着能点、点了毫无反应」——
     成人条目的 href 是 #，点一下只会跳到页顶。
     本文件只用类选择器，手动往上走一遍就够。 */
  function closestOf(el, sel) {
    if (el && el.closest) return el.closest(sel);
    var cls = sel.charAt(0) === '.' ? sel.slice(1) : sel;
    while (el && el.nodeType === 1) {
      if ((' ' + (el.className || '') + ' ').indexOf(' ' + cls + ' ') !== -1) return el;
      el = el.parentNode;
    }
    return null;
  }

  /* --- 成人条目确认 --------------------------------------
     只拦这一条，其余链接照常直达。整站弹门会把知网、学信网、Coursera
     也锁在 18+ 警告后面，既荒唐也劝退正常访客。          */

  var pending = null;
  var adultOk = false;
  var opener = null;
  var prevBody = null;   // 锁滚动前 body 的内联样式
  var lockedY = 0;

  /* iOS Safari 上 body{overflow:hidden} 拦不住背景滚动，
     要靠 position:fixed + 负 top，关闭时再滚回去。
     原值要存下来还原，不能硬写成 ''，那会抹掉页面原有的内联样式。 */
  function lockScroll() {
    var b = document.body;
    lockedY = window.pageYOffset || document.documentElement.scrollTop || 0;
    prevBody = { overflow: b.style.overflow, position: b.style.position,
                 top: b.style.top, width: b.style.width };
    b.style.overflow = 'hidden';
    b.style.position = 'fixed';
    b.style.top = (-lockedY) + 'px';
    b.style.width = '100%';
  }

  function unlockScroll() {
    if (!prevBody) return;
    var b = document.body;
    b.style.overflow = prevBody.overflow;
    b.style.position = prevBody.position;
    b.style.top = prevBody.top;
    b.style.width = prevBody.width;
    prevBody = null;
    /* 显式写 instant：还原滚动位置这件事永远不该有动画。
       本模板没有设 scroll-behavior: smooth，但只要哪天加上，
       scrollTo(0,y) 就会变成「弹到顶再慢慢滚回来」。
       写死 instant 把这个坑提前堵上。 */
    try { window.scrollTo({ top: lockedY, left: 0, behavior: 'instant' }); }
    catch (e) { window.scrollTo(0, lockedY); }
  }

  function askOpen() { return !$('ask').hidden; }

  function openAsk(from) {
    opener = from || null;
    $('ask').hidden = false;
    /* 背景设 inert：否则 Tab 能走到遮罩后面的链接，
       aria-modal 只影响读屏器，管不住键盘焦点。
       inert 不是所有引擎都有（Safari < 15.5、Firefox < 112），
       所以下面还有一道焦点环绕兜底，两者都要。 */
    var shell = $('shell');
    if ('inert' in shell) shell.inert = true;
    lockScroll();
    $('ask-ok').focus();
  }

  function closeAsk() {
    $('ask').hidden = true;
    var shell = $('shell');
    if ('inert' in shell) shell.inert = false;
    unlockScroll();
    pending = null;
    /* 焦点还给触发的链接，否则键盘用户被丢回 <body>。
       先解除 inert 再聚焦，而且目标必须是当前可见的。

       必须带 preventScroll：上面 unlockScroll 刚把滚动位置还原好，
       普通的 focus() 会把这个链接重新滚进视口，等于又把页面拉走。
       老引擎不认这个选项，退回普通 focus()。 */
    if (opener && document.contains(opener) && opener.offsetParent !== null) {
      try { opener.focus({ preventScroll: true }); }
      catch (e) { try { opener.focus(); } catch (e2) {} }
    }
    opener = null;
  }

  function wireAdult() {
    document.addEventListener('click', function (e) {
      var a = closestOf(e.target, '.item-link');
      if (!a || a.dataset.adult !== '1') return;

      e.preventDefault();
      var url = a.dataset.url;
      if (!url) return;

      if (adultOk || load(ADULT_KEY) === '1') {
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }

      pending = url;
      $('ask-name').textContent = a.dataset.name || '该站点';
      openAsk(a);
    });

    $('ask-ok').addEventListener('click', function () {
      adultOk = true;
      store(ADULT_KEY, '1');
      var url = pending;
      closeAsk();
      /* 在按钮的点击处理里 open，属于用户手势，不会被拦成弹窗 */
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    });

    $('ask-no').addEventListener('click', closeAsk);

    document.addEventListener('keydown', function (e) {
      if (!askOpen()) return;

      /* IE11 报的是 'Esc' 不是 'Escape'，不认的话那些引擎上关不掉 */
      if (e.key === 'Escape' || e.key === 'Esc') { closeAsk(); return; }

      /* 焦点环绕：没有 inert 的引擎上，Tab 会直接走到遮罩
         后面的搜索框和链接去，年龄确认就被绕过了。
         在两个按钮之间手动兜一圈。 */
      if (e.key !== 'Tab') return;
      var first = $('ask-ok'), last = $('ask-no');
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      } else if (document.activeElement !== first && document.activeElement !== last) {
        e.preventDefault(); first.focus();
      }
    });
  }

  /* --- 查找 ----------------------------------------------
     命中的模块留下，没命中的整块藏掉，列会自动重排。 */

  var ENGINES = {
    baidu:  'https://www.baidu.com/s?wd=',
    bing:   'https://www.bing.com/search?q=',
    google: 'https://www.google.com/search?q='
  };

  var ready = false;    // paintAll 真的跑完了才置 true
  var favOnly = false;  // 「只看收藏」开关

  /* 下拉切到百度/Bing/Google 时输入框是给外部引擎用的，
     不该拿它过滤本页。收藏开关和星标重绘都要走这里，
     否则「选了百度、打了几个字、再点只看收藏」会莫名其妙
     按那几个字把页面筛空。 */
  /* 标出最后一条「可见」的分类行，让它不画底边。
     纯 CSS 的 :last-child 不行：查找是用 hidden 把行藏起来的，
     DOM 顺序没变，尾部被藏掉时页面会以一条悬空的分隔线结束。

     用 classList 而不是改 className 字符串 —— 后者在反复
     增删同一个类名时很容易漏掉，调试过一次就不想再碰。 */
  function markLastVisible() {
    var sects = document.querySelectorAll('#groups .row');
    var last = null;
    for (var k = 0; k < sects.length; k++) {
      if (sects[k].classList) sects[k].classList.remove('is-last');
      if (!sects[k].hidden) last = sects[k];
    }
    if (last && last.classList) last.classList.add('is-last');
  }

  function localQuery() {
    return $('engine').value === 'local' ? $('find').value : '';
  }

  function filter(q) {
    /* 只看 GROUPS 不够：SITE 未定义、或 paintAll 中途抛错时
       GROUPS 可能是好的，filter 照样会往 paintError 的提示框
       下面再贴一句「没有匹配…的站点」，自相矛盾。
       以渲染是否成功为准。 */
    if (!ready) return;

    var key = q.trim().toLowerCase();
    var sects = document.querySelectorAll('#groups .row');
    var total = 0;

    for (var i = 0; i < sects.length; i++) {
      var items = sects[i].querySelectorAll('.item');
      var shown = 0;

      for (var j = 0; j < items.length; j++) {
        var link = items[j].querySelector('.item-link');
        var hay = (link.textContent + ' ' + sects[i].dataset.group + ' ' +
                   (link.dataset.url || '')).toLowerCase();
        var hit = (!key || hay.indexOf(key) !== -1) &&
                  (!favOnly || isFav(link.dataset.url));
        items[j].hidden = !hit;
        if (hit) shown++;
      }

      /* 没有关键词、也没开「只看收藏」时一律显示：否则条目为空的
         分类（比如占位的 ['备用','备',[]]）会在第一次查找之后
         永久消失，刷新才回来。 */
      sects[i].hidden = (!!key || favOnly) && shown === 0;

      var c = sects[i].querySelector('.tally');
      if (c) c.textContent = shown;

      total += shown;
    }

    markLastVisible();

    var empty = $('empty');
    if (total === 0 && (key || favOnly)) {
      if (favOnly && !key) {
        empty.textContent = '还没有收藏。把鼠标移到条目上，点右边的 ☆ 就能放进来。';
      } else if (favOnly) {
        empty.textContent = '收藏里没有匹配「' + q.trim() + '」的站点。关掉「只看收藏」再搜一次。';
      } else {
        empty.textContent = '没有匹配「' + q.trim() + '」的站点。换个词，或者用上面的下拉切到百度、Bing、Google 直接搜。';
      }
      empty.hidden = false;
    } else {
      empty.hidden = true;
    }
  }

  function wireFavOnly() {
    var btn = $('only-fav');
    if (!btn) return;
    btn.addEventListener('click', function () {
      favOnly = !favOnly;
      btn.setAttribute('aria-pressed', favOnly ? 'true' : 'false');
      if (ready) filter(localQuery());
    });
  }

  function wireFind() {
    var input = $('find');

    input.addEventListener('input', function () {
      if ($('engine').value === 'local') filter(input.value);
    });

    $('engine').addEventListener('change', function () {
      filter($('engine').value === 'local' ? input.value : '');
    });

    $('find-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var q = input.value.trim();
      var eng = $('engine').value;
      if (eng === 'local') { filter(q); return; }
      if (!q) { input.focus(); return; }
      window.open(ENGINES[eng] + encodeURIComponent(q), '_blank', 'noopener,noreferrer');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      /* 确认框开着时别抢焦点：焦点会跳到遮罩后面看不见的输入框 */
      if (askOpen()) return;
      var t = e.target;
      var tag = t && t.tagName ? t.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || (t && t.isContentEditable)) return;
      e.preventDefault();
      input.focus();
      input.select();
    });
  }

  /* --- 出问题时的兜底 ------------------------------------ */

  function paintError(kind) {
    var host = $('groups');
    host.textContent = '';

    var box = document.createElement('div');
    box.className = 'notice';
    var h = document.createElement('h2');
    h.textContent = kind === 'data' ? '网址数据没能加载' : '网址数据格式有问题';
    var p = document.createElement('p');
    p.textContent = kind === 'data'
      ? '刷新一下通常就好。如果反复失败，说明 sites.js 被拦截了。'
      : '格式不对的分类和条目会被自动跳过，所以走到这里多半不是数据问题 —— 检查 SITE 是不是被写成了 null，或者 index.html 里的节点被改名了。';
    box.appendChild(h);
    box.appendChild(p);
    host.appendChild(box);
  }

  /* --- 启动 ---------------------------------------------- */

  try { initTheme(); } catch (e) {}
  try { loadFavs(); } catch (e) {}

  var problem = '';
  try {
    if (typeof SITE === 'undefined' || typeof GROUPS === 'undefined') problem = 'data';
    else { paintAll(); ready = true; }
  } catch (e) {
    problem = 'render';
  }
  if (!problem) { try { markLastVisible(); } catch (e) {} }

  if (problem) {
    try { paintError(problem); } catch (e) {}
    /* 不禁用的话，页面上会留一个看着能用、敲进去却毫无反应的
       搜索框（ready 为 false，filter 直接 return），
       以及两行空的标语和页脚。 */
    try {
      $('find').disabled = true;
      $('engine').disabled = true;
      $('find-form').querySelector('button').disabled = true;
      $('only-fav').disabled = true;
      $('brand-tag').hidden = true;
      $('foot-note').hidden = true;
    } catch (e) {}
  }

  /* 事件绑定各自独立 try，且绝不走 paintError —— 那会清空
     已经渲染好的内容，再甩出一句「检查 sites.js 格式」，
     而 sites.js 其实毫无问题。 */
  try { wireStars(); } catch (e) {}
  try { wireAdult(); } catch (e) {}
  try { wireFind(); }  catch (e) {}
  try { wireFavOnly(); } catch (e) {}

  $('shell').hidden = false;
})();
