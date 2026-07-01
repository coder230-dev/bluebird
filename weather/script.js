// 2026 Bluebird IPE
// Most of this code was created by the help of AI, and checked by me.


// weather api url: https://api.open-meteo.com/v1/forecast?latitude=38.58&longitude=-121.49&daily=weathercode,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,weather_code,sunshine_duration,precipitation_hours,wind_speed_10m_mean,wind_gusts_10m_mean,visibility_min,visibility_max&hourly=temperature_2m,relativehumidity_2m,dewpoint_2m,apparent_temperature,precipitation,precipitation_probability,weathercode,pressure_msl,cloudcover,visibility,windspeed_10m,winddirection_10m,uv_index&current=temperature_2m,apparent_temperature,relative_humidity_2m,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=auto&wind_speed_unit=mph&temperature_unit=fahrenheit&precipitation_unit=inch&current_weather=true

let currentLocation
let homeLocation
let ignoreBlur = false;

const warningImages = {
    "tornado": "https://www.publicdomainpictures.net/pictures/450000/velka/tornado-1651106114dvq.jpg",
    "severe thunderstorm": "https://www.publicdomainpictures.net/pictures/330000/velka/sturm-blitz-gewitter-himmel.jpg",
    "flash flood": "https://as1.ftcdn.net/jpg/02/29/82/12/1000_F_229821295_bJVzNtbYdLjqUrW5EWn5agplbb2JTiTu.jpg",
    "coastal flood": "https://www.publicdomainpictures.net/pictures/120000/velka/schiff-und-wellen.jpg",
    "flood": "https://www.publicdomainpictures.net/pictures/180000/velka/raging-river.jpg",
    "high wind": "https://as1.ftcdn.net/jpg/00/95/85/30/1000_F_95853099_X4LuI9ruAOMri3X4AWk5p4wg4UnejcW6.webp",
    "wind": "https://www.publicdomainpictures.net/pictures/10000/velka/87-12681332789SQ8.jpg",
    "winter storm": "https://www.publicdomainpictures.net/pictures/80000/velka/winter-storm.jpg",
    "blizzard": "https://www.publicdomainpictures.net/pictures/700000/velka/image-1749666035LMe.jpg",
    "freeze": "https://www.publicdomainpictures.net/pictures/10000/velka/1-1234698844auR4.jpg",
    "heat": "https://www.publicdomainpictures.net/pictures/90000/velka/water-in-the-desert.jpg",
    "red flag": "https://www.publicdomainpictures.net/pictures/300000/t2/big-fire-15578183263Xj.jpg",
    "hurricane": "https://www.publicdomainpictures.net/pictures/30000/velka/tropical-storm-is-coming.jpg",
    "tsunami": "https://www.publicdomainpictures.net/pictures/700000/velka/tsunami-wave-crashing-on-beach.png",
    "beach hazard": "https://www.publicdomainpictures.net/pictures/20000/velka/rip-currents.jpg",
    "weather statement": "https://as2.ftcdn.net/v2/jpg/18/50/16/35/1000_F_1850163532_DsBwCPZHOBFYnuzcFVCf2mxoHjm0Fdt1.jpg",
    "high surf": "https://www.publicdomainpictures.net/pictures/10000/velka/breaking-wave-10811278206941T7F7.jpg",
    "avalanche": "https://www.publicdomainpictures.net/pictures/390000/velka/after-avalanche-1612726530axj.jpg",

    // fallback
    "default": "images/warnings/default.png"

    // All of the images used rightfully goes to their owners.
};

const ALERT_ICONS = {
    color: {
        Extreme: "purple",
        Severe: "red",
        Moderate: "orange",
        Minor: "yellow",
        Unknown: "transparent",
    },

    severity: {
        Extreme: "⚠️",
        Severe: "🟥",
        Moderate: "🟧",
        Minor: "🟨",
        Unknown: "⚪"
    },

    event: {
        // Warnings
        "Tornado Warning": `<i class="wi wi-tornado"></i>`,
        "Severe Thunderstorm Warning": `<i class="wi wi-thunderstorm"></i>`,
        "Flash Flood Warning": `<i class="wi wi-flood"></i>`,
        "Flood Warning": `<i class="wi wi-flood"></i>`,
        "Hurricane Warning": `<i class="wi wi-hurricane"></i>`,
        "Tsunami Warning": `<i class="wi wi-tsunami"></i>`,
        "Winter Storm Warning": `<i class="wi wi-snow-wind"></i>`,
        "Ice Storm Warning": `<i class="wi wi-sleet"></i>`,
        "Blizzard Warning": `<i class="wi wi-snow-wind"></i>`,
        "Extreme Wind Warning": `<i class="wi wi-strong-wind"></i>`,
        "High Wind Warning": `<i class="wi wi-strong-wind"></i>`,
        "Dust Storm Warning": `<i class="wi wi-dust"></i>`,
        "Fire Weather Warning": `<i class="wi wi-fire"></i>`,
        "Red Flag Warning": `<i class="wi wi-fire"></i>`,
        "Coastal Flood Warning": `<i class="wi wi-flood"></i>`,
        "Lakeshore Flood Warning": `<i class="wi wi-flood"></i>`,
        "Avalanche Warning": `<i class="wi wi-snow"></i>`,
        "Freeze Warning": `<i class="wi wi-thermometer-exterior"></i>`,
        "Excessive Heat Warning": `<i class="wi wi-thermometer-exterior"></i>`,
        "Dense Fog Warning": `<i class="wi wi-fog"></i>`,

        // Watches
        "Tornado Watch": `<i class="wi wi-tornado"></i>`,
        "Severe Thunderstorm Watch": `<i class="wi wi-thunderstorm"></i>`,
        "Flash Flood Watch": `<i class="wi wi-flood"></i>`,
        "Flood Watch": `<i class="wi wi-flood"></i>`,
        "Hurricane Watch": `<i class="wi wi-hurricane"></i>`,
        "Tsunami Watch": `<i class="wi wi-tsunami"></i>`,
        "Winter Storm Watch": `<i class="wi wi-snow-wind"></i>`,
        "High Wind Watch": `<i class="wi wi-strong-wind"></i>`,
        "Fire Weather Watch": `<i class="wi wi-fire"></i>`,
        "Coastal Flood Watch": `<i class="wi wi-flood"></i>`,
        "Lakeshore Flood Watch": `<i class="wi wi-flood"></i>`,
        "Freeze Watch": `<i class="wi wi-thermometer-exterior"></i>`,
        "Excessive Heat Watch": `<i class="wi wi-thermometer-exterior"></i>`,
        "Avalanche Watch": `<i class="wi wi-snow"></i>`,

        // Advisories
        "Winter Weather Advisory": `<i class="wi wi-snow"></i>`,
        "Wind Advisory": `<i class="wi wi-strong-wind"></i>`,
        "Flood Advisory": `<i class="wi wi-flood"></i>`,
        "Coastal Flood Advisory": `<i class="wi wi-flood"></i>`,
        "Lakeshore Flood Advisory": `<i class="wi wi-flood"></i>`,
        "Heat Advisory": `<i class="wi wi-thermometer-exterior"></i>`,
        "Freeze Advisory": `<i class="wi wi-thermometer-exterior"></i>`,
        "Dense Fog Advisory": `<i class="wi wi-fog"></i>`,
        "Air Stagnation Advisory": `<i class="wi wi-barometer"></i>`,
        "Small Craft Advisory": `<i class="fa fa-ship"></i>`, // FontAwesome
        "Beach Hazards Statement": `<i class="wi wi-tsunami"></i>`,
        "Brisk Wind Advisory": `<i class="wi wi-strong-wind"></i>`,
        "Lake Wind Advisory": `<i class="wi wi-strong-wind"></i>`,

        // Informational
        "Special Weather Statement": `<i class="fa fa-exclamation-triangle"></i>`,
        "Hazardous Weather Outlook": `<i class="fa fa-exclamation-circle"></i>`,
        "Short Term Forecast": `<i class="fa fa-clock"></i>`,

        // Civil / Emergency (no WI equivalents)
        "Civil Emergency Message": `<i class="fa fa-bullhorn"></i>`,
        "Local Area Emergency": `<i class="fa fa-bullhorn"></i>`,
        "Law Enforcement Warning": `<i class="fa fa-shield"></i>`,
        "Shelter in Place Warning": `<i class="fa fa-home"></i>`,
        "911 Telephone Outage Emergency": `<i class="fa fa-phone-slash"></i>`,
        "Child Abduction Emergency": `<i class="fa fa-child"></i>`,
        "Evacuation Immediate": `<i class="fa fa-siren-on"></i>`,
        "Nuclear Power Plant Warning": `<i class="fa fa-radiation"></i>`,

        undefined: '<i class="material-symbols-rounded">alert</i>',
    }
}

