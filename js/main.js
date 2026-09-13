// Basic JavaScript for portfolio interactions

// Theme handling
// The site always initializes to the OS theme. The nav bar toggle flips the
// theme for the current visit via a data-theme attribute on <html> (which
// the CSS variables respect), and live OS preference changes are followed.
function getSystemTheme() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

function applyTheme(theme) {
  const root = document.documentElement;
  // The attribute always reflects the active theme, so the CSS override works
  // regardless of the OS preference (dark is only the pre-JS default)
  root.setAttribute('data-theme', theme);
  root.style.colorScheme = theme;
  updateThemeToggle(theme);
}

function updateThemeToggle(theme) {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) {
    return;
  }
  const icon = toggle.querySelector('.fa');
  const isLight = theme === 'light';
  // Icon mirrors the active theme (moon in dark, sun in light)
  if (icon) {
    icon.classList.toggle('fa-moon-o', !isLight);
    icon.classList.toggle('fa-sun-o', isLight);
  }
  toggle.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
}

function initializeTheme() {
  // Initialize from the OS preference
  applyTheme(getSystemTheme());

  // Follow live OS preference changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
      applyTheme(e.matches ? 'light' : 'dark');
    });
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // Initialize theme
  initializeTheme();

  // Theme toggle button
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || getSystemTheme();
      applyTheme(current === 'light' ? 'dark' : 'light');
    });
  }

  // Add smooth scrolling to navigation links
  const navLinks = document.querySelectorAll('nav a');

  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      // Only apply smooth scroll for same-page anchors
      if (this.getAttribute('href').startsWith('#')) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth'
          });
        }
      }
    });
  });

  // Add active class to current page navigation
  // (prefix-match so /projects/ stays active on /projects/<slug>/ pages)
  const currentPath = window.location.pathname;
  navLinks.forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href.startsWith('#')) {
      return;
    }
    if (href === '/') {
      if (currentPath === '/' || currentPath === '/index.html') {
        link.classList.add('active');
      }
      return;
    }
    const base = href.replace(/\/+$/, '');
    if (base && (currentPath === base + '/' || currentPath.startsWith(base + '/'))) {
      link.classList.add('active');
    }
  });

  console.log('Portfolio JavaScript loaded successfully!');
});