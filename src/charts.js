// --- charts.js ---
// Chart.js loaded via UMD in index.html, available as global Chart
let combined_chart = null;

export function get_color(cat) { 
  const colors = [
    '#e74c3c', // red
    '#3498db', // blue
    '#f39c12', // orange
    '#2ecc71', // green
    '#9b59b6', // purple
    '#1abc9c', // turquoise
    '#e67e22', // dark orange
    '#34495e', // dark blue-gray
    '#f1c40f', // yellow
    '#16a085', // dark turquoise
    '#c0392b', // dark red
    '#d35400', // burnt orange
    '#8e44ad', // dark purple
    '#27ae60', // dark green
    '#2980b9', // darker blue
    '#95a5a6'  // gray
  ]; 
  return colors[cat.length % colors.length]; 
}

export function render_combined_chart(outData, inData, canvasId, onBarClick) {
  const labelSet = new Set([...(Object.keys(outData||{})), ...(Object.keys(inData||{}))]);
  const keys = Array.from(labelSet).sort();
  // pretty labels like "Nov 2025"
  const labels = keys.map(k => {
    const [y, m] = k.split('-').map(Number);
    try {
      return new Date(y, m-1, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
    } catch (e) { return k; }
  });
  const categories = [...new Set(Object.values(outData||{}).flatMap(o => Object.keys(o||{})))];
  // Map data using keys (not pretty labels)
  // convert cents -> euros for chart display (exact division)
  const barDatasets = categories.map(cat => ({
    type: 'bar', label: cat,
    data: keys.map(k => (outData[k] && outData[k][cat]) ? (outData[k][cat] / 100) : 0),
    backgroundColor: get_color(cat), stack: 'out', order:1
  }));
  // make the line visually dominant and ensure it renders after bars
  const lineDataset = {
    type: 'line',
    label: 'Income',
    data: keys.map(k => (inData[k] || 0) / 100),
    borderColor: 'green',
    backgroundColor: 'rgba(0,128,0,0.05)',
    fill: false,
    order: 100,
    borderWidth: 3,
    pointRadius: 4,
    pointHoverRadius: 6,
    tension: 0.1
  };
  const datasets = [...barDatasets, lineDataset];
  const sumsOut = keys.map(k => Object.values(outData[k]||{}).reduce((a,b)=>a+b,0));
  const maxOut = sumsOut.length ? Math.max(...sumsOut) : 0;
  const maxIn = keys.map(k=>inData[k]||0).reduce((a,b)=>Math.max(a,b),0);
  // maxVal in euros
  let maxVal = Math.ceil(Math.max(maxOut, maxIn, 100) * 1.05) / 100;
  if (combined_chart) combined_chart.destroy();
  combined_chart = new Chart(document.getElementById(canvasId), {
    data: { labels, datasets },
    options: {
      scales: { x:{stacked:true}, y:{stacked:true,beginAtZero:true,max:maxVal} },
      onClick: (evt, elements) => {
        if (!elements || !elements.length) return;
        const el = elements[0];
        const dsIndex = el.datasetIndex;
        // only handle bar dataset clicks
        if (dsIndex < categories.length && typeof onBarClick === 'function') {
          const cat = categories[dsIndex];
          onBarClick(cat);
        }
      },
      plugins:{ tooltip:{ callbacks:{ label:(ctx)=>`${ctx.dataset.label}: ${formatNumber(ctx.parsed.y)}` }}}
    }
  });

function formatNumber(v) { return (Math.round((v + Number.EPSILON) * 100) / 100).toFixed(2); }
}

let growth_chart = null;

export function render_growth_chart(outData, canvasId) {
  const keys = Object.keys(outData || {}).sort();
  const labels = keys.map(k => {
    const [y, m] = k.split('-').map(Number);
    try {
      return new Date(y, m-1, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
    } catch (e) { return k; }
  });
  const categories = [...new Set(Object.values(outData||{}).flatMap(o => Object.keys(o||{})))];
  
  // Calculate growth rates (month-over-month % change)
  const datasets = categories.map(cat => {
    const values = keys.map(k => (outData[k] && outData[k][cat]) ? outData[k][cat] : 0);
    const growthRates = values.map((v, i) => {
      if (i === 0 || values[i-1] === 0) return 0;
      return ((v - values[i-1]) / values[i-1]) * 100;
    });
    return {
      type: 'line',
      label: cat,
      data: growthRates,
      borderColor: get_color(cat),
      backgroundColor: 'transparent',
      fill: false,
      tension: 0.1,
      borderWidth: 2
    };
  });

  if (growth_chart) growth_chart.destroy();
  growth_chart = new Chart(document.getElementById(canvasId), {
    data: { labels, datasets },
    options: {
      scales: {
        x: { title: { display: true, text: 'Month' } },
        y: { title: { display: true, text: 'Growth Rate (%)' }, beginAtZero: true }
      },
      plugins: {
        title: { display: true, text: 'Category Growth Rates (%)' },
        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}%` } }
      }
    }
  });
}
