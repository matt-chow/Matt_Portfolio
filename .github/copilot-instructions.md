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
- **index.html**: Main entry point with hero section, work timeline, projects grid (3 items), softwares section (7 cards)
- **projects.html**: Full projects page with expanded grid (9 items), shares navbar/footer with index.html
- **styles.css**: Single stylesheet (~2000+ lines); all pages link here
- **script.js**: Single JavaScript file (~520 lines); all interactive features depend on it

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

### Softwares & Category Filtering (Interactive Tech Stack - 7 Cards, 60+ Libraries)

#### HTML Structure (index.html, Lines 610-839)
```
Softwares Section
├── Filter Container
│   ├── Filter Buttons (7 buttons: All + 6 categories)
│   │   ├── All (active by default, with tooltip-hint icon)
│   │   ├── Data Science
│   │   ├── Data Engineering
│   │   ├── Backend
│   │   ├── Frontend
│   │   ├── DevOps
│   │   └── Full Stack
│   └── Software Grid (4 columns desktop, 2 columns tablet/mobile)
│       └── 7 Software Cards (68 total libraries)
│           ├── R Ecosystem (10 libs, fa-brands fa-r-project)
│           ├── Python & ML (12 libs, fa-brands fa-python)
│           ├── MS Fabric (8 libs, fa-solid fa-microchip)
│           ├── DevOps (10 libs, fa-solid fa-terminal)
│           ├── Backend & DBs (11 libs, fa-solid fa-database)
│           ├── Web Dev (9 libs, fa-brands fa-react)
│           └── Concepts (6 libs, fa-solid fa-brain)
```

**Card Structure:**
```
.software-card (data-software="x", data-categories="cat1 cat2...", data-expanded="false")
├── .software-header (clickable to toggle dropdown)
│   ├── .software-logo-container (FontAwesome icon, card identifier)
│   ├── .software-header-text
│   │   └── .software-name (h3 tag)
│   ├── .lib-badge (corner pill: accent color, total library count)
│   └── .software-chevron (fa-solid fa-chevron-down, rotates 180° on open)
└── .software-dropdown (hidden by default, max-height animation)
    └── .software-libs (scrollable for 8+ items, custom scrollbar)
        └── .software-lib (data-highlights="cat1 cat2...")
            ├── Icon (FontAwesome, semantic to library)
            └── <span> Library name
```

**Data Attributes:**
- `.software-card`: 
  - `data-software="r-ecosystem|python-ml|fabric|devops-tooling|backend-dbs|web-dev|concepts"` (card ID)
  - `data-categories="category1 category2..."` (space-separated categories for filtering)
  - `data-expanded="true|false"` (current dropdown state)
- `.software-lib`: 
  - `data-highlights="category1 category2..."` (space-separated; any match triggers highlight)
  - Supports multi-category items (e.g., `data-highlights="data-science backend"`)

**Filter Categories (6 main + All):**
- `all` - Special case: expands/collapses all cards on desktop, resets opacity on mobile
- `data-science` - ML, statistical analysis, visualization, data science frameworks
- `data-engineering` - ETL, distributed systems, pipeline orchestration, data infrastructure
- `backend` - Databases, APIs, microservices, caching, transactions
- `frontend` - UI frameworks, styling, bundling, DOM manipulation
- `devops` - Containerization, orchestration, CI/CD, infrastructure, monitoring
- `full-stack` - Cross-functional tools used in multiple domains (databases, frameworks, tooling)

**7 Software Cards with Library Mappings:**

1. **R Ecosystem** (10 libs)
   - dplyr, ggplot2, data.table, Shiny, caret, igraph, rmarkdown, tidyr, purrr, furrr
   - Icons: semantic per library (layer-group, chart-line, wand-magic-sparkles, etc.)
   - Highlights: data-science, data-engineering, frontend (Shiny)

