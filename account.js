import { initializeAuth } from './auth.js';
import { initializePostCreation } from './posts.js';
import { initializeModals } from './modals.js';

function initializeAccountPage() {
    const editProfileBtn = document.getElementById('editProfileBtn');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const profileName = document.getElementById('profileName');
    const profileDescription = document.getElementById('profileDescription');
    const avatarUpload = document.getElementById('avatarUpload');
    const profileAvatar = document.getElementById('profileAvatar');
    const myPostsContainer = document.getElementById('myPostsContainer');

    // Load existing profile data
    function loadProfileData() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            const userProfile = JSON.parse(localStorage.getItem(`profile_${currentUser.id}`) || '{}');
            
            profileName.value = userProfile.name || currentUser.username;
            profileDescription.value = userProfile.description || '';
            
            if (userProfile.avatarData) {
                profileAvatar.src = userProfile.avatarData;
            } else {
                // Default avatar if no profile picture
                profileAvatar.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23888"><circle cx="50" cy="50" r="40"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="30">' + 
                    currentUser.username.charAt(0).toUpperCase() + 
                    '</text></svg>';
            }
        }
    }

    // Save profile data
    function saveProfileData() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            const profileData = {
                name: profileName.value,
                description: profileDescription.value,
                avatarData: profileAvatar.src,
                lastUpdated: new Date().toISOString()
            };

            // Save profile to localStorage
            localStorage.setItem(`profile_${currentUser.id}`, JSON.stringify(profileData));
            
            // Update currentUser with profile name
            currentUser.displayName = profileName.value;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            alert('Perfil salvo com sucesso!');
        }
    }

    // Edit profile functionality
    editProfileBtn.addEventListener('click', () => {
        profileName.disabled = false;
        profileDescription.disabled = false;
        editProfileBtn.style.display = 'none';
        saveProfileBtn.style.display = 'block';
        avatarUpload.style.display = 'block';
    });

    // Save profile changes
    saveProfileBtn.addEventListener('click', () => {
        saveProfileData();
        
        profileName.disabled = true;
        profileDescription.disabled = true;
        editProfileBtn.style.display = 'block';
        saveProfileBtn.style.display = 'none';
        avatarUpload.style.display = 'none';
    });

    // Avatar upload
    avatarUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                profileAvatar.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Initial load of profile data
    loadProfileData();

    // Render user's posts
    function renderUserPosts(posts) {
        myPostsContainer.innerHTML = ''; // Clear existing posts
        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.classList.add('user-post');
            
            let mediaHtml = '';
            if (post.media) {
                if (post.mediaType === 'image') {
                    mediaHtml = `<img src="${post.media}" alt="Post Media">`;
                } else if (post.mediaType === 'video') {
                    mediaHtml = `
                        <video controls style="max-width:100%; height:auto;">
                            <source src="${post.media}" type="video/${post.media.split(';')[0].split('/')[1]}">
                            Seu navegador não suporta vídeos.
                        </video>
                    `;
                }
            }

            postElement.innerHTML = `
                <div class="post-content">
                    ${post.text ? `<p>${post.text}</p>` : ''}
                    ${mediaHtml}
                </div>
                <div class="post-actions">
                    <button class="edit-post-btn">Editar</button>
                    <button class="delete-post-btn">Excluir</button>
                </div>
            `;
            myPostsContainer.appendChild(postElement);
        });
    }

    // Placeholder for user posts
    const userPosts = [
        { text: 'Minha primeira publicação!', media: null },
        { text: 'Outro post importante', media: null }
    ];
    renderUserPosts(userPosts);
}

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

function initializeStreamCreation() {
    const createStreamBtn = document.getElementById('createStreamBtn');
    const streamDetails = document.getElementById('streamDetails');
    const serverInput = document.getElementById('serverInput');  
    const streamKey = document.getElementById('streamKey');
    const streamStatus = document.getElementById('streamStatus');
    const copyStreamKeyBtn = document.getElementById('copyStreamKeyBtn');
    const startStreamBtn = document.getElementById('startStreamBtn');
    const stopStreamBtn = document.getElementById('stopStreamBtn');

    // Function to generate a unique stream key
    function generateStreamKey() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return null;

        // Generate a complex, hard-to-guess stream key
        const key = `${currentUser.id}_${crypto.randomUUID()}_${Date.now()}`;
        return btoa(key).replace(/=/g, ''); // Base64 encode and remove padding
    }

    // Store and manage stream data
    function saveStreamData(streamData) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return;

        localStorage.setItem(`stream_${currentUser.id}`, JSON.stringify(streamData));
    }

    // Retrieve stream data
    function getStreamData() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return null;

        return JSON.parse(localStorage.getItem(`stream_${currentUser.id}`));
    }

    // Create new stream
    createStreamBtn.addEventListener('click', () => {
        const newStreamKey = generateStreamKey();
        const streamServer = serverInput.value || 'rtmp://live.seamgames.com/live';
        
        const streamData = {
            key: newStreamKey,
            server: streamServer,
            createdAt: new Date().toISOString(),
            status: 'created'
        };

        saveStreamData(streamData);

        // Update UI
        streamKey.textContent = newStreamKey;
        streamDetails.style.display = 'block';
        createStreamBtn.style.display = 'none';
        streamStatus.textContent = 'Preparando Stream';
        streamStatus.style.color = 'orange';
    });

    // Copy stream key
    copyStreamKeyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(streamKey.textContent).then(() => {
            alert('Chave de transmissão copiada!');
        });
    });

    // Start stream
    startStreamBtn.addEventListener('click', () => {
        const currentStreamData = getStreamData();
        if (currentStreamData) {
            currentStreamData.status = 'live';
            currentStreamData.startedAt = new Date().toISOString();
            saveStreamData(currentStreamData);

            // Update UI
            streamStatus.textContent = 'Ao Vivo';
            streamStatus.style.color = 'red';
            startStreamBtn.style.display = 'none';
            stopStreamBtn.style.display = 'block';
        }
    });

    // Stop stream
    stopStreamBtn.addEventListener('click', () => {
        const currentStreamData = getStreamData();
        if (currentStreamData) {
            currentStreamData.status = 'ended';
            currentStreamData.endedAt = new Date().toISOString();
            saveStreamData(currentStreamData);

            // Reset UI
            streamStatus.textContent = 'Stream Encerrada';
            streamStatus.style.color = 'gray';
            stopStreamBtn.style.display = 'none';
            createStreamBtn.style.display = 'block';
            streamDetails.style.display = 'none';
        }
    });

    // Load existing stream data on page load
    const existingStreamData = getStreamData();
    if (existingStreamData && existingStreamData.status !== 'ended') {
        streamKey.textContent = existingStreamData.key;
        serverInput.value = existingStreamData.server || 'rtmp://live.seamgames.com/live';
        streamDetails.style.display = 'block';
        createStreamBtn.style.display = 'none';

        switch(existingStreamData.status) {
            case 'created':
                streamStatus.textContent = 'Preparando Stream';
                streamStatus.style.color = 'orange';
                break;
            case 'live':
                streamStatus.textContent = 'Ao Vivo';
                streamStatus.style.color = 'red';
                startStreamBtn.style.display = 'none';
                stopStreamBtn.style.display = 'block';
                break;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
    initializePostCreation();
    initializeModals();
    initializeThemeToggle();
    initializeAccountPage();
    initializeStreamCreation();
});