document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  checkPageAccess();
});

function renderNavbar() {
  const user = getUser();
  const navbar = document.getElementById('main-navbar');
  if (!navbar) return;

  let navLinksHtml = `
    <li><a href="/index.html" class="${isActive('/index.html') ? 'active' : ''}">Home</a></li>
    <li><a href="/stories.html" class="${isActive('/stories.html') ? 'active' : ''}">Success Stories</a></li>
  `;

  if (user) {
    navLinksHtml += `
      <li><a href="/directory.html" class="${isActive('/directory.html') ? 'active' : ''}">Alumni Directory</a></li>
      <li><a href="/discussion.html" class="${isActive('/discussion.html') ? 'active' : ''}">Discussion Forum</a></li>
      <li><a href="/jobs.html" class="${isActive('/jobs.html') ? 'active' : ''}">Job Board</a></li>
      <li><a href="/events.html" class="${isActive('/events.html') ? 'active' : ''}">Events</a></li>
    `;

    if (user.role === 'student') {
      navLinksHtml += `<li><a href="/mentorship.html" class="${isActive('/mentorship.html') ? 'active' : ''}">Mentors</a></li>`;
    }
  }

  let userSectionHtml = '';
  if (user) {
    userSectionHtml = `
      <div class="nav-user">
        <span style="font-weight: 500; font-size: 0.9rem;">Hello, <strong>${user.name}</strong> (${user.role.toUpperCase()})</span>
        <a href="/dashboard.html" class="btn btn-primary" style="padding: 0.4rem 1rem; font-size: 0.85rem;">Dashboard</a>
        <button onclick="handleLogout()" class="btn btn-secondary" style="padding: 0.4rem 1rem; font-size: 0.85rem;">Logout</button>
      </div>
    `;
  } else {
    userSectionHtml = `
      <div class="nav-user">
        <a href="/login.html" class="btn-nav-auth">Sign In / Register</a>
      </div>
    `;
  }

  navbar.innerHTML = `
    <div class="nav-brand">
      <span>Alumni Connect</span>
      <span class="college-tag">VSB ECE</span>
    </div>
    <ul class="nav-links">
      ${navLinksHtml}
    </ul>
    ${userSectionHtml}
  `;
}

function isActive(path) {
  return window.location.pathname === path || (path === '/index.html' && window.location.pathname === '/');
}

function checkPageAccess() {
  const user = getUser();
  const path = window.location.pathname;

  // Pages requiring login
  const privatePages = [
    '/directory.html',
    '/dashboard.html',
    '/profile.html',
    '/mentorship.html',
    '/jobs.html',
    '/events.html',
    '/discussion.html'
  ];

  const isPrivate = privatePages.some(p => path.includes(p));

  if (isPrivate && !user) {
    window.location.href = `/login.html?redirect=${encodeURIComponent(path)}`;
    return;
  }

  // Admin pages access control
  if (path.includes('dashboard.html') && user) {
    // Role-based rendering is handled on the dashboard page, so no redirect needed here.
  }
}

function handleLogout() {
  clearAuth();
  window.location.href = '/index.html';
}
