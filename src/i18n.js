// --- i18n.js ---
// Minimal translation layer: a flat key -> string dictionary per language,
// applied to the DOM via data-i18n / data-i18n-placeholder / data-i18n-title
// attributes, plus a t(key, vars) helper for strings built in JS.

const STORAGE_KEY = 'appLanguage';

const dict = {
  de: {
    'app.title': 'MoneyMoney Analyzer',
    'filters.loadSample': 'Beispieldaten laden',
    'filters.resetDrill': 'Drilldown zurücksetzen',
    'filters.allYears': 'Alle Jahre',
    'filters.growthRate': 'Wachstumsrate:',
    'filters.mom': 'MoM',
    'filters.yoy': 'YoY',
    'filters.chart': 'Diagramm:',
    'filters.line': 'Linie',
    'filters.bar': 'Balken',
    'filters.settings': '⚙️ EINSTELLUNGEN',

    'mainTabs.overview': '📊 Übersicht',
    'mainTabs.budget': '💰 Budget',

    'table.date': 'Datum',
    'table.name': 'Name',
    'table.verwendungszweck': 'Verwendungszweck',
    'table.betrag': 'Betrag',
    'table.kategorie': 'Kategorie',
    'table.filterDate': 'Datum filtern',
    'table.filterName': 'Name filtern',
    'table.filterVerwendungszweck': 'Verwendungszweck filtern',
    'table.filterBetrag': 'Betrag filtern',
    'table.filterKategorie': 'Kategorie filtern',
    'table.selectAll': 'Alle auswählen',
    'table.assignCategory': 'Kategorie zuweisen',
    'table.clearSelection': 'Auswahl aufheben',
    'table.filterCategories': '🔍 Kategorien filtern...',
    'table.noCategoryMatch': 'Keine passende Kategorie',
    'table.selectedCount': '{count} ausgewählt',

    'breadcrumbs.allCategories': 'Alle Kategorien',

    'stats.expenses': 'Ausgaben:',
    'stats.income': 'Einnahmen (Lohn etc., fix):',
    'stats.net': 'Netto:',
    'stats.savingsRate': 'Sparquote:',
    'stats.filteredNote': 'Tabelle gefiltert:',
    'stats.resetFilter': '(zurücksetzen)',

    'budget.needCsv': 'Erst eine CSV laden.',
    'budget.intro.withPath': 'Budget für <b>{label}</b>: <b>{amount}</b>/Monat — verteile es unten auf die Unterkategorien.',
    'budget.intro.noBudget': 'Für <b>{label}</b> ist noch kein Budget gesetzt. Setz eins auf der vorherigen Ebene, oder vergib hier direkt Budgets für die Unterkategorien.',
    'budget.intro.root': 'Ø Ausgaben pro Monat für <b>{year}</b> je Kategorie (PayPal-Doppelbuchungen bereits ausgeschlossen). Klick auf einen Namen zum Reindrillen.',
    'budget.allYears': 'alle Jahre',
    'budget.avgIst': 'Ø Ist:',
    'budget.perMonth': '/Monat',
    'budget.overBudget': 'Über Budget um {amount}/Monat',
    'budget.inBudget': 'Im Budget ({amount} Spielraum/Monat)',
    'budget.noData': 'Keine Ausgaben in diesem Zeitraum/dieser Kategorie.',

    'modal.settingsTitle': 'EINSTELLUNGEN',
    'modal.save': 'Speichern',
    'modal.cancel': 'Abbrechen',
    'chartModal.defaultTitle': 'Diagrammansicht',

    'settingsTabs.rules': '📋 Regeln',
    'settingsTabs.importexport': '📤 Export / Import',
    'settingsTabs.languages': '🌐 Sprache',
    'settingsTabs.csvimport': '📄 CSV-Import',

    'rules.intro': 'Jede Regel ordnet Transaktionen anhand von Regex-Mustern (Name / Verwendungszweck / Bank-Kategorie) einer Kategorie und einer Gruppe zu. Die erste passende Regel (höchste Priorität) gewinnt. Ohne Treffer wird auf die Bank-Kategorie zurückgefallen.',
    'rules.searchPlaceholder': '🔍 Regeln durchsuchen (Label, Kategorie, Muster)...',
    'rules.addRule': '+ Regel hinzufügen',
    'rules.newRuleLabel': 'Neue Regel',
    'rules.newRuleCategory': 'Neue Kategorie',
    'rules.noRules': 'Keine Regeln definiert. Klicke auf "+ Regel hinzufügen".',
    'rules.labelPlaceholder': "Label (z.B. 'Miete', 'Steam')",
    'rules.categoryLabel': 'Kategorie (Anzeige im Dashboard):',
    'rules.categoryPlaceholder': 'z.B. Gaming',
    'rules.groupLabel': 'Gruppe:',
    'rules.namePatternLabel': 'Name-Muster (Regex):',
    'rules.namePatternPlaceholder': 'z.B. Amazon|Netflix|Spotify',
    'rules.verwendungPatternLabel': 'Verwendungszweck-Muster (Regex):',
    'rules.verwendungPatternPlaceholder': 'z.B. Miete|Abonnement',
    'rules.kategoriePatternLabel': 'Bank-Kategorie-Muster (Regex, optional):',
    'rules.kategoriePatternPlaceholder': 'z.B. Paypal',
    'rules.matchTypeLabel': 'Match-Typ:',
    'rules.matchTypeOr': 'OR (irgendein Muster trifft)',
    'rules.matchTypeAnd': 'AND (alle vorhandenen Muster müssen treffen)',
    'rules.priorityLabel': 'Priorität (höher = wird zuerst geprüft):',
    'rules.noLabel': '(ohne Label)',

    'importexport.loadDefault': '↺ Standardregeln laden',
    'importexport.export': '📤 SETTING exportieren',
    'importexport.import': '📥 SETTING importieren',
    'importexport.unclassifiedIntro': 'Unklassifizierte Ausgaben (aktuell gewählter Jahresfilter) als kompakte, nach Summe sortierte Händlerliste + aktuellem Regelwerk + fertigem Prompt exportieren — die Datei kann direkt einem LLM gegeben werden, das ein erweitertes SETTING zurückgibt (oben importierbar).',
    'importexport.exportUnclassified': '🔍 Unklassifizierte Posten für LLM exportieren',
    'importexport.confirmReplace': 'Eigene Regeln durch die Standardregeln ersetzen?',
    'importexport.importSuccess': 'SETTING erfolgreich importiert! Klicke "Speichern" um es zu übernehmen.',
    'importexport.importFailed': 'Import fehlgeschlagen: {error}',
    'importexport.invalidFile': 'Datei enthält kein gültiges "rules"-Array',

    'languages.title': 'App-Sprache',
    'languages.intro': 'Wähle die Sprache der Benutzeroberfläche. Deine Regeln/Kategorien-Bezeichnungen ändern sich dadurch nicht.',
    'languages.de': 'Deutsch',
    'languages.en': 'Englisch',

    'csv.intro': 'Lade hier deine CSV-Datei und stelle bei Bedarf das Format ein, falls dein Export nicht dem MoneyMoney-Standard entspricht.',
    'csv.pickFile': 'Datei auswählen',
    'csv.delimiterLabel': 'Trennzeichen (Spalten):',
    'csv.lineBreakLabel': 'Zeilenumbruch:',
    'csv.lineBreakAuto': 'Automatisch erkennen',
    'csv.encodingLabel': 'Zeichenkodierung:',
    'csv.decimalSeparatorLabel': 'Dezimaltrennzeichen:',
    'csv.hasHeaderLabel': 'Erste Zeile enthält Spaltennamen',
    'csv.columnMappingTitle': 'Spaltenzuordnung',
    'csv.columnMappingHint': 'Spaltenname (aus Kopfzeile) oder Spaltenindex (0, 1, 2, ...) angeben.',
    'csv.colDate': 'Datum',
    'csv.colName': 'Name',
    'csv.colDescription': 'Verwendungszweck / Beschreibung',
    'csv.colAmount': 'Betrag',
    'csv.colCategory': 'Kategorie (optional)',
    'csv.resetDefaults': '↺ Standardwerte laden',
    'csv.saveConfig': 'CSV-Einstellungen speichern',
    'csv.savedNote': 'Einstellungen gespeichert. Beim nächsten Laden einer Datei werden sie verwendet.',

    'alerts.loadSampleFailed': 'Beispieldaten konnten nicht geladen werden',
    'alerts.needCsvFirst': 'Erst eine CSV laden.',

    'charts.income': 'Einnahmen',
    'charts.avgFixed': 'Ø Fixkosten (Monat)',
    'charts.avgIncome': 'Ø Einnahmen',
    'charts.avgOutgoing': 'Ø Ausgaben',
    'charts.totalAvgIncome': 'Ø Einnahmen gesamt',
    'charts.totalAvgOutgoing': 'Ø Ausgaben gesamt',
    'charts.averageMonthlyMetrics': 'Durchschnittliche Monatswerte',
    'charts.moneyLeaks': 'Wo fließt das Geld hin? (Top Kategorien)',
    'charts.expenses': 'Ausgaben',
    'charts.incomeNetTitle': 'Einnahmen {income}  →  Netto {net}',
    'charts.month': 'Monat',
    'charts.growthRatePercent': 'Wachstumsrate (%)',
    'charts.momTitle': 'Monat-über-Monat Wachstum (%)',
    'charts.yoyTitle': 'Jahr-über-Jahr Wachstum (%)',
    'footer.poweredBy': 'Powered by'
  },
  en: {
    'app.title': 'MoneyMoney Analyzer',
    'filters.loadSample': 'Load Sample Data',
    'filters.resetDrill': 'Reset Drill',
    'filters.allYears': 'All Years',
    'filters.growthRate': 'Growth Rate:',
    'filters.mom': 'MoM',
    'filters.yoy': 'YoY',
    'filters.chart': 'Chart:',
    'filters.line': 'Line',
    'filters.bar': 'Bar',
    'filters.settings': '⚙️ SETTINGS',

    'mainTabs.overview': '📊 Overview',
    'mainTabs.budget': '💰 Budget',

    'table.date': 'Date',
    'table.name': 'Name',
    'table.verwendungszweck': 'Description',
    'table.betrag': 'Amount',
    'table.kategorie': 'Category',
    'table.filterDate': 'Filter Date',
    'table.filterName': 'Filter Name',
    'table.filterVerwendungszweck': 'Filter Description',
    'table.filterBetrag': 'Filter Amount',
    'table.filterKategorie': 'Filter Category',
    'table.selectAll': 'Select all',
    'table.assignCategory': 'Assign category',
    'table.clearSelection': 'Clear selection',
    'table.filterCategories': '🔍 Filter categories...',
    'table.noCategoryMatch': 'No matching category',
    'table.selectedCount': '{count} selected',

    'breadcrumbs.allCategories': 'All Categories',

    'stats.expenses': 'Expenses:',
    'stats.income': 'Income (salary etc., fixed):',
    'stats.net': 'Net:',
    'stats.savingsRate': 'Savings Rate:',
    'stats.filteredNote': 'Table filtered:',
    'stats.resetFilter': '(reset)',

    'budget.needCsv': 'Load a CSV first.',
    'budget.intro.withPath': 'Budget for <b>{label}</b>: <b>{amount}</b>/month — distribute it below across the subcategories.',
    'budget.intro.noBudget': 'No budget set for <b>{label}</b> yet. Set one at the previous level, or assign budgets for the subcategories directly here.',
    'budget.intro.root': 'Avg. monthly spend for <b>{year}</b> by category (PayPal double-bookings already excluded). Click a name to drill in.',
    'budget.allYears': 'all years',
    'budget.avgIst': 'Avg. actual:',
    'budget.perMonth': '/month',
    'budget.overBudget': 'Over budget by {amount}/month',
    'budget.inBudget': 'Within budget ({amount} headroom/month)',
    'budget.noData': 'No expenses in this period/category.',

    'modal.settingsTitle': 'SETTINGS',
    'modal.save': 'Save',
    'modal.cancel': 'Cancel',
    'chartModal.defaultTitle': 'Chart View',

    'settingsTabs.rules': '📋 Rules',
    'settingsTabs.importexport': '📤 Export / Import',
    'settingsTabs.languages': '🌐 Language',
    'settingsTabs.csvimport': '📄 CSV Import',

    'rules.intro': 'Each rule assigns transactions to a category and a group based on regex patterns (Name / Description / Bank Category). The first matching rule (highest priority) wins. Without a match, it falls back to the bank category.',
    'rules.searchPlaceholder': '🔍 Search rules (label, category, pattern)...',
    'rules.addRule': '+ Add Rule',
    'rules.newRuleLabel': 'New Rule',
    'rules.newRuleCategory': 'New Category',
    'rules.noRules': 'No rules defined. Click "+ Add Rule".',
    'rules.labelPlaceholder': "Label (e.g. 'Rent', 'Steam')",
    'rules.categoryLabel': 'Category (shown in dashboard):',
    'rules.categoryPlaceholder': 'e.g. Gaming',
    'rules.groupLabel': 'Group:',
    'rules.namePatternLabel': 'Name Pattern (Regex):',
    'rules.namePatternPlaceholder': 'e.g. Amazon|Netflix|Spotify',
    'rules.verwendungPatternLabel': 'Description Pattern (Regex):',
    'rules.verwendungPatternPlaceholder': 'e.g. Rent|Subscription',
    'rules.kategoriePatternLabel': 'Bank Category Pattern (Regex, optional):',
    'rules.kategoriePatternPlaceholder': 'e.g. Paypal',
    'rules.matchTypeLabel': 'Match Type:',
    'rules.matchTypeOr': 'OR (any pattern matches)',
    'rules.matchTypeAnd': 'AND (all present patterns must match)',
    'rules.priorityLabel': 'Priority (higher = checked first):',
    'rules.noLabel': '(no label)',

    'importexport.loadDefault': '↺ Load Default Rules',
    'importexport.export': '📤 Export SETTING',
    'importexport.import': '📥 Import SETTING',
    'importexport.unclassifiedIntro': 'Export unclassified expenses (current year filter) as a compact, sum-sorted merchant list + current ruleset + ready-made prompt — the file can be given directly to an LLM, which returns an extended SETTING (importable above).',
    'importexport.exportUnclassified': '🔍 Export Unclassified Items for LLM',
    'importexport.confirmReplace': 'Replace your rules with the default rules?',
    'importexport.importSuccess': 'SETTING imported successfully! Click "Save" to apply it.',
    'importexport.importFailed': 'Import failed: {error}',
    'importexport.invalidFile': 'File does not contain a valid "rules" array',

    'languages.title': 'App Language',
    'languages.intro': 'Choose the user interface language. Your rule/category labels are not affected.',
    'languages.de': 'German',
    'languages.en': 'English',

    'csv.intro': 'Load your CSV file here and adjust the format if your export does not match the MoneyMoney standard.',
    'csv.pickFile': 'Choose File',
    'csv.delimiterLabel': 'Delimiter (columns):',
    'csv.lineBreakLabel': 'Line Break:',
    'csv.lineBreakAuto': 'Auto-detect',
    'csv.encodingLabel': 'Character Encoding:',
    'csv.decimalSeparatorLabel': 'Decimal Separator:',
    'csv.hasHeaderLabel': 'First row contains column names',
    'csv.columnMappingTitle': 'Column Mapping',
    'csv.columnMappingHint': 'Enter a column name (from header row) or a column index (0, 1, 2, ...).',
    'csv.colDate': 'Date',
    'csv.colName': 'Name',
    'csv.colDescription': 'Description / Purpose',
    'csv.colAmount': 'Amount',
    'csv.colCategory': 'Category (optional)',
    'csv.resetDefaults': '↺ Load Defaults',
    'csv.saveConfig': 'Save CSV Settings',
    'csv.savedNote': 'Settings saved. They will be used the next time a file is loaded.',

    'alerts.loadSampleFailed': 'Failed to load sample data',
    'alerts.needCsvFirst': 'Load a CSV first.',

    'charts.income': 'Income',
    'charts.avgFixed': 'Avg. Fixed Costs (Month)',
    'charts.avgIncome': 'Avg Income',
    'charts.avgOutgoing': 'Avg Outgoing',
    'charts.totalAvgIncome': 'Total Avg Income',
    'charts.totalAvgOutgoing': 'Total Avg Outgoing',
    'charts.averageMonthlyMetrics': 'Average Monthly Metrics',
    'charts.moneyLeaks': 'Where does the money go? (Top Categories)',
    'charts.expenses': 'Expenses',
    'charts.incomeNetTitle': 'Income {income}  →  Net {net}',
    'charts.month': 'Month',
    'charts.growthRatePercent': 'Growth Rate (%)',
    'charts.momTitle': 'Month-over-Month Growth (%)',
    'charts.yoyTitle': 'Year-over-Year Growth (%)',
    'footer.poweredBy': 'Powered by'
  }
};

let currentLang = null;

export function get_language() {
  if (currentLang) return currentLang;
  currentLang = localStorage.getItem(STORAGE_KEY) || 'de';
  return currentLang;
}

export function set_language(lang) {
  currentLang = dict[lang] ? lang : 'de';
  localStorage.setItem(STORAGE_KEY, currentLang);
}

// Translates `key`, optionally interpolating `{placeholder}` tokens from `vars`.
export function t(key, vars) {
  const lang = get_language();
  let str = (dict[lang] && dict[lang][key]) || (dict.de && dict.de[key]) || key;
  if (vars) {
    Object.keys(vars).forEach(k => {
      str = str.replaceAll(`{${k}}`, vars[k]);
    });
  }
  return str;
}

// Applies translations to every element carrying data-i18n / data-i18n-placeholder
// / data-i18n-title attributes. Call once on load and again after a language switch.
export function apply_static_i18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  root.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.getAttribute('data-i18n-title'));
  });
  root.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.getAttribute('data-i18n-html'));
  });
  document.documentElement.lang = get_language();
}