const weatherIcons = {
    0: {
        day: `<i class="wi wi-day-sunny"></i>`,
        night: `<i class="wi wi-night-clear"></i>`,
        label: "Clear Sky",
        bg: "https://www.publicdomainpictures.net/pictures/10000/t2/1-1240318885PzsY.jpg"
    },

    1: {
        day: `<i class="wi wi-day-sunny-overcast"></i>`,
        night: `<i class="wi wi-night-alt-partly-cloudy"></i>`,
        label: "Mainly Clear",
        bg: "https://freerangestock.com/sample/136980/fluffy-cloud-in-mostly-blue-sky.jpg"
    },

    2: {
        day: `<i class="wi wi-day-cloudy"></i>`,
        night: `<i class="wi wi-night-alt-cloudy"></i>`,
        label: "Partly Cloudy",
        bg: "https://www.publicdomainpictures.net/pictures/180000/t2/sun-clouds-blue-sky-146410201994j.jpg"
    },

    3: {
        day: `<i class="wi wi-cloudy"></i>`,
        night: `<i class="wi wi-cloudy"></i>`,
        label: "Overcast",
        bg: "https://www.publicdomainpictures.net/pictures/180000/t2/stormy-sky-1467567523y6K.jpg"
    },

    45: {
        day: `<i class="wi wi-fog"></i>`,
        night: `<i class="wi wi-fog"></i>`,
        label: "Fog",
        bg: "https://www.publicdomainpictures.net/pictures/220000/t2/nebel-landschaft.jpg"
    },

    48: {
        day: `<i class="wi wi-fog"></i>`,
        night: `<i class="wi wi-fog"></i>`,
        label: "Depositing Rime Fog",
        bg: "https://www.publicdomainpictures.net/pictures/220000/t2/nebel-landschaft.jpg"
    },

    51: {
        day: `<i class="wi wi-sprinkle"></i>`,
        night: `<i class="wi wi-sprinkle"></i>`,
        label: "Light Drizzle",
        bg: "https://www.publicdomainpictures.net/pictures/160000/nahled/gouttes-deau-pluie-meteo.jpg"
    },

    53: {
        day: `<i class="wi wi-sprinkle"></i>`,
        night: `<i class="wi wi-sprinkle"></i>`,
        label: "Moderate Drizzle",
        bg: "https://www.publicdomainpictures.net/pictures/160000/nahled/gouttes-deau-pluie-meteo.jpg"
    },

    55: {
        day: `<i class="wi wi-sprinkle"></i>`,
        night: `<i class="wi wi-sprinkle"></i>`,
        label: "Dense Drizzle",
        bg: "https://www.publicdomainpictures.net/pictures/160000/nahled/gouttes-deau-pluie-meteo.jpg"
    },

    56: {
        day: `<i class="wi wi-rain-mix"></i>`,
        night: `<i class="wi wi-rain-mix"></i>`,
        label: "Freezing Drizzle",
        bg: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Freezing_rain_%28glaze%29_damage_at_Postojna_train_station.jpg/1920px-Freezing_rain_%28glaze%29_damage_at_Postojna_train_station.jpg?20140203204449"
    },

    57: {
        day: `<i class="wi wi-rain-mix"></i>`,
        night: `<i class="wi wi-rain-mix"></i>`,
        label: "Freezing Drizzle",
        bg: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Freezing_rain_%28glaze%29_damage_at_Postojna_train_station.jpg/1920px-Freezing_rain_%28glaze%29_damage_at_Postojna_train_station.jpg?20140203204449"
    },

    61: {
        day: `<i class="wi wi-showers"></i>`,
        night: `<i class="wi wi-night-alt-showers"></i>`,
        label: "Light Rain",
        bg: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSDCoLYyVpkNKBg-wvjC3qkKqD4RbHZfjkCuw&s"
    },

    63: {
        day: `<i class="wi wi-rain"></i>`,
        night: `<i class="wi wi-night-alt-rain"></i>`,
        label: "Moderate Rain",
        bg: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSDCoLYyVpkNKBg-wvjC3qkKqD4RbHZfjkCuw&s"
    },

    65: {
        day: `<i class="wi wi-rain-wind"></i>`,
        night: `<i class="wi wi-night-alt-rain-wind"></i>`,
        label: "Heavy Rain",
        bg: "https://upload.wikimedia.org/wikipedia/commons/b/b3/Heavy_Rain_%28168803113%29.jpeg"
    },

    66: {
        day: `<i class="wi wi-rain-mix"></i>`,
        night: `<i class="wi wi-night-alt-rain-mix"></i>`,
        label: "Freezing Rain",
        bg: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Freezing_rain_%28glaze%29_damage_at_Postojna_train_station.jpg/1920px-Freezing_rain_%28glaze%29_damage_at_Postojna_train_station.jpg?20140203204449"
    },

    67: {
        day: `<i class="wi wi-rain-mix"></i>`,
        night: `<i class="wi wi-night-alt-rain-mix"></i>`,
        label: "Freezing Rain",
        bg: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Freezing_rain_%28glaze%29_damage_at_Postojna_train_station.jpg/1920px-Freezing_rain_%28glaze%29_damage_at_Postojna_train_station.jpg?20140203204449"
    },

    71: {
        day: `<i class="wi wi-snow"></i>`,
        night: `<i class="wi wi-night-alt-snow"></i>`,
        label: "Light Snow",
        bg: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Snow_on_the_mountains_of_Southern_California.jpg"
    },

    73: {
        day: `<i class="wi wi-snow"></i>`,
        night: `<i class="wi wi-night-alt-snow"></i>`,
        label: "Moderate Snow",
        bg: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Snow_on_the_mountains_of_Southern_California.jpg"
    },

    75: {
        day: `<i class="wi wi-snow-wind"></i>`,
        night: `<i class="wi wi-night-alt-snow-wind"></i>`,
        label: "Heavy Snow",
        bg: "https://www.publicdomainpictures.net/pictures/390000/nahled/heavy-snow-1615823021TNC.jpg"
    },

    77: {
        day: `<i class="wi wi-snowflake-cold"></i>`,
        night: `<i class="wi wi-snowflake-cold"></i>`,
        label: "Snow Grains",
        bg: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Snow_on_the_mountains_of_Southern_California.jpg"
    },

    80: {
        day: `<i class="wi wi-showers"></i>`,
        night: `<i class="wi wi-night-alt-showers"></i>`,
        label: "Rain Showers",
        bg: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSDCoLYyVpkNKBg-wvjC3qkKqD4RbHZfjkCuw&s"
    },

    81: {
        day: `<i class="wi wi-showers"></i>`,
        night: `<i class="wi wi-night-alt-showers"></i>`,
        label: "Rain Showers",
        bg: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSDCoLYyVpkNKBg-wvjC3qkKqD4RbHZfjkCuw&s"
    },

    82: {
        day: `<i class="wi wi-rain-wind"></i>`,
        night: `<i class="wi wi-night-alt-rain-wind"></i>`,
        label: "Violent Rain Showers",
        bg: "https://upload.wikimedia.org/wikipedia/commons/b/b3/Heavy_Rain_%28168803113%29.jpeg"
    },

    85: {
        day: `<i class="wi wi-snow"></i>`,
        night: `<i class="wi wi-night-alt-snow"></i>`,
        label: "Snow Showers",
        bg: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Snow_on_the_mountains_of_Southern_California.jpg"
    },

    86: {
        day: `<i class="wi wi-snow-wind"></i>`,
        night: `<i class="wi wi-night-alt-snow-wind"></i>`,
        label: "Heavy Snow Showers",
        bg: "https://www.publicdomainpictures.net/pictures/390000/nahled/heavy-snow-1615823021TNC.jpg"
    },

    95: {
        day: `<i class="wi wi-thunderstorm"></i>`,
        night: `<i class="wi wi-night-alt-thunderstorm"></i>`,
        label: "Thunderstorm",
        bg: "https://upload.wikimedia.org/wikipedia/commons/b/b3/Heavy_Rain_%28168803113%29.jpeg"
    },

    96: {
        day: `<i class="wi wi-hail"></i>`,
        night: `<i class="wi wi-night-alt-hail"></i>`,
        label: "Thunderstorm w/ Hail",
        bg: "https://cdn12.picryl.com/photo/2016/12/31/hailstones-hail-weather-in-april-6ec61c-1024.jpg"
    },

    99: {
        day: `<i class="wi wi-hail"></i>`,
        night: `<i class="wi wi-night-alt-hail"></i>`,
        label: "Thunderstorm w/ Heavy Hail",
        bg: "https://cdn12.picryl.com/photo/2016/12/31/hailstones-hail-weather-in-april-6ec61c-1024.jpg"
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    if (window.location.pathname === '/weather/' || window.location.pathname === 'weather/' || window.location.pathname === 'weather/index.html') {
        const parLat = readParam('lat')
        const parLon = readParam('lon')
        if (parLat && parLon) {
            const locationInfo = await getInfoFromCoordinates(parLat, parLon);
            if (locationInfo) {
                await renderWeatherForCoords(parLon, parLat, locationInfo)
            }
        }

        loadWeatherNewsContent();

        document.getElementById('search-head').addEventListener('mouseover', () => {
            document.getElementById('search-locations').innerHTML = 'Click here to open the search dialog.'
        });

        document.getElementById('search-head').addEventListener('mouseleave', () => {
            document.getElementById('search-locations').innerHTML = 'Search for Locations, News, and Alerts'
        })
        loadMotto();
    }
});

window.addEventListener("scroll", () => {
    const nav = document.querySelector("nav");
    nav.classList.toggle("stuck", window.scrollY > 400);
});

function loadMotto() {
    let mottos = [
        'Weather, simplified',
        'Precision in every cloud',
        'Built for the sky ahead.',
        'Own the day, whatever the weather',
        'Stay ready for anything',
        'Weather that works for you',
        'Sky-ready, every moment',
        'Weather made effortless',
        'Your forecast, your flow',
        'Stay ahead of the sky',
        'Clarity for every day',
        'Feel the day before it begins'
    ]
    let randomNum = Math.floor(Math.random() * 12);
    document.getElementById('head-motto').innerHTML = mottos[randomNum];
}

async function loadWeatherNewsContent(forceRefresh = false) {
    const newsFeedCont = document.getElementById('weather-news-feed');
    const weatherNews = await loadWeatherNews(forceRefresh);

    for (const [topic, items] of Object.entries(weatherNews)) {

        // Skip empty feeds
        if (!items || items.length === 0) continue;

        // Create section container
        const section = document.createElement('div');
        section.classList.add('news-section');

        // Create section title (source)
        const title = document.createElement('h2');
        title.className = 'news-section-header';
        title.textContent = topic
            .replace(/-/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());

        // Build each news card
        items.forEach(item => {

            const card = document.createElement('a');
            card.href = item.link;
            card.classList.add('news-card');

            // Extract description HTML
            let desc = item.description || "";
            const temp = document.createElement('div');
            temp.innerHTML = desc;

            // Remove images from description
            const imgEl = temp.querySelector('img');
            let imgSrc = null;

            if (imgEl) {
                imgSrc = imgEl.src;
                imgEl.remove();
            }

            // Replace <pre> with <p>
            temp.querySelectorAll('pre').forEach(pre => {
                const p = document.createElement('p');
                p.textContent = pre.textContent;
                pre.replaceWith(p);
            });

            // Cleaned description
            const cleanedDesc = temp.innerHTML;

            // Title
            const h3 = document.createElement('h3');
            h3.textContent = item.title;
            card.appendChild(h3);

            // Description
            const p = document.createElement('p');
            p.innerHTML = cleanedDesc;
            card.appendChild(p);

            const btmSect = document.createElement('p');
            btmSect.classList.add('bottom-sect');
            btmSect.innerHTML = `
            <p class="published-date">${item.pubDate}</p>
            <a href="${item.link}">Read More</a>
            `
            card.appendChild(btmSect);

            // Add image to side (if exists)
            if (imgSrc) {
                const img = document.createElement('img');
                img.src = imgSrc;
                img.classList.add('news-card-image');
                card.appendChild(img);
            }

            section.appendChild(card);
        });

        // Append section only if it has cards
        if (section.children.length > 1) {
            newsFeedCont.appendChild(title);
            newsFeedCont.appendChild(section);
        }
    }
}

