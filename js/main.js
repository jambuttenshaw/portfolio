// Basic JavaScript for portfolio interactions

// Theme handling
// The theme has three states: 'light', 'dark', and 'system' (follow the OS
// preference). The user selects one via the three options in the nav bar;
// the choice is saved (localStorage) so it persists across page navigation.
// 'system' is resolved live by CSS (prefers-color-scheme), so OS preference
// changes need no JS involvement.
const THEME_STORAGE_KEY = 'portfolio-theme';
const THEME_STATES = ['light', 'dark', 'system'];

function getSavedTheme() {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    return THEME_STATES.includes(saved) ? saved : null;
  } catch (e) {
    return null; // localStorage unavailable (e.g. private mode): no persistence
  }
}

function saveTheme(state) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, state);
  } catch (e) {
    // Persistence unavailable: theme still applies for the current visit
  }
}

function applyTheme(state) {
  const root = document.documentElement;
  // The attribute always reflects the current state; 'system' is resolved by
  // the CSS media query and the color-scheme property
  root.setAttribute('data-theme', state);
  root.style.colorScheme = state === 'system' ? 'light dark' : state;
  updateThemeToggle(state);
}

function updateThemeToggle(state) {
  // Highlight the selected option and keep its pressed state in sync
  document.querySelectorAll('#theme-toggle .theme-option').forEach(option => {
    const selected = option.dataset.themeChoice === state;
    option.classList.toggle('selected', selected);
    option.setAttribute('aria-pressed', selected ? 'true' : 'false');
  });
}

function initializeTheme() {
  // Use the saved choice if the user made one, otherwise follow the OS
  applyTheme(getSavedTheme() || 'system');

  // Theme selector: an icon button selects its state (event delegation)
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', (e) => {
      const option = e.target.closest('.theme-option');
      if (!option) {
        return;
      }
      applyTheme(option.dataset.themeChoice);
      saveTheme(option.dataset.themeChoice);
    });
  }
}

// Mobile navigation (burger menu)
// Below the 899px breakpoint the nav link list collapses behind the burger
// button; the panel itself is pure CSS (display: none / .open, see
// style.css), so this only flips the class and keeps the ARIA state in sync.
function initializeMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const panel = document.getElementById('nav-links');
  if (!toggle || !panel) {
    return;
  }

  function setNavOpen(open) {
    panel.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    const icon = toggle.querySelector('.fa');
    if (icon) {
      icon.classList.toggle('fa-bars', !open);
      icon.classList.toggle('fa-times', open);
    }
  }

  toggle.addEventListener('click', () => {
    setNavOpen(!panel.classList.contains('open'));
  });

  // Close when a page link is chosen (page loads reset the state anyway;
  // this keeps same-page anchor links tidy)
  panel.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      setNavOpen(false);
    }
  });

  // Escape closes and returns focus to the burger
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('open')) {
      setNavOpen(false);
      toggle.focus();
    }
  });

  // Tapping/clicking outside the header closes the panel
  document.addEventListener('click', (e) => {
    if (panel.classList.contains('open') && !e.target.closest('header')) {
      setNavOpen(false);
    }
  });

  // Growing past the breakpoint: drop the mobile state so nothing is stuck
  const desktopQuery = window.matchMedia('(min-width: 900px)');
  desktopQuery.addEventListener('change', (e) => {
    if (e.matches) {
      setNavOpen(false);
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  // Initialize theme
  initializeTheme();

  // Initialize mobile nav
  initializeMobileNav();

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