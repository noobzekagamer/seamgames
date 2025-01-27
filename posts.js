export function initializePostCreation() {
    const postForm = document.getElementById('postForm');
    const mediaUpload = document.getElementById('mediaUpload');
    const feedContainer = document.getElementById('feedContainer');

    // Guard clause to prevent errors if elements don't exist
    if (!postForm || !mediaUpload || !feedContainer) {
        console.warn('Post creation elements not found. Skipping initialization.');
        return;
    }

    function limitPostStorage(userId, maxPosts = 10) {
        let userPosts = JSON.parse(localStorage.getItem(`posts_${userId}`) || '[]');
        
        // Trim posts if exceeding max limit
        if (userPosts.length > maxPosts) {
            userPosts = userPosts.slice(0, maxPosts);
            localStorage.setItem(`posts_${userId}`, JSON.stringify(userPosts));
        }
    }

    function savePost(post) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return null;

        // Get existing posts or initialize empty array
        const userPosts = JSON.parse(localStorage.getItem(`posts_${currentUser.id}`) || '[]');
        
        // Generate unique post ID
        post.id = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        post.userId = currentUser.id;
        post.username = currentUser.username;
        
        // If media is too large, truncate it
        if (post.media && post.media.length > 5000000) { // 5MB limit
            post.media = post.media.substring(0, 5000000);
            console.warn('Video file truncated due to size limitations');
        }
        
        // Add new post to beginning of array
        userPosts.unshift(post);
        
        try {
            // Save posts back to localStorage
            localStorage.setItem(`posts_${currentUser.id}`, JSON.stringify(userPosts));
            
            // Limit number of stored posts
            limitPostStorage(currentUser.id);
        } catch (error) {
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                // Remove oldest posts if quota is exceeded
                while (userPosts.length > 5) {
                    userPosts.pop();
                }
                localStorage.setItem(`posts_${currentUser.id}`, JSON.stringify(userPosts));
                console.warn('Exceeded storage quota. Removed oldest posts.');
            } else {
                console.error('Error saving post:', error);
                return null;
            }
        }
        
        return post;
    }

    function loadPosts() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return [];

        // Collect posts from all users
        const allUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        let allPosts = [];

        allUsers.forEach(user => {
            const userPosts = JSON.parse(localStorage.getItem(`posts_${user.id}`) || '[]');
            allPosts = allPosts.concat(userPosts);
        });

        // Sort posts by timestamp (most recent first)
        return allPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 50); // Limit to 50 posts
    }

    function renderPosts(posts) {
        if (!feedContainer) return;
        
        feedContainer.innerHTML = ''; // Clear existing posts
        
        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.classList.add('post');
            postElement.dataset.postId = post.id;
            
            // Safely handle media creation
            let mediaHtml = '';
            if (post.media && post.mediaType === 'video') {
                try {
                    mediaHtml = `
                        <video controls style="max-width:100%; height:auto;">
                            <source src="${post.media}" type="video/${post.media.split(';')[0].split('/')[1]}">
                            Seu navegador não suporta vídeos.
                        </video>
                    `;
                } catch (error) {
                    console.error('Error creating media URL:', error);
                }
            }

            postElement.innerHTML = `
                <div class="post-content">
                    <p class="post-author">Postado por: ${post.username}</p>
                    ${post.text ? `<p>${post.text}</p>` : ''}
                    ${mediaHtml}
                </div>
                <div class="post-interactions">
                    <div class="interaction-buttons">
                        <button class="like-btn"> Gostei (${post.likes || 0})</button>
                        <button class="dislike-btn"> Não Gostei (${post.dislikes || 0})</button>
                        <button class="comment-btn"> Comentar (${post.comments ? post.comments.length : 0})</button>
                    </div>
                </div>
                <div class="comments-section" style="display:none;">
                    <div class="comments-list"></div>
                    <form class="comment-form">
                        <input type="text" placeholder="Escreva um comentário..." required>
                        <button type="submit">Enviar</button>
                    </form>
                </div>
            `;

            // Add event listeners for interactions
            const likeBtn = postElement.querySelector('.like-btn');
            const dislikeBtn = postElement.querySelector('.dislike-btn');
            const commentBtn = postElement.querySelector('.comment-btn');
            const commentForm = postElement.querySelector('.comment-form');
            const commentsSection = postElement.querySelector('.comments-section');
            const commentsList = postElement.querySelector('.comments-list');

            // Like functionality
            likeBtn.addEventListener('click', () => {
                const currentUser = JSON.parse(localStorage.getItem('currentUser'));
                if (!currentUser) return;

                const allPosts = loadPosts();
                const postIndex = allPosts.findIndex(p => p.id === post.id);
                if (postIndex !== -1) {
                    allPosts[postIndex].likes = (allPosts[postIndex].likes || 0) + 1;
                    
                    // Update localStorage for the specific user's posts
                    localStorage.setItem(`posts_${post.userId}`, JSON.stringify(
                        JSON.parse(localStorage.getItem(`posts_${post.userId}`) || '[]')
                            .map(p => p.id === post.id ? allPosts[postIndex] : p)
                    ));

                    likeBtn.textContent = ` Gostei (${allPosts[postIndex].likes})`;
                }
            });

            // Dislike functionality
            dislikeBtn.addEventListener('click', () => {
                const currentUser = JSON.parse(localStorage.getItem('currentUser'));
                if (!currentUser) return;

                const allPosts = loadPosts();
                const postIndex = allPosts.findIndex(p => p.id === post.id);
                if (postIndex !== -1) {
                    allPosts[postIndex].dislikes = (allPosts[postIndex].dislikes || 0) + 1;
                    
                    // Update localStorage for the specific user's posts
                    localStorage.setItem(`posts_${post.userId}`, JSON.stringify(
                        JSON.parse(localStorage.getItem(`posts_${post.userId}`) || '[]')
                            .map(p => p.id === post.id ? allPosts[postIndex] : p)
                    ));

                    dislikeBtn.textContent = ` Não Gostei (${allPosts[postIndex].dislikes})`;
                }
            });

            // Comment functionality
            commentBtn.addEventListener('click', () => {
                commentsSection.style.display = commentsSection.style.display === 'none' ? 'block' : 'none';
                
                // Render existing comments
                if (post.comments && post.comments.length > 0) {
                    commentsList.innerHTML = post.comments.map(comment => 
                        `<div class="comment">
                            <strong>${comment.username}</strong>: ${comment.text}
                        </div>`
                    ).join('');
                }
            });

            // Add comment form submission
            commentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const commentInput = commentForm.querySelector('input');
                const commentText = commentInput.value.trim();
                
                const currentUser = JSON.parse(localStorage.getItem('currentUser'));
                if (!currentUser || !commentText) return;

                const allPosts = loadPosts();
                const postIndex = allPosts.findIndex(p => p.id === post.id);
                if (postIndex !== -1) {
                    const newComment = {
                        username: currentUser.username,
                        text: commentText,
                        timestamp: new Date().toISOString()
                    };

                    // Add comment to post
                    allPosts[postIndex].comments = allPosts[postIndex].comments || [];
                    allPosts[postIndex].comments.push(newComment);
                    
                    // Update localStorage for the specific user's posts
                    localStorage.setItem(`posts_${post.userId}`, JSON.stringify(
                        JSON.parse(localStorage.getItem(`posts_${post.userId}`) || '[]')
                            .map(p => p.id === post.id ? allPosts[postIndex] : p)
                    ));

                    // Render new comment
                    const commentElement = document.createElement('div');
                    commentElement.classList.add('comment');
                    commentElement.innerHTML = `<strong>${newComment.username}</strong>: ${newComment.text}`;
                    commentsList.appendChild(commentElement);

                    // Update comment count
                    commentBtn.textContent = ` Comentar (${allPosts[postIndex].comments.length})`;

                    // Clear input
                    commentInput.value = '';
                }
            });

            // Prepend to feed container
            feedContainer.prepend(postElement);
        });
    }

    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const postTextElement = document.getElementById('postText');
        if (!postTextElement) {
            console.error('Post text element not found');
            return;
        }

        const postText = postTextElement.value;
        const mediaFile = mediaUpload.files[0];

        // Validate video file
        if (mediaFile && !mediaFile.type.startsWith('video/')) {
            alert('Por favor, envie apenas arquivos de vídeo.');
            return;
        }

        // Validate file size (max 10MB)
        if (mediaFile && mediaFile.size > 10 * 1024 * 1024) {
            alert('O arquivo de vídeo não pode exceder 10MB.');
            return;
        }

        // Read video file as base64 if exists
        if (mediaFile) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const post = {
                    text: postText,
                    media: reader.result,
                    mediaType: 'video',
                    timestamp: new Date().toISOString(),
                    likes: 0,
                    dislikes: 0,
                    comments: []
                };

                // Save and render post
                const savedPost = savePost(post);
                if (savedPost) {
                    renderPosts(loadPosts());
                    
                    // Reset form
                    postForm.reset();
                }
            };
            reader.readAsDataURL(mediaFile);
        } else {
            const post = {
                text: postText,
                timestamp: new Date().toISOString(),
                likes: 0,
                dislikes: 0,
                comments: []
            };

            // Save and render post
            const savedPost = savePost(post);
            if (savedPost) {
                renderPosts(loadPosts());
                
                // Reset form
                postForm.reset();
            }
        }
    });

    // Initial load of posts
    renderPosts(loadPosts());
}