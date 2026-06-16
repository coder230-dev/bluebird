// website/accounts/signup/script.js
// Signup form handling and example Supabase data retrieval.

const urlParams = new URLSearchParams(window.location.search);

const signupForm = document.getElementById('signup-form');
const signupButton = document.getElementById('submit-btn');
const usernameInput = document.getElementById('username');
const usernameStatusEl = document.getElementById('username-status');
const passwordInput = document.getElementById('password');
const passwordStatusEl = document.getElementById('password-status');
let savedData = {};
let usernameCheckTimer = null;
let lastUsernameChecked = '';
let usernameAvailable = false;

if (signupForm) {
    signupForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        setButtonLoading(signupButton, true);
        await checkAndProceed();
        setButtonLoading(signupButton, false);
    });
}

if (usernameInput) {
    usernameInput.addEventListener('input', handleUsernameInput);
}

if (passwordInput) {
    passwordInput.addEventListener('input', handlePasswordInput);
}

function updateFieldStatus(statusEl, message = '', type = '') {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = 'username-status';
    if (type === 'success') statusEl.classList.add('success');
    if (type === 'error') statusEl.classList.add('error');
    if (type === 'checking') statusEl.classList.add('checking');
    if (type === 'warn') statusEl.classList.add('warn');
}

function updateUsernameStatus(message = '', type = '') {
    updateFieldStatus(usernameStatusEl, message, type);
}

function validateEmailFormat(email) {
    const trimmed = email.trim();
    if (!trimmed) {
        return { valid: true, message: '' };
    }
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(trimmed)
        ? { valid: true, message: 'Email looks good.' }
        : { valid: false, message: 'Enter a valid email address.' };
}