async function loadWeatherNews(forceRefresh = false) {
    const FEEDS = [
        { id: "weather-news", url: "https://moxie.foxweather.com/google-publisher/weather-news.xml" },
        { id: "extreme-weather", url: "https://moxie.foxweather.com/google-publisher/extreme-weather.xml" },
        { id: "noaa-alerts", url: "https://www.weather.gov/alerts/wwrss.xml" },
        { id: "storm-prediction-center", url: "https://www.spc.noaa.gov/products/spcrss.xml" },
        { id: "earthquake-news", url: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.atom" },
        { id: "volcano-updates", url: "https://volcanoes.usgs.gov/rss/vhpcurrent.xml" },
        { id: "wildfire-news", url: "https://inciweb.wildfire.gov/feeds/rss/incidents/" }
    ];

    const THREE_HOURS = 1000 * 60 * 60 * 3;
    const db = await openDB();

    const results = {}; // ← store by feed ID

    for (const feed of FEEDS) {
        const cached = await getNewsFromDB(db, feed.id);

        const needsRefresh =
            forceRefresh ||
            !cached ||
            (Date.now() - cached.lastUpdated) > THREE_HOURS;

        if (!needsRefresh) {
            results[feed.id] = cached.items;
            continue;
        }

        const freshItems = await fetchAndParseRSS(feed.url);

        await saveNewsToDB(db, feed.id, freshItems);

        results[feed.id] = freshItems;
    }

    return results; // ← return grouped object
}

function setParam(name, value) {
    const url = new URL(window.location.href);
    url.searchParams.set(name, value);
    history.pushState({}, '', `${url.pathname}?${url.searchParams.toString()}${url.hash} `);
}

function removeParam(name) {
    const url = new URL(window.location.href);
    url.searchParams.delete(name);
    history.pushState({}, '', `${url.pathname}?${url.searchParams.toString()}${url.hash} `);
}

function readParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

navigator.geolocation.getCurrentPosition(async function (position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    currentLocation = {
        x: lon,
        y: lat
    }

    const info = await getInfoFromCoordinates(lat, lon);

    if (info.countryCode !== 'US') {
        document.getElementById('state-weather-alerts-h').remove();
        return;
    }

    if (!window.location.pathname.includes('location')) {
        loadAlertsForState(info.stateCode, info.state);
    }
    // loadAlertsForCoordinates(lat, lon);

}, async function () {
    const homeLocationX = -121.4944;
    const homeLocationY = 38.5781;

    homeLocation = {
        x: homeLocationX,
        y: homeLocationY
    }

    const info = await getInfoFromCoordinates(homeLocationY, homeLocationX);

    if (window.location.pathname === 'weather/' || window.location.pathname === '/weather/' || window.location.pathname === 'weather/index.html') {
        loadAlertsForState(info.stateCode, info.state);
    }
});

// ===============================
// REVERSE GEOCODING
// ===============================

// ===============================
// FETCH + SAVE STATE ALERTS
// ===============================

async function loadAlertsForState(stateCode, stateName) {
    if (!stateCode) return;


    const TTL = 45 * 60 * 1000; // 45 minutes
    let alerts;

    const cached = await getStateAlerts(stateCode);

    const isFresh =
        cached &&
        cached.lastUpdated &&
        (Date.now() - cached.lastUpdated) < TTL &&
        cached.alerts &&
        cached.alerts.length > 0;

    if (isFresh) {
        // Use cached alerts
        alerts = cached.alerts;
    } else {
        console.warn('API being run')
        // Fetch new alerts
        const url = `https://api.weather.gov/alerts/active/area/${stateCode}`;
        const res = await fetch(url);

        if (!res.ok) return;

        const data = await res.json();
        alerts = data.features || [];

        // Save new alerts with updated timestamp
        await saveStateAlerts(stateCode, alerts);
    }

    // Render alerts
    renderAlertPreviews(alerts, stateCode);
}

async function loadAlertsForCoordinates(latitude, longitude) {
    if (!latitude || !longitude) return;

    const TTL = 60 * 60 * 1000;
    let alerts;

    const cached = await getCoordinateAlerts(latitude, longitude);

    const isFresh =
        cached &&
        cached.lastUpdated &&
        (Date.now() - cached.lastUpdated) < TTL &&
        cached.alerts &&
        cached.alerts.length > 0;

    if (isFresh) {
        alerts = cached.alerts;
    } else {
        console.warn('API being run')
        const url = `https://api.weather.gov/alerts/active?point=${latitude},${longitude}`;
        const res = await fetch(url);

        if (!res.ok) return;

        const data = await res.json();
        alerts = data.features || [];

        // Save new alerts with updated timestamp
        await saveCoordinateAlerts(latitude, longitude, alerts);
    }

    return alerts
}

// ===============================
// IndexedDB Setup
// ===============================

const DB_NAME = "InspireWeatherDB";
const DB_VERSION = 4;

async function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains("locations")) {
                db.createObjectStore("locations", { keyPath: "id" });
            }

            if (!db.objectStoreNames.contains("locMetaData")) {
                db.createObjectStore("locMetaData", { keyPath: "coordKey" });
            }

            if (!db.objectStoreNames.contains("locationData")) {
                const store = db.createObjectStore("locationData", { keyPath: "locationKey" });
                store.createIndex("lastUpdatedWeather", "lastUpdatedWeather");
                store.createIndex("lastUpdatedAlerts", "lastUpdatedAlerts");
            }

            if (!db.objectStoreNames.contains('newsData')) {
                db.createObjectStore('newsData', { keyPath: 'id' })
                    .createIndex('category', 'category', { unique: false });
            }

            if (!db.objectStoreNames.contains("settings")) {
                db.createObjectStore("settings", { keyPath: "id" });
            }

            if (!db.objectStoreNames.contains("cleanupMeta")) {
                db.createObjectStore("cleanupMeta", { keyPath: "id" });
            }

            if (!db.objectStoreNames.contains("stateAlerts")) {
                db.createObjectStore("stateAlerts", { keyPath: "stateCode" });
            }

            if (!db.objectStoreNames.contains("coordinateAlerts")) {
                db.createObjectStore("coordinateAlerts", { keyPath: "coordKey" });
            }
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}


async function read(storeName, key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.get(key);

        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
    });
}

async function write(storeName, value) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const req = store.put(value);

        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
    });
}

// ===============================
// STATE ALERTS STORE
// ===============================

async function saveSetting(key, value) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction("settings", "readwrite");
        const store = tx.objectStore("settings");

        const req = store.put({ id: key, value });

        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
    });
}

async function loadSetting(key, fallback = null) {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const tx = db.transaction("settings", "readonly");
            const store = tx.objectStore("settings");
            const req = store.get(key);

            req.onsuccess = () => {
                if (req.result && "value" in req.result) {
                    resolve(req.result.value);
                } else {
                    resolve(fallback);
                }
            };

            req.onerror = () => resolve(fallback);
        });
    } catch {
        return fallback;
    }
}

async function loadAllSettings(defaults = {}) {
    try {
        const db = await openDB();
        const tx = db.transaction("settings", "readonly");
        const store = tx.objectStore("settings");

        const settings = { ...defaults };
        let cursor = await store.openCursor();

        while (cursor) {
            const key = cursor.key;
            const value = cursor.value?.value;
            settings[key] = value;
            cursor = await cursor.continue();
        }

        return settings;
    } catch {
        return { ...defaults };
    }
}

async function saveStateAlerts(stateCode, alerts) {
    return write("stateAlerts", {
        stateCode,
        alerts,
        lastUpdated: Date.now()
    });
}

async function getStateAlerts(stateCode) {
    return read("stateAlerts", stateCode);
}

async function saveWeatherInfo(x, y, data) {
    const locationKey = `${x},${y}`;

    return write("locationData", {
        locationKey,
        x,
        y,
        ...data,
        lastUpdatedWeather: Date.now()
    });
}

async function getWeatherInfo(x, y) {
    const locationKey = `${x},${y}`;
    return read("locationData", locationKey);
}

// ===============================
// COORDINATE ALERTS STORE
// ===============================

async function saveLocMetaData(lat, lon, metaData) {
    const coordKey = `${lat},${lon}`;

    return write("locMetaData", {
        coordKey,
        lat,
        lon,
        metaData,
        lastUpdated: Date.now()
    });
}

async function getLocMetaData(lat, lon) {
    const coordKey = `${lat},${lon}`;
    return read("locMetaData", coordKey);
}


async function saveCoordinateAlerts(lat, lon, alerts) {
    const coordKey = `${lat},${lon}`;

    return write("coordinateAlerts", {
        coordKey,
        lat,
        lon,
        alerts,
        lastUpdated: Date.now()
    });
}

async function getCoordinateAlerts(lat, lon) {
    const coordKey = `${lat},${lon}`;
    return read("coordinateAlerts", coordKey);
}

async function saveLocation(name, lat, lon) {
    if (await getLocation(lat, lon)) {
        console.log('Returning')
        console.log(getLocation(lat, lon))
        return await getLocation(lat, lon)
    }
    const id = `${lat},${lon}`;

    return write("locations", {
        id,
        name,
        lat,
        lon,
        savedAt: Date.now()
    });
}

async function getLocation(lat, lon) {
    const id = `${lat},${lon}`;
    return read("locations", id);
}

async function getSavedLocations() {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction("locations", "readonly");
        const store = tx.objectStore("locations");
        const req = store.getAll();

        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
}

async function fetchAndParseRSS(url) {
    const res = await fetch(url);
    if (!res.ok) return [];

    const xmlText = await res.text();
    const xml = new DOMParser().parseFromString(xmlText, "application/xml");

    console.log(xmlText);

    const items = [...xml.querySelectorAll("item")].map(item => ({
        title: item.querySelector("title")?.textContent ?? "",
        link: item.querySelector("link")?.textContent ?? "",
        description: item.querySelector("description")?.textContent ?? "",
        contentEncoded: item.getElementsByTagName("content:encoded")[0]?.innerHTML ?? "",
        pubDate: item.querySelector("pubDate")?.textContent ?? ""
    }));

    return items;
}

function saveNewsToDB(db, id, items) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("newsData", "readwrite");
        const store = tx.objectStore("newsData");

        store.put({
            id,
            category: id,
            lastUpdated: Date.now(),
            items
        });

        tx.oncomplete = resolve;
        tx.onerror = reject;
    });
}

function getNewsFromDB(db, id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("newsData", "readonly");
        const store = tx.objectStore("newsData");

        const request = store.get(id);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = reject;
    });
}

document.querySelectorAll('.search-cont button').forEach(btn => {
    const parent = btn.parentElement;

    btn.addEventListener('click', () => {
        const input = parent.querySelector('input');
        input.value = '';
        input.focus();
        input.dispatchEvent(new Event("input", { bubbles: true }));
    });
});

