# Money Money Analyzer

Simple browser app to analyze CSV export from bank (DKB).

Usage:

- Open `index.html` via a small static server (or `file://` may also work if browser allows modules).
- Load your CSV using the "Load CSV" button.
- Use year buttons and drill into categories by clicking bars.

Files:
- `index.html` - UI and module loader
- `src/main.js` - core logic (parsing, grouping, chart rendering)
 - `src/data.js` - data parsing and grouping
 - `src/charts.js` - chart rendering helpers
 - `src/table.js` - table rendering helpers
 - `styles.css` - external styles
 - `tests/test_runner.html` - simple manual test hints

Notes:
- Data is stored in `localStorage` for convenience.
- Charting uses Chart.js via CDN.

Testing:

- Serve the folder and open `tests/test_runner.html` for quick manual checks.

Serve locally:
```bash
python3 -m http.server 3000
# then open http://localhost:3000 in your browser
```
