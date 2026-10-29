const TIPOS_MUNECA = ['Grande', 'Mini', 'Little', 'Silly Hair', 'Loopy Hair'];
const TIPOS_CLIENTE = ['Regular', 'Mayorista', 'Coleccionista'];

const entities = {
  lalaloopsy: {
    label: 'Muñecas', singular: 'muñeca', icon: '✿', pk: 'identificador', view: 'cards',
    fields: [
      { name: 'identificador', label: 'Identificador', type: 'text', placeholder: 'LL-G-001' },
      { name: 'nombre', label: 'Nombre', type: 'text' },
      { name: 'tipo', label: 'Tipo', type: 'select', options: TIPOS_MUNECA },
      { name: 'precio_x_unidad', label: 'Precio por unidad (₡)', type: 'number', money: true },
      { name: 'foto', label: 'Foto (enlace)', type: 'url', optional: true, hint: 'Opcional. Si la dejas vacía, la muñeca se dibuja sola.' },
    ],
  },
  persona: {
    label: 'Personas', singular: 'persona', icon: '☺', pk: 'cedula',
    fields: [
      { name: 'cedula', label: 'Cédula', type: 'text' },
      { name: 'nombre', label: 'Nombre', type: 'text' },
      { name: 'apellido', label: 'Apellido', type: 'text' },
      { name: 'correo', label: 'Correo', type: 'email' },
      { name: 'telefono', label: 'Teléfono', type: 'tel' },
    ],
  },
  cliente: {
    label: 'Clientes', singular: 'cliente', icon: '♡', pk: 'cedula',
    fields: [
      { name: 'cedula', label: 'Persona', type: 'ref', ref: 'persona', person: true },
      { name: 'tipo', label: 'Tipo de cliente', type: 'text', list: TIPOS_CLIENTE },
    ],
  },
  vendedor: {
    label: 'Vendedores', singular: 'vendedor', icon: '❀', pk: 'cedula',
    fields: [
      { name: 'cedula', label: 'Persona', type: 'ref', ref: 'persona', person: true },
      { name: 'especialidad', label: 'Especialidad', type: 'text' },
      { name: 'salario_x_hora', label: 'Salario por hora (₡)', type: 'number', money: true },
    ],
  },
  factura: {
    label: 'Facturas', singular: 'factura', icon: '✧', pk: 'identificador',
    fields: [
      { name: 'identificador', label: 'Identificador', type: 'text', placeholder: 'F-0001' },
      { name: 'fecha', label: 'Fecha', type: 'date' },
      { name: 'monto_total', label: 'Monto total (₡)', type: 'number', money: true },
      { name: 'cantidad_horas_trabajo', label: 'Horas de trabajo', type: 'number' },
      { name: 'vehiculo_atendido', label: 'Vehículo atendido', type: 'text' },
      { name: 'atendido_por', label: 'Atendido por', type: 'ref', ref: 'vendedor', person: true },
    ],
  },
};

const money = new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 2 });
const HAIR = ['#ffb3d1', '#b9e8dc', '#d9c7f5', '#ffe08a', '#ffc9a8', '#aedcff'];
const EYES = ['#9be0d3', '#ffb3d1', '#c9b3f2', '#ffd36e'];

const state = { current: 'lalaloopsy', editing: null, rows: {}, counts: {}, filter: 'Todas', query: '' };
const $ = id => document.getElementById(id);
const ent = () => entities[state.current];
const slug = text => text.toLowerCase().replace(/\s+/g, '-');
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

/* ---------- Datos relacionados ---------- */
function personName(cedula) {
  const p = (state.rows.persona || []).find(r => r.cedula === cedula);
  return p ? `${p.nombre} ${p.apellido}` : '';
}
function refOptions(field) {
  const source = state.rows[field.ref] || [];
  let list = source;
  // Un cliente/vendedor solo se puede crear una vez por persona.
  if (field.name === ent().pk) {
    const used = new Set((state.rows[state.current] || []).map(r => r[ent().pk]));
    list = source.filter(r => !used.has(r.cedula));
  }
  return list.map(r => ({ value: r.cedula, label: `${personName(r.cedula)} (${r.cedula})` }));
}

/* ---------- Navegación ---------- */
function nav() {
  $('tabs').innerHTML = Object.entries(entities).map(([key, e]) => `
    <button type="button" class="tab ${key === state.current ? 'active' : ''}" data-entity="${key}"
      aria-current="${key === state.current ? 'page' : 'false'}">
      <span class="glyph" aria-hidden="true">${e.icon}</span>${e.label}
      <span class="badge">${state.counts[key] ?? 0}</span>
    </button>`).join('');
  $('tabs').querySelectorAll('[data-entity]').forEach(b => b.addEventListener('click', () => choose(b.dataset.entity)));
}

function choose(key) {
  state.current = key;
  state.editing = null;
  state.filter = 'Todas';
  state.query = '';
  $('search').value = '';
  setMessage('');
  nav();
  refresh();
}

function setMessage(text) { $('message').textContent = text; }

/* ---------- Formulario ---------- */
function fieldHtml(f) {
  const editingPk = state.editing && f.name === ent().pk;
  const required = f.optional ? '' : 'required';
  let control;
  if ((f.type === 'ref' && !editingPk) || f.type === 'select') {
    const options = f.type === 'ref'
      ? refOptions(f)
      : f.options.map(o => ({ value: o, label: o }));
    const empty = options.length === 0
      ? `<option value="" disabled selected>No hay opciones disponibles</option>`
      : `<option value="" disabled selected>Elige una opción</option>`;
    control = `<select name="${f.name}" ${required}>${empty}${options.map(o => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('')}</select>`;
  } else {
    const type = f.type === 'ref' ? 'text' : f.type;
    const numeric = f.type === 'number' ? 'min="0" step="0.01"' : '';
    const list = f.list ? `list="list-${f.name}"` : '';
    const datalist = f.list ? `<datalist id="list-${f.name}">${f.list.map(o => `<option value="${o}">`).join('')}</datalist>` : '';
    control = `<input name="${f.name}" type="${type}" ${numeric} ${list} ${editingPk ? 'readonly' : ''} ${required} placeholder="${f.placeholder || ''}" autocomplete="off">${datalist}`;
  }
  const hint = f.hint ? `<small>${f.hint}</small>` : '';
  const warn = f.type === 'ref' && !editingPk && refOptions(f).length === 0
    ? `<small>Primero crea ${f.ref === 'persona' ? 'una persona en la pestaña Personas' : 'un vendedor en la pestaña Vendedores'}.</small>` : '';
  return `<label class="field"><span>${f.label}</span>${control}${hint}${warn}</label>`;
}

function renderForm() {
  const e = ent();
  $('form-title').textContent = state.editing ? `Editar ${e.singular}` : `Nueva ${e.singular}`.replace('Nueva vendedor', 'Nuevo vendedor').replace('Nueva cliente', 'Nuevo cliente');
  $('form').innerHTML = e.fields.map(fieldHtml).join('') + `
    <div class="form-actions">
      <button class="button primary" type="submit">${state.editing ? 'Guardar cambios' : 'Agregar'}</button>
      ${state.editing ? '<button class="button secondary" id="cancel-edit" type="button">Cancelar</button>' : ''}
    </div>`;
  $('form').onsubmit = save;
  if (state.editing) {
    for (const [key, value] of Object.entries(state.editing)) {
      const input = $('form').elements.namedItem(key);
      if (input) input.value = value;
    }
    $('cancel-edit').addEventListener('click', () => { state.editing = null; setMessage(''); renderForm(); });
  }
}

/* ---------- Lista ---------- */
function cell(f, row) {
  const v = row[f.name];
  if (f.person) return `${escapeHtml(v)}<small>${escapeHtml(personName(v))}</small>`;
  if (f.money) return money.format(v);
  if (f.type === 'date') return v.split('-').reverse().join('/');
  return escapeHtml(v);
}

function hairColors(text) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return { hair: HAIR[h % HAIR.length], eye: EYES[(h >> 3) % EYES.length] };
}

function dollCard(d) {
  const { hair, eye } = hairColors(d.nombre + d.identificador);
  const photo = d.foto ? `<img src="${escapeHtml(d.foto)}" alt="Foto de ${escapeHtml(d.nombre)}" loading="lazy">` : '';
  return `<article class="doll t-${slug(d.tipo)}">
    <div class="doll-art ${d.foto ? 'has-photo' : ''}" style="--hair:${hair};--eye:${eye}">
      <div class="hair"></div>
      <div class="face"><i class="eye l"></i><i class="eye r"></i><i class="cheek l"></i><i class="cheek r"></i><i class="smile"></i></div>
      ${photo}
    </div>
    <h3>${escapeHtml(d.nombre)}</h3>
    <div class="doll-meta"><span class="tag">${escapeHtml(d.tipo)}</span><span class="price">${money.format(d.precio_x_unidad)}</span></div>
    <span class="id">${escapeHtml(d.identificador)}</span>
    <div class="doll-actions">
      <button type="button" class="button small secondary" data-edit="${escapeHtml(d.identificador)}">Editar</button>
      <button type="button" class="button small danger" data-delete="${escapeHtml(d.identificador)}">Eliminar</button>
    </div>
  </article>`;
}

function visibleRows() {
  const q = state.query.trim().toLowerCase();
  return (state.rows[state.current] || []).filter(r => {
    if (state.current === 'lalaloopsy' && state.filter !== 'Todas' && r.tipo !== state.filter) return false;
    if (!q) return true;
    const extra = ent().fields.filter(f => f.person).map(f => personName(r[f.name])).join(' ');
    return (Object.values(r).join(' ') + ' ' + extra).toLowerCase().includes(q);
  });
}

function renderChips() {
  const box = $('chips');
  box.hidden = state.current !== 'lalaloopsy';
  if (box.hidden) return;
  box.innerHTML = ['Todas', ...TIPOS_MUNECA].map(t =>
    `<button type="button" class="chip" aria-pressed="${t === state.filter}" data-chip="${t}">${t}</button>`).join('');
  box.querySelectorAll('[data-chip]').forEach(b => b.addEventListener('click', () => {
    state.filter = b.dataset.chip;
    renderChips();
    renderList();
  }));
}

function renderList() {
  const e = ent();
  const all = state.rows[state.current] || [];
  const rows = visibleRows();
  $('title').textContent = e.label;
  $('count').textContent = `${rows.length} ${rows.length === 1 ? 'registro' : 'registros'}`;

  const empty = rows.length === 0;
  $('empty').hidden = !empty;
  $('empty').textContent = all.length === 0
    ? `Todavía no hay ${e.label.toLowerCase()}. Agrega la primera con el formulario.`
    : 'No encontramos nada con esa búsqueda. Prueba con otra palabra o cambia el filtro.';
  $('grid').hidden = empty || e.view !== 'cards';
  $('table-wrap').hidden = empty || e.view === 'cards';

  if (e.view === 'cards') {
    $('grid').innerHTML = rows.map(dollCard).join('');
    $('grid').querySelectorAll('img').forEach(img => img.addEventListener('error', () => {
      img.closest('.doll-art').classList.remove('has-photo');
      img.remove();
    }));
  } else {
    $('head').innerHTML = `<tr>${e.fields.map(f => `<th>${f.label.replace(' (₡)', '')}</th>`).join('')}<th>Acciones</th></tr>`;
    $('body').innerHTML = rows.map(r => `<tr>
      ${e.fields.map(f => `<td>${cell(f, r)}</td>`).join('')}
      <td class="actions">
        <button type="button" class="button small secondary" data-edit="${escapeHtml(r[e.pk])}">Editar</button>
        <button type="button" class="button small danger" data-delete="${escapeHtml(r[e.pk])}">Eliminar</button>
      </td></tr>`).join('');
  }
  document.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => editRow(b.dataset.edit)));
  document.querySelectorAll('[data-delete]').forEach(b => b.addEventListener('click', () => removeRow(b.dataset.delete)));
}

/* ---------- API ---------- */
async function apiError(response) {
  try {
    const body = await response.json();
    return typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail || body);
  } catch {
    return `Error del servidor (${response.status}).`;
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(await apiError(response));
  return response.json();
}

async function refresh() {
  try {
    const needed = [...new Set([state.current, 'persona', 'vendedor'])];
    const [counts, ...lists] = await Promise.all([fetchJson('/api/resumen'), ...needed.map(t => fetchJson(`/api/${t}`))]);
    state.counts = counts;
    needed.forEach((t, i) => { state.rows[t] = lists[i]; });
    nav();
    renderForm();
    renderChips();
    renderList();
  } catch (error) {
    setMessage(`No se pudieron cargar los datos: ${error.message}`);
    $('count').textContent = '';
    $('grid').hidden = true;
    $('table-wrap').hidden = true;
    $('empty').hidden = false;
    $('empty').textContent = 'Comprueba que el servidor esté encendido (uvicorn main:app --reload).';
  }
}

async function save(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const e = ent();
  const data = {};
  for (const f of e.fields) {
    const el = form.elements.namedItem(f.name);
    const value = el.value.trim();
    data[f.name] = f.type === 'number' ? Number(value) : value;
  }
  const editing = Boolean(state.editing);
  const url = `/api/${state.current}${editing ? `/${encodeURIComponent(data[e.pk])}` : ''}`;
  try {
    const response = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(await apiError(response));
    state.editing = null;
    await refresh();
    setMessage(editing ? 'Cambios guardados.' : 'Registro agregado.');
  } catch (error) {
    setMessage(`No se pudo guardar: ${error.message}`);
  }
}

function editRow(key) {
  const row = (state.rows[state.current] || []).find(r => String(r[ent().pk]) === String(key));
  if (!row) return;
  state.editing = row;
  renderForm();
  setMessage('');
  $('form').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function removeRow(key) {
  if (!window.confirm('¿Quieres eliminar este registro?')) return;
  try {
    const response = await fetch(`/api/${state.current}/${encodeURIComponent(key)}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(await apiError(response));
    state.editing = null;
    await refresh();
    setMessage('Registro eliminado.');
  } catch (error) {
    setMessage(`No se pudo eliminar: ${error.message}`);
  }
}

$('search').addEventListener('input', event => { state.query = event.target.value; renderList(); });
nav();
refresh();