document.querySelectorAll('.search-cont input').forEach(input => {
    let popup;
    let lastKeyword = "";

    function createPopup() {
        if (!popup) {
            popup = document.createElement("div");
            popup.classList.add("popup", "search-add-loc-results", "search-pop");
            document.body.appendChild(popup);

            popup.addEventListener("mousedown", () => {
                ignoreBlur = true;
            });
        }
        return popup;
    }

    function positionPopup() {
        if (!popup) return;
        const parent = input.parentElement;
        const rect = parent.getBoundingClientRect();

        popup.style.left = rect.left + window.scrollX + "px";
        popup.style.top = rect.bottom + window.scrollY + "px";
        popup.style.width = rect.width - 24 + "px";
    }

    function clearPopup() {
        if (popup) popup.innerHTML = "";
    }

    function showBottomStrip() {
        popup.insertAdjacentHTML("beforeend", `
            <div class="bottom-strip">
                <span class="cont">
                    <button class="use-map">Use Map</button>
                    <button class="show-suggestions">Show Suggestions</button>
                </span>
                <p>Press <span class="keyboard-btn">Enter</span> to search.</p>
            </div>
        `);
    }

    input.addEventListener("input", () => {
        ignoreBlur = false;
        const value = input.value.trim();

        popup = createPopup();
        positionPopup();
        clearPopup();

        if (!value) {
            renderLocationOptions(popup);
            return;
        }

        showBottomStrip();
    });

    input.addEventListener("focus", () => {
        popup = createPopup();
        positionPopup();
        clearPopup();

        const value = input.value.trim();

        if (!value) {
            renderLocationOptions(popup);
        } else {
            input.dispatchEvent(new Event("input", { bubbles: true }));
        }
    });

    input.addEventListener("blur", () => {
        if (ignoreBlur) return;

        setTimeout(() => {
            popup?.remove();
            popup = null;
        }, 150);
    });

    input.addEventListener("keypress", async e => {
        if (e.key === "Enter") {
            const keyword = input.value.trim();
            if (!keyword) return;

            if (keyword === lastKeyword) return;
            lastKeyword = keyword;

            ignoreBlur = true;

            popup = createPopup();
            positionPopup();
            clearPopup();

            const results = await searchForCountries(keyword);
            renderSearchResults(results, popup);

            ignoreBlur = false;
        }
    });
});

async function renderLocationOptions(popup) {
    popup.innerHTML = ""; // clear old content
    const saved = await getSavedLocations();
    // const recent = await getRecentSearches();

    if (currentLocation) {
        popup.appendChild(makeOption("📍 Current Location", currentLocation, "current"));
    }

    if (homeLocation) {
        const homeInfo = await getInfoFromCoordinates(homeLocation.y, homeLocation.x);
        popup.appendChild(makeOption(`<i class="material-symbols-rounded">home</i> ${homeInfo.city}, ${homeInfo.principalSubdivision}, ${homeInfo.countryName}`, homeInfo.longitude, homeInfo.latitude, "home"));
    }

    if (saved.length > 0) {
        const header = document.createElement("div");
        header.className = "popup-header";
        header.textContent = "Recently Searched";
        popup.appendChild(header);

        saved.forEach(loc => {
            popup.appendChild(makeOption(`<i class="material-symbols-rounded">location_on</i> ${loc.name}`, loc.lon, loc.lat));
        });
    }
}

function findBtn(prefix, id) {
    const btn = document.getElementById(`${prefix}${id}`)
    if (btn) {
        return btn
    } else {
        return undefined
    }
}

function makeOption(label, lat, lon) {
    const div = document.createElement("button");
    div.className = "popup-item";
    div.innerHTML = label;

    div.addEventListener("click", async () => {
        setTimeout(() => {
            popup?.remove();
            popup = null;
        }, 150);
        ignoreBlur = false

        renderWeatherForCoords(lat, lon);
    });

    return div;
}

function getActiveCountryCode() {
    // 1. User settings
    if (window.settings?.countryCode) {
        return window.settings.countryCode.toUpperCase();
    }

    // 2. Home location
    if (window.homeLocation?.country_code) {
        return homeLocation.country_code.toUpperCase();
    }

    // 3. Current location
    if (window.currentLocation?.country_code) {
        return currentLocation.country_code.toUpperCase();
    }

    // 4. Fallback
    return "US";
}

async function searchForCountries(keyword, countryCode = getActiveCountryCode()) {
    if (!keyword || keyword.trim().length === 0) return [];

    let url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(keyword)}&count=5&language=en&format=json`;

    if (countryCode) {
        url += `&country_code=${countryCode}`;
    }

    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    return data.results || [];
}

async function renderSearchResults(results) {
    const container = document.getElementById('search-results');

    results.forEach(r => {
        const item = document.createElement('button');
        item.className = 'search-item';
        item.innerHTML = `<i>${countryCodeToFlagEmoji(r.country_code)}</i> ${r.name}, ${r.admin1 || r.admin2}, ${r.country}`;
        item.addEventListener('click', async () => {
            setTimeout(() => {
                popup?.remove();
                popup = null;
            }, 150);
            await renderWeatherForCoords(r.longitude, r.latitude, r);
            await saveLocation(`${r.name}, ${r.admin1 || r.admin2}, ${r.country}`, r.latitude, r.longitude)
        })
        container.appendChild(item);
    });
}

function countryCodeToFlagEmoji(code) {
    if (!code) return "";
    return code
        .toUpperCase()
        .replace(/./g, char =>
            String.fromCodePoint(127397 + char.charCodeAt())
        );
}

function getIconForCurrentWeather(data) {
    const code = data.current.weathercode;
    const isDay = data.current.is_day === 1;

    const iconSet = getWeatherIcon(code);
    return isDay ? iconSet.day : iconSet.night;
}

function isNight(weather, time = null) {
    const now = time ? new Date(time).getTime() : Date.now();

    const sunrise = new Date(weather.daily.sunrise[0]).getTime();
    const sunset = new Date(weather.daily.sunset[0]).getTime();

    const apiFlag = weather.current.is_day === 0;

    if (time === null && apiFlag) return true;

    return now < sunrise || now > sunset;
}


function getWeatherIcon(code) {
    return weatherIcons[code] || {
        icon: "help",
        label: "Unknown",
        bg: "default.jpg"
    };
}

function getAlertIcon(props) {
    const event = props.event;
    const severity = props.severity;

    const icons = [];

    if (ALERT_ICONS.severity[severity]) {
        icons.push(ALERT_ICONS.severity[severity]);
    }

    for (const key in ALERT_ICONS.event) {
        if (event.includes(key)) {
            icons.push(ALERT_ICONS.event[key]);
        }
    }


    if (icons.length === 0) {
        icons.push("⚠️");
    }

    return icons;
}

function getWarningImage(warningName) {
    const name = warningName.toLowerCase();

    for (const key in warningImages) {
        if (name.includes(key)) {
            return warningImages[key];
        }
    }

    return warningImages.default;
}

async function showNewLocationPreview(data) {
    const lat = data.y ?? data.lat ?? data.latitude;
    const lon = data.x ?? data.lon ?? data.longitude;

    const weatherInfo = await loadWeatherForCoordinates(lat, lon);
    const locationInfo = await getInfoFromCoordinates(lat, lon);

    const popup = showFloatingPopup(
        'right',
        'new-location-preview',
        document.body,
        `${locationInfo.city}, ${locationInfo.state}, ${locationInfo.country}`
    );

    const current = weatherInfo.current;
    const currentUnits = weatherInfo.raw.current_weather_units;

    const daily = weatherInfo.daily;

    console.log(daily)

    const currentWeatherIcon = getWeatherIcon(weatherInfo.current.weathercode);
    const night = isNight(weatherInfo, new Date());


    const daylow = daily.temperature_2m_min[0];
    const dayhigh = daily.temperature_2m_max[0];
    const currentTemp = current.temperature;

    // Normalize current temp between low and high
    let progress = (currentTemp - daylow) / (dayhigh - daylow);

    // Clamp to 0–1
    progress = Math.max(0, Math.min(1, progress));

    // Convert to %
    const width = progress * 100;

    async function addAndViewLocation() {
        try {
            await saveLocation(`${locationInfo.city}, ${locationInfo.state}, ${locationInfo.country}`, lat, lon);
            displayNotification('Location Saved!');
        } catch (e) {
            displayNotification('Error while saving location. Try again.');
            console.error(e)
        }


    }

    const btn = document.createElement("button");

    Object.assign(btn, {
        className: "liquid-glass add-loca",
        onclick: () => addAndViewLocation(),
        textContent: "Add",
        id: "add-and-view-location"
    });

    Object.assign(btn.style, {
        padding: "12px",
        borderRadius: "20px",
        fontFamily: "Poppins"
    });

    popup.querySelector("nav").appendChild(btn);

    popup.insertAdjacentHTML('beforeend', `
        <div class="main-content">
            <div class="flex-pop" style="justify-content: left; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between;">
                    <p>Add this Location to View More!</p>
                    <button onclick="document.getElementById('add-and-view-location').click();">Add & View</button>
                </div>
            </div>
            <div class="headline">
                <img src="${currentWeatherIcon.bg}">
                <div class="content">
                    <h1>${night ? currentWeatherIcon.night : currentWeatherIcon.day} ${current.temperature.toFixed(0)}${currentUnits.temperature} </h1>
                </div>
            </div>
            <div class="temp-bar">
                <p>Low: ${daily.temperature_2m_min[0].toFixed(0)}${currentUnits.temperature}</p>
                <div class="bar-cont">
                    <div style="width: ${width}%" class="bar-progress"></div>
                </div>
                <p>High: ${daily.temperature_2m_max[0].toFixed(0)}${currentUnits.temperature}</p>
            </div>
            ${renderNext24Hours(weatherInfo)}

            ${renderNext7Days(weatherInfo)}

            <div class="flex-pop">
                
            </div>
        </div>
    `);
}

function renderNext24Hours(weatherInfo) {
    const hourly = weatherInfo.hourly;
    const units = weatherInfo.raw.current_weather_units;

    const now = new Date();

    // Build sunrise/sunset lookup
    const sunTable = {};
    weatherInfo.daily.time.forEach((day, i) => {
        sunTable[day] = {
            sunrise: new Date(weatherInfo.daily.sunrise[i]),
            sunset: new Date(weatherInfo.daily.sunset[i])
        };
    });

    function isNightForHour(date) {
        const key = date.toISOString().slice(0, 10);
        const sun = sunTable[key];
        if (!sun) return false;
        return date < sun.sunrise || date >= sun.sunset;
    }

    // Build full hourly rows
    function buildHourlyRow(hourly, index) {
        const row = {};
        for (const key in hourly) {
            row[key] = hourly[key][index];
        }
        return row;
    }

    const next24 = [];

    for (let i = 0; i < hourly.time.length; i++) {
        const t = hourly.time[i];
        const date = new Date(t);

        if (date >= now && t.slice(14, 16) === "00") {
            const row = buildHourlyRow(hourly, i);
            row.time = date; // convert time to Date object
            next24.push(row);
        }

        if (next24.length === 24) break;
    }

    const html = next24.map(h => {
        const iconSet = getWeatherIcon(h.weathercode);
        const night = isNightForHour(h.time);
        const icon = night ? iconSet.night : iconSet.day;

        return `
            <div class="hour-card">
                <p class="hour-time">${h.time.toLocaleTimeString([], { hour: "numeric" })}</p>
                <div class="hour-icon">${icon}</div>

                <p class="hour-temp">
                    ${h.temperature_2m.toFixed(0)}${units.temperature}
                </p>

                <p class="rain-chance">
                    <i class="wi wi-raindrop"></i>
                    ${h.precipitation_probability ?? 0}%
                </p>
            </div>
        `;
    }).join("");

    return `
        <section class="hourly-scroll-section">
            <h2>Next 24 Hours</h2>
            <div class="hourly-scroll">${html}</div>
        </section>
    `;
}

function renderNext7Days(weatherInfo) {
    const daily = weatherInfo.daily;
    const units = weatherInfo.raw.current_weather_units;

    // Convert column-based daily arrays into row objects
    function buildDailyRow(daily, index) {
        const row = {};
        for (const key in daily) {
            row[key] = daily[key][index];
        }
        return row;
    }

    // Temperature → color mapping
    function tempToColor(temp) {
        if (temp <= 32) return "#4DA0FF";      // cold blue
        if (temp <= 55) return "#5ED1FF";      // cool blue-green
        if (temp <= 75) return "#7ED957";      // mild green
        if (temp <= 90) return "#FFB347";      // warm orange
        return "#FF5E5E";                      // hot red
    }

    // Build gradient from low → high
    function buildTempGradient(low, high) {
        const lowColor = tempToColor(low);
        const highColor = tempToColor(high);
        return `linear-gradient(to right, ${lowColor}, ${highColor})`;
    }

    // Build next 7 days
    const next7 = [];
    for (let i = 0; i < daily.time.length && next7.length < 7; i++) {
        const row = buildDailyRow(daily, i);
        row.date = new Date(row.time);
        next7.push(row);
    }

    // Build HTML
    const html = next7.map(d => {
        const iconSet = getWeatherIcon(d.weathercode);
        const icon = iconSet.day; // daily always uses day icon

        const low = d.temperature_2m_min;
        const high = d.temperature_2m_max;
        const gradient = buildTempGradient(low, high);

        return `
            <div class="day-card">
                <div class="day-left">
                    <div class="day-icon">${icon}</div>
                    <h3 class="day-name">
                        ${d.date.toLocaleDateString([], { weekday: "short" })}
                    </h3>
                </div>

                <div class="day-center" style="width: 80%;">
                    <p class="day-temps">
                        <span class="low">${low.toFixed(0)}${units.temperature}</span>
                    </p>
                    <div class="day-temp-bar" style="width: 80%;">
                        <div class="day-temp-fill" style="width: 100%; background: ${gradient};"></div>
                    </div>
                    <p class="day-temps">
                        <span class="high">${high.toFixed(0)}${units.temperature}</span>
                    </p>

                    <p class="day-extra">💧 ${d.precipitation_probability_max ?? 0}%</p>
                </div>

                <div class="day-right">
                    <p class="day-wind">
                        <i class="wi wi-strong-wind"></i>
                        ${d.windspeed_10m_max ?? 0}${units.windspeed || ""}
                    </p>
                </div>
            </div>
        `;
    }).join("");

    return `
        <section class="daily-list">
            <h2>Next 7 Days / Previous Day</h2>
            ${html}
        </section>
    `;
}

async function loadWeatherForCoordinates(lat, lon) {
    const saved = await getWeatherInfo(lon, lat);

    if (saved && Date.now() - saved.fetchedAt < 15 * 60 * 1000) {
        return saved;
    }

    console.warn("Using API (cache expired or missing)");

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,weather_code,sunshine_duration,precipitation_hours,wind_speed_10m_mean,wind_gusts_10m_mean,visibility_min,visibility_max&hourly=temperature_2m,relativehumidity_2m,dewpoint_2m,apparent_temperature,precipitation,precipitation_probability,weathercode,pressure_msl,cloudcover,visibility,windspeed_10m,winddirection_10m,uv_index&current=temperature_2m,apparent_temperature,relative_humidity_2m,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=auto&wind_speed_unit=mph&temperature_unit=fahrenheit&precipitation_unit=inch&current_weather=true`.replace(/\s+/g, "");

    const res = await fetch(url);
    if (!res.ok) return saved || null;

    const data = await res.json();

    const weather = {
        lat,
        lon,
        fetchedAt: Date.now(),
        current: data.current_weather || data.current || null,
        hourly: data.hourly || null,
        daily: data.daily || null,
        raw: data
    };

    await saveWeatherInfo(lon, lat, weather);

    return weather;
}

