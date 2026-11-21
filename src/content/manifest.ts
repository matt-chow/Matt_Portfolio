// Single source of truth for every fact on the site.
// Sources: R = Resume_F26.pdf, S = previous portfolio site (Matthew's own copy),
// G = public GitHub README/API, A = planning/PORTFOLIO_CONTENT_AUDIT.md (verified 2026-11-07).
// Never add a claim without a source; put unknowns in contentTodos instead.

export type PackId = 'starter' | 'experience' | 'highlights' | 'skills' | 'prototype' | 'personal';

export interface Link {
  label: string;
  href: string;
}

export interface CardContent {
  id: string;
  pack: PackId;
  title: string;
  subtitle?: string;
  kicker?: string; // dates, category or venue
  subset?: string;
  summary: string;
  details?: string[];
  tags?: string[];
  links?: Link[];
  image?: string; // path under public/
  motif: string; // procedural art key, see ui/Art.tsx
  hue: number; // accent hue for the artwork, constant across themes
  source: string;
}

export const profile = {
  name: 'Matthew Chow',
  tagline: 'Builds data systems and applied-AI tools, and does open-source sports research.',
  sub: 'Economics at Waterloo · data science & engineering in the Canadian public sector · R packages on CRAN.',
  email: 'mchowcl@gmail.com',
  resume: 'https://matt-chow.github.io/resume/cv.pdf',
  github: 'https://github.com/matt-chow',
  linkedin: 'https://www.linkedin.com/in/mchowcl/',
  devpost: 'https://devpost.com/mchowcl',
};

const starter: CardContent[] = [
  {
    id: 'uwaterloo', pack: 'starter', title: 'University of Waterloo', subtitle: "Candidate, Bachelor's of Honours Economics",
    kicker: '2022 – 2027', summary: 'Honours Economics at the University of Waterloo in Waterloo, Ontario.',
    details: ['Waterloo, Ontario', 'Program dates 2022 – 2027'], motif: 'mortarboard', hue: 45, source: 'R',
  },
  {
    id: 'github', pack: 'starter', title: 'GitHub', subtitle: '@matt-chow', kicker: 'Code',
    summary: 'R packages, hackathon builds and side projects, in the open.',
    links: [{ label: 'github.com/matt-chow', href: profile.github }], motif: 'branch', hue: 260, source: 'R, G',
  },
  {
    id: 'linkedin', pack: 'starter', title: 'LinkedIn', subtitle: '/in/mchowcl', kicker: 'Network',
    summary: 'Professional profile and work history.',
    links: [{ label: 'linkedin.com/in/mchowcl', href: profile.linkedin }], motif: 'handshake', hue: 205, source: 'R',
  },
  {
    id: 'email', pack: 'starter', title: 'Email', subtitle: profile.email, kicker: 'Contact',
    summary: 'The quickest way to reach me.',
    links: [{ label: profile.email, href: `mailto:${profile.email}` }], motif: 'envelope', hue: 0, source: 'R',
  },
  {
    id: 'resume', pack: 'starter', title: 'Résumé', subtitle: 'PDF', kicker: 'Fall 2026',
    summary: 'One page: experience, projects, skills and education.',
    links: [{ label: 'Open résumé (PDF)', href: profile.resume }], motif: 'document', hue: 120, source: 'R, S',
  },
  {
    id: 'devpost', pack: 'starter', title: 'Devpost', subtitle: '@mchowcl', kicker: 'Hackathons',
    summary: 'Hackathon submissions.',
    links: [{ label: 'devpost.com/mchowcl', href: profile.devpost }], motif: 'brackets', hue: 190, source: 'R',
  },
];

const experience: CardContent[] = [
  {
    id: 'infc', pack: 'experience', subset: 'Featured', title: 'Infrastructure Canada', subtitle: 'Applied AI & Data Science',
    kicker: 'Sept 2026 – Present · Ottawa', motif: 'scan', hue: 0, source: 'R',
    summary: 'Document intelligence: turning invoices and scans into structured data.',
    details: ['Contributing to a document intelligence pipeline using LayoutLMv3 and quantized Mistral to classify invoices and convert unstructured PDFs, JPEGs and scanned files into structured JSON.'],
    tags: ['LayoutLMv3', 'Mistral', 'Document AI'],
  },
  {
    id: 'energy', pack: 'experience', subset: 'Featured', title: 'Ministry of Energy', subtitle: 'Data Scientist',
    kicker: 'May – Aug 2026 · Toronto', motif: 'bolt', hue: 48, source: 'R',
    summary: 'A natural-language data assistant and smart-meter ETL.',
    details: [
      'Supported development of an internal Databricks Genie-based AI assistant through prompt engineering and UI development, enabling natural-language access to organizational datasets for analysts and policy teams.',
      'Built PySpark, SQL and Delta Lake ETL pipelines to ingest and transform high-volume hourly smart meter data.',
    ],
    tags: ['Databricks', 'PySpark', 'SQL', 'Delta Lake', 'Prompt engineering'],
  },
  {
    id: 'tpa', pack: 'experience', subset: 'Featured', title: 'Toronto Parking Authority', subtitle: 'Data Analyst',
    kicker: 'Jan – Apr 2026 · Toronto', motif: 'ledger', hue: 140, source: 'R, S',
    summary: 'Reconciling millions of financial records across databases.',
    details: [
      'Analyzed and reconciled 5 million+ transactional and financial records across multiple Azure-hosted databases, using CTE-based transformations, joins and window functions to validate cross-system consistency.',
      'Improved data quality by finding and resolving multiple upstream errors in the data warehouse through SQL-based auditing of financial and operational datasets (the organization reports $1.3B+ in annual revenue).',
      'Designed and maintained reusable SQL validation workflows that automate recurring data checks for reporting and monthly close.',
    ],
    tags: ['SQL', 'MSSQL', 'Azure SQL', 'Power BI', 'DAX'],
  },
  {
    id: 'uw-math', pack: 'experience', subset: 'Featured', title: 'University of Waterloo', subtitle: 'Data Engineer · Faculty of Math',
    kicker: 'May – Aug 2025 · Waterloo', motif: 'pipeline', hue: 280, source: 'R',
    summary: 'Sports data scrapers, daily pipelines and three R packages.',
    details: [
      'Designed web scrapers with rate limiting, error handling and batching to extract millions of rows of box-score and play-by-play data despite upstream site bugs and schema inconsistencies.',
      'Developed and released 3 R data packages with CI/CD, testing, documentation, vignettes and versioned releases, supporting 5,000+ downloads.',
      'Automated daily scraping pipelines with GitHub Actions and cron, pulling from APIs, dynamic JavaScript sites and HTML tables.',
    ],
    tags: ['R', 'Python', 'GitHub Actions', 'Web scraping', 'CI/CD'],
  },
  {
    id: 'uw-analyst', pack: 'experience', subset: 'Supplemental', title: 'University of Waterloo', subtitle: 'Data Analyst',
    kicker: 'Sept – Dec 2024', motif: 'chart', hue: 300, source: 'S',
    summary: 'Survey analysis behind a campus housing report.',
    details: [
      'Analyzed housing trends from 5,000+ survey respondents with t-tests, ANOVA, chi-square and z-tests to inform building renovation decisions.',
      'Presented findings to directors and administrators through R (ggplot2, plotly, dplyr) and Excel dashboards included in an official report.',
    ],
    tags: ['R', 'Statistics', 'Excel'],
  },
  {
    id: 'uwaggs', pack: 'experience', subset: 'Supplemental', title: 'UWAGGS', subtitle: 'President',
    kicker: 'Est. May 2026', motif: 'trophy', hue: 30, source: 'R, A',
    summary: 'University of Waterloo Analytics Group for Games and Sports.',
    details: ['President of the University of Waterloo Analytics Group for Games and Sports, established May 2026.'],
    links: [{ label: 'UWAGGS on GitHub', href: 'https://github.com/uwaggs' }], tags: ['Leadership', 'Sports analytics'],
  },
  {
    id: 'softron', pack: 'experience', subset: 'Career Foundations', title: 'Softron Tax', subtitle: 'Junior Tax Accountant',
    kicker: 'Jan – Apr 2023', motif: 'ledger', hue: 210, image: 'images/softrontaxlogo.png', source: 'S',
    summary: 'Personal tax returns under deadline pressure.',
    details: [
      'Explained tax concepts and tailored advice to clients.',
      'Learned personal-tax theory within the first month.',
      'Reviewed financial paperwork accurately under constant time constraints.',
    ],
  },
  {
    id: 'primecare', pack: 'experience', subset: 'Career Foundations', title: 'Prime+ Care Health', subtitle: 'Physiotherapist Assistant',
    kicker: 'May – Sept 2023', motif: 'heart', hue: 350, image: 'images/primecare.png', source: 'S',
    summary: 'Patient programs and a faster intake.',
    details: ['Created an awareness and exercise program focused on simple mobility and pain reduction.', 'Streamlined the intake process to reduce waiting time.'],
  },
  {
    id: 'hub', pack: 'experience', subset: 'Career Foundations', title: 'Hub Climbing', subtitle: 'Gym Staff',
    kicker: 'May – Sept 2022', motif: 'mountain', hue: 20, image: 'images/hubclimbinglogo.png', source: 'S',
    summary: 'Front desk and safety orientations at a climbing gym.',
    details: ['Ran safety orientations, handled customer inquiries and payments.', 'Sold retail products including shoes, chalk and memberships.'],
  },
  {
    id: 'macpc', pack: 'experience', subset: 'Career Foundations', title: 'Mac and PC Repair Depot', subtitle: 'Computer Repair Technician',
    kicker: 'Sept 2020 – Feb 2021', motif: 'chip', hue: 180, image: 'images/macandpclogo.png', source: 'S',
    summary: 'Hardware repair, malware removal and data recovery.',
    details: ['Repaired, replaced and assembled computer hardware; removed viruses and malware; set up software; recovered data.', 'Entered product data onto the store website.'],
  },
  {
    id: 'srp', pack: 'experience', subset: 'Career Foundations', title: 'Strategic Retail Partners Canada', subtitle: 'Warehouse Labourer',
    kicker: 'Jul – Aug 2019', motif: 'box', hue: 25, image: 'images/srplogo.png', source: 'S',
    summary: 'Inventory, packing and shipment counts.',
    details: ['Organized inventory, packaged and counted incoming and outgoing shipments.'],
  },
];

const highlights: CardContent[] = [
  {
    id: 'rvolleydata', pack: 'highlights', title: 'rvolleydata & pyvolleydata', subtitle: 'Co-author · Open source',
    kicker: 'Open source · CRAN', motif: 'volleyball', hue: 330, image: 'images/rvolleydata.svg', source: 'R, A',
    summary: "Open data packages for professional women's volleyball.",
    details: [
      'Co-author (CRAN "aut") of the R package; companion Python package pyvolleydata.',
      'Scraping, a medallion-style data layout, validation and GitHub Actions automation, released on CRAN.',
      'Covers three professional leagues (per the CMSAC 2025 poster).',
    ],
    tags: ['R', 'Python', 'CRAN', 'GitHub Actions'],
    links: [{ label: 'Package site', href: 'https://awosoga.github.io/rvolleydata/' }],
  },
  {
    id: 'ceblr', pack: 'highlights', title: 'ceblR', subtitle: 'Co-author · Open source',
    kicker: 'Open source · CRAN', motif: 'basketball', hue: 20, image: 'images/ceblr.png', source: 'R, A',
    summary: 'Canadian Elite Basketball League data for R.',
    details: ['Co-author (CRAN "aut") of an R package serving CEBL box-score and play-by-play data.'],
    tags: ['R', 'CRAN'], links: [{ label: 'Package site', href: 'https://awosoga.github.io/ceblR/' }],
  },
  {
    id: 'usportsr', pack: 'highlights', title: 'usportsR', subtitle: 'Contributor · Open source',
    kicker: 'Open source', motif: 'pennant', hue: 0, image: 'images/usports.svg', source: 'R, A',
    summary: 'U SPORTS (Canadian university athletics) data for R.',
    details: ['Contributor to the UWAGGS package for U SPORTS data.'],
    tags: ['R'], links: [{ label: 'Package site', href: 'https://uwaggs.github.io/usportsR/' }],
  },
  {
    id: 'peaks', pack: 'highlights', title: 'Peaks and primes', subtitle: 'Significance 21(3), 6–9 · 2024',
    kicker: 'Publication', motif: 'peaks', hue: 210, image: 'images/peaksandprimes.jpeg', source: 'A (Crossref)',
    summary: '"Do athletes get one shot at glory?" — a peer-reviewed magazine article.',
    details: ['Awosoga, D. & Chow, M. Peaks and primes: Do athletes get one shot at glory? Significance, 21(3), 6–9 (2024).'],
    tags: ['Sports science', 'Statistics'],
    links: [{ label: 'doi:10.1093/jrssig/qmae038', href: 'https://doi.org/10.1093/jrssig/qmae038' }],
  },
  {
    id: 'cassis', pack: 'highlights', title: 'CASSIS 2024 poster', subtitle: 'Peaks and primes',
    kicker: 'Presentation', motif: 'easel', hue: 160, source: 'A',
    summary: 'Poster presentation of the Peaks and primes research.',
    details: ['Presented the Peaks and primes work as a poster at CASSIS 2024.'], tags: ['Research'],
  },
  {
    id: 'cmsac', pack: 'highlights', title: 'CMSAC 2025 poster', subtitle: 'Serving Up Professional Women\'s Volleyball Data',
    kicker: 'Presentation', motif: 'easel', hue: 330, source: 'A',
    summary: 'rvolleydata and pyvolleydata at the Carnegie Mellon Sports Analytics Conference.',
    details: ['Du, Chow, Awosoga. "rvolleydata and pyvolleydata: Serving Up Professional Women\'s Volleyball Data." CMSAC 2025 poster.'],
    tags: ['Research', 'Sports analytics'],
  },
  {
    id: 'printdnd', pack: 'highlights', title: 'PrintDND', subtitle: 'Hack the North 2026 · 2nd Place, Best Use of BracketBot',
    kicker: 'Hackathon', motif: 'robot', hue: 270, source: 'R, A',
    summary: 'A robot that clears 3D printers between jobs.',
    details: ['Led teleoperation data collection (100+ episodes) and quality auditing to fine-tune a PI0.5 vision-language-action model.'],
    tags: ['Robotics', 'VLA models', 'Data quality'],
    links: [{ label: 'printdnd.vercel.app', href: 'https://printdnd.vercel.app' }],
  },
  {
    id: 'unifai', pack: 'highlights', title: 'unif.ai', subtitle: 'LA Hacks 2026 · 2nd Place, Design (Paper Track)',
    kicker: 'Hackathon', motif: 'sprites', hue: 95, source: 'R',
    summary: 'A live world of AI agents meeting each other.',
    details: [
      'Designed sprite assets in Paper and co-built "World", a PixiJS visualizer of live multi-agent conversations.',
      'Implemented LLM-based judging of agent-to-agent chemistry and logistics, and contributed to backend deployment.',
    ],
    tags: ['PixiJS', 'LLMs', 'Design'],
  },
  {
    id: 'parallax', pack: 'highlights', title: 'PARALLAX', subtitle: 'NASA Space Apps Challenge 2026',
    kicker: 'Hackathon', motif: 'stars', hue: 230, source: 'G',
    summary: 'An open observatory for the changing infrared sky.',
    details: ["Lines up NASA SPHEREx archive images of the same patch of sky so anyone can blink between epochs and inspect what changed — and never claims a discovery."],
    tags: ['TypeScript', 'Three.js', 'Astronomy'],
    links: [{ label: 'nsah2026.vercel.app', href: 'https://nsah2026.vercel.app' }, { label: 'Source', href: 'https://github.com/matt-chow/nsah2026' }],
  },
  {
    id: 'directory', pack: 'highlights', title: 'Directory', subtitle: 'Personal operating environment',
    kicker: 'Software', motif: 'grid', hue: 25, source: 'G',
    summary: 'Planner, notes, files and an assistant — offline-capable, on one Cloudflare Worker.',
    details: [
      'React PWA and Rust API served by one Cloudflare Worker, with D1 for structured data and a private R2 bucket for files.',
      'Passkey sign-in; offline edits queue and sync. Status: MVP on staging.',
    ],
    tags: ['Rust', 'React', 'Cloudflare'], links: [{ label: 'Source', href: 'https://github.com/matt-chow/jarvis' }],
  },
];

// Skill tokens list where each skill is evidenced, so none is a bare claim.
const skill = (id: string, title: string, kicker: string, summary: string, hue: number, source = 'R'): CardContent =>
  ({ id: `skill-${id}`, pack: 'skills', title, kicker, summary, motif: 'token', hue, source });

const skills: CardContent[] = [
  skill('r', 'R', 'Language', 'Three CRAN-track data packages; survey statistics.', 210),
  skill('python', 'Python', 'Language', 'pyvolleydata, scrapers, data pipelines.', 50),
  skill('sql', 'SQL', 'Language', 'CTEs, window functions and validation workflows on 5M+ records.', 190),
  skill('pyspark', 'PySpark', 'Data platform', 'Smart-meter ETL at the Ministry of Energy.', 25),
  skill('delta', 'Delta Lake', 'Data platform', 'Lakehouse tables for hourly meter data.', 175),
  skill('databricks', 'Databricks', 'Data platform', 'Genie-based assistant and ETL.', 10),
  skill('fabric', 'Microsoft Fabric', 'Data platform', 'Listed on résumé.', 160),
  skill('powerbi', 'Power BI', 'Analytics', 'Reporting with DAX and Power Query (M).', 45),
  skill('azuresql', 'Azure SQL · MSSQL', 'Data platform', 'Cross-database reconciliation at TPA.', 205),
  skill('js', 'JavaScript', 'Language', 'Web projects and this site.', 55),
  skill('ts', 'TypeScript', 'Language', 'PARALLAX, Njidion and other public repos.', 215, 'G'),
  skill('rust', 'Rust', 'Language', 'The Directory API.', 20, 'G'),
  skill('java', 'Java', 'Language', 'Listed on résumé.', 15),
  skill('vba', 'VBA', 'Language', 'Listed on résumé.', 130),
  skill('latex', 'LaTeX', 'Tool', 'Typesets the résumé.', 0),
  skill('html', 'HTML & CSS', 'Language', 'Portfolio and project sites.', 25),
  skill('git', 'Git & GitHub', 'Practice', 'Version control across every project.', 10),
  skill('cicd', 'CI/CD', 'Practice', 'GitHub Actions for daily scrapes and package checks.', 265),
  skill('pkgdev', 'Package development', 'Practice', 'Tests, docs, vignettes, versioned releases.', 300),
  skill('scraping', 'Web scraping', 'Practice', 'Rate-limited scrapers over APIs, JS sites and HTML tables.', 90),
  skill('dataviz', 'Data visualization', 'Practice', 'ggplot2, plotly and dashboards.', 330),
  skill('stats', 'Statistical testing', 'Practice', 't-tests, ANOVA, chi-square, z-tests.', 240, 'S'),
  skill('prompt', 'Prompt engineering', 'Applied AI', 'Natural-language data access with Databricks Genie.', 280),
  skill('docai', 'Document AI', 'Applied AI', 'LayoutLMv3 and quantized Mistral for invoices.', 350),
  skill('cloudflare', 'Cloudflare Workers', 'Platform', 'D1, R2 and Workers for Directory.', 30, 'G'),
  skill('threejs', 'Three.js', 'Library', 'PARALLAX 3D sky and the Njidion game.', 0, 'G'),
];

const prototype: CardContent[] = [
  {
    id: 'tetra', pack: 'prototype', title: 'tetra-rpg', subtitle: 'Falling-block puzzle RPG', kicker: 'Early development',
    motif: 'blocks', hue: 280, source: 'G',
    summary: 'A versus falling-block puzzle game growing into a character-based RPG.',
    details: ['Versus against four AI opponents, practice and a 40-line sprint are playable; heroes and a campaign are on the roadmap.'],
    tags: ['JavaScript', 'Game AI'], links: [{ label: 'Source', href: 'https://github.com/matt-chow/tetra-rpg' }],
  },
  {
    id: 'fashone', pack: 'prototype', title: 'Fashone', subtitle: "Illustrated handbook of men's style", kicker: 'Prototype',
    motif: 'hanger', hue: 15, source: 'G',
    summary: 'An interactive menswear guide where every figure is drawn in SVG.',
    details: ['Handbook, encyclopedia, an outfit studio and practice exercises, with licensed archival images credited in-app.'],
    tags: ['TypeScript', 'SVG'], links: [{ label: 'Source', href: 'https://github.com/matt-chow/fashone' }],
  },
  {
    id: 'njidion', pack: 'prototype', title: 'Njidion', subtitle: 'The 60-Second Disaster', kicker: 'Game jam build',
    motif: 'controller', hue: 110, source: 'G',
    summary: 'A 2.5D browser comedy game: find the spy, lose everything.',
    tags: ['Three.js', 'TypeScript', 'Vite'],
    links: [{ label: 'Play', href: 'https://sih2026-lake-phi.vercel.app' }, { label: 'Source', href: 'https://github.com/matt-chow/sih2026' }],
  },
  {
    id: 'bdb', pack: 'prototype', title: 'Big Data Bowl 2026', subtitle: 'Prediction entry', kicker: 'Sketch',
    motif: 'football', hue: 35, source: 'G',
    summary: 'A start on the NFL Big Data Bowl 2026 prediction challenge.',
    tags: ['Python'], links: [{ label: 'Source', href: 'https://github.com/matt-chow/bdb2026' }],
  },
  {
    id: 'planner', pack: 'prototype', title: 'Planner App', subtitle: 'Time-blocking planner', kicker: 'Retired → Directory',
    motif: 'calendar', hue: 200, image: 'images/plannerapp.png', source: 'S',
    summary: 'A personal time-blocking planner; its ideas now live in Directory.',
    tags: ['FastAPI', 'PostgreSQL', 'Redis', 'Docker'],
  },
];

const personal: CardContent[] = [
  {
    id: 'p-sports', pack: 'personal', title: 'Sports nerd', kicker: 'Interest', motif: 'volleyball', hue: 330, source: 'R, A',
    summary: 'Volleyball, basketball, U SPORTS, NFL tracking data — runs a club for it.',
    details: ['Co-authored packages for women\'s volleyball and the CEBL, and is President of UWAGGS.'],
  },
  {
    id: 'p-games', pack: 'personal', title: 'Game tinkerer', kicker: 'Interest', motif: 'controller', hue: 110, source: 'G',
    summary: 'Builds browser games for fun: a puzzle RPG, a comedy jam game, a board-game hub.',
  },
  {
    id: 'p-hackathons', pack: 'personal', title: 'Hackathon season', kicker: 'Fun fact', motif: 'trophy', hue: 45, source: 'R, G',
    summary: '2026: LA Hacks, Hack the North and NASA Space Apps — two 2nd-place prizes.',
  },
  {
    id: 'p-climbing', pack: 'personal', title: 'On the wall', kicker: 'Fun fact', motif: 'mountain', hue: 20, source: 'S',
    summary: 'Once ran safety orientations at a climbing gym — and co-wrote a paper called Peaks and primes.',
  },
  {
    id: 'p-hardware', pack: 'personal', title: 'Screwdriver to robot arm', kicker: 'Fun fact', motif: 'chip', hue: 180, source: 'S, R',
    summary: 'First tech job: repairing computers. Most recent hackathon: teleoperating a robot arm.',
  },
  {
    id: 'p-sky', pack: 'personal', title: 'Night-sky detour', kicker: 'Fun fact', motif: 'stars', hue: 230, source: 'G',
    summary: 'Spent a weekend building a flipbook of how the infrared sky changes.',
  },
  {
    id: 'p-style', pack: 'personal', title: 'Drawn in code', kicker: 'Interest', motif: 'hanger', hue: 15, source: 'G',
    summary: 'Illustrated a whole menswear handbook with SVG figures.',
  },
];

export const cards: CardContent[] = [...starter, ...experience, ...highlights, ...skills, ...prototype, ...personal];
export const cardById = new Map(cards.map((c) => [c.id, c]));

// Unverified or missing information. Shown on the Index page, never presented as fact.
export const contentTodos = [
  'No reference/cv.tex in the repo; Resume_F26.pdf was used as the CV source. Add the .tex if it differs.',
  'LinkedIn (HTTP 999) and Devpost (HTTP 403) block automated reading, so neither was cross-checked. Paste their text to verify dates and add Devpost project links.',
  'Waterloo 2025 title: résumé says "Data Engineer", the old site said "Data Scientist". Using the résumé.',
  'Peaks and primes author list: Crossref lists Awosoga and Chow; an earlier source suggested a third author. Confirm.',
  'Ask co-authors before embedding Peaks and primes data or volleydata charts.',
  'usportsR: confirm wording of your contribution (3 of 127 commits) and whether to mention its CRAN archival.',
  'Directory (jarvis repo): confirm it is meant to be featured publicly.',
  'Commissioned (growth role, Jan 2026): was commented out on the old site, so it is omitted. Include?',
  'Bored Games: omitted because it hosts an online version of a commercial board game. Feature only the original parts?',
  'unif.ai: no public repo or Devpost link found.',
  'Njidion (sih2026): which event was it built for?',
  'Personal pack: hobbies are inferred from public work (repos, past jobs). Confirm current hobbies (climbing? music?) and add any you want shown.',
  'Portrait: none used. Supply one if you want a character card illustration.',
  'Infrastructure Canada: confirm you are comfortable naming LayoutLMv3 and Mistral publicly.',
];
