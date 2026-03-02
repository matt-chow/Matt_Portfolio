# Matt's Portfolio - Workspace Instructions

## Project Overview
Personal portfolio website showcasing projects, skills, and work experience. Built with vanilla HTML, CSS (with CSS variables for theming), and JavaScript. Deployed via GitHub Pages.

**Key Sections:**
- **Hero**: Introduction with social links and tech pipeline animation
- **Work Timeline**: Employment history with expandable details
- **Projects**: Showcase of 3 featured projects (9 total on projects.html)
- **Softwares**: Interactive category-filtered tech stack with expandable sub-libraries
- **Navigation**: Smooth-scroll nav with dark mode toggle and mobile hamburger menu

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
- **styles.css**: Single stylesheet (~1958 lines); all pages link here
- **script.js**: Single JavaScript file (~480 lines); all interactive features depend on it

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

### Softwares & Category Filtering (Interactive Tech Stack)

#### HTML Structure (index.html, Lines 610-783)
```
Softwares Section
├── Filter Container
│   ├── Filter Buttons (6 categories + All button)
│   │   ├── All (active by default, with tooltip-hint icon)
│   │   ├── Data Science
│   │   ├── Frontend
│   │   ├── Backend
│   │   ├── Full Stack
│   │   └── DevOps
│   └── Software Grid (4 columns desktop, 2 columns mobile)
│       └── 6 Software Cards
│           ├── R (4 libs): tidyverse, rvest, plotly, shiny
│           ├── Python (7 libs): pydantic, sqlalchemy, numpy, pandas, pytorch, scikit-learn, pyspark
│           ├── SQL (4 libs): CTEs, Window Functions, AzureSQL, MSSQL
│           ├── Power BI (4 libs): DAX, PowerQuery, M, Data Modeling
│           ├── Web Dev (6 libs): JavaScript, HTML, CSS, React, FastAPI, Node.js
│           └── DevOps (4 libs): Docker, Git/GitHub, CI/CD, AzureDB
```

**Card Structure:**
```
.software-card (data-software="x", data-categories="cat1 cat2", data-expanded="false")
├── .software-header (clickable to toggle dropdown)
│   ├── .software-logo-container (FontAwesome icon)
│   ├── .software-header-text
│   │   └── .software-name (h3 tag)
│   ├── .lib-badge (corner pill: accent color, white text, number only)
│   └── .software-chevron (fa-solid fa-chevron-down, rotates 180° when open)
└── .software-dropdown (hidden by default, expands with max-height animation)
    └── .software-libs
        └── .software-lib (data-lib-category="category")
            ├── Icon (FontAwesome, specific icons per library)
            └── <span> Library name
```

**Data Attributes:**
- `.software-card`: 
  - `data-software="r|python|sql|powerbi|web|devops"` (card identifier)
  - `data-categories="category1 category2..."` (comma-separated filter categories)
  - `data-expanded="true|false"` (current dropdown state)