function validatePasswordStrength(password) {
    const trimmed = password.trim();
    if (trimmed.length < 8) {
        return { valid: false, message: 'Password needs at least 8 characters.' };
    }
    const hasUpper = /[A-Z]/.test(trimmed);
    const hasLower = /[a-z]/.test(trimmed);
    const hasNumber = /[0-9]/.test(trimmed);
    const hasSymbol = /[!@#$%^&*()_+\-=[\]{};:'"\\|,.<>/?`~]/.test(trimmed);
    if (!(hasUpper && hasLower && hasNumber && hasSymbol)) {
        return { valid: false, message: 'Use upper/lower case letters, numbers, and symbols.' };
    }
    return { valid: true, message: 'Strong password.' };
}

function handlePasswordInput() {
    if (!passwordInput) return;
    const value = passwordInput.value;
    if (!value) {
        updateFieldStatus(passwordStatusEl, '', '');
        return;
    }

    const check = validatePasswordStrength(value);
    updateFieldStatus(passwordStatusEl, check.message, check.valid ? 'success' : 'error');
}

function validateUsernameFormat(username) {
    const trimmed = username.trim();
    if (!trimmed) {
        return { valid: false, message: '' };
    }
    if (trimmed.length < 3 || trimmed.length > 18) {
        return { valid: false, message: 'Usernames must be 3-18 characters.' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
        return { valid: false, message: 'Use only letters, numbers, and underscores.' };
    }
    return { valid: true, message: '' };
}

let savedUsernames

async function checkUsernameAvailability(username) {
    const normalized = username.trim();
    if (!normalized) {
        usernameAvailable = false;
        updateUsernameStatus('', '');
        return false;
    }

    const format = validateUsernameFormat(normalized);
    if (!format.valid) {
        usernameAvailable = false;
        updateUsernameStatus(format.message, 'error');
        return false;
    }

    if (normalized === lastUsernameChecked && usernameAvailable) {
        return true;
    }

    updateUsernameStatus('Checking availability…', 'checking');

    // 🔍 1. Check LOCAL accounts
    const local = await getLocalAccountByUsername(normalized);

    if (local) {
        usernameAvailable = false;
        updateUsernameStatus('That username is already taken (local account).', 'error');
        return false;
    }

    // 🔍 2. Check GLOBAL accounts (Supabase)
    const global = await fetchRowBy('accounts', 'username', normalized);

    if (global) {
        usernameAvailable = false;
        updateUsernameStatus('That username is already taken (online account).', 'error');
        return false;
    }

    // 🎉 Username is free
    usernameAvailable = true;
    lastUsernameChecked = normalized;
    updateUsernameStatus('That username is available!', 'success');
    return true;
}


async function handleUsernameInput() {
    if (!usernameInput) return;
    const value = usernameInput.value.trim();
    usernameAvailable = false;

    if (!value) {
        updateUsernameStatus('', '');
        return;
    }

    const format = validateUsernameFormat(value);
    if (!format.valid) {
        updateUsernameStatus(format.message, 'error');
        return;
    }

    if (usernameCheckTimer) {
        clearTimeout(usernameCheckTimer);
    }

    usernameCheckTimer = setTimeout(async () => {
        await checkUsernameAvailability(value);
    }, 400);
}

function setButtonLoading(button, isLoading) {
    if (!button) return;
    if (isLoading) {
        button.disabled = true;
        button.classList.add('loading');
        if (!button.querySelector('.button-loader')) {
            const loader = document.createElement('span');
            loader.className = 'button-loader';
            loader.innerHTML = '<span></span><span></span><span></span>';
            button.appendChild(loader);
        }
        return;
    }

    button.disabled = false;
    button.classList.remove('loading');
    const loader = button.querySelector('.button-loader');
    if (loader) loader.remove();
}

function showScreenLoader(message = 'Please wait…') {
    hideScreenLoader();
    const overlay = document.createElement('div');
    overlay.id = 'screen-loader-overlay';
    overlay.className = 'screen-loader-overlay';
    overlay.innerHTML = `
        <div class="screen-loader-panel">
            <div class="loader-ring"></div>
            <h2>Working on it</h2>
            <p>${message}</p>
        </div>
    `;
    document.body.appendChild(overlay);
}

function hideScreenLoader() {
    const existing = document.getElementById('screen-loader-overlay');
    if (existing) existing.remove();
}

async function checkAndProceed() {
    const usernameEl = document.getElementById('username');
    const passwordEl = document.getElementById('password');
    const confirmEl = document.getElementById('confirm-password');
    const nameEl = document.getElementById('name');

    const requiredFields = [
        { el: usernameEl, label: "Username" },
        { el: passwordEl, label: "Password" },
        { el: confirmEl, label: "Confirm Password" }
    ];

    const emptyRequired = requiredFields.find(f => f.el.value.trim() === "");
    if (emptyRequired) {
        displayNotification(`Fill required fields.`);
        return;
    }

    if (passwordEl.value !== confirmEl.value) {
        displayNotification("Check your passwords. They don't match.");
        updateFieldStatus(passwordStatusEl, 'Passwords do not match.', 'error');
        return;
    }

    const passwordCheck = validatePasswordStrength(passwordEl.value);
    if (!passwordCheck.valid) {
        displayNotification(passwordCheck.message);
        updateFieldStatus(passwordStatusEl, passwordCheck.message, 'error');
        return;
    }
    updateFieldStatus(passwordStatusEl, passwordCheck.message, 'success');

    const usernameValue = usernameEl.value.trim();
    const format = validateUsernameFormat(usernameValue);
    if (!format.valid) {
        displayNotification(format.message || 'Invalid username.');
        updateUsernameStatus(format.message, 'error');
        return;
    }

    const available = await checkUsernameAvailability(usernameValue);
    if (!available) {
        displayNotification('That username is not available. Choose a different one.');
        return;
    }

    savedData = {
        name: nameEl.value.trim(),
        username: usernameValue,
        password: passwordEl.value
    };

    accountTypeChooser();
}

function accountTypeChooser() {
    hideScreenLoader();
    let cont = document.getElementById('cont');
    cont.innerHTML = `
	  <svg viewBox="25 25 50 50" class="spinner">
		<circle r="20" cy="50" cx="50"></circle>
	  </svg>
    `
    setTimeout(() => {

        cont.innerHTML = `
            <h1 style="text-align: center;">
                <i class="material-symbols-rounded main-icon">
                    storage
                </i>
            </h1>
            <h1 class="main-header">Choose Account Type</h1>
            <p style="text-align: center;">Choose between a Bluebird ID for syncing and social features, or a Local Account for private, offline use.</p>
            <div class="account-chooser-options">
            <label for="global-acc">
                <h2>
                    <input type="radio" name="acc-type" id="global-acc">
                    Bluebird ID Account
                </h2>
        
                <p>
                    A cloud‑based account that securely stores your profile, settings, bookmarks, and social features. 
                    Your Bluebird ID lets you sync across devices, connect with friends, and access your data anywhere. 
                    It also allows you to use Bluebird Browser and other services with your personalized setup on any device you sign in to, 
                    including moving your bookmarks, preferences, and browsing data seamlessly.
                </p>
        
                <b>In summary...</b>
                <ul>
                    <li>Syncs your data across devices</li>
                    <li>Stores your profile, settings, bookmarks, and friends list in the cloud</li>
                    <li>Keeps your personalized setup on any device you sign in to</li>
                    <li>Enables social features like friends and sharing</li>
                </ul>
                <p>* Your account will become a Bluebird ID Account if space is avaiable.</p>
            </label>
        </div>
        
        <div class="account-chooser-options">
            <label for="local-acc">
                <h2>
                    <input type="radio" name="acc-type" id="local-acc">
                    Local Account
                </h2>
        
                <p>
                    A profile stored only on your device. Nothing is uploaded or synced. 
                    Ideal for privacy‑focused users or offline use. 
                    Local Profiles do not support cross‑device sync or social features.
                </p>
        
                <b>In summary...</b>
                <ul>
                    <li>Stores all data privately on this device</li>
                    <li>Does not sync across devices</li>
                    <li>Ideal for offline or privacy‑focused use</li>
                    <li>No social or friend features</li>
                </ul>
            </label>
        </div>
        <p>* You may switch accounts at any time. Some features may be limited due to age or other factors. <a href="#">View Private Policy</a></p>
        <form id="account-type-form" novalidate>
            <button class="submit-btn" type="submit">Create Account</button>
        </form>
        `
        initAccountTypeForm();
    }, 1000)
}

function finishSignUp() {
    const localAcc = document.getElementById('local-acc');
    const globalAcc = document.getElementById('global-acc');

    if (!localAcc.checked && !globalAcc.checked) {
        displayNotification('Pick an account type before continuing.');
        return;
    }

    savedData['accountType'] = localAcc.checked ? 'local' : 'bluebird';
    showDobScreen();
}

function showDobScreen() {
    const cont = document.getElementById('cont');
    const maxDate = new Date().toISOString().split('T')[0];
    const dobValue = savedData.dateOfBirth || '';
    cont.innerHTML = `
        <h1 style="text-align: center;">
            <i class="material-symbols-rounded main-icon">calendar_month</i>
        </h1>
        <h1 class="main-header">Your Date of Birth</h1>
        <p style="text-align: center;">Enter your date of birth so we can personalize your experience and keep your account secure.</p>
        <section class="security-screen">
            <form id="dob-form" novalidate>
                <div class="input-cont">
                    <span class="material-symbols-rounded">calendar_month</span>
                    <label for="dob">Date of Birth <span class="required">* Required</span></label>
                    <input type="date" id="dob" name="dob" max="${maxDate}" value="${dobValue}" required>
                    <span class="info">We use this only for age-aware recommendations and account safety.</span>
                </div>
                <div class="btn-cont">
                    <button class="submit-btn" type="submit">Continue</button>
                </div>
            </form>
        </section>
    `;

    const dobForm = document.getElementById('dob-form');
    if (dobForm) {
        const submitButton = dobForm.querySelector('button[type="submit"]');
        dobForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const dobInput = document.getElementById('dob');
            const dobValue = dobInput ? dobInput.value : '';
            if (!dobValue) {
                displayNotification('Please enter your date of birth.');
                return;
            }
            savedData.dateOfBirth = dobValue;
            showSecurityScreen();
        });
    }
}

