// --- data.js ---
export let data = [];
export let filtered_data = [];
export let current_path = [];

export function parse_csv(csv) {
  const lines = csv.split('\n');
  const headers = lines[0].split(';');
  data = lines.slice(1).filter(l => l.trim()).map(line => {
    const values = line.split(';');
    const obj = {};
    headers.forEach((h, i) => obj[h] = values[i]);
    obj.date = parse_date(obj.Datum);
    obj.categories = obj.Kategorie ? obj.Kategorie.split(' - ') : ['Other'];
    obj.in_out = parseFloat((obj.Betrag || '0').replace(',', '.')) > 0 ? 'in' : 'out';
    // store amounts as integer cents to avoid floating point accumulation
    const parsed = Math.round(parseFloat((obj.Betrag || '0').replace(',', '.')) * 100);
    obj.betrag_cents = Number.isNaN(parsed) ? 0 : parsed;
    // Store name and verwendungszweck for regex matching
    obj.name = obj.Name || '';
    obj.verwendungszweck = obj.Verwendungszweck || '';
    return obj;
  });
  filtered_data = [...data];
}

export function parse_date(s) {
  const [d,m,y] = (s||'01.01.1970').split('.');
  return new Date(y, m-1, d);
}

// Rows classified (via rules.js classify_all) as excludeFromTotals are
// internal transfers (e.g. PayPal wallet funding legs) that have zero real
// cashflow impact — the actual expense/income already shows up as its own
// transaction elsewhere. They must be excluded from every sum, otherwise
// income and expenses both get inflated by the same internal amount.
function is_real_cashflow(r) {
  return !(r._cls && r._cls.excluded);
}

export function group_data(rows, level) {
  const out = {};
  const inData = {};

  // For expenses (out) - apply filtering based on mode
  let filteredOut = rows.filter(r => r.in_out === 'out' && is_real_cashflow(r));

  if (current_path.length > 0) {
    // apply current_path filtering from original bank categories
    filteredOut = filteredOut.filter(r => current_path.every((p, i) => r.categories[i] === p));
  }

  filteredOut.forEach(r => {
    const key = `${r.date.getFullYear()}-${String(r.date.getMonth()+1).padStart(2,'0')}`;
    const cat = r.categories[level] || 'Other';
    out[key] = out[key] || {};
    out[key][cat] = (out[key][cat] || 0) + Math.abs(r.betrag_cents);
  });
  
  // For income (in) always aggregate from all rows provided (year-filtered), ignore current_path
  rows.forEach(r => {
    if (r.in_out === 'in' && is_real_cashflow(r)) {
      const key = `${r.date.getFullYear()}-${String(r.date.getMonth()+1).padStart(2,'0')}`;
      inData[key] = (inData[key] || 0) + r.betrag_cents;
    }
  });
  
  return { out, in: inData };
}

export function calculate_monthly_averages(rows) {
  const monthStats = Array(12).fill(0).map(() => ({ in: 0, out: 0 }));
  let totalIn = 0;
  let totalOut = 0;
  
  // Calculate date range to determine divisor for each month
  if (rows.length === 0) return { monthlyAverages: [], globalAverage: { in: 0, out: 0 } };

  // Sort by date to find min/max
  const sorted = [...rows].sort((a,b) => a.date - b.date);
  const minDate = sorted[0].date;
  const maxDate = sorted[sorted.length - 1].date;
  
  // Count how many times each month index actually occurred in the timespan
  const monthCounts = Array(12).fill(0);
  let curr = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
  
  let totalMonths = 0;
  while (curr <= end) {
    monthCounts[curr.getMonth()]++;
    totalMonths++;
    curr.setMonth(curr.getMonth() + 1);
  }

  rows.forEach(r => {
    if (!is_real_cashflow(r)) return;
    const m = r.date.getMonth();
    if (r.in_out === 'in') {
      monthStats[m].in += r.betrag_cents;
      totalIn += r.betrag_cents;
    } else {
      monthStats[m].out += Math.abs(r.betrag_cents);
      totalOut += Math.abs(r.betrag_cents);
    }
  });

  const monthlyAverages = monthStats.map((stat, idx) => ({
    in: monthCounts[idx] ? (stat.in / monthCounts[idx]) : 0,
    out: monthCounts[idx] ? (stat.out / monthCounts[idx]) : 0
  }));

  const globalAverage = {
    in: totalMonths ? (totalIn / totalMonths) : 0,
    out: totalMonths ? (totalOut / totalMonths) : 0
  };

  return { monthlyAverages, globalAverage };
}

// Monthly average of a single classified category (e.g. the "fixed" group
// total, or one leak category), for overlaying as a reference line on the
// combined chart. `matchGroupOrCategory` is compared against r._cls.group
// and r._cls.category.
export function calculate_classified_average(rows, matchGroupOrCategory) {
  if (!matchGroupOrCategory) return null;

  const matching = rows.filter(r => r.in_out === 'out' && is_real_cashflow(r) &&
    r._cls && (r._cls.group === matchGroupOrCategory || r._cls.category === matchGroupOrCategory));

  if (matching.length === 0) return null;

  const allMonths = new Set();
  rows.forEach(r => {
    const key = `${r.date.getFullYear()}-${String(r.date.getMonth()+1).padStart(2,'0')}`;
    allMonths.add(key);
  });

  const monthCount = allMonths.size;
  if (monthCount === 0) return null;

  const total = matching.reduce((sum, r) => sum + Math.abs(r.betrag_cents), 0);
  const monthlyAvgEuros = (total / monthCount) / 100;

  const avgData = {};
  allMonths.forEach(month => { avgData[month] = monthlyAvgEuros; });
  return avgData;
}

// Ranks classified spending categories by total amount ("wo fließt das
// Geld hin") for the given rows (already date/year filtered by the caller).
// Requires classify_all(rows, ruleSet) to have been called first so each
// row carries r._cls.
export function build_leak_report(rows) {
  const byCategory = {};
  rows.forEach(r => {
    if (r.in_out !== 'out' || !is_real_cashflow(r)) return;
    const cls = r._cls || { category: 'Unklassifiziert', group: 'unclassified' };
    const key = cls.category;
    byCategory[key] = byCategory[key] || { category: key, group: cls.group, cents: 0, count: 0 };
    byCategory[key].cents += Math.abs(r.betrag_cents);
    byCategory[key].count += 1;
  });
  return Object.values(byCategory).sort((a, b) => b.cents - a.cents);
}

// Sums expenses per top-level group (fixed / essential / discretionary /
// unclassified / ...) plus total income, so the UI can show a savings-rate
// style overview ("Fixkosten vs. frei verfügbares Geld vs. Sparen").
export function build_group_summary(rows) {
  const byGroup = {};
  let totalIncome = 0;
  rows.forEach(r => {
    if (!is_real_cashflow(r)) return;
    if (r.in_out === 'in') {
      totalIncome += r.betrag_cents;
      return;
    }
    const cls = r._cls || { group: 'unclassified' };
    byGroup[cls.group] = (byGroup[cls.group] || 0) + Math.abs(r.betrag_cents);
  });
  const totalExpenses = Object.values(byGroup).reduce((a, b) => a + b, 0);
  return { byGroup, totalIncome, totalExpenses, net: totalIncome - totalExpenses };
}

export function reset_state() { current_path = []; localStorage.removeItem('currentPath'); }

function round2(v) { return Math.round((v + Number.EPSILON) * 100) / 100; }
