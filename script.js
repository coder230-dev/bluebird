const CONTENT = [
    {
        header: true,
        title: 'Coming Soon...',
        body: `a new social media app that will change the aspects of it... <br><br> <b>View the images for hints.</b>`,
        cardImages: [
            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgop0xntO6zJuVontcGSTL92lw-6pI-FhwXA&s',
            'https://www.publicdomainpictures.net/pictures/570000/nahled/cartoon-team-1705924136FM2.jpg',
            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBmgoQEivXIU1nQTsD6GA92dOxBMjubHrTtg&s'
        ]
    },
    {
        header: true,
        title: 'Bluebird Browser',
        body: `The simplest browser you may have used`,
        cardImages: [
            'https://github.com/coder230-dev/bluebird_browser/raw/main/images/coverImg.png'
        ],
        tags: ['Product', 'Browser'],
        links: [
            {
                label: 'Download', link: 'https://github.com/coder230-dev/bluebird_browser/releases'
            },
            {
                label: 'View GitHub Project', link: 'https://github.com/coder230-dev/bluebird_browser'
            }
        ]
    },
    {
        header: true,
        title: 'I am a very intelligent person',
        body: `From having all A's in all classes to taking AP classes soon, I am aiming for a bright future.`,
        tags: ['My Future'],
        cardImages: [
            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTslne7eE8CEJCA7v36oSZbTYjr_1tRyfg70Q&s',
        ],
        links: [
            { label: 'Learn More About My Story', jsFunc: () => { console.log('Story clicked') } }
        ]
    },
];

const MENU_CONTENT = document.getElementById('menu-app').innerHTML;

const SUPABASE_URL = 'https://akypcbfljgwhzjryztzo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_CbSkAPp5Chs5JfAgTLRNpw_q_z9Nd6N';
let accountSupabaseClient = null;

document.getElementById('menu-nav-btn').onclick = () => openMenu();
document.getElementById('account-btn').onclick = async () => {
    const accountBtn = document.getElementById('account-btn');
    const content = await buildAccountMenuContent();
    openDropdownMenu(content, accountBtn);
};

function getSupabaseClient() {
    if (accountSupabaseClient || typeof supabase === 'undefined') return accountSupabaseClient;
    accountSupabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return accountSupabaseClient;
}

function loadCurrentUserFromStorage() {
    try {
        const stored = localStorage.getItem('currentUser');
        if (!stored) return null;
        return JSON.parse(stored);
    } catch (err) {
        console.error('Failed to parse currentUser from storage:', err);
        return null;
    }
}

async function getSupabaseAuthUser() {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
        const { data, error } = await client.auth.getSession();
        if (error || !data?.session?.user) return null;
        return data.session.user;
    } catch (err) {
        console.error('Supabase auth session error:', err);
        return null;
    }
}

async function getSupabaseAccountProfile(email, username) {
    const client = getSupabaseClient();
    if (!client || (!email && !username)) return null;

    try {
        if (email) {
            let { data, error } = await client
                .from('accounts')
                .select('username,full_name,name,email,profileImage,avatarPath,saved_data')
                .eq('saved_data->>email', email)
                .single();

            if (data) return data;
            if (error) {
                console.warn('No account found by saved_data email, trying fallback top-level email query.');
            }

            const fallback = await client
                .from('accounts')
                .select('username,full_name,name,email,profileImage,avatarPath,saved_data')
                .eq('email', email)
                .single();

            if (fallback.data) return fallback.data;
        }

        if (username) {
            const { data, error } = await client
                .from('accounts')
                .select('username,full_name,name,email,profileImage,avatarPath,saved_data')
                .eq('username', username)
                .single();

            if (error) {
                console.warn('No account found by username:', username, error.message);
            }
            return data || null;
        }

        return null;
    } catch (err) {
        console.error('Supabase profile query error:', err);
        return null;
    }
}

function getAvatarHtml(user) {
    const avatarUrl = user?.profileImage || user?.avatarPath || user?.user_metadata?.avatar_url;
    if (avatarUrl) {
        return `<img class="account-avatar" src="${avatarUrl}" alt="${user.name || user.full_name || 'Account'}">`;
    }
    return `<span class="account-avatar placeholder"><i class="material-symbols-rounded">person</i></span>`;
}

function getAccountName(user) {
    return (
        user?.full_name ||
        user?.name ||
        user?.user_metadata?.full_name ||
        "Bluebird User"
    );
}