function initAccountTypeForm() {
    const accountTypeForm = document.getElementById('account-type-form');
    if (accountTypeForm) {
        const submitButton = accountTypeForm.querySelector('button[type="submit"]');
        accountTypeForm.addEventListener('submit', (event) => {
            event.preventDefault();
            setButtonLoading(submitButton, true);
            finishSignUp();
            setButtonLoading(submitButton, false);
        });
    }
}

function showSecurityScreen() {
    const hasPasskey = typeof window.PublicKeyCredential !== 'undefined';
    const emailValue = savedData.email || '';
    let securityMessage = `Email is optional here, but connecting it enables account recovery and better security.`;

    if (savedData.accountType === 'bluebird') {
        securityMessage = `For a Bluebird ID account, we recommend connecting your email so you can recover your account and enable two-factor authentication.`;
    }

    const cont = document.getElementById('cont');
    cont.innerHTML = `
        <h1 style="text-align: center;">
            <i class="material-symbols-rounded main-icon">
                security
            </i>
        </h1>
        <h1 class="main-header">Secure Your Account</h1>
        <p style="text-align: center;">${securityMessage}</p>
        <section id="security-section">
            <form id="security-form" novalidate>
                ${savedData.accountType === 'bluebird' ? `
                <div class="input-cont">
                    <span class="material-symbols-rounded">
                        email
                    </span>
                    <label for="emailConnect">Email <span class="optional">(optional)</span></label>
                    <input type="email" id="emailConnect" name="emailConnect" placeholder="you@example.com" value="${emailValue}" autocomplete="email">
                    <span id="email-connect-status" class="username-status"></span>
                    <span class="info">If you connect an email now, you can recover your account later.</span>
                </div>
                ` : `
                <div class="recommendation-box">
                    <h2>No email required</h2>
                    <p>Local accounts are private and do not require an email address.</p>
                </div>
                `}
                <div class="recommendation-box">
                    <h2>Recommended next steps</h2>
                    <ul>
                        <li>Use a strong, unique password.</li>
                        <li>Enable two-factor authentication (2FA) when available.</li>
                        <li>${hasPasskey ? 'Use a passkey if your browser supports it.' : 'Passkeys are not available in this browser.'}</li>
                        ${savedData.accountType === 'bluebird' ? '<li>Connect an email address for account recovery and notifications.</li>' : ''}
                    </ul>
                </div>
                <div class="btn-cont">
                    <button class="submit-btn" type="submit">Continue</button>
                </div>
            </form>
        </section>
    `;

    const securityForm = document.getElementById('security-form');
    const connectEmailInput = document.getElementById('emailConnect');
    const emailConnectStatusEl = document.getElementById('email-connect-status');

    if (connectEmailInput && emailConnectStatusEl) {
        connectEmailInput.addEventListener('input', () => {
            const check = validateEmailFormat(connectEmailInput.value);
            updateFieldStatus(emailConnectStatusEl, check.message, check.valid ? 'success' : 'error');
        });

        if (connectEmailInput.value.trim()) {
            const check = validateEmailFormat(connectEmailInput.value);
            updateFieldStatus(emailConnectStatusEl, check.message, check.valid ? 'success' : 'error');
        }
    }

    if (securityForm) {
        const submitButton = securityForm.querySelector('button[type="submit"]');
        securityForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            setButtonLoading(submitButton, true);
            await completeSignupAfterSecurity();
            setButtonLoading(submitButton, false);
        });
    }
}

