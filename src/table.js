// --- table.js ---
export function render_table(rows, tbodySelector, current_path) {
  const tbody = document.querySelector(tbodySelector);
  tbody.innerHTML = '';
  const display = rows.filter(r => r.in_out === 'out' && current_path.every((p,i) => r.categories[i] === p));
  display.forEach(r => {
    const tr = document.createElement('tr');
    const euro = (r.betrag_cents / 100).toFixed(2);
    tr.innerHTML = `<td>${r.Datum}</td><td>${r.Name}</td><td>${r.Verwendungszweck}</td><td>${euro}</td>`;
    tbody.appendChild(tr);
  });
}
