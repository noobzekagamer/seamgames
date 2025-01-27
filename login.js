import { isUserLoggedIn } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    // Redirect to index if already logged in
    if (isUserLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }

    const mainLoginForm = document.getElementById('mainLoginForm');
    const registerForm = document.getElementById('registerForm');
    const registerToggle = document.getElementById('registerToggle');
    const loginToggle = document.getElementById('loginToggle');

    // Toggle between login and register forms
    registerToggle.addEventListener('click', () => {
        mainLoginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });

    loginToggle.addEventListener('click', () => {
        registerForm.style.display = 'none';
        mainLoginForm.style.display = 'block';
    });

    // Login form submission
    mainLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const user = users.find(u => u.username === username && u.passwordHash === btoa(password));

        if (user) {
            // Create session token
            const sessionToken = crypto.randomUUID();
            
            // Store current user with session token
            localStorage.setItem('currentUser', JSON.stringify({
                ...user,
                sessionToken: sessionToken
            }));
            sessionStorage.setItem('sessionToken', sessionToken);

            window.location.href = 'index.html';
        } else {
            alert('Usuário ou senha inválidos');
        }
    });

    // Register form submission
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Basic validation
        if (password !== confirmPassword) {
            alert('Senhas não coincidem');
            return;
        }

        const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        
        // Check if username already exists
        if (users.some(user => user.username === username)) {
            alert('Esse nome de usuário já está em uso');
            return;
        }

        // Create new user with session token
        const sessionToken = crypto.randomUUID();
        const newUser = {
            id: `user_${crypto.randomUUID()}`,
            username: username,
            passwordHash: btoa(password),
            createdAt: new Date().toISOString(),
            sessionToken: sessionToken
        };

        users.push(newUser);
        localStorage.setItem('registeredUsers', JSON.stringify(users));
        
        // Store current user with session token
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        sessionStorage.setItem('sessionToken', sessionToken);
        
        // Redirect to main site
        window.location.href = 'index.html';
    });
});