async function signupUser(email, password, metadata = {}) {
    console.log(email);
    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
            data: metadata // Your display name or other metadata object goes here
        }
    });

    if (error) {
        console.error('Sign up error:', error);
        throw error;
    }

    return data;
}

async function createSupabaseAccount() {
    if (!savedData.email) {
        displayNotification('An email is required to create a cloud account. Please add one or choose local account.', '⚠️ ');
        return null;
    }

    try {
        const data = await signupUser(savedData.email, savedData.password, {
            displayName: savedData.username,
            full_name: savedData.name,
            account_type: savedData.accountType,
            date_of_birth: savedData.dateOfBirth || null,
        });

        displayNotification('Signup successful. A verification email has been sent.');
        console.log('Signup data:', data);
        return data;
    } catch (error) {
        displayNotification(`Signup failed: ${error.message}`, '⚠️ ');
        return null;
    }
}

async function completeSignupAfterSecurity() {
    const connectEmailInput = document.getElementById('emailConnect');
    if (connectEmailInput) {
        const enteredEmail = connectEmailInput.value.trim();
        if (enteredEmail) {
            savedData.email = enteredEmail;
        }
    }

    // If the user provided an email, ensure it's not already used in the accounts table.
    if (savedData.email) {
        const existing = await findAccountByEmail(savedData.email);
        if (existing) {
            const cont = document.getElementById('cont');
            cont.innerHTML = `
                <h1 style="text-align:center;">Existing account</h1>
                <p style="text-align:center;">An account with <strong>${savedData.email}</strong> already exists.</p>
                <div style="display:flex;gap:12px;justify-content:center;margin-top:18px;">
                    <a class="submit-btn" id="go-to-login" href="../login/index.html?email=${encodeURIComponent(savedData.email)}">Log in to this account</a>
                    <button class="submit-btn" id="use-different-email">Use a different email</button>
                </div>
            `;

            const useBtn = document.getElementById('use-different-email');
            if (useBtn) useBtn.addEventListener('click', () => {
                showSecurityScreen();
            });

            return;
        }
    }

    showScreenLoader('Saving your account details...');

    if (savedData.accountType === 'bluebird') {
        if (savedData.email) {
            const signupResponse = await createSupabaseAccount();
            if (!signupResponse) {
                hideScreenLoader();
                return;
            }

            hideScreenLoader();
            showEmailVerificationScreen(savedData.email);
            return;
        }

        await createAccountProfile(savedData.email, savedData.name, savedData.username);
        hideScreenLoader();
        displayNotification('Bluebird ID created without email. You can add it later for recovery.', '✅ ');
        finishSignupFlow();
        return;
    } else {
        await createLocalAccount({ name: savedData.name, username: savedData.username, password: hashPassword(savedData.password) })
        hideScreenLoader();
        finishSignupFlow();
    }

}