async function getInfoFromCoordinates(lat, lon) {
    if (typeof lat !== "number" || typeof lon !== "number") {
        throw new Error("Latitude and longitude must be numbers");
    }

    // Normalize coordinates to avoid floating precision cache misses
    const normalizedLat = Number(lat).toFixed(6);
    const normalizedLon = Number(lon).toFixed(6);
    const key = `${normalizedLat},${normalizedLon}`;

    let all = {};

    try {
        all = JSON.parse(localStorage.getItem("coordinateInfo") || "{}");
    } catch (e) {
        console.warn("Failed to read cache:", e);
        all = {};
    }

    // Return cached version if exists
    if (all[key]) {
        return all[key];
    }

    console.warn("Using Reverse Geocode API");

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${normalizedLat}&longitude=${normalizedLon}&localityLanguage=en`;

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!res.ok) {
            console.error("API error:", res.status);
            return null;
        }

        const data = await res.json();

        const result = {
            ...data,
            city: data.city || data.locality || null,
            state: data.principalSubdivision || null,
            stateCode: data.principalSubdivisionCode
                ? data.principalSubdivisionCode.split("-")[1] || null
                : null,
            country: data.countryName || null,
            countryCode: data.countryCode || null
        };

        // Save safely
        try {
            all[key] = result;
            localStorage.setItem("coordinateInfo", JSON.stringify(all));
        } catch (e) {
            console.warn("Failed to write cache:", e);
        }

        return result;

    } catch (err) {
        if (err.name === "AbortError") {
            console.error("Request timed out");
        } else {
            console.error("Fetch failed:", err);
        }
        return null;
    }
}

function renderAlertPreviews(alerts, stateCode) {
    const container = document.getElementById("state-weather-alerts");
    container.innerHTML = '';

    document.getElementById('weather-alert-header').innerHTML += `<span class="tag">${alerts.length}</span></h2>`

    const now = Date.now();

    alerts.sort((a, b) => {
        const A = a.properties;
        const B = b.properties;

        const aStart = new Date(A.onset).getTime();
        const aEnd = new Date(A.expires).getTime();
        const bStart = new Date(B.onset).getTime();
        const bEnd = new Date(B.expires).getTime();

        const aActive = now >= aStart && now < aEnd;
        const bActive = now >= bStart && now < bEnd;

        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;

        if (!aActive && !bActive) {
            return aStart - bStart;
        }

        return 0;
    });

    alerts.forEach(alert => {
        const props = alert.properties;

        const start = new Date(props.onset).getTime();
        const end = new Date(props.expires).getTime();
        const isActive = now >= start && now < end;

        const preview = document.createElement("div");
        preview.className = "alert-preview";

        preview.addEventListener('click', function () {
            openAlertPopup(props, preview);
            console.log('code being run')
        })

        preview.innerHTML = `
            <div class="alert-live-dot ${isActive ? "" : "inactive"}"></div>
    
            <div class="alert-main">
                <div class="alert-title-row">
                    <span class="alert-icon" style="color:${getAlertIcon(props)[0]};">
                        ${getAlertIcon(props)[1]}
                    </span>
                    <h3>${props.event}</h3>
                    <span class="alert-severity-tag severity-${props.severity.toLowerCase()}">
                        ${props.severity}
                    </span>
                </div>
    
                <div class="alert-location">
                    <i class="material-symbols-rounded">location_on</i>
                    <span>${props.areaDesc}</span>
                </div>
    
                <div class="alert-meta">
                    ${isActive
                ? `Active until: ${new Date(props.expires).toLocaleString()}`
                : `Starts: ${new Date(props.effective).toLocaleString()}`
            }
                </div>
            </div>
        `;
        container.appendChild(preview);
    });

    const savedId = readParam("alertId");
    if (savedId) {
        const found = alerts.find(a => a.properties.id === savedId);
        if (found) {
            const props = found.properties;

            openAlertPopup(props, document.body);
        }
    }
};

function openAlertPopup(props, preview) {
    if (document.querySelector('float-pop')) {
        closePopCode();
    }
    const pop = showFloatingPopup(
        "right",
        "weather-alert",
        preview,
        props.event,
        "",
        { props }
    );

    setParam("alertId", props.id);

    pop.innerHTML += `
        <main>
            <div class="alert-head" style="background: url('${getWarningImage(props.event)}');">
                <h2>${props.headline}</h2>
            </div>

            <div class="flex-pop">
                <div title="Certainty"><i class="material-symbols-rounded">visibility</i> ${props.certainty}</div>
                <div title="Status"><i class="material-symbols-rounded">question_exchange</i> ${props.status}</div>
                <div title="Response"><i class="material-symbols-rounded">reply_all</i> ${props.response}</div>
            </div>

            <div class="flex-pop">
                <div>
                    <h4><i class="material-symbols-rounded">play_arrow</i> Effective</h4>
                    ${new Date(props.effective).toLocaleString()}
                </div>
                <div>
                    <h4><i class="material-symbols-rounded">disabled_visible</i> Expires</h4>
                    ${new Date(props.expires).toLocaleString()}
                </div>
            </div>

            <div class="flex-pop">
                <div>
                    <h4><i class="material-symbols-rounded">location_on</i> Issued for:</h4>
                    ${props.areaDesc}
                </div>
                <div class="severity-${props.severity.toLowerCase()}">
                    <h4><i class="material-symbols-rounded">person_alert</i> Severity & Urgency</h4>
                    ${props.severity}, ${props.urgency}
                </div>
            </div>

            <div class="flex-pop">
                <div>
                    <h4><i class="material-symbols-rounded">list</i> Description</h4>
                    ${props.description}
                </div>
            </div>

            <div class="flex-pop">
                <div>
                    <h4><i class="material-symbols-rounded">list</i> Instructions</h4>
                    ${props.instruction}
                </div>
            </div>

            <div class="flex-pop">
                <div>
                    <h4><i class="material-symbols-rounded">article_person</i> Sent By</h4>
                    ${props.senderName}
                </div>
                <div>
                    <h4><i class="material-symbols-rounded">send_and_archive</i> Sent</h4>
                    ${new Date(props.sent).toLocaleString()}
                </div>
            </div>

            <section style="margin-top: 15px;">
                Data brought to you by ${props.senderName}. 
                <a href="${props.web}">${props.web}</a>
            </section>
        </main>
    `;
}

function closePopCode() {
    removeParam('alertId')
    document.querySelector('float-pop').classList.remove('open')
    setTimeout(function () {
        document.querySelector('float-pop').remove()
    }, 400)
}
if (document.querySelector('float-pop')) {
    closePopCode()
}

function showFloatingPopup(popType, id, elementClicked, title, content, passThru = {}) {
    const newPop = document.createElement('float-pop');
    newPop.classList.add('popup');
    newPop.id = id || '';
    newPop.innerHTML = `
    <nav>
        <button class="material-symbols-rounded liquid-glass">close</button>
    <h3>
        <span class="liquid-glass">${title}</span>
    </h3>
    </nav>
    ${content || ''}
    `

    let top = passThru.x || '';
    let left = passThru.y || '';
    if (elementClicked) {
        const rect = elementClicked.getBoundingClientRect();
        top = rect.bottom + window.scrollY;
        left = rect.left + window.scrollX;
    }

    document.body.appendChild(newPop);


    requestAnimationFrame(() => {
        newPop.classList.add('open');
        setTimeout(function () {
            newPop.querySelector('nav button').onclick = () => {
                closePopCode()
            }
        }, 500)
    });
    if (popType == 'right') {
        newPop.classList.add('right-pop');
        return newPop
    }

    requestAnimationFrame(() => {
        const menuRect = newPop.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (left + menuRect.width > viewportWidth) {
            left = Math.max(0, viewportWidth - menuRect.width - 80);
        }
        if (top + menuRect.height > viewportHeight) {
            top = Math.max(0, viewportHeight - menuRect.height - 100);
        }

        newPop.style.top = `${top}px`;
        newPop.style.left = `${left}px`;
    });

    return newPop
}

// Search Functionality

// =========================================================
// Advanced Search System - Full Implementation
// - Features: instant local results, delayed remote search,
//   country bias, coordinate support, fuzzy matching,
//   prefix boosting, dedupe, recent searches, nearby ranking,
//   highlight matches, preview callback (commented).
// =========================================================

let activePopupInput = '';

function attachSearchListeners(navInput) {
    activePopupInput = false

    navInput.oninput = () => {
        handleSearch(navInput.value.trim(), false);
        showNavDropdown();
    };

    navInput.onfocus = () => {
        showNavDropdown();
        handleSearch(navInput.value.trim(), false);
    };

    navInput.onblur = () => {
        // Delay closing so clicks inside dropdown still register
        setTimeout(() => hideNavDropdown(), 850);
    };
    return;
}

function showNavDropdown() {
    const el = document.getElementById("nav-search-results");
    if (el) el.style.display = "block";
}

function hideNavDropdown() {
    const el = document.getElementById("nav-search-results");
    if (el) el.style.display = "none";
}

// -----------------------------
// CONFIG
// -----------------------------
const REMOTE_DELAY_MS = 1500;
const MAX_REMOTE_RESULTS = 8;
const RECENT_SEARCHES_KEY = "recent_searches_v1";
const FUZZY_THRESHOLD = 0.35; // normalized edit distance threshold (lower = stricter)
const PREFIX_BOOST = 0.25; // score boost for prefix matches
const POPULATION_BOOST = 0.1; // small boost for larger population if available

// -----------------------------
// GLOBAL STATE
// -----------------------------
let lastSearchQuery = "";
let newLocationTimeout = null;

// -----------------------------
// ENTRY: openSearch()
// -----------------------------
function openSearch() {

    const backdrop = document.createElement("div");
    const searchPop = document.createElement("div");

    searchPop.classList.add("search-pop");

    searchPop.innerHTML = `
    <div style="position:relative;">
    <div class="nav-search" style="display:flex;align-items:center;padding:12px 16px;border-bottom:1px solid rgba(0,0,0,0.06);">
    <i class="material-symbols-rounded" style="margin-right:8px;color:#4f8cff">search</i>
    <input id="search-input" type="search" placeholder="Search cities, countries, coordinates, or alerts" style="flex:1;border:0;outline:none;font-size:16px;padding:8px;">
    <button id="close-search-pop" class="material-symbols-rounded" style="background:none;border:0;font-size:20px;cursor:pointer">close</button>
    </div>
    
    <div id="search-loading" class="search-loading-bar" style="display:none;height:3px;"></div>
    </div>
    
    <div id="search-results" style="max-height:60dvh;overflow:auto;padding:12px;"></div>
    `;

    backdrop.appendChild(searchPop);
    document.body.appendChild(backdrop);

    document.getElementById("close-search-pop").onclick = () => backdrop.remove();

    const input = document.getElementById("search-input");
    if (activePopupInput) {
        input.oninput = () => handleSearch(input.value.trim(), false);
        input.onkeydown = (e) => {
            if (e.key === "Escape") backdrop.remove();
        };
    }
    attachSearchListeners(input);

    // initial empty render: show everything except new locations
    handleSearch("", false);
    input.focus();

}

// -----------------------------
// SAFE EXTERNAL DEPENDENCY WRAPPERS
// -----------------------------
async function safeGetStateAlerts() {
    try {
        if (typeof getStateAlerts === "function") return await getStateAlerts();
        if (typeof window.getStateAlerts === "function") return await window.getStateAlerts();
    } catch (e) { /* swallow */ }
    return { alerts: [] };
}

async function safeGetSavedLocations() {
    try {
        if (typeof getSavedLocations === "function") return await getSavedLocations();
        if (typeof window.getSavedLocations === "function") return await window.getSavedLocations();
    } catch (e) { /* swallow */ }
    return [];
}

async function safeGetLocation(lat, lon) {
    try {
        if (typeof getLocation === "function") return await getLocation(lat, lon);
        if (typeof window.getLocation === "function") return await window.getLocation(lat, lon);
    } catch (e) { /* swallow */ }
    return { latitude: lat, longitude: lon };
}

async function safeSearchForCountries(query, countryCode) {
    try {
        if (typeof searchForCountries === "function") return await searchForCountries(query, countryCode);
        if (typeof window.searchForCountries === "function") return await window.searchForCountries(query, countryCode);
    } catch (e) { console.warn("searchForCountries wrapper error:", e); }
    return [];
}

function safeShowNewLocationPreview(loc) {
    try {
        if (typeof showNewLocationPreview === "function") return showNewLocationPreview(loc);
        if (typeof window.showNewLocationPreview === "function") return window.showNewLocationPreview(loc);
    } catch (e) { console.warn("showNewLocationPreview error:", e); }
    // fallback: log
    console.log("Preview location:", loc);
}

// Wrapper for getInfoFromCoordinates(lat, lon) — validates args and returns {} on error
async function safeGetInfoFromCoordinates(lat, lon) {
    if (lat == null || lon == null) return {};
    const nlat = Number(lat), nlon = Number(lon);
    if (Number.isNaN(nlat) || Number.isNaN(nlon)) return {};
    try {
        if (typeof getInfoFromCoordinates === "function") {
            return await getInfoFromCoordinates(nlat, nlon) || {};
        }
        if (typeof window.getInfoFromCoordinates === "function") {
            return await window.getInfoFromCoordinates(nlat, nlon) || {};
        }
    } catch (e) {
        console.warn("getInfoFromCoordinates error:", e);
    }
    return {};
}

// -----------------------------
// UTIL: safe string + escape + highlight
// -----------------------------
function safeString(v) {
    if (v === undefined || v === null) return "";
    return typeof v === "string" ? v : String(v);
}

function escapeHtml(s) {
    s = safeString(s);
    return s.replace(/[&<>"'`=\/]/g, function (c) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '`': '&#96;',
            '=': '&#61;',
            '/': '&#47;'
        }[c];
    });
}

