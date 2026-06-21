function createLoader(ele) {
    let backdrop;
    if (ele === document.body) {
        backdrop = document.createElement('backdrop');
        backdrop.classList.add('backdrop');
        document.appendChild(backdrop);
    }

    let loader = document.createElement('div');
    loader.classList.add('loader-div');
    loader.innerHTML = `
    `
}