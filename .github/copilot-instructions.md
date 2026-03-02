# Matt's Portfolio - Workspace Instructions

## Project Overview
Personal portfolio website showcasing projects, skills, and work experience. Built with vanilla HTML, CSS (with CSS variables for theming), and JavaScript. Deployed via GitHub Pages.

## Code Style

### HTML
- Use semantic HTML5 elements (`<section>`, `<nav>`, `<main>`, etc.)
- Always include `lang="en"` on `<html>` tag
- Add proper meta tags: charset (UTF-8), viewport, title, and CDN integrity hashes
- Comment section blocks clearly: `<!-- Section Name -->`
- Keep inline styles minimal; prefer CSS classes (exception: dynamic `object-fit`, `object-position`)

### CSS
- **CSS Variables**: Define all colors, spacing, transitions in `:root` (see [styles.css:1-27](styles.css#L1-L27))
  - Colors: `--bg-light`, `--bg-dark`, `--accent-color`, `--accent-light`, `--text-dark`, `--text-light`, `--white`
  - Spacing scale: `--spacing-xs` (0.5rem) through `--spacing-2xl` (4rem)
  - Transitions: `--easing-smooth` (cubic-bezier), `--transition-smooth` (0.5s), `--transition-fast` (0.25s)
- **Dark Mode** uses `html.dark-mode` class for theme switching
- Organize CSS into sections with comments (GLOBAL STYLES, NAVIGATION BAR, PROJECTS, SOFTWARES, etc.)
- Media queries: tablet (768px) and mobile (480px) breakpoints
- Use flexbox and CSS Grid for layouts; set `max-width: 1200px` on `.container`

### JavaScript
- Initialize all features in `DOMContentLoaded` event (see [script.js:5-12](script.js#L5-L12))
- Organize code into feature modules: theme, navigation, hamburger menu, work expand, project cards, software filter
- Prefix init functions with `init` (e.g., `initTheme()`, `initProjectCards()`)
- Store theme preference in `localStorage` under key `'theme'`
- Use `data-*` attributes for component state (e.g., `data-expanded="false"`, `data-project-id="1"`)
- Add `e.stopPropagation()` when handling nested click events (e.g., skills toggle)

## Architecture

### Page Structure
- **index.html**: Main entry point with hero section, work timeline, projects grid (3 items), softwares section
- **projects.html**: Full projects page with expanded grid (9 items), shares navbar/footer with index.html
- **styles.css**: Single stylesheet (1812 lines); all pages link here
- **script.js**: Single JavaScript file (363 lines); all interactive features depend on it

### Component Structure
```
Project Card (index.html & projects.html)
├── .project-image (200px height)
│   ├── Standard projects: <img> with object-fit
│   └── Badge stack projects: positioned <img> elements + drop shadows
│   └── In-progress projects: overlaid .in-progress-badge (rectangular, top-right)
├── .project-info
│   ├── .project-name (h3)
│   ├── .project-description (p)
│   └── .project-tags
│       ├── Primary tags: .tag with FontAwesome icon + text
│       └── .skills-toggle: chevron button to reveal secondary skills
│           └── .secondary-skills (hidden by default, flex-wrap)

Theme Toggle (Mobile Menu)
├── Checkbox input: #themeToggle
├── Listener: toggles html.dark-mode class, saves to localStorage

Navigation
├── .nav-link: hash-based smooth scroll (prevents default on #)
├── .hamburger: mobile menu toggle
└── Mobile menu closes on outside click
```

### Color Scheme (CSS Variables)
- **Light Mode**: `--bg-light: #dfd5cd`, `--text-dark: #303446`
- **Dark Mode**: `--bg-dark: #303446`, `--text-light: #c6d0f5`
- **Accent**: `--accent-color: #9e5466` (primary), `--accent-light: #e09ab6` (secondary)
- Use accent color for badges, hovers, and interactive elements

## Project Cards & Interactive Features

### Badge Stack (Project 1: R and Python Packages)
- Container: `.badge-stack-container` with gradient background
- Images: positioned absolutely with `filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15))`
- Left/right badges: rotated 8° inward, spaced at 10% from edges (tablet: 5%, mobile: 0% + margin)
- Center badge: z-index 2, scaled larger for prominence

### In-Progress Badge (Project 3: Planner App)
- Rectangular label (not circular): `border-radius: 4px`, padding `8px 12px`
- Contains spinning gear icon + "(In Progress)" text
- Positioned: `top: 12px; right: 12px;`
- Animation: `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`

### Skills Toggle
- Icon: `.skills-toggle` with `.fa-chevron-down` (closed) → `.fa-chevron-up` (open)
- Click handler: toggles `.expanded` class on `.secondary-skills`, updates `data-expanded` attribute
- Transition: opacity (0.3s) + max-height (0.3s) for smooth reveal
- Cursor: `default` for private Planner App card

### FontAwesome Integration
- CDN: Version 7.0.1 with integrity hash `sha512-2SwdPD6INVrV/lHTZbO2nodKhrnDdJK9/kg2XD1r9uGqPo1cUbujc+IYdlYdEErWNu69gVcYgdxlmVmzTWnetw==`
- Applied to all tags: brand icons (fa-brands fa-*) + solid icons (fa-solid fa-*)
- Icon sizing: `.tag i { font-size: 0.9em; color: white; }`

## Build and Test

### Development
- No build process required; pure HTML/CSS/JS
- Open `index.html` in browser or run a local server:
  ```bash
  # Python 3.x
  python -m http.server 8000
  # Node.js (if available)
  npx http-server
  ```
  Then visit `http://localhost:8000`

### Testing Checklist
- **Theme Toggle**: Verify dark mode persists after page reload (localStorage check)
- **Navigation**: Click nav links, ensure smooth scroll to sections
- **Hamburger Menu**: Mobile menu opens, closes on link click or outside click
- **Project Cards**: Hover effects (transform, shadow), skills toggle on Card 3
- **In-Progress Badge**: Spinning gear visible, cursor is default (not pointer)
- **Responsive**: Test at 1200px (desktop), 768px (tablet), 480px (mobile)

### Deployment
- GitHub Pages: Push to `main` branch, enable Pages in repo settings
- Branch: `main` → deployed at `https://matt-chow.github.io/`

## Project Conventions

### Naming
- **Classes**: kebab-case (e.g., `.project-card`, `.in-progress-badge`, `.skills-toggle`)
- **IDs**: kebab-case (e.g., `#themeToggle`, `#hamburger`, `#mobileMenu`)
- **Data Attributes**: kebab-case values (e.g., `data-project-id="1"`, `data-categories="data-science"`)
- **CSS Custom Properties**: kebab-case prefixed with `--` (e.g., `--bg-color`, `--accent-color`)

### Comments & Documentation
- Section headers: `/* === SECTION NAME === */` (CSS) or `// === SECTION NAME === //` (JavaScript)
- Component comments: `<!-- Component Name -->` or `// Component Name`
- Avoid over-commenting code that's self-explanatory; focus on "why" not "what"

### Images
- Location: `/images/` directory
- Formats: PNG (logos, badges), JPEG (photography), SVG (icons, graphics)
- Key files for portfolio projects:
  - `ceblr.png`, `usports.svg`, `rvolleydata.svg` (Project 1 badges)
  - `peaksandprimes.jpeg` (Project 2)
  - `plannerapp.png` (Project 3)

### Page Synchronization
- Any changes to **Projects section** on index.html MUST be replicated on projects.html
- Both use same `.project-card` structure and script.js event listeners
- FontAwesome CDN link must match across both files (7.0.1 + integrity hash)

## Integration Points

### External Dependencies
- **Google Fonts**: Inter (400, 500, 600, 700 weights) via CDN
- **FontAwesome 7.0.1**: Brands and solid icons via CDN with SRI
- **No frameworks**: Vanilla JS, CSS Grid/Flexbox only

### Internal Links
- Smooth scroll: hash-based navigation (`#work`, `#projects`, `#softwares`)
- Cross-page: `projects.html` links to `index.html#projects` via nav
- Resume: `resume.pdf` linked in mobile menu (external file, handled by browser download)

### Local Storage
- Key: `'theme'`
- Values: `'dark'` or `'light'`
- Used by: `initTheme()` to persist dark mode preference

## Security & Best Practices

### Accessibility
- Use semantic HTML for better screen reader interpretation
- Alt text on images (e.g., `alt="CEBLR"` for badges)
- Sufficient color contrast: accent colors meet WCAG AA standards
- Mobile button sizes: min 44px × 44px for touch targets

### Performance
- Single CSS file (1812 lines) prevents render-blocking CSS fetches
- Single JS file (363 lines) loads after DOM content
- CSS animations use `transform` and `opacity` (GPU-accelerated)
- Lazy loading not yet implemented; add if portfolio grows

### Form & User Data
- No form submissions or user data collection in current implementation
- Theme preference stored locally (client-side only)
- Resume download handled by browser (no server processing)

### Code Organization
- Keep HTML free of inline event handlers; use `.addEventListener()` in script
- Avoid modifying DOM during scroll events (debounce if needed)
- Use `e.stopPropagation()` to prevent unintended event bubbling
