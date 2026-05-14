/* ========================================
   KHAMKO PRODUCTION - SCRIPTS
   Theme toggle, animations, interactions
   ======================================== */

(function() {
    'use strict';

    // ========== LOADING ANIMATION ==========
    window.addEventListener('load', () => {
        setTimeout(() => {
            const loader = document.getElementById('loader');
            if (loader) loader.classList.add('hidden');
        }, 1500);
    });

    // ========== THEME TOGGLE (DARK/LIGHT) ==========
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle ? themeToggle.querySelector('.theme-icon') : null;

    // Load saved theme
    const savedTheme = localStorage.getItem('khamko-theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        if (themeIcon) themeIcon.textContent = '☀️';
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            const isLight = document.body.classList.contains('light-mode');
            if (themeIcon) themeIcon.textContent = isLight ? '☀️' : '🌙';
            try {
                localStorage.setItem('khamko-theme', isLight ? 'light' : 'dark');
            } catch (e) { /* storage unavailable */ }
        });
    }

    // ========== STICKY NAVBAR SCROLL EFFECT ==========
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        if (navbar) {
            if (currentScroll > 30) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
        lastScroll = currentScroll;
    });

    // ========== MOBILE MENU TOGGLE ==========
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }

    // ========== FAKE LIVE REACTION COUNTER ==========
    const liveCounter = document.getElementById('liveCounter');
    let counterValue = 1247;

    function updateLiveCounter() {
        if (!liveCounter) return;
        // Random fluctuation: -3 to +7 (trends upward)
        const change = Math.floor(Math.random() * 11) - 3;
        counterValue = Math.max(800, counterValue + change);
        liveCounter.textContent = counterValue.toLocaleString();
    }

    setInterval(updateLiveCounter, 2500);

    // ========== RANDOM CAPTION GENERATOR ==========
    const randomCaptions = [
        'ແຕ່ລະໂພສ, ແຕ່ລະແຊຣ, ໂນ໊ດ, ສະຕໍຣີ <br> ເຂົາລົງແຕ່ລະຢ່າງ ບໍ່ກ່ຽວຫຍັງກັບຂ້ອຍເລີຍ <br> ສູນນນນເດ!!!!! 💀',
        'ຫລ່ຽມທຸກດອກ ແລ້ວບອກວ່າຮັກແພງ 🤡',
        'ຮູ້ຮອດຫນັງສື ບາດເຂົາບໍ່ຮັກ ຄືປຶກຄັກປຶກແນ່ 💀',
        'ເຂົາບໍ່ທັນເບິ່ງສະຕໍຣິ ເຂົາບໍ່ຢາກເບິ່ງ 🥲',
        'ຢາກເປັນບັກນັ້ນເດ ຫາຍໃຈຊຶ່ເຈົ້າກະມັກ ✨',
        'ນອກຈາກເຂົາບໍ່ຮັກແລ້ວ <br> ເຂົາຍັງລົງສະຕໍຣີກັບແຟນໃຫ້ເຫັນຢູ່ 💀',
        'ຄັນຊິແທັກກັນປານນັ້ນ <br> ກະບລັອກຂ້ອຍໃຫ້ມັນແລ້ວສາ 🙂',
        'ແມ່ສອນໃຫ້ຮັກດຽວ <br> ຫມູ່ຂ້ອຍມັນເລີຍຮັກແຕ່ຄົນເກົ່າ 🤡',
        'ຂໍໂທດເດີ ທີ່ຮູ້ສຶກຫລາຍກວ່າສະຖານະ 🥲',
        'ລົງສະຕໍຣີເພື່ອໃຫ້ຄົນໆຫນຶ່ງມາເບິ່ງ <br> ມັນກະມີແທ້ເດີ ✨',
        'ແຊັທລົມກັບເຮົາບອກຮັກ ບອກຄິດຮອດ <br> ພໍຄາວຫນຶ່ງໄປລົງສະຕໍຣິເສົ້າ <br> ຈັກໃຜຕາຍ 🙂',
        'ຂໍໂທດເດີ ທີ່ເຂົ້າໃຈຜິດ ຄິດວ່າມັກຄືກັນ 💀',
        'ເສຍເສັ້ນກະພໍແຮງແລ້ວ <br> ຍັງມາເຮັດໃຫ້ເສຍໃຈອີກຢູ່ຕິ 😭',
        'ຊິໃຫ້ລືມໄດ້ຈັ່ງໃດ <br> ຈື່ຮອດຊື່ແມ່ເຂົາພຸ້ນ 💀',
        'ອົກຫັກຈາກຄົນລົມ <br> ແຟນຖາມວ່າເປັນຫຍັງຄືໄຫ້ <br> ບອກວ່າຫມູ່ຕາຍ 🤡',
        'ໃຊ້ໂທລະສັບລຸ້ນໃດນໍ <br> ເບິ່ງສະຕໍຣີໄດ້ <br> ແຕ່ຕອບແຊັທບໍ່ໄດ້ 🤡✨',
        'ເຈົ້າກະໂສດ ຂ້ອຍກະໂສດ <br> ເຮົາມາເປັນອ້າຍນ້ອງກັນສາ 🥲',
        'ລອງລົມຫລາຍຄົນຄືຫມູ່ <br> ໄຂ້ຂື້ນເສີຍເລີຍ <br> ຮ່າງກາຍປະຕິເສດຄວາມເຈົ້າຊູ້ 💀',
        'ຫົວໃຈຂາຍໄດ້ 3.9 ລ້ານບາດ <br> ແຕ່ຍົກໃຫ້ເຂົາໄປຟຣີໆ <br> ແຕ່ເຂົາບໍ່ເອົາຊໍ້າ 💀',
        'ມີແຟນກະຮັກແຟນເດີ <br> ບໍ່ແມ່ນມາຮັກອ້າຍ 🙂',
        'ທີ່ກັບເຂົາ ເປີດໂຕປານດາລາ <br> ທີ່ກັບຂ້ອຍປານພະມ້າຂ້າມປະເທດ 🤡',
        'ປວດຫລັງເດ ແບກຄວາມລັບຫມູ່ຫລາຍໂພດ 💀',
        'ຂ້ອຍຮັກເຈົ້າ ແຟນເຈົ້າບໍ່ກ່ຽວ 😏',
        'ຊິບໍ່ອາບນໍ້າ ຈົນກວ່າເຈົ້າຊິບອກຮັກ 💀',
        'ໄປເອົາໂລດຄົນຊົ່ວໆ <br> ບໍ່ຕ້ອງມາເອົາຄົນດີໆແບບເຮົາດອກ ✨',
        'ສະຕໍຣີຄືບໍ່ມີເວລາຈັກເດືອນຫນຶ່ງແນ່ <br> ເຂົາບໍ່ທັນເຂົ້າເບິ່ງຊໍ້າ 🥲',
        'ວຽກງານຄືຊິຫລາຍເນາະ <br> ທັກຍາມໃດກະມີແຕ່ວ່າບໍ່ຫວ່າງ 🤡',
        'ທັກໄປຢືມເງິນເຂົາບໍ່ຫວະ <br> ຄືຢາກແຊັທນຳເຂົາຄັກແທ້ 💀',
        'ບໍ່ຕອບແຊັທຍັງບໍ່ພໍ <br> ມາເບິ່ງສະຕໍຣີເຮົາອີກ <br> ຈັ່ງແມ່ນເລືອກເກີດຄັກເນາະ ✨',
        'ກະບໍ່ຫນາວປານໃດດອກ <br> ເຂົາບໍ່ຮັກຫນາວກວ່ານີ້ 🥲',
        'ຢ່າໃຫ້ຂ້ອຍໄດ້ແພ້ສຽງໃນຫົວເດີ 💀',
        'ຫາຍໃຈບໍ່ອອກກະຄິດວ່າແພ້ຝຸ່ນ <br> ທີ່ແທ້ແພ້ຄົນໃນໃຈເຂົາ 🥲',
        'ບໍ່ຮັກບໍ່ເປັນຫຍັງ <br> ແຕ່ຢ່າຟ້າວມີໃຜເດີ <br> ທາງນີ້ໃຈຊິຂາດແລ້ວ 💀',
        'ສູ້ແດດສູ້ຝົນໄດ້ເບິດ <br> ແຕ່ສູ້ຄົນໃນໃຈເຂົາບໍ່ໄດ້ 😭',
        'ຖືກເຂົາຕົວະຍັງບໍ່ພໍ <br> ຕົວະເຈົ້າຂອງວ່າເຂົາຮັກອີກ <br> ຈັ່ງແມ່ນປຶກຄັກ 🤡',
        'ຍິ້ມຈົນບໍ່ອອກເຂົາມາຢອກ <br> ເຂົາບໍ່ໄດ້ມາຮັກ 💀',
        'ເປີດຂວດກະດີຢູ່ແລ້ວ <br> ບໍ່ຫນ້າໄປເປີດໃຈເລີຍ ✨',
        'ເວົ້າສັ້ນໆເດີ ຂ້ອຍມັກເຈົ້າ 😏',
        'ຢ້ານເຈົ້າຖິ້ມ ເລີຍຖິ້ມເຈົ້າກ່ອນ 💀',
        'ຄົນທາງນັ້ນດູແລບໍ່ດີ <br> ຄົນທາງນີ້ຢາກດູແລໃຈຊິຂາດ 🥲',
        'ມີຫົວໃຈຢູ່ ແຕ່ບໍ່ມີແຟນ 💀',
        'ລົມກັນບໍ່ຮອດທິດ <br> ບອກຢາກເປັນຄູ່ຊີວິດ ວ່າຊ້ານ 🤡',
        'ມັກໂຕເອງເວລາບໍ່ມີເງິນ <br> ມັນເບິ່ງຄືອົດໆຢາກໆຂາດໆເຂີນໆ 💀',
        'ກິນເຂົ້າປຸ້ນບໍ່ມີຜັກ <br> ກະສໍ່າແອບຮັກ ແຕ່ເຂົາບໍ່ມີໃຈ 🥲',
        'ນອກຈາກເຈົ້າ ກະມີແຕ່ເຫລົ້ານີ້ແລະ <br> ທີ່ຂາດບໍ່ໄດ້ 🍺',
        'ຮົ່ມນຳຄົນຫລາຍໃຈ <br> ຮົ່ມຈັ່ງໃດກະບໍ່ອຸ່ນ 💀',
        '100 ຄົນທັກ ຕອບແຕ່ເຈົ້າຜູ້ດຽວ <br> ຄິດເອົາແລະ ✨',
        'ມີມີດ ມີປືນ ກະບໍ່ຢ້ານ <br> ຢ້ານແຕ່ມີຜົວແລ້ວ <br> ແຕ່ບອກວ່າໂສດ 🤡',
        'ບໍ່ຕ້ອງຢ້ານແຟນເຈົ້າຮູ້ <br> ຂ້ອຍຊິເປັນຊູ້ທີ່ຮູ້ງານ 😏',
        'ຖ້າການຕອບແຊັທໄວ ເປັນກິລາຊະນິດຫນຶ່ງ <br> ຂ້ອຍຄືຊິຕິດທີມຊາດແລ້ວ 💀',
        'ຄົນຮັກແມ່ນເຂົາ ຄົນແກ້ເຫົງາແມ່ນອ້າຍ 🥲',
        'ຢາກເປັນ Someone ຂອງເຈົ້າ <br> ແຕ່ເຈົ້າບອກວ່າ ເຮົາເປັນໄດ້ Some ນີ້ແລະ 💀',
        'ໃຈເຈົ້າກະຄືໝູສາມຊັ້ນ <br> ມີແຕ່ມັນບໍ່ມີຂ້ອຍ 🤡'
    ];

    const randomBtn = document.getElementById('randomBtn');
    const randomCaption = document.getElementById('randomCaption');
    let lastIndex = -1;

    if (randomBtn && randomCaption) {
        randomBtn.addEventListener('click', () => {
            // Pick a different caption from the last
            let newIndex;
            do {
                newIndex = Math.floor(Math.random() * randomCaptions.length);
            } while (newIndex === lastIndex && randomCaptions.length > 1);
            lastIndex = newIndex;

            randomCaption.classList.add('fading');
            setTimeout(() => {
                randomCaption.innerHTML = randomCaptions[newIndex];
                randomCaption.classList.remove('fading');
            }, 300);

            // Button bounce
            randomBtn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                randomBtn.style.transform = '';
            }, 150);
        });
    }

    // ========== INTERSECTION OBSERVER (FADE-IN ON SCROLL) ==========
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                // Stagger animation
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, i * 80);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.caption-card').forEach(card => {
        observer.observe(card);
    });

    // ========== TOAST NOTIFICATION ==========
    const toast = document.getElementById('toast');
    let toastTimer = null;

    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, 2200);
    }

    // ========== LIKE BUTTON INTERACTION ==========
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('liked');
            const isLiked = btn.classList.contains('liked');

            // Pop animation
            btn.style.transform = 'scale(1.2)';
            setTimeout(() => {
                btn.style.transform = '';
            }, 200);

            if (isLiked) {
                showToast('Liked! ❤️');
                // Update reaction count on parent card
                const card = btn.closest('.caption-card');
                const countEl = card ? card.querySelector('.reaction-count') : null;
                if (countEl) {
                    countEl.dataset.original = countEl.dataset.original || countEl.textContent;
                }
            }
        });
    });

    // ========== SHARE BUTTON INTERACTION ==========
    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.caption-card');
            const text = card ? card.querySelector('.caption-text').innerText : '';

            // Try Web Share API first
            if (navigator.share) {
                navigator.share({
                    title: 'Khamko Production',
                    text: text,
                    url: window.location.href
                }).catch(() => {
                    fallbackCopy(text);
                });
            } else {
                fallbackCopy(text);
            }
        });
    });

    function fallbackCopy(text) {
        try {
            navigator.clipboard.writeText(text).then(() => {
                showToast('Copied to clipboard! ✨');
            }).catch(() => {
                showToast('Shared! 🔥');
            });
        } catch (e) {
            showToast('Shared! 🔥');
        }
    }

    // ========== CATEGORY CARD CLICK ==========
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            const title = card.querySelector('.category-title').textContent;
            showToast(`Loading ${title}... 🔥`);

            // Bounce animation
            card.style.transform = 'translateY(-6px) scale(0.97)';
            setTimeout(() => {
                card.style.transform = '';
            }, 200);

            // Scroll to captions
            setTimeout(() => {
                const captions = document.getElementById('captions');
                if (captions) {
                    captions.scrollIntoView({ behavior: 'smooth' });
                }
            }, 400);
        });
    });

    // ========== TAG INTERACTION ==========
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', () => {
            showToast(`${tag.textContent} ✨`);
        });
    });

    // ========== HERO LOGO CLICK (FUN EASTER EGG) ==========
    const logoCircle = document.querySelector('.logo-circle');
    let clickCount = 0;

    if (logoCircle) {
        logoCircle.addEventListener('click', () => {
            clickCount++;
            logoCircle.style.transform = `rotate(${clickCount * 90}deg) scale(1.1)`;
            setTimeout(() => {
                logoCircle.style.transform = '';
            }, 400);

            if (clickCount === 5) {
                showToast('ຢຸດກົດໄດ້ແລ້ວ 💀');
                clickCount = 0;
            }
        });
    }

    // ========== ACTIVE NAV LINK ON SCROLL ==========
    const sections = document.querySelectorAll('section, header');
    const navItems = document.querySelectorAll('.nav-links a');

    function updateActiveNav() {
        const scrollPos = window.pageYOffset + 100;
        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');

            if (scrollPos >= top && scrollPos < top + height && id) {
                navItems.forEach(item => {
                    item.style.color = '';
                    if (item.getAttribute('href') === '#' + id) {
                        item.style.color = 'var(--accent)';
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', updateActiveNav);

    // ========== KONAMI-LIKE EASTER EGG ==========
    let keys = [];
    const secretCode = ['k', 'h', 'a'];

    document.addEventListener('keydown', (e) => {
        keys.push(e.key.toLowerCase());
        if (keys.length > secretCode.length) keys.shift();
        if (keys.join('') === secretCode.join('')) {
            showToast('ເຈົ້າພົບລະຫັດລັບແລ້ວ 🎉');
            document.body.style.animation = 'wiggle 0.5s ease 3';
            setTimeout(() => {
                document.body.style.animation = '';
            }, 1500);
        }
    });

    // ========== SMOOTH SCROLL FOR ANCHOR LINKS ==========
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '#0') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const offsetTop = target.offsetTop - 70;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ========== CONSOLE WELCOME (FOR THE NERDS) ==========
    console.log('%c💀 Khamko Production', 'font-size: 32px; font-weight: 900; color: #d4ff00;');
    console.log('%cໂອ້ຍ ມາສ່ອງ console ເຮັດຫຍັງ ໄປຫົວ meme ສິ', 'font-size: 14px; color: #a8a8b3;');

})();