async function findAccountByEmail(email) {
    if (!email) return null;
    try {
        let { data, error } = await supabaseClient
            .from('accounts')
            .select('*')
            .eq('saved_data->>email', email)
            .single();

        if (data) return data;

        const fallback = await supabaseClient
            .from('accounts')
            .select('*')
            .eq('email', email)
            .single();

        return fallback.data || null;
    } catch (err) {
        console.error('findAccountByEmail error:', err);
        return null;
    }
}

async function autoLoginSupabase(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        displayNotification(`Auto-login failed: ${error.message}`, '⚠️ ');
        console.error('Auto-login error:', error);
        return false;
    }

    displayNotification('Logged in automatically.', '✅ ');
    console.log('Auto-login success:', data);
    return true;
}

function showEmailVerificationScreen(email) {
    const cont = document.getElementById('cont');
    cont.innerHTML = `
        <h1 style="text-align: center;">
            <i class="material-symbols-rounded main-icon">email</i>
        </h1>
        <h1 class="main-header">Verify Your Email</h1>
        <p style="text-align: center;">We sent a verification link to <strong>${email}</strong>. Open it and verify your email, then continue below.</p>
        <section class="security-screen">
            <form id="verification-form" novalidate>
                <div class="recommendation-box">
                    <h2>Didn’t receive it?</h2>
                    <p>If the email hasn’t arrived, tap resend.</p>
                </div>
                <div class="btn-cont" style="gap: 12px; flex-direction: column;">
                    <button class="submit-btn" id="verification-resend" type="button">Resend email</button>
                    <button class="submit-btn" type="submit">I verified it</button>
                </div>
                <div id="verification-status" class="username-status" style="margin-top: 18px;"></div>
            </form>
        </section>
    `;

    const verificationForm = document.getElementById('verification-form');
    const resendButton = document.getElementById('verification-resend');
    const statusEl = document.getElementById('verification-status');

    if (verificationForm) {
        verificationForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            showScreenLoader('Checking email verification...');
            const verified = await attemptEmailVerification(email, savedData.password);
            hideScreenLoader();
            if (verified) {
                statusEl.textContent = 'Email verified. Finalizing your account...';
                statusEl.className = 'username-status success';
                await createAccountProfile(savedData.email, savedData.name, savedData.username);
                finishSignupFlow();
            }
        });
    }

    if (resendButton) {
        resendButton.addEventListener('click', async () => {
            setButtonLoading(resendButton, true);
            const { success, message } = await resendVerificationEmail(email);
            setButtonLoading(resendButton, false);
            statusEl.textContent = message;
            statusEl.className = success ? 'username-status success' : 'username-status error';
        });
    }
}