function highlightMatch(text, query) {
    text = safeString(text);
    if (!query) return escapeHtml(text);
    const q = String(query).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").trim();
    if (!q) return escapeHtml(text);
    try {
        const re = new RegExp(`(${q})`, "ig");
        return escapeHtml(text).replace(re, '<mark>$1</mark>');
    } catch (e) {
        return escapeHtml(text);
    }
}

// -----------------------------
// GROUP LABELS
// -----------------------------
function groupLabel(type) {
    switch (type) {
        case "saved-location": return "Saved Locations";
        case "current-location": return "Current Location";
        case "home-location": return "Home Location";
        case "alert": return "Weather Alerts";
        case "new-location": return "Add New Location";
        case "recent": return "Recent Searches";
        default: return "Results";
    }
}

// -----------------------------
// NORMALIZATION & DETECTION
// -----------------------------
function normalizeQuery(q) {
    if (!q) return "";
    q = String(q).trim();
    q = q.replace(/[;:()]/g, " ");
    q = q.replace(/\s+/g, " ").trim();
    q = q.replace(/\b(united states|usa|u\.s\.|america)\b/ig, "");
    q = q.replace(/,\s*(us|usa|u\.s\.|ca|uk|gb|fr|de|es|it|jp|cn|in)\b/ig, "");
    q = q.replace(/\b([A-Za-z]{2})\b/g, (m) => {
        const s = m.toLowerCase();
        const states = ["ca", "ny", "tx", "wa", "fl", "az", "nv", "or", "co", "ut", "nm", "oh", "pa", "il", "mi", "ga", "nc", "sc", "va", "md", "nj", "ct", "ma", "ri", "vt", "nh", "me"];
        return states.includes(s) ? "" : m;
    });
    q = q.replace(/\s+/g, " ").trim();
    const parts = q.split(",");
    if (parts.length > 1) {
        for (const p of parts) {
            const t = p.trim();
            if (t && !looksLikeCountry(t) && !/^[A-Za-z]{2}$/.test(t)) {
                return t;
            }
        }
        return parts[0].trim();
    }
    const tokens = q.split(" ");
    if (tokens.length > 1) {
        if (/^[A-Za-z]{2}$/.test(tokens[0])) return tokens.slice(1).join(" ");
    }
    return q;
}

