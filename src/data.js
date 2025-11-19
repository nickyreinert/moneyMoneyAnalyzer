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
    obj.betrag_num = parseFloat((obj.Betrag || '0').replace(',', '.'));
    return obj;
  });
  filtered_data = [...data];
}

export function parse_date(s) {
  const [d,m,y] = (s||'01.01.1970').split('.');
  return new Date(y, m-1, d);
}

export function group_data(rows, level) {
  const out = {};
  const inData = {};
  // For expenses (out) apply current_path filtering so drill-down works
  const filteredOut = rows.filter(r => current_path.every((p, i) => r.categories[i] === p));
  filteredOut.forEach(r => {
    if (r.in_out === 'out') {
      const key = `${r.date.getFullYear()}-${String(r.date.getMonth()+1).padStart(2,'0')}`;
      const cat = r.categories[level] || 'Other';
      out[key] = out[key] || {};
      out[key][cat] = (out[key][cat] || 0) + Math.abs(r.betrag_num);
    }
  });
  // For income (in) always aggregate from all rows provided (year-filtered), ignore current_path
  rows.forEach(r => {
    if (r.in_out === 'in') {
      const key = `${r.date.getFullYear()}-${String(r.date.getMonth()+1).padStart(2,'0')}`;
      inData[key] = (inData[key] || 0) + r.betrag_num;
    }
  });
  return { out, in: inData };
}

export function reset_state() { current_path = []; localStorage.removeItem('currentPath'); }
