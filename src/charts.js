// --- charts.js ---
// Chart.js loaded via UMD in index.html, available as global Chart
let combined_chart = null;

export function get_color(cat) { const colors = ['#d9534f','#5bc0de','#f0ad4e','#5cb85c','#9966cc','#ff8c00']; return colors[cat.length % colors.length]; }

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
  const lineDataset = { type: 'line', label: 'Income', data: keys.map(k => (inData[k] || 0) / 100), borderColor: 'green', backgroundColor: 'rgba(0,128,0,0.05)', fill:false, order:2 };
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