function looksLikeLocation(query) {
    if (!query) return false;
    const q = String(query).toLowerCase().trim();
    const coordRegex = /^\s*[-+]?\d+(\.\d+)?\s*[, ]\s*[-+]?\d+(\.\d+)?\s*$/;
    if (coordRegex.test(q)) return true;
    if (q.includes(",")) return true;
    const tokens = q.split(/\s+/);
    const stateAbbr = new Set(["ca", "ny", "tx", "wa", "fl", "az", "nv", "or", "co", "ut", "nm", "oh", "pa", "il", "mi", "ga", "nc", "sc", "va", "md", "nj", "ct", "ma", "ri", "vt", "nh", "me"]);
    const countryCodes = new Set(["us", "usa", "u.s.", "ca", "uk", "gb", "fr", "de", "es", "it", "jp", "cn", "in", "mx", "br", "au"]);
    for (const t of tokens) {
        if (stateAbbr.has(t)) return true;
        if (countryCodes.has(t)) return true;
    }
    if (tokens.length === 2) return true;
    if (query[0] === query[0].toUpperCase() && query.length > 2) return true;
    return false;
}

function looksLikeCountry(query) {
    if (!query) return false;
    const q = String(query).toLowerCase().trim();
    const countryHints = [
        "united states", "usa", "u.s.", "america", "canada", "mexico", "france", "germany", "italy", "spain", "japan", "china", "india", "brazil", "australia", "uk", "gb"
    ];
    if (countryHints.includes(q)) return true;
    if (/^[a-z]{2}$/i.test(q)) return true;
    return false;
}

// -----------------------------
// HELPERS: scoring, matching, fuzzy
// -----------------------------
function scoreLocalMatch(loc, query) {
    if (!query) return 0.6;
    const q = String(query).toLowerCase();
    const name = (loc?.name || "").toLowerCase();
    const admin = (loc?.admin1 || loc?.state || "").toLowerCase();
    const country = (loc?.country || loc?.country_code || "").toLowerCase();
    if (name.includes(q) || admin.includes(q) || country.includes(q)) {
        let score = 0.6;
        if (name.startsWith(q)) score = 0.95;
        else if (name.includes(q)) score = 0.8;
        else score = 0.7;
        return score;
    }
    const dist = normalizedLevenshtein(q, name);
    if (dist <= FUZZY_THRESHOLD) return 0.65;
    return -1;
}

function keywordIndex(text, keyword) {
    if (!text || !keyword) return -1;
    return String(text).toLowerCase().indexOf(String(keyword).toLowerCase());
}

function normalizedLevenshtein(a, b) {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return 1;
    const d = levenshtein(a, b);
    return d / Math.max(a.length, b.length);
}

function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
        }
    }
    return dp[m][n];
}

// -----------------------------
// GEO UTILITIES
// -----------------------------
function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// -----------------------------
// COORDINATE PARSING
// -----------------------------
function parseCoordinates(input) {
    if (!input) return null;
    const s = String(input).trim();
    const coordRegex = /^\s*([-+]?\d+(\.\d+)?)\s*[, ]\s*([-+]?\d+(\.\d+)?)\s*$/;
    const match = s.match(coordRegex);
    if (!match) return null;
    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[3]);
    if (isNaN(lat) || isNaN(lon)) return null;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
    return { lat, lon };
}

// -----------------------------
// PLACE KEY NORMALIZATION
// -----------------------------
function normalizePlaceKey(name, country) {
    return `${(name || "").toLowerCase().trim()}|${(country || "").toLowerCase().trim()}`;
}

// -----------------------------
// formatSubtitle: defensive wrapper around getInfoFromCoordinates
// Accepts either a location object {latitude,longitude} or numeric args (lat, lon)
// -----------------------------
async function formatSubtitle(locOrLat, maybeLon) {
    let lat, lon;
    if (locOrLat && typeof locOrLat === "object" && ("latitude" in locOrLat || "lat" in locOrLat)) {
        lat = Number(locOrLat.latitude ?? locOrLat.lat);
        lon = Number(locOrLat.longitude ?? locOrLat.lon);
    } else {
        lat = Number(locOrLat);
        lon = Number(maybeLon);
    }
    if (Number.isNaN(lat) || Number.isNaN(lon)) return "";
    const info = await safeGetInfoFromCoordinates(lat, lon);
    const parts = [];
    if (info.admin1) parts.push(info.admin1);
    if (info.state && !parts.includes(info.state)) parts.push(info.state);
    if (info.country && !parts.includes(info.country)) parts.push(info.country);
    return parts.join(", ");
}

// -----------------------------
// ACTIVE COUNTRY CODE
// -----------------------------
function getActiveCountryCode() {
    if (window.settings?.countryCode) return String(window.settings.countryCode).toUpperCase();
    if (window.homeLocation?.country_code) return String(window.homeLocation.country_code || "").toUpperCase();
    if (window.currentLocation?.country_code) return String(window.currentLocation.country_code || "").toUpperCase();
    return "US";
}

// -----------------------------
// RECENT SEARCHES (localStorage)
// -----------------------------
function getRecentSearches() {
    try {
        const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

function saveRecentSearch(q) {
    if (!q) return;
    const list = getRecentSearches();
    const normalized = String(q).trim();
    const filtered = list.filter(x => String(x).toLowerCase() !== normalized.toLowerCase());
    filtered.unshift(normalized);
    const trimmed = filtered.slice(0, 8);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(trimmed));
}

function mergeRecentWithBase(recent, baseResults) {
    const recentItems = (recent || []).map(q => ({
        type: "recent",
        title: String(q),
        subtitle: "Recent search",
        icon: "history",
        score: 0.7,
        execute: () => {
            const input = document.getElementById("search-input");
            if (input) {
                input.value = q;
                handleSearch(q);
            }
        }
    }));
    return [...recentItems, ...(Array.isArray(baseResults) ? baseResults : [])];
}

// -----------------------------
// LOCAL SEARCH: saved locations, current, home, alerts
// -----------------------------
async function indexSimpleSearch(query) {
    const weatherAlerts = await safeGetStateAlerts();
    const savedLocations = await safeGetSavedLocations();

    const savedLocationResults = [];
    const alertResults = [];
    const miscResults = [];

    for (const loc of (Array.isArray(savedLocations) ? savedLocations : [])) {
        const score = scoreLocalMatch(loc, query);
        if (score >= 0) {
            const subtitle = await formatSubtitle(loc).catch(() => "");
            savedLocationResults.push({
                type: "saved-location",
                title: safeString(loc.name),
                subtitle: safeString(subtitle),
                score,
                data: loc,
                icon: "location_on",
                execute: () => {
                    console.log(loc)
                    openWeatherInNewPage(loc);
                }
            });
        }
    }

    if (currentLocation) {
        const loc = currentLocation;
        const score = scoreLocalMatch(loc, query);
        if (score >= 0) {
            const subtitle = await formatSubtitle(loc).catch(() => "");
            alertResults.push({
                type: "current-location",
                title: "Current Location",
                subtitle: safeString(subtitle),
                score,
                data: loc,
                icon: "my_location",
                execute: () => {
                    openWeatherInNewPage(loc);
                }
            });
        }
    }

    if (homeLocation) {
        const lat = Number(homeLocation.y ?? homeLocation.latitude ?? homeLocation.lat);
        const lon = Number(homeLocation.x ?? homeLocation.longitude ?? homeLocation.lon);
        if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
            const loc = await safeGetLocation(lat, lon);
            const homeInfo = await safeGetInfoFromCoordinates(lat, lon);
            const score = scoreLocalMatch(loc || { name: "Home" }, query);
            if (score >= 0) {
                const subtitle = `${homeInfo?.city ?? ""}${homeInfo?.state ? ", " + homeInfo.state : ""}${homeInfo?.country ? ", " + homeInfo.country : ""}`.replace(/(^,|,$)/g, "").trim();
                alertResults.push({
                    type: "home-location",
                    title: "Home Location",
                    subtitle: safeString(subtitle),
                    score,
                    data: loc || { latitude: lat, longitude: lon },
                    icon: "home",
                    execute: () => {
                        openWeatherInNewPage({ latitude: lat, longitude: lon });
                    }
                });
            }
        }
    }

    const coord = parseCoordinates(query);
    if (coord) {
        const coordInfo = await safeGetInfoFromCoordinates(coord.lat, coord.lon);
        const coordLabel = `${coord.lat.toFixed(4)}, ${coord.lon.toFixed(4)}`;
        const subtitle = coordInfo
            ? `${coordInfo.name ?? "Coordinates"}${coordInfo.admin2 ? ", " + coordInfo.admin2 : ""}`
            : "Use these coordinates as a new location";
        alertResults.push({
            type: "new-location",
            title: coordLabel,
            subtitle: safeString(subtitle),
            icon: "my_location",
            data: { latitude: coord.lat, longitude: coord.lon },
            isCoordinate: true,
            score: 1.0,
            execute: () => {
                openWeatherInNewPage({ latitude: coord.lat, longitude: coord.lon });
            }
        });
    }

    if (weatherAlerts && Array.isArray(weatherAlerts.alerts)) {
        for (const alert of weatherAlerts.alerts) {
            const headline = alert.properties?.headline ?? "";
            const event = alert.properties?.event ?? "";
            const text = `${headline} ${event} ${alert.properties?.areaDesc ?? ""}`;
            const idx = keywordIndex(text, query);
            if (idx !== -1) {
                alertResults.push({
                    type: "alert",
                    title: event || headline,
                    subtitle: safeString(alert.properties?.areaDesc ?? ""),
                    score: 0.5,
                    data: alert,
                    icon: "warning",
                    execute: () => {
                        openAlertPopup(alert.properties);
                    }
                });
            }
        }
    }

    savedLocationResults.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    alertResults.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    return [...savedLocationResults, ...alertResults, ...miscResults];
}

