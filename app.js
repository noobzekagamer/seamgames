import { initializeAuth } from './auth.js';
import { initializePostCreation } from './posts.js';
import { initializeModals } from './modals.js';

function initializeThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    
    // Check for saved theme preference or default to light theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        
        // Save theme preference
        const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
        localStorage.setItem('theme', currentTheme);
        
        // Update button text
        themeToggle.textContent = currentTheme === 'dark' ? '☀️ Tema Claro' : '🌙 Tema Escuro';
    });

    // Set initial button text
    themeToggle.textContent = savedTheme === 'dark' ? '☀️ Tema Claro' : '🌙 Tema Escuro';
}

document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
    initializePostCreation();
    initializeModals();
    initializeThemeToggle();
});