function getAccountUsername(user) {
    return user?.username || user?.user_metadata?.username || user?.user_metadata?.user_name || '';
}

function getAccountEmail(user) {
    return user?.email || user?.user_metadata?.email || user?.saved_data?.email || '';
}

let cachedAccountUser = null;
let cachedAccountUserEmail = null;

function saveCurrentUserToStorage(user) {
    if (!user) return;
    try {
        localStorage.setItem('currentUser', JSON.stringify(user));
    } catch (err) {
        console.warn('Unable to cache currentUser to storage:', err);
    }
}

function hasProfileFields(user) {
    return Boolean(
        user?.username ||
        user?.full_name ||
        user?.name ||
        user?.profileImage ||
        user?.avatarPath
    );
}

function getAccountCacheKey(user) {
    return getAccountEmail(user) || user?.username || '';
}

async function buildAccountMenuContent() {
    let user = loadCurrentUserFromStorage();
    let supabaseUser = null;
    let accountProfile = null;

    const needsAuthUser = !user || (!getAccountEmail(user) && !user?.username);
    if (needsAuthUser) {
        supabaseUser = await getSupabaseAuthUser();
        if (supabaseUser) {
            user = {
                ...user,
                email: supabaseUser.email,
                user_metadata: supabaseUser.user_metadata || {},
                id: supabaseUser.id,
            };
            saveCurrentUserToStorage(user);
        }
    }

    const cacheKey = getAccountCacheKey(user);
    const shouldFetchProfile = Boolean(cacheKey && (!hasProfileFields(user) || cachedAccountUserEmail !== cacheKey));
    const email = getAccountEmail(user);
    const loggedIn = Boolean(user?.email || user?.username);
    const name = getAccountName(user);
    const username = getAccountUsername(user);
    const avatar = getAvatarHtml(user);
    const usernameLine = username ? `@${username}` : '';

    if (shouldFetchProfile) {
        accountProfile = await getSupabaseAccountProfile(email, username);
        if (accountProfile) {
            user = { ...user, ...accountProfile };
            cachedAccountUser = user;
            cachedAccountUserEmail = cacheKey;
            saveCurrentUserToStorage(user);
        }
    } else if (cachedAccountUser && cachedAccountUserEmail === cacheKey) {
        user = cachedAccountUser;
    }


    if (!loggedIn) {
        return `
            <div class="account-cont">
                <div class="account-header">
                    ${avatar}
                    <div class="account-meta">
                        <h3>Welcome back</h3>
                        <p class="account-hint">Sign in to access your Bluebird account.</p>
                    </div>
                </div>
                <div class="account-actions">
                    <a class="account-action-btn primary" href="website/accounts/login/index.html">Log In</a>
                    <a class="account-action-btn" href="website/accounts/signup/index.html">Sign Up</a>
                </div>
            </div>
        `;
    }

    return `
        <div class="account-cont">
            <div class="account-header">
                ${avatar}
                <div class="account-meta">
                    <h3>${name}</h3>
                    <p>${usernameLine || email}</p>
                </div>
            </div>
            <div class="account-actions">
                <a class="account-action-btn primary" href="website/accounts/dashboard/index.html">Manage Account</a>
                <a class="account-action-btn primary" href="website/accounts/logout/logout.html">Log Out</a>
            </div>
            <a href="website/accounts/login/index.html">Log in to Another Account</a>
            <a href="website/accounts/login/index.html">About Bluebird Accounts</a>
        </div>
    `;
}

const app = document.getElementById('main');
const layout = document.createElement('div');
layout.className = 'layout';
app.appendChild(layout);

const headerContent = CONTENT.filter(item => item.header === true);
const nonHeaderContent = CONTENT.filter(item => item.header !== true);

// 1. Carousel
const carouselWrapper = document.createElement('div');
carouselWrapper.className = 'carousel-wrapper';
layout.appendChild(carouselWrapper);

const carousel = document.createElement('div');
carousel.className = 'carousel';
carouselWrapper.appendChild(carousel);

const track = document.createElement('div');
track.className = 'carousel-track';
carousel.appendChild(track);

