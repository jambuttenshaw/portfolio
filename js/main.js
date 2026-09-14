// Basic JavaScript for portfolio interactions

// Theme handling
// The site initializes to the saved theme if the user has made an explicit
// choice via the nav bar toggle, otherwise to the OS theme. The toggle's
// choice is saved (localStorage) so it persists across page navigation, and
// live OS preference changes are followed until the user makes a choice.
const THEME_STORAGE_KEY = 'portfolio-theme';

function getSystemTheme() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

function getSavedTheme() {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : null;
  } catch (e) {
    return null; // localStorage unavailable (e.g. private mode): no persistence
  }
}

function saveTheme(theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {
    // Persistence unavailable: theme still applies for the current visit
  }
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
  // Use the saved choice if the user made one, otherwise follow the OS
  applyTheme(getSavedTheme() || getSystemTheme());

  // Follow live OS preference changes until the user makes an explicit choice
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
      if (!getSavedTheme()) {
        applyTheme(e.matches ? 'light' : 'dark');
      }
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
      const next = current === 'light' ? 'dark' : 'light';
      applyTheme(next);
      saveTheme(next);
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