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

export function group_data(rows, level, recurringMatcher = null, recurringPath = null) {
  const out = {};
  const inData = {};
  
  // For expenses (out) - apply filtering based on mode
  let filteredOut = rows.filter(r => r.in_out === 'out');
  
  // Handle recurring mode filtering
  if (recurringPath && recurringPath.length >= 1) {
    const isRecurringPath = recurringPath[0] === 'Recurring / Base Costs';
    const isOtherPath = recurringPath[0] === 'Other Expenses';
    
    // First: filter by recurring/non-recurring
    if (isRecurringPath) {
      filteredOut = filteredOut.filter(r => recurringMatcher && recurringMatcher(r));
    } else if (isOtherPath) {
      filteredOut = filteredOut.filter(r => !recurringMatcher || !recurringMatcher(r));
    }
    
    // Second: if we drilled deeper, apply category filtering from original data
    if (recurringPath.length > 1) {
      const actualPath = recurringPath.slice(1); // Skip first element (Recurring/Other)
      filteredOut = filteredOut.filter(r => actualPath.every((p, i) => r.categories[i] === p));
    }
  } else if (current_path.length > 0 && !recurringMatcher) {
    // Normal mode: apply current_path filtering from original categories
    filteredOut = filteredOut.filter(r => current_path.every((p, i) => r.categories[i] === p));
  }
  
  filteredOut.forEach(r => {
    const key = `${r.date.getFullYear()}-${String(r.date.getMonth()+1).padStart(2,'0')}`;
    let cat;
    
    // Determine which category to use
    if (recurringMatcher && level === 0 && current_path.length === 0) {
      // Top level with recurring enabled: show two meta-categories
      const recurringLabel = recurringMatcher(r);
      if (recurringLabel) {
        cat = 'Recurring / Base Costs';
      } else {
        cat = 'Other Expenses';
      }
    } else {
      // Use original category from CSV data at the current level
      cat = r.categories[level] || 'Other';
    }
    
    out[key] = out[key] || {};
    out[key][cat] = (out[key][cat] || 0) + Math.abs(r.betrag_cents);
  });
  
  // For income (in) always aggregate from all rows provided (year-filtered), ignore current_path
  rows.forEach(r => {
    if (r.in_out === 'in') {
      const key = `${r.date.getFullYear()}-${String(r.date.getMonth()+1).padStart(2,'0')}`;
      inData[key] = (inData[key] || 0) + r.betrag_cents;
    }
  });
  
  return { out, in: inData };
}

export function reset_state() { current_path = []; localStorage.removeItem('currentPath'); }

function round2(v) { return Math.round((v + Number.EPSILON) * 100) / 100; }
