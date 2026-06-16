document.addEventListener('DOMContentLoaded', async () => {
    let didLogOut = await logOutUser();

    setTimeout(function () {
        document.querySelector('.container').innerHTML = `
        <h1>Logged Out</h1>
        <p>You will be redirected back to the page you came from.</p>
        `
        setTimeout(() => {
            history.back();
        }, 1000)
    }, 800)
})
