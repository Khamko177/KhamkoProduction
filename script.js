/* ==========================================================================
   KHAMKO PRODUCTION — APPLICATION SCRIPT
   Feed Engine, Real Likes, Random Studio & Caption Card Generator
   ========================================================================== */

(function () {
    'use strict';

    // -------------------------------------------------------------------------
    // 1. DATA SAFETY & INITIALIZATION
    // -------------------------------------------------------------------------
    const captionsData = window.KHAMKO_CAPTIONS || [];
    const categoriesData = window.KHAMKO_CATEGORIES || [];

    // Preload mascot for Canvas Studio watermark
    const mascotImg = new Image();
    mascotImg.src = 'mascot.png';

    // -------------------------------------------------------------------------
    // 2. TOAST NOTIFICATION
    // -------------------------------------------------------------------------
    const toastEl = document.getElementById('toast');
    let toastTimer = null;

    function showToast(message, icon) {
        if (!toastEl) return;
        const msgSpan = toastEl.querySelector('.toast-message');
        const iconSpan = toastEl.querySelector('.toast-icon');

        if (msgSpan) msgSpan.textContent = message;
        if (iconSpan) iconSpan.textContent = icon || '✨';

        toastEl.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toastEl.classList.remove('show');
        }, 2400);
    }

    // -------------------------------------------------------------------------
    // 3. THEME MANAGER (DARK / LIGHT)
    // -------------------------------------------------------------------------
    const themeToggleBtn = document.getElementById('themeToggle');
    const rootHtml = document.documentElement;

    function applyTheme(theme) {
        if (theme === 'light') {
            rootHtml.setAttribute('data-theme', 'light');
            document.body.classList.add('light-mode');
        } else {
            rootHtml.setAttribute('data-theme', 'dark');
            document.body.classList.remove('light-mode');
        }
        try {
            localStorage.setItem('khamko-theme', theme);
        } catch (e) { /* storage restricted */ }
    }

    // Detect saved theme or system preference
    const savedTheme = (() => {
        try {
            return localStorage.getItem('khamko-theme');
        } catch (e) {
            return null;
        }
    })();

    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        applyTheme('dark');
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const current = rootHtml.getAttribute('data-theme') || 'dark';
            const next = current === 'dark' ? 'light' : 'dark';
            applyTheme(next);
            showToast(next === 'light' ? 'ເປີດ Light Mode ແລ້ວ ☀️' : 'ເປີດ Dark Mode ແລ້ວ 🌙', next === 'light' ? '☀️' : '🌙');
        });
    }

    // -------------------------------------------------------------------------
    // 4. NAVBAR SCROLL & MOBILE MENU
    // -------------------------------------------------------------------------
    const navbar = document.getElementById('navbar');
    const menuToggle = document.getElementById('menuToggle');
    const navLinksList = document.querySelector('.nav-links');

    window.addEventListener('scroll', () => {
        if (!navbar) return;
        if (window.pageYOffset > 25) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }, { passive: true });

    if (menuToggle && navLinksList) {
        menuToggle.addEventListener('click', () => {
            const isActive = menuToggle.classList.toggle('active');
            navLinksList.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', String(isActive));
        });

        navLinksList.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                navLinksList.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // Active nav link highlight on scroll
    const sections = document.querySelectorAll('section[id], header[id]');
    const navAnchors = document.querySelectorAll('.nav-links .nav-link');

    function updateActiveNav() {
        const scrollPos = window.pageYOffset + 120;
        sections.forEach(sec => {
            const top = sec.offsetTop;
            const height = sec.offsetHeight;
            const id = sec.getAttribute('id');
            if (scrollPos >= top && scrollPos < top + height) {
                navAnchors.forEach(a => {
                    if (a.getAttribute('href') === `#${id}`) {
                        a.classList.add('is-active');
                    } else {
                        a.classList.remove('is-active');
                    }
                });
            }
        });
    }
    window.addEventListener('scroll', updateActiveNav, { passive: true });

    // -------------------------------------------------------------------------
    // 5. LIKE PERSISTENCE (LOCALSTORAGE)
    // -------------------------------------------------------------------------
    let likedIds = new Set();
    try {
        const rawLikes = localStorage.getItem('khamko-likes');
        if (rawLikes) {
            likedIds = new Set(JSON.parse(rawLikes));
        }
    } catch (e) {
        likedIds = new Set();
    }

    function saveLikes() {
        try {
            localStorage.setItem('khamko-likes', JSON.stringify(Array.from(likedIds)));
        } catch (e) {}
    }

    function toggleLike(captionId) {
        const wasLiked = likedIds.has(captionId);
        if (wasLiked) {
            likedIds.delete(captionId);
        } else {
            likedIds.add(captionId);
        }
        saveLikes();
        updateCategoryPillCounts();
        return !wasLiked;
    }

    // -------------------------------------------------------------------------
    // 6. CLIPBOARD COPY HELPER
    // -------------------------------------------------------------------------
    function copyTextToClipboard(text, successMessage) {
        const clean = text.replace(/<br\s*\/?>/gi, '\n').trim();
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(clean).then(() => {
                showToast(successMessage || 'Copied to clipboard! 📋', '📋');
            }).catch(() => {
                fallbackCopy(clean, successMessage);
            });
        } else {
            fallbackCopy(clean, successMessage);
        }
    }

    function fallbackCopy(text, successMessage) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try {
            document.execCommand('copy');
            showToast(successMessage || 'Copied to clipboard! 📋', '📋');
        } catch (err) {
            showToast('ບໍ່ສາມາດ Copy ໄດ້ 🥲', '⚠️');
        }
        document.body.removeChild(ta);
    }

    // -------------------------------------------------------------------------
    // 7. FEED ENGINE (FILTER, SEARCH, SORT, PAGINATE)
    // -------------------------------------------------------------------------
    const captionsGrid = document.getElementById('captionsGrid');
    const categoryPillsContainer = document.getElementById('categoryPills');
    const searchInput = document.getElementById('captionSearchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const sortSelect = document.getElementById('sortSelect');
    const resultsCounter = document.getElementById('resultsCounter');
    const activeFilterLabel = document.getElementById('activeFilterLabel');
    const emptyState = document.getElementById('emptyState');
    const resetFilterBtn = document.getElementById('resetFilterBtn');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const feedPagination = document.getElementById('feedPagination');

    let currentCategory = 'all';
    let searchQuery = '';
    let currentSort = 'trending';
    let currentPage = 1;
    const PAGE_SIZE = 12;

    // Render Category Pills
    function renderCategoryPills() {
        if (!categoryPillsContainer) return;
        categoryPillsContainer.innerHTML = '';

        categoriesData.forEach(cat => {
            const count = cat.id === 'all'
                ? captionsData.length
                : captionsData.filter(c => c.category === cat.id).length;

            const btn = document.createElement('button');
            btn.className = `category-pill ${cat.id === currentCategory ? 'is-active' : ''}`;
            btn.dataset.category = cat.id;
            btn.type = 'button';
            btn.innerHTML = `<span>${cat.emoji} ${cat.label}</span> <span class="category-pill-count" id="pillCount-${cat.id}">${count}</span>`;

            btn.addEventListener('click', () => {
                setCategory(cat.id);
            });
            categoryPillsContainer.appendChild(btn);
        });

        // Add "Liked" filter pill
        const likedBtn = document.createElement('button');
        likedBtn.className = `category-pill ${currentCategory === 'liked' ? 'is-active' : ''}`;
        likedBtn.dataset.category = 'liked';
        likedBtn.type = 'button';
        likedBtn.innerHTML = `<span>❤️ Liked</span> <span class="category-pill-count" id="pillCount-liked">${likedIds.size}</span>`;
        likedBtn.addEventListener('click', () => {
            setCategory('liked');
        });
        categoryPillsContainer.appendChild(likedBtn);
    }

    function updateCategoryPillCounts() {
        const likedCountEl = document.getElementById('pillCount-liked');
        if (likedCountEl) likedCountEl.textContent = String(likedIds.size);
    }

    function setCategory(catId) {
        currentCategory = catId;
        currentPage = 1;
        document.querySelectorAll('.category-pill').forEach(p => {
            p.classList.toggle('is-active', p.dataset.category === catId);
        });
        renderFeed();
    }

    // Filter & Sort Pipeline
    function getFilteredCaptions() {
        let result = captionsData.slice();

        // 1. Category Filter
        if (currentCategory === 'liked') {
            result = result.filter(c => likedIds.has(c.id));
        } else if (currentCategory !== 'all') {
            result = result.filter(c => c.category === currentCategory);
        }

        // 2. Search Filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            result = result.filter(c => {
                return c.text.toLowerCase().includes(q) ||
                       c.category.toLowerCase().includes(q);
            });
        }

        // 3. Sorting
        if (currentSort === 'likes') {
            result.sort((a, b) => {
                const aLikes = a.likes + (likedIds.has(a.id) ? 1 : 0);
                const bLikes = b.likes + (likedIds.has(b.id) ? 1 : 0);
                return bLikes - aLikes;
            });
        } else if (currentSort === 'shortest') {
            result.sort((a, b) => a.text.length - b.text.length);
        } else if (currentSort === 'trending') {
            result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        }

        return result;
    }

    function formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toLocaleString();
    }

    function getCategoryLabel(catId) {
        const found = categoriesData.find(c => c.id === catId);
        return found ? found.label : catId;
    }

    // Render Cards in Grid
    function renderFeed() {
        if (!captionsGrid) return;

        const filtered = getFilteredCaptions();
        const total = filtered.length;

        // Update status counters
        if (resultsCounter) {
            resultsCounter.textContent = `ກຳລັງສະແດງ ${total} ມຸກ`;
        }
        if (activeFilterLabel) {
            const catName = currentCategory === 'liked' ? '❤️ Liked' : getCategoryLabel(currentCategory);
            activeFilterLabel.textContent = `ໝວດໝູ່: ${catName}${searchQuery ? ` • ຄົ້ນຫາ: "${searchQuery}"` : ''}`;
        }

        if (total === 0) {
            captionsGrid.innerHTML = '';
            if (emptyState) emptyState.hidden = false;
            if (feedPagination) feedPagination.hidden = true;
            return;
        }

        if (emptyState) emptyState.hidden = true;

        // Paginated items
        const visibleCount = currentPage * PAGE_SIZE;
        const visibleItems = filtered.slice(0, visibleCount);

        captionsGrid.innerHTML = '';
        const fragment = document.createDocumentFragment();

        visibleItems.forEach(item => {
            const isLiked = likedIds.has(item.id);
            const totalLikes = item.likes + (isLiked ? 1 : 0);

            const card = document.createElement('article');
            card.className = 'caption-card';
            card.dataset.id = item.id;

            card.innerHTML = `
                <div class="card-header">
                    <div class="card-avatar">
                        <img src="mascot.png" alt="Khamko Mascot" width="42" height="42">
                    </div>
                    <div class="card-meta">
                        <div class="card-author">Khamko Production</div>
                        <div class="card-time">${item.time} • 🌍</div>
                    </div>
                    <span class="card-category-badge">${getCategoryLabel(item.category)}</span>
                </div>

                <div class="caption-content">${escapeHtml(item.text)}</div>

                <div class="card-reactions-bar">
                    <div class="reactions-cluster">
                        <div class="reaction-icons">
                            ${(item.reactions || ['😂', '💀', '🔥']).map(r => `<span class="reaction-bubble">${r}</span>`).join('')}
                        </div>
                        <span class="likes-counter-text" id="likes-${item.id}">${formatNumber(totalLikes)}</span>
                    </div>
                </div>

                <div class="card-actions-bar">
                    <button class="card-btn btn-like ${isLiked ? 'is-liked' : ''}" type="button" data-id="${item.id}" aria-label="Like this caption">
                        <svg viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" width="16" height="16" aria-hidden="true">
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                        </svg>
                        <span>${isLiked ? 'Liked' : 'Like'}</span>
                    </button>

                    <button class="card-btn btn-copy" type="button" data-text="${escapeAttr(item.text)}" aria-label="Copy text">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" aria-hidden="true">
                            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                        </svg>
                        <span>Copy</span>
                    </button>

                    <button class="card-btn btn-make-img" type="button" data-text="${escapeAttr(item.text)}" data-category="${item.category}" aria-label="Create image">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" aria-hidden="true">
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                            <circle cx="9" cy="9" r="2"/>
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                        </svg>
                        <span>Image</span>
                    </button>
                </div>
            `;

            fragment.appendChild(card);
        });

        captionsGrid.appendChild(fragment);

        // Attach action events
        attachCardEvents();

        // Manage Load More button
        if (feedPagination && loadMoreBtn) {
            feedPagination.hidden = visibleCount >= total;
            loadMoreBtn.textContent = `ໂຫຼດມຸກເພີ່ມເຕີມ (${total - visibleCount} ມຸກຍັງເຫຼືອ)`;
        }
    }

    function escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function escapeAttr(str) {
        return str.replace(/"/g, '&quot;').replace(/\n/g, '&#10;');
    }

    function attachCardEvents() {
        // Like buttons
        document.querySelectorAll('.btn-like').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                const id = btn.dataset.id;
                const nowLiked = toggleLike(id);
                btn.classList.toggle('is-liked', nowLiked);

                const icon = btn.querySelector('svg');
                if (icon) {
                    icon.setAttribute('fill', nowLiked ? 'currentColor' : 'none');
                }
                const label = btn.querySelector('span');
                if (label) {
                    label.textContent = nowLiked ? 'Liked' : 'Like';
                }

                // Update number
                const counter = document.getElementById(`likes-${id}`);
                const item = captionsData.find(c => c.id === id);
                if (counter && item) {
                    const count = item.likes + (nowLiked ? 1 : 0);
                    counter.textContent = formatNumber(count);
                }

                showToast(nowLiked ? 'Liked! ❤️' : 'Unliked 💔', nowLiked ? '❤️' : '💔');

                // If currently on "liked" filter and item was unliked, re-render
                if (currentCategory === 'liked' && !nowLiked) {
                    renderFeed();
                }
            };
        });

        // Copy buttons
        document.querySelectorAll('.btn-copy').forEach(btn => {
            btn.onclick = () => {
                const text = btn.dataset.text;
                copyTextToClipboard(text, 'Copied caption! 📋');
                const span = btn.querySelector('span');
                if (span) {
                    const old = span.textContent;
                    span.textContent = 'Copied!';
                    setTimeout(() => { span.textContent = old; }, 1500);
                }
            };
        });

        // Make Image buttons
        document.querySelectorAll('.btn-make-img').forEach(btn => {
            btn.onclick = () => {
                const text = btn.dataset.text;
                const category = btn.dataset.category || 'all';
                openCardStudio(text, category);
            };
        });
    }

    // Search events with debounce
    let searchTimer = null;
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                searchQuery = searchInput.value;
                if (clearSearchBtn) {
                    clearSearchBtn.hidden = !searchQuery;
                }
                currentPage = 1;
                renderFeed();
            }, 180);
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            searchQuery = '';
            clearSearchBtn.hidden = true;
            currentPage = 1;
            renderFeed();
            if (searchInput) searchInput.focus();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            currentSort = sortSelect.value;
            currentPage = 1;
            renderFeed();
        });
    }

    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            searchQuery = '';
            if (clearSearchBtn) clearSearchBtn.hidden = true;
            setCategory('all');
        });
    }

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            currentPage++;
            renderFeed();
        });
    }

    // -------------------------------------------------------------------------
    // 8. CATEGORIES DIRECTORY (DYNAMIC COUNTS & CLICK-TO-FILTER)
    // -------------------------------------------------------------------------
    const categoriesDirectory = document.getElementById('categoriesDirectory');

    function renderCategoriesDirectory() {
        if (!categoriesDirectory) return;
        categoriesDirectory.innerHTML = '';

        const realCategories = categoriesData.filter(c => c.id !== 'all');

        realCategories.forEach(cat => {
            const count = captionsData.filter(c => c.category === cat.id).length;
            const card = document.createElement('button');
            card.className = 'category-card';
            card.type = 'button';
            card.dataset.category = cat.id;

            card.innerHTML = `
                <div class="category-emoji" aria-hidden="true">${cat.emoji}</div>
                <h3 class="category-name">${cat.label}</h3>
                <p class="category-lao-sub">${cat.laoSubtitle}</p>
                <div class="category-card-footer">
                    <span class="category-count-badge">${count} ມຸກ</span>
                    <span class="category-arrow">ອ່ານໝວດນີ້ →</span>
                </div>
            `;

            card.addEventListener('click', () => {
                setCategory(cat.id);
                showToast(`ກັ່ນຕອງໝວດ: ${cat.label} ${cat.emoji}`, cat.emoji);
                const captionsSec = document.getElementById('captions');
                if (captionsSec) {
                    captionsSec.scrollIntoView({ behavior: 'smooth' });
                }
            });

            categoriesDirectory.appendChild(card);
        });
    }

    // -------------------------------------------------------------------------
    // 9. RANDOM CAPTION STUDIO & HERO TEASERS
    // -------------------------------------------------------------------------
    const randomCaptionDisplay = document.getElementById('randomCaptionDisplay');
    const randomCategoryTag = document.getElementById('randomCategoryTag');
    const randomShuffleBtn = document.getElementById('randomShuffleBtn');
    const randomCopyBtn = document.getElementById('randomCopyBtn');
    const randomMakeImageBtn = document.getElementById('randomMakeImageBtn');
    const moodChips = document.querySelectorAll('.mood-chip');

    let currentMood = 'all';
    let currentRandomCaption = null;

    function getRandomPool() {
        if (currentMood === 'all') return captionsData;
        return captionsData.filter(c => c.category === currentMood);
    }

    function shuffleRandomCaption() {
        const pool = getRandomPool();
        if (pool.length === 0) return;

        let pick = pool[Math.floor(Math.random() * pool.length)];
        if (pool.length > 1 && currentRandomCaption && pick.id === currentRandomCaption.id) {
            pick = pool[(pool.indexOf(pick) + 1) % pool.length];
        }

        currentRandomCaption = pick;

        if (randomCaptionDisplay) {
            randomCaptionDisplay.classList.add('fading');
            setTimeout(() => {
                randomCaptionDisplay.textContent = pick.text;
                randomCaptionDisplay.classList.remove('fading');
            }, 180);
        }

        if (randomCategoryTag) {
            randomCategoryTag.textContent = `${getCategoryLabel(pick.category)}`;
        }
    }

    moodChips.forEach(chip => {
        chip.addEventListener('click', () => {
            moodChips.forEach(c => c.classList.remove('is-selected'));
            chip.classList.add('is-selected');
            currentMood = chip.dataset.mood;
            shuffleRandomCaption();
        });
    });

    if (randomShuffleBtn) {
        randomShuffleBtn.addEventListener('click', () => {
            shuffleRandomCaption();
            randomShuffleBtn.style.transform = 'scale(0.96)';
            setTimeout(() => { randomShuffleBtn.style.transform = ''; }, 120);
        });
    }

    if (randomCopyBtn) {
        randomCopyBtn.addEventListener('click', () => {
            if (currentRandomCaption) {
                copyTextToClipboard(currentRandomCaption.text, 'Copied random caption! 📋');
            }
        });
    }

    if (randomMakeImageBtn) {
        randomMakeImageBtn.addEventListener('click', () => {
            if (currentRandomCaption) {
                openCardStudio(currentRandomCaption.text, currentRandomCaption.category);
            }
        });
    }

    // Hero Section Teasers
    const heroTeaserCaption = document.getElementById('heroTeaserCaption');
    const heroQuickShuffle = document.getElementById('heroQuickShuffle');
    const heroTeaserCopy = document.getElementById('heroTeaserCopy');
    const heroTeaserCard = document.getElementById('heroTeaserCard');
    const heroRandomTrigger = document.getElementById('heroRandomTrigger');

    function shuffleHeroTeaser() {
        if (!heroTeaserCaption || captionsData.length === 0) return;
        const randomItem = captionsData[Math.floor(Math.random() * captionsData.length)];
        heroTeaserCaption.textContent = `"${randomItem.text}"`;
        heroTeaserCaption.dataset.raw = randomItem.text;
        heroTeaserCaption.dataset.category = randomItem.category;
    }

    if (heroQuickShuffle) {
        heroQuickShuffle.addEventListener('click', shuffleHeroTeaser);
    }
    if (heroTeaserCopy) {
        heroTeaserCopy.addEventListener('click', () => {
            const txt = heroTeaserCaption ? (heroTeaserCaption.dataset.raw || heroTeaserCaption.textContent) : '';
            copyTextToClipboard(txt, 'Copied caption! 📋');
        });
    }
    if (heroTeaserCard) {
        heroTeaserCard.addEventListener('click', () => {
            const txt = heroTeaserCaption ? (heroTeaserCaption.dataset.raw || heroTeaserCaption.textContent) : '';
            const cat = heroTeaserCaption ? (heroTeaserCaption.dataset.category || 'all') : 'all';
            openCardStudio(txt, cat);
        });
    }
    if (heroRandomTrigger) {
        heroRandomTrigger.addEventListener('click', () => {
            const randomSec = document.getElementById('random');
            if (randomSec) {
                randomSec.scrollIntoView({ behavior: 'smooth' });
                shuffleRandomCaption();
            }
        });
    }

    // -------------------------------------------------------------------------
    // 10. CAPTION CARD STUDIO (HTML5 CANVAS 1080×1080 PNG GENERATOR)
    // -------------------------------------------------------------------------
    const modalDialog = document.getElementById('cardStudioModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cardCanvas = document.getElementById('cardCanvas');
    const modalCaptionEdit = document.getElementById('modalCaptionEdit');
    const downloadCardPngBtn = document.getElementById('downloadCardPngBtn');
    const modalCopyTextBtn = document.getElementById('modalCopyTextBtn');
    const paletteButtons = document.querySelectorAll('.palette-btn');

    let studioTheme = 'yellow';
    let studioCategory = 'Khamko Archive';

    const COLOR_THEMES = {
        yellow: {
            bg: '#fed130',
            border: '#421b16',
            text: '#421b16',
            cardBg: '#fed130',
            badgeBg: '#4fdbf2',
            badgeText: '#14110f',
            watermark: '#421b16'
        },
        dark: {
            bg: '#14110f',
            border: '#fed130',
            text: '#faf5eb',
            cardBg: '#1f1915',
            badgeBg: '#fed130',
            badgeText: '#421b16',
            watermark: '#fed130'
        },
        cyan: {
            bg: '#4fdbf2',
            border: '#14110f',
            text: '#14110f',
            cardBg: '#4fdbf2',
            badgeBg: '#fe9d1b',
            badgeText: '#14110f',
            watermark: '#14110f'
        },
        orange: {
            bg: '#fe9d1b',
            border: '#421b16',
            text: '#ffffff',
            cardBg: '#fe9d1b',
            badgeBg: '#fed130',
            badgeText: '#421b16',
            watermark: '#421b16'
        }
    };

    function openCardStudio(text, categoryId) {
        if (!modalDialog) return;
        studioCategory = getCategoryLabel(categoryId || 'all');
        if (modalCaptionEdit) {
            modalCaptionEdit.value = text || 'ແຕ່ລະໂພສ ບໍ່ກ່ຽວຫຍັງກັບຂ້ອຍເລີຍ ສູນນນນເດ!!!!! 💀';
        }
        modalDialog.showModal();
        drawCanvasCard();
    }

    function closeCardStudio() {
        if (modalDialog && modalDialog.open) {
            modalDialog.close();
        }
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeCardStudio);
    }
    if (modalDialog) {
        modalDialog.addEventListener('click', (e) => {
            const rect = modalDialog.getBoundingClientRect();
            if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
                closeCardStudio();
            }
        });
    }

    paletteButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            paletteButtons.forEach(b => b.classList.remove('is-active'));
            btn.classList.add('is-active');
            studioTheme = btn.dataset.theme || 'yellow';
            drawCanvasCard();
        });
    });

    if (modalCaptionEdit) {
        modalCaptionEdit.addEventListener('input', () => {
            drawCanvasCard();
        });
    }

    // High resolution Canvas drawing (1080×1080)
    function drawCanvasCard() {
        if (!cardCanvas) return;
        const ctx = cardCanvas.getContext('2d');
        const theme = COLOR_THEMES[studioTheme] || COLOR_THEMES.yellow;
        const width = 1080;
        const height = 1080;

        // 1. Background fill
        ctx.fillStyle = theme.bg;
        ctx.fillRect(0, 0, width, height);

        // 2. Double editorial border
        ctx.strokeStyle = theme.border;
        ctx.lineWidth = 14;
        ctx.strokeRect(36, 36, width - 72, height - 72);

        ctx.lineWidth = 4;
        ctx.strokeRect(54, 54, width - 108, height - 108);

        // 3. Header: Brand Avatar & Title
        const avatarSize = 92;
        const avatarX = 84;
        const avatarY = 84;

        // Mascot frame
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.clip();
        if (mascotImg.complete && mascotImg.naturalWidth > 0) {
            ctx.drawImage(mascotImg, avatarX, avatarY, avatarSize, avatarSize);
        } else {
            ctx.fillStyle = '#fed130';
            ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
        }
        ctx.restore();

        // Avatar stroke
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.strokeStyle = theme.border;
        ctx.lineWidth = 6;
        ctx.stroke();

        // Brand text
        ctx.fillStyle = theme.text;
        ctx.font = '800 38px "Bricolage Grotesque", "Noto Sans Lao", sans-serif';
        ctx.fillText('Khamko Production', avatarX + avatarSize + 24, avatarY + 44);

        ctx.font = '600 22px "Noto Sans Lao", sans-serif';
        ctx.fillStyle = theme.text;
        ctx.globalAlpha = 0.75;
        ctx.fillText('Official Meme Archive • ສຸດຍອດມຸກລາວ', avatarX + avatarSize + 24, avatarY + 78);
        ctx.globalAlpha = 1;

        // Category Tag Badge (Top Right)
        const badgeText = `📂 ${studioCategory}`;
        ctx.font = '700 24px "Noto Sans Lao", sans-serif';
        const badgeWidth = ctx.measureText(badgeText).width + 36;
        const badgeHeight = 46;
        const badgeX = width - 84 - badgeWidth;
        const badgeY = 96;

        ctx.fillStyle = theme.badgeBg;
        roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 23, true, false);

        ctx.strokeStyle = theme.border;
        ctx.lineWidth = 3;
        roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 23, false, true);

        ctx.fillStyle = theme.badgeText;
        ctx.fillText(badgeText, badgeX + 18, badgeY + 32);

        // Divider
        ctx.beginPath();
        ctx.moveTo(84, 210);
        ctx.lineTo(width - 84, 210);
        ctx.strokeStyle = theme.border;
        ctx.lineWidth = 4;
        ctx.stroke();

        // 4. Large Quote Mark
        ctx.fillStyle = theme.border;
        ctx.globalAlpha = 0.25;
        ctx.font = '900 160px "Bricolage Grotesque", serif';
        ctx.fillText('“', 84, 340);
        ctx.globalAlpha = 1;

        // 5. Main Caption Text (Dynamic Wrapping & Font Scaling)
        const rawText = modalCaptionEdit ? modalCaptionEdit.value.trim() : '';
        const lines = wrapCanvasText(ctx, rawText, 900, 'Noto Sans Lao');

        // Choose appropriate font size based on text density
        let fontSize = 54;
        if (lines.length > 6) fontSize = 42;
        else if (lines.length > 4) fontSize = 48;

        const lineHeight = fontSize * 1.7;
        const totalTextHeight = lines.length * lineHeight;
        const textStartY = Math.max(340, (height - 180 - totalTextHeight) / 2 + 60);

        ctx.fillStyle = theme.text;
        ctx.font = `700 ${fontSize}px "Noto Sans Lao", sans-serif`;
        ctx.textAlign = 'center';

        lines.forEach((line, index) => {
            ctx.fillText(line, width / 2, textStartY + index * lineHeight);
        });

        // 6. Footer Watermark Bar
        ctx.textAlign = 'left';
        ctx.beginPath();
        ctx.moveTo(84, height - 140);
        ctx.lineTo(width - 84, height - 140);
        ctx.strokeStyle = theme.border;
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = theme.watermark;
        ctx.font = '700 24px "Bricolage Grotesque", "Noto Sans Lao", sans-serif';
        ctx.fillText('fb.com/KhamkoProduction', 88, height - 92);

        ctx.textAlign = 'right';
        ctx.font = '600 22px "Noto Sans Lao", sans-serif';
        ctx.fillText('ມຸກ • ແຄັບຊັນ • 24/7 💀', width - 88, height - 92);
        ctx.textAlign = 'left';
    }

    function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        if (fill) ctx.fill();
        if (stroke) ctx.stroke();
    }

    function wrapCanvasText(ctx, text, maxWidth, fontFamily) {
        ctx.font = `700 48px "${fontFamily}", sans-serif`;
        const paragraphs = text.split('\n');
        const lines = [];

        paragraphs.forEach(p => {
            const words = p.split(' ');
            let currentLine = '';

            words.forEach(word => {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            });
            if (currentLine) lines.push(currentLine);
        });

        return lines.length > 0 ? lines : ['(ກະລຸນາພິມແຄັບຊັນ...)'];
    }

    if (downloadCardPngBtn && cardCanvas) {
        downloadCardPngBtn.addEventListener('click', () => {
            try {
                const link = document.createElement('a');
                link.download = `khamko-caption-${Date.now()}.png`;
                link.href = cardCanvas.toDataURL('image/png');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showToast('ດາວໂຫຼດຮູບ PNG ສຳເລັດແລ້ວ! 🎉', '💾');
            } catch (err) {
                showToast('ເກີດຂໍ້ຜິດພາດໃນການດາວໂຫຼດ 🥲', '⚠️');
            }
        });
    }

    if (modalCopyTextBtn && modalCaptionEdit) {
        modalCopyTextBtn.addEventListener('click', () => {
            copyTextToClipboard(modalCaptionEdit.value, 'Copied caption text! 📋');
        });
    }

    // -------------------------------------------------------------------------
    // 11. EASTER EGGS & SOCIAL TOASTS
    // -------------------------------------------------------------------------
    const brandLogoFrame = document.getElementById('brandLogoFrame');
    let logoClicks = 0;

    if (brandLogoFrame) {
        brandLogoFrame.addEventListener('click', () => {
            logoClicks++;
            brandLogoFrame.style.transform = `rotate(${logoClicks * 15}deg) scale(1.08)`;
            setTimeout(() => { brandLogoFrame.style.transform = ''; }, 300);

            if (logoClicks >= 5) {
                showToast('ຢຸດກົດໄດ້ແລ້ວ 💀 ໄປຫົວຕໍ່ດີກວ່າ!', '💀');
                logoClicks = 0;
            }
        });
    }

    // Secret code 'kha'
    let typedKeys = [];
    document.addEventListener('keydown', (e) => {
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (activeTag === 'input' || activeTag === 'textarea') return;

        typedKeys.push(e.key.toLowerCase());
        if (typedKeys.length > 3) typedKeys.shift();
        if (typedKeys.join('') === 'kha') {
            showToast('ເຈົ້າພົບລະຫັດລັບ Khamko ແລ້ວ! 🎉', '👑');
            document.body.style.animation = 'wiggle 0.4s ease 3';
            setTimeout(() => { document.body.style.animation = ''; }, 1200);
        }
    });

    // Tag clicks
    document.querySelectorAll('.tag-chip').forEach(tag => {
        tag.addEventListener('click', () => {
            showToast(`${tag.textContent} ✨`, '✨');
        });
    });

    // Coming Soon Social Buttons
    document.querySelectorAll('.btn-soon').forEach(btn => {
        btn.addEventListener('click', () => {
            const channel = btn.dataset.channel || 'Social';
            showToast(`ຊ່ອງທາງ ${channel} ກຳລັງມາໄວໆນີ້! ຕິດຕາມ Facebook ກ່ອນເດີ ✨`, '🔔');
        });
    });

    // Ensure fonts ready before drawing initial canvas
    if (document.fonts) {
        document.fonts.ready.then(() => {
            drawCanvasCard();
        });
    }

    // -------------------------------------------------------------------------
    // 12. INITIAL BOOTSTRAP
    // -------------------------------------------------------------------------
    renderCategoryPills();
    renderFeed();
    renderCategoriesDirectory();
    shuffleRandomCaption();
    shuffleHeroTeaser();

    console.log('%c💀 Khamko Production', 'font-size: 28px; font-weight: 900; color: #fed130; background: #421b16; padding: 4px 12px;');
    console.log('%cຄັງຮວມ 54 ແຄັບຊັນລາວສຸດຮາ ພ້ອມເຄື່ອງມືສ້າງຮູບ 1080x1080 PNG!', 'font-size: 13px; color: #fe9d1b;');

})();