// -----------------------------
// REMOTE SEARCH (new locations + country support)
// -----------------------------
async function buildNewLocationResults(query, existingResults, activeCountryCode = null) {
    if (parseCoordinates(query)) return null;

    const results = [];
    const savedKeys = new Set(
        (Array.isArray(existingResults) ? existingResults : [])
            .filter(r => r.type === "saved-location")
            .map(r => normalizePlaceKey(r.title, r.data?.country))
    );

    const cleanQuery = normalizeQuery(query);
    const isCountrySearch = looksLikeCountry(query);

    let geoResults = [];
    try {
        geoResults = await safeSearchForCountries(cleanQuery, isCountrySearch ? null : activeCountryCode);
        if ((!geoResults || geoResults.length === 0) && !isCountrySearch) {
            geoResults = await safeSearchForCountries(cleanQuery, null);
        }
    } catch (e) {
        console.warn("searchForCountries failed:", e);
        geoResults = [];
    }

    const seen = new Set();
    const sliceCount = Math.max(0, Math.min(MAX_REMOTE_RESULTS, (Array.isArray(geoResults) ? geoResults.length : 0)));
    for (const place of (Array.isArray(geoResults) ? geoResults.slice(0, sliceCount) : [])) {
        if (!place || !place.name) continue;
        const key = normalizePlaceKey(place.name, place.country);
        if (savedKeys.has(key) || seen.has(key)) continue;
        seen.add(key);

        const nameLabel = String(place.name);
        const queryLower = cleanQuery.toLowerCase();
        let score = 0.5;
        if (nameLabel.toLowerCase().startsWith(queryLower)) score += PREFIX_BOOST;
        const fuzzy = normalizedLevenshtein(queryLower, nameLabel.toLowerCase());
        if (fuzzy <= FUZZY_THRESHOLD) score += (1 - fuzzy) * 0.4;
        if (place.population) {
            score += Math.min(POPULATION_BOOST, Math.log10((place.population || 0) + 1) / 20);
        }
        if (window.currentLocation && place.latitude != null && place.longitude != null) {
            const d = haversineDistance(
                Number(window.currentLocation.latitude),
                Number(window.currentLocation.longitude),
                Number(place.latitude),
                Number(place.longitude)
            );
            score += Math.max(0, 0.2 - Math.min(0.2, d / 2000));
        }

        const label = `${place.name}, ${place.admin1 || ""}, ${place.country || ""}`.replace(/\s+,/g, ",").replace(/,\s+$/, "");
        results.push({
            type: "new-location",
            title: safeString(label),
            subtitle: safeString(`Lat ${place.latitude != null ? Number(place.latitude).toFixed(4) : "?"}, Lon ${place.longitude != null ? Number(place.longitude).toFixed(4) : "?"}`),
            icon: isCountrySearch ? "public" : "add_location_alt",
            data: place,
            isCoordinate: false,
            score,
            execute: () => {
                openWeatherInNewPage(place);
            }
        });
    }

    results.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    return results;
}

// -----------------------------
// MERGE & RANK: combine local + remote
// -----------------------------
function mergeAndRankResults(local, remote, query) {
    const weightMap = {
        "saved-location": 1.2,
        "current-location": 1.1,
        "home-location": 1.1,
        "alert": 0.9,
        "new-location": 0.8,
        "recent": 1.0
    };

    const safeLocal = Array.isArray(local) ? local : [];
    const safeRemote = Array.isArray(remote) ? remote : [];
    const all = [...safeLocal, ...safeRemote];

    const q = String(query || "").toLowerCase();
    for (const r of all) {
        const base = Number(r.score ?? 0.5);
        const weight = weightMap[r.type] ?? 1.0;
        const title = (r.title || "").toLowerCase();
        const prefixBoost = q && title.startsWith(q) ? 0.08 : 0;
        r._finalScore = base * weight + prefixBoost;
    }

    all.sort((a, b) => (b._finalScore ?? 0) - (a._finalScore ?? 0));
    return all;
}

// -----------------------------
// RENDERING (with highlight)
// -----------------------------
function renderSearchResults(results, navSearch) {
    let container = navSearch ? document.getElementById('nav-search-results') : document.getElementById("search-results");
    if (!container) return;

    if (!results || results.length === 0) {
        container.innerHTML = `
          <div class="info-search" style="text-align:center;padding:28px;color:#666">
            <i class="material-symbols-rounded" style="font-size:36px">search_off</i>
            <h3 style="margin:12px 0 6px 0">No results found</h3>
            <p style="margin:0">Try a different city, country, or coordinates.</p>
          </div>
        `;
        return;
    }

    const groupsOrder = ["recent", "saved-location", "current-location", "home-location", "new-location", "alert"];
    let html = "";
    const rendered = [];

    for (const type of groupsOrder) {
        const items = results.filter(r => r.type === type);
        if (!items.length) continue;

        html += `<h4 class="search-group" style="margin:12px 0 6px 0;font-size:13px">${escapeHtml(groupLabel(type))}</h4>`;
        for (const r of items) {
            const title = safeString(r.title);
            const subtitle = r.subtitle != null ? safeString(r.subtitle) : null;
            rendered.push(r);
            html += `
              <div class="search-item" data-type="${escapeHtml(r.type)}" style="display:flex;align-items:center;padding:12px;border-radius:14px;cursor:pointer;margin-bottom:4px;">
                <i class="material-symbols-rounded" style="margin-right:12px;color:var(--scheme-13);">${escapeHtml(r.icon || "")}</i>
                <div style="flex:1">
                  <div class="title" style="font-weight:600;">${highlightMatch(title, lastSearchQuery)}</div>
                  ${subtitle ? `<div class="subtitle" style="font-size:13px;color:var(--scheme-9);margin-top:4px">${highlightMatch(subtitle, lastSearchQuery)}</div>` : ""}
                </div>
                <div style="margin-left:12px;color:#999;font-size:12px">${Number(r.score ?? 0).toFixed(2)}</div>
              </div>
            `;
        }
    }

    container.innerHTML = html;

    const items = container.querySelectorAll(".search-item");
    let idx = 0;
    for (const el of items) {
        const r = rendered[idx++];
        el.onclick = () => {
            if (!r) return;
            if (r.isCoordinate) {
                openWeatherInNewPage(r.data);
                return;
            }
            if (typeof r.execute === "function") {
                r.execute();
                return;
            }
            if (r.type === 'home-location' || r.type === "new-location" || r.type === "saved-location" || r.type === "current-location") {
                openWeatherInNewPage(r.data);
                return;
            }
        };
    }
}

function openWeatherInNewPage(data) {
    const lon = data.x ?? data.lon ?? data.longitude;
    const lat = data.y ?? data.lat ?? data.latitude;
    let a = document.createElement('a');
    a.href = `./location/?x=${lon}&y=${lat}`;
    a.rel = 'noopener noreferer';
    document.body.appendChild(a);
    a.click();
    a.remove();
}

// -----------------------------
// SEARCH ENTRY POINT
// ----------------------------

async function handleSearch(query, navSearch = false) {
    lastSearchQuery = query;
    clearTimeout(newLocationTimeout);

    if (!query) {
        showSearchLoading(false);
        const baseResults = await indexSimpleSearch("");
        // const recent = getRecentSearches();
        const merged = mergeRecentWithBase([], baseResults);
        renderSearchResults(merged, navSearch);
        return;
    }

    const baseResults = await indexSimpleSearch(query);
    renderSearchResults(baseResults, navSearch);

    showSearchLoading(true);

    newLocationTimeout = setTimeout(async () => {
        if (query !== lastSearchQuery) return;
        if (!looksLikeLocation(query)) {
            showSearchLoading(false);
            return;
        }
        const activeCountry = getActiveCountryCode();
        const newLocationResults = await buildNewLocationResults(query, baseResults, activeCountry);
        if (Array.isArray(newLocationResults) && newLocationResults.length > 0) {
            const finalResults = mergeAndRankResults(baseResults, newLocationResults, query);
            renderSearchResults(finalResults, navSearch);
        }
        showSearchLoading(false);
        saveRecentSearch(query);
    }, REMOTE_DELAY_MS);
}

// -----------------------------
// Helper UI stub (if not provided by host app)
// -----------------------------
function showSearchLoading(isLoading) {
    try {
        if (typeof window.showSearchLoading === "function") return window.showSearchLoading(isLoading);
    } catch (e) { /* swallow */ }
    const el = document.getElementById("search-loading");
    if (el) el.style.display = isLoading ? "block" : "none";
}

// -----------------------------
// MERGED SAFE GETTERS (stubs to avoid runtime errors if functions missing)
// Replace these with your real implementations
// -----------------------------
async function safeGetStateAlerts(stateCode = "CA") {
    try {
        if (typeof getStateAlerts === "function") return await getStateAlerts(stateCode);
    } catch { }
    return { alerts: [] };
}

async function safeGetSavedLocations() {
    try {
        if (typeof getSavedLocations === "function") return await getSavedLocations();
    } catch { }
    return [];
}

async function safeGetLocation(y, x) {
    try {
        if (typeof getLocation === "function") return await getLocation(y, x);
    } catch { }
    return null;
}

// -----------------------------
// HIGHLIGHT MATCHING
// -----------------------------
function highlightMatch(text, query) {
    if (!text || !query) return escapeHtml(text || "");
    const q = query.trim();
    if (!q) return escapeHtml(text);
    const re = new RegExp(escapeRegExp(q), "ig");
    return escapeHtml(text).replace(re, (m) => `<mark style="background:linear-gradient(90deg,#fff3b0,#ffd27a);padding:0 2px;border-radius:2px;color:#111">${m}</mark>`);
}

function escapeHtml(s) {
    if (!s) return "";
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// -----------------------------
// MISC UTILITIES
// -----------------------------
function mergeResultsUnique(a, b) {
    const map = new Map();
    for (const r of [...a, ...b]) {
        const key = `${r.type}|${r.title}`;
        if (!map.has(key)) map.set(key, r);
    }
    return Array.from(map.values());
}

// -----------------------------
// GEO: distance helper for sorting nearby cities (optional)
// -----------------------------
function sortByProximity(results) {
    if (!window.currentLocation) return results;
    return results.sort((a, b) => {
        const pa = a.data?.latitude && a.data?.longitude ? haversineDistance(window.currentLocation.latitude, window.currentLocation.longitude, a.data.latitude, a.data.longitude) : Infinity;
        const pb = b.data?.latitude && b.data?.longitude ? haversineDistance(window.currentLocation.latitude, window.currentLocation.longitude, b.data.latitude, b.data.longitude) : Infinity;
        return pa - pb;
    });
}

function showSearchLoading(show) {
    const bar = document.querySelectorAll("#search-loading");
    if (!bar) return;
    bar.forEach(barEnt => {
        if (show) {
            barEnt.style.display = "block";
            barEnt.classList.add("active-loading");
        } else {
            barEnt.classList.remove("active-loading");
            barEnt.style.display = "none";
        }
    });
}

// -----------------------------
// END OF MODULE
// -----------------------------

const notificationQueue = [];
let isDisplaying = false;
let currentTimeout = ''

function displayNotification(message, icon = '', timeout = 5000, priority = 1) {
    const newNote = { message, icon, timeout, priority };
    notificationQueue.push(newNote);
    processQueue();
}

function processQueue() {
    if (isDisplaying || notificationQueue.length === 0) return;

    const next = notificationQueue.shift();
    const { message, icon, timeout } = next;

    const notification = document.getElementById('notification');
    notification.innerHTML = icon + message;
    notification.style.transform = 'translate(-50%, -20px)';
    notification.style.transition = 'transform 0.3s';

    isDisplaying = true;

    currentTimeout = setTimeout(() => {
        notification.style.transform = 'translate(-50%, 100%)';
        setTimeout(() => {
            isDisplaying = false;
            processQueue();
        }, 300);
    }, timeout);
}