2. **Python & ML** (12 libs)
   - pandas, numpy, scikit-learn, pytorch, tensorflow, mlflow, polars, pydantic, sqlalchemy, fastapi, airflow, huggingface
   - Icons: semantic per library (table, cube, brain, fire, sun, etc.)
   - Highlights: data-science, data-engineering, backend, full-stack

3. **MS Fabric** (8 libs)
   - Python in Fabric, Spark SQL, Semantic Models, Lakehouse Tables, Notebooks, Warehouses, Data Pipelines, Git Integration
   - Icons: python icon, bolt, cube, lake, book, warehouse, stream, git
   - Highlights: data-engineering, full-stack (Git integration)

4. **DevOps & Tooling** (10 libs)
   - Docker, Kubernetes, Git/GitHub, CI/CD (GH Actions), AWS, Azure, Terraform, Ansible, Monitoring, IaC
   - Icons: docker, ellipsis, github, rotate, aws, microsoft, code-branch, play, magnifying-glass, layer-group
   - Highlights: devops, full-stack (git, CI/CD)

5. **Backend & DBs** (11 libs)
   - PostgreSQL, MySQL, MongoDB, Redis, DynamoDB, GraphQL, REST APIs, Microservices, Event-Driven, Transactions, Caching
   - Icons: leaf, water, scroll, fire, aws, share-nodes, code, cubes, flash, link, memory
   - Highlights: backend, data-engineering (PostgreSQL, Event-Driven), full-stack (GraphQL, Microservices, Transactions), devops (Caching)

6. **Web Dev** (9 libs)
   - JavaScript, TypeScript, React, Vue, Tailwind CSS, Webpack, Next.js, SSR, Testing (Jest)
   - Icons: js, js (TypeScript), react, v, palette, cube, arrow-right, server, flask-vial
   - Highlights: frontend, full-stack, backend (Webpack, Next.js)

7. **Theoretical Concepts** (6 libs)
   - Algorithms, System Design, OOP, Functional Prog, Design Patterns, Databases
   - Icons: diagram-project, building, cubes, code-branch, chess, sitemap
   - Highlights: data-science (Algorithms, Functional Prog), backend (System Design, OOP, Design Patterns, Databases), full-stack

**Filter Button Features:**
- `.filter-btn` with `.active` state (accent background, white text)
- `.tooltip-hint` on "All" button (18px circle with "?" icon)
  - `title="Click again to toggle all dropdowns"` on hover
  - Cursor: help
  - Background: `rgba(255, 255, 255, 0.2)`, hover: `rgba(255, 255, 255, 0.5)`

#### CSS Styling (styles.css, Lines 1620-1820)

**Grid Layout:**
- `.software-grid`: `display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem` (desktop)
- **Tablet (768px)**: `grid-template-columns: repeat(2, 1fr)`
- **Mobile (480px)**: `grid-template-columns: repeat(2, 1fr)` (same as tablet)

**Filter Button Styling:**
- `.filter-buttons`: flex row, centered, `gap: var(--spacing-md)`, `flex-wrap: wrap`
- `.filter-btn`: 
  - `padding: var(--spacing-sm) var(--spacing-lg)`
  - `border: 2px solid var(--accent-color)`
  - `border-radius: 25px` (pill shape)
  - `transition: all 0.3s ease`
  - Display: flex, `align-items: center`, `gap: 0.5rem` (for tooltip-hint)
- `.filter-btn:hover`: `background-color: var(--accent-light)`
- `.filter-btn.active`: `background-color: var(--accent-color)`, `color: white`

**Dropdown with Scrollable Container:**
- `.software-libs`: 
  - `max-height: 400px; overflow-y: auto; padding-right: var(--spacing-sm)`
  - Custom scrollbar styling for Chrome/Safari (`::-webkit-scrollbar`)
  - Firefox scrollbar via `scrollbar-color` and `scrollbar-width: thin`
  - Scrollbar thumb: `rgba(255, 255, 255, 0.3)`, hover: `rgba(255, 255, 255, 0.5)`
  - `scroll-margin-top: 60px` for auto-scroll padding

