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
        const isComingSoon = card.getAttribute('data-coming-soon') === 'true';
        
        card.addEventListener('click', function(e) {
            const projectId = this.getAttribute('data-project-id');
            
            if (isComingSoon) {
                e.preventDefault();
                alert('This project repository is currently private. Coming soon!');
                return;
            }
            
            // Navigate to project detail page (currently disabled as per spec)
            // window.location.href = `project-detail.html?id=${projectId}`;
            console.log('Project clicked:', projectId);
        });

        // Handle skills toggle click
        const skillsToggle = card.querySelector('.skills-toggle');
        if (skillsToggle) {
            skillsToggle.addEventListener('click', function(e) {
                e.stopPropagation();
                const isExpanded = this.getAttribute('data-expanded') === 'true';
                const secondarySkills = card.querySelector('.secondary-skills');
                
                if (!isExpanded) {
                    secondarySkills.classList.add('expanded');
                    secondarySkills.style.display = 'flex';
                    this.setAttribute('data-expanded', 'true');
                    this.innerHTML = '<i class="fa-solid fa-chevron-up"></i>';
                } else {
                    secondarySkills.classList.remove('expanded');
                    setTimeout(() => {
                        secondarySkills.style.display = 'none';
                    }, 300);
                    this.setAttribute('data-expanded', 'false');
                    this.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
                }
            });
        }
    });
}

// ===================================
// SOFTWARE FILTER & DROPDOWN INTERACTIONS
// ===================================

function initSoftwareFilter() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const softwareCards = document.querySelectorAll('.software-card');
    const allButton = document.querySelector('[data-filter="all"]');
    let isFilterAnimating = false;
    let allButtonState = 'closed'; // Tracks whether "All" cards are expanded or collapsed
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (isFilterAnimating) return; // Prevent rapid clicks
            isFilterAnimating = true;
            
            // STRICT RESET: Remove all ghost highlights from the entire section FIRST
            const allLibraries = document.querySelectorAll('.software-lib');
            allLibraries.forEach(lib => {
                lib.classList.remove('glowing-border', 'lib-highlighted');
            });
            
            const filter = this.getAttribute('data-filter');
            const isCurrentlyActive = this.classList.contains('active');
            
            // Special handling for "All" button
            if (filter === 'all') {
                if (isCurrentlyActive) {
                    // "All" is already active - toggle expand/collapse behavior
                    const isMobile = window.innerWidth < 768;
                    
                    if (!isMobile) {
                        // Desktop: toggle expand/collapse with waterfall stagger
                        if (allButtonState === 'closed') {
                            // Expand all cards with waterfall stagger (50ms per card)
                            allButtonState = 'open';
                            allButton.textContent = 'Collapse All';
                            
                            let staggerDelay = 0;
                            softwareCards.forEach(card => {
                                setTimeout(() => {
                                    card.setAttribute('data-expanded', 'true');
                                }, staggerDelay);
                                staggerDelay += 50; // 50ms stagger per card for waterfall effect
                            });
                        } else {
                            // Collapse all cards
                            allButtonState = 'closed';
                            allButton.textContent = 'All';
                            
                            softwareCards.forEach(card => {
                                card.setAttribute('data-expanded', 'false');
                                resetLibraryStyles(card);
                            });
                        }
                    } else {
                        // Mobile: just reset opacities to 100%, no expand behavior
                        softwareCards.forEach(card => {
                            card.classList.remove('filtered-out', 'filtered-in');
                            resetLibraryStyles(card);
                        });
                        allButtonState = 'reset';
                    }
                    
                    isFilterAnimating = false;
                    return;
                } else {
                    // "All" is not active yet - activate it normally
                    allButtonState = 'reset';
                    allButton.textContent = 'All';
                }
            } else {
                // Non-"All" filter selected
                allButtonState = 'filtered';
            }
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Step 1: CLOSE all currently open dropdowns
            const openCards = Array.from(softwareCards).filter(card => card.getAttribute('data-expanded') === 'true');
            
            openCards.forEach(card => {
                card.setAttribute('data-expanded', 'false');
            });
            
            // Wait for dropdown close animation (0.4s) + staggered close delay (0.2s)
            setTimeout(() => {
                if (filter === 'all') {
                    // Reset everything - remove all filter classes and highlights
                    softwareCards.forEach(card => {
                        card.classList.remove('filtered-out', 'filtered-in');
                        resetLibraryStyles(card);
                    });
                } else {
                    // Apply transparency filter
                    let staggerDelay = 0;
                    
                    softwareCards.forEach(card => {
                        const categories = card.getAttribute('data-categories').split(' ');
                        
                        if (categories.includes(filter)) {
                            // Matching card - full opacity
                            card.classList.remove('filtered-out');
                            card.classList.add('filtered-in');
                            
                            // Staggered close delay (0.2s) before opening new dropdown
                            setTimeout(() => {
                                card.setAttribute('data-expanded', 'true');
                                highlightMatchingLibraries(card, filter);
                                // Auto-scroll to highlight library items if beyond index 8
                                autoScrollToHighlight(card);
                            }, 200); // 0.2s staggered close delay
                            
                            staggerDelay += 80; // 80ms stagger between cards
                        } else {
                            // Non-matching card - dimmed
                            card.classList.remove('filtered-in');
                            card.classList.add('filtered-out');
                            resetLibraryStyles(card);
                        }
                    });
                }
                
                isFilterAnimating = false;
            }, 400); // Wait for dropdown close animation (0.4s)
        });
    });
    
    // Add dropdown toggle handlers for manual interaction
    softwareCards.forEach(card => {
        const header = card.querySelector('.software-header');
        header.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleSoftwareDropdown(card);
        });
    });
}

