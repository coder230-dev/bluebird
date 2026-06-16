const URLParams = {
    get(key) {
        return new URLSearchParams(window.location.search).get(key);
    },

    getAll() {
        return Object.fromEntries(new URLSearchParams(window.location.search));
    },

    set(key, value) {
        const params = new URLSearchParams(window.location.search);
        params.set(key, value);
        window.history.replaceState({}, "", `${location.pathname}?${params}`);
    },

    delete(key) {
        const params = new URLSearchParams(window.location.search);
        params.delete(key);
        const newUrl = params.toString()
            ? `${location.pathname}?${params}`
            : location.pathname;
        window.history.replaceState({}, "", newUrl);
    }
};

const mainContent = document.querySelector('main')

document.addEventListener('DOMContentLoaded', setUpWeatherInfo);

async function setUpWeatherInfo() {
    const lat = URLParams.get('lat');
    const lon = URLParams.get('lon')
    if (!lat || !lon) {
        mainContent.innerHTML = `
        <div>
            <h1>Couldn't get Weather Data.</h1>
            <p>Do you have the right link?</p>
        </div>
        `
        return
    }

    const metaData = await saveMetaDataCords(lat, lon);
    const weatherData = await getWeatherInfo(lon, lat);
    const weatherAlerts = await getCoordinateAlerts(lat, lon);

    console.log(metaData)
    console.log(weatherData)
    console.log(weatherAlerts)
}

async function saveMetaDataCords(lat, lon) {
    const saved = await getLocMetaData(lat, lon);   // <-- MUST await
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

    if (!saved || (Date.now() - saved.lastUpdated) > THIRTY_DAYS) {
        console.warn("API being run");

        const url = `https://api.weather.gov/points/${lat},${lon}`;
        const res = await fetch(url);
        if (!res.ok) return null;

        const data = await res.json();
        const p = data.properties;

        const meta = {
            city: p.relativeLocation?.properties?.city || null,
            state: p.relativeLocation?.properties?.state || null,
            office: p.cwa || null,
            forecast: p.forecast || null,
            hourly: p.forecastHourly || null,
            grid: p.forecastGridData || null,
            radar: p.radarStation || null,
            lastUpdated: Date.now()
        };

        await saveLocMetaData(lat, lon, meta);  // <-- also await
        return meta;
    }

    return saved;
}