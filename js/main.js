/* =============================================
   북샘 - 공통 JS
   ============================================= */

// 카트 상태 (localStorage)
const Cart = {
  items: JSON.parse(localStorage.getItem('booksam_cart') || '[]'),

  add(book) {
    const existing = this.items.find(i => i.id === book.id);
    if (existing) {
      existing.qty++;
    } else {
      this.items.push({ ...book, qty: 1 });
    }
    this.save();
    this.updateBadge();
    Toast.show(`"${book.title}"을(를) 장바구니에 담았습니다.`, 'success');
  },

  remove(id) {
    this.items = this.items.filter(i => i.id !== id);
    this.save();
    this.updateBadge();
  },

  updateQty(id, qty) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.qty = Math.max(1, qty);
      this.save();
    }
  },

  total() {
    return this.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  },

  count() {
    return this.items.reduce((sum, i) => sum + i.qty, 0);
  },

  save() {
    localStorage.setItem('booksam_cart', JSON.stringify(this.items));
  },

  updateBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    const count = this.count();
    badges.forEach(b => {
      b.textContent = count;
      b.style.display = count > 0 ? '' : 'none';
    });
  }
};

// 비로그인 시 잔존 wishlist 데이터 제거
if (localStorage.getItem('isLoggedIn') !== 'true') {
  localStorage.removeItem('booksam_wish');
}

// Wishlist
const Wish = {
  items: localStorage.getItem('isLoggedIn') === 'true'
    ? JSON.parse(localStorage.getItem('booksam_wish') || '[]')
    : [],

  toggle(id) {
    if (this.has(id)) {
      this.items = this.items.filter(i => i !== id);
    } else {
      this.items.push(id);
    }
    localStorage.setItem('booksam_wish', JSON.stringify(this.items));
    return this.has(id);
  },

  has(id) {
    return this.items.includes(id);
  }
};

// ── 하트(관심 교재) 로그인 게이트 ──
function toggleWish(btn, id) {
  const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
  if (!loggedIn) {
    // 기존 모달 중복 방지
    document.getElementById('_wishLoginOv')?.remove();

    const ov = document.createElement('div');
    ov.id = '_wishLoginOv';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center;';
    ov.innerHTML = `
      <div style="background:#fff;border-radius:14px;padding:36px 32px;max-width:320px;width:90%;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,.18);">
        <div style="font-size:36px;margin-bottom:12px;">🔒</div>
        <div style="font-size:16px;font-weight:800;color:#1a2e44;margin-bottom:8px;">로그인이 필요합니다</div>
        <div style="font-size:13px;color:#888;margin-bottom:24px;line-height:1.7;">관심 교재에 추가하려면<br>로그인이 필요합니다.</div>
        <div style="display:flex;gap:10px;">
          <button onclick="document.getElementById('_wishLoginOv').remove()"
            style="flex:1;padding:12px;border:1.5px solid #ddd;border-radius:8px;background:#fff;font-size:14px;font-weight:700;cursor:pointer;color:#555;">닫기</button>
          <button onclick="
              localStorage.setItem('redirectAfterLogin', location.href);
              localStorage.setItem('pendingWishId', '${id}');
              location.href='login.html';"
            style="flex:1;padding:12px;border:none;border-radius:8px;background:#dc2626;color:#fff;font-size:14px;font-weight:700;cursor:pointer;">로그인 바로가기</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
    return; // 버튼 상태 변경 없음
  }

  // 로그인 상태: 토글
  const active = Wish.toggle(id);
  btn.classList.toggle('active', active);
  btn.textContent = active ? '❤️' : '🤍';
  Toast.show(active ? '관심 교재에 추가되었습니다.' : '관심 교재에서 제거되었습니다.', 'success');
}

// ── 로그인 후 복귀 시 pending 위시 처리 ──
// main.js는 <body> 하단에 로드되므로 즉시 실행 (DOMContentLoaded 이미 완료)
(function _checkPendingWish() {
  const pendingId = localStorage.getItem('pendingWishId');
  if (!pendingId || localStorage.getItem('isLoggedIn') !== 'true') return;
  localStorage.removeItem('pendingWishId');
  const id = parseInt(pendingId);
  if (!Wish.has(id)) {
    Wish.toggle(id); // 카드 렌더 전에 Wish.items 업데이트 → 카드가 ❤️로 그려짐
    setTimeout(() => {
      Toast.show('관심 교재에 추가되었습니다.', 'success');
    }, 400);
  }
})();

// Toast
const Toast = {
  show(msg, type = '') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✓' : 'ℹ'}</span> ${msg}`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }
};