function createSlide(item) {
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';

    const cont = document.createElement('div');
    slide.appendChild(cont);

    const h2 = document.createElement('h2');
    h2.textContent = item.title || '';
    cont.appendChild(h2);

    const p = document.createElement('p');
    p.innerHTML = item.body || '';
    cont.appendChild(p);

    const cont2 = document.createElement('div');
    cont2.classList.add('container-2')
    slide.appendChild(cont2);

    if (Array.isArray(item.tags) && item.tags.length > 0) {
        const tagsDiv = document.createElement('div');
        tagsDiv.className = 'tags';
        item.tags.forEach(tagText => {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.textContent = tagText;
            tagsDiv.appendChild(tag);
        });
        cont.appendChild(tagsDiv);
    }

    let linkCount = 0;

    if (Array.isArray(item.links) && item.links.length > 0) {
        const linksDiv = document.createElement('div');
        linksDiv.className = 'links';

        const linksSect = createSlideSection('Links', cont2);
        item.links.forEach(linkData => {
            if (linkCount <= 2) {
                linkCount++;
                const btn = document.createElement('button');
                btn.className = linkCount === 1 ? 'btn btn-primary' : 'btn btn-secondary';
                btn.textContent = linkData.label || 'Click';

                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    try {
                        if (typeof linkData.jsFunc === 'function') linkData.jsFunc();
                    } catch (err) {
                        console.error('jsFunc error:', err);
                    }
                    if (linkData.link) window.open(linkData.link, '_blank', 'noopener,noreferrer');
                });

                linksDiv.appendChild(btn);
            }


            // For links section
            const a = document.createElement('a');
            a.className = 'linksOnSect';

            // If jsFunc exists, use click handler
            if (typeof linkData.jsFunc === 'function') {
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    try {
                        linkData.jsFunc();
                    } catch (err) {
                        console.error('jsFunc error:', err);
                    }
                });
            } else if (linkData.link) {
                a.href = linkData.link;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
            }

            // Build the inner structure
            const header = document.createElement('div');
            header.className = 'link-header';

            const label = document.createElement('b');
            label.textContent = linkData.label;

            const icon = document.createElement('i');
            icon.className = 'material-symbols-rounded';
            icon.textContent = linkData.jsFunc ? 'touch_double' : 'open_in_new';

            header.appendChild(label);
            header.appendChild(icon);

            a.appendChild(header);

            a.innerHTML += `
            <div class="link-desc">
                ${linkData.jsFunc ? 'Click to execute action.' : `<i class="material-symbols-rounded">link</i> ${linkData.link}`}
            </div>
            `

            linksSect.appendChild(a);
        });
        cont.appendChild(linksDiv);
    }

    if (Array.isArray(item.cardImages) && item.cardImages.length > 0) {
        const imgSec = createSlideSection('Images', cont2);

        item.cardImages.forEach(imageURL => {
            const img = document.createElement('img');
            img.src = imageURL;

            img.addEventListener('click', () => {
                lbImg.src = imageURL;
                zoomed = false;
                lbImg.classList.remove('zoomed');
                lightbox.classList.remove('hidden');
            });

            imgSec.appendChild(img);
        });
    }
    return slide;
}

function createSlideSection(name, nodeToAppend) {
    let newSection = document.createElement('section');
    newSection.className = 'slide-carousel-section';
    newSection.innerHTML = `<h3>${name}</h3>`;

    // Flex wrapper for buttons + scroll area
    let flexWrap = document.createElement('div');
    flexWrap.className = 'scroll-flex-wrap';

    // Scrollable container
    let scrollDiv = document.createElement('div');
    scrollDiv.className = 'scrollable-section';

    // Buttons
    const prevBtn = document.createElement('button');
    prevBtn.className = 'scroll-btn prev hidden';
    prevBtn.innerHTML = `<i class="material-symbols-rounded">arrow_back_ios</i>`;

    const nextBtn = document.createElement('button');
    nextBtn.className = 'scroll-btn next hidden';
    nextBtn.innerHTML = `<i class="material-symbols-rounded">arrow_forward_ios</i>`;

    // Build structure
    flexWrap.appendChild(prevBtn);
    flexWrap.appendChild(scrollDiv);
    flexWrap.appendChild(nextBtn);
    newSection.appendChild(flexWrap);
    nodeToAppend.appendChild(newSection);

    // Scroll logic
    const updateButtons = () => {
        const tolerance = 2; // pixels

        if (scrollDiv.scrollLeft <= 0) {
            prevBtn.classList.add('hidden');
        } else {
            prevBtn.classList.remove('hidden');
        }

        if (scrollDiv.scrollLeft + scrollDiv.clientWidth >= scrollDiv.scrollWidth - tolerance) {
            nextBtn.classList.add('hidden');
        } else {
            nextBtn.classList.remove('hidden');
        }
    };

    prevBtn.onclick = () => {
        scrollDiv.scrollBy({ left: -scrollDiv.clientWidth, behavior: 'smooth' });
    };

    nextBtn.onclick = () => {
        scrollDiv.scrollBy({ left: scrollDiv.clientWidth, behavior: 'smooth' });
    };

    scrollDiv.addEventListener('scroll', updateButtons);
    setTimeout(updateButtons, 50);

    return scrollDiv;
}

