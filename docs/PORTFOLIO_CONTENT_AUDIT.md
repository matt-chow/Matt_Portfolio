# Portfolio Content Audit

**Sources** (checked 2026-11-07):

- `Documents/Resume_F26.pdf`
- `Documents/CMSAC_poster_2025.pdf`
- The existing site in `Matt_Portfolio/`
- GitHub public API: `matt-chow`, `awosoga`, `uwaggs`
- CRAN package pages and cranlogs
- The `peaks-and-primes` README
- `printdnd.vercel.app`

**Status key:**

- ✅ verified from a public source
- 📄 résumé only
- ❓ needs Matthew's confirmation

---

## 1. Positioning line (proposed)

> **Matthew Chow builds data systems and applied-AI tools, and does open-source sports research.**
> Economics at Waterloo · data science & engineering in the Canadian public sector · R packages on CRAN.

This passes the ten-second test (who, what, evidence) without "passionate" or "innovative". The "Economics" detail matters: it explains the quantitative-research angle and is honest about the degree.

---

## 2. Featured shortlist (recommended order)

| # | Work | Category | What Matthew did (Matthew's part only) | Evidence | Why feature it | Interactive? |
|---|---|---|---|---|---|---|
| 1 | **rvolleydata / pyvolleydata** | Open source · sports data | Co-author (CRAN `aut`). 28 of 63 commits to `rvolleydata`. Second author on the CMSAC 2025 poster. | ✅ CRAN v2.0.0 (2026-01-08); ✅ 3,153 CRAN downloads; ✅ poster PDF | The strongest end-to-end story: scraping → medallion data layout → validation → GitHub Actions → CRAN. Covers 3 pro leagues and 300+ games (poster claim). | **Yes**: a "living poster" re-plotting MLV sideout % vs breakpoint % from the public `volleydata` releases |
| 2 | **Peaks and primes** (*Significance*, 2024) | Publication | Co-author (2nd author; Crossref lists two authors, Awosoga and Chow). 2 of 9 repo commits. | ✅ DOI 10.1093/jrssig/qmae038; ✅ CASSIS 2024 poster | A real peer-reviewed magazine article, and a perfect narrative hinge: "peaks" links research to climbing | **Yes**: an age-curve explorer, *if* co-authors agree. The data is in the repo, but **the repo has no licence**, so ask David Awosoga |
| 3 | **PrintDND** | Applied AI · robotics | Led teleoperation data collection (100+ episodes) and data-quality auditing for fine-tuning a PI0.5 vision-language-action model | 📄 Hack the North 2026, 2nd place, Best Use of BracketBot; ✅ project site describes 100+ episodes, the Quest 3S teleop and the ~75% data loss to a buffer overwrite | Shows ML data work on physical hardware, plus an honest failure story | **Yes**: "project autopsy" (collect → lose 75% → recover → demo) |
| 4 | **Directory / JARVIS** (`matt-chow/jarvis`) | Software engineering | Sole author, 100 commits. React PWA + Rust API on one Cloudflare Worker; D1 + R2; passkeys; offline sync | ✅ public repo README ("MVP on staging") | The strongest *solo* engineering artifact; nothing else shows architecture ownership | **Yes**: clickable architecture diagram. ❓ Is the repo meant to be public? |
| 5 | **unif.ai** | Applied AI · design | Designed sprite assets in Paper; co-built "World", a PixiJS multi-agent visualizer; LLM-based judging; backend deployment | 📄 LA Hacks 2026, 2nd place, Design (Paper track). ❓ No public repo or Devpost found | Strong visual project; the sprites suit an illustrated portfolio | Screenshots or a short loop only |
| 6 | **ceblR** | Open source · basketball | Co-author (CRAN `aut`). 8 of 34 commits | ✅ CRAN v1.0.0 (2025-07-19); ✅ 3,323 downloads | Rounds out the "package family" | No; group it with #1 |
| 7 | **usportsR** | Open source · U SPORTS | Contributor (3 of 127 commits) | ✅ GitHub; ⚠️ **archived from CRAN on 2026-10-26** ("policy violation") | Real, but a small contribution. Don't present it as authored | No; list under "contributions" with honest wording |

**Supporting figure (✅ verified):** the three packages total about 9,200 downloads (cranlogs, RStudio mirror only), which supports the résumé's "5,000+". The site should say "5,000+ downloads across three packages" and link to the source, rather than quoting a precise live number.

### Considered, not featured (yet)

| Item | Reason |
|---|---|
| Bored Games (`boredgames`, 85 commits, Svelte 5 + Durable Objects) | Technically impressive, but it ships an online version of a commercial board game (Bohnanza). Featuring it publicly invites IP questions. ❓ Feature only the original game "Kingdom & Commerce" and the realtime architecture? |
| Big Data Bowl 2026 (`bdb2026`) | 1 commit, no README. Needs a write-up first |
| Customer churn pipeline on Microsoft Fabric (old site) | ❓ Was it personal or for work? No public repo found. Fine as a short archive entry if personal |
| "Machine Learning Predictive Modelling (Published)" (old site) | ❓ Unclear what was published. Remove unless a citation exists |
| Planner App (old site) | Superseded by Directory/JARVIS. Fold it into that story |
| oil-price-tracker, S26_Sankey, athens-timer | Small utilities. Archive-only |
| claw-code-parity, western-research-profs, printdnd | Forks. Only PrintDND has a personal story (via the hackathon) |
| teto-clone, myrepo, School, test repos | Exclude |

