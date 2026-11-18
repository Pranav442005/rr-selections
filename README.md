# ClutchBoard RR — Complete SupeRR Selector Analysis

A responsive React + Vite cricket pressure-analysis dashboard using a Rajasthan Royals-inspired royal-blue, pink and gold palette. The interface uses text/number navigation rather than emoji icons.

## Run locally

1. Install Node.js 20.19+ (Node 22 LTS recommended).
2. Open this folder in VS Code.
3. Run:
   ```bash
   npm install
   npm run dev
   ```
4. Open the local URL printed by Vite.

## Add the Rajasthan Royals logo

Place your logo image at:

```text
public/rr-logo.png
```

The sidebar already reserves a logo frame. If the image is not present, an `RR` text fallback appears.

## Dashboard sections

- Overview and consensus top-10 shortlist
- Complete batter and bowler rankings: Consensus, Strict, Base, Broad
- Player dossier with scenario-rank robustness
- Full batting and bowling metric tables for all three scenarios
- IPL vs T20I format analysis and comparison tables
- Batter/bowler comparison
- Interactive illustrative pressure simulator
- Delivery-level pressure explorer and full compressed exports
- Data Explorer for all six original CSVs, with schema, sample rows and full downloads
- Data-quality validation and extras-category audit
- Methodology, formulas, assumptions and sensitivity analysis
- Download centre for the complete Excel workbook and methodology PDF/DOCX

## Charts

The dashboard embeds 14 charts generated with Python Seaborn and Matplotlib: source-specific charts for all six CSVs, source volume/missingness, match coverage, pressure scenarios, top-10 player metrics and format comparisons. PNGs are in `public/charts/`. To regenerate them:

```bash
pip install -r requirements-analysis.txt
python scripts/generate_seaborn_charts.py
```

## Analysis data

The six original CSVs are in `public/data/`:
- `competitions.csv`
- `matches.csv`
- `ball_by_ball.csv`
- `teams.csv`
- `playing_eleven.csv`
- `competition_team_player_mapping.csv`

The complete analysis workbook is in `public/reports/SupeRR_Complete_Analysis.xlsx`. It contains all six source tables, full Strict/Base/Broad ranking and metric tables, consensus top 10, data-quality summary and delivery-level pressure flags.

The report files are in `public/reports/`. Ranking/metric CSV outputs are in `analysis/` and `public/data/`.

## Rebuild delivery-level pressure flags

```bash
pip install -r requirements-analysis.txt
python scripts/rebuild_delivery_flags.py
```

The script should report:
- 193,988 regulation-innings deliveries
- 35,031 Strict pressure deliveries
- 58,611 Base pressure deliveries
- 80,768 Broad pressure deliveries

## Scope and analytical caution

Match scope is IPL and T20I matches dated 1 January 2022 onward. Regulation innings 1 and 2 are included; super overs are excluded. There are 853 match records in scope (371 IPL and 482 T20I), 837 matches with ball-by-ball data, and 16 without it.

Pressure thresholds and rating weights are analyst choices, not official ratings. The source pack has no data dictionary for `extras_type = other`; the model treats `wide`, `Overstep` and `other` as illegal deliveries. The 259 in-scope `other` rows show a one-run extra pattern, but this interpretation needs confirmation from the data owner.

The consensus lists are exploratory model outputs. Consensus percentile is a robustness index across the three pressure definitions, not a cricket performance score. The exported methodology does not document the exact smoothing prior constant used for runs per dismissal; this should be confirmed and added before claiming perfect end-to-end reproducibility.


## Rajasthan Royals logo
The supplied Rajasthan Royals logo is included at `public/rr-logo.png`. Vite serves this as `/rr-logo.png`, which is the path used by the sidebar. Keep the image in `public` (not only in `src`) so it appears in development and production builds.

## React list-key warning
Table, ranking, leaderboard, comparison-card and player-option keys use composite identifiers with an index suffix so repeated player IDs across formats do not collide.

## Typography and theme
The interface uses a white and pink palette and Times New Roman throughout.