// URL 파라미터 파싱
function getParam(key) {
  return new URLSearchParams(location.search).get(key);
}

// 숫자 포맷 (가격)
function fmtPrice(n) {
  return n.toLocaleString('ko-KR');
}

// 카테고리 라벨 / 색상 매핑
const CAT_INFO = {
  elementary: { label: '초등', color: 'var(--elementary)', tagClass: 'tag-elementary', icon: '📗', emoji: '🎒' },
  middle:     { label: '중학', color: 'var(--middle)',     tagClass: 'tag-middle',     icon: '📘', emoji: '📚' },
  high:       { label: '고등', color: 'var(--high)',       tagClass: 'tag-high',       icon: '📙', emoji: '🎓' },
  resources:  { label: '자료실', color: 'var(--resources)', tagClass: '',              icon: '📁', emoji: '📂' },
  events:     { label: '이벤트', color: 'var(--events)',   tagClass: '',               icon: '🎁', emoji: '🎉' },
};

// 샘플 도서 데이터 (영어 전용)
const BOOKS = [
  // ── 초등 ──
  { id: 1,  cat: 'elementary', type: 'ELT', subject: '영어', area: '파닉스', title: 'Phonics NOW 1',
    author: 'YBM 편집부',  price: 14000, originalPrice: 16000, badge: 'best',
    img: 'images/phonics-now-1.png', publisher: 'YBM', date: '2024.03.01',
    desc: '파닉스의 기초부터 탄탄하게! AR 기반 체험형 학습으로 파닉스를 즐겁게 배우는 시리즈입니다.' },
  { id: 2,  cat: 'elementary', type: 'ELT', subject: '영어', area: '파닉스', title: 'Phonics NOW 2',
    author: 'YBM 편집부',  price: 14000, originalPrice: 16000, badge: '',
    img: 'images/phonics-now-2.png', publisher: 'YBM', date: '2024.03.01',
    desc: '단모음·장모음 집중 학습! 단계별 워크북으로 파닉스 실력을 완성합니다.' },
  { id: 19, cat: 'elementary', type: 'ELT', subject: '영어', area: '파닉스', title: 'Phonics NOW 3',
    author: 'YBM 편집부',  price: 14000, originalPrice: 16000, badge: 'new',
    img: 'images/phonics-now-3.png', publisher: 'YBM', date: '2024.03.01',
    desc: '이중모음·사이트워드 완성! 파닉스의 마지막 단계로 독립 읽기를 준비합니다.' },
  { id: 20, cat: 'elementary', type: 'ELT', subject: '영어', area: '읽기', title: 'Benchmark Reading 1.1',
    author: 'YBM 편집부',  price: 13000, originalPrice: 15000, badge: 'best',
    img: 'images/benchmark-reading-1-1.png', publisher: 'YBM', date: '2024.05.01',
    desc: '수준별 읽기의 기준! 균형 잡힌 픽션·논픽션 지문으로 영어 독서 습관을 형성합니다.' },
  { id: 21, cat: 'elementary', type: 'ELT', subject: '영어', area: '읽기', title: 'Benchmark Reading 1.2',
    author: 'YBM 편집부',  price: 13000, originalPrice: 15000, badge: '',
    img: 'images/benchmark-reading-1-2.png', publisher: 'YBM', date: '2024.05.01',
    desc: '다양한 장르의 지문으로 읽기 유창성을 높이고 어휘력을 자연스럽게 확장합니다.' },
  { id: 22, cat: 'elementary', type: 'ELT', subject: '영어', area: '읽기', title: 'Benchmark Reading 1.3',
    author: 'YBM 편집부',  price: 13000, originalPrice: 15000, badge: '',
    img: 'images/benchmark-reading-1-3.png', publisher: 'YBM', date: '2024.05.01',
    desc: '독해 전략과 비판적 사고력을 함께 키우는 Benchmark Reading 1단계 완성편.' },
  // ── 중학 ──
  { id: 6,  cat: 'middle', type: '참고서', subject: '영어', area: '어휘', title: 'Booster Voca 기본',
    author: 'YBM 편집부',  price: 13000, originalPrice: 15000, badge: 'best',
    img: 'images/booster-voca-basic.png', publisher: 'YBM', date: '2024.01.01',
    desc: '50일로 끝내는 중등 필수 영단어 1000! 최신 교육과정 반영, 내신·수능 대비 필수 어휘 완성.' },
  { id: 7,  cat: 'middle', type: '참고서', subject: '영어', area: '어휘', title: 'Booster Voca 실력',
    author: 'YBM 편집부',  price: 13000, originalPrice: 15000, badge: '',
    img: 'images/booster-voca-power.png', publisher: 'YBM', date: '2024.01.01',
    desc: '50일로 끝내는 중등 필수 영단어 1200! 심화 어휘와 문맥 이해로 실력을 한 단계 높입니다.' },
  { id: 8,  cat: 'middle', type: '참고서', subject: '영어', area: '어휘', title: 'Booster Voca 완성',
    author: 'YBM 편집부',  price: 13000, originalPrice: 15000, badge: '',
    img: 'images/booster-voca-complete.png', publisher: 'YBM', date: '2024.01.01',
    desc: '50일로 끝내는 중등 필수 영단어 1200! 수능 기초까지 완성하는 최고 수준의 어휘 학습.' },
  { id: 16, cat: 'middle', type: '참고서', subject: '영어', area: '독해', title: 'I Love Reading Level 1 (2025)',
    author: '북샘 편집부', price: 13500, originalPrice: 15000, badge: 'best',
    img: 'images/ilove-reading-1.png', publisher: '북샘 교육출판', date: '2025.02.01',
    desc: '2025 개정 교육과정을 완벽 반영한 중학 영어 독해 시리즈.', tags: ['베스트셀러', '중학독해', 'MP3'] },
  { id: 17, cat: 'middle', type: '참고서', subject: '영어', area: '독해', title: 'I Love Reading Level 2 (2025)',
    author: '북샘 편집부', price: 13500, originalPrice: 15000, badge: 'new',
    img: 'images/ilove-reading-2.png', publisher: '북샘 교육출판', date: '2025.02.01',
    desc: '다양한 유형의 지문과 심화 독해 전략으로 수준 높은 독해 능력을 키웁니다.', tags: ['신규', '중학독해', 'MP3'] },
  { id: 18, cat: 'middle', type: '참고서', subject: '영어', area: '독해', title: 'I Love Reading Level 3 (2025)',
    author: '북샘 편집부', price: 13500, originalPrice: 15000, badge: '',
    img: 'images/ilove-reading-3.png', publisher: '북샘 교육출판', date: '2025.02.01',
    desc: '실전 수준의 지문과 독해 전략으로 내신 최고 등급을 목표로 합니다.', tags: ['중학독해', 'MP3'] },

  // ── 고등 참고서 (수능 영어) ──
  { id: 23, cat: 'high', type: '참고서', subject: '영어', area: '모의고사',
    title: 'Reading Booster 영어독해 모의고사 15회 (3rd Edition)',
    author: 'YBM 편집부', price: 14000, originalPrice: 16000, badge: 'best',
    img: '', publisher: 'YBM', date: '2025.01.10',
    desc: '수능 영어 1등급 완성 프로젝트. 고난도 유형 집중 공략 수록, 실전 모의고사 15회 완성.',
    tags: ['베스트셀러', '수능', 'MP3'] },

  { id: 24, cat: 'high', type: '참고서', subject: '영어', area: '어법/어휘',
    title: 'Reading Booster 어법어휘',
    author: 'YBM 편집부', price: 14000, originalPrice: 16000, badge: '',
    img: '', publisher: 'YBM', date: '2025.01.10',
    desc: '수능영어 1등급 프로젝트. 핵심개념·기출예제·실전문제 한 권으로 완성. MID-TEST 및 모의고사 10회 수록.',
    tags: ['수능', 'MP3'] },

  { id: 25, cat: 'high', type: '참고서', subject: '영어', area: '문법/구문',
    title: 'Reading Booster 구문독해',
    author: 'YBM 편집부', price: 14000, originalPrice: 16000, badge: '',
    img: '', publisher: 'YBM', date: '2025.01.10',
    desc: '수능영어 1등급 프로젝트. 44개 핵심구문으로 독해력 완성. 고난도 유형 TEST 3회 수록.',
    tags: ['수능', 'MP3'] },

  { id: 26, cat: 'high', type: '참고서', subject: '영어', area: '독해',
    title: 'Reading Booster 유형독해',
    author: 'YBM 편집부', price: 14000, originalPrice: 16000, badge: '',
    img: '', publisher: 'YBM', date: '2025.01.10',
    desc: '수능영어 1등급 프로젝트. 17개 수능유형 분석 및 32개 유형전략 제시. 실전대비 모의고사 총 9회 수록.',
    tags: ['수능', 'MP3'] },

  { id: 27, cat: 'high', type: '참고서', subject: '영어', area: '모의고사',
    title: 'Reading Booster 영어독해 모의고사 10+2회 기본 (2nd Edition)',
    author: 'YBM 편집부', price: 13000, originalPrice: 15000, badge: 'new',
    img: '', publisher: 'YBM', date: '2025.08.01',
    desc: '수능 독해유형별 전략 수록. 기본 모의고사 10회 + 심화 2회로 실전 감각 완성.',
    tags: ['신규', '수능', 'MP3'] },
];