headerContent.forEach(item => {
    track.appendChild(createSlide(item));
});

// Controls - only show if more than 1 slide
const controls = document.createElement('div');
controls.className = 'carousel-controls';
if (headerContent.length <= 1) controls.classList.add('hidden');
carouselWrapper.appendChild(controls);

const prevBtn = document.createElement('button');
prevBtn.className = 'control-btn';
prevBtn.setAttribute('aria-label', 'Previous slide');
prevBtn.innerHTML = `<i class="material-symbols-rounded">arrow_back_ios</i>`;
controls.appendChild(prevBtn);

const dots = document.createElement('div');
dots.className = 'dots';
controls.appendChild(dots);

const playPauseBtn = document.createElement('button');
playPauseBtn.className = 'control-btn material-symbols-rounded';
playPauseBtn.setAttribute('aria-label', 'Pause autoplay');
playPauseBtn.textContent = 'pause';
controls.appendChild(playPauseBtn);

const nextBtn = document.createElement('button');
nextBtn.className = 'control-btn';
nextBtn.setAttribute('aria-label', 'Next slide');
nextBtn.innerHTML = `<i class="material-symbols-rounded">arrow_forward_ios</i>`;
controls.appendChild(nextBtn);

// Carousel state
let currentSlide = 0;
let autoScrollInterval = null;
let userPaused = false;
let isTransitioning = false;
const AUTOSCROLL_DELAY = 4000;

const dotButtons = [];
headerContent.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.className = 'dot';
    if (index === 0) dot.classList.add('active');
    dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
    dot.addEventListener('click', () => {
        if (!isTransitioning) goToSlide(index);
    });
    dots.appendChild(dot);
    dotButtons.push(dot);
});

function setTransitioning(state) {
    isTransitioning = state;
    prevBtn.disabled = state;
    nextBtn.disabled = state;
    dotButtons.forEach(d => d.disabled = state);
}

function updateCarousel() {
    const slideWidth = carousel.offsetWidth;
    track.style.transform = `translateX(-${currentSlide * slideWidth}px)`;
    dotButtons.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
}

function goToSlide(index) {
    if (isTransitioning || index === currentSlide) return;
    setTransitioning(true);
    currentSlide = index;
    updateCarousel();
    resetAutoScroll();
    setTimeout(() => setTransitioning(false), 500);
}

function nextSlide() {
    if (isTransitioning) return;
    setTransitioning(true);
    currentSlide = (currentSlide + 1) % headerContent.length;
    updateCarousel();
    setTimeout(() => setTransitioning(false), 500);
}

function prevSlide() {
    if (isTransitioning) return;
    setTransitioning(true);
    currentSlide = (currentSlide - 1 + headerContent.length) % headerContent.length;
    updateCarousel();
    setTimeout(() => setTransitioning(false), 500);
}

function startAutoScroll() {
    if (headerContent.length <= 1) return;
    clearInterval(autoScrollInterval);
    autoScrollInterval = setInterval(nextSlide, AUTOSCROLL_DELAY);
    playPauseBtn.textContent = 'pause';
    playPauseBtn.setAttribute('aria-label', 'Pause autoplay');
}

function stopAutoScroll() {
    clearInterval(autoScrollInterval);
    autoScrollInterval = null;
    playPauseBtn.textContent = 'play_arrow';
    playPauseBtn.setAttribute('aria-label', 'Play autoplay');
}

function resetAutoScroll() {
    if (!userPaused && autoScrollInterval !== null) {
        startAutoScroll();
    }
}

nextBtn.addEventListener('click', () => {
    nextSlide();
    resetAutoScroll();
});

prevBtn.addEventListener('click', () => {
    prevSlide();
    resetAutoScroll();
});

playPauseBtn.addEventListener('click', () => {
    userPaused = !userPaused;
    userPaused ? stopAutoScroll() : startAutoScroll();
});

// carouselWrapper.addEventListener('mouseenter', () => {
//     if (!userPaused && autoScrollInterval !== null) {
//         clearInterval(autoScrollInterval);
//     }
// });

// carouselWrapper.addEventListener('mouseleave', () => {
//     if (!userPaused) startAutoScroll();
// });

window.addEventListener('resize', updateCarousel);

// Start if we have slides
if (headerContent.length > 1) {
    startAutoScroll();
}

// 2. Sidebar for non-header content
const sidebar = document.createElement('div');
sidebar.className = 'sidebar';
layout.appendChild(sidebar);

function createCard(item) {
    const card = document.createElement('div');
    card.className = 'card';

    const h4 = document.createElement('h4');
    h4.textContent = item.title || '';
    card.appendChild(h4);

    const p = document.createElement('p');
    p.textContent = item.body || '';
    card.appendChild(p);

    if (Array.isArray(item.tags) && item.tags.length > 0) {
        const tagsDiv = document.createElement('div');
        tagsDiv.className = 'tags';
        item.tags.forEach(tagText => {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.textContent = tagText;
            tagsDiv.appendChild(tag);
        });
        card.appendChild(tagsDiv);
    }

    if (Array.isArray(item.links) && item.links.length > 0) {
        const linksDiv = document.createElement('div');
        linksDiv.className = 'links';
        item.links.forEach(linkData => {
            const btn = document.createElement('button');
            btn.className = linkData.primary ? 'btn btn-primary' : 'btn btn-secondary';
            btn.textContent = linkData.label || 'Click';
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                try {
                    if (typeof linkData.jsFunc === 'function') linkData.jsFunc();
                } catch (err) {
                    console.error('jsFunc error:', err);
                }
                if (linkData.link) window.open(linkData.link, '_blank', 'noopener,noreferrer');
            });
            linksDiv.appendChild(btn);
        });
        card.appendChild(linksDiv);
    }
    return card;
}

if (nonHeaderContent.length === 0) {
    const emptyMsg = document.createElement('p');
    emptyMsg.textContent = 'No additional content';
    emptyMsg.style.color = 'var(--scheme-9)';
    sidebar.appendChild(emptyMsg);
} else {
    nonHeaderContent.forEach((item, i) => {
        if (i < 2) {
            sidebar.appendChild(createCard(item));
        }
    });
}

// 3. All content section
const otherContentSection = document.createElement('div');
otherContentSection.className = 'other-content';
layout.appendChild(otherContentSection);

const otherTitle = document.createElement('h3');
otherTitle.textContent = 'All Content';
otherContentSection.appendChild(otherTitle);

const contentGrid = document.createElement('div');
contentGrid.className = 'content-grid';
otherContentSection.appendChild(contentGrid);

CONTENT.forEach(item => {
    contentGrid.appendChild(createCard(item));
});

createSkylineLoader(document.getElementById('main').lastElementChild);

function createSkylineLoader(targetElement, withBackground = false) {
    // Create wrapper
    const wrapper = document.createElement("div");
    wrapper.className = "skyline-loader" + (withBackground ? " bg" : "");

    // Skyline HTML
    wrapper.innerHTML = `
      <div class="skyline">
        <div class="building b1"></div>
        <div class="building b2"></div>
        <div class="building b3"></div>
        <div class="building b4"></div>
        <div class="building b5"></div>
        <div class="beacon"></div>
      </div>
    `;

    targetElement.appendChild(wrapper);

    const skyline = wrapper.querySelector(".skyline");

    // Total rise animation time = last delay + animation duration
    const riseTime = (0.4 + 0.9) * 1000 + 1200;

    function runCycle() {
        // Reset classes
        skyline.classList.remove("flicker");

        // Restart rise animations by forcing reflow
        const buildings = skyline.querySelectorAll(".building");
        buildings.forEach(b => {
            b.style.animation = "none";
            void b.offsetWidth; // reflow
            b.style.animation = "";
        });

        // Flicker after rise finishes
        setTimeout(() => {
            skyline.classList.add("flicker");
        }, riseTime);
    }

    // Start loop
    runCycle();
    const interval = setInterval(runCycle, riseTime + 600);

    // Cleanup function
    return () => {
        clearInterval(interval);
        wrapper.remove();
    };
}

