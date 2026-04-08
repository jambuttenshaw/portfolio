// Basic JavaScript for portfolio interactions

// Theme Detection
function initializeTheme() {
  // Check if user has a saved theme preference
  const savedTheme = localStorage.getItem('theme');
  
  if (savedTheme) {
    // Use saved preference
    applyTheme(savedTheme);
  } else {
    // Check OS preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      applyTheme('light');
    } else {
      // Default to dark theme
      applyTheme('dark');
    }
  }
  
  // Listen for OS preference changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
      // Only auto-switch if user hasn't set a preference
      if (!localStorage.getItem('theme')) {
        applyTheme(e.matches ? 'light' : 'dark');
      }
    });
  }
}

function applyTheme(theme) {
  if (theme === 'light') {
    document.documentElement.style.colorScheme = 'light';
  } else {
    document.documentElement.style.colorScheme = 'dark';
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // Initialize theme
  initializeTheme();
  
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
  const currentPath = window.location.pathname;
  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });

  console.log('Portfolio JavaScript loaded successfully!');
});