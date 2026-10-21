const toc = document.getElementById('toc');
const mobileToc = document.getElementById('mobile-toc');
const list = document.getElementById('rules-list');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const languageButtons = document.querySelectorAll('[data-lang]');

const languageFiles = { th: 'rules.json', en: 'rules.en.json', vi: 'rules.vi.json' };
const ui = {
  th: {
    htmlLang: 'th', title: 'กฎเซิร์ฟเวอร์ · Primal World',
    description: 'อ่านกฎเซิร์ฟเวอร์ Primal World สำหรับ The Isle Evrima ทั้งการต่อสู้ การล่า และกฎเฉพาะสายพันธุ์',
    languageLabel: 'เลือกภาษา', skip: 'ข้ามไปที่กฎ', home: 'กลับเว็บหลัก', sidebarTitle: 'กฎเซิร์ฟเวอร์',
    sidebarIntro: 'The Isle · Evrima\nอ่านกฎก่อนเริ่มต้นชีวิตบนเกาะ', toc: 'สารบัญ', categoryCount: count => `${count} หมวด`,
    question: 'มีข้อสงสัยเกี่ยวกับกฎ?', askDiscord: 'สอบถามทีมงานใน Discord ↗', pageTitleTop: 'กฎแห่งการ',
    pageTitleEm: 'เอาชีวิตรอด', pageIntro: 'กฎสำหรับผู้เล่น Primal World บน The Isle Evrima เลือกหัวข้อจากสารบัญเพื่ออ่านรายละเอียดแต่ละหมวด',
    updated: 'แก้ไขกฎล่าสุด', updatedDate: '21 ตุลาคม 2569', searchLabel: 'ค้นหาคำในกฎ',
    searchPlaceholder: 'เช่น Combat Logging, การล่า, เสียง 4', searchButton: 'ค้นหา', mobileToc: 'ไปยังกฎ',
    loading: 'กำลังโหลดกฎ...', loadError: 'ไม่สามารถโหลดกฎได้ กรุณารีเฟรชหน้านี้อีกครั้ง', backTop: 'กลับไปด้านบน ↑',
    clear: 'ล้างการค้นหา', found: (count, query) => `พบ ${count} หมวดสำหรับ “${query}”`,
    notFound: query => `ไม่พบกฎที่มีคำว่า “${query}”`
  },
  en: {
    htmlLang: 'en', title: 'Server Rules · Primal World',
    description: 'Read the Primal World server rules for The Isle Evrima, including combat, hunting, grouping, and species rules.',
    languageLabel: 'Select language', skip: 'Skip to the rules', home: 'Main website', sidebarTitle: 'Server Rules',
    sidebarIntro: 'The Isle · Evrima\nRead the rules before beginning your life on the island.', toc: 'Contents', categoryCount: count => `${count} categories`,
    question: 'Questions about the rules?', askDiscord: 'Ask the staff on Discord ↗', pageTitleTop: 'Rules of',
    pageTitleEm: 'Survival', pageIntro: 'Rules for Primal World players on The Isle Evrima. Choose a topic from the contents to read each section.',
    updated: 'Rules last updated', updatedDate: '21 October 2026', searchLabel: 'Search the rules',
    searchPlaceholder: 'e.g. Combat Logging, hunting, call 4', searchButton: 'Search', mobileToc: 'Jump to a rule',
    loading: 'Loading rules...', loadError: 'Unable to load the rules. Please refresh this page.', backTop: 'Back to top ↑',
    clear: 'Clear search', found: (count, query) => `${count} categories found for “${query}”`,
    notFound: query => `No rules found containing “${query}”`
  },
  vi: {
    htmlLang: 'vi', title: 'Quy tắc máy chủ · Primal World',
    description: 'Đọc quy tắc máy chủ Primal World dành cho The Isle Evrima, bao gồm chiến đấu, săn mồi, tổ đội và quy tắc từng loài.',
    languageLabel: 'Chọn ngôn ngữ', skip: 'Chuyển đến phần quy tắc', home: 'Trang web chính', sidebarTitle: 'Quy tắc máy chủ',
    sidebarIntro: 'The Isle · Evrima\nHãy đọc quy tắc trước khi bắt đầu sinh tồn trên đảo.', toc: 'Mục lục', categoryCount: count => `${count} mục`,
    question: 'Bạn có thắc mắc về quy tắc?', askDiscord: 'Hỏi đội ngũ trên Discord ↗', pageTitleTop: 'Quy tắc',
    pageTitleEm: 'Sinh tồn', pageIntro: 'Quy tắc dành cho người chơi Primal World trong The Isle Evrima. Chọn một chủ đề trong mục lục để xem chi tiết.',
    updated: 'Cập nhật quy tắc lần cuối', updatedDate: '21 tháng 10 năm 2026', searchLabel: 'Tìm kiếm quy tắc',
    searchPlaceholder: 'Ví dụ: Combat Logging, săn mồi, tiếng gọi 4', searchButton: 'Tìm kiếm', mobileToc: 'Đi đến quy tắc',
    loading: 'Đang tải quy tắc...', loadError: 'Không thể tải quy tắc. Vui lòng tải lại trang.', backTop: 'Về đầu trang ↑',
    clear: 'Xóa tìm kiếm', found: (count, query) => `Tìm thấy ${count} mục cho “${query}”`,
    notFound: query => `Không tìm thấy quy tắc chứa “${query}”`
  }
};