function openMenu() {
    const PAGE_WIDTH = window.innerWidth;
    let mainCont = document.getElementById('main');
    let menuCont = document.getElementById('menu-app');

    let navBtn = document.getElementById('menu-nav-btn');

    // If the page is less than 700, then it opens in an styled popup. If it is more than 700, it clears the content and shows the rest there.
    if (PAGE_WIDTH > 700 && menuCont.classList.contains('open')) {
        navBtn.querySelector('i').innerText = 'menu';
        menuCont.classList.remove('open');
        mainCont.classList.remove('hidden');
        mainCont.style.position = 'static';
        return
    }

    if (PAGE_WIDTH < 700) {
        mainCont.classList.add('open');
        openDropdownMenu(MENU_CONTENT, navBtn)

    } else {
        navBtn.querySelector('i').innerText = 'dashboard_2';
        menuCont.classList.add('open');
        mainCont.classList.add('hidden');

        mainCont.style.position = 'absolute';
    }
}

function convertDropdownMenuSections(dropdown) {
    const menuGrid = dropdown.querySelector('.menu-grid');
    if (!menuGrid) return;

    const sections = Array.from(menuGrid.querySelectorAll('.grid-section'));
    sections.forEach((section) => {
        const heading = section.querySelector('h2');
        if (!heading) return;

        const details = document.createElement('details');
        details.className = 'dropdown-grid-section';

        const summary = document.createElement('summary');
        summary.className = 'dropdown-grid-summary';
        summary.innerHTML = heading.innerHTML;

        const content = document.createElement('div');
        content.className = 'dropdown-grid-content';

        Array.from(section.children).forEach((child) => {
            if (child !== heading) content.appendChild(child);
        });

        details.append(summary, content);
        section.replaceWith(details);
    });
}

function openDropdownMenu(content, eleClicked = document.body) {
    const dropdown = document.createElement('div');
    dropdown.classList.add('dropdown-menu');
    dropdown.innerHTML = content;

    convertDropdownMenuSections(dropdown);

    document.body.appendChild(dropdown);

    const rect = eleClicked.getBoundingClientRect();

    let x = rect.left;
    let y = rect.bottom;

    // Prevent right overflow
    const dropdownWidth = dropdown.offsetWidth;
    if (x + dropdownWidth > window.innerWidth) {
        x = window.innerWidth - dropdownWidth;
    }

    // Prevent left overflow
    if (x < 0) x = 0;

    // Prevent bottom overflow
    const dropdownHeight = dropdown.offsetHeight;
    if (y + dropdownHeight > window.innerHeight) {
        y = rect.top - dropdownHeight;
    }

    // Prevent top overflow
    if (y < 0) y = 0;

    dropdown.style.left = x + 'px';
    dropdown.style.top = y + 'px';
    dropdown.style.maxHeight = `calc(100vh - ${rect.top}px - ${rect.height}px - 50px)`;

    requestAnimationFrame(() => {
        eleClicked.classList.add('lock-hover');
        document.body.onclick = (e) => {
            if (dropdown.contains(e.target)) {
                console.log('returned');
                return;
            }
            eleClicked.classList.remove('lock-hover');
            dropdown.remove();
        };
    });
}


// Image

// Create global lightbox
const lightbox = document.createElement('div');
lightbox.className = 'image-lightbox hidden';

lightbox.innerHTML = `
    <div class="lightbox-content">
        <button class="lightbox-close">×</button>
        <img class="lightbox-img" src="">
        <div class="lightbox-actions">
            <button class="lightbox-zoom">Zoom</button>
            <button class="lightbox-download">Download</button>
        </div>
    </div>
`;

document.body.appendChild(lightbox);

// Elements
const lbImg = lightbox.querySelector('.lightbox-img');
const lbClose = lightbox.querySelector('.lightbox-close');
const lbZoom = lightbox.querySelector('.lightbox-zoom');
const lbDownload = lightbox.querySelector('.lightbox-download');

// Close behavior
lbClose.onclick = () => lightbox.classList.add('hidden');
lightbox.onclick = e => {
    if (e.target === lightbox) lightbox.classList.add('hidden');
};

// Zoom toggle
let zoomed = false;
lbZoom.onclick = () => {
    zoomed = !zoomed;
    lbImg.classList.toggle('zoomed', zoomed);
};

// Download
lbDownload.onclick = () => {
    const a = document.createElement('a');
    a.href = lbImg.src;
    a.download = 'image.jpg';
    a.click();
};