**Card States (Opacity-based filtering):**
- `.software-card`: Base `opacity: 1`, `transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)`
- `.software-card.filtered-out`: `opacity: 0.35`, `pointer-events: none`
- `.software-card.filtered-in`: `opacity: 1` (explicit highlight)

**Dropdown Animations:**
- `.software-dropdown`: 
  - Initial: `max-height: 0`, `opacity: 0`, `overflow: hidden`
  - Open: `.software-card[data-expanded="true"] .software-dropdown` → `max-height: 600px`, `opacity: 1`
  - Transitions: all 0.4s cubic-bezier(0.4, 0, 0.2, 1)
  - Background: `var(--accent-color)` (#9e5466)
  - Padding when open: `var(--spacing-md) var(--spacing-lg)`

**Library Items & Highlighting:**
- `.software-lib`: 
  - `display: flex; align-items: center; gap: var(--spacing-sm)`
  - `color: white; font-size: 0.8rem; font-weight: 500`
  - Transitions: opacity, background-color, box-shadow all 0.4s cubic-bezier
  - `scroll-margin-top: 60px` (for auto-scroll) 
- `.software-lib.lib-filtered-out`: `opacity: 0.5` (non-matching in open card)
- `.software-lib.lib-highlighted`: 
  - `background-color: rgba(255, 255, 255, 0.28)`
  - `animation: libPulse 1s ease-out` (one-time, not infinite)
- `.software-lib.glowing-border`:
  - `box-shadow: 0 0 0 2px white, inset 0 0 0 1px rgba(255, 255, 255, 0.5)`
  - `transition: box-shadow 0.3s ease` (smooth glow appearance)

**Pulse Animation (One-Time):**
```css
@keyframes libPulse {
    0% {
        background-color: rgba(255, 255, 255, 0.28);
        transform: scale(1);
    }
    50% {
        background-color: rgba(255, 255, 255, 0.38);
        transform: scale(1.05);
    }
    100% {
        background-color: rgba(255, 255, 255, 0.28);
        transform: scale(1);
    }
}
```

#### JavaScript Logic (script.js, Lines 233-440)

**Initialization: `initSoftwareFilter()`**
Manages filter button clicks, dropdown interactions, and advanced animation sequencing.

**State Variables:**
- `isFilterAnimating`: Boolean gate preventing concurrent filter clicks
- `allButtonState`: Tracks "All" button state ('closed', 'open', 'reset', 'filtered')
- `allButton`: Reference to `[data-filter="all"]` button for dynamic text updates

**Advanced Features:**

1. **Dynamic Button Text** (Desktop Only):
   - "All" button text changes to "Collapse All" on first click (expands all cards)
   - Reverts to "All" when clicked again (collapses all cards)
   - Mobile behavior unaffected (resets opacities, no text change)

2. **Staggered Close Delay**:
   - All dropdowns close before filter applies (0.4s animation)
   - 0.2s additional delay before opening new dropdowns (prevents jarring transitions)
   - Improves perceived smoothness of filter transitions

3. **Auto-Scroll to Highlighted Items**:
   - Checks if highlighted library is beyond index 7 (8+ items in card)
   - Smooth scrolls highlighted item into view within `.software-libs` container
   - Uses `scrollIntoView({ behavior: 'smooth', block: 'nearest' })`
   - 150ms delay to ensure dropdown fully expanded before scroll

4. **Multi-Category Highlighting**:
   - Replaces old `data-lib-category` (single category) with `data-highlights` (multiple)
   - Example: `data-highlights="data-science backend"` matches both categories
   - Filter matches any category in `data-highlights` (OR logic, not AND)

**Filter Button Click Handler Flow:**

1. **"All" Button (data-filter="all")**:
   - If active + desktop (innerWidth ≥ 768):
     - `allButtonState === 'closed'` → expand all 7 cards with **50ms waterfall stagger**
       - Dynamically update button text: "All" → "Collapse All"
       - Set `allButtonState = 'open'`
     - `allButtonState === 'open'` → collapse all 7 cards
       - Revert button text: "Collapse All" → "All"
       - Set `allButtonState = 'closed'`
   - If active + mobile (innerWidth < 768):
     - Reset all cards to 100% opacity (remove filter classes)
     - No auto-expand behavior
     - Set `allButtonState = 'reset'`
   - If not active:
     - Activate "All" button, proceed to reset logic

2. **Category Filter Buttons** (data-filter != "all"):
   - Update active button styling
   - Set `allButtonState = 'filtered'`
   - **Close Phase** (0-400ms):
     - Close all currently open dropdowns via `data-expanded="false"`
   - **Wait Phase** (400ms):
     - Let close animation complete (0.4s cubic-bezier)
   - **Filter Phase** (400ms+):
     - For each card check `data-categories`:
       - If includes filter:
         - Add `.filtered-in` class (100% opacity)
         - **Staggered open** (starting at 200ms, 80ms per card):
           - Set `data-expanded="true"`
           - Call `highlightMatchingLibraries(card, filter)`
           - Call `autoScrollToHighlight(card)` (if 8+ items)
       - Else:
         - Add `.filtered-out` class (35% opacity)
         - Call `resetLibraryStyles(card)`

**Helper Functions:**

- `toggleSoftwareDropdown(card)`: Manual toggle independent of filter state
  - Always clickable, even during animations
  - Closes: `data-expanded="false"` + `resetLibraryStyles(card)`
  - Opens: `data-expanded="true"`

- `highlightMatchingLibraries(card, filter)`:
  - Query all `.software-lib` in card
  - Parse `data-highlights` attribute (space-separated)
  - If matches filter:
    - Add `.lib-highlighted` + `.glowing-border`
    - Remove `.lib-filtered-out`
  - Else:
    - Remove `.lib-highlighted` + `.glowing-border`
    - Add `.lib-filtered-out`

- `resetLibraryStyles(card)`:
  - Remove all filter-related classes:
    - `.lib-highlighted`, `.lib-filtered-out`, `.glowing-border`
  - Used when: closing dropdown, applying non-matching filter, clicking "All"

- `autoScrollToHighlight(card)`:
  - Get array of all `.software-lib` in card
  - Find index of first `.lib-highlighted`
  - If index > 7:
    - Wait 150ms (dropdown expand animation)
    - Call `.scrollIntoView({ behavior: 'smooth', block: 'nearest' })`

**Animation Timing Specification:**
- **Filter opacity transitions**: 0.4s cubic-bezier(0.4, 0, 0.2, 1)
- **Dropdown expand/close**: 0.4s cubic-bezier (max-height + opacity sync)
- **Chevron rotation**: 0.4s cubic-bezier (180° rotate)
- **Staggered close delay**: 0.2s before opening new dropdowns
- **Waterfall stagger (All button)**: 0.05s (50ms) per card for fluid expand
- **Filter card stagger**: 0.08s (80ms) per card for category filter
- **Pulse animation**: 1s ease-out (one-time, not infinite)
- **Glowing border transition**: 0.3s ease
- **Auto-scroll delay**: 150ms (ensures dropdown fully expanded)

**Event Listeners:**
- `.filter-btn` click: Each button has independent listener managing filter logic
- `.software-header` click: Each card header toggles dropdown + calls `e.stopPropagation()`

**No IntersectionObserver on Software Cards:**
- Software section excluded from `.project-card` and `.timeline-item` fade-in observer
- Prevents animation conflicts with filter/dropdown logic
- Manual dropdown toggle does not depend on scroll visibility

#### Integration with DOM
- **HTML**: Semantic structure with data attributes driving all state
- **CSS**: All visual changes via attributes + classes (no inline styles)
- **JavaScript**: Only sets attributes/classes; CSS handles all animations
- **Button clicks**: No `preventDefault()` needed (native buttons)
- **Event bubbling**: Only `stopPropagation()` on card header to prevent double-toggles

#### Responsive Behavior
- **Desktop (1200px)**: 4-column grid, "All" button expands/collapses with stagger, auto-scroll enabled
- **Tablet (768px)**: 2-column grid, "All" button resets opacity only (no expand), auto-scroll enabled
- **Mobile (480px)**: 2-column grid (same as tablet), tap-friendly card headers


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
- **Softwares Section** (7 cards, 68 libraries):
  - **Filter buttons**: Click each of 7 buttons (All, Data Science, Data Engineering, Backend, Frontend, DevOps, Full Stack)
    - Non-matching cards smooth fade to 35% opacity (0.4s cubic-bezier transition)
    - Matching cards stay 100% opacity and auto-expand with 80ms stagger (fluid reveal)
    - Libraries in matching cards: highlighted with glowing white border + one-time 1s pulse (scale 1 → 1.05 → 1)
    - Non-matching libraries in expanded cards: fade to 50% opacity
  - **Multi-category highlighting**: 
    - Test cards with libraries having multiple categories (e.g., dplyr: data-science + data-engineering)
    - Select "Data Science" → dplyr highlights (also highlights data-engineering libraries in same card)
    - Select "Data Engineering" → dplyr highlights again (demonstrates OR logic)
  - **Scrollable dropdowns**:
    - R Ecosystem (10 libs) → scrollbar appears when expanded
    - Python & ML (12 libs) → scrollbar visible, scroll to bottom libraries
    - DevOps (10 libs) → scrollbar working smoothly
    - Other cards without scrollbars: verify smooth dropdown animation still works
  - **Auto-scroll to highlighted items**:
    - Select "Data Engineering" → Auto-scroll to "mlflow" in Python & ML card (index 5)
    - Select "Data Engineering" again → Python card should still auto-scroll to first matching item
    - Verify smooth scroll behavior (not jarring jumps)
  - **Manual card toggle**: Click any card header to open/close independently of filter state
    - Works ALWAYS, even during active filter animations
    - Removes library highlighting when closing
    - Card remains in proper filtered/unfiltered opacity state
  - **"All" button toggle**:
    - **Desktop (≥768px)**:
      - First click with "All" active → expands all 7 cards with **50ms waterfall stagger** (fluid row-by-row)
      - Button text changes: "All" → "Collapse All"
      - Second click → collapses all 7 cards
      - Button text reverts: "Collapse All" → "All"
      - Verify tooltip hint "?" still visible on both text states
    - **Mobile (<768px)**:
      - Click "All" → resets all cards to 100% opacity, no auto-expand
      - No button text change
      - Can manually click individual cards to expand
  - **Staggered close behavior**:
    - Apply filter A (opens matching cards)
    - Immediately apply filter B while cards are expanding
    - Should not cause jank or duplicate animations
    - Verify 0.2s staggered close delay prevents overlapping opens
  - **Animation smoothness**: 
    - Rapid clicking on different filters should not cause glitching
    - Card opacity transitions should be smooth (cubic-bezier, not linear)
    - Dropdown max-height animations should sync with opacity changes
    - Chevron rotations should be smooth and aligned with dropdown expand/close
    - Glowing border appearance should have smooth 0.3s transition
  - **Filter state persistence**:
    - Select filter B, verify button stays active
    - Manually click a card in filtered state, verify it opens
    - Manually close card, verify filtering still active
    - Filter state resets only when changing to new filter or clicking "All"
- **Responsive**: Test at 1200px (desktop), 768px (tablet), 480px (mobile)
  - Softwares grid: 4 columns desktop, 2 columns tablet/mobile
  - Filter buttons wrap if screen narrow (mobile landscape)
  - Cards scale appropriately, no overflow
  - Scrollable dropdowns work on touch devices
  - Auto-scroll works on mobile (smooth scroll supported)

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
