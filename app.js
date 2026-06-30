// ===== Helpers =====
const fmtNum = n => (n === null || n === undefined) ? '—' : Number(n).toLocaleString('es-MX', {maximumFractionDigits: 2});

document.getElementById('ts-now').textContent = new Date().toLocaleString('es-MX', {
  day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'
});

// ===== Status -> color mapping =====
function statusColor(status){
  if(!status) return {color:'var(--gray)', dim:'var(--gray-dim)'};
  const s = status.toUpperCase();
  if(s.includes('CORRIENDO')) return {color:'var(--green)', dim:'var(--green-dim)'};
  if(s.includes('MONTANDO')) return {color:'var(--amber)', dim:'var(--amber-dim)'};
  if(s.includes('OFFLINE')) return {color:'var(--gray)', dim:'var(--gray-dim)'};
  return {color:'var(--cyan)', dim:'var(--cyan-dim)'};
}

// ===================== CARATULA =====================
const lineGrid = document.getElementById('line-grid');
let onlineCount = 0;

CARATULA.forEach(line => {
  const sc = statusColor(line.status);
  if(line.status && line.status.toUpperCase().includes('CORRIENDO')) onlineCount++;

  const avanceGlobal = (typeof line.avance_global === 'number') ? line.avance_global : 0;
  const liberacion = (typeof line.liberacion === 'number') ? line.liberacion : 0;

  const card = document.createElement('div');
  card.className = 'line-card';
  card.style.setProperty('--led-color', sc.color);
  card.style.setProperty('--led-dim', sc.dim);

  card.innerHTML = `
    <div class="line-top">
      <div class="line-code">${line.linea}</div>
      <div class="led"></div>
    </div>
    <div class="status-pill">${line.status || '—'}</div>
    <div class="line-meta">
      <div class="line-row"><span class="k">WO actual</span><span class="v">${line.wo ?? '—'}</span></div>
      <div class="line-row"><span class="k">Siguiente WO</span><span class="v">${line.siguiente ?? '—'}</span></div>
    </div>
    <div class="progress-track"><div class="progress-fill" style="width:${avanceGlobal}%"></div></div>
    <div class="progress-label"><span>Avance surtido</span><span>${avanceGlobal}%</span></div>
    <div class="progress-track"><div class="progress-fill" style="width:${liberacion}%; opacity:.7;"></div></div>
    <div class="progress-label"><span>% Liberación a línea</span><span>${liberacion}%</span></div>
  `;
  lineGrid.appendChild(card);
});

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

Chart.defaults.font.family = "'IBM Plex Mono', monospace";
Chart.defaults.color = '#7c8a99';

// Radar chart — % cobertura por familia
new Chart(document.getElementById('radarChart'), {
  type: 'radar',
  data: {
    labels: CTB.familias.map(f => f.familia),
    datasets: [{
      label: '% Cobertura',
      data: CTB.familias.map(f => f.cobertura),
      backgroundColor: 'rgba(54,197,217,0.18)',
      borderColor: '#36c5d9',
      borderWidth: 2,
      pointBackgroundColor: '#36c5d9',
      pointBorderColor: '#0a0e13',
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
        grid: { color: '#1f2730' },
        angleLines: { color: '#1f2730' },
        pointLabels: { color: '#e9eef3', font: { size: 11 } }
      }
    },
    plugins: { legend: { display: false } }
  }
});

// Donut chart — distribución global
const donutCtx = document.getElementById('donutChart');
const donutColors = { green:'#2dd4a7', yellow:'#f0b429', red:'#ef5b5b' };
new Chart(donutCtx, {
  type: 'doughnut',
  data: {
    labels: ['Green', 'Yellow', 'Red'],
    datasets: [{
      data: [CTB.donut.green, CTB.donut.yellow, CTB.donut.red],
      backgroundColor: [donutColors.green, donutColors.yellow, donutColors.red],
      borderColor: '#11161d',
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
  <div class="legend-item"><span class="legend-dot" style="background:${donutColors.green}"></span>Green &middot; ${fmtNum(CTB.donut.green)} (${(CTB.donut.green/donutTotal*100).toFixed(1)}%)</div>
  <div class="legend-item"><span class="legend-dot" style="background:${donutColors.yellow}"></span>Yellow &middot; ${fmtNum(CTB.donut.yellow)} (${(CTB.donut.yellow/donutTotal*100).toFixed(1)}%)</div>
  <div class="legend-item"><span class="legend-dot" style="background:${donutColors.red}"></span>Red &middot; ${fmtNum(CTB.donut.red)} (${(CTB.donut.red/donutTotal*100).toFixed(1)}%)</div>
`;
