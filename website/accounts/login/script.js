// website/accounts/login/script.js
// Login form handling using Supabase auth.

let usedEmail = false;

let signinEmailPrefill = null;

const loginWithEmail = document.getElementById('loginWithEmail');
const loginLabel = document.getElementById('loginLabel');
const loginInput = document.getElementById('loginInput');

const loginPage = document.getElementById('user-section');
const passwordPage = document.getElementById('password-section');

loginWithEmail.addEventListener('change', () => {
    if (loginWithEmail.checked) {
        loginLabel.textContent = "Email";
        loginInput.placeholder = "ex. ghost@mail.com";
        loginInput.type = "email";
        usedEmail = true;
    } else {
        loginLabel.textContent = "Username";
        loginInput.placeholder = "ex. theLonleyGhost";
        loginInput.type = "text";
        usedEmail = false;
    }
});

const passwordInput = document.getElementById('passwordInput');
const submitBtn = document.getElementById('submit-btn');

async function showPasswordPage() {
    const value = loginInput.value.trim();
    if (!value) {
        displayNotification('Enter your login (username or email).');
        return;
    }

    // Determine whether to lookup by email or username
    let account = null;
    try {
        if (loginWithEmail.checked) {
            account = await fetchRowBy('accounts', 'email', value);
            if (!account) {
                // fallback to saved_data->>email
                try {
                    const { data } = await supabaseClient.from('accounts').select('*').eq('saved_data->>email', value).single();
                    account = data || null;
                } catch (e) {
                    account = null;
                }
            }
        } else {
            account = await fetchRowBy('accounts', 'username', value);
        }
    } catch (err) {
        console.error('Error fetching account:', err);
        account = null;
    }

    if (!account) {
        displayNotification('No account found matching that login. Please sign up or try a different login.', '⚠️ ');
        return;
    }

    // If user used username login but there is no linked email, ask them to switch to email login
    const accountEmail = account?.email || account?.saved_data?.email || null;
    if (!loginWithEmail.checked && !accountEmail) {
        displayNotification('This username does not have a linked email. Please switch to email login or sign up.', '⚠️ ');
        return;
    }

    // Store prefill email so executeLogin can use it if needed
    signinEmailPrefill = accountEmail || value;

    // Show password page
    loginPage.style.display = 'none';
    passwordPage.style.display = 'unset';
}

submitBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    await executeLogin();
});

async function executeLogin() {
    const loginValue = loginInput.value.trim();
    const password = passwordInput.value;

    if (!loginValue || !password) {
        displayNotification('Enter your login and password.');
        return;
    }

    // Prefer prefilled account email when available
    let signinEmail = signinEmailPrefill || loginValue;

    if (!usedEmail && !signinEmailPrefill) {
        const account = await fetchRowBy('accounts', 'username', loginValue);
        const accountEmail = account?.email || account?.saved_data?.email;
        if (!account || !accountEmail) {
            displayNotification('Username login requires a linked account email. Please switch to email login.', '⚠️ ');
            return;
        }
        signinEmail = accountEmail;
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: signinEmail,
        password,
    });

    if (error) {
        displayNotification(`Login failed: ${error.message}`, '⚠️ ');
        console.error('Login error:', error);
        return;
    }

    displayNotification('Logged in successfully. Welcome back!', '✅ ');
    console.log('Login success:', data);
}

// Auto-prefill from URL param `email` (e.g. ?email=you@example.com)
(function handleUrlPrefill() {
    try {
        const params = new URLSearchParams(window.location.search);
        const email = params.get('email');
        if (email) {
            loginWithEmail.checked = true;
            loginLabel.textContent = 'Email';
            loginInput.type = 'email';
            usedEmail = true;
            loginInput.value = email;
            // attempt to go to password section automatically
            setTimeout(() => {
                showPasswordPage();
            }, 250);
        }
    } catch (err) {
        console.error('URL prefill error:', err);
    }
})();