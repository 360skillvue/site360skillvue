/* CRM 360skillvue : interface (affaires, activités, contacts, réglages). Les données passent par api.php. */
(() => {
"use strict";
/* ---------- utilitaires ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const pad = n => String(n).padStart(2, "0");
const isoDay = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const today = () => isoDay(new Date());
const addDays = (s, n) => { const d = new Date(s + "T12:00:00"); d.setDate(d.getDate() + n); return isoDay(d); };
const nowIso = () => new Date().toISOString();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const eur = v => (Number(v) || 0).toLocaleString("fr-FR", {style: "currency", currency: "EUR", maximumFractionDigits: 0});
const MONTHS = ["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."];
const fmtDay = s => { if (!s) return ""; const [y, m, d] = s.split("-").map(Number); const t = today();
  if (s === t) return "Aujourd'hui"; if (s === addDays(t, 1)) return "Demain"; if (s === addDays(t, -1)) return "Hier";
  return d + " " + MONTHS[m - 1] + (y !== new Date().getFullYear() ? " " + y : ""); };
const localDay = iso => iso ? isoDay(new Date(iso)) : null;
const initials = n => String(n || "?").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
const ls = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
             set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
function toast(msg, err) {
  const host = $("#toastHost"); host.innerHTML = `<div class="toast ${err ? "err" : ""}" role="status">${esc(msg)}</div>`;
  clearTimeout(toast.t); toast.t = setTimeout(() => host.innerHTML = "", err ? 6000 : 2600);
}
const ICONS = {
  call: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  meeting: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  task: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  email: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
  deadline: '<path d="M4 22V4a1 1 0 0 1 1-1h11l-2 4 2 4H5"/>',
  lunch: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>',
  check: '<path d="M20 6 9 17l-5-5"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  up: '<path d="m18 15-6-6-6 6"/>', down: '<path d="m6 9 6 6 6-6"/>', warn: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>'
};
const ico = n => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ICONS.task}</svg>`;
const TYPES = [["call","Appel"],["meeting","Réunion"],["task","Tâche"],["email","E-mail"],["deadline","Échéance"],["lunch","Déjeuner"]];
const typeLabel = t => (TYPES.find(x => x[0] === t) || [t, t || "Activité"])[1];

/* ---------- API ---------- */
const BOOT = JSON.parse($("#boot").textContent);
async function api(r, {method = "GET", params = {}, body} = {}) {
  const qs = new URLSearchParams({r, ...params});
  let res;
  try {
    res = await fetch("api.php?" + qs, {method, credentials: "same-origin",
      headers: method === "POST" ? {"Content-Type": "application/json", "X-CSRF": BOOT.csrf} : {}, body: body ? JSON.stringify(body) : undefined});
  } catch { throw new Error("Connexion au serveur impossible : vérifiez votre réseau."); }
  if (res.status === 401) { location.reload(); throw new Error("Session expirée."); }
  let j = null; try { j = await res.json(); } catch {}
  if (!res.ok) throw new Error((j && j.error) || "Erreur serveur (" + res.status + ").");
  return j;
}
const createE = (e, data) => api("create", {method: "POST", params: {e}, body: {data}});
const updateE = (e, id, data) => api("update", {method: "POST", params: {e, id}, body: {data}});
const deleteE = (e, id) => api("delete", {method: "POST", params: {e, id}});
function failToast(e) { toast(e.message || "Enregistrement impossible.", true); }

/* ---------- état ---------- */
const S = {
  ready: false, me: null, users: [], deals: new Map(), actsOpen: new Map(), actsDone: new Map(),
  pipelines: [], fields: {deal: [], org: [], person: []}, importInfo: null, pipedrive: false,
  view: ls.get("crm.view", "deals"), pipelineId: ls.get("crm.pipe", null), dealStatus: "open",
  dealOwner: ls.get("crm.dealOwner", "all"), actMode: "todo", actOwner: ls.get("crm.actOwner", "me"), actType: "all",
  contactKind: "org", contactQ: "", panel: null, modal: null, panelActs: [], panelEnt: null,
};
const team = () => S.users.filter(u => u.active);
const memberName = id => (S.users.find(u => u.id === id) || {}).name || "";
const pipeline = id => S.pipelines.find(p => p.id === id);
const stageOf = sid => { for (const p of S.pipelines) { const s = p.stages.find(x => x.id === sid); if (s) return {p, s}; } return null; };
const isAdmin = () => S.me && S.me.role === "admin";

async function loadBoot() {
  const b = await api("bootstrap");
  S.me = b.me; S.users = b.users; S.pipelines = b.pipelines; S.fields = b.fields; S.importInfo = b.importInfo; S.pipedrive = b.pipedrive;
}
async function loadData() {
  const [deals, acts] = await Promise.all([api("deals"), api("activities")]);
  S.deals = new Map(deals.map(d => [d.id, d]));
  S.actsOpen = new Map(); S.actsDone = new Map();
  for (const a of acts) (a.done ? S.actsDone : S.actsOpen).set(a.id, a);
}
function putAct(a) { S.actsOpen.delete(a.id); S.actsDone.delete(a.id); (a.done ? S.actsDone : S.actsOpen).set(a.id, a); }

function nextActs() {
  const m = new Map();
  for (const a of S.actsOpen.values()) {
    if (!a.deal_id) continue;
    const k = (a.due_date || "9999") + (a.due_time || "");
    const cur = m.get(a.deal_id);
    if (!cur || k < cur.k) m.set(a.deal_id, {k, a});
  }
  return m;
}
function dueChip(a) {
  if (!a) return `<span class="chip none">${ico("warn")}Aucune activité</span>`;
  const t = today(); const cls = !a.due_date ? "" : a.due_date < t ? "late" : a.due_date === t ? "today" : "ok";
  return `<span class="chip ${cls}">${ico(a.type)}${esc(a.due_date ? fmtDay(a.due_date) : "Sans date")}${a.due_time ? " " + esc(a.due_time) : ""}</span>`;
}

/* ---------- rendu principal ---------- */
const editing = root => { const ae = document.activeElement; return !!(ae && root && root.contains(ae) && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)); };
function softHeader() {
  document.querySelectorAll("#nav button").forEach(b => b.setAttribute("aria-current", b.dataset.v === S.view ? "page" : "false"));
  const late = [...S.actsOpen.values()].filter(a => a.due_date && a.due_date < today() && (S.me ? a.owner_id === S.me.id : true)).length;
  const lc = $("#lateCount"); lc.hidden = !late; lc.textContent = late;
}
function render() {
  softHeader();
  const main = $("#main");
  if (S.view === "deals") main.innerHTML = viewDeals();
  else if (S.view === "acts") main.innerHTML = viewActs();
  else if (S.view === "contacts") { main.innerHTML = viewContacts(); loadContacts(); }
  else main.innerHTML = viewSettings();
  bindView();
}

/* ---------- Affaires ---------- */
function viewDeals() {
  if (!S.pipelines.length) return `<div class="wrap"><div class="empty"><h3>${S.ready ? "Aucun pipeline pour l'instant" : "Chargement du CRM…"}</h3>
    <p>Les affaires s'affichent ici par étape. Importez vos données depuis Pipedrive, ou créez un premier pipeline dans les réglages.</p>
    <button class="btn primary" data-act="goSettings">Ouvrir les réglages</button></div></div>`;
  if (!pipeline(S.pipelineId)) S.pipelineId = S.pipelines[0].id;
  const p = pipeline(S.pipelineId); const na = nextActs();
  const ownerF = S.dealOwner === "me" ? S.me.id : S.dealOwner;
  const deals = [...S.deals.values()].filter(d => d.pipeline_id === p.id && (S.dealStatus === "all" || d.status === S.dealStatus) && (S.dealOwner === "all" || d.owner_id === ownerF));
  const open = [...S.deals.values()].filter(d => d.pipeline_id === p.id && d.status === "open");
  const ym = today().slice(0, 7);
  const wonM = [...S.deals.values()].filter(d => d.pipeline_id === p.id && d.status === "won" && (localDay(d.won_time) || "").slice(0, 7) === ym);
  const noAct = open.filter(d => !na.get(d.id)).length;
  const sum = xs => xs.reduce((t, d) => t + (Number(d.value) || 0), 0);
  const cols = p.stages.map(s => {
    const ds = deals.filter(d => d.stage_id === s.id).sort((a, b) => ((na.get(a.id)?.k) || "~").localeCompare((na.get(b.id)?.k) || "~"));
    return `<section class="col" data-stage="${esc(s.id)}"><div class="col-h"><h3>${esc(s.name)}</h3><div class="meta"><span class="num">${eur(sum(ds))}</span><span>${ds.length} affaire${ds.length > 1 ? "s" : ""}</span></div></div>
      <div class="cards">${ds.map(d => cardHtml(d, na.get(d.id)?.a)).join("")}</div></section>`;
  }).join("");
  const orphan = deals.filter(d => !p.stages.some(s => s.id === d.stage_id));
  return `<div class="wrap toolbar">
      <select id="pipeSel" aria-label="Pipeline">${S.pipelines.map(x => `<option value="${esc(x.id)}" ${x.id === p.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select>
      <div class="seg" id="statusSeg">${[["open","En cours"],["won","Gagnées"],["lost","Perdues"],["all","Toutes"]].map(([k, l]) => `<button data-k="${k}" aria-pressed="${S.dealStatus === k}">${l}</button>`).join("")}</div>
      <select id="dealOwner" aria-label="Responsable"><option value="all">Toute l'équipe</option><option value="me" ${S.dealOwner === "me" ? "selected" : ""}>Mes affaires</option>
        ${team().map(u => `<option value="${esc(u.id)}" ${S.dealOwner === u.id ? "selected" : ""}>${esc(u.name)}</option>`).join("")}</select>
      <span class="grow"></span>
      <button class="btn primary" data-act="newDeal">${ico("plus")}Affaire</button>
    </div>
    <div class="wrap summary" style="padding-bottom:10px">
      <span>En cours <b>${open.length}</b> · <b>${eur(sum(open))}</b></span>
      <span>Gagnées ce mois-ci <b>${wonM.length}</b> · <b>${eur(sum(wonM))}</b></span>
      <span>Sans activité prévue <b style="color:${noAct ? "var(--warn)" : "inherit"}">${noAct}</b></span>
      ${orphan.length ? `<span>Étape inconnue <b>${orphan.length}</b></span>` : ""}
    </div>
    <div class="board-scroll"><div class="board" id="board">${cols}</div></div>
    ${!S.deals.size && S.ready ? `<div class="wrap"><div class="empty"><h3>Aucune affaire</h3><p>Créez une affaire, ou importez celles de Pipedrive depuis les réglages.</p></div></div>` : ""}`;
}
function cardHtml(d, a) {
  const sub = [d.org_name, d.person_name].filter(Boolean).join(" · ");
  const tag = d.status === "won" ? `<span class="won-tag">Gagnée</span>` : d.status === "lost" ? `<span class="lost-tag">Perdue</span>` : "";
  return `<div class="card" role="button" tabindex="0" draggable="true" data-deal="${esc(d.id)}"><span class="t">${esc(d.title || "Sans titre")}</span>
    ${sub ? `<span class="s">${esc(sub)}</span>` : ""}
    <span class="row"><span class="num" style="font-size:12px">${d.value ? eur(d.value) : ""}</span>${tag}</span>
    <span class="row">${d.status === "open" ? dueChip(a) : `<span></span>`}<span class="av" title="${esc(memberName(d.owner_id))}">${esc(initials(memberName(d.owner_id)))}</span></span></div>`;
}

/* ---------- Activités ---------- */
function actRow(a) {
  const link = [a.deal_title, a.person_name, a.org_name].filter(Boolean).join(" · ");
  const late = !a.done && a.due_date && a.due_date < today();
  return `<div class="r ${a.done ? "done" : ""}" tabindex="0" data-actid="${esc(a.id)}">
    <button class="check ${a.done ? "on" : ""}" data-toggle="${esc(a.id)}" aria-label="${a.done ? "Marquer à faire" : "Marquer comme faite"}">${a.done ? ico("check") : ""}</button>
    <span class="tico" title="${esc(typeLabel(a.type))}">${ico(a.type)}</span>
    <span class="main"><b>${esc(a.subject || typeLabel(a.type))}</b>${link ? `<small>${esc(link)}</small>` : ""}</span>
    <span class="when"><span style="color:${late ? "var(--bad)" : "inherit"}">${esc(a.due_date ? fmtDay(a.due_date) : "Sans date")}${a.due_time ? " " + esc(a.due_time) : ""}</span>
      <span class="av" style="margin-left:6px" title="${esc(memberName(a.owner_id))}">${esc(initials(memberName(a.owner_id)))}</span></span></div>`;
}
function viewActs() {
  const owner = S.actOwner === "me" ? S.me.id : S.actOwner;
  const flt = a => (S.actOwner === "all" || a.owner_id === owner) && (S.actType === "all" || a.type === S.actType);
  const tb = `<div class="wrap toolbar">
    <div class="seg" id="actModeSeg"><button data-k="todo" aria-pressed="${S.actMode === "todo"}">À faire</button><button data-k="done" aria-pressed="${S.actMode === "done"}">Faites (45 j)</button></div>
    <select id="actOwner" aria-label="Responsable"><option value="me" ${S.actOwner === "me" ? "selected" : ""}>Mes activités</option><option value="all" ${S.actOwner === "all" ? "selected" : ""}>Toute l'équipe</option>
      ${team().map(u => `<option value="${esc(u.id)}" ${S.actOwner === u.id ? "selected" : ""}>${esc(u.name)}</option>`).join("")}</select>
    <select id="actType" aria-label="Type"><option value="all">Tous les types</option>${TYPES.map(([k, l]) => `<option value="${k}" ${S.actType === k ? "selected" : ""}>${l}</option>`).join("")}</select>
    <span class="grow"></span><button class="btn primary" data-act="newAct">${ico("plus")}Activité</button></div>`;
  if (S.actMode === "done") {
    const list = [...S.actsDone.values()].filter(flt).sort((a, b) => (b.done_time || "").localeCompare(a.done_time || ""));
    return tb + `<div class="wrap list">${list.length ? `<div class="rows">${list.map(actRow).join("")}</div>` : `<div class="empty"><h3>Aucune activité faite ces 45 derniers jours</h3></div>`}</div>`;
  }
  const t = today(), wk = addDays(t, 7);
  const groups = [["late","En retard",a => a.due_date && a.due_date < t],["today","Aujourd'hui",a => a.due_date === t],["tom","Demain",a => a.due_date === addDays(t, 1)],
    ["week","7 prochains jours",a => a.due_date > addDays(t, 1) && a.due_date <= wk],["later","Plus tard",a => a.due_date > wk],["nodate","Sans date",a => !a.due_date]];
  const all = [...S.actsOpen.values()].filter(flt).sort((a, b) => ((a.due_date || "9") + (a.due_time || "")).localeCompare((b.due_date || "9") + (b.due_time || "")));
  const html = groups.map(([k, l, f]) => { const xs = all.filter(f); if (!xs.length) return "";
    return `<div class="group"><h4 class="${k === "late" ? "late" : ""}">${l}<span class="num">${xs.length}</span></h4><div class="rows">${xs.map(actRow).join("")}</div></div>`; }).join("");
  return tb + `<div class="wrap list">${html || `<div class="empty"><h3>${S.ready ? "Rien à faire pour l'instant" : "Chargement…"}</h3><p>Planifiez un appel, une réunion ou une tâche ; elle apparaîtra ici, classée par échéance.</p></div>`}</div>`;
}

/* ---------- Contacts ---------- */
function viewContacts() {
  return `<div class="wrap toolbar">
    <div class="seg" id="kindSeg"><button data-k="org" aria-pressed="${S.contactKind === "org"}">Organisations</button><button data-k="person" aria-pressed="${S.contactKind === "person"}">Personnes</button></div>
    <input type="search" id="contactQ" placeholder="Rechercher un nom, un e-mail…" value="${esc(S.contactQ)}" style="max-width:320px">
    <span class="grow"></span><button class="btn primary" data-act="newContact">${ico("plus")}${S.contactKind === "org" ? "Organisation" : "Personne"}</button></div>
    <div class="wrap list"><div id="contactList"><div class="empty"><p>Chargement…</p></div></div></div>`;
}
const searchEntities = (kind, q, n = 40) => api("search", {params: {kind, q: q || "", n}});
let contactSeq = 0;
async function loadContacts() {
  const seq = ++contactSeq; if (!$("#contactList")) return;
  try {
    const xs = await searchEntities(S.contactKind, S.contactQ.trim(), 60);
    if (seq !== contactSeq || !$("#contactList")) return;
    if (!xs.length) { $("#contactList").innerHTML = `<div class="empty"><h3>${S.contactQ ? "Aucun résultat" : "Aucune fiche pour l'instant"}</h3><p>${S.contactQ ? "Essayez avec une partie du nom ou de l'e-mail." : "Importez vos contacts depuis Pipedrive dans les réglages, ou créez une fiche."}</p></div>`; return; }
    $("#contactList").innerHTML = `${S.contactQ ? "" : `<p class="note" style="margin-bottom:8px">Fiches modifiées récemment. Tapez un nom pour chercher dans toute la base.</p>`}<div class="rows">${xs.map(x => {
      const sub = S.contactKind === "org" ? (x.address || "") : [x.org_name, (x.emails || [])[0]?.value].filter(Boolean).join(" · ");
      const nd = [...S.deals.values()].filter(d => d.status === "open" && (S.contactKind === "org" ? d.org_id === x.id : d.person_id === x.id)).length;
      return `<div class="r crow" tabindex="0" data-open="${S.contactKind}:${esc(x.id)}"><span class="main"><b>${esc(x.name || "Sans nom")}</b>${sub ? `<small>${esc(sub)}</small>` : ""}</span>
        <span class="when">${nd ? `<span class="chip ok">${nd} affaire${nd > 1 ? "s" : ""} en cours</span>` : ""}</span></div>`; }).join("")}</div>`;
  } catch (e) { if ($("#contactList")) $("#contactList").innerHTML = `<div class="empty"><p>${esc(e.message)}</p></div>`; }
}

/* ---------- Réglages ---------- */
const IMP = {running: false, log: [], pct: 0};
function viewSettings() {
  const imp = S.importInfo; const admin = isAdmin();
  const importSec = admin ? `<section class="sec"><h3>Import depuis Pipedrive</h3>
      ${S.pipedrive ? `<p class="note">Récupère équipe, pipelines, organisations, personnes, affaires et activités. Les fiches venant de Pipedrive sont mises à jour à chaque import ; les notes saisies ici et les fiches créées ici ne sont jamais touchées. Laissez cet onglet ouvert pendant l'import.</p>`
        : `<p class="note">Aucun jeton Pipedrive n'est configuré : ajoutez <b>pipedrive_token</b> dans le fichier config.php du serveur pour activer l'import.</p>`}
      ${imp ? `<p class="note">Dernier import : <b>${esc(new Date(imp.at.replace(" ", "T") + "Z").toLocaleString("fr-FR"))}</b>${imp.counts ? " · " + Object.entries(imp.counts).map(([k, v]) => `${esc({orgs: "organisations", persons: "personnes", deals: "affaires", activities: "activités"}[k] || k)} ${v}`).join(", ") : ""}</p>` : ""}
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn primary" data-act="importFull" ${IMP.running || !S.pipedrive ? "disabled" : ""}>Tout importer</button>
        <button class="btn" data-act="importInc" ${IMP.running || !imp || !S.pipedrive ? "disabled" : ""}>Importer les changements depuis le dernier import</button>
      </div>
      <div class="progress" ${IMP.running || IMP.log.length ? "" : "hidden"}><i id="impBar" style="width:${IMP.pct}%"></i></div>
      <pre class="log" id="impLog" ${IMP.log.length ? "" : "hidden"}>${esc(IMP.log.join("\n"))}</pre>
    </section>` : "";
  const usersSec = admin ? `<section class="sec"><h3>Équipe et accès <button class="btn sm" data-act="addUser">${ico("plus")}Personne</button></h3>
      <p class="note">Les personnes de l'équipe peuvent être responsables d'affaires et d'activités. Cochez « Accès » et donnez un mot de passe (10 caractères minimum) pour qu'elles puissent se connecter.</p>
      ${S.users.map(u => userRow(u)).join("")}${S.addingUser ? userRow({id: "", name: "", email: "", role: "user", can_login: true, active: true}) : ""}
    </section>` : "";
  return `<div class="wrap settings" style="padding-top:16px">
    ${importSec}
    <section class="sec"><h3>Sauvegarde</h3>
      <p class="note">Téléchargez vos données au format CSV (séparateur point-virgule, lisible dans Excel).</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${[["deals","Affaires"],["activities","Activités"],["orgs","Organisations"],["persons","Personnes"]].map(([k, l]) => `<a class="btn" href="api.php?r=export&amp;what=${k}">${l} (.csv)</a>`).join("")}</div>
    </section>
    ${admin ? `<section class="sec"><h3>Pipelines et étapes <button class="btn sm" data-act="addPipe">${ico("plus")}Pipeline</button></h3>
      ${S.pipelines.map(p => `<div class="sec" style="background:var(--surface-2)">
        <label class="f"><span>Nom du pipeline</span><input type="text" data-pname="${esc(p.id)}" value="${esc(p.name)}"></label>
        ${p.stages.map((s, i) => `<div class="stage-ed"><input type="text" data-sname="${esc(p.id)}|${esc(s.id)}" value="${esc(s.name)}" aria-label="Nom de l'étape">
          <button class="btn sm ghost" data-sup="${esc(p.id)}|${i}" aria-label="Monter" ${i ? "" : "disabled"}>${ico("up")}</button>
          <button class="btn sm ghost" data-sdown="${esc(p.id)}|${i}" aria-label="Descendre" ${i < p.stages.length - 1 ? "" : "disabled"}>${ico("down")}</button>
          <button class="btn sm ghost" data-sdel="${esc(p.id)}|${esc(s.id)}" aria-label="Supprimer l'étape">${ico("x")}</button></div>`).join("")}
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" data-sadd="${esc(p.id)}">${ico("plus")}Étape</button>
          ${p.stages.length ? "" : `<button class="btn sm ghost" data-pdel="${esc(p.id)}" style="color:var(--bad)">Supprimer le pipeline</button>`}</div></div>`).join("") || `<p class="note">Aucun pipeline.</p>`}
    </section>` : ""}
    ${usersSec}
    <section class="sec"><h3>Mon mot de passe</h3>
      <div class="grid2"><label class="f"><span>Mot de passe actuel</span><input type="password" id="pwCur" autocomplete="current-password"></label>
      <label class="f"><span>Nouveau mot de passe (10 caractères minimum)</span><input type="password" id="pwNew" autocomplete="new-password"></label></div>
      <div><button class="btn" data-act="changePw">Changer mon mot de passe</button></div>
    </section></div>`;
}
function userRow(u) {
  const id = esc(u.id || "new");
  return `<div class="user-row" data-user="${id}">
    <input type="text" data-uf="name" value="${esc(u.name)}" placeholder="Nom" aria-label="Nom">
    <input type="email" data-uf="email" value="${esc(u.email || "")}" placeholder="E-mail" aria-label="E-mail">
    <label><input type="checkbox" data-uf="can_login" ${u.can_login ? "checked" : ""}> Accès</label>
    <label><input type="checkbox" data-uf="admin" ${u.role === "admin" ? "checked" : ""}> Admin</label>
    <label><input type="checkbox" data-uf="active" ${u.active ? "checked" : ""}> Actif</label>
    <input type="password" data-uf="password" placeholder="${u.id ? "Nouveau mot de passe (facultatif)" : "Mot de passe"}" autocomplete="new-password" aria-label="Mot de passe" style="grid-column:1/3">
    <button class="btn sm" data-usave="${id}" style="grid-column:3/-1">Enregistrer</button></div>`;
}

/* ---------- liaison des événements de la vue ---------- */
function bindView() {
  const m = $("#main");
  m.onclick = e => {
    const t = e.target.closest("button,[data-deal],[data-actid],[data-open]"); if (!t) return;
    if (t.dataset.toggle) { e.stopPropagation(); return toggleDone(t.dataset.toggle); }
    if (t.dataset.deal) return openDeal(t.dataset.deal);
    if (t.dataset.actid) return openAct(findAct(t.dataset.actid));
    if (t.dataset.open) { const [k, id] = t.dataset.open.split(":"); return openEntity(k, id); }
    const a = t.dataset.act;
    if (a === "goSettings") return go("settings");
    if (a === "newDeal") return newDeal({});
    if (a === "newAct") return openAct(null, {});
    if (a === "newContact") return newEntity(S.contactKind);
    if (a === "importFull") return runImport("full");
    if (a === "importInc") return runImport("inc");
    if (a === "changePw") return changePw();
    if (a === "addUser") { S.addingUser = true; return render(); }
    if (a === "addPipe") return editPipes(ps => ps.push({id: "", name: "Nouveau pipeline", stages: [{id: "", name: "Premier contact"}]}));
    if (t.dataset.usave) return saveUser(t.closest("[data-user]"));
    if (t.dataset.sadd) return editPipes(ps => ps.find(p => p.id === t.dataset.sadd).stages.push({id: "", name: "Nouvelle étape"}));
    if (t.dataset.pdel) return editPipes(ps => ps.splice(ps.findIndex(p => p.id === t.dataset.pdel), 1));
    if (t.dataset.sup || t.dataset.sdown) { const [pid, i] = (t.dataset.sup || t.dataset.sdown).split("|"); const j = +i + (t.dataset.sup ? -1 : 1);
      return editPipes(ps => { const st = ps.find(p => p.id === pid).stages; [st[i], st[j]] = [st[j], st[i]]; }); }
    if (t.dataset.sdel) { const [pid, sid] = t.dataset.sdel.split("|"); const n = [...S.deals.values()].filter(d => d.stage_id === sid).length;
      if (n) return toast(`Cette étape contient ${n} affaire(s) : déplacez-les avant de la supprimer.`, true);
      return editPipes(ps => { const p = ps.find(x => x.id === pid); p.stages = p.stages.filter(s => s.id !== sid); }); }
    const seg = t.closest(".seg");
    if (seg && t.dataset.k) {
      if (seg.id === "statusSeg") S.dealStatus = t.dataset.k;
      if (seg.id === "actModeSeg") S.actMode = t.dataset.k;
      if (seg.id === "kindSeg") S.contactKind = t.dataset.k;
      render();
    }
  };
  m.onkeydown = e => { if (e.key !== "Enter" && e.key !== " ") return; const t = e.target; if (t.matches && t.matches("[data-deal],[data-actid],[data-open]")) { e.preventDefault(); t.click(); } };
  m.onchange = e => {
    const t = e.target;
    if (t.id === "pipeSel") { S.pipelineId = t.value; ls.set("crm.pipe", t.value); render(); }
    if (t.id === "dealOwner") { S.dealOwner = t.value; ls.set("crm.dealOwner", t.value); render(); }
    if (t.id === "actOwner") { S.actOwner = t.value; ls.set("crm.actOwner", t.value); render(); }
    if (t.id === "actType") { S.actType = t.value; render(); }
    if (t.dataset.pname) editPipes(ps => { ps.find(p => p.id === t.dataset.pname).name = t.value.trim() || "Sans nom"; });
    if (t.dataset.sname) { const [pid, sid] = t.dataset.sname.split("|"); editPipes(ps => { ps.find(p => p.id === pid).stages.find(s => s.id === sid).name = t.value.trim() || "Sans nom"; }); }
  };
  const q = $("#contactQ");
  if (q) q.oninput = () => { S.contactQ = q.value; clearTimeout(q._t); q._t = setTimeout(loadContacts, 250); };
  const board = $("#board");
  if (board) {
    board.ondragstart = e => { const c = e.target.closest(".card"); if (!c) return; e.dataTransfer.setData("text/plain", c.dataset.deal); e.dataTransfer.effectAllowed = "move"; c.classList.add("dragging"); };
    board.ondragend = e => { const c = e.target.closest(".card"); if (c) c.classList.remove("dragging"); };
    board.ondragover = e => { const c = e.target.closest(".col"); if (!c) return; e.preventDefault(); board.querySelectorAll(".col.over").forEach(x => x !== c && x.classList.remove("over")); c.classList.add("over"); };
    board.ondragleave = e => { const c = e.target.closest(".col"); if (c && !c.contains(e.relatedTarget)) c.classList.remove("over"); };
    board.ondrop = async e => { const c = e.target.closest(".col"); if (!c) return; e.preventDefault(); c.classList.remove("over");
      const id = e.dataTransfer.getData("text/plain"); const d = S.deals.get(id); if (!d || d.stage_id === c.dataset.stage) return;
      S.deals.set(id, {...d, stage_id: c.dataset.stage}); render();
      try { S.deals.set(id, await updateE("deals", id, {stage_id: c.dataset.stage, stage_change_time: nowIso()})); toast("Étape mise à jour"); }
      catch (err) { S.deals.set(id, d); render(); failToast(err); } };
  }
}
async function editPipes(fn) {
  const ps = JSON.parse(JSON.stringify(S.pipelines)); fn(ps);
  try { await api("pipelines", {method: "POST", body: {pipelines: ps}}); await loadBoot(); render(); }
  catch (e) { failToast(e); await loadBoot(); render(); }
}
async function saveUser(row) {
  const v = k => row.querySelector(`[data-uf="${k}"]`); const id = row.dataset.user === "new" ? "" : row.dataset.user;
  const user = {id, name: v("name").value, email: v("email").value, can_login: v("can_login").checked, role: v("admin").checked ? "admin" : "user", active: v("active").checked, password: v("password").value};
  try { await api("user_save", {method: "POST", body: {user}}); S.addingUser = false; await loadBoot(); render(); toast("Personne enregistrée"); } catch (e) { failToast(e); }
}
async function changePw() {
  try { await api("password", {method: "POST", body: {current: $("#pwCur").value, new: $("#pwNew").value}}); $("#pwCur").value = $("#pwNew").value = ""; toast("Mot de passe changé"); } catch (e) { failToast(e); }
}
function go(v) { S.view = v; ls.set("crm.view", v); render(); window.scrollTo(0, 0); }

/* ---------- Import ---------- */
async function runImport(mode) {
  if (IMP.running) return;
  IMP.running = true; IMP.log = []; IMP.pct = 0; render();
  let state = {mode};
  try {
    do {
      state = await api("import", {method: "POST", body: {state}});
      IMP.log = state.log || []; IMP.pct = state.pct || 0;
      const el = $("#impLog"); if (el) { el.hidden = false; el.textContent = IMP.log.join("\n"); el.scrollTop = el.scrollHeight; }
      const bar = $("#impBar"); if (bar) { bar.style.width = IMP.pct + "%"; bar.parentElement.hidden = false; }
    } while (state.step !== "done");
    await loadBoot(); await loadData(); toast("Import Pipedrive terminé");
  } catch (e) {
    IMP.log.push("Interrompu : " + e.message + " Relancez l'import ; les fiches déjà importées seront simplement mises à jour.");
    toast("Import interrompu : " + e.message, true);
  } finally { IMP.running = false; render(); }
}

/* ---------- Activités : actions ---------- */
const findAct = id => S.actsOpen.get(id) || S.actsDone.get(id) || (S.panelActs || []).find(a => a.id === id);
async function toggleDone(id) {
  const a = findAct(id); if (!a) return;
  const done = !a.done;
  try { const row = await updateE("activities", id, {done, done_time: done ? nowIso() : null}); putAct(row); toast(done ? "Activité faite" : "Activité remise à faire");
    if (done && a.deal_id && S.deals.get(a.deal_id)?.status === "open") {
      const others = [...S.actsOpen.values()].filter(x => x.deal_id === a.deal_id && x.id !== id);
      if (!others.length) setTimeout(() => openAct(null, {deal_id: a.deal_id, _hint: "Cette affaire n'a plus d'activité prévue : planifiez la suivante."}), 350);
    }
    afterChange();
  } catch (e) { failToast(e); }
}
function afterChange() { if (S.panel) reloadPanelActs(); if (!S.modal && !S.panel) { if (S.view === "contacts") loadContacts(); else render(); } else softHeader(); }

function pickerHtml(name, kind, val, label) {
  return `<div class="f picker" data-picker="${name}" data-kind="${kind}"><span style="font-size:12px;font-weight:600;color:var(--muted)">${label}</span>
    <div class="sel"><button type="button" class="val ${val && val.id ? "" : "empty"}" data-pval>${esc(val && val.id ? (val.name || "Fiche sans nom") : "Aucun")}</button>
    ${val && val.id ? `<button type="button" class="btn sm ghost" data-pclear aria-label="Retirer">${ico("x")}</button>` : ""}</div></div>`;
}
function bindPicker(root, name, onPick) {
  const el = root.querySelector(`[data-picker="${name}"]`); if (!el) return;
  const kind = el.dataset.kind;
  el.querySelector("[data-pclear]")?.addEventListener("click", () => onPick(null));
  el.querySelector("[data-pval]").addEventListener("click", () => {
    if (el.querySelector(".pop")) return el.querySelector(".pop").remove();
    const pop = document.createElement("div"); pop.className = "pop";
    pop.innerHTML = `<input type="search" placeholder="Rechercher…" aria-label="Rechercher"><div data-res><div class="hint">Tapez pour chercher.</div></div>`;
    el.appendChild(pop); const inp = pop.querySelector("input"); inp.focus();
    let seq = 0;
    const run = async () => {
      const q = inp.value.trim(); const my = ++seq; let res = [];
      if (kind === "deal") res = [...S.deals.values()].filter(d => !q || norm(d.title + " " + (d.org_name || "")).includes(norm(q)))
        .sort((a, b) => (a.status === "open" ? 0 : 1) - (b.status === "open" ? 0 : 1) || String(a.title).localeCompare(b.title, "fr")).slice(0, 30).map(d => ({id: d.id, name: d.title, sub: d.org_name, raw: d}));
      else { try { res = (await searchEntities(kind, q, 20)).map(x => ({id: x.id, name: x.name, sub: kind === "person" ? x.org_name : x.address, raw: x})); } catch { res = []; } }
      if (my !== seq) return;
      pop.querySelector("[data-res]").innerHTML = res.map((r, i) => `<button type="button" data-i="${i}">${esc(r.name || "Sans nom")}${r.sub ? ` <span class="muted" style="font-size:12px">· ${esc(r.sub)}</span>` : ""}</button>`).join("")
        + (kind !== "deal" && q ? `<button type="button" data-new>${ico("plus")} Créer « ${esc(q)} »</button>` : "")
        + (!res.length && (kind === "deal" || !q) ? `<div class="hint">${q ? "Aucun résultat." : "Tapez pour chercher."}</div>` : "");
      pop.querySelectorAll("[data-i]").forEach(b => b.onclick = () => { pop.remove(); onPick(res[+b.dataset.i]); });
      pop.querySelector("[data-new]")?.addEventListener("click", async () => { pop.remove(); const v = await quickCreate(kind, q); if (v) onPick(v); });
    };
    inp.oninput = () => { clearTimeout(inp._t); inp._t = setTimeout(run, 220); };
    inp.onkeydown = e => { if (e.key === "Escape") { e.stopPropagation(); pop.remove(); } };
    run();
  });
}
async function quickCreate(kind, name) {
  const data = kind === "org" ? {name, owner_id: S.me.id} : {name, first_name: name.split(" ")[0], last_name: name.split(" ").slice(1).join(" "), owner_id: S.me.id};
  try { const row = await createE(kind === "org" ? "orgs" : "persons", data); toast(kind === "org" ? "Organisation créée" : "Personne créée"); return {id: row.id, name: row.name, raw: row}; }
  catch (e) { failToast(e); return null; }
}

function openAct(a, preset = {}) {
  const isNew = !a;
  const d0 = preset.deal_id ? S.deals.get(preset.deal_id) : null;
  const m = a ? {...a} : {type: "call", subject: "", due_date: today(), due_time: "", duration: "", owner_id: S.me.id, done: false, note: "",
    deal_id: preset.deal_id || null, deal_title: d0?.title || null, org_id: preset.org_id || d0?.org_id || null, org_name: preset.org_name || d0?.org_name || null,
    person_id: preset.person_id || d0?.person_id || null, person_name: preset.person_name || d0?.person_name || null};
  S.modal = m;
  const draw = () => {
    $("#layer").innerHTML = `<div class="scrim" data-close></div><div class="modal" data-close><form class="mbox" id="actForm" role="dialog" aria-modal="true" aria-label="Activité">
      <div class="mh"><h2>${isNew ? "Planifier une activité" : "Activité"}</h2><button type="button" class="btn ghost sm" data-x aria-label="Fermer">${ico("x")}</button></div>
      <div class="mb">${preset._hint ? `<div class="banner" style="margin:0">${esc(preset._hint)}</div>` : ""}
        <div class="types" id="types">${TYPES.map(([k, l]) => `<button type="button" data-type="${k}" aria-pressed="${m.type === k}">${ico(k)}${l}</button>`).join("")}</div>
        <label class="f"><span>Objet</span><input type="text" id="aSubj" value="${esc(m.subject)}" placeholder="${esc(typeLabel(m.type))}"></label>
        <div class="grid2"><label class="f"><span>Date</span><input type="date" id="aDate" value="${esc(m.due_date || "")}"></label>
          <label class="f"><span>Heure</span><input type="time" id="aTime" value="${esc(m.due_time || "")}"></label>
          <label class="f"><span>Durée (min)</span><input type="number" id="aDur" min="0" step="5" value="${esc(m.duration || "")}"></label>
          <label class="f"><span>Responsable</span><select id="aOwner">${team().map(u => `<option value="${esc(u.id)}" ${u.id === m.owner_id ? "selected" : ""}>${esc(u.name)}</option>`).join("")}</select></label></div>
        ${pickerHtml("deal", "deal", {id: m.deal_id, name: m.deal_title}, "Affaire")}
        <div class="grid2">${pickerHtml("person", "person", {id: m.person_id, name: m.person_name}, "Personne")}${pickerHtml("org", "org", {id: m.org_id, name: m.org_name}, "Organisation")}</div>
        <label class="f"><span>Note</span><textarea id="aNote" rows="4">${esc(m.note || "")}</textarea></label>
        <label style="display:flex;gap:8px;align-items:center;font-weight:600"><input type="checkbox" id="aDone" ${m.done ? "checked" : ""}> Faite</label>
      </div>
      <div class="mf">${isNew ? "" : `<button type="button" class="btn ghost" data-del style="margin-right:auto;color:var(--bad)">Supprimer</button>`}
        <button type="button" class="btn" data-x>Annuler</button><button type="submit" class="btn primary">Enregistrer</button></div></form></div>`;
    const f = $("#actForm");
    const sync = () => { m.subject = $("#aSubj").value; m.due_date = $("#aDate").value; m.due_time = $("#aTime").value; m.duration = $("#aDur").value; m.owner_id = $("#aOwner").value; m.note = $("#aNote").value; m.done = $("#aDone").checked; };
    $("#types").onclick = e => { const b = e.target.closest("[data-type]"); if (!b) return; sync(); m.type = b.dataset.type; draw(); };
    bindPicker(f, "deal", v => { sync(); m.deal_id = v?.id || null; m.deal_title = v?.name || null;
      if (v?.raw) { if (!m.org_id && v.raw.org_id) { m.org_id = v.raw.org_id; m.org_name = v.raw.org_name; } if (!m.person_id && v.raw.person_id) { m.person_id = v.raw.person_id; m.person_name = v.raw.person_name; } } draw(); });
    bindPicker(f, "person", v => { sync(); m.person_id = v?.id || null; m.person_name = v?.name || null; if (v?.raw?.org_id && !m.org_id) { m.org_id = v.raw.org_id; m.org_name = v.raw.org_name; } draw(); });
    bindPicker(f, "org", v => { sync(); m.org_id = v?.id || null; m.org_name = v?.name || null; draw(); });
    $("#layer").onclick = e => { if (e.target.matches("[data-close]") || e.target.closest("[data-x]")) closeModal(); };
    const del = f.querySelector("[data-del]");
    if (del) del.onclick = async () => { if (!del.dataset.confirm) { del.dataset.confirm = 1; del.textContent = "Confirmer la suppression"; return; }
      try { await deleteE("activities", m.id); S.actsOpen.delete(m.id); S.actsDone.delete(m.id); toast("Activité supprimée"); closeModal(); } catch (e) { failToast(e); } };
    f.onsubmit = async e => { e.preventDefault(); sync();
      const was = a ? a.done : false;
      const data = {type: m.type, subject: m.subject.trim() || typeLabel(m.type), due_date: m.due_date || null, due_time: m.due_time || null, duration: m.duration ? Number(m.duration) : null,
        owner_id: m.owner_id || null, deal_id: m.deal_id, org_id: m.org_id, person_id: m.person_id, note: m.note, done: m.done,
        done_time: m.done ? (was ? m.done_time || nowIso() : nowIso()) : null};
      const btn = f.querySelector("[type=submit]"); btn.disabled = true;
      try { const row = isNew ? await createE("activities", data) : await updateE("activities", m.id, data); putAct(row);
        toast(isNew ? "Activité planifiée" : "Activité enregistrée"); closeModal(); }
      catch (err) { btn.disabled = false; failToast(err); }
    };
    if (isNew) setTimeout(() => $("#aSubj")?.focus(), 30);
  };
  draw();
}
function closeModal() { S.modal = null; $("#layer").innerHTML = ""; afterChange(); }

/* ---------- Panneau : affaire, organisation, personne ---------- */
function closePanel() { const had = S.panel; S.panel = null; S.panelActs = []; S.panelEnt = null; const p = $("#panel"); if (p) p.remove(); if (had) { if (S.view === "contacts") loadContacts(); else render(); } }
function openPanelShell() {
  const old = $("#panel"); if (old) old.remove();
  const host = document.createElement("div"); host.id = "panel";
  host.innerHTML = `<div class="scrim" data-pclose></div><aside class="drawer" role="dialog" aria-modal="true"></aside>`;
  document.body.appendChild(host);
  host.querySelector("[data-pclose]").onclick = closePanel;
  return host.querySelector(".drawer");
}
document.addEventListener("keydown", e => { if (e.key !== "Escape") return; if (S.modal) closeModal(); else if (S.panel) closePanel(); });
async function reloadPanelActs() {
  if (!S.panel) return; const {kind, id} = S.panel; const key = {deal: "deal_id", org: "org_id", person: "person_id"}[kind];
  try { const xs = await api("activities", {params: {[key]: id}}); if (S.panel && S.panel.id === id) { S.panelActs = xs; refreshPanel(); } } catch {}
}
function refreshPanel() {
  if (!S.panel) return;
  if (editing($("#panel"))) { S.panelPending = true; return; }
  if (S.panel.kind === "deal") drawDeal(S.panel.id); else drawEntity(S.panel.kind, S.panel.id);
}
document.addEventListener("focusout", () => setTimeout(() => { if (S.panelPending && !editing($("#panel"))) { S.panelPending = false; refreshPanel(); } }, 150));

function actsSection() {
  const xs = (S.panelActs || []).slice();
  const todo = xs.filter(a => !a.done).sort((a, b) => ((a.due_date || "9") + (a.due_time || "")).localeCompare((b.due_date || "9") + (b.due_time || "")));
  const done = xs.filter(a => a.done).sort((a, b) => (b.done_time || b.due_date || "").localeCompare(a.done_time || a.due_date || ""));
  return `<section class="sec"><h3>Activités <button class="btn sm primary" data-newact>${ico("plus")}Planifier</button></h3>
    ${todo.length ? `<div class="rows">${todo.map(actRow).join("")}</div>` : `<p class="note">Aucune activité prévue.</p>`}
    ${done.length ? `<h3 style="margin-top:4px">Historique <span class="num">${done.length}</span></h3><div class="rows">${done.slice(0, 100).map(a => actRow(a) + (a.note ? `<div style="padding:0 12px 10px 42px;font-size:12px;white-space:pre-wrap;color:var(--muted)">${esc(a.note.slice(0, 800))}</div>` : "")).join("")}</div>` : ""}</section>`;
}
function bindActsSection(dr, preset) {
  dr.querySelector("[data-newact]")?.addEventListener("click", () => openAct(null, preset));
  dr.querySelectorAll("[data-actid]").forEach(r => r.addEventListener("click", e => { const t = e.target.closest("[data-toggle]"); if (t) { e.stopPropagation(); return toggleDone(t.dataset.toggle); } openAct(findAct(r.dataset.actid)); }));
}
function extraSection(kind, doc) {
  const defs = S.fields[kind] || []; if (!defs.length) return "";
  const ex = doc.extra || {};
  return `<section class="sec"><h3>Informations complémentaires</h3><div class="grid2">${defs.map(f => {
    const v = ex[f.key] ?? "";
    let input;
    if (f.type === "date") input = `<input type="date" data-extra="${esc(f.key)}" value="${esc(String(v).slice(0, 10))}">`;
    else if (f.type === "enum" && f.options?.length) input = `<select data-extra="${esc(f.key)}"><option value=""></option>${f.options.map(o => `<option ${o === v ? "selected" : ""}>${esc(o)}</option>`).join("")}${v && !f.options.includes(v) ? `<option selected>${esc(v)}</option>` : ""}</select>`;
    else if (f.type === "text") input = `<textarea data-extra="${esc(f.key)}" rows="2">${esc(v)}</textarea>`;
    else input = `<input type="text" data-extra="${esc(f.key)}" value="${esc(v)}">`;
    return `<label class="f"><span>${esc(f.label)}</span>${input}</label>`; }).join("")}</div></section>`;
}

async function newDeal(preset) {
  const p = pipeline(S.pipelineId) || S.pipelines[0];
  if (!p) return toast("Créez d'abord un pipeline dans les réglages.", true);
  try {
    const row = await createE("deals", {title: preset.org_name ? "Affaire " + preset.org_name : "Nouvelle affaire", value: 0, pipeline_id: p.id, stage_id: p.stages[0]?.id || null, status: "open",
      owner_id: S.me.id, org_id: preset.org_id || null, person_id: preset.person_id || null});
    S.deals.set(row.id, row); openDeal(row.id, true);
  } catch (e) { failToast(e); }
}
function openDeal(id, focusTitle) {
  const dr = openPanelShell(); S.panel = {kind: "deal", id}; S.panelActs = []; drawDeal(id, dr); reloadPanelActs();
  if (focusTitle) setTimeout(() => { const t = $("#panel .title"); t?.focus(); t?.select(); }, 40);
}
function drawDeal(id, dr = $("#panel .drawer")) {
  if (!dr) return; const d = S.deals.get(id);
  if (!d) { dr.innerHTML = `<div class="db"><div class="empty"><h3>Affaire introuvable</h3><p>Elle a peut-être été supprimée.</p><button class="btn" data-pc>Fermer</button></div></div>`; dr.querySelector("[data-pc]").onclick = closePanel; return; }
  const keepScroll = dr.querySelector(".db")?.scrollTop || 0;
  const p = pipeline(d.pipeline_id) || S.pipelines[0] || {stages: []}; const si = p.stages.findIndex(s => s.id === d.stage_id);
  const status = d.status === "won" ? `<span class="won-tag">Gagnée</span>` : d.status === "lost" ? `<span class="lost-tag">Perdue</span>` : "";
  dr.innerHTML = `<div class="dh"><div class="top"><input class="title" id="dTitle" value="${esc(d.title)}" aria-label="Titre de l'affaire"><button class="btn ghost sm" data-pc aria-label="Fermer">${ico("x")}</button></div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${status}
      ${d.status === "open" ? `<button class="btn sm good" data-won>Gagnée</button><button class="btn sm bad" data-lost>Perdue</button>` : `<button class="btn sm" data-reopen>Rouvrir</button>`}
      <span style="flex:1"></span><span class="num" style="font-size:16px;font-weight:600">${eur(d.value)}</span></div>
    <div class="stages" title="Étape">${p.stages.map((s, i) => `<button data-stage="${esc(s.id)}" class="${i < si ? "on" : i === si ? "cur" : ""}" title="${esc(s.name)}" aria-label="Étape ${esc(s.name)}"></button>`).join("")}</div>
    <div class="stage-label">${esc(p.name || "")} · <b>${esc(p.stages[si]?.name || "Étape inconnue")}</b></div></div>
    <div class="db">
      ${d.status === "lost" ? `<section class="sec"><label class="f"><span>Raison de la perte</span><input type="text" id="dLost" value="${esc(d.lost_reason || "")}"></label></section>` : ""}
      <section class="sec"><h3>Affaire</h3><div class="grid2">
        <label class="f"><span>Valeur (€)</span><input type="number" id="dValue" min="0" step="100" value="${esc(d.value || 0)}"></label>
        <label class="f"><span>Clôture prévue</span><input type="date" id="dClose" value="${esc(d.expected_close_date || "")}"></label>
        <label class="f"><span>Pipeline</span><select id="dPipe">${S.pipelines.map(x => `<option value="${esc(x.id)}" ${x.id === d.pipeline_id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label>
        <label class="f"><span>Étape</span><select id="dStage">${p.stages.map(s => `<option value="${esc(s.id)}" ${s.id === d.stage_id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select></label>
        <label class="f"><span>Responsable</span><select id="dOwner"><option value=""></option>${team().map(u => `<option value="${esc(u.id)}" ${u.id === d.owner_id ? "selected" : ""}>${esc(u.name)}</option>`).join("")}</select></label>
        <div class="f"><span>Créée le</span><span style="padding:7px 0;color:var(--fg);font-weight:500">${esc(d.add_time ? new Date(d.add_time).toLocaleDateString("fr-FR") : "")}</span></div></div>
        <div class="grid2">${pickerHtml("org", "org", {id: d.org_id, name: d.org_name}, "Organisation")}${pickerHtml("person", "person", {id: d.person_id, name: d.person_name}, "Personne")}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${d.org_id ? `<button class="btn sm" data-goorg>Voir l'organisation</button>` : ""}${d.person_id ? `<button class="btn sm" data-goperson>Voir la personne</button>` : ""}</div></section>
      <section class="sec"><h3>Notes</h3><textarea id="dNotes" rows="5" placeholder="Contexte, besoins, prochaines étapes…">${esc(d.notes || "")}</textarea></section>
      ${actsSection()}
      ${extraSection("deal", d)}
      <div><button class="btn ghost" data-ddel style="color:var(--bad)">Supprimer l'affaire</button></div>
    </div>`;
  dr.querySelector(".db").scrollTop = keepScroll;
  const up = async (patch, redraw) => { try { const row = await updateE("deals", id, patch); S.deals.set(id, row); if (redraw) drawDeal(id); else toast("Enregistré"); return row; } catch (e) { failToast(e); if (redraw) drawDeal(id); } };
  dr.querySelector("[data-pc]").onclick = closePanel;
  $("#dTitle", dr).onchange = e => up({title: e.target.value.trim() || "Sans titre"});
  $("#dValue", dr).onchange = e => up({value: Number(e.target.value) || 0}, true);
  $("#dClose", dr).onchange = e => up({expected_close_date: e.target.value || null});
  $("#dOwner", dr).onchange = e => up({owner_id: e.target.value || null});
  $("#dNotes", dr).onchange = e => up({notes: e.target.value});
  if ($("#dLost", dr)) $("#dLost", dr).onchange = e => up({lost_reason: e.target.value});
  $("#dPipe", dr).onchange = e => { const np = pipeline(e.target.value); up({pipeline_id: np.id, stage_id: np.stages[0]?.id || null, stage_change_time: nowIso()}, true); };
  $("#dStage", dr).onchange = e => up({stage_id: e.target.value, stage_change_time: nowIso()}, true);
  dr.querySelectorAll(".stages [data-stage]").forEach(b => b.onclick = () => up({stage_id: b.dataset.stage, stage_change_time: nowIso()}, true));
  dr.querySelector("[data-won]")?.addEventListener("click", () => up({status: "won", won_time: nowIso(), close_time: nowIso()}, true).then(r => r && toast("Affaire gagnée")));
  dr.querySelector("[data-lost]")?.addEventListener("click", () => up({status: "lost", lost_time: nowIso(), close_time: nowIso()}, true).then(() => setTimeout(() => $("#dLost")?.focus(), 30)));
  dr.querySelector("[data-reopen]")?.addEventListener("click", () => up({status: "open", won_time: null, lost_time: null, close_time: null}, true));
  dr.querySelector("[data-goorg]")?.addEventListener("click", () => openEntity("org", d.org_id));
  dr.querySelector("[data-goperson]")?.addEventListener("click", () => openEntity("person", d.person_id));
  bindPicker(dr, "org", v => up({org_id: v?.id || null}, true));
  bindPicker(dr, "person", v => { const patch = {person_id: v?.id || null}; if (v?.raw?.org_id && !d.org_id) patch.org_id = v.raw.org_id; up(patch, true); });
  bindActsSection(dr, {deal_id: id});
  dr.querySelectorAll("[data-extra]").forEach(el => el.addEventListener("change", () => up({extra: {[el.dataset.extra]: el.value}})));
  const del = dr.querySelector("[data-ddel]");
  del.onclick = async () => { if (!del.dataset.confirm) { del.dataset.confirm = 1; del.textContent = "Confirmer : supprimer l'affaire et garder ses activités"; return; }
    try { await deleteE("deals", id); S.deals.delete(id); toast("Affaire supprimée"); closePanel(); } catch (e) { failToast(e); } };
}

async function newEntity(kind) {
  const v = await quickCreate(kind, kind === "org" ? "Nouvelle organisation" : "Nouvelle personne");
  if (v) openEntity(kind, v.id, true);
}
async function openEntity(kind, id, focusTitle) {
  const dr = openPanelShell(); S.panel = {kind, id}; S.panelEnt = null; S.panelActs = [];
  dr.innerHTML = `<div class="db"><p class="note">Chargement…</p></div>`;
  try {
    const [ent, acts] = await Promise.all([api("get", {params: {e: kind === "org" ? "orgs" : "persons", id}}), api("activities", {params: {[kind + "_id"]: id}})]);
    if (!S.panel || S.panel.id !== id) return;
    S.panelEnt = ent; S.panelActs = acts; drawEntity(kind, id);
    if (focusTitle) setTimeout(() => { const t = $("#panel .title"); t?.focus(); t?.select(); }, 40);
  } catch (e) { dr.innerHTML = `<div class="db"><div class="empty"><h3>${esc(e.message)}</h3><button class="btn" data-pc>Fermer</button></div></div>`; dr.querySelector("[data-pc]").onclick = closePanel; }
}
function drawEntity(kind, id, dr = $("#panel .drawer")) {
  const e = S.panelEnt; if (!dr || !e) return;
  const keepScroll = dr.querySelector(".db")?.scrollTop || 0;
  const colName = kind === "org" ? "orgs" : "persons";
  const deals = [...S.deals.values()].filter(d => (kind === "org" ? d.org_id : d.person_id) === id).sort((a, b) => (a.status === "open" ? 0 : 1) - (b.status === "open" ? 0 : 1) || (b.add_time || "").localeCompare(a.add_time || ""));
  const lines = arr => (arr || []).map(x => x.value).filter(Boolean).join("\n");
  dr.innerHTML = `<div class="dh"><div class="top"><input class="title" id="eName" value="${esc(e.name)}" aria-label="Nom"><button class="btn ghost sm" data-pc aria-label="Fermer">${ico("x")}</button></div>
    <div class="stage-label">${kind === "org" ? "Organisation" : "Personne"}${kind === "person" && e.org_name ? ` · <b>${esc(e.org_name)}</b>` : ""}</div></div>
    <div class="db">
      <section class="sec"><h3>Coordonnées</h3><div class="grid2">
      ${kind === "org" ? `<label class="f"><span>Adresse</span><input type="text" id="eAddr" value="${esc(e.address || "")}"></label><label class="f"><span>Site web</span><input type="text" id="eWeb" value="${esc(e.website || "")}"></label>`
        : `<label class="f"><span>E-mails (un par ligne)</span><textarea id="eMails" rows="2">${esc(lines(e.emails))}</textarea></label><label class="f"><span>Téléphones (un par ligne)</span><textarea id="ePhones" rows="2">${esc(lines(e.phones))}</textarea></label>`}
        <label class="f"><span>Responsable</span><select id="eOwner"><option value=""></option>${team().map(u => `<option value="${esc(u.id)}" ${u.id === e.owner_id ? "selected" : ""}>${esc(u.name)}</option>`).join("")}</select></label></div>
        ${kind === "person" ? pickerHtml("org", "org", {id: e.org_id, name: e.org_name}, "Organisation") + (e.org_id ? `<div><button class="btn sm" data-goorg>Voir l'organisation</button></div>` : "") : ""}
        ${kind === "person" && (e.emails || []).length ? `<p class="note">Écrire à : ${e.emails.map(x => `<a href="mailto:${esc(x.value)}">${esc(x.value)}</a>`).join(", ")}</p>` : ""}
        ${kind === "person" && (e.phones || []).length ? `<p class="note">Appeler : ${e.phones.map(x => `<a href="tel:${esc(String(x.value).replace(/[^+\d]/g, ""))}">${esc(x.value)}</a>`).join(", ")}</p>` : ""}</section>
      ${kind === "org" ? `<section class="sec"><h3>Personnes <button class="btn sm" data-newperson>${ico("plus")}Personne</button></h3>${(e.persons || []).length ? `<div class="rows">${e.persons.map(x => `<div class="r crow" tabindex="0" data-gop="${esc(x.id)}"><span class="main"><b>${esc(x.name)}</b><small>${esc([(x.emails || [])[0]?.value, (x.phones || [])[0]?.value].filter(Boolean).join(" · "))}</small></span><span></span></div>`).join("")}</div>` : `<p class="note">Aucune personne rattachée.</p>`}</section>` : ""}
      <section class="sec"><h3>Affaires <button class="btn sm" data-newdeal>${ico("plus")}Affaire</button></h3>${deals.length ? `<div class="rows">${deals.map(d => `<div class="r crow" tabindex="0" data-god="${esc(d.id)}"><span class="main"><b>${esc(d.title)}</b><small>${esc((stageOf(d.stage_id)?.s.name) || "")}${d.value ? " · " + eur(d.value) : ""}</small></span><span>${d.status === "won" ? `<span class="won-tag">Gagnée</span>` : d.status === "lost" ? `<span class="lost-tag">Perdue</span>` : `<span class="chip ok">En cours</span>`}</span></div>`).join("")}</div>` : `<p class="note">Aucune affaire.</p>`}</section>
      ${actsSection()}
      <section class="sec"><h3>Notes</h3><textarea id="eNotes" rows="4">${esc(e.notes || "")}</textarea></section>
      ${extraSection(kind, e)}
      <div><button class="btn ghost" data-edel style="color:var(--bad)">Supprimer la fiche</button></div>
    </div>`;
  dr.querySelector(".db").scrollTop = keepScroll;
  const up = async (patch, redraw) => { try { const row = await updateE(colName, id, patch); S.panelEnt = {...row, persons: S.panelEnt?.persons}; toast("Enregistré"); if (redraw) drawEntity(kind, id); return row; } catch (err) { failToast(err); } };
  dr.querySelector("[data-pc]").onclick = closePanel;
  $("#eName", dr).onchange = async ev => { const name = ev.target.value.trim() || "Sans nom"; const patch = {name};
    if (kind === "person") { patch.first_name = name.split(" ")[0]; patch.last_name = name.split(" ").slice(1).join(" "); }
    if (await up(patch)) { const deals = await api("deals"); S.deals = new Map(deals.map(d => [d.id, d])); } };
  if ($("#eAddr", dr)) $("#eAddr", dr).onchange = ev => up({address: ev.target.value});
  if ($("#eWeb", dr)) $("#eWeb", dr).onchange = ev => up({website: ev.target.value});
  const toList = v => v.split(/\n+/).map(x => x.trim()).filter(Boolean).map((value, i) => ({value, primary: i === 0}));
  if ($("#eMails", dr)) $("#eMails", dr).onchange = ev => up({emails: toList(ev.target.value)}, true);
  if ($("#ePhones", dr)) $("#ePhones", dr).onchange = ev => up({phones: toList(ev.target.value)}, true);
  $("#eOwner", dr).onchange = ev => up({owner_id: ev.target.value || null});
  $("#eNotes", dr).onchange = ev => up({notes: ev.target.value});
  bindPicker(dr, "org", v => up({org_id: v?.id || null}, true));
  dr.querySelector("[data-goorg]")?.addEventListener("click", () => openEntity("org", e.org_id));
  dr.querySelectorAll("[data-gop]").forEach(r => r.onclick = () => openEntity("person", r.dataset.gop));
  dr.querySelectorAll("[data-god]").forEach(r => r.onclick = () => openDeal(r.dataset.god));
  dr.querySelector("[data-newdeal]").onclick = () => newDeal(kind === "org" ? {org_id: id, org_name: e.name} : {person_id: id, person_name: e.name, org_id: e.org_id, org_name: e.org_name});
  dr.querySelector("[data-newperson]")?.addEventListener("click", async () => {
    try { const row = await createE("persons", {name: "Nouvelle personne", first_name: "Nouvelle", last_name: "personne", org_id: id, owner_id: S.me.id}); openEntity("person", row.id, true); } catch (err) { failToast(err); } });
  bindActsSection(dr, kind === "org" ? {org_id: id, org_name: e.name} : {person_id: id, person_name: e.name, org_id: e.org_id, org_name: e.org_name});
  dr.querySelectorAll("[data-extra]").forEach(el => el.addEventListener("change", () => up({extra: {[el.dataset.extra]: el.value}})));
  const del = dr.querySelector("[data-edel]");
  del.onclick = async () => { if (!del.dataset.confirm) { del.dataset.confirm = 1; del.textContent = "Confirmer la suppression de la fiche"; return; }
    try { await deleteE(colName, id); toast("Fiche supprimée"); const deals = await api("deals"); S.deals = new Map(deals.map(d => [d.id, d])); closePanel(); } catch (err) { failToast(err); } };
}

/* ---------- démarrage et actualisation ---------- */
$("#nav").onclick = e => { const b = e.target.closest("button[data-v]"); if (b) go(b.dataset.v); };
render();
(async () => {
  try { await loadBoot(); await loadData(); S.ready = true; render(); }
  catch (e) { $("#main").innerHTML = `<div class="wrap"><div class="empty"><h3>Chargement impossible</h3><p>${esc(e.message)}</p></div></div>`; return; }
  // Actualisation toutes les 30 secondes pour voir les changements des collègues
  setInterval(async () => {
    if (document.hidden || IMP.running) return;
    try { await loadData(); } catch { return; }
    softHeader();
    if (!S.modal && !S.panel && !editing($("#main")) && S.view !== "contacts" && S.view !== "settings") render();
  }, 30000);
})();
})();
