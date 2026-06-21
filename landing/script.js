let mainLoader = createSkylineLoader();

document.addEventListener('DOMContentLoaded', () => {
    createFeaturedCont();
})

document.onload = () => {
    mainLoader();
}

const FEATURED_CONTENT = [
    {
        icon: "beach",
        title: "Vacation in Boise!",
        content: "See my vacation in my story highlights on IG.",
        tags: [
            { color: '#c6b200', label: 'Summer 2026' },

        ],
        links: [
            {
                label: 'IG Highlights of my Vacay.',
                desc: "* Must be following to see.",
                url: 'https://www.instagram.com/s/aGlnaGxpZ2h0OjE4MzcwMTM3NDI0MjMxNDU5?story_media_id=3922566942301223962&igsh=NTc4MTIwNjQ2YQ=='
            }
        ],
        attached: [
            { type: 'image', }
        ]
    }
];

function createFeaturedCont() {
    FEATURED_CONTENT.forEach(content => {
        createCard(content);
    });
}

function createCard(data) {
    const mainCont = document.getElementById('featured');

    // Creating the card
    let card = document.createElement('div');
    card.classList.add('card-in-feat');
    mainCont.appendChild(card);

    // Creating the h1
    let h1 = document.createElement('h1');
    h1.innerHTML = `<i class="material-symbols-rounded" font-size: inherent;>${data.icon}</i> ${data.title}`;
    card.appendChild(h1);

    // Content
    let p = document.createElement('p');
    p.innerHTML = data.content;
    card.appendChild(p);

    // Tags
    if (typeof data.tags == 'array' && data.tags) {
        let tagCont = document.createElement('div');
        tagCont.className = 'tagCont';
        card.appendChild(tagCont);
        data.tags.forEach(tag => {
            let tagEl = document.createElement('span');
            tagEl.innerText = tag.label;
            tagEl.style.background = tag.color;
            tagCont.appendChild(tagEl);
        });
    }

    if (typeof data.links === 'array' && data.links) {
        let linksCont = document.createElement('div');
        linksCont.className = 'linksCont';
        card.appendChild(linksCont);
        data.links.forEach(link => {
            let linkType = link.jsFunc && !link.url ? 'jsFunc' : 'url';

            let linkEl = document.createElement('div');
            linkEl.className = 'link';
            linkEl.innerHTML = `
            <div class="linkHeader">
                <b>${link.label}</b>
                <i class="material-symbols-rounded">${link.jsFunc ? 'touch_double' : 'open_in_new'}</i>
            </div>
            <p class="linkDesc">
                ${link.desc || linkType}
            </p>
            <p>
                ${link.url && linkType === 'url' ? `<i class="material-symbols-rounded">link</i> ${link.url}` : ''}
            </p>
            <p>
                ${!link.desc ? '' : linkType}
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