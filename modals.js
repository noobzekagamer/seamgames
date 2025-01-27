export function initializeModals() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const closeButtons = document.querySelectorAll('.close');

    loginBtn.addEventListener('click', () => {
        loginModal.style.display = 'block';
    });

    registerBtn.addEventListener('click', () => {
        registerModal.style.display = 'block';
    });

    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            loginModal.style.display = 'none';
            registerModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === loginModal) loginModal.style.display = 'none';
        if (e.target === registerModal) registerModal.style.display = 'none';
    });
}