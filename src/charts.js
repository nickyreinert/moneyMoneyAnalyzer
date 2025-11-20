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
    backgroundColor: get_color(cat), stack: 'out', order: 10
  }));
  // make the line visually dominant and ensure it renders after bars
  const lineDataset = {
    type: 'line',
    label: 'Income',
    data: keys.map(k => (inData[k] || 0) / 100),
    borderColor: '#2ecc71',
    backgroundColor: 'rgba(46,204,113,0.1)',
    fill: false,
    order: 1,
    borderWidth: 4,
    pointRadius: 5,
    pointHoverRadius: 7,
    pointBackgroundColor: '#2ecc71',
    pointBorderColor: '#fff',
    pointBorderWidth: 2,
    tension: 0.2
  };
  const datasets = [...barDatasets, lineDataset];
  const sumsOut = keys.map(k => Object.values(outData[k]||{}).reduce((a,b)=>a+b,0));
  const maxOut = sumsOut.length ? Math.max(...sumsOut) : 0;
  const maxIn = keys.map(k=>inData[k]||0).reduce((a,b)=>Math.max(a,b),0);
  // maxVal in euros
  let maxVal = Math.ceil(Math.max(maxOut, maxIn, 100) * 1.05) / 100;
  
  // Calculate stack totals in euros for each bar
  const stackTotals = keys.map(k => {
    const total = Object.values(outData[k] || {}).reduce((a, b) => a + b, 0);
    return total / 100; // Convert cents to euros
  });
  
  // Custom plugin to draw sum labels on top of stacked bars
  const stackSumPlugin = {
    id: 'stackSumLabels',
    afterDatasetsDraw(chart) {
      const { ctx, chartArea: { top }, scales: { x, y } } = chart;
      ctx.save();
      
      // Draw sum for each bar
      stackTotals.forEach((total, index) => {
        if (total === 0) return; // Skip if no data
        
        const xPos = x.getPixelForValue(index);
        const yPos = y.getPixelForValue(total);
        
        ctx.fillStyle = '#333';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        // Format number with 2 decimals
        const label = total.toFixed(2);
        ctx.fillText(label, xPos, yPos - 5);
      });
      
      ctx.restore();
    }
  };
  
  if (combined_chart) combined_chart.destroy();
  combined_chart = new Chart(document.getElementById(canvasId), {
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { x:{stacked:true}, y:{stacked:true,beginAtZero:true,max:maxVal} },
      onClick: (evt, elements) => {
        if (!elements || !elements.length) return;
        const el = elements[0];
        const dsIndex = el.datasetIndex;
        // only handle bar dataset clicks, and don't allow drilling into "Other"
        if (dsIndex < categories.length && typeof onBarClick === 'function') {
          const cat = categories[dsIndex];
          if (cat !== 'Other') {
            onBarClick(cat);
          }
        }
      },
      plugins:{ 
        tooltip:{ callbacks:{ label:(ctx)=>`${ctx.dataset.label}: ${formatNumber(ctx.parsed.y)}` }}
      }
    },
    plugins: [stackSumPlugin]
  });

function formatNumber(v) { return (Math.round((v + Number.EPSILON) * 100) / 100).toFixed(2); }
}

let growth_chart = null;

export function render_growth_chart(outData, canvasId, mode = 'mom', chartType = 'line') {
  const keys = Object.keys(outData || {}).sort();
  
  // For YoY mode, filter to show only the most recent year on X-axis
  let displayKeys = keys;
  if (mode === 'yoy' && keys.length > 0) {
    // Get the year of the last key (most recent)
    const lastKey = keys[keys.length - 1];
    const [lastYear] = lastKey.split('-').map(Number);
    // Only show keys from the current (most recent) year
    displayKeys = keys.filter(k => {
      const [y] = k.split('-').map(Number);
      return y === lastYear;
    });
  }
  
  const labels = displayKeys.map(k => {
    const [y, m] = k.split('-').map(Number);
    try {
      return new Date(y, m-1, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
    } catch (e) { return k; }
  });
  const categories = [...new Set(Object.values(outData||{}).flatMap(o => Object.keys(o||{})))];
  
  // Calculate growth rates based on mode
  const datasets = categories.map(cat => {
    const values = keys.map(k => (outData[k] && outData[k][cat]) ? outData[k][cat] : 0);
    const growthRates = values.map((v, i) => {
      if (mode === 'mom') {
        // Month-over-Month
        if (i === 0 || values[i-1] === 0) return 0;
        return ((v - values[i-1]) / values[i-1]) * 100;
      } else {
        // Year-over-Year
        if (i < 12 || values[i-12] === 0) return 0;
        return ((v - values[i-12]) / values[i-12]) * 100;
      }
    });
    
    // For display, only use growth rates for the display keys
    const displayGrowthRates = mode === 'yoy' 
      ? displayKeys.map(dk => {
          const idx = keys.indexOf(dk);
          return idx >= 0 ? growthRates[idx] : 0;
        })
      : growthRates;
    
    return {
      type: chartType,
      label: cat,
      data: displayGrowthRates,
      borderColor: chartType === 'line' ? get_color(cat) : undefined,
      backgroundColor: chartType === 'bar' ? get_color(cat) : 'transparent',
      fill: false,
      tension: 0.1,
      borderWidth: chartType === 'line' ? 2 : 1
    };
  });

  if (growth_chart) growth_chart.destroy();
  growth_chart = new Chart(document.getElementById(canvasId), {
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { 
          title: { display: true, text: 'Month' },
          stacked: false
        },
        y: { 
          title: { display: true, text: 'Growth Rate (%)' },
          beginAtZero: false,
          stacked: false
        }
      },
      plugins: {
        title: { display: true, text: mode === 'mom' ? 'Month-over-Month Growth (%)' : 'Year-over-Year Growth (%)' },
        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}%` } }
      }
    }
  });
}
