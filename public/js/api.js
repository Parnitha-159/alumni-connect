const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('ac_token');
}

function setToken(token) {
  if (token) {
    localStorage.setItem('ac_token', token);
  } else {
    localStorage.removeItem('ac_token');
  }
}

function getUser() {
  const user = localStorage.getItem('ac_user');
  return user ? JSON.parse(user) : null;
}

function setUser(user) {
  if (user) {
    localStorage.setItem('ac_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('ac_user');
  }
}

function clearAuth() {
  localStorage.removeItem('ac_token');
  localStorage.removeItem('ac_user');
}

async function apiCall(endpoint, options = {}) {
  const token = getToken();
  
  // Set default headers
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;
  
  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);
    
    // Check if token expired or invalid (401 / 403)
    if (response.status === 401) {
      clearAuth();
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('login.html')) {
        window.location.href = '/login.html?session_expired=true';
      }
      throw new Error('Session expired. Please log in again.');
    }

    // Handle CSV or file download responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/csv')) {
      return await response.text();
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong.');
    }
    return data;
  } catch (error) {
    console.error(`API Call [${url}] Error:`, error);
    throw error;
  }
}

// Show toaster notification
function showToast(message, type = 'success') {
  let toast = document.getElementById('api-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'api-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  
  toast.style.display = 'flex';
  toast.innerText = message;
  
  if (type === 'error') {
    toast.style.borderLeftColor = '#e53e3e';
  } else {
    toast.style.borderLeftColor = '#D4A853';
  }

  setTimeout(() => {
    toast.style.display = 'none';
  }, 4000);
}