// 도서 카드 HTML 생성
function renderBookCard(book) {
  const info = CAT_INFO[book.cat];
  const discount = Math.round((1 - book.price / book.originalPrice) * 100);
  const isWished = Wish.has(book.id);

  const thumbContent = book.img
    ? `<img src="${book.img}" alt="${book.title}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;">`
    : `<div class="book-thumb-placeholder">${info.emoji}<small>${book.type}</small></div>`;

  return `
    <div class="book-card" data-id="${book.id}" onclick="location.href='book-detail.html?id=${book.id}'">
      <div class="book-thumb">
        ${thumbContent}
        ${book.badge ? `<span class="book-badge ${book.badge}">${book.badge === 'best' ? 'BEST' : 'NEW'}</span>` : ''}
      </div>
      <div class="book-info">
        <span class="book-cat-tag ${info.tagClass}">${info.label} · ${book.subject}</span>
        <div class="book-title">${book.title}</div>
        <div class="book-author">${book.author}</div>
        <div class="book-price">
          <span class="price-original">${fmtPrice(book.originalPrice)}원</span>
          <span class="price-sale">${fmtPrice(book.price)}원</span>
          <span class="price-rate">${discount}%</span>
        </div>
      </div>
      <div class="book-actions">
        <button class="btn-cart" onclick="event.stopPropagation(); addToCart(${book.id})">🛒 담기</button>
        <button class="btn-wish ${isWished ? 'active' : ''}" onclick="event.stopPropagation(); toggleWish(this, ${book.id})">
          ${isWished ? '❤️' : '🤍'}
        </button>
      </div>
    </div>
  `;
}