function toggleSoftwareDropdown(card) {
    const isExpanded = card.getAttribute('data-expanded') === 'true';
    
    if (isExpanded) {
        // Close dropdown
        card.setAttribute('data-expanded', 'false');
        resetLibraryStyles(card);
    } else {
        // Open dropdown
        card.setAttribute('data-expanded', 'true');
    }
}

function highlightMatchingLibraries(card, filter) {
    const libs = card.querySelectorAll('.software-lib');
    libs.forEach(lib => {
        const highlights = lib.getAttribute('data-highlights');
        if (highlights && highlights.split(' ').includes(filter)) {
            lib.classList.add('lib-highlighted', 'glowing-border');
            lib.classList.remove('lib-filtered-out');
        } else {
            lib.classList.remove('lib-highlighted', 'glowing-border');
            lib.classList.add('lib-filtered-out');
        }
    });
}

function resetLibraryStyles(card) {
    const libs = card.querySelectorAll('.software-lib');
    libs.forEach(lib => {
        lib.classList.remove('lib-highlighted', 'lib-filtered-out', 'glowing-border');
    });
}

function autoScrollToHighlight(card) {
    const libs = card.querySelectorAll('.software-lib');
    const libsArray = Array.from(libs);
    const highlightedIndex = libsArray.findIndex(lib => lib.classList.contains('lib-highlighted'));
    
    // If highlighted item is beyond index 7 (8+ items), smooth scroll into view
    if (highlightedIndex > 7) {
        const libsContainer = card.querySelector('.software-libs');
        const highlightedLib = libsArray[highlightedIndex];
        if (libsContainer && highlightedLib) {
            // Slight delay to ensure dropdown is expanded before scrolling
            setTimeout(() => {
                highlightedLib.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            }, 150);
        }
    }
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
            entry.target.classList.add('animate-fade-in-up');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe timeline items and project cards (exclude software cards to prevent animation conflicts)
document.addEventListener('DOMContentLoaded', function() {
    const elementsToObserve = document.querySelectorAll(
        '.timeline-item, .project-card'
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
