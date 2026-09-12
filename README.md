# ☕ Corridor Opportunity Finder
> **Commercial Corridor Discovery & Business Format Matching Dashboard**  
> *Built for the Beyond the Prompt Hackathon*

---

## 🌟 What is Corridor Opportunity Finder?

Imagine a café brand or hospitality entrepreneur wants to open a new outlet in **New York City** or **Dallas–Fort Worth**. Instead of manually driving around or guessing which neighborhoods might work, they can select their exact business format (such as *Neighborhood café*, *Morning commuter grab-and-go*, *Specialty coffee roastery*, or *Late-night study café*) and instantly see:
1. **Which commercial corridors are the most promising to investigate first.**
2. **The official format fit score and fit tier** (`STRONG_FIT`, `MODERATE_FIT`, `WEAK_FIT`, `GATED_OUT`).
3. **Transparent explanations ("Why Investigate")** detailing the exact signals, audience routines, anchor magnets, and whitespace opportunity.
4. **An interactive geospatial map** with commercial pins and nearby mapped places.
5. **Side-by-side comparison** of top candidate corridors to weigh trade-offs before investing capital.

---

## 🚀 How to Run the App (1 Simple Step!)

You do not need to install complex databases or configure frameworks. Everything is ready to run locally:

### Option A: Using Python (Recommended)
Open your terminal inside this folder and run:
```bash
python server.py
```
Your default browser will automatically open to:
👉 **[http://localhost:8000](http://localhost:8000)**

### Option B: Using Node.js
If you prefer Node.js, run:
```bash
npm start
```
or
```bash
npx -y serve public -l 8000
```

---

## 📊 Authentic Data & Dataset Compliance

This project strictly adheres to the hackathon dataset rules: **No simulated, invented, or fake numbers**. Every value comes directly from the official Mongo release snapshot `usa-corridors-20260906-r2`:

| Region | Corridors | Business Formats / Archetypes | Verified Fit Scores | Special Zones | Mapped Context Places |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **New York City** | 65 | 31 Café Archetypes | 1,860 Scores | 25 Zones (e.g. Barclays Center) | 7,000+ Sampled Places |
| **Dallas–Fort Worth** | 72 | 67 Formats (31 Café + 36 Restaurant) | 4,824 Scores | 37 Zones (e.g. American Airlines Ctr) | 9,000+ Sampled Places |

### Key Data Concepts
- **Commercial Corridor:** A named commercial district behaving as a single walkable place (e.g. *SoHo Broadway*, *Williamsburg Bedford*, *Bishop Arts District*, *Downtown Plano*).
- **Official Fit Score (0.0 to 1.0):** Machine score provided by the dataset measuring how well a business format matches corridor demand dynamics.
- **Whitespace Quality (0 to 100):** Found in `behavior.whitespace_quality.cafe`. Represents expert-assessed demand headroom without immediate oversaturation.
- **Existing Cafés:** Count of active café listings (`places.classes.CAFE.listing_count`).
- **Opportunity Score (Calculated):** Clearly labeled as an application calculation combining fit, whitespace, and existing supply penalty:
  $$\text{Opportunity} = (\text{Fit Score} \times 100) + (\text{Whitespace} \times 0.40) - \text{Existing Cafe Penalty}$$
- **Dallas–Fort Worth Geometry Warning:** Per the official README, DFW hex geometry is a named activity display envelope, not a property line or parcel boundary. This is prominently flagged in the dashboard.

---

## 🧭 Core Dashboard Features

1. **Metro Switcher:** Instant toggle between New York City (65 corridors) and Dallas–Fort Worth (72 corridors).
2. **Business Archetype Selector:** Search and select from all real café archetypes, complete with category mission, required gate, and primary/supporting demand signals.
3. **Ranked Opportunity Cards:**
   - Rank badges (#1, #2, #3 gold/silver/bronze).
   - Fit score progress bar with tier color-coding (`STRONG_FIT` green, `MODERATE_FIT` amber, `WEAK_FIT` slate, `GATED_OUT` rose).
   - Core metrics triad: Opportunity Score, Café Whitespace, and Existing Café Count.
   - Dynamic "Why Investigate" explanation block synthesizing dataset signals.
4. **Deep-Dive Corridor Dossier:**
   - Verbatim plain-English character note.
   - Signal contribution breakdown table (values, effective weights, contributions).
   - Associated audience personas with 1–7 affinity scores (e.g. *Morning Commuters*, *High-Income Families*, *Remote Workers*).
   - Core anchor landmarks and adjacent special zones.
   - Sampled mapped places across Food & Drink, Retail, Culture, Workplaces, and Groceries.
5. **Interactive Geospatial Map:**
   - Dark-mode Leaflet map plotting every corridor centroid.
   - Color-coded pins by fit tier.
   - Click-to-inspect corridor quick view with sampled surrounding places.
6. **Side-by-Side Corridor Comparison:**
   - Compare up to 3 corridors simultaneously to evaluate fit, whitespace, anchors, and competition side-by-side.

---

## 📁 Repository Structure

```
Beyond_The_Prompt/
├── starter-kit/                  # Extracted authentic hackathon starter kit
│   └── usa-corridors-20260906-r2/
│       ├── NYC_CORRIDORS.full.json
│       ├── DALLAS_FORT_WORTH_CORRIDORS.full.json
│       ├── README.md
│       └── ...
├── scripts/
│   └── prepare_data.py           # Preprocessing script extracting optimized JSON
├── public/                       # Web application front-end
│   ├── index.html                # Semantic HTML5 markup
│   ├── css/
│   │   └── style.css             # Glassmorphic dark theme CSS design system
│   ├── js/
│   │   └── app.js                # Interactive logic, formulas, Leaflet map, compare
│   └── data/
│       ├── nyc.json              # Clean indexed NYC corridor dataset (1.1 MB)
│       └── dfw.json              # Clean indexed DFW corridor dataset (3.7 MB)
├── server.py                     # Zero-dependency Python local HTTP server
├── package.json                  # Node configuration and run scripts
└── README.md                     # Project documentation
```

---

## 🏆 Hackathon Notes
## Team
Built collaboratively for our hackathon.

- **Beginner-Friendly**: Zero external dependencies required to run.
- **Data Integrity**: Uses 100% genuine data from the Starter Kit.
- **Transparency**: Derived formulas and geometry distinctions are explicitly annotated.