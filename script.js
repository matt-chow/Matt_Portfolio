// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    initNavigation();
    initHamburgerMenu();
    initWorkExpand();
    initShowMore();
    initProjectCards();
    initSoftwareFilter();
});

// ===================================
// THEME MANAGEMENT
// ===================================

function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme');
    
    // Apply saved theme or default to light mode
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark-mode');
        themeToggle.checked = true;
    }
    
    // Toggle theme on checkbox change
    themeToggle.addEventListener('change', function() {
        document.documentElement.classList.toggle('dark-mode');
        const isDarkMode = document.documentElement.classList.contains('dark-mode');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    });
}

// ===================================
// NAVIGATION
// ===================================

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // If it's an internal hash link
            if (href.startsWith('#') || href.includes('#')) {
                const target = href.includes('#') ? href.split('#')[1] : href.substring(1);
                const element = document.getElementById(target);
                
                if (element) {
                    e.preventDefault();
                    element.scrollIntoView({ behavior: 'smooth' });
                    
                    // Close mobile menu if open
                    closeMobileMenu();
                }
            }
        });
    });
}

// ===================================
// HAMBURGER MENU
// ===================================

function initHamburgerMenu() {
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!hamburger.contains(event.target) && !mobileMenu.contains(event.target)) {
            closeMobileMenu();
        }
    });
}

function closeMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    
    hamburger.classList.remove('active');
    mobileMenu.classList.remove('active');
}

// ===================================
// WORK SECTION - EXPAND/COLLAPSE
// ===================================

function initWorkExpand() {
    const jobCards = document.querySelectorAll('.timeline-item-right');

    jobCards.forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();

            const item = this.closest('.timeline-item');
            if (item) {
                item.classList.toggle('is-open');
            }
        });
    });
}

// ===================================
// WORK SECTION - SHOW MORE/LESS
// ===================================

function initShowMore() {
    const topButton = document.getElementById('show-more-btn-top');
    const bottomButton = document.getElementById('show-more-btn-bottom');
    const hiddenJobs = document.getElementById('hidden-jobs');

    if (!topButton || !bottomButton || !hiddenJobs) {
        return;
    }

    const showTopButton = () => {
        topButton.classList.remove('is-initially-hidden');
    };

    const hideTopButton = () => {
        topButton.classList.add('is-initially-hidden');
    };

    const showBottomButton = () => {
        bottomButton.classList.remove('is-initially-hidden');
    };

    const hideBottomButton = () => {
        bottomButton.classList.add('is-initially-hidden');
    };

    const toggleJobs = (e) => {
        e.preventDefault();

        const isCurrentlyHidden = hiddenJobs.classList.contains('is-hidden');

        if (isCurrentlyHidden) {
            hiddenJobs.classList.remove('is-hidden');
            hideTopButton();
            showBottomButton();
        } else {
            hiddenJobs.classList.add('is-hidden');
            hideBottomButton();

            const onTransitionEnd = (event) => {
                if (event.target !== hiddenJobs || event.propertyName !== 'max-height') {
                    return;
                }
                showTopButton();
                hiddenJobs.removeEventListener('transitionend', onTransitionEnd);
            };

            hiddenJobs.addEventListener('transitionend', onTransitionEnd);
        }
    };

    topButton.addEventListener('click', toggleJobs);
    bottomButton.addEventListener('click', toggleJobs);

    if (hiddenJobs.classList.contains('is-hidden')) {
        showTopButton();
        hideBottomButton();
    } else {
        hideTopButton();
        showBottomButton();
    }
}

// ===================================
// PROJECT CARDS
// ===================================

function initProjectCards() {
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        card.addEventListener('click', function() {
            const projectId = this.getAttribute('data-project-id');
            // Navigate to project detail page (currently disabled as per spec)
            // window.location.href = `project-detail.html?id=${projectId}`;
            console.log('Project clicked:', projectId);
        });
    });
}

// ===================================
// SOFTWARE FILTER
// ===================================

function initSoftwareFilter() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const softwareItems = document.querySelectorAll('.software-item');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Get selected filter
            const filter = this.getAttribute('data-filter');
            
            // Filter software items
            softwareItems.forEach(item => {
                const categories = item.getAttribute('data-categories').split(' ');
                
                if (filter === 'all' || categories.includes(filter)) {
                    showItem(item);
                } else {
                    hideItem(item);
                }
            });
        });
    });
}

function showItem(item) {
    item.classList.remove('hidden');
    item.style.display = 'flex';
    item.style.flexDirection = 'column';
    item.style.alignItems = 'center';
}

function hideItem(item) {
    item.classList.add('hidden');
    item.style.display = 'none';
}

// ===================================
// SCROLL ANIMATIONS
// ===================================

// Add subtle animation on scroll for elements
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.6s ease-out';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe timeline items, project cards, and software items
document.addEventListener('DOMContentLoaded', function() {
    const elementsToObserve = document.querySelectorAll(
        '.timeline-item, .project-card, .software-item'
    );
    elementsToObserve.forEach(el => observer.observe(el));
});

// ===================================
// UTILITY FUNCTIONS
// ===================================

// Smooth scroll to top when clicking logo
const logo = document.querySelector('.logo');
if (logo) {
    logo.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#top') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
}

// Add active state to navigation based on scroll position
window.addEventListener('scroll', function() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').includes(current)) {
            link.classList.add('active');
        }
    });
});

// ===================================
// PERFORMANCE OPTIMIZATION
// ===================================

// Debounce function for scroll events
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// ===================================
// ACCESSIBILITY
// ===================================

// Ensure keyboard navigation works properly
document.addEventListener('keydown', function(event) {
    // Close menu on Escape key
    if (event.key === 'Escape') {
        closeMobileMenu();
    }
});
