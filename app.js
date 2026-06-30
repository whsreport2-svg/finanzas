// ===== Helpers =====
const fmtNum = n => (n === null || n === undefined) ? '—' : Number(n).toLocaleString('es-MX', {maximumFractionDigits: 2});

document.getElementById('ts-now').textContent = new Date().toLocaleString('es-MX', {
  day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'
});

// ===== Theme toggle =====
const THEME_KEY = 'reporte-avances-theme';
const root = document.documentElement;
const themeToggleBtn = document.getElementById('theme-toggle');

function cssVar(name){
  return getComputedStyle(root).getPropertyValue(name).trim();
}

function setTheme(theme){
  root.setAttribute('data-theme', theme);
  themeToggleBtn.setAttribute('aria-label', theme === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');
  themeToggleBtn.innerHTML = theme === 'light' ? ICON_MOON : ICON_SUN;
  try { localStorage.setItem(THEME_KEY, theme); } catch(e) {}
  rebuildCharts();
}

const ICON_SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7"/></svg>';
const ICON_MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5z"/></svg>';

let savedTheme = 'dark';
try { savedTheme = localStorage.getItem(THEME_KEY) || 'dark'; } catch(e) {}
root.setAttribute('data-theme', savedTheme);
themeToggleBtn.innerHTML = savedTheme === 'light' ? ICON_MOON : ICON_SUN;
themeToggleBtn.setAttribute('aria-label', savedTheme === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');
themeToggleBtn.addEventListener('click', () => {
  setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
});

// ===================== CARATULA =====================
const caratulaBody = document.getElementById('caratula-body');
let onlineCount = 0;

function statusTag(status){
  const s = (status || '').toUpperCase();
  let cls = 'gray';
  if(s.includes('CORRIENDO')) cls = 'green';
  else if(s.includes('MONTANDO')) cls = 'amber';
  else if(s.includes('OFFLINE')) cls = 'gray';
  else if(status) cls = 'cyan';
  return `<span class="status-tag ${cls}"><span class="led"></span>${status || '—'}</span>`;
}

function pct(v){
  if(typeof v === 'number') return `${v}%`;
  return v ?? '—';
}

caratulaBody.innerHTML = CARATULA.map(line => {
  if(line.status && line.status.toUpperCase().includes('CORRIENDO')) onlineCount++;
  return `
    <tr>
      <td class="mono" style="font-weight:600">${line.linea}</td>
      <td class="mono">${line.wo ?? '—'}</td>
      <td class="mono">${line.modelo ?? '—'}</td>
      <td>${statusTag(line.status)}</td>
      <td class="mono" style="text-align:right">${line.plan ?? '—'}</td>
      <td class="mono" style="text-align:right">${line.togo ?? '—'}</td>
      <td class="mono" style="text-align:right">${line.alcance ?? '—'}</td>
      <td class="mono" style="text-align:right">${pct(line.avance_linea)}</td>
      <td class="mono">${line.siguiente ?? '—'}</td>
      <td class="mono">${line.modelo2 ?? '—'}</td>
      <td class="mono" style="text-align:right">${line.plan2 ?? '—'}</td>
      <td class="mono" style="text-align:right; font-weight:600">${pct(line.avance_global)}</td>
      <td class="mono" style="text-align:right; font-weight:600">${pct(line.liberacion)}</td>
    </tr>
  `;
}).join('');

document.getElementById('caratula-sub').textContent = `${onlineCount} de ${CARATULA.length} líneas corriendo`;

// ===================== MATERIALES CORTOS =====================
function estadoBadge(estado){
  const e = (estado || '').toUpperCase();
  if(e.includes('ALTERNO DISPONIBLE')) return `<span class="badge green">ALTERNO DISPONIBLE</span>`;
  if(e.includes('INSUFICIENTE')) return `<span class="badge amber">ALTERNO INSUFICIENTE</span>`;
  if(e.includes('SIN ALTERNO')) return `<span class="badge red">SIN ALTERNO</span>`;
  return `<span class="badge">${estado || '—'}</span>`;
}

const cortosBody = document.getElementById('cortos-body');

function renderCortos(rows){
  cortosBody.innerHTML = rows.map(r => `
    <tr>
      <td class="mono">${r.material}</td>
      <td class="num">${fmtNum(r.deficit)}</td>
      <td class="mono">${r.um || '—'}</td>
      <td class="mono">${r.alterno}</td>
      <td class="mono" style="text-align:right">${fmtNum(r.disponible)}</td>
      <td>${estadoBadge(r.estado)}</td>
      <td class="ordenes-cell">${r.ordenes}</td>
      <td class="comment-cell" title="${(r.comentario || '').replace(/"/g,'&quot;')}">${r.comentario || '—'}</td>
    </tr>
  `).join('');
}
renderCortos(CORTOS);

// KPIs
const total = CORTOS.length;
const sinAlterno = CORTOS.filter(r => (r.estado||'').toUpperCase().includes('SIN ALTERNO')).length;
const altDisponible = CORTOS.filter(r => (r.estado||'').toUpperCase() === 'ALTERNO DISPONIBLE').length;
const altInsuf = CORTOS.filter(r => (r.estado||'').toUpperCase().includes('INSUFICIENTE')).length;
document.getElementById('kpi-total-cortos').textContent = total;
document.getElementById('kpi-sin-alterno').textContent = sinAlterno;
document.getElementById('kpi-alt-disp').textContent = altDisponible;
document.getElementById('kpi-alt-insuf').textContent = altInsuf;

// Search
document.getElementById('cortos-search').addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  if(!q){ renderCortos(CORTOS); return; }
  const filtered = CORTOS.filter(r =>
    String(r.material).toLowerCase().includes(q) ||
    String(r.alterno).toLowerCase().includes(q) ||
    String(r.ordenes).toLowerCase().includes(q) ||
    String(r.comentario).toLowerCase().includes(q) ||
    String(r.estado).toLowerCase().includes(q)
  );
  renderCortos(filtered);
});

// ===================== CTB =====================
const ctbBody = document.getElementById('ctb-body');
ctbBody.innerHTML = CTB.familias.map(f => `
  <tr>
    <td class="mono">${f.familia}</td>
    <td class="mono" style="text-align:right; color:var(--green)">${fmtNum(f.green)}</td>
    <td class="mono" style="text-align:right; color:var(--amber)">${fmtNum(f.yellow)}</td>
    <td class="mono" style="text-align:right; color:var(--red)">${fmtNum(f.red)}</td>
    <td class="mono" style="text-align:right">${fmtNum(f.total)}</td>
    <td class="mono" style="text-align:right; font-weight:600">${f.cobertura}%</td>
  </tr>
`).join('');

let radarChartInstance = null;
let donutChartInstance = null;

function rebuildCharts(){
  const muted = cssVar('--muted');
  const border = cssVar('--border');
  const text = cssVar('--text');
  const cyan = cssVar('--cyan');
  const cyanFill = cssVar('--cyan-dim');
  const panel = cssVar('--panel');
  const green = cssVar('--green');
  const amber = cssVar('--amber');
  const red = cssVar('--red');

  Chart.defaults.font.family = "'IBM Plex Mono', monospace";
  Chart.defaults.color = muted;

  if(radarChartInstance) radarChartInstance.destroy();
  if(donutChartInstance) donutChartInstance.destroy();

  radarChartInstance = new Chart(document.getElementById('radarChart'), {
    type: 'radar',
    data: {
      labels: CTB.familias.map(f => f.familia),
      datasets: [{
        label: '% Cobertura',
        data: CTB.familias.map(f => f.cobertura),
        backgroundColor: cyanFill,
        borderColor: cyan,
        borderWidth: 2,
        pointBackgroundColor: cyan,
        pointBorderColor: panel,
        pointRadius: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0, max: 100,
          ticks: { display: false, stepSize: 25 },
          grid: { color: border },
          angleLines: { color: border },
          pointLabels: { color: text, font: { size: 11 } }
        }
      },
      plugins: { legend: { display: false } }
    }
  });

  donutChartInstance = new Chart(document.getElementById('donutChart'), {
    type: 'doughnut',
    data: {
      labels: ['Green', 'Yellow', 'Red'],
      datasets: [{
        data: [CTB.donut.green, CTB.donut.yellow, CTB.donut.red],
        backgroundColor: [green, amber, red],
        borderColor: panel,
        borderWidth: 3,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: { legend: { display: false } }
    }
  });

  const donutTotal = CTB.donut.green + CTB.donut.yellow + CTB.donut.red;
  document.getElementById('donut-legend').innerHTML = `
    <div class="legend-item"><span class="legend-dot" style="background:${green}"></span>Green &middot; ${fmtNum(CTB.donut.green)} (${(CTB.donut.green/donutTotal*100).toFixed(1)}%)</div>
    <div class="legend-item"><span class="legend-dot" style="background:${amber}"></span>Yellow &middot; ${fmtNum(CTB.donut.yellow)} (${(CTB.donut.yellow/donutTotal*100).toFixed(1)}%)</div>
    <div class="legend-item"><span class="legend-dot" style="background:${red}"></span>Red &middot; ${fmtNum(CTB.donut.red)} (${(CTB.donut.red/donutTotal*100).toFixed(1)}%)</div>
  `;
}

rebuildCharts();
