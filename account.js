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

    // Add cancel stream button
    const cancelStreamBtn = document.createElement('button');
    cancelStreamBtn.id = 'cancelStreamBtn';
    cancelStreamBtn.textContent = 'Cancelar Stream';
    cancelStreamBtn.classList.add('cancel-stream-btn');
    cancelStreamBtn.style.display = 'none';
    cancelStreamBtn.style.backgroundColor = 'red';
    cancelStreamBtn.style.color = 'white';

    // Insert cancel button next to other stream control buttons
    const streamControlsContainer = document.querySelector('.stream-controls');
    streamControlsContainer.appendChild(cancelStreamBtn);

    // Enhanced stream key generation with authentication
    function generateStreamKey() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return null;

        // Include user ID for extra security
        const randomPart = crypto.randomUUID().split('-')[0];
        return `${currentUser.id}_${currentUser.username}_${randomPart}`;
    }

    // Store and manage stream data with enhanced security
    function saveStreamData(streamData) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return;

        // Add authentication token to stream data
        streamData.userId = currentUser.id;
        streamData.authenticatedBy = currentUser.username;
        
        localStorage.setItem(`stream_${currentUser.id}`, JSON.stringify(streamData));
    }

    // Retrieve stream data
    function getStreamData() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return null;

        return JSON.parse(localStorage.getItem(`stream_${currentUser.id}`));
    }

    // Validate stream authentication before starting
    function validateStreamAuthentication(streamKey) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return false;

        // Split stream key to verify user authentication
        const [userId, username] = streamKey.split('_');
        
        return (
            userId === currentUser.id && 
            username === currentUser.username
        );
    }

    // Updated RTMP server validation
    function validateRTMPServer(serverUrl) {
        // Basic RTMP URL validation
        const rtmpRegex = /^rtmp:\/\/[a-zA-Z0-9.-]+(?::\d+)?\/[a-zA-Z0-9_-]+$/;
        
        if (!rtmpRegex.test(serverUrl)) {
            console.error('Invalid RTMP server URL format');
            return false;
        }

        // Optional: Ping or validate server (would require backend support)
        return true;
    }

    // Create new stream with enhanced error handling
    createStreamBtn.addEventListener('click', () => {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            alert('Você precisa estar logado para criar uma stream.');
            return;
        }

        const streamServer = serverInput.value.trim() || 'rtmp://localhost/live';
        
        // Validate RTMP server
        if (!validateRTMPServer(streamServer)) {
            alert('Formato de servidor RTMP inválido. Use o formato: rtmp://host/app');
            return;
        }

        const newStreamKey = generateStreamKey();
        
        const streamData = {
            key: newStreamKey,
            server: streamServer,
            fullStreamUrl: `${streamServer}/${newStreamKey}`, 
            createdAt: new Date().toISOString(),
            status: 'created',
            authenticatedBy: currentUser.username
        };

        saveStreamData(streamData);

        // Update UI with detailed RTMP configuration
        !streamKey && (streamKey.textContent = newStreamKey);
        streamDetails.style.display = 'block';
        createStreamBtn.style.display = 'none';
        streamStatus.textContent = 'Preparando Stream';
        streamStatus.style.color = 'orange';

        // Enhanced OBS Studio Setup Guide
        const obsInstructions = document.createElement('div');
        obsInstructions.innerHTML = `
            <h4>Configuração para OBS Studio</h4>
            <div class="rtmp-troubleshooting">
                <h5>🔧 Solução de Problemas de Conexão RTMP</h5>
                <p><strong>Dicas de Configuração:</strong></p>
                <ol>
                    <li>Verifique se o servidor RTMP está online e acessível</li>
                    <li>Confirme que a porta está aberta (geralmente 1935)</li>
                    <li>Desative firewalls temporariamente para teste</li>
                    <li>Use um servidor RTMP público como teste:</li>
                    <ul>
                        <li>live.streamingservice.com/live</li>
                        <li>rtmp.global.ssl.fastly.net/live</li>
                    </ul>
                </ol>
                <p class="warning">⚠️ Se o problema persistir, entre em contato com o suporte.</p>
            </div>
            
            <div class="obs-config">
                <h5>Configurações do OBS:</h5>
                <p><strong>Servidor:</strong> ${streamData.server}</p>
                <p><strong>Chave de Transmissão:</strong> ${newStreamKey}</p>
                <p><strong>Configuração Detalhada:</strong></p>
                <pre>
Configurações de Transmissão:
- Serviço: Personalizado
- Servidor: ${streamData.server}
- Chave de Transmissão: ${newStreamKey}
                </pre>
            </div>
        `;
        streamDetails.appendChild(obsInstructions);

        // Show cancel button when stream is being prepared
        cancelStreamBtn.style.display = 'block';
    });

    // Copy stream information for OBS
    copyStreamKeyBtn.addEventListener('click', () => {
        const currentStreamData = getStreamData();
        if (currentStreamData) {
            const obsCopyText = `Servidor: ${currentStreamData.server}
Chave: ${currentStreamData.key}`;
            
            navigator.clipboard.writeText(obsCopyText).then(() => {
                alert('Informações de transmissão copiadas para OBS!');
            });
        }
    });

    // Start stream with authentication validation
    startStreamBtn.addEventListener('click', () => {
        const currentStreamData = getStreamData();
        if (currentStreamData) {
            // Validate stream authentication
            if (!validateStreamAuthentication(currentStreamData.key)) {
                alert('Erro de autenticação. Apenas o criador pode iniciar a stream.');
                return;
            }

            currentStreamData.status = 'live';
            currentStreamData.startedAt = new Date().toISOString();
            saveStreamData(currentStreamData);

            // Update UI
            streamStatus.textContent = 'Ao Vivo';
            streamStatus.style.color = 'red';
            startStreamBtn.style.display = 'none';
            stopStreamBtn.style.display = 'block';

            // Hide cancel button when stream goes live
            cancelStreamBtn.style.display = 'none';
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

            // Ensure cancel button is hidden
            cancelStreamBtn.style.display = 'none';
        }
    });

    // Cancel stream functionality
    cancelStreamBtn.addEventListener('click', () => {
        const currentStreamData = getStreamData();
        if (currentStreamData) {
            // Remove stream data
            localStorage.removeItem(`stream_${currentStreamData.userId}`);

            // Reset UI
            streamStatus.textContent = 'Stream Cancelada';
            streamStatus.style.color = 'gray';
            
            // Hide stream details and show create stream button
            streamDetails.style.display = 'none';
            createStreamBtn.style.display = 'block';
            
            // Hide control buttons
            startStreamBtn.style.display = 'block';
            stopStreamBtn.style.display = 'none';
            cancelStreamBtn.style.display = 'none';
        }
    });

    // Load existing stream data on page load
    const existingStreamData = getStreamData();
    if (existingStreamData && existingStreamData.status !== 'ended') {
        !streamKey && (streamKey.textContent = existingStreamData.key);
        serverInput.value = existingStreamData.server || 'rtmp://localhost/live';
        streamDetails.style.display = 'block';
        createStreamBtn.style.display = 'none';

        switch(existingStreamData.status) {
            case 'created':
                streamStatus.textContent = 'Preparando Stream';
                streamStatus.style.color = 'orange';
                cancelStreamBtn.style.display = 'block';
                break;
            case 'live':
                streamStatus.textContent = 'Ao Vivo';
                streamStatus.style.color = 'red';
                startStreamBtn.style.display = 'none';
                stopStreamBtn.style.display = 'block';
                cancelStreamBtn.style.display = 'none';
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