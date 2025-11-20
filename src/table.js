// --- table.js ---
let sortState = { column: null, ascending: true };

export function render_table(rows, tbodySelector, current_path) {
  const tbody = document.querySelector(tbodySelector);
  tbody.innerHTML = '';
  let display = rows.filter(r => r.in_out === 'out' && current_path.every((p,i) => r.categories[i] === p));
  
  // Apply column filters
  const filterInputs = document.querySelectorAll('th input');
  filterInputs.forEach(input => {
    const column = input.closest('th').getAttribute('data-column');
    const filterValue = input.value.toLowerCase().trim();
    if (filterValue) {
      display = display.filter(r => {
        let cellValue = '';
        if (column === 'date') cellValue = r.Datum || '';
        else if (column === 'name') cellValue = r.Name || '';
        else if (column === 'verwendungszweck') cellValue = r.Verwendungszweck || '';
        else if (column === 'betrag') cellValue = (r.betrag_cents / 100).toFixed(2);
        return cellValue.toLowerCase().includes(filterValue);
      });
    }
  });
  
  // Apply sorting
  if (sortState.column) {
    display.sort((a, b) => {
      let aVal, bVal;
      if (sortState.column === 'date') {
        aVal = a.date.getTime();
        bVal = b.date.getTime();
      } else if (sortState.column === 'name') {
        aVal = (a.Name || '').toLowerCase();
        bVal = (b.Name || '').toLowerCase();
      } else if (sortState.column === 'verwendungszweck') {
        aVal = (a.Verwendungszweck || '').toLowerCase();
        bVal = (b.Verwendungszweck || '').toLowerCase();
      } else if (sortState.column === 'betrag') {
        aVal = a.betrag_cents;
        bVal = b.betrag_cents;
      }
      if (aVal < bVal) return sortState.ascending ? -1 : 1;
      if (aVal > bVal) return sortState.ascending ? 1 : -1;
      return 0;
    });
  }
  
  display.forEach(r => {
    const tr = document.createElement('tr');
    const euro = (r.betrag_cents / 100).toFixed(2);
    tr.innerHTML = `<td>${r.Datum}</td><td>${r.Name}</td><td>${r.Verwendungszweck}</td><td>${euro}</td>`;
    tbody.appendChild(tr);
  });
}

// Initialize sorting and filtering
export function init_table_controls(renderCallback) {
  // Add sorting to headers
  document.querySelectorAll('th[data-column]').forEach(th => {
    th.style.cursor = 'pointer';
    th.addEventListener('click', (e) => {
      if (e.target.tagName === 'INPUT') return; // Don't sort when clicking input
      const column = th.getAttribute('data-column');
      if (sortState.column === column) {
        sortState.ascending = !sortState.ascending;
      } else {
        sortState.column = column;
        sortState.ascending = true;
      }
      renderCallback();
    });
  });
  
  // Add filtering to inputs
  document.querySelectorAll('th input').forEach(input => {
    input.addEventListener('input', (e) => {
      e.stopPropagation();
      renderCallback();
    });
    input.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });
}