- `.software-lib`: `data-lib-category="category"` (library's primary category for highlighting)

**Filter Button Features:**
- `.filter-btn` with `.active` state (accent background, white text)
- `.tooltip-hint` on "All" button (small circle with "?" icon, help cursor)
- Title attribute: "Click again to toggle all dropdowns"

**Special Library Mappings:**
- **NumPy**: `fa-solid fa-cube` (not generic fa-code)
- **All others**: Semantically matched FontAwesome icons (fa-brands when available, fa-solid otherwise)

#### CSS Styling (styles.css, Lines 1575-1800)

**Grid Layout:**
- `.software-grid`: `display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem` (desktop)
- **Tablet (768px)**: `grid-template-columns: repeat(2, 1fr)`
- **Mobile (480px)**: `grid-template-columns: repeat(2, 1fr)` (same as tablet)
- `.filter-container`: `margin-bottom: var(--spacing-xl)`

**Filter Button Styling:**
- `.filter-buttons`: flex row, centered, gap md, flex-wrap
- `.filter-btn`: 
  - `padding: var(--spacing-sm) var(--spacing-lg)`
  - `border: 2px solid var(--accent-color)`
  - `border-radius: 25px` (pill shape)
  - `transition: all 0.3s ease`
  - Display: flex, align-items center, gap 0.5rem (for tooltip-hint)
- `.filter-btn:hover`: `background-color: var(--accent-light)`
- `.filter-btn.active`: `background-color: var(--accent-color)`, `color: white`

**Tooltip Hint:**
- `.tooltip-hint`: 18px circle, `border-radius: 50%`, centered flex container
- Background: `rgba(255, 255, 255, 0.2)`
- `cursor: help`
- `.filter-btn.active .tooltip-hint`: `background-color: rgba(255, 255, 255, 0.4)`
- Hover: `background-color: rgba(255, 255, 255, 0.5)` with 0.3s transition

**Library Badge Corner Indicator:**
- `.lib-badge`: Positioned absolutely (top: 12px, right: 12px)
  - `background-color: var(--accent-color)` (#9e5466)
  - `color: white`
  - `font-size: 0.75rem`, `font-weight: 700`
  - `padding: 4px 8px`, `border-radius: 12px`
  - `min-width: 24px`, `min-height: 24px`, flex centered
  - `box-shadow: 0 2px 8px rgba(158, 84, 102, 0.3)`

**Card States (Opacity-based, no display toggling):**
- `.software-card`: Base `opacity: 1`, smooth transition 0.4s cubic-bezier
- `.software-card.filtered-out`: `opacity: 0.35`, `pointer-events: none` (prevents interaction)
- `.software-card.filtered-in`: `opacity: 1` (explicit highlight)

**Dropdown Animations:**
- `.software-dropdown`: 
  - Initial: `max-height: 0`, `opacity: 0`, `overflow: hidden`
  - Open: `max-height: 600px`, `opacity: 1`
  - Transitions: all 0.4s cubic-bezier(0.4, 0, 0.2, 1)
  - `background-color: var(--accent-color)` (#9e5466)
  - `padding: var(--spacing-md) var(--spacing-lg)` (when expanded)
- `.software-card[data-expanded="true"] .software-dropdown`: Visible state

**Chevron Icon Animation:**
- `.software-chevron`: Absolute positioned (bottom md, right md)
  - `transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)`
  - `position: absolute`
- `.software-card[data-expanded="true"] .software-chevron`: `transform: rotate(180deg)`

**Library Items & Highlighting:**
- `.software-lib`: 
  - Display: flex, align-items center, gap sm
  - `color: white`, `font-size: 0.8rem`, `font-weight: 500`
  - Transitions: opacity, background-color, box-shadow all 0.4s cubic-bezier
- `.software-lib.lib-filtered-out`: `opacity: 0.5` (fade out when not matching filter)
- `.software-lib.lib-highlighted`: 
  - `background-color: rgba(255, 255, 255, 0.28)`
  - `animation: libPulse 2s ease-in-out infinite;`
  - Applied when library matches active filter category
- `.software-lib.glowing-border` (added when highlighted):
  - `box-shadow: 0 0 0 2px white, inset 0 0 0 1px rgba(255, 255, 255, 0.5)`
  - Creates white outline + subtle inner border effect

**Pulse Animation:**
```css
@keyframes libPulse {
    0%, 100% {
        background-color: rgba(255, 255, 255, 0.28);
        transform: scale(1);
    }
    50% {
        background-color: rgba(255, 255, 255, 0.38);
        transform: scale(1.03);
    }
}
```

#### JavaScript Logic (script.js, Lines 233-385)

**Initialization: `initSoftwareFilter()`**
Manages filter button clicks, dropdown interactions, and animation sequencing.

**State Variables:**
- `isFilterAnimating`: Boolean flag gating concurrent filter clicks
- `allButtonState`: Tracks "All" button state ('closed', 'open', 'reset', 'filtered')

**Filter Button Click Handler:**

1. **"All" Button Logic:**
   - If already active AND desktop (innerWidth ≥ 768):
     - **First click**: `allButtonState = 'closed'` → expand all matching cards (waterfall stagger 50ms)
     - **Second click**: `allButtonState = 'open'` → collapse all cards
   - If already active AND mobile (innerWidth < 768):
     - Reset all opacities to 100%, disable expand behavior, `allButtonState = 'reset'`
   - If not currently active: Set to pending, proceed to normal filter logic

2. **Category Filter Logic (non-"All" buttons):**
   - Update active button styling
   - Set `allButtonState = 'filtered'`
   - Close Phase (0-400ms):
     - Set `isFilterAnimating = true`
     - Loop all cards, set `data-expanded="false"`
     - Call `resetLibraryStyles(card)` for each
   - Wait Phase (400ms timeout):
     - Let dropdown close animations complete
   - Filter Phase (400ms+):
     - Loop all cards, check `data-categories` attribute
     - If categories include filter:
       - Add `.filtered-in` class
       - Stagger expansion with setTimeout: `setTimeout(() => { card.setAttribute('data-expanded', 'true'); highlightMatchingLibraries(...); }, index * 80)`
     - Else:
       - Add `.filtered-out` class
       - Call `resetLibraryStyles(card)`
   - Set `isFilterAnimating = false`

**Toggle Function: `toggleSoftwareDropdown(card)`**
- Direct attribute toggle: `data-expanded = !current`
- If closing: Call `resetLibraryStyles(card)`
- CSS handles all animations (no JS animation delays)
- Works independently of filter state (always clickable)

**Highlight Function: `highlightMatchingLibraries(card, filter)`**
- Loop `.software-lib` elements in card
- If `data-lib-category === filter`:
  - Add `.lib-highlighted` + `.glowing-border` classes
  - Remove `.lib-filtered-out` class
- Else:
  - Remove `.lib-highlighted` + `.glowing-border` classes
  - Add `.lib-filtered-out` class

**Reset Function: `resetLibraryStyles(card)`**
- Remove all filter-related classes from card's libraries:
  - `.lib-highlighted`
  - `.lib-filtered-out`
  - `.glowing-border`

**Event Delegation:**
- `.filter-btn` click handlers: Managed in loop, each has independent listener
- `.software-header` click handlers: Added in loop, `e.stopPropagation()` to prevent bubbling

**Animation Timing Specification:**
- **All opacity transitions**: 0.4s cubic-bezier(0.4, 0, 0.2, 1)
- **Dropdown expand/close**: 0.4s cubic-bezier (max-height + opacity sync)
- **Chevron rotation**: 0.4s cubic-bezier
- **Filter stagger**: 80ms delay between matching card expansions
- **Waterfall stagger (All button)**: 50ms delay per card for fluid row-by-row reveal
- **Filter wait timeout**: 400ms (allows dropdown close before filter phase)
- **Pulse animation**: 2s ease-in-out infinite (scale 1 → 1.03 → 1)

**No IntersectionObserver on Software Cards:**
- Software section explicitly excluded from fadeIn animation observer
- Only `.timeline-item` and `.project-card` are observed
- This prevents animation conflicts with filter/dropdown logic

#### Integration with DOM
- **HTML**: Semantic structure with data attributes driving all state
- **CSS**: All visual changes via attributes + classes (no inline styles)
- **JavaScript**: Only sets attributes/classes; letting CSS handle animations
- **Button clicks**: preventDefault() not needed (buttons, not form controls)
- **Event bubbling**: Manual `stopPropagation()` on card header clicks only

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
- **Softwares Section**:
  - **Filter buttons**: Click each category (Data Science, Frontend, Backend, Full Stack, DevOps)
    - Non-matching cards smooth fade to 35% opacity (0.4s cubic-bezier transition)
    - Matching cards stay 100% opacity and auto-expand with 80ms stagger (fluid reveal)
    - Libraries in matching cards: highlighted with glowing white border + 2s pulse animation
    - Non-matching libraries in expanded cards: fade to 50% opacity
  - **Manual card toggle**: Click any card header to open/close independently of filter state
    - Works ALWAYS, even during active filter animations
    - Removes library highlighting when closing
  - **"All" button toggle**:
    - **Desktop**: First click with "All" active → expands all 6 cards with 50ms waterfall stagger
    - **Desktop**: Second click with all open → collapses all 6 cards
    - **Mobile**: Click "All" → resets all cards to 100% opacity, no auto-expand
    - Tooltip hint ("?") displays "Click again to toggle all dropdowns" on hover
  - **Animation smoothness**: Multiple rapid filter clicks during animation don't cause flickering or jank
  - **Dropdown close behavior**: All dropdowns close before filter applies (400ms wait timeout)
- **Responsive**: Test at 1200px (desktop), 768px (tablet), 480px (mobile)
  - Softwares grid: 4 columns desktop, 2 columns tablet/mobile

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
- **Softwares section** appears only on index.html (not replicated on projects.html)
- If adding Softwares to projects.html in future, ensure filter event listeners and data attributes are identically configured

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
- Single CSS file (~1958 lines) prevents render-blocking CSS fetches
- Single JS file (~480 lines) loads after DOM content
- CSS animations use `transform`, `opacity`, and `max-height` (GPU-accelerated)
- Lazy loading not yet implemented; add if portfolio grows
- Software filtering uses opacity-based visibility (35% for filtered-out) rather than display toggling for smooth transitions

### Form & User Data
- No form submissions or user data collection in current implementation
- Theme preference stored locally (client-side only)
- Resume download handled by browser (no server processing)

### Code Organization
- Keep HTML free of inline event handlers; use `.addEventListener()` in script
- Avoid modifying DOM during scroll events (debounce if needed)
- Use `e.stopPropagation()` to prevent unintended event bubbling
