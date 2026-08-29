# MoneyMoney Analyzer

Browser app to analyze a MoneyMoney/DKB-style CSV export ("Alle Konten") and
answer the question *"wo fließt mein Geld eigentlich hin?"* — not just how
much you spend per bank-assigned category, but which spending is basically
fixed (Miete, Versicherungen, ...) and which is discretionary and easy to
overlook (Amazon, Steam, Lieferdienste, Onlineshopping, ...).

Usage:

- Open `index.html` via a small static server (or `file://` may also work if browser allows modules).
- Load your CSV using the "Load CSV" button.
- Two tabs: **📊 Übersicht** (the money-flow dashboard: charts, drill-down,
  transaction table) and **💰 Budget** (set a monthly budget per category,
  drill down and distribute a parent's budget across its subcategories with
  sliders, see at a glance whether you're over or under).
- Use year buttons and drill into categories by clicking bars.
- Click "⚙️ SETTINGS" to review/edit the rules that assign transactions to
  categories (tab "Regeln", searchable, one rule per collapsed row) or to
  import/export a rule set (tab "Export / Import"), including one someone
  (or an LLM, see below) generated for you.

### One shared expense tree, two ways to navigate it

Both tabs drill through the exact same 3-level tree, built from the
rule-engine classification (`src/data.js:expense_matches_path`), not the
raw bank Kategorie split — that split has "AUSGABEN", "Paypal", "Other",
"Forderungen" etc. as unrelated top-level siblings, since Paypal-Kategorie
rows are literally `"Paypal"` with no `"AUSGABEN -"` prefix and blank ones
fall back to `"Other"`. That's nonsensical for "where does my money go":
PayPal is a payment method, not a spending category, and money spent
through it should land in the same bucket as a direct-debit purchase for
the same thing. The tree is:

```
Ausgaben (single root, every real-cashflow expense)
└── group   (Fixkosten / Notwendige Ausgaben / Diskretionär / ...)
    └── category   (Miete, Amazon, Supermarkt & Drogerie, ... — leaves)
```

- **Übersicht tab**: the combined/growth/average charts and the breadcrumb
  drill down through this tree level by level (click a bar, click a
  breadcrumb segment to jump back up).
- **Money-flow leak chart / donut** (also in Übersicht): a flat, one-off
  *category filter* on the transaction table instead — click a bar to jump
  straight to one leaf category's transactions, independent of the
  breadcrumb position. Only one of the two (breadcrumb drill-down vs. flat
  filter) is ever active; starting one clears the other, and whichever is
  active is shown in the single header bar above the charts (a breadcrumb
  trail for the drill-down, a `🏷 Kategorie-Filter` chip for the flat
  filter) instead of two separate indicators.
- **Budget tab**: drills through the identical tree (`build_budget_report`
  reuses the same path-matching helpers) so budgets naturally distribute
  from a group down to its categories. Each row shows the average monthly
  spend for the selected year (PayPal double-counting excluded, same as
  everywhere else) next to a slider/number input for the budget and a
  status bar (green = within budget, red = over). Setting a budget on a
  parent caps its children's sliders to that amount and shows how much is
  still unallocated. Budgets are stored in `localStorage` only.

Files:
- `index.html` - UI and module loader
- `src/data.js` - CSV parsing, grouping, money-flow aggregation
- `src/rules.js` - classification rule engine
- `src/default_rules.json` - bundled default rule set ("SETTING")
- `src/charts.js` - chart rendering helpers
- `src/table.js` - table rendering helpers
- `styles.css` - external styles
- `tests/test_runner.html` - simple manual test hints
- `src/main.js` - **unused/legacy duplicate**, kept only for historical reference; the app is wired up entirely through `index.html` + `src/{data,rules,charts,table}.js`

Notes:
- Data is stored in `localStorage` for convenience — nothing is ever sent to a server.
- Charting uses Chart.js via CDN.
- `*.csv` is gitignored — your bank export never gets committed to this repo.

Testing:

- Serve the folder and open `tests/test_runner.html` for quick manual checks.

Serve locally:
```bash
python3 -m http.server 3000
# then open http://localhost:3000 in your browser
```

## Wie die Klassifizierung funktioniert

Jede Transaktion durchläuft `classify()` in `src/rules.js`:

1. Alle Regeln werden nach `priority` (absteigend) geprüft; die erste Regel,
   deren Muster (Regex auf `Name`, `Verwendungszweck` und/oder
   Bank-`Kategorie`) matcht, gewinnt.
2. Trifft keine Regel zu, wird auf die von der Bank/MoneyMoney gelieferte
   `Kategorie`-Hierarchie zurückgefallen (z.B. `AUSGABEN - Freizeit - Steam & Co.`)
   und über `categoryGroupFallback` einer Gruppe zugeordnet.
3. Bleibt auch das leer, landet die Transaktion in `Unklassifiziert`.

Jede Regel/Kategorie gehört zu einer **Gruppe**:

| Gruppe | Bedeutung |
|---|---|
| `fixed` | Fixkosten, kaum kurzfristig beeinflussbar (Miete, Versicherungen, Handyvertrag, ...) |
| `essential` | notwendige, aber beeinflussbare Ausgaben (Supermarkt, Tanken, ÖPNV) |
| `discretionary` | diskretionäre Ausgaben – die typischen "Geldlecks" (Amazon, Steam, Lieferdienste, Onlineshopping, Urlaub, ...) |
| `savings` | Sparen, Spenden, private Transfers |
| `income` | Einnahmen |
| `internal_transfer` | reine Kontoumbuchungen ohne echten Cashflow-Effekt (siehe unten) – wird aus allen Summen ausgeschlossen |
| `unclassified` | nichts hat gegriffen – sichtbar im Ranking, damit man gezielt nachbessern kann |

Das Dashboard zeigt daraus zwei neue Charts: ein Ranking der Top-Ausgabenkategorien
("Wo fließt das Geld hin?") und ein Donut mit Einnahmen vs. Fixkosten vs.
Notwendig vs. Diskretionär vs. Netto/Sparquote.

### Wichtiger Fallstrick bei PayPal-Exporten

Wenn dein "Alle Konten"-Export auch das PayPal-Konto enthält, gibt es
gleich zwei Arten von Dopplung zu bereinigen:

1. **PayPal-Finanzierung**: Jede per Lastschrift finanzierte PayPal-Zahlung
   taucht als Zufluss `Bank Account (direct debit)` auf dem PayPal-Konto
   auf (reine Finanzierung, kein Einkommen) *und* als der eigentliche Kauf
   beim Händler. Zählt man naiv alle positiven Beträge als Einnahmen, wird
   das Einkommen künstlich aufgebläht.
2. **PayPal-Sammeleinzug**: Zusätzlich zieht PayPal auf dem echten
   Bankkonto einen (oft gebündelten, mehrere Tage versetzten)
   SEPA-Sammeleinzug von "PayPal Europe S.a.r.l. et Cie S.C.A." ein, der
   dieselben Käufe **nochmal** als Ausgabe zeigt – nur ohne
   Händlerdetail, weil auf der Bank-Seite nur "PayPal" steht statt der
   Verwendungszweck-Notiz, die PayPal selbst mitliefert. Da diese
   Sammeleinzüge Beträge und Datum nicht 1:1 den PayPal-Einzelkäufen
   zuordnen lassen (Bündelung über mehrere Tage), lohnt sich kein
   fragiles Datum/Betrag-Matching: stattdessen werden alle Buchungen
   dieses SEPA-Absenders strukturell als Sammeleinzug erkannt und komplett
   ausgeschlossen – die eigentliche Kategorisierung liefert ohnehin die
   PayPal-Kaufbuchung mit dem Händlernamen.

Zählt man beides naiv mit, wird sowohl das Einkommen künstlich aufgebläht
als auch dieselbe Ausgabe zweimal gezählt – und verschleiert damit genau
das Problem, das man eigentlich sehen will. Die mitgelieferten Regeln
`internal_paypal_funding` und `internal_paypal_settlement` (Gruppe
`internal_transfer`, `excludeFromTotals: true`) erkennen beide Muster und
schließen sie aus allen Summen aus – Einnahmen, Ausgaben und Netto in
diesem Dashboard sind dadurch bereinigt.

## Regeln konfigurieren: das "SETTING"-Format

Ein Regelwerk ("SETTING") ist eine einzelne JSON-Datei mit diesem Schema:

```jsonc
{
  "version": 1,
  "name": "Mein Regelwerk",
  "groups": [
    { "id": "fixed", "label": "Fixkosten (kaum beeinflussbar)", "color": "#7f8c8d" }
    // ... siehe src/default_rules.json für alle Standard-Gruppen
  ],
  "categoryGroupFallback": {
    // Bank-Kategorie (2. Segment von "AUSGABEN - X - Y", klein geschrieben) -> Gruppe-ID
    "wohnen": "fixed"
  },
  "rules": [
    {
      "id": "eindeutige-id",
      "label": "Anzeigename der Regel",
      "category": "Kategorie-Name im Dashboard",
      "group": "fixed | essential | discretionary | savings | income | internal_transfer",
      "namePattern": "Regex auf die Spalte 'Name', z.B. 'Amazon|Netflix'",
      "verwendungPattern": "Regex auf 'Verwendungszweck', optional",
      "kategoriePattern": "Regex auf die Bank-Kategorie, optional",
      "matchType": "or | and",
      "priority": 400,
      "excludeFromTotals": false
    }
  ]
}
```

Über "📤 SETTING exportieren" / "📥 SETTING importieren" im Regeln-Dialog
lässt sich genau diese Datei speichern und wieder laden — so kann man ein
Regelwerk teilen oder auf einem anderen Rechner weiterverwenden, ohne
jemals die eigentlichen Kontodaten preiszugeben (die CSV bleibt lokal).

### Ein LLM ein SETTING generieren lassen

Weil das Schema einfach und selbsterklärend ist, kann man es sich von einem
LLM (Claude, ChatGPT, ...) direkt aus der eigenen CSV ableiten lassen, ohne
dass irgendein Code angefasst werden muss. Prompt-Vorlage:

> Hier ist ein Export meiner Bank-Transaktionen (Spalten: Datum;Wertstellung;Kategorie;Name;Verwendungszweck;Konto;Bank;Betrag;Währung).
> Analysiere Name/Verwendungszweck/Kategorie und erstelle daraus ein
> Klassifizierungs-"SETTING" nach exakt diesem JSON-Schema: [Schema oben
> einfügen]. Regeln sollen möglichst generische Regex-Muster verwenden
> (Firmennamen, keine einzelnen Personen), priorisiert nach Spezifität, und
> jeder Regel eine der Gruppen fixed/essential/discretionary/savings/income
> zuweisen. Achte besonders auf wiederkehrende Zahlungen (Miete,
> Versicherungen, Abos) und auf Kategorien, in denen viel Geld unauffällig
> abfließt (Amazon, Gaming, Lieferdienste, Onlineshopping). Antworte NUR mit
> dem JSON.

Die Antwort lässt sich direkt per "SETTING importieren" ins Dashboard laden.