async function resendVerificationEmail(email) {
    try {
        const { data, error } = await supabaseClient.auth.resend({ email, type: 'signup' });
        if (error) {
            console.error('Resend verification email failed:', error);
            return { success: false, message: 'Failed to resend verification email.' };
        }
        return { success: true, message: 'Verification email resent. Check your inbox.' };
    } catch (error) {
        console.error('Resend error:', error);
        return { success: false, message: 'Unable to resend verification email.' };
    }
}

async function attemptEmailVerification(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        displayNotification('Email not verified yet. Please confirm your email and try again.', '⚠️ ');
        return false;
    }

    return true;
}

function finishSignupFlow() {
    hideScreenLoader();
    const cont = document.getElementById('cont');
    cont.innerHTML = `
        <h1 style="text-align: center;">
            <i class="material-symbols-rounded main-icon">check_circle</i>
        </h1>
        <h1 class="main-header">All Set!</h1>
        <p style="text-align: center;">Your account setup is complete and you are logged in.</p>
        <p style="text-align: center;">You can now continue using Bluebird with your new account.</p>
        <p style="text-align: center;">You will be redirected back in a few seconds.</p>
    `;

    setTimeout(() => {
        if (urlParams.get('redirectUrl')) {
            let a = document.createElement('a');
            a.href = urlParams.get('redirectUrl');
            document.body.appendChild(a);
            a.click();
            return
        }
        history.back();
    }, 1500)
}

async function createAccountProfile(email, fullName, username) {
    const account = await insertRow('accounts', {
        name: fullName,
        username,
        email: email || null,
        password: '',
        saved_data: {
            account_type: savedData.accountType,
            email: email || null,
            date_of_birth: savedData.dateOfBirth || null,
        },
        user_settings: {},
    });

    if (!account) {
        console.error('Failed to save account row.');
        return null;
    }

    return account;
}

async function saveAccountProfile(email, fullName) {
    const profile = await createAccountProfile(email, fullName)
    if (!profile) {
        throw new Error('Unable to save account profile.')
    }
    return profile
}

function showSignupMessage(message, isError = false) {
    if (!signupMessage) return
    signupMessage.textContent = message
    signupMessage.style.color = isError ? '#c0392b' : '#1d8348'
}

function renderAccountList(accounts) {
    const userList = document.querySelector('#user-list')
    if (!userList) return
    userList.textContent = JSON.stringify(accounts, null, 2)
}