// --- Main JS Module ---
// Handles CSV parsing, grouping, charting and table rendering

import Chart from 'https://cdn.jsdelivr.net/npm/chart.js/dist/chart.esm.js';

export let data = [];
export let filtered_data = [];
export let current_path = [];
let combined_chart = null;

// --- CSV / Parsing ---
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

// --- Grouping ---
export function group_data(rows, level) {
  const out = {};
  const inData = {};
  const filtered = rows.filter(r => current_path.every((p,i) => r.categories[i] === p));
  filtered.forEach(r => {
    const key = `${r.date.getFullYear()}-${String(r.date.getMonth()+1).padStart(2,'0')}`;
    const cat = r.categories[level] || 'Other';
    if (r.in_out === 'out') {
      out[key] = out[key] || {};
      out[key][cat] = (out[key][cat] || 0) + Math.abs(r.betrag_num);
    } else {
      inData[key] = (inData[key] || 0) + r.betrag_num;
    }
  });
  return { out, in: inData };
}

// --- Charting ---
export function render_combined_chart(outData, inData, canvasId) {
  const labelSet = new Set([...(Object.keys(outData||{})), ...(Object.keys(inData||{}))]);
  const labels = Array.from(labelSet).sort();
  const categories = [...new Set(Object.values(outData||{}).flatMap(o => Object.keys(o||{})))];
  const barDatasets = categories.map(cat => ({
    type: 'bar', label: cat,
    data: labels.map(l => (outData[l] && outData[l][cat]) ? outData[l][cat] : 0),
    backgroundColor: get_color(cat), stack: 'out', order:1
  }));
  const lineDataset = { type: 'line', label: 'Income', data: labels.map(l => inData[l] || 0), borderColor: 'green', fill:false, order:2 };
  const datasets = [...barDatasets, lineDataset];
  const sumsOut = labels.map(l => Object.values(outData[l]||{}).reduce((a,b)=>a+b,0));
  const maxOut = sumsOut.length ? Math.max(...sumsOut) : 0;
  const maxIn = labels.map(l=>inData[l]||0).reduce((a,b)=>Math.max(a,b),0);
  let maxVal = Math.ceil(Math.max(maxOut,maxIn,1) * 1.05);
  if (combined_chart) combined_chart.destroy();
  combined_chart = new Chart(document.getElementById(canvasId), { data: { labels, datasets }, options: { scales: { x:{stacked:true}, y:{stacked:true,beginAtZero:true,max:maxVal} }, plugins:{ tooltip:{ callbacks:{ label:(ctx)=>`${ctx.dataset.label}: ${ctx.parsed.y}` }}} } });
}

// --- Table ---
export function render_table(rows, tbodySelector) {
  const tbody = document.querySelector(tbodySelector);
  tbody.innerHTML = '';
  const display = rows.filter(r => r.in_out === 'out' && current_path.every((p,i) => r.categories[i] === p));
  display.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.Datum}</td><td>${r.Name}</td><td>${r.Verwendungszweck}</td><td>${r.Betrag}</td>`;
    tbody.appendChild(tr);
  });
}

// --- Utils ---
export function get_color(cat) { const colors = ['red','blue','yellow','green','purple','orange']; return colors[cat.length % colors.length]; }

// Minimal exports for UI to use
export function reset_state() { current_path = []; localStorage.removeItem('currentPath'); }