// 목록형 카드 HTML 생성
function renderListCard(book) {
  const info = CAT_INFO[book.cat];
  const isWished = Wish.has(book.id);

  const imgContent = book.img
    ? `<img src="${book.img}" alt="${book.title}">`
    : `<div class="book-list-cover-placeholder">${info.emoji}<small>${book.type}</small></div>`;

  const tagsArr = book.tags || (book.badge ? [book.badge === 'best' ? '베스트셀러' : '신규'] : []);
  const tagsHtml = tagsArr.map(t => {
    const cls = t === '베스트셀러' ? 'best'
              : t === '신규'      ? 'new'
              : t.includes('MP3') ? 'mp3'
              : 'series';
    const label = t.includes('MP3') ? '🎧 MP3' : t;
    return `<span class="book-badge-pill ${cls}">${label}</span>`;
  }).join('');

  return `
    <div class="book-list-card" onclick="location.href='book-detail.html?id=${book.id}'">
      <div class="book-list-cover">${imgContent}</div>
      <div class="book-list-body">
        <div class="book-list-badges">${tagsHtml}</div>
        <div class="book-list-title">${book.title}</div>
        <div class="book-list-meta">
          <span>${book.author}</span>
          <span>${book.publisher || '북샘 교육출판'}</span>
          ${book.date ? `<span>${book.date}</span>` : ''}
        </div>
        ${book.desc ? `<div class="book-list-desc">${book.desc}</div>` : ''}
        <div class="book-list-footer">
          <div class="book-list-price">
            <span class="book-list-price-sale">${fmtPrice(book.price)}원</span>
            <span class="book-list-price-original">${fmtPrice(book.originalPrice)}원</span>
          </div>
          <div class="book-list-actions">
            <button class="btn-list-wish ${isWished ? 'active' : ''}" onclick="event.stopPropagation(); toggleWish(this, ${book.id})">♡</button>
            <button class="btn-list-study" onclick="event.stopPropagation();location.href='book-detail.html?id=${book.id}'">학습자료</button>
            <button class="btn-list-buy" onclick="event.stopPropagation(); addToCart(${book.id})">바로구매</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function addToCart(id) {
  const book = BOOKS.find(b => b.id === id);
  if (book) Cart.add(book);
}

// toggleWish는 Wishlist 블록 위에 정의됨

// 페이지 로드 시 공통 초기화
document.addEventListener('DOMContentLoaded', () => {
  Cart.updateBadge();

  // ── 전체 카테고리 메가메뉴 (GNB hover 동일 내용) ──
  const gnbAll = document.querySelector('.gnb-all');
  const gnbBar = document.querySelector('.gnb-bar');
  if (gnbAll && gnbBar) {
    const mega = document.createElement('div');
    mega.className = 'mega-menu';
    const inner = document.createElement('div');
    inner.className = 'mega-menu-inner';

    // 각 gnb-item의 dropdown-body 내용을 그대로 복제
    document.querySelectorAll('.gnb-item').forEach(item => {
      const gnbLink = item.querySelector('.gnb-link');
      const dropBody = item.querySelector('.dropdown-body');
      if (!gnbLink || !dropBody) return;
      const col = document.createElement('div');
      col.className = 'mega-col';
      const title = document.createElement('div');
      title.className = 'mega-col-title';
      title.innerHTML = `<a href="${gnbLink.href}">${gnbLink.textContent.trim()}</a>`;
      col.appendChild(title);
      col.appendChild(dropBody.cloneNode(true));
      inner.appendChild(col);
    });

    mega.appendChild(inner);
    gnbBar.style.position = 'relative';
    gnbBar.appendChild(mega);

    const closeMega = () => mega.classList.remove('open');
    let megaTimer;

    // 마우스오버 시 열기
    gnbAll.addEventListener('mouseenter', () => {
      clearTimeout(megaTimer);
      mega.classList.add('open');
    });
    // gnbAll에서 마우스 나가면 타이머 시작 (메가메뉴로 이동하면 유지)
    gnbAll.addEventListener('mouseleave', () => {
      megaTimer = setTimeout(closeMega, 180);
    });
    // 메가메뉴 안으로 들어오면 타이머 취소
    mega.addEventListener('mouseenter', () => {
      clearTimeout(megaTimer);
    });
    // 메가메뉴에서 마우스 나가면 닫기
    mega.addEventListener('mouseleave', () => {
      megaTimer = setTimeout(closeMega, 180);
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMega(); });
  }

  // (구버전 메가메뉴 코드 — 삭제 예정 자리표시자)
  if (false) {
    const mega = null;
    const inner = `
      <div class="mega-menu-inner">
        <div>
          <div class="mega-col-title">🎒 <a href="books.html?cat=elementary">초등</a></div>
          <div class="mega-col-group">
            <div class="mega-col-group-label">참고서</div>
            <div class="mega-col-links">
              <a href="books.html?cat=elementary&type=참고서&subject=영어">영어</a>
            </div>
          </div>
          <div class="mega-col-group">
            <div class="mega-col-group-label">교과서</div>
            <div class="mega-col-links">
              <a href="books.html?cat=elementary&type=교과서">교과서</a>
              <a href="books.html?cat=elementary&type=평가문제집">평가문제집/자습서</a>
              <a href="books.html?cat=elementary&type=지도서">지도서</a>
              <a href="books.html?cat=elementary&type=자료집">자료집</a>
              <a href="books.html?cat=elementary&type=교구재">교구재</a>
            </div>
          </div>
          <div class="mega-col-group">
            <div class="mega-col-group-label">ELT · 일반</div>
            <div class="mega-col-links">
              <a href="books.html?cat=elementary&type=ELT">ELT</a>
              <a href="books.html?cat=elementary&type=일반">일반·수험서</a>
            </div>
          </div>
        </div>
        <div>
          <div class="mega-col-title">📚 <a href="books.html?cat=middle">중학</a></div>
          <div class="mega-col-group">
            <div class="mega-col-group-label">참고서</div>
            <div class="mega-col-links">
              <a href="books.html?cat=middle&type=참고서&subject=영어">영어</a>
            </div>
          </div>
          <div class="mega-col-group">
            <div class="mega-col-group-label">교과서</div>
            <div class="mega-col-links">
              <a href="books.html?cat=middle&type=교과서">교과서</a>
              <a href="books.html?cat=middle&type=평가문제집">평가문제집/자습서</a>
              <a href="books.html?cat=middle&type=지도서">지도서</a>
              <a href="books.html?cat=middle&type=자료집">자료집</a>
              <a href="books.html?cat=middle&type=교구재">교구재</a>
            </div>
          </div>
          <div class="mega-col-group">
            <div class="mega-col-group-label">ELT · 일반</div>
            <div class="mega-col-links">
              <a href="books.html?cat=middle&type=ELT">ELT</a>
              <a href="books.html?cat=middle&type=일반">일반·수험서</a>
            </div>
          </div>
        </div>
        <div>
          <div class="mega-col-title">🎓 <a href="books.html?cat=high">고등</a></div>
          <div class="mega-col-group">
            <div class="mega-col-group-label">참고서</div>
            <div class="mega-col-links">
              <a href="books.html?cat=high&type=참고서&subject=영어">영어</a>
            </div>
          </div>
          <div class="mega-col-group">
            <div class="mega-col-group-label">교과서</div>
            <div class="mega-col-links">
              <a href="books.html?cat=high&type=교과서">교과서</a>
              <a href="books.html?cat=high&type=평가문제집">평가문제집/자습서</a>
              <a href="books.html?cat=high&type=지도서">지도서</a>
              <a href="books.html?cat=high&type=자료집">자료집</a>
              <a href="books.html?cat=high&type=교구재">교구재</a>
            </div>
          </div>
          <div class="mega-col-group">
            <div class="mega-col-group-label">ELT · 일반</div>
            <div class="mega-col-links">
              <a href="books.html?cat=high&type=ELT">ELT</a>
              <a href="books.html?cat=high&type=일반">일반·수험서</a>
            </div>
          </div>
        </div>
        <div>
          <div class="mega-col-title">📂 <a href="resources.html">자료실</a></div>
          <div class="mega-col-links" style="margin-bottom:16px;">
            <a href="resources.html?tab=materials">교재 자료실</a>
            <a href="resources.html?tab=daily">데일리 외국어</a>
            <a href="resources.html?tab=howto">교재 활용법</a>
            <a href="resources.html?tab=curation">큐레이션</a>
          </div>
          <div class="mega-col-title" style="margin-top:8px;">🎁 <a href="events.html">이벤트</a></div>
          <div class="mega-col-links">
            <a href="events.html">진행 중인 이벤트</a>
          </div>
        </div>
      </div>`;
  }

  // ── 외부 사이트 스크린샷 미리 생성 요청 (WordPress mshots 캐시) ──
  ['https://ytutor.ybmbooks.com','https://www.ybmbooks.com'].forEach(u => {
    const prefetch = new Image();
    prefetch.src = `https://s.wordpress.com/mshots/v1/${encodeURIComponent(u)}?w=1366`;
  });

  // ── 외부 링크 버튼 → 로컬 이미지 모달 ──
  document.querySelectorAll('.btn-orange').forEach(btn => {
    if (btn.textContent.includes('Y튜터')) {
      btn.removeAttribute('href');
      btn.removeAttribute('target');
      btn.style.cursor = 'pointer';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        openImageModal('images/ytutor-preview.png', '강사용 Y튜터');
      }, true);
    }
  });
  document.querySelectorAll('.btn-blue').forEach(btn => {
    if (btn.textContent.includes('YBM북스')) {
      btn.removeAttribute('href');
      btn.style.cursor = 'pointer';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        openImageModal('images/ybmbooks-preview.png', 'YBM북스-성인');
      }, true);
    }
  });

  // ── 로그인/로그아웃 헤더 토글 + 마이페이지 조건부 표시 ──
  const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const loginLink = [...document.querySelectorAll('.util-links .util-link')]
    .find(a => a.textContent.trim() === '로그인');
  const mypageLink = [...document.querySelectorAll('.util-links .util-link')]
    .find(a => a.textContent.trim() === '마이페이지');

  // 마이페이지 링크: 비로그인 시 숨김
  if (mypageLink) mypageLink.style.display = loggedIn ? '' : 'none';

  // 회원가입 링크: 로그인 시 숨김
  const joinLink = [...document.querySelectorAll('.util-links .util-link')]
    .find(a => a.textContent.trim() === '회원가입');
  if (joinLink) joinLink.style.display = loggedIn ? 'none' : '';

  // 장바구니 링크: 상단 헤더에서 항상 숨김 (고객센터 > 마이페이지에서 접근)
  const cartLink = [...document.querySelectorAll('.util-links .util-link')]
    .find(a => a.textContent.includes('장바구니'));
  if (cartLink) cartLink.style.display = 'none';

  if (loginLink) {
    if (loggedIn) {
      // 로그인 상태 → 로그아웃으로 변경
      loginLink.textContent = '로그아웃';
      loginLink.removeAttribute('href');
      loginLink.style.cursor = 'pointer';
      loginLink.onclick = (e) => {
        e.preventDefault();
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('booksam_user');
        localStorage.removeItem('redirectAfterLogin');
        localStorage.removeItem('pendingMaterialId');
        localStorage.removeItem('pendingMaterialTitle');
        localStorage.removeItem('pendingWishId');
        localStorage.removeItem('booksam_wish');   // 로그아웃 시 관심 교재 초기화
        location.reload();
      };
    } else {
      // 비로그인 상태 → 클릭 시 현재 URL 저장 후 로그인 페이지 이동
      loginLink.addEventListener('click', () => {
        localStorage.setItem('redirectAfterLogin', location.href);
      });
    }
  }

  // GNB 현재 페이지 활성화
  const page = location.pathname.split('/').pop() || 'index.html';
  const cat = getParam('cat') || '';
  document.querySelectorAll('.gnb-link').forEach(link => {
    const href = link.getAttribute('href') || '';
    const linkCat = link.closest('.gnb-item')?.dataset.cat;
    if (
      (href.includes(page) && page !== 'index.html') ||
      (cat && linkCat === cat)
    ) {
      link.classList.add('active');
    }
  });

  // FAQ 토글
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.faq-item').classList.toggle('open');
    });
  });

  // Detail tabs
  document.querySelectorAll('.detail-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      document.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(target)?.classList.add('active');
    });
  });

  // Curation tabs
  document.querySelectorAll('.curation-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.curation-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.target;
      document.querySelectorAll('.curation-panel').forEach(p => {
        p.style.display = p.id === target ? '' : 'none';
      });
    });
  });
});

