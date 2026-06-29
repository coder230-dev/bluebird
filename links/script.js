let mainLoader = createSkylineLoader(document.querySelector('.container'), true);

document.addEventListener('DOMContentLoaded', () => {
    createFeaturedCont();
})

window.onload = () => {
    mainLoader();
    createSocialBtns();
    // loadIcons();

    document.querySelectorAll('a').forEach(a => {
        console.log(a)
        a.addEventListener('click', (e) => {
            e.preventDefault();
            if (e.target == a.querySelector('button')) {
                console.log(true);
                return
            }
            let loader = createSkylineLoader(document.body, true);
            setTimeout(() => {
                window.open(a.href);
                loader();
            }, 500);
        })
    })
    document.body.style.colorScheme = 'light dark';
}

document.getElementById('more-btn').addEventListener('click', () => {
    let colorScheme = document.body.style.colorScheme;
    createContextMenu([
        {
            name: 'Theme',
            icType: 'GF',
            icon: 'palette',
            category: 'Appearance',
            submenu: [
                {
                    name: 'Light Mode',
                    icType: 'GF',
                    icon: colorScheme === 'light' ? 'check' : 'light_mode',
                    function: () => {
                        document.body.style.colorScheme = 'light';
                    }

                },
                {
                    name: 'Dark Mode',
                    icType: 'GF',
                    icon: colorScheme === 'dark' ? 'check' : 'dark_mode',
                    function: () => {
                        document.body.style.colorScheme = 'dark';
                    }
                },
                {
                    name: 'System Default',
                    icType: 'GF',
                    icon: colorScheme === 'light dark' ? 'check' : 'computer',
                    function: () => {
                        document.body.style.colorScheme = 'light dark';
                    }
                },
            ]
        },

        {
            name: 'Share Profile',
            icType: 'GF',
            icon: 'share',
            category: 'Profile',
            function: async () => {
                await navigator.share({
                    title: document.title,
                    text: 'Check this out',
                    url: window.location.href,
                });
            }
        },

        {
            name: 'Copy Profile Link',
            icType: 'GF',
            icon: 'link',
            category: 'Profile',
            function: async () => {
                await navigator.clipboard.writeText(window.location.href);
            }
        },

        {
            name: 'Reload',
            icType: 'GF',
            icon: 'refresh',
            category: 'Other',
            function: () => {
                location.reload()
            }
        },
        {
            name: 'Close & Exit',
            icType: 'GF',
            icon: 'close',
            category: 'Other',
            function: () => {
                window.close()
            }
        }
    ], document.getElementById('more-btn'));
})

let mediaBackground = [
    'images/IMG_5357.png',
    'images/IMG_5428.png',
    'images/IMG_5431.png',
    '../website/Images/static-camera-no-perspective-shift-or-zoom-keep-th.mp4'
];

let iconsUsed = [
    'open_in_new',
    'link',
    'touch_double',
    'arrow_right',
    'arrow_left',
    'feedback',
    'more_vert'
];

let FEATURED_CONTENT = [
    {
        icon: "beach_access",
        title: "Vacation in Boise!",
        content: "See my vacation in my story highlights on IG. (linked below)",
        tags: [
            { color: '#c6b200', label: 'Summer 2026' },

        ],
        links: [
            {
                label: 'IG Highlights of my Vacay.',
                desc: "* Must be following to see.",
                url: 'https://www.instagram.com/s/aGlnaGxpZ2h0OjE4MzcwMTM3NDI0MjMxNDU5?story_media_id=3922566942301223962&igsh=NTc4MTIwNjQ2YQ=='
            },
        ],
        attached: [
            { type: 'image', }
        ]
    },
    {
        title: 'apple'
    }
];

let SOCIALS = [
    {
        label: 'Instagram',
        username: 'bryant_san230',
        url: 'https://instagram.com/bryant_san230',
        icon: 'instagram',
        tags: [
            { label: 'Prefered', bg: 'gold', color: 'black' },
            { label: 'Most Used', bg: 'purple', color: 'white' },
        ]
    },
    {
        label: 'TikTok',
        username: '@bryant230sacramento',
        url: 'https://tiktok.com/@bryant230sacramento',
        icon: 'tiktok',
        tags: [
            { label: 'More Posts', bg: 'green', color: 'white' },
        ]
    },
    {
        label: 'Threads',
        username: 'bryant_san230',
        url: 'https://threads.com/bryant_san230',
        icon: 'threads',
        tags: [
            { label: 'See my Threads on my Instagram Story', bg: 'black', color: 'white' },
        ]
    },
    {
        label: 'GitHub',
        username: 'coder230-dev',
        url: 'https://github.com/coder230-dev',
        icon: 'github',
        tags: [
            { label: 'Bluebird Browser Now Public', bg: 'cyan', color: 'black' },
        ]
    },
    {
        label: 'X (Twitter)',
        username: 'bryant_san230',
        url: 'https://x.com/bryant_san230',
        icon: 'x-twitter',
        tags: [

        ]
    },
];

function loadIcons() {
    let linkElement = document.getElementById('icon_href');
    linkElement.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=';
    iconsUsed.sort((a, b) => a.localeCompare(b));

    const listWithComma = iconsUsed
        .filter(icon => icon)
        .join(',');

    linkElement.href = `https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=${listWithComma}`;
}

function createFeaturedCont() {
    FEATURED_CONTENT.forEach(content => {
        createCard(content);
    });
    FEATURED_CONTENT = null;
}

function createSocialBtns() {
    const socialCont = document.getElementById('socials');
    SOCIALS.forEach(s => {
        // Creating the button
        let socBtn = document.createElement('a');
        socBtn.target = '_blank'
        socBtn.href = s.url;
        socBtn.className = 'wide-btn flex-3-sections';

        // Adding HTML
        socBtn.innerHTML = `
        <i class="fa-brands fa-${s.icon}"></i>
        <section>
            <b class="platform-name">${s.label}</b>
            <p class="social-name">${s.username}</p>
            <div class="tags">
                ${createTags(s.tags)}
            </div>
        </section>
        <button class="material-symbols-rounded">
            more_vert
        </button>
        `

        socialCont.appendChild(socBtn);
        socBtn.querySelector('button').addEventListener('click', () => {
            let btn = socBtn.querySelector('button');
            createContextMenu([
                {
                    innerHtml: `
                    <div style="background: var(--scheme-3); width: 100%; padding: 14px; border-radius: var(--radius)">
                        <b style="display: flex; align-items: center; gap: 7px;">
                            <i class="material-symbols-rounded">page_info</i>
                            ${getBaseURL(btn.parentElement.href)}
                        </b>
                        <p style="margin: 0; padding: 0; display: flex; align-items: center; gap: 7px;">
                        <i class="material-symbols-rounded">link</i>
                        ${btn.parentElement.href}
                        </p>
                    </div>`
                },
                {
                    icType: 'GF', icon: 'open_in_browser', name: 'Open & Replace this Page', function: () => {
                        openURL(btn.parentElement.href, '');
                    }
                },
                {
                    icType: 'GF', icon: 'open_in_new', name: 'Open in New Tab', function: () => {
                        openURL(btn.parentElement.href, '_blank');
                    }
                }
            ], btn);
        });
    });
}

function openURL(url, target) {
    let a = document.createElement('a')
    a.href = url;
    a.target = target;
    a.rel = 'noreferer';
    document.body.appendChild(a);
    a.click();
    a.remove();
}

function createTags(tagArray = "") {
    let html = '';
    tagArray.forEach(tag => {
        html += `
            <span class="tag" style="background: ${tag.bg || 'black'}; color:${tag.color || 'white'}">
                ${tag.label || 'Unamed Tag'}
            </span>
            `
    })
    return html;
}

function createCard(data) {
    const mainCont = document.getElementById('featured');

    // Creating the card
    let card = document.createElement('div');
    card.classList.add('card-in-feat');
    mainCont.appendChild(card);

    // Tags
    if (data.tags) {
        let tagCont = document.createElement('div');
        tagCont.className = 'tagCont';
        card.appendChild(tagCont);
        data.tags.forEach(tag => {
            let tagEl = document.createElement('div');
            tagEl.className = 'tag'
            tagEl.innerText = tag.label;
            tagEl.style.background = tag.color;
            tagCont.appendChild(tagEl);
        });
    }

    // Creating the h1
    let h1 = document.createElement('h1');
    h1.innerHTML = `<i class="material-symbols-rounded" font-size: inherent;>${data.icon}</i> ${data.title}`;
    card.appendChild(h1);

    iconsUsed.push(data.icon);

    // Content
    let p = document.createElement('p');
    p.innerHTML = data.content;
    card.appendChild(p);

    if (data.links) {
        let linksCont = document.createElement('div');
        linksCont.className = 'linksCont';
        card.appendChild(linksCont);
        data.links.forEach(link => {
            let linkType = link.jsFunc && !link.url ? 'jsFunc' : 'url';

            let linkEl = document.createElement('a');
            linkEl.href = link.url
            linkEl.className = 'link';
            linkEl.title = link.url;
            linkEl.innerHTML = `
            <div class="linkHeader">
                <b>${link.label}</b>
                <i class="material-symbols-rounded">${link.jsFunc ? 'touch_double' : 'open_in_new'}</i>
            </div>
            <p class="linkDesc">
                ${link.desc || linkType}
            </p>
            <p style="display: flex; align-items: center; gap: 7px;">
                <i class="material-symbols-rounded">link</i>
                ${getBaseURL(link.url)}
            </p>
            <p>
                ${link.desc ? '' : linkType}
            </p>
            `
            linksCont.appendChild(linkEl);
        });
    }
}

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

