// Single source of truth for every fact on the site.
// Sources: CV = cv.tex in github.com/matt-chow/resume (Jun 2026), R = Resume_F26.pdf (Fall 2026, newer; wins on conflicts),
// S = previous portfolio site (Matthew's own copy), G = public GitHub README/API,
// A = docs/PORTFOLIO_CONTENT_AUDIT.md (verified 2026-11-07), O = owner instruction (2026-11-20, 2026-11-22),
// P = planning/cv.tex supplied by the owner (2026-11-21).
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
    id: 'profile', pack: 'starter', title: 'Matthew Chow', subtitle: 'Data science · Applied AI · Economics', kicker: 'Profile',
    summary: profile.tagline, details: ['Portrait coming soon.'], motif: 'portrait', hue: 245, source: 'R, CV',
  },
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
    id: 'energy', pack: 'experience', subset: 'Featured', title: 'Ministry of Energy and Mines', subtitle: 'Data Scientist',
    kicker: 'May – Aug 2026 · Toronto', motif: 'bolt', hue: 48, source: 'R, CV, P, O',
    summary: 'A natural-language data assistant and smart-meter ETL.',
    details: [
      'Supported development of an internal Databricks Genie-based AI assistant through prompt engineering and UI development, enabling natural-language access to organizational datasets for analysts and policy teams.',
      'Built PySpark, SQL and Delta Lake ETL pipelines to ingest and transform high-volume hourly smart meter data.',
      'Sped up a slow Power BI Shape Map dashboard by fixing its TopoJSON with GeoPandas polygon simplification.',
    ],
    tags: ['Databricks', 'PySpark', 'SQL', 'Delta Lake', 'Prompt engineering', 'GeoPandas'],
  },
  {
    id: 'tpa', pack: 'experience', subset: 'Featured', title: 'Toronto Parking Authority', subtitle: 'Data Analyst',
    kicker: 'Jan – Apr 2026 · Toronto', motif: 'ledger', hue: 140, source: 'R, CV, S, P',
    summary: 'Reconciling millions of financial records across databases.',
    details: [
      'Analyzed and reconciled 5 million+ transactional and financial records across multiple Azure-hosted databases, using CTE-based transformations, joins and window functions to validate cross-system consistency.',
      'Improved data quality by finding and resolving multiple upstream errors in the data warehouse through SQL-based auditing of financial and operational datasets (the organization reports $1.3B+ in annual revenue).',
      'Designed and maintained reusable SQL validation workflows that automate recurring data checks for reporting and monthly close.',
      'Developed Microsoft Fabric and Power BI dashboard workflows with automated refresh to monitor financial KPIs and detect anomalies for director-level stakeholders.',
      'Contributed to the planned migration of the enterprise data warehouse from Azure SQL to Microsoft Fabric: validation strategy and semantic models.',
    ],
    tags: ['SQL', 'MSSQL', 'Azure SQL', 'Microsoft Fabric', 'Power BI'],
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
    kicker: 'Sept – Dec 2024 · Campus Housing', motif: 'chart', hue: 300, source: 'CV, S',
    summary: 'Survey analysis behind a campus housing report.',
    details: [
      'Analyzed housing trends from 5,000+ survey respondents with t-tests, ANOVA, chi-square and z-tests to inform building renovation decisions.',
      'Presented findings to directors and administrators through R (ggplot2, plotly, dplyr) and Excel dashboards included in an official report.',
    ],
    tags: ['R', 'Statistics', 'Excel'],
  },
  {
    id: 'uwaggs', pack: 'experience', subset: 'Supplemental', title: 'UWAGGS', subtitle: 'President · Founding member',
    kicker: 'Since Oct 2023 · President from May 2026', motif: 'trophy', hue: 30, source: 'CV, R, A',
    summary: 'University of Waterloo Analytics Group for Games and Sports.',
    details: ['Founding member of the University of Waterloo Analytics Group for Games and Sports (Oct 2023).', 'President since May 2026.'],
    links: [{ label: 'uwaggs.ca', href: 'https://www.uwaggs.ca' }, { label: 'UWAGGS on GitHub', href: 'https://github.com/uwaggs' }], tags: ['Leadership', 'Sports analytics'],
  },
  {
    id: 'commissioned', pack: 'experience', subset: 'Supplemental', title: 'Commissioned', subtitle: 'Growth',
    kicker: 'Jan 2026 – Present', motif: 'spark', hue: 255, image: 'images/commissionedlogo.png', source: 'S, O',
    summary: 'One of the first growth hires at a startup that lets anyone with data fine-tune models in minutes.',
    details: ['Driving growth through user-generated content, community building and data-driven market strategy.'],
    tags: ['Growth', 'Community'],
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
    kicker: 'Publication', motif: 'peaks', hue: 210, image: 'images/peaksandprimes.jpeg', source: 'A (Crossref), CV, O',
    summary: '"Do athletes get one shot at glory?" — a peer-reviewed magazine article.',
    details: [
      'David Awosoga (first author) and Matthew Chow (second author). Peaks and primes: Do athletes get one shot at glory? Significance, 21(3), 6–9 (2024).',
      'Analyzed 12,000+ Olympic athlete careers with survival analysis and regression, finding peak performance around age 27 and quantifying the effects of training age, country, sex and Olympic participation.',
    ],
    tags: ['Survival analysis', 'Regression', 'Sports science'],
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
    kicker: 'Hackathon', motif: 'sprites', hue: 95, source: 'R, G',
    summary: 'A live world of AI agents meeting each other.',
    details: [
      'Designed sprite assets in Paper and co-built "World", a PixiJS visualizer of live multi-agent conversations.',
      'Implemented LLM-based judging of agent-to-agent chemistry and logistics, and contributed to backend deployment.',
    ],
    tags: ['PixiJS', 'LLMs', 'Design'],
    links: [{ label: 'Source', href: 'https://github.com/cng04/unif.ai' }, { label: 'Demo', href: 'https://unif-ai-beta.vercel.app' }],
  },
  {
    id: 'parallax', pack: 'highlights', title: 'PARALLAX', subtitle: 'NASA Space Apps Challenge 2026',
    kicker: 'Hackathon', motif: 'stars', hue: 230, source: 'G',
    summary: 'An open observatory for the changing infrared sky.',
    details: ["Lines up NASA SPHEREx archive images of the same patch of sky so anyone can blink between epochs and inspect what changed — and never claims a discovery."],
    tags: ['TypeScript', 'Three.js', 'Astronomy'],
    links: [{ label: 'nsah2026.vercel.app', href: 'https://nsah2026.vercel.app' }, { label: 'Source', href: 'https://github.com/matt-chow/nsah2026' }],
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
  skill('ts', 'TypeScript', 'Language', 'PARALLAX, Spy X Company and other public repos.', 215, 'G'),
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
  skill('threejs', 'Three.js', 'Library', 'PARALLAX 3D sky, Spy X Company and this site.', 0, 'G'),
  skill('geopandas', 'GeoPandas', 'Library', 'Simplified map polygons for a Power BI dashboard.', 120, 'CV'),
  skill('excel', 'Excel', 'Tool', 'Survey dashboards and a VBA-automated tracker.', 140, 'CV, S'),
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
    id: 'njidion', pack: 'prototype', title: 'Spy X Company', subtitle: 'Njidion · Stupid Ideas Hackathon 2026', kicker: 'Hackathon build',
    motif: 'controller', hue: 110, source: 'G, O',
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
    id: 'planner', pack: 'prototype', title: 'Planner App', subtitle: 'Time-blocking planner', kicker: 'Retired',
    motif: 'calendar', hue: 200, image: 'images/plannerapp.png', source: 'S',
    summary: 'A personal time-blocking planner.',
    tags: ['FastAPI', 'PostgreSQL', 'Redis', 'Docker'],
  },
  {
    id: 'vba-tracker', pack: 'prototype', title: 'Excel & VBA tracker', subtitle: 'Personal automation', kicker: 'Tool',
    motif: 'ledger', hue: 140, source: 'CV',
    summary: 'An automated tracker for time, tasks and finances.',
    details: ['Built in Excel and VBA to produce aggregated reports and lifetime projections for productivity and financial planning.'],
    tags: ['Excel', 'VBA'],
  },
  {
    id: 'boredgames', pack: 'prototype', title: 'BoredGames', subtitle: 'Side project', kicker: 'Side project',
    motif: 'dice', hue: 330, source: 'G, O', summary: 'A small board-game side project.', tags: ['Web'],
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
    summary: '2026: LA Hacks, Hack the North, NASA Space Apps and the Stupid Ideas Hackathon — two 2nd-place prizes.',
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

// The Index: a curated profile for Data Science, Applied AI, ML and research roles. Ids are cards, so every entry
// opens its card; anything not listed (Career Foundations, Commissioned, prototypes, Personal) stays in the binder.
export const indexProfile = {
  experience: ['infc', 'energy', 'tpa', 'uw-math', 'uw-analyst'],
  projects: ['printdnd', 'rvolleydata', 'unifai', 'ceblr', 'usportsr'], // cv.tex (P) Selected Projects, strongest first (owner, 2026-11-22)
  research: ['peaks', 'cmsac', 'cassis'],
  // Research on cv.tex (P) without a card; `card` is the related card it opens.
  talks: [
    { title: 'A Tailored Comparison Between Students in Campus Housing and Students Off-Campus', meta: 'Chow M., Shalan H. · Oral presentation · 2024', card: 'uw-analyst', source: 'P' },
  ],
  skills: [
    { label: 'Languages', ids: ['skill-r', 'skill-python', 'skill-sql', 'skill-ts'] },
    { label: 'Data platforms', ids: ['skill-databricks', 'skill-pyspark', 'skill-delta', 'skill-fabric', 'skill-azuresql', 'skill-powerbi'] },
    { label: 'Applied AI & statistics', ids: ['skill-docai', 'skill-prompt', 'skill-stats'] },
    { label: 'Engineering', ids: ['skill-pkgdev', 'skill-scraping', 'skill-cicd', 'skill-git', 'skill-dataviz', 'skill-geopandas'] },
  ],
  education: ['uwaterloo'],
  leadership: ['uwaggs'],
  awards: [
    { title: 'Arts Experiential Learning Award', year: '2024, 2025', source: 'P' },
    { title: 'Lynne and Peter Woolstencroft Learning Award', year: '2024', source: 'P' },
  ],
};

// Unverified or missing information. Never presented as fact; kept here for the owner, not shown on the site.
export const contentTodos = [
  'planning/cv.tex (2026-11-21) now agrees with Resume_F26.pdf on 5 million+ Toronto Parking Authority records.',
  'Ministry name: cv.tex says "Ministry of Energy"; the owner asked for "Ministry of Energy and Mines" (2026-11-22). Using the owner\'s name.',
  'Waterloo 2025 title: Resume_F26.pdf says "Data Engineer", cv.tex (2026-11-21) says "Data Science Researcher", the old site said "Data Scientist". Still using the résumé.',
  'Campus Housing title: cv.tex (2026-11-21) says "Data Research Assistant"; the card says "Data Analyst" (older CV and site). Confirm which.',
  'CMSAC: the content audit has a 2025 poster by Du, Chow, Awosoga; cv.tex (2026-11-21) lists an upcoming oral presentation by Chow, Du, Awosoga. Showing the audited poster.',
  'Softron Tax dates: cv.tex says Jan – Apr 2024, the old site says 2023. The card keeps the site dates.',
  'LensX and Mercor: named by the owner but no verified details are in this manifest. Supply role, dates and work to add them.',
  'LinkedIn (HTTP 999) and Devpost (HTTP 403) block automated reading, so neither was cross-checked.',
  'Commissioned: dates and role come from the old site (Jan 2026 – Present). Confirm it is still current.',
  'Ask co-authors before embedding Peaks and primes data or volleydata charts.',
  'usportsR: confirm wording of your contribution and whether to mention its CRAN archival.',
  'BoredGames: listed without a link or description on purpose. Add a link if you want one.',
  'Personal pack: hobbies are inferred from public work (repos, past jobs). Confirm or add your own.',
  'Portrait: placeholder in use. Supply a portrait for the profile card.',
];

const SOURCES: Record<string, string> = { CV: 'CV source (cv.tex)', P: 'CV source (cv.tex, Nov 2026)', O: 'owner', R: 'résumé', S: 'previous portfolio site', G: 'public GitHub', A: 'content audit' };
export const sourceLabel = (src: string) => src.split(/,\s*/).map((k) => SOURCES[k] ?? k).join(', ');