---

## 3. Experience (Experience page, reverse chronological)

Only what the résumé states. Describe work in general terms: **no internal system names beyond the résumé, no screenshots, no datasets from employers.**

| Role | Dates | Safe summary | Notes |
|---|---|---|---|
| Infrastructure Canada: Applied AI & Data Science | Sept 2026 to present | Contributing to a document-intelligence pipeline (LayoutLMv3 + quantized Mistral) that turns invoices and scanned documents into structured JSON | ❓ Confirm you're comfortable naming the models publicly. Current employer |
| Ministry of Energy: Data Scientist | May–Aug 2026 | Prompt engineering and UI for an internal Databricks Genie assistant; PySpark/SQL/Delta Lake ETL for hourly smart-meter data | Say "supported" and "contributed": team work |
| Toronto Parking Authority: Data Analyst | Jan–Apr 2026 | Reconciled 5M+ records across Azure databases; SQL validation workflows | ⚠️ "$1.3B+ revenue" is the *organization's* revenue, not your impact. Phrase it as "datasets supporting…" or drop it. The old site also mentions a Fabric migration; keep only if accurate |
| University of Waterloo, Faculty of Math: Data Engineer | May–Aug 2025 | Scrapers and daily GitHub Actions pipelines; 3 R packages released | ❓ The old site says "Data Scientist", the résumé says "Data Engineer". Pick one |
| University of Waterloo: Data Analyst | Sept–Dec 2024 | Survey analysis (5,000+ respondents), hypothesis tests, R/Excel dashboards for a housing report | From the old site only |
| Commissioned: Growth | Jan 2026 to ? | — | Commented out on the old site. ❓ Include? |
| Earlier: Softron Tax, Prime+ Care Health, Hub Climbing, Mac & PC repair | 2020–2023 | One line each under "Earlier" | Hub Climbing and computer repair quietly support the climbing and hardware threads |

## 4. Research & presentations

- *Peaks and primes: Do athletes get one shot at glory?* Awosoga, **Chow**. *Significance* 21(3), 6–9, 2024. ✅ (Crossref, checked 2026-11-07, lists two authors. ❓ An earlier source suggested a third, Silva. Confirm the author list.)
- CASSIS 2024 poster for the same work. ✅
- *rvolleydata and pyvolleydata: Serving Up Professional Women's Volleyball Data.* Du, **Chow**, Awosoga. CMSAC 2025 poster. ✅
- ❓ The `uwaggs/USPORTS-Packages-Paper` repo exists. Are you an author?

## 5. Leadership & personal (About page; kept secondary)

- **UWAGGS** (UW Analytics Group for Games and Sports): President, est. May 2026. 📄 ✅ The org exists on GitHub
- **Climbing:** former Hub Climbing staff (old site). ❓ Still climbing? Which gym or crag?
- **Music:** ❓ FL Studio and Arturia controllers are present in Documents. Do you produce? Is any of it shareable?
- **Hardware and making:** computer repair work, the robotics hackathon, 3D printing (PrintDND)
- **Hackathons:** LA Hacks 2026 and Hack the North 2026, both 2nd-place prizes

## 6. Missing media, and proposed substitutes

| Item | Have | Propose |
|---|---|---|
| rvolleydata | Logo SVG, poster charts | Re-draw the sideout/breakpoint chart in house style from public data |
| Peaks and primes | `peaksandprimes.jpeg` | An original age-curve illustration (synthetic curve, labelled "illustrative") until real data is approved |
| PrintDND | None of our own | An original ink drawing of the robot arm and printer; optional team photo if a teammate gives permission |
| Directory/JARVIS | None | An architecture diagram (Worker → React PWA, Rust API → D1, R2); real UI screenshots with personal data blurred |
| unif.ai | Paper sprites (yours) | ❓ Use your own sprites, with team agreement |
| Portrait | `mavey.JPG` (unknown subject) | ❓ An engraved-style portrait drawn from a photo you supply, or no portrait at all |

## 7. Decisions needed from Matthew

1. Is `jarvis` OK to feature publicly?
2. Ask co-authors whether you may embed `peaks-and-primes` data and the volleydata charts.
3. "Data Engineer" or "Data Scientist" for the Waterloo 2025 role?
4. How should the usportsR CRAN archival be worded, or should it be omitted?
5. Include Commissioned? Include Bored Games, and in what form?
6. Personal interests: confirm climbing and music details, or tell me what to leave out.
7. Portrait: drawn, photo, or none?
