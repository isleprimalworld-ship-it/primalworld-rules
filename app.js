const toc = document.getElementById('toc');
const mobileToc = document.getElementById('mobile-toc');
const list = document.getElementById('rules-list');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

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
  const term = query.trim().toLocaleLowerCase();
  if (!term) return [];
  return rules.map((rule, index) => {
    const foundIndex = rule.content.findIndex(part => part.text.replace(/\*/g, '').toLocaleLowerCase().includes(term));
    const found = rule.content[foundIndex];
    const titleMatch = rule.title.toLocaleLowerCase().includes(term);
    if (!titleMatch && !found) return null;
    const preceding = rule.content.slice(0, foundIndex + 1).filter(part => part.type === 'subhead');
    const anchor = titleMatch || !preceding.length ? rule.id : `${rule.id}-section-${preceding.length}`;
    const excerptPart = found?.type === 'subhead' ? rule.content[foundIndex + 1] : found;
    return { rule, index, anchor, subhead: titleMatch ? null : preceding.at(-1)?.text,
      excerpt: (excerptPart?.text ?? rule.content[0]?.text ?? '').replace(/\*/g, '') };
  }).filter(Boolean);
}

function renderSearchResults(matches, query) {
  searchResults.hidden = false;
  searchResults.replaceChildren();
  const top = el('div', 'search-results-top');
  top.append(el('p', '', matches.length ? `พบ ${matches.length} หมวดสำหรับ “${query}”` : `ไม่พบกฎที่มีคำว่า “${query}”`));
  const clear = el('button', 'clear-search', 'ล้างการค้นหา');
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

fetch(`rules.json?v=${Date.now()}`, { cache: 'no-store' })
  .then(response => { if (!response.ok) throw new Error('rules unavailable'); return response.json(); })
  .then(rules => {
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
    document.getElementById('rule-count').textContent = `${rules.length} หมวด`;
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
      const number = el('span', 'toc-number', String(index + 1).padStart(2, '0'));
      link.prepend(number);
      toc.append(link);
      const mobileLink = el('a', '', `${String(index + 1).padStart(2, '0')} ${rule.title}`);
      mobileLink.href = `#${rule.id}`;
      mobileToc.append(mobileLink);
    });
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          toc.querySelectorAll('a').forEach(a => a.classList.toggle('active', a.hash === `#${entry.target.id}`));
        }
      });
    }, { rootMargin: '-12% 0px -72% 0px' });
    list.querySelectorAll('.rule-card').forEach(card => observer.observe(card));
    searchForm.addEventListener('submit', event => {
      event.preventDefault();
      const query = searchInput.value.trim();
      if (!query) { searchInput.focus(); return; }
      renderSearchResults(searchRules(rules, query), query);
      searchResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
  })
  .catch(() => { list.replaceChildren(el('p', 'load-error', 'ไม่สามารถโหลดกฎได้ กรุณารีเฟรชหน้านี้อีกครั้ง')); });