// ── 로컬 이미지 미리보기 모달 ──
// 사용법: images/ 폴더에 ytutor-preview.png / ybmbooks-preview.png 저장하면 자동 표시
function openImageModal(imgPath, title) {
  document.querySelector('.img-preview-overlay')?.remove();

  const ov = document.createElement('div');
  ov.className = 'img-preview-overlay';
  ov.style.cssText = 'position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:24px;';

  const box = document.createElement('div');
  box.style.cssText = 'background:white;border-radius:12px;overflow:hidden;max-width:900px;width:100%;box-shadow:0 32px 80px rgba(0,0,0,.4);';

  const header = document.createElement('div');
  header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #eee;background:#f8f9fb;';
  header.innerHTML = `
    <span style="font-size:14px;font-weight:700;color:#1a2e44;">🖼 ${title}</span>
    <button onclick="this.closest('.img-preview-overlay').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#888;line-height:1;">✕</button>`;

  const body = document.createElement('div');
  body.style.cssText = 'min-height:300px;display:flex;align-items:center;justify-content:center;background:#1a2e44;';

  const img = document.createElement('img');
  img.src = imgPath;
  img.alt = title;
  img.style.cssText = 'max-width:100%;max-height:70vh;display:block;object-fit:contain;';
  img.onerror = () => {
    body.style.cssText = 'min-height:300px;display:flex;align-items:center;justify-content:center;background:#f8f9fb;flex-direction:column;gap:14px;padding:40px;text-align:center;';
    body.innerHTML = `
      <div style="font-size:48px;">🖼</div>
      <div style="font-weight:700;font-size:16px;color:#1a2e44;">${title} 이미지 없음</div>
      <div style="font-size:13px;color:#888;line-height:1.7;">
        아래 폴더에 이미지를 저장하면 자동으로 표시됩니다.<br>
        <code style="background:#e8eaf6;padding:4px 10px;border-radius:4px;font-size:12px;display:inline-block;margin-top:8px;">${imgPath}</code>
      </div>`;
  };

  body.appendChild(img);
  box.appendChild(header);
  box.appendChild(body);
  ov.appendChild(box);
  document.body.appendChild(ov);
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { ov.remove(); document.removeEventListener('keydown', esc); }
  });
}