let currentLanguage = 'th';
let currentRules = [];
let observer = null;
let requestNumber = 0;

function el(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content != null) node.textContent = content;
  return node;
}

function appendRichText(node, value) {
  const parts = value.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  parts.forEach(part => {
    if (part.startsWith('**') && part.endsWith('**')) node.append(el('strong', '', part.slice(2, -2)));
    else if (part.startsWith('*') && part.endsWith('*')) node.append(el('em', '', part.slice(1, -1)));
    else node.append(document.createTextNode(part));
  });
}

function renderRule(rule, index) {
  const section = el('section', 'rule-card');
  section.id = rule.id;
  section.setAttribute('aria-labelledby', `${rule.id}-title`);
  const heading = el('div', 'rule-heading');
  heading.append(el('span', 'rule-number', String(index + 1).padStart(2, '0')));
  const titleWrap = el('div', 'rule-title-wrap');
  titleWrap.append(el('div', 'rule-category', rule.category));
  const h3 = el('h3', '', rule.title);
  h3.id = `${rule.id}-title`;
  titleWrap.append(h3);
  heading.append(titleWrap);
  section.append(heading);

  const body = el('div', 'rule-body');
  let bullets = null;
  let specialGrid = null;
  let subheadNumber = 0;
  for (const part of rule.content) {
    if (part.type === 'bullet' || part.type === 'bullet-nested' || part.type === 'prohibit') {
      specialGrid = null;
      if (!bullets) { bullets = el('ul', 'rule-bullets'); body.append(bullets); }
      const item = el('li', part.type === 'prohibit' ? 'prohibited' : part.type === 'bullet-nested' ? 'nested' : '');
      appendRichText(item, part.text);
      bullets.append(item);
    } else if (part.type === 'pack-entry') {
      bullets = null;
      if (!specialGrid || !specialGrid.classList.contains('pack-grid')) {
        specialGrid = el('div', 'pack-grid');
        body.append(specialGrid);
      }
      const item = el('div', `pack-entry ${part.diet || ''}`);
      item.append(el('strong', '', part.text), el('span', '', part.count));
      specialGrid.append(item);
    } else if (part.type === 'tier') {
      bullets = null;
      if (!specialGrid || !specialGrid.classList.contains('penalty-grid')) {
        specialGrid = el('div', 'penalty-grid');
        body.append(specialGrid);
      }
      const item = el('div', 'penalty-tier');
      item.append(el('span', '', part.text), el('strong', '', part.penalty));
      specialGrid.append(item);
    } else {
      bullets = null;
      specialGrid = null;
      const item = el(part.type === 'subhead' ? 'h4' : 'p', part.type);
      if (part.type === 'subhead') item.id = `${rule.id}-section-${++subheadNumber}`;
      appendRichText(item, part.text);
      body.append(item);
    }
  }
  section.append(body);
  return section;
}

function searchRules(rules, query) {
  const locale = currentLanguage === 'vi' ? 'vi' : currentLanguage === 'th' ? 'th' : 'en';
  const term = query.trim().toLocaleLowerCase(locale);
  if (!term) return [];
  return rules.map((rule, index) => {
    const foundIndex = rule.content.findIndex(part => part.text.replace(/\*/g, '').toLocaleLowerCase(locale).includes(term));
    const found = rule.content[foundIndex];
    const titleMatch = rule.title.toLocaleLowerCase(locale).includes(term);
    if (!titleMatch && !found) return null;
    const preceding = rule.content.slice(0, foundIndex + 1).filter(part => part.type === 'subhead');
    const anchor = titleMatch || !preceding.length ? rule.id : `${rule.id}-section-${preceding.length}`;
    const excerptPart = found?.type === 'subhead' ? rule.content[foundIndex + 1] : found;
    return { rule, index, anchor, subhead: titleMatch ? null : preceding.at(-1)?.text,
      excerpt: (excerptPart?.text ?? rule.content[0]?.text ?? '').replace(/\*/g, '') };
  }).filter(Boolean);
}

function renderSearchResults(matches, query) {
  const copyText = ui[currentLanguage];
  searchResults.hidden = false;
  searchResults.replaceChildren();
  const top = el('div', 'search-results-top');
  top.append(el('p', '', matches.length ? copyText.found(matches.length, query) : copyText.notFound(query)));
  const clear = el('button', 'clear-search', copyText.clear);
  clear.type = 'button';
  clear.addEventListener('click', () => {
    searchInput.value = '';
    searchResults.hidden = true;
    searchResults.replaceChildren();
    searchInput.focus();
  });
  top.append(clear);
  searchResults.append(top);
  if (!matches.length) return;
  const results = el('div', 'search-result-list');
  matches.forEach(({ rule, index, anchor, subhead, excerpt }) => {
    const link = el('a', 'search-result');
    link.href = `#${anchor}`;
    link.append(el('span', 'search-result-number', String(index + 1).padStart(2, '0')));
    const copy = el('span', 'search-result-copy');
    copy.append(el('strong', '', subhead ? `${rule.title} · ${subhead}` : rule.title), el('small', '', excerpt));
    link.append(copy, el('span', 'search-result-arrow', '↗'));
    results.append(link);
  });
  searchResults.append(results);
}

function applyUiText(language) {
  const copyText = ui[language];
  document.documentElement.lang = copyText.htmlLang;
  document.title = copyText.title;
  document.querySelector('meta[name="description"]').content = copyText.description;
  document.querySelectorAll('[data-i18n]').forEach(node => {
    const value = copyText[node.dataset.i18n];
    if (typeof value === 'string') node.textContent = value;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(node => {
    node.placeholder = copyText[node.dataset.i18nPlaceholder];
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(node => {
    node.setAttribute('aria-label', copyText[node.dataset.i18nAria]);
  });
  languageButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lang === language)));
}

function renderSite(rules) {
  currentRules = rules;
  observer?.disconnect();
  toc.replaceChildren();
  mobileToc.replaceChildren();
  searchInput.value = '';
  searchResults.hidden = true;
  searchResults.replaceChildren();

  const sections = [];
  let currentGroup = null;
  rules.forEach((rule, index) => {
    if (rule.group !== currentGroup) {
      currentGroup = rule.group;
      if (index > 0) sections.push(el('h2', 'rules-group-title', currentGroup));
    }
    sections.push(renderRule(rule, index));
  });
  list.replaceChildren(...sections);
  document.getElementById('rule-count').textContent = ui[currentLanguage].categoryCount(rules.length);
  document.getElementById('guide-count').textContent = String(rules.length).padStart(2, '0');
  document.getElementById('section-count').textContent = `01 — ${String(rules.length).padStart(2, '0')}`;

  let tocGroup = null;
  rules.forEach((rule, index) => {
    if (rule.group !== tocGroup) {
      tocGroup = rule.group;
      toc.append(el('div', 'toc-group', tocGroup));
    }
    const link = el('a', '', rule.title);
    link.href = `#${rule.id}`;
    link.prepend(el('span', 'toc-number', String(index + 1).padStart(2, '0')));
    toc.append(link);
    const mobileLink = el('a', '', `${String(index + 1).padStart(2, '0')} ${rule.title}`);
    mobileLink.href = `#${rule.id}`;
    mobileToc.append(mobileLink);
  });

  observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        toc.querySelectorAll('a').forEach(anchor => anchor.classList.toggle('active', anchor.hash === `#${entry.target.id}`));
      }
    });
  }, { rootMargin: '-12% 0px -72% 0px' });
  list.querySelectorAll('.rule-card').forEach(card => observer.observe(card));
}

async function setLanguage(language) {
  if (!languageFiles[language]) language = 'th';
  currentLanguage = language;
  const activeRequest = ++requestNumber;
  applyUiText(language);
  list.replaceChildren(el('p', 'loading', ui[language].loading));
  try {
    const response = await fetch(`${languageFiles[language]}?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('rules unavailable');
    const rules = await response.json();
    if (activeRequest !== requestNumber) return;
    renderSite(rules);
  } catch {
    if (activeRequest === requestNumber) list.replaceChildren(el('p', 'load-error', ui[language].loadError));
  }
}

languageButtons.forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.lang)));
searchForm.addEventListener('submit', event => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (!query) { searchInput.focus(); return; }
  renderSearchResults(searchRules(currentRules, query), query);
  searchResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

setLanguage('th').then(() => {
  if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
});
