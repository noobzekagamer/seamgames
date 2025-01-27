export function initializeAuth() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginModal = document.getElementById('loginModal');
  const registerModal = document.getElementById('registerModal');

  function registerUser(username, password) {
    const userId = `user_${crypto.randomUUID()}`;
    
    const newUser = {
      id: userId,
      username: username,
      passwordHash: btoa(password),
      createdAt: new Date().toISOString()
    };

    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    
    if (users.some(user => user.username === username)) {
      alert('Esse nome de usuário já está em uso. Escolha outro.');
      return null;
    }

    users.push(newUser);
    localStorage.setItem('registeredUsers', JSON.stringify(users));
    
    // Set current user and session token
    const sessionToken = crypto.randomUUID();
    localStorage.setItem('currentUser', JSON.stringify({
      ...newUser,
      sessionToken: sessionToken
    }));
    sessionStorage.setItem('sessionToken', sessionToken);

    return newUser;
  }

  function loginUser(username, password) {
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    
    const user = users.find(u => u.username === username);
    
    if (!user) {
      alert('Usuário não encontrado.');
      return null;
    }

    if (btoa(password) !== user.passwordHash) {
      alert('Senha incorreta.');
      return null;
    }

    // Add session token
    const sessionToken = crypto.randomUUID();
    const userWithSession = {
      ...user,
      sessionToken: sessionToken
    };

    localStorage.setItem('currentUser', JSON.stringify(userWithSession));
    sessionStorage.setItem('sessionToken', sessionToken);

    return userWithSession;
  }

  function updateUIForLoggedInUser(user) {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    
    if (loginBtn && registerBtn) {
      loginBtn.textContent = user.username;
      registerBtn.textContent = 'Sair';
      
      registerBtn.onclick = () => {
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('sessionToken');
        window.location.href = 'login.html';
      };
    }

    if (loginModal) loginModal.style.display = 'none';
  }

  function checkExistingLogin() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const storedSessionToken = sessionStorage.getItem('sessionToken');

    if (currentUser && storedSessionToken && currentUser.sessionToken === storedSessionToken) {
      updateUIForLoggedInUser(currentUser);
      return true;
    } else {
      // Logout if session token doesn't match
      localStorage.removeItem('currentUser');
      sessionStorage.removeItem('sessionToken');
      window.location.href = 'login.html';
      return false;
    }
  }

  // Login form submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = loginForm.querySelector('input[type="text"]');
      const password = loginForm.querySelector('input[type="password"]');
      
      if (username && password) {
        const user = loginUser(username.value, password.value);
        if (user) {
          updateUIForLoggedInUser(user);
          window.location.href = 'index.html';
        }
      }
    });
  }

  // Register form submission
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const usernameInput = registerForm.querySelector('input[type="text"]');
      const passwordInput = registerForm.querySelector('input[type="password"]');
      const confirmPasswordInput = registerForm.querySelectorAll('input[type="password"]')[1];
      
      if (usernameInput && passwordInput && confirmPasswordInput) {
        if (passwordInput.value !== confirmPasswordInput.value) {
          alert('As senhas não coincidem.');
          return;
        }

        if (usernameInput.value.length < 3) {
          alert('Nome de usuário deve ter pelo menos 3 caracteres.');
          return;
        }

        const user = registerUser(usernameInput.value, passwordInput.value);
        if (user) {
          updateUIForLoggedInUser(user);
          window.location.href = 'index.html';
        }
      }
    });
  }

  // Check login status on page load
  const currentPath = window.location.pathname;
  const publicPages = ['/login.html'];
  const isPublicPage = publicPages.some(page => currentPath.endsWith(page));

  if (!isPublicPage) {
    const isLoggedIn = checkExistingLogin();
    if (!isLoggedIn) {
      window.location.href = 'login.html';
    }
  }

  return { checkExistingLogin };
}

// Export for use in other modules
export function isUserLoggedIn() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const storedSessionToken = sessionStorage.getItem('sessionToken');
  return currentUser && storedSessionToken && currentUser.sessionToken === storedSessionToken;
}