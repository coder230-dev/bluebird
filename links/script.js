let mainLoader = createSkylineLoader(document.querySelector('.container'), true);

document.addEventListener('DOMContentLoaded', () => {
    createFeaturedCont();
})

window.onload = () => {
    mainLoader();
    createSocialBtns();
    loadIcons()
}

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
    });

    socialCont.querySelectorAll('a button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault()
        })
    });
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