function getBaseURL(url) {
    try {
        const u = new URL(url);
        return `${u.protocol}//${u.hostname}`;
    } catch {
        return null; // invalid URL
    }
}

let activeMenuKeydownHandlers = new Set();

function createContextMenu(items = [], elementClicked = null, x = 0, y = 0, passThru = {}) {
    removeContextMenus();
    setTimeout(function () {
        elementClicked?.classList.add('hover-force');
    }, 100)

    setTimeout(() => {
        const backdrop = document.createElement('div');
        backdrop.classList.add('context-menu-backdrop');
        Object.assign(backdrop.style, {
            width: '100%',
            height: '100vh',
            left: '0',
            top: '0',
            position: 'fixed',
            zIndex: '999'
        });
        backdrop.onclick = removeContextMenus;
        backdrop.oncontextmenu = (e) => {
            e.preventDefault();
        };
        document.body.appendChild(backdrop);

        const contextMenu = document.createElement('div');
        contextMenu.classList.add('context-menu');
        // ensure menu is positioned fixed so we can place it anywhere on screen
        contextMenu.style.position = 'fixed';
        contextMenu.style.zIndex = '1000';
        document.body.appendChild(contextMenu);

        let top = y;
        let left = x;

        if (elementClicked) {
            const rect = elementClicked.getBoundingClientRect();
            // Position the menu below the clicked element by default
            top = rect.bottom + window.scrollY;
            left = rect.left + window.scrollX;
            console.log({ top, left })
        }

        // Start hidden to measure size and avoid flicker

        // Build items first so menu has size when we measure
        const buildItems = (list, parent) => {
            let currentCategory = null;

            list.forEach(({ icon, icType, name, shortcut, category, innerHtml, submenu, disabled, function: callback, id }) => {

                if (category && category !== currentCategory) {
                    currentCategory = category;
                    const catDiv = document.createElement('div');
                    catDiv.classList.add('context-menu-category');
                    catDiv.innerHTML = `<span>${category}</span>`;
                    parent.appendChild(catDiv);
                }

                const item = document.createElement('div');
                item.classList.add('context-menu-item');
                if (id) item.id = id;

                if (!innerHtml) {
                    if (icType === 'GF') icon = `<i class="material-symbols-rounded">${icon}</i>`;
                    else if (icType === 'img') icon = `<img src="${icon}">`;
                    else if (icType === 'FAb') icon = `<i class="fa-brands fa-${icon}"></i>`;
                    else if (icType === 'FA') icon = `<i class="fa-solid fa-${icon}"></i>`;

                    const leftSpan = document.createElement('span');
                    leftSpan.innerHTML = `${icon ? `<span class="icon" style="margin-right:6px">${icon}</span>` : ''}${name || ''}`;
                    item.appendChild(leftSpan);
                } else {
                    item.innerHTML = innerHtml;
                }

                if (submenu) {
                    const arrow = document.createElement('span');
                    arrow.textContent = '▶';
                    arrow.style.opacity = '0.6';
                    arrow.style.marginLeft = '8px';
                    item.appendChild(arrow);

                    if (callback) {
                        item.onclick = (e) => {
                            e.preventDefault();
                            callback?.(passThru);
                            removeContextMenus();
                        };
                    }

                    // Create submenu element appended to body so it can be positioned outside the button
                    const subMenu = document.createElement('div');
                    subMenu.classList.add('context-submenu');
                    subMenu.style.position = 'absolute';
                    subMenu.style.zIndex = '1001';
                    document.body.appendChild(subMenu);

                    // Build submenu items into the submenu element
                    buildItems(submenu, subMenu);

                    // Position submenu relative to the item on mouseenter
                    const positionSubmenu = () => {
                        const itemRect = item.getBoundingClientRect();
                        const subRect = subMenu.getBoundingClientRect();
                        const vw = window.innerWidth;
                        const vh = window.innerHeight;

                        // Default: place to the right of the item
                        let subLeft = itemRect.right + window.scrollX;
                        let subTop = itemRect.top + window.scrollY;

                        // If it would overflow right, place to the left of the item
                        if (subLeft + subRect.width > vw) {
                            subLeft = itemRect.left + window.scrollX - subRect.width;
                        }

                        // If it would overflow bottom, shift up
                        if (subTop + subRect.height > vh) {
                            subTop = Math.max(0, vh - subRect.height);
                        }

                        // If it would overflow top, clamp
                        if (subTop < 0) subTop = 0;

                        subMenu.style.left = `${Math.max(0, subLeft)}px`;
                        subMenu.style.top = `${Math.max(0, subTop)}px`;
                    };

                    let enterTimeout = null;

                    item.addEventListener('mouseenter', () => {
                        requestAnimationFrame(positionSubmenu)
                        // small delay to avoid accidental opens
                        clearTimeout(enterTimeout);
                        enterTimeout = setTimeout(() => {
                            positionSubmenu();
                            subMenu.style.opacity = '1';
                            subMenu.style.pointerEvents = 'auto';
                        }, 50);
                    });

                    item.addEventListener('mouseleave', () => {
                        clearTimeout(enterTimeout);
                        // small delay to allow moving into submenu
                        setTimeout(() => {
                            // If mouse is not over submenu, hide it
                            const overSub = document.querySelector(':hover') === subMenu || subMenu.matches(':hover');
                            if (!overSub) {
                                subMenu.style.opacity = '0';
                                subMenu.style.pointerEvents = 'none';
                            }
                        }, 100);
                    });

                    // Keep submenu visible while hovering it
                    subMenu.addEventListener('mouseenter', () => {
                        clearTimeout(enterTimeout);
                        subMenu.style.opacity = '1';
                        subMenu.style.pointerEvents = 'auto';
                    });
                    subMenu.addEventListener('mouseleave', () => {
                        subMenu.style.opacity = '0';
                        subMenu.style.pointerEvents = 'none';
                        subMenu.style.animationDirection = 'reverse';
                    });

                } else {
                    if (shortcut) {
                        const right = document.createElement('span');
                        right.classList.add('shortcut');
                        right.textContent = shortcut;
                        right.style.opacity = '0.6';
                        item.appendChild(right);

                        const handler = (e) => {
                            const combo = [];
                            if (e.ctrlKey || e.metaKey) combo.push('Ctrl');
                            if (e.altKey) combo.push('Alt');
                            if (e.shiftKey) combo.push('Shift');
                            combo.push(e.key.toUpperCase());

                            if (combo.join('+') === shortcut.toUpperCase()) {
                                e.preventDefault();
                                callback?.(passThru);
                                removeContextMenus();
                            }
                        };

                        window.addEventListener('keydown', handler);
                        window.activeMenuKeydownHandlers.add(handler);
                    }

                    item.addEventListener('click', (e) => {
                        e.stopPropagation();
                        callback?.(passThru);
                        removeContextMenus();
                    });
                }

                if (!disabled) parent.appendChild(item);
            });
        };

        // Build the menu items into the contextMenu element
        buildItems(items, contextMenu);

        // Now that items are built, measure and position the context menu
        requestAnimationFrame(() => {
            const menuRect = contextMenu.getBoundingClientRect();
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            let originX = "left";
            let originY = "top";

            if (left + menuRect.width > vw) { left = Math.max(0, vw - menuRect.width); originX = "right" }
            if (top + menuRect.height > vh) { top = Math.max(0, vh - menuRect.height); originY = "bottom" }

            contextMenu.style.transformOrigin = `${originX} ${originY}`;
            contextMenu.style.top = `${Math.max(0, top)}px`;
            contextMenu.style.left = `${Math.max(0, left)}px`;
            contextMenu.classList.add('open');
        });

        // Global cleanup listeners
        setTimeout(() => {
            document.addEventListener('click', removeContextMenus);

            document.querySelectorAll('webview').forEach(webview => {
                try { webview.addEventListener('mousedown', removeContextMenus); } catch (e) { }
            });
        }, 0);
        document.querySelector('.context-menu-item')?.focus();
        return contextMenu;
    }, 50);
}

function removeContextMenus() {
    const menus = document.querySelectorAll('.context-menu, .context-submenu');

    menus.forEach(menu => {
        menu.remove();
    });

    // Remove hover-force safely
    const hover = document.querySelector('.hover-force');
    if (hover) hover.classList.remove('hover-force');

    // Remove backdrop immediately (or animate it too if you want)
    document.querySelectorAll('.context-menu-backdrop').forEach(b => b.remove());

    // Remove listeners
    document.removeEventListener('click', removeContextMenus);
    document.querySelectorAll('webview').forEach(w => {
        w.removeEventListener('mousedown', removeContextMenus);
    });

    for (const fn of activeMenuKeydownHandlers) {
        window.removeEventListener('keydown', fn);
    }
    activeMenuKeydownHandlers.clear();
}