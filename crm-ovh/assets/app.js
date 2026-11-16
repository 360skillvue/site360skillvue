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
const TYPES = [["call","Appel"],["meeting","Réunion"],["task","Tâche"],["email","E-mail"],["deadline","Échéance"],["lunch","Déjeuner"],["note","Note"]];
const typeLabel = t => (TYPES.find(x => x[0] === t) || [t, t || "Activité"])[1];

/* ---------- API ---------- */
const BOOT = JSON.parse($("#boot").textContent);
const PENDING = new Set(); // demandes au serveur en cours, pour dire ce qui bloque si le chargement s'éternise
async function api(r, {method = "GET", params = {}, body} = {}) {
  const qs = new URLSearchParams({r, ...params});
  let res;
  const tag = r + " " + Date.now(); PENDING.add(tag);
  try {
    res = await fetch("api.php?" + qs, {method, credentials: "same-origin",
      headers: method === "POST" ? {"Content-Type": "application/json", "X-CSRF": BOOT.csrf} : {}, body: body ? JSON.stringify(body) : undefined});
  } catch { throw new Error("Connexion au serveur impossible : vérifiez votre réseau."); }
  finally { PENDING.delete(tag); }
  if (res.status === 401) {
    // Session refusée : on recharge pour revenir à la page de connexion, mais jamais en boucle.
    let n = 0; try { const s = JSON.parse(sessionStorage.getItem("crm401") || "[]").filter(t => Date.now() - t < 60000); n = s.length; s.push(Date.now()); sessionStorage.setItem("crm401", JSON.stringify(s)); } catch {}
    if (n < 2) location.reload();
    throw new Error("Le serveur ne reconnaît pas votre session (demande « " + r + " »). Déconnectez-vous puis reconnectez-vous.");
  }
  let j = null; try { j = await res.json(); } catch {}
  if (!res.ok) throw new Error((j && j.error) || "Erreur serveur (" + res.status + ").");
  return j;
}
const createE = (e, data) => api("create", {method: "POST", params: {e}, body: {data}});
const updateE = async (e, id, data) => {
  const r = await api("update", {method: "POST", params: {e, id}, body: {data}});
  if (r && r._billing) {
    const b = r._billing; delete r._billing;
    const what = b.kind === "acompte" ? "Facture d'acompte de 50 %" : "Facture de solde";
    setTimeout(() => toast(`${what} : tâche créée${b.mail ? ", e-mail envoyé à " + b.to : b.to ? ", mais l'e-mail n'a pas pu partir" : ""}`, !b.mail && !!b.to), 1500);
  }
  return r;
};
const deleteE = (e, id) => api("delete", {method: "POST", params: {e, id}});
function failToast(e) { toast(e.message || "Enregistrement impossible.", true); }

/* ---------- état ---------- */
const S = {
  ready: false, me: null, users: [], deals: new Map(), actsOpen: new Map(), actsDone: new Map(),
  pipelines: [], fields: {deal: [], org: [], person: []}, importInfo: null, pipedrive: false,
  view: ls.get("crm.view", "deals"), pipelineId: ls.get("crm.pipe", null), dealStatus: "open",
  dealOwner: ls.get("crm.dealOwner", "all"), actMode: "todo", actOwner: ls.get("crm.actOwner", "me"), actType: "all",
  contactKind: "org", contactQ: "", contactScope: ls.get("crm.contactScope", "useful"), panel: null, modal: null, panelActs: [], panelEnt: null,
};
const team = () => S.users.filter(u => u.active);
const memberName = id => (S.users.find(u => u.id === id) || {}).name || "";
const pipeline = id => S.pipelines.find(p => p.id === id);
const stageOf = sid => { for (const p of S.pipelines) { const s = p.stages.find(x => x.id === sid); if (s) return {p, s}; } return null; };
const isAdmin = () => S.me && S.me.role === "admin";

async function loadBoot() {
  const b = await api("bootstrap");
  S.me = b.me; S.users = b.users; S.pipelines = b.pipelines; S.fields = b.fields; S.cadrage = b.cadrage || {}; S.importInfo = b.importInfo; S.pipedrive = b.pipedrive;
}
async function loadData() {
  const [deals, acts, tg] = await Promise.all([api("deals"), api("activities"), api("tags_overview").catch(() => null)]);
  S.deals = new Map(deals.map(d => [d.id, d]));
  if (tg) { S.dealTags = tg.deals || {}; S.allTags = tg.all || []; }
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
  if (S.view !== "deals" && S.view !== "acts" && S.view !== "contacts") loadMail();
}

/* ---------- Affaires ---------- */
function viewDeals() {
  if (!S.pipelines.length) return `<div class="wrap"><div class="empty"><h3>${S.ready ? "Aucun pipeline pour l'instant" : "Chargement du CRM…"}</h3>
    <p>Les affaires s'affichent ici par étape. Importez vos données depuis Pipedrive, ou créez un premier pipeline dans les réglages.</p>
    <button class="btn primary" data-act="goSettings">Ouvrir les réglages</button></div></div>`;
  if (!pipeline(S.pipelineId)) S.pipelineId = S.pipelines[0].id;
  const p = pipeline(S.pipelineId); const na = nextActs();
  const ownerF = S.dealOwner === "me" ? S.me?.id : S.dealOwner;
  const deals = [...S.deals.values()].filter(d => d.pipeline_id === p.id && (S.dealStatus === "all" || d.status === S.dealStatus) && (S.dealOwner === "all" || d.owner_id === ownerF)
    && (!S.dealTag || ((S.dealTags || {})[d.id] || []).includes(S.dealTag)));
  const dealTagList = (S.allTags || []).filter(t => t.deal > 0);
  if (S.dealTag && !dealTagList.some(t => t.tag === S.dealTag)) S.dealTag = "";
  const open = [...S.deals.values()].filter(d => d.pipeline_id === p.id && d.status === "open");
  const ym = today().slice(0, 7);
  const wonM = [...S.deals.values()].filter(d => d.pipeline_id === p.id && d.status === "won" && (localDay(d.won_time) || "").slice(0, 7) === ym);
  const noAct = open.filter(d => !na.get(d.id)).length;
  const sum = xs => xs.reduce((t, d) => t + (Number(d.value) || 0), 0);
  const cols = p.stages.map((s, i) => {
    const ds = deals.filter(d => d.stage_id === s.id).sort((a, b) => ((na.get(a.id)?.k) || "~").localeCompare((na.get(b.id)?.k) || "~"));
    // Couleur de l'étape : du bleu (début du parcours) au vert (proche de la signature).
    const t = p.stages.length > 1 ? i / (p.stages.length - 1) : 0;
    const st = `hsl(${Math.round(218 - 58 * t)} 78% ${Math.round(50 - 12 * t)}%)`;
    return `<section class="col" data-stage="${esc(s.id)}" style="--st:${st}"><div class="col-h"><h3>${esc(s.name)}</h3><div class="meta"><span class="num">${eur(sum(ds))}</span><span>${ds.length} affaire${ds.length > 1 ? "s" : ""}</span></div></div>
      <div class="cards">${ds.map(d => cardHtml(d, na.get(d.id)?.a)).join("")}</div></section>`;
  }).join("");
  const orphan = deals.filter(d => !p.stages.some(s => s.id === d.stage_id));
  return `<div class="wrap toolbar">
      <select id="pipeSel" aria-label="Pipeline">${S.pipelines.map(x => `<option value="${esc(x.id)}" ${x.id === p.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select>
      <div class="seg" id="statusSeg">${[["open","En cours"],["won","Gagnées"],["lost","Perdues"],["all","Toutes"]].map(([k, l]) => `<button data-k="${k}" aria-pressed="${S.dealStatus === k}">${l}</button>`).join("")}</div>
      <select id="dealOwner" aria-label="Responsable"><option value="all">Toute l'équipe</option><option value="me" ${S.dealOwner === "me" ? "selected" : ""}>Mes affaires</option>
        ${team().filter(u => u.id !== S.me?.id).map(u => `<option value="${esc(u.id)}" ${S.dealOwner === u.id ? "selected" : ""}>${esc(u.name)}</option>`).join("")}</select>
      ${dealTagList.length ? `<select id="dealTag" aria-label="Tag"><option value="">Tous les tags</option>${dealTagList.map(t => `<option value="${esc(t.tag)}" ${S.dealTag === t.tag ? "selected" : ""}>${esc(t.tag)} (${t.deal})</option>`).join("")}</select>` : ""}
      <span class="grow"></span>
      <button class="btn primary" data-act="newDeal">${ico("plus")}Affaire</button>
    </div>
    <div class="wrap summary" style="padding-bottom:10px">
      <span>En cours <b>${open.length}</b> · <b>${eur(sum(open))}</b></span>
      <span>Gagnées ce mois-ci <b>${wonM.length}</b> · <b style="color:var(--mint)">${eur(sum(wonM))}</b></span>
      <span>Sans activité prévue <b style="color:${noAct ? "var(--warn)" : "inherit"}">${noAct}</b></span>
      ${orphan.length ? `<span>Étape inconnue <b>${orphan.length}</b></span>` : ""}
    </div>
    <div class="board-scroll"><div class="board" id="board">${cols}</div></div>
    ${!S.deals.size && S.ready ? `<div class="wrap"><div class="empty"><h3>Aucune affaire</h3><p>Créez une affaire, ou importez celles de Pipedrive depuis les réglages.</p></div></div>` : ""}`;
}
/* ---------- Tags ---------- */
const tagChips = tags => (tags || []).length ? `<span class="tags">${tags.map(t => `<span class="tagchip">${esc(t)}</span>`).join("")}</span>` : "";
const parseTags = v => String(v || "").split(",").map(x => x.trim()).filter(Boolean);
function tagField(id, tags) {
  return `<label class="f"><span>Tags (séparés par des virgules)</span><input type="text" id="${id}" value="${esc((tags || []).join(", "))}" placeholder="par exemple : industrie, salon Préventica"></label>`;
}
async function saveTags(entity, id, value) {
  const r = await api("tags", {method: "POST", params: {e: entity, id}, body: {tags: parseTags(value)}});
  if (entity === "deal") { S.dealTags = S.dealTags || {}; if (r.tags.length) S.dealTags[id] = r.tags; else delete S.dealTags[id]; }
  else S.panelTags = r.tags;
  try { const tg = await api("tags_overview"); S.allTags = tg.all || []; } catch {}
  toast("Tags enregistrés");
  return r.tags;
}
async function runTagsImport() {
  if (IMP.running) return;
  IMP.running = true; IMP.log = []; IMP.pct = 0; render();
  let state = {};
  try {
    do {
      state = await api("tags_import", {method: "POST", body: {state}});
      IMP.log = state.log || []; IMP.pct = state.pct || 0;
      const bar = $("#impBar"), log = $("#impLog");
      if (bar) bar.style.width = IMP.pct + "%";
      if (log) { log.hidden = false; log.textContent = IMP.log.join("\n"); log.scrollTop = log.scrollHeight; }
    } while (state.step !== "done");
    await loadData(); toast("Tags repris de Pipedrive");
  } catch (e) {
    IMP.log.push("Interrompu : " + e.message + " Vous pouvez relancer : les tags déjà repris ne seront pas dupliqués.");
    toast("Reprise des tags interrompue : " + e.message, true);
  } finally { IMP.running = false; render(); }
}

/* ---------- Coordonnées du contact ---------- */
const firstVal = xs => ((xs || []).find(x => x.primary) || (xs || [])[0] || {}).value || "";
const telHref = v => "tel:" + String(v).replace(/[^+\d]/g, "");
/* Ligne compacte : téléphone (appel) et e-mail (fenêtre d'envoi du CRM) du contact, pour les listes et les cartes. */
function contactLine(x, opts = {}) {
  const ph = firstVal(x.contact_phones), em = firstVal(x.contact_emails);
  if (!x.contact_id || (!ph && !em)) return "";
  const who = x.contact_name && x.contact_name !== x.person_name ? `<span class="ct-who">${esc(x.contact_name)}</span>` : "";
  return `<span class="ct-line">${who}${ph ? `<a class="ct" href="${esc(telHref(ph))}" draggable="false" title="Appeler ${esc(x.contact_name || "")}">${ico("call")}<span>${esc(ph)}</span></a>` : ""}${em ? `<a class="ct" href="mailto:${esc(em)}" draggable="false" data-mailp="${esc(x.contact_id)}" data-mailto-addr="${esc(em)}" data-mdeal="${esc(opts.dealId || x.deal_id || "")}" title="Écrire à ${esc(x.contact_name || "")}">${ico("email")}<span>${esc(em)}</span></a>` : ""}</span>`;
}
/* Bloc détaillé : toutes les adresses et tous les numéros, avec copie, pour la fiche affaire et la fenêtre activité. */
function contactBlock(x, opts = {}) {
  if (!x.contact_id) return opts.empty ? `<p class="note">Aucun contact lié : choisissez une personne pour voir ses coordonnées.</p>` : "";
  const phones = (x.contact_phones || []).map(p => p.value).filter(Boolean), emails = (x.contact_emails || []).map(p => p.value).filter(Boolean);
  const copy = v => `<button type="button" class="btn sm ghost" data-copy="${esc(v)}" title="Copier" aria-label="Copier ${esc(v)}">Copier</button>`;
  return `<div class="ct-block"><div class="ct-head"><b>${esc(x.contact_name || "Contact")}</b>${x.contact_name !== x.person_name && !x.person_id ? `<span class="note">premier contact de l'organisation</span>` : ""}
      <button type="button" class="btn sm ghost" data-goct="${esc(x.contact_id)}">Voir la fiche</button></div>
    ${phones.map(v => `<div class="ct-row"><a class="ct" href="${esc(telHref(v))}">${ico("call")}<span>${esc(v)}</span></a>${copy(v)}</div>`).join("")}
    ${emails.map(v => `<div class="ct-row"><a class="ct" href="mailto:${esc(v)}" data-mailp="${esc(x.contact_id)}" data-mailto-addr="${esc(v)}" data-mdeal="${esc(opts.dealId || x.deal_id || "")}">${ico("email")}<span>${esc(v)}</span></a>${copy(v)}</div>`).join("")}
    ${!phones.length && !emails.length ? `<p class="note">Ni téléphone ni e-mail sur la fiche de ce contact.</p>` : ""}</div>`;
}
/* Clics sur les coordonnées : ils ne doivent pas ouvrir la ligne ou la carte autour. */
document.addEventListener("click", e => {
  const cp = e.target.closest("[data-copy]");
  if (cp) { e.preventDefault(); e.stopPropagation(); const v = cp.dataset.copy;
    navigator.clipboard?.writeText(v).then(() => toast("Copié : " + v), () => toast(v)); return; }
  const go = e.target.closest("[data-goct]");
  if (go) { e.preventDefault(); e.stopPropagation(); if (S.modal) closeModal(); openEntity("person", go.dataset.goct); return; }
  const a = e.target.closest("a.ct");
  if (!a) return;
  e.stopPropagation();
  if (a.dataset.mailp) { e.preventDefault(); openMail({to: a.dataset.mailtoAddr, person_id: a.dataset.mailp, deal_id: a.dataset.mdeal || null, name: ""}); }
}, true);

function cardHtml(d, a) {
  const sub = [d.org_name, d.person_name].filter(Boolean).join(" · ");
  const tag = d.status === "won" ? `<span class="won-tag">Gagnée</span>` : d.status === "lost" ? `<span class="lost-tag">Perdue</span>` : "";
  return `<div class="card" role="button" tabindex="0" draggable="true" data-deal="${esc(d.id)}"><span class="t">${esc(d.title || "Sans titre")}</span>
    ${sub ? `<span class="s">${esc(sub)}</span>` : ""}
    ${contactLine(d, {dealId: d.id})}
    ${tagChips((S.dealTags || {})[d.id])}
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
    <span class="main"><b>${esc(a.subject || typeLabel(a.type))}</b>${link ? `<small>${esc(link)}</small>` : ""}${contactLine(a)}</span>
    <span class="when">${!a.done && a.mails_since > 0 ? `<span class="chip today" style="white-space:nowrap;margin-right:8px" title="Des e-mails ont été échangés depuis la création de cette activité : ouvrez-la pour vérifier qu'elle est toujours d'actualité.">À vérifier : ${a.mails_since} e-mail${a.mails_since > 1 ? "s" : ""} depuis</span>` : ""}<span style="color:${late ? "var(--bad)" : "inherit"}">${esc(a.due_date ? fmtDay(a.due_date) : "Sans date")}${a.due_time ? " " + esc(a.due_time) : ""}</span>
      <span class="av" style="margin-left:6px" title="${esc(memberName(a.owner_id))}">${esc(initials(memberName(a.owner_id)))}</span></span></div>`;
}
function viewActs() {
  // Avant la fin du chargement, S.me n'existe pas encore : sans cette attente, la page restait blanche
  // quand la dernière vue ouverte était « Activités » avec le filtre « Mes activités ».
  if (!S.me) return `<div class="wrap"><div class="empty"><h3>Chargement du CRM…</h3></div></div>`;
  const owner = S.actOwner === "me" ? S.me.id : S.actOwner;
  const flt = a => (S.actOwner === "all" || a.owner_id === owner) && (S.actType === "all" || a.type === S.actType);
  const tb = `<div class="wrap toolbar">
    <div class="seg" id="actModeSeg"><button data-k="todo" aria-pressed="${S.actMode === "todo"}">À faire</button><button data-k="done" aria-pressed="${S.actMode === "done"}">Faites (45 j)</button></div>
    <select id="actOwner" aria-label="Responsable"><option value="me" ${S.actOwner === "me" ? "selected" : ""}>Mes activités</option><option value="all" ${S.actOwner === "all" ? "selected" : ""}>Toute l'équipe</option>
      ${team().filter(u => u.id !== S.me.id).map(u => `<option value="${esc(u.id)}" ${S.actOwner === u.id ? "selected" : ""}>${esc(u.name)}</option>`).join("")}</select>
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
    <div class="seg" id="scopeSeg" title="Utiles : fiches liées à une affaire, une activité, un e-mail ou un tag"><button data-k="useful" aria-pressed="${S.contactScope !== "all"}">Utiles</button><button data-k="all" aria-pressed="${S.contactScope === "all"}">Tous</button></div>
    <input type="search" id="contactQ" placeholder="Rechercher un nom, un e-mail…" value="${esc(S.contactQ)}" style="max-width:320px">
    ${(() => { const ts = (S.allTags || []).filter(t => t[S.contactKind] > 0); if (S.contactTag && !ts.some(t => t.tag === S.contactTag)) S.contactTag = "";
      return ts.length ? `<select id="contactTag" aria-label="Tag"><option value="">Tous les tags</option>${ts.map(t => `<option value="${esc(t.tag)}" ${S.contactTag === t.tag ? "selected" : ""}>${esc(t.tag)} (${t[S.contactKind]})</option>`).join("")}</select>` : ""; })()}
    <span class="grow"></span><button class="btn primary" data-act="newContact">${ico("plus")}${S.contactKind === "org" ? "Organisation" : "Personne"}</button></div>
    <div class="wrap list"><div id="contactList"><div class="empty"><p>Chargement…</p></div></div></div>`;
}
const searchEntities = (kind, q, n = 40, tag = "", useful = false) => { const params = {kind, q: q || "", n}; if (tag) params.tag = tag; if (useful) params.useful = 1; return api("search", {params}); };
let contactSeq = 0;
async function loadContacts() {
  const seq = ++contactSeq; if (!$("#contactList")) return;
  try {
    const xs = await searchEntities(S.contactKind, S.contactQ.trim(), 60, S.contactTag || "", S.contactScope !== "all");
    if (seq !== contactSeq || !$("#contactList")) return;
    if (S.contactTag && xs.length) {
      $("#contactList").innerHTML = `<p class="note" style="margin-bottom:8px"><b>${xs.length}</b> fiche${xs.length > 1 ? "s" : ""} avec le tag « ${esc(S.contactTag)} »${xs.length >= 500 ? " (liste limitée aux 500 premières)" : ""}.</p><div class="rows">${xs.map(x => {
        const sub = S.contactKind === "org" ? (x.address || "") : [x.org_name, (x.emails || [])[0]?.value].filter(Boolean).join(" · ");
        return `<div class="r crow" tabindex="0" data-open="${S.contactKind}:${esc(x.id)}"><span class="main"><b>${esc(x.name || "Sans nom")}</b>${sub ? `<small>${esc(sub)}</small>` : ""}</span><span class="when"></span></div>`; }).join("")}</div>`;
      return;
    }
    if (!xs.length) { $("#contactList").innerHTML = `<div class="empty"><h3>${S.contactQ ? "Aucun résultat" : "Aucune fiche pour l'instant"}</h3><p>${S.contactQ ? (S.contactScope !== "all" ? "Aucun contact utile ne correspond. Cliquez sur « Tous » pour chercher dans toute la base." : "Essayez avec une partie du nom ou de l'e-mail.") :"Importez vos contacts depuis Pipedrive dans les réglages, ou créez une fiche."}</p></div>`; return; }
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
  // Pipedrive est abandonné : la section d'import n'est plus affichée (un import écraserait les pipelines et les étapes refaits à la main).
  const importSec = false ? `<section class="sec"><h3>Import depuis Pipedrive</h3>
      ${S.pipedrive ? `<p class="note">Récupère équipe, pipelines, organisations, personnes, affaires et activités. Les fiches venant de Pipedrive sont mises à jour à chaque import ; les notes saisies ici et les fiches créées ici ne sont jamais touchées. Laissez cet onglet ouvert pendant l'import.</p>`
        : `<p class="note">Aucun jeton Pipedrive n'est configuré : ajoutez <b>pipedrive_token</b> dans le fichier config.php du serveur pour activer l'import.</p>`}
      ${imp ? `<p class="note">Dernier import : <b>${esc(new Date(imp.at.replace(" ", "T") + "Z").toLocaleString("fr-FR"))}</b>${imp.counts ? " · " + Object.entries(imp.counts).map(([k, v]) => `${esc({orgs: "organisations", persons: "personnes", deals: "affaires", activities: "activités"}[k] || k)} ${v}`).join(", ") : ""}</p>` : ""}
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn primary" data-act="importFull" ${IMP.running || !S.pipedrive ? "disabled" : ""}>Tout importer</button>
        <button class="btn" data-act="importInc" ${IMP.running || !imp || !S.pipedrive ? "disabled" : ""}>Importer les changements depuis le dernier import</button>
        <button class="btn" data-act="importTags" ${IMP.running || !S.pipedrive ? "disabled" : ""}>Reprendre les tags de Pipedrive</button>
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
    ${admin ? fieldsSec() : ""}
    <section class="sec" id="mailSec">${mailSecInner()}</section>
    ${admin ? `<section class="sec" id="billSec">${billSecInner()}</section>` : ""}
    ${admin ? `<section class="sec" id="mcSec">${mcSecInner()}</section>` : ""}
    ${admin ? `<section class="sec" id="bakSec">${bakSecInner()}</section>` : ""}
    ${admin ? `<section class="sec" id="calSec">${calSecInner()}</section>` : ""}
    ${admin ? `<section class="sec" id="hookSec">${hookSecInner()}</section>` : ""}
    <section class="sec" id="claudeSec">${claudeSecInner()}</section>
    ${usersSec}
    <section class="sec"><h3>Mon mot de passe</h3>
      <div class="grid2"><label class="f"><span>Mot de passe actuel</span><input type="password" id="pwCur" autocomplete="current-password"></label>
      <label class="f"><span>Nouveau mot de passe (10 caractères minimum)</span><input type="password" id="pwNew" autocomplete="new-password"></label></div>
      <div><button class="btn" data-act="changePw">Changer mon mot de passe</button></div>
    </section></div>`;
}
/* ---------- Connexion à Claude ---------- */
function claudeSecInner() {
  if (!S.claude) { if (!S.claudeLoading) { S.claudeLoading = true; loadClaude(); } return `<h3>Claude</h3><p class="note">Chargement…</p>`; }
  const c = S.claude;
  return `<h3>Claude</h3>
    <p class="note">Pour que Claude consulte et mette à jour le CRM, ajoutez-le une fois dans Claude : <b>Réglages, Connecteurs, Ajouter un connecteur personnalisé</b>, avec l'adresse ci-dessous. La page de connexion du CRM s'ouvrira : connectez-vous avec votre compte et cliquez sur Autoriser. Claude agit alors en votre nom et ne peut rien supprimer.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><input type="text" readonly id="claudeUrl" value="${esc(c.url)}" style="max-width:420px" aria-label="Adresse du connecteur"><button class="btn sm" data-act="claudeCopy">Copier l'adresse</button></div>
    ${c.conns.length ? `<div class="rows">${c.conns.map(x => `<div class="r crow"><span class="main"><b>${esc(x.client || "Client MCP")}</b><small>${esc(x.user)} · autorisé le ${esc(frDay(x.since))}</small></span>
      <button class="btn sm ghost" style="color:var(--bad)" data-act="claudeRevoke" data-cid="${esc(x.client_id)}" data-uid="${esc(x.user_id)}">Retirer l'accès</button></div>`).join("")}</div>`
      : `<p class="note">Aucune connexion active pour l'instant.</p>`}`;
}
async function loadClaude() {
  try { S.claude = await api("claude_conns"); } catch (e) { S.claude = {url: location.origin + location.pathname.replace(/[^/]*$/, "") + "mcp.php", conns: []}; }
  S.claudeLoading = false; const el = $("#claudeSec"); if (el) el.innerHTML = claudeSecInner();
}
async function claudeRevoke(cid, uid) {
  try { await api("claude_revoke", {method: "POST", body: {client_id: cid, user_id: uid}}); toast("Accès retiré"); await loadClaude(); } catch (e) { failToast(e); }
}

/* ---------- E-mails Microsoft ---------- */
const frDay = iso => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("fr-FR", {day: "numeric", month: "short", year: "numeric"}); };
function mailSecInner() {
  const m = S.mail;
  if (!m) return `<h3>E-mails Microsoft</h3><p class="note">Chargement…</p>`;
  const admin = S.me.role === "admin";
  return `<h3>E-mails Microsoft</h3>
    <p class="note">Les e-mails échangés avec vos contacts s'affichent sur leur fiche et sur leurs affaires. Seuls les messages dont l'expéditeur ou un destinataire est une personne du CRM sont enregistrés (objet, aperçu, date et lien vers Outlook).</p>
    ${admin ? `<div class="grid2">
      <label class="f"><span>Identifiant de l'annuaire (tenant)</span><input type="text" id="msTenant" value="${esc(m.tenant || "")}" autocomplete="off"></label>
      <label class="f"><span>Identifiant de l'application (client)</span><input type="text" id="msClient" value="${esc(m.client_id || "")}" autocomplete="off"></label>
      <label class="f"><span>Secret de l'application${m.configured ? " (laisser vide pour le conserver)" : ""}</span><input type="password" id="msSecret" autocomplete="new-password"></label>
      <div class="f"><span>Adresse de redirection à déclarer chez Microsoft</span><span style="padding:7px 0;color:var(--fg);font-weight:500;word-break:break-all">${esc(m.redirect_uri || "")}</span></div></div>
      <div><button class="btn" data-act="mailSave">Enregistrer la connexion</button></div>` : ""}
    ${!m.configured ? `<p class="note">${admin ? "Renseignez d'abord les trois informations ci-dessus." : "La connexion Microsoft n'est pas encore configurée par un administrateur."}</p>`
      : m.mine ? `<p class="note">Votre boîte <b>${esc(m.mine.email)}</b> est connectée${m.mine.last_sync ? ", dernière synchronisation le " + esc(frDay(String(m.mine.last_sync).replace(" ", "T") + "Z")) : ", pas encore synchronisée"}.${m.mine.last_result ? ` Dernier passage : <b>${esc(m.mine.last_result.lus)}</b> e-mails lus, <b>${esc(m.mine.last_result.rattaches)}</b> rattachés. Au total <b>${esc(m.mine.last_result.total)}</b> e-mails rattachés dans le CRM, pour <b>${esc(m.mine.last_result.contacts)}</b> adresses de contacts connues.` : ""}</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" data-act="mailSync">Synchroniser maintenant</button><button class="btn" data-act="mailSyncFull">Tout relire (60 jours)</button><button class="btn ghost" data-act="mailDisconnect">Déconnecter ma boîte</button></div>`
      : `<div><a class="btn primary" style="text-decoration:none" href="msauth.php?start=1">Connecter ma boîte Microsoft</a></div>`}
    ${admin && (m.boxes || []).length ? `<p class="note">Boîtes connectées : ${m.boxes.map(b => esc(b.name + " (" + b.email + ")")).join(", ")}</p>` : ""}
    ${m.mine ? `<label class="f"><span>Ma signature, ajoutée à la fin des e-mails envoyés depuis le CRM</span><textarea id="mailSig" rows="5" placeholder="Prénom Nom&#10;Fonction, 360SkillVue&#10;Téléphone">${esc(S.mailSig || "")}</textarea></label>
      <div><button class="btn" data-act="mailSigSave">Enregistrer ma signature</button></div>` : ""}`;
}
async function loadMail() {
  try { S.mail = await api("mail_status"); } catch { return; }
  try { S.mailSig = (await api("mail_sig")).signature || ""; } catch {}
  const el = $("#mailSec"); if (el && !editing(el)) el.innerHTML = mailSecInner();
  if (S.me && S.me.role === "admin") {
    try { S.billing = await api("billing_conf"); } catch { return; }
    const bl = $("#billSec"); if (bl && !editing(bl)) bl.innerHTML = billSecInner();
    try { S.hook = await api("hook_conf"); const hk = $("#hookSec"); if (hk && !editing(hk)) hk.innerHTML = hookSecInner(); } catch {}
    try { S.bak = (await api("backup")).liste; const bs = $("#bakSec"); if (bs) bs.innerHTML = bakSecInner(); } catch {}
    try { S.cal = await api("cal_conf"); const cs = $("#calSec"); if (cs && !editing(cs)) cs.innerHTML = calSecInner(); } catch {}
    try { S.mc = await api("mc_conf"); } catch { return; }
    const ml = $("#mcSec"); if (ml && !editing(ml)) ml.innerHTML = mcSecInner();
  }
}
/* ---------- Sauvegardes de la base ---------- */
function bakSecInner() {
  const l = S.bak;
  const intro = `<h3>Sauvegardes</h3><p class="note">Une copie complète de la base du CRM est faite chaque jour, automatiquement, et rangée sur l'hébergement, hors de portée du web. Les quatorze dernières sont gardées. Pour avoir aussi une copie ailleurs, téléchargez de temps en temps la dernière et rangez-la en lieu sûr : le fichier contient toutes vos données et les clés de vos connexions.</p>`;
  if (!l) return intro + `<p class="note">Chargement…</p>`;
  const ko = n => n > 1048576 ? (n / 1048576).toFixed(1).replace(".", ",") + " Mo" : Math.round(n / 1024) + " Ko";
  const last = l[0];
  return intro + (last ? `<p class="note">Dernière sauvegarde : <b>${esc(new Date(last.at).toLocaleString("fr-FR", {day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"}))}</b>, ${esc(ko(last.size))}. ${l.length} sauvegarde${l.length > 1 ? "s" : ""} gardée${l.length > 1 ? "s" : ""}.</p>` : `<p class="note" style="color:var(--bad)">Aucune sauvegarde pour l'instant.</p>`) +
    `<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="bakRun">Sauvegarder maintenant</button>${last ? `<a class="btn" style="text-decoration:none" href="api.php?r=backup&file=${encodeURIComponent(last.name)}">Télécharger la dernière</a>` : ""}</div>`;
}
async function bakRun() {
  toast("Sauvegarde en cours…");
  try { const r = await api("backup", {method: "POST"}); S.bak = r.liste; $("#bakSec").innerHTML = bakSecInner(); toast("Sauvegarde faite"); }
  catch (e) { failToast(e); }
}
/* ---------- Calendly : rendez-vous commerciaux ---------- */
function calSecInner() {
  const c = S.cal;
  if (!c) return `<h3>Calendly</h3><p class="note">Chargement…</p>`;
  const intro = `<h3>Calendly</h3><p class="note">Les rendez-vous commerciaux pris sur Calendly deviennent des activités « Réunion » dans le CRM, toutes les heures. La personne est retrouvée par son adresse e-mail, ou créée avec les réponses du formulaire. Seuls les types cochés ci-dessous sont repris : jamais les classes virtuelles ni les téléconsultations. Rien n'est modifié dans Calendly.</p>`;
  if (!c.configured) return intro + `<div class="grid2"><label class="f"><span>Clé d'accès Calendly</span><input type="password" id="calTok" autocomplete="new-password" placeholder="collez ici la clé créée dans Calendly"></label></div>
    <div><button class="btn" data-act="calTokSave">Enregistrer la clé</button></div>`;
  const names = c.names || [];
  const all = [...new Map([...(c.types || []), ...names.map(n => ({name: n, who: ""}))].map(t => [t.name, t])).values()].sort((a, b) => a.name.localeCompare(b.name));
  return intro + (c.error ? `<p class="note" style="color:var(--bad)">${esc(c.error)}</p>` : "") + `
    <div class="checks" id="calNames">${all.map(t => `<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" value="${esc(t.name)}" ${names.includes(t.name) ? "checked" : ""}> ${esc(t.name)}${t.who ? ` <small style="color:var(--muted)">(${esc(t.who)})</small>` : ""}</label>`).join("")}</div>
    <div class="grid2"><label class="f"><span>Remplacer la clé d'accès (facultatif)</span><input type="password" id="calTok" autocomplete="new-password"></label></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="calNamesSave">Enregistrer les types suivis</button><button class="btn ghost" data-act="calTokSave">Enregistrer la clé</button><button class="btn primary" data-act="calSync">Lire Calendly maintenant</button></div>
    ${c.last && c.last.lignes ? `<p class="note">Dernier passage : ${c.last.lignes.map(esc).join(" ; ")}.</p>` : ""}`;
}
async function calPost(body, msg) {
  try { S.cal = await api("cal_conf", {method: "POST", body}); $("#calSec").innerHTML = calSecInner(); if (msg) toast(msg); }
  catch (e) { failToast(e); }
}
async function calSync() {
  toast("Lecture de Calendly en cours…");
  try { const r = await api("cal_sync", {method: "POST"}); toast(`${r.crees} activités créées, ${r.annules} annulations`); S.cal = await api("cal_conf"); $("#calSec").innerHTML = calSecInner(); await loadData(); }
  catch (e) { failToast(e); }
}
/* ---------- Porte d'entrée pour les outils externes (ScanUp) ---------- */
function hookSecInner() {
  const c = S.hook;
  if (!c) return `<h3>Tâches créées par ScanUp</h3><p class="note">Chargement…</p>`;
  return `<h3>Tâches créées par ScanUp</h3>
    <p class="note">Cette adresse et cette clé permettent à l'automatisation des essais ScanUp de créer une tâche dans le CRM, par exemple quand un testeur commence ou termine un module. La tâche est rattachée à l'affaire en cours du client et attribuée à son responsable. La clé ne donne aucun accès en lecture ; gardez-la tout de même confidentielle.</p>
    <div class="grid2"><label class="f"><span>Adresse à appeler</span><input type="text" readonly value="${esc(c.url)}"></label>
      <label class="f"><span>Clé (en-tête X-CRM-Key)</span><input type="password" readonly id="hookKey" value="${esc(c.key || "")}" placeholder="aucune clé pour l'instant"></label></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">${c.key ? `<button class="btn" data-act="hookCopy">Copier la clé</button>` : ""}<button class="btn ${c.key ? "ghost" : ""}" data-act="hookNew">${c.key ? "Remplacer la clé" : "Créer la clé"}</button></div>`;
}

/* ---------- Mailchimp : tags suivis ---------- */
function mcSecInner() {
  const c = S.mc;
  if (!c) return `<h3>Mailchimp</h3><p class="note">Chargement…</p>`;
  const intro = `<h3>Mailchimp</h3><p class="note">Le CRM ne reprend de Mailchimp que les tags que vous choisissez de suivre, ceux qui servent à une action de vente (par exemple la liste d'appels des inscrits à un webinaire). Leurs contacts sont retrouvés ou créés dans le CRM et reçoivent le tag indiqué. Les clics et les ouvertures restent dans Mailchimp. Rien n'est modifié dans Mailchimp.</p>`;
  if (!c.configured) return intro + `<div class="grid2"><label class="f"><span>Clé d'API Mailchimp</span><input type="password" id="mcKey" autocomplete="new-password" placeholder="se termine par un tiret et un code, par exemple us21"></label></div>
    <div><button class="btn" data-act="mcKeySave">Enregistrer la clé</button></div>`;
  const tags = c.tags || [];
  return intro + (c.error ? `<p class="note" style="color:var(--bad)">${esc(c.error)}</p>` : "") + `
    <div class="grid2"><label class="f"><span>Audience Mailchimp</span><select id="mcList"><option value=""></option>${(c.lists || []).map(l => `<option value="${esc(l.id)}" ${l.id === c.list ? "selected" : ""}>${esc(l.name)} (${l.members})</option>`).join("")}</select></label>
      <label class="f"><span>Remplacer la clé d'API (facultatif)</span><input type="password" id="mcKey" autocomplete="new-password"></label></div>
    ${(c.follow || []).length ? `<div class="rows">${c.follow.map((f, i) => `<div class="r" style="cursor:default;grid-template-columns:minmax(0,1fr) auto"><span class="main"><b>${esc(f.mc)}</b><small>devient dans le CRM le tag « ${esc(f.crm)} »</small></span><button class="btn sm ghost" data-mcdel="${i}" style="color:var(--bad)">Ne plus suivre</button></div>`).join("")}</div>` : `<p class="note">Aucun tag Mailchimp suivi pour l'instant.</p>`}
    ${c.list ? `<div class="grid2"><label class="f"><span>Tag Mailchimp à suivre</span><select id="mcTag"><option value=""></option>${tags.map(t => `<option value="${esc(t.name)}">${esc(t.name)} (${t.members})</option>`).join("")}</select></label>
      <label class="f"><span>Tag à poser dans le CRM</span><input type="text" id="mcCrm" placeholder="par exemple : Inscrit au webinaire du 03/12/26"></label></div>` : ""}
    <div style="display:flex;gap:8px;flex-wrap:wrap">${c.list ? `<button class="btn" data-act="mcAdd">Suivre ce tag</button>` : ""}<button class="btn ghost" data-act="mcKeySave">Enregistrer la clé</button>${(c.follow || []).length ? `<button class="btn primary" data-act="mcSync">Synchroniser maintenant</button>` : ""}</div>
    ${c.last && c.last.lignes ? `<p class="note">Dernier passage : ${c.last.lignes.map(esc).join(" ; ")}.</p>` : ""}
    ${c.list ? `<h3 style="margin-top:18px">Envoi des contacts vers Mailchimp</h3>
    <p class="note">Les contacts utiles du CRM (ceux qui ont une affaire, une activité, un e-mail ou un tag) et qui ont une adresse e-mail sont envoyés dans l'audience choisie, avec prénom, nom, téléphone, pays et nature de l'organisation. Un contact absent de Mailchimp y est créé comme abonné ; un contact déjà présent est seulement mis à jour, et un désabonné reste désabonné. Rien n'est jamais supprimé dans Mailchimp. Le tag « Certification périodique », posé sur une personne ou sur son organisation, est transmis à Mailchimp pour cibler vos communications. ${c.push_on ? "L'envoi se fait ensuite tout seul chaque heure, pour les contacts nouveaux ou modifiés." : "Après le premier envoi, il se fera tout seul chaque heure."}</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="mcPushCount">Compter les contacts à envoyer</button><button class="btn primary" data-act="mcPushGo">Envoyer vers Mailchimp</button></div>
    ${c.push_last ? `<p class="note">Dernier envoi : ${esc(String(c.push_last.envoyes))} contacts envoyés sur ${esc(String(c.push_last.utiles))} utiles.</p>` : ""}` : ""}`;
}
async function mcPush(go) {
  try {
    if (!go) { const r = await api("mc_push"); return toast(`${r.utiles} contacts utiles avec e-mail, dont ${r.a_envoyer} à envoyer`); }
    toast("Envoi vers Mailchimp en cours…");
    const r = await api("mc_push", {method: "POST", body: {go: true}});
    toast(`${r.envoyes} contacts envoyés à Mailchimp`); S.mc = await api("mc_conf"); $("#mcSec").innerHTML = mcSecInner();
  } catch (e) { failToast(e); }
}
async function mcPost(body, msg) {
  try { S.mc = await api("mc_conf", {method: "POST", body}); $("#mcSec").innerHTML = mcSecInner(); if (msg) toast(msg); }
  catch (e) { failToast(e); }
}
async function mcSync() {
  toast("Lecture de Mailchimp en cours…");
  try { const r = await api("mc_sync", {method: "POST"}); toast(`${r.crees} personnes créées, ${r.tagues} tags ajoutés`); S.mc = await api("mc_conf"); $("#mcSec").innerHTML = mcSecInner(); await loadData(); }
  catch (e) { failToast(e); }
}
/* ---------- Rappels de facturation ---------- */
function billSecInner() {
  const c = S.billing;
  if (!c) return `<h3>Rappels de facturation</h3><p class="note">Chargement…</p>`;
  return `<h3>Rappels de facturation</h3>
    <p class="note">Quand une affaire arrive à l'étape « Devis signé » (ou « Contrat signé »), le CRM crée une tâche « Facture d'acompte de 50 % à envoyer » pour le responsable de l'affaire et prévient la personne ci-dessous par e-mail. À l'étape « Livrables envoyés », il fait de même pour la facture de solde. Une seule fois par affaire.</p>
    <div class="grid2"><label class="f"><span>E-mail de la personne chargée de la facturation</span><input type="email" id="billTo" value="${esc(c.to || "")}" placeholder="laisser vide pour ne créer que la tâche"></label>
      <label style="align-self:end;padding-bottom:8px"><input type="checkbox" id="billOn" ${c.enabled ? "checked" : ""}> Rappels activés</label></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="billSave">Enregistrer</button><button class="btn ghost" data-act="billTest">M'envoyer un e-mail d'essai</button></div>`;
}
async function billSave() {
  try { S.billing = await api("billing_conf", {method: "POST", body: {to: $("#billTo").value.trim(), enabled: $("#billOn").checked}}); $("#billSec").innerHTML = billSecInner(); toast("Rappels de facturation enregistrés"); }
  catch (e) { failToast(e); }
}
async function billTest() {
  try { const r = await api("billing_test", {method: "POST"}); toast(r.sent ? "E-mail d'essai envoyé à " + r.to : "Le serveur n'a pas pu envoyer l'e-mail d'essai", !r.sent); }
  catch (e) { failToast(e); }
}
async function mailSave() {
  try { S.mail = await api("mail_conf", {method: "POST", body: {tenant: $("#msTenant").value.trim(), client_id: $("#msClient").value.trim(), secret: $("#msSecret").value}});
    $("#mailSec").innerHTML = mailSecInner(); toast("Connexion Microsoft enregistrée"); }
  catch (e) { failToast(e); }
}
async function mailSync(full) {
  toast("Synchronisation en cours…");
  try { const r = await api("mail_sync", {method: "POST", body: {full: !!full}}); toast(`${r.lus} e-mails lus, ${r.rattaches} rattachés${r.reste ? " ; relancez pour la suite" : ""}`); await loadMail(); }
  catch (e) { failToast(e); }
}
async function mailDisconnect() {
  try { S.mail = await api("mail_disconnect", {method: "POST"}); $("#mailSec").innerHTML = mailSecInner(); toast("Boîte déconnectée"); }
  catch (e) { failToast(e); }
}
async function loadPanelMails() {
  if (!S.panel) return; const {kind, id} = S.panel; const key = {deal: "deal_id", org: "org_id", person: "person_id"}[kind];
  try { const xs = await api("emails", {params: {[key]: id}}); if (S.panel && S.panel.id === id) { S.panelMails = xs; if (xs.length) refreshPanel(); } } catch {}
}
/* Texte d'un e-mail : l'aperçu (trois lignes), avec un bouton pour lire le message en entier.
   Le texte complet est lu dans la boîte Microsoft à la demande, puis gardé pour la suite. */
const MAILFULL = new Map();
function mailBodyHtml(m) {
  if (MAILFULL.has(m.id)) return `<p class="full">${esc(MAILFULL.get(m.id))}</p>`;
  return `${m.preview ? `<p>${esc(m.preview)}</p>` : ""}<div><button type="button" class="btn sm" data-mailfull="${esc(m.id)}">Lire en entier</button></div>`;
}
document.addEventListener("click", async ev => {
  const b = ev.target.closest?.("[data-mailfull]"); if (!b) return;
  ev.preventDefault(); ev.stopPropagation();
  const id = b.dataset.mailfull, row = b.closest(".mail-row");
  b.disabled = true; b.textContent = "Lecture…";
  try {
    const r = await api("email_body", {params: {id}});
    MAILFULL.set(id, r.body || "(message sans texte)");
    row.querySelector("p")?.remove();
    const p = document.createElement("p"); p.className = "full"; p.textContent = MAILFULL.get(id);
    b.parentElement.replaceWith(p);
  } catch (err) { b.disabled = false; b.textContent = "Lire en entier"; failToast(err); }
});
function mailsSection() {
  const xs = S.panelMails || []; if (!xs.length) return "";
  return `<section class="sec"><h3>E-mails <span class="num">${xs.length}</span></h3><div class="rows">${xs.map(m => `<div class="mail-row">
    <div class="mh"><span class="chip ${m.direction === "out" ? "ok" : "today"}">${m.direction === "out" ? "Envoyé" : "Reçu"}</span><b>${esc(m.subject || "(sans objet)")}</b><span class="when">${esc(frDay(m.sent_at))}</span></div>
    <small>${esc(m.direction === "out" ? "À " + (m.to_addrs || "") : "De " + (m.from_addr || ""))}${m.person_name ? " · " + esc(m.person_name) : ""}</small>
    ${m.opens === null || m.opens === undefined ? "" : m.opens > 0 ? `<small><span class="chip ok">Ouvert</span> la première fois le ${esc(new Date(m.first_open).toLocaleString("fr-FR", {day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"}))}${m.opens > 1 ? `, ${m.opens} fois en tout` : ""}</small>` : `<small><span class="chip">Pas encore ouvert</span></small>`}
    ${mailBodyHtml(m)}
    ${/^https:\/\//.test(m.web_link || "") ? `<a href="${esc(m.web_link)}" target="_blank" rel="noopener">Ouvrir dans Outlook</a>` : ""}</div>`).join("")}</div></section>`;
}

/* Base Airtable « Cadrage clients ScanUp », table Clients : ouverte quand l'affaire n'a pas encore de lien. */
const CADRAGE_BASE_URL = "https://airtable.com/appEsqSLTQkhlHchr/tblifqlCs6FPmfz19";
/* Formulaires Airtable : questionnaire de visio (interne, espaces de Maxime et de Laure) et demande de devis (envoyée au client). */
const VISIO_FORM_MAXIME = "https://airtable.com/appEsqSLTQkhlHchr/pagoVPXaE0YkTvFaZ";
const VISIO_FORM_LAURE = "https://airtable.com/appEsqSLTQkhlHchr/pagamtl2RK2DhXtly";
const DEVIS_FORM_URL = "https://airtable.com/appEsqSLTQkhlHchr/pagw1YuiFE9swas0p/form";
function fieldsSec() {
  const kinds = [["deal", "Affaires"], ["org", "Organisations"], ["person", "Personnes"]].filter(([k]) => (S.fields[k] || []).length);
  if (!kinds.length) return "";
  return `<section class="sec"><h3>Champs des fiches</h3>
    <p class="note">Décochez un champ pour le masquer dans les fiches. Rien n'est supprimé : les valeurs déjà saisies sont conservées et réapparaissent si vous recochez la case.</p>
    ${kinds.map(([k, label]) => `<div class="sec" style="background:var(--surface-2)"><h3>${label}</h3>
      <div class="grid2">${S.fields[k].map(f => `<label><input type="checkbox" data-fshow="${esc(k)}:${esc(f.key)}" ${f.hidden ? "" : "checked"}> ${esc(f.label)}</label>`).join("")}</div></div>`).join("")}
  </section>`;
}
async function saveHiddenFields() {
  const hidden = [...document.querySelectorAll("[data-fshow]")].filter(c => !c.checked).map(c => c.dataset.fshow);
  try { await api("fields", {method: "POST", body: {hidden}}); await loadBoot(); toast("Champs mis à jour"); }
  catch (e) { failToast(e); await loadBoot(); render(); }
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
    if (a === "importTags") return runTagsImport();
    if (a === "changePw") return changePw();
    if (a === "claudeRevoke") return claudeRevoke(t.dataset.cid, t.dataset.uid);
    if (a === "claudeCopy") { const v = $("#claudeUrl").value; navigator.clipboard?.writeText(v).then(() => toast("Adresse copiée"), () => { $("#claudeUrl").select(); }); return; }
    if (a === "mcKeySave") { const k = $("#mcKey").value.trim(); if (!k) return toast("Collez d'abord la clé d'API Mailchimp.", true); return mcPost({key: k}, "Clé Mailchimp enregistrée"); }
    if (a === "mcAdd") { const mc = $("#mcTag").value, crm = $("#mcCrm").value.trim(); if (!mc || !crm) return toast("Choisissez un tag Mailchimp et indiquez le tag du CRM.", true);
      return mcPost({follow: [...(S.mc.follow || []).filter(f => f.mc !== mc), {mc, crm}]}, "Tag suivi"); }
    if (a === "mcSync") return mcSync();
    if (a === "bakRun") return bakRun();
    if (a === "mcPushCount") return mcPush(false);
    if (a === "mcPushGo") return mcPush(true);
    if (a === "calTokSave") { const k = $("#calTok").value.trim(); if (!k) return toast("Collez d'abord la clé d'accès Calendly.", true); return calPost({token: k}, "Clé Calendly enregistrée"); }
    if (a === "calNamesSave") return calPost({names: [...document.querySelectorAll("#calNames input:checked")].map(i => i.value)}, "Types de rendez-vous enregistrés");
    if (a === "calSync") return calSync();
    if (a === "hookCopy") return navigator.clipboard.writeText($("#hookKey").value).then(() => toast("Clé copiée"), () => toast("Copie impossible : sélectionnez la clé à la main.", true));
    if (a === "hookNew") return api("hook_conf", {method: "POST"}).then(r => { S.hook = r; $("#hookSec").innerHTML = hookSecInner(); toast("Clé créée"); }, failToast);
    if (t.dataset.mcdel !== undefined) return mcPost({follow: (S.mc.follow || []).filter((_, i) => i !== +t.dataset.mcdel)}, "Tag retiré du suivi");
    if (a === "billSave") return billSave();
    if (a === "billTest") return billTest();
    if (a === "mailSave") return mailSave();
    if (a === "mailSigSave") return api("mail_sig", {method: "POST", body: {signature: $("#mailSig").value}}).then(r => { S.mailSig = r.signature || ""; toast("Signature enregistrée"); }, failToast);
    if (a === "mailSync") return mailSync(false);
    if (a === "mailSyncFull") return mailSync(true);
    if (a === "mailDisconnect") return mailDisconnect();
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
      if (seg.id === "scopeSeg") { S.contactScope = t.dataset.k; ls.set("crm.contactScope", t.dataset.k); }
      render();
    }
  };
  m.onkeydown = e => { if (e.key !== "Enter" && e.key !== " ") return; const t = e.target; if (t.matches && t.matches("[data-deal],[data-actid],[data-open]")) { e.preventDefault(); t.click(); } };
  m.onchange = e => {
    const t = e.target;
    if (t.id === "pipeSel") { S.pipelineId = t.value; ls.set("crm.pipe", t.value); render(); }
    if (t.id === "dealTag") { S.dealTag = t.value; render(); }
    if (t.id === "contactTag") { S.contactTag = t.value; loadContacts(); }
    if (t.id === "mcList") mcPost({list: t.value}, "Audience enregistrée");
    if (t.id === "dealOwner") { S.dealOwner = t.value; ls.set("crm.dealOwner", t.value); render(); }
    if (t.id === "actOwner") { S.actOwner = t.value; ls.set("crm.actOwner", t.value); render(); }
    if (t.id === "actType") { S.actType = t.value; render(); }
    if (t.dataset.fshow) saveHiddenFields();
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

/* « Où en est-on ? » : rappel des derniers échanges, affiché en haut d'une activité existante.
   Tout vient des fiches déjà en base (e-mails rattachés, activités, étape de l'affaire) : rien à saisir. */
async function actContext(a) {
  const key = a.org_id ? "org_id" : a.deal_id ? "deal_id" : a.person_id ? "person_id" : null;
  if (!key) return "";
  const [mails, acts] = await Promise.all([api("emails", {params: {[key]: a[key]}}).catch(() => []), api("activities", {params: {[key]: a[key]}}).catch(() => [])]);
  const since = String(a.add_time || "").replace(" ", "T").slice(0, 19);
  const day = s => String(s || "").slice(0, 10);
  const newer = mails.filter(x => since && String(x.sent_at).slice(0, 19) > since);
  const received = newer.filter(x => x.direction !== "out").length;
  const done = acts.filter(x => x.done && x.id !== a.id).sort((x, y) => String(y.done_time || y.due_date || "").localeCompare(String(x.done_time || x.due_date || "")));
  const todo = acts.filter(x => !x.done && x.id !== a.id);
  const d = a.deal_id ? S.deals.get(a.deal_id) : null;
  const st = d ? (pipeline(d.pipeline_id)?.stages || []).find(s => s.id === d.stage_id) : null;
  let h = "";
  if (newer.length) h += `<div class="banner" style="margin:0 0 8px">Depuis la création de cette activité : ${newer.length} e-mail${newer.length > 1 ? "s" : ""} échangé${newer.length > 1 ? "s" : ""}, dont ${received} reçu${received > 1 ? "s" : ""}. Vérifiez qu'elle est toujours d'actualité.</div>`;
  if (d) h += `<p style="margin:0 0 6px"><b>Affaire :</b> ${esc(d.title)}${st ? ", étape « " + esc(st.name) + " »" : ""}</p>`;
  if (done[0]) h += `<p style="margin:0 0 6px"><b>Dernière action faite</b> (${esc(frDay(done[0].done_time || done[0].due_date))}) : ${esc(done[0].subject || "")}${done[0].note ? "<br><small>" + esc(String(done[0].note).replace(/<[^>]+>/g, " ").slice(0, 400)) + "</small>" : ""}</p>`;
  if (mails.length) h += `<p style="margin:0 0 2px"><b>Derniers e-mails</b></p><div class="rows">${mails.slice(0, 4).map(x => `<div class="mail-row">
    <div class="mh"><span class="chip ${x.direction === "out" ? "ok" : "today"}">${x.direction === "out" ? "Envoyé" : "Reçu"}</span><b>${esc(x.subject || "(sans objet)")}</b><span class="when">${esc(frDay(x.sent_at))}</span></div>
    ${mailBodyHtml(x)}</div>`).join("")}</div>`;
  else h += `<p style="margin:0 0 6px"><small>Aucun e-mail rattaché à cette fiche.</small></p>`;
  if (todo.length) h += `<p style="margin:8px 0 0"><b>Autres activités à faire :</b> ${todo.slice(0, 4).map(x => esc(x.subject || "") + " (" + esc(frDay(x.due_date)) + ")").join(" ; ")}</p>`;
  // Parcours ScanUp de l'affaire de l'activité, ou à défaut de l'affaire en cours de son organisation.
  const sd = d || (a.org_id ? [...S.deals.values()].find(x => x.org_id === a.org_id && x.status === "open" && suApplies(x)) : null);
  return scanupBlock(sd, acts) + (h ? `<section class="sec" style="margin:0 0 12px"><h3>Où en est-on ?</h3><div style="font-size:13px">${h}</div></section>` : "");
}

function openAct(a, preset = {}) {
  const isNew = !a;
  const d0 = preset.deal_id ? S.deals.get(preset.deal_id) : null;
  const m = a ? {...a} : {type: "call", subject: "", due_date: today(), due_time: "", duration: "", owner_id: S.me.id, done: false, note: "",
    deal_id: preset.deal_id || null, deal_title: d0?.title || null, org_id: preset.org_id || d0?.org_id || null, org_name: preset.org_name || d0?.org_name || null,
    person_id: preset.person_id || d0?.person_id || null, person_name: preset.person_name || d0?.person_name || null,
    contact_id: d0?.contact_id || null, contact_name: d0?.contact_name || null, contact_emails: d0?.contact_emails || [], contact_phones: d0?.contact_phones || []};
  if (isNew && preset.person_id && preset.person_id !== m.contact_id) { m.contact_id = null; m.contact_emails = []; m.contact_phones = [];
    api("get", {params: {e: "persons", id: preset.person_id}}).then(p => { if (S.modal !== m) return; m.contact_id = p.id; m.contact_name = p.name; m.contact_emails = p.emails || []; m.contact_phones = p.phones || []; const b = $("#actCt"); if (b) b.innerHTML = contactBlock(m); }).catch(() => {}); }
  S.modal = m;
  histPush();
  let ctxHtml = "";
  if (!isNew) actContext(a).then(h => { ctxHtml = h; const box = $("#actCtx"); if (box && S.modal === m) box.innerHTML = h; }).catch(() => {});
  const draw = () => {
    $("#layer").innerHTML = `<div class="scrim" data-close></div><div class="modal" data-close><form class="mbox" id="actForm" role="dialog" aria-modal="true" aria-label="Activité">
      <div class="mh"><h2>${isNew ? "Planifier une activité" : "Activité"}</h2><button type="button" class="btn ghost sm" data-x aria-label="Fermer">${ico("x")}</button></div>
      <div class="mb">${preset._hint ? `<div class="banner" style="margin:0">${esc(preset._hint)}</div>` : ""}
        <div id="actCtx">${ctxHtml}</div>
        <div class="types" id="types">${TYPES.map(([k, l]) => `<button type="button" data-type="${k}" aria-pressed="${m.type === k}">${ico(k)}${l}</button>`).join("")}</div>
        <label class="f"><span>Objet</span><input type="text" id="aSubj" value="${esc(m.subject)}" placeholder="${esc(typeLabel(m.type))}"></label>
        <div class="grid2"><label class="f"><span>Date</span><input type="date" id="aDate" value="${esc(m.due_date || "")}"></label>
          <label class="f"><span>Heure</span><input type="time" id="aTime" value="${esc(m.due_time || "")}"></label>
          <label class="f"><span>Durée (min)</span><input type="number" id="aDur" min="0" step="5" value="${esc(m.duration || "")}"></label>
          <label class="f"><span>Responsable</span><select id="aOwner">${team().map(u => `<option value="${esc(u.id)}" ${u.id === m.owner_id ? "selected" : ""}>${esc(u.name)}</option>`).join("")}</select></label></div>
        ${pickerHtml("deal", "deal", {id: m.deal_id, name: m.deal_title}, "Affaire")}
        <div class="grid2">${pickerHtml("person", "person", {id: m.person_id, name: m.person_name}, "Personne")}${pickerHtml("org", "org", {id: m.org_id, name: m.org_name}, "Organisation")}</div>
        <div id="actCt">${contactBlock(m)}</div>
        <label class="f"><span>Note</span><textarea id="aNote" rows="4">${esc(m.note || "")}</textarea></label>
        <label style="display:flex;gap:8px;align-items:center;font-weight:600"><input type="checkbox" id="aDone" ${m.done ? "checked" : ""}> Faite</label>
      </div>
      <div class="mf">${isNew ? "" : `<button type="button" class="btn ghost" data-del style="margin-right:auto;color:var(--bad)">Supprimer</button>`}
        <button type="button" class="btn" data-x>Annuler</button><button type="submit" class="btn primary">Enregistrer</button></div></form></div>`;
    const f = $("#actForm");
    const sync = () => { m.subject = $("#aSubj").value; m.due_date = $("#aDate").value; m.due_time = $("#aTime").value; m.duration = $("#aDur").value; m.owner_id = $("#aOwner").value; m.note = $("#aNote").value; m.done = $("#aDone").checked; };
    $("#types").onclick = e => { const b = e.target.closest("[data-type]"); if (!b) return; sync(); m.type = b.dataset.type; draw(); };
    bindPicker(f, "deal", v => { sync(); m.deal_id = v?.id || null; m.deal_title = v?.name || null;
      if (v?.raw) { if (!m.org_id && v.raw.org_id) { m.org_id = v.raw.org_id; m.org_name = v.raw.org_name; } if (!m.person_id && v.raw.person_id) { m.person_id = v.raw.person_id; m.person_name = v.raw.person_name; }
        if (!m.contact_id && v.raw.contact_id) { m.contact_id = v.raw.contact_id; m.contact_name = v.raw.contact_name; m.contact_emails = v.raw.contact_emails || []; m.contact_phones = v.raw.contact_phones || []; } } draw(); });
    bindPicker(f, "person", v => { sync(); m.person_id = v?.id || null; m.person_name = v?.name || null;
      if (v?.raw) { m.contact_id = v.id; m.contact_name = v.name; m.contact_emails = v.raw.emails || []; m.contact_phones = v.raw.phones || []; }
      else if (!v) { m.contact_id = null; m.contact_emails = []; m.contact_phones = []; } if (v?.raw?.org_id && !m.org_id) { m.org_id = v.raw.org_id; m.org_name = v.raw.org_name; } draw(); });
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
/* Retour arrière du téléphone ou du navigateur : il referme la fiche ou la fenêtre ouverte au lieu de quitter le CRM.
   On ajoute une entrée d'historique à l'ouverture, et on la retire quand tout est refermé à la main. */
let HIST_OPEN = false, HIST_SELF = false;
function histPush() { if (HIST_OPEN) return; try { history.pushState({crm: 1}, ""); HIST_OPEN = true; } catch {} }
function histPop() { if (!HIST_OPEN || S.panel || S.modal) return; HIST_OPEN = false; HIST_SELF = true; try { history.back(); } catch { HIST_SELF = false; } }
window.addEventListener("popstate", () => {
  // Retour déclenché par le CRM lui-même après une fermeture à la main : rien à refermer.
  if (HIST_SELF) { HIST_SELF = false; if (S.panel || S.modal) { HIST_OPEN = false; histPush(); } return; }
  if (!HIST_OPEN) return;
  HIST_OPEN = false; if (S.modal) closeModal(true); if (S.panel) closePanel(true);
});

function closeModal(fromBack) { S.modal = null; $("#layer").innerHTML = ""; afterChange(); if (fromBack !== true) histPop(); }

/* ---------- Panneau : affaire, organisation, personne ---------- */
function closePanel(fromBack) { const had = S.panel; S.panel = null; S.panelActs = []; S.panelEnt = null; const p = $("#panel"); if (p) p.remove(); if (had) { if (S.view === "contacts") loadContacts(); else render(); } if (fromBack !== true) histPop(); }
function openPanelShell() {
  histPush();
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
  const defs = (S.fields[kind] || []).filter(f => !f.hidden); if (!defs.length) return "";
  const ex = doc.extra || {};
  return `<section class="sec"><h3>Informations complémentaires</h3><div class="grid2">${defs.map(f => {
    const v = ex[f.key] ?? "";
    let input;
    if (f.type === "set" && f.options?.length) {
      // Choix multiples : cases à cocher, valeur enregistrée sous la forme « a, b ».
      const cur = String(v).split(",").map(x => x.trim()).filter(Boolean);
      const others = cur.filter(x => !f.options.includes(x));
      return `<div class="f" style="grid-column:1/-1"><span>${esc(f.label)}</span><div class="checks" data-extraset="${esc(f.key)}">${[...f.options, ...others].map(o => `<label><input type="checkbox" value="${esc(o)}" ${cur.includes(o) ? "checked" : ""}> ${esc(o)}</label>`).join("")}</div>
        ${f.key === "crm_ressources_internes" && cur.length ? `<p class="note" style="margin:0"><b>Accès en autonomie probable</b> : ce client a des ressources internes en santé au travail.</p>` : ""}</div>`;
    }
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
  const dr = openPanelShell(); S.panel = {kind: "deal", id}; S.panelActs = []; S.panelMails = []; drawDeal(id, dr); reloadPanelActs(); loadPanelMails();
  if (focusTitle) setTimeout(() => { const t = $("#panel .title"); t?.focus(); t?.select(); }, 40);
}
/* Écrire un e-mail depuis le CRM : il part de la boîte Microsoft de la personne connectée, apparaît dans ses éléments
   envoyés et se rattache aussitôt à la fiche. */
function openMail({to = "", person_id = null, deal_id = null, name = ""} = {}) {
  const m = {kind: "mail"}; S.modal = m; histPush();
  $("#layer").innerHTML = `<div class="scrim" data-close></div><div class="modal" data-close><form class="mbox" id="mailForm" role="dialog" aria-modal="true" aria-label="Écrire un e-mail">
    <div class="mh"><h2>Écrire un e-mail${name ? " à " + esc(name) : ""}</h2><button type="button" class="btn ghost sm" data-x aria-label="Fermer">${ico("x")}</button></div>
    <div class="mb">
      <p class="note" style="margin:0">Le message part de votre boîte Microsoft, comme depuis Outlook, et s'ajoute à l'historique de la fiche. Votre signature, enregistrée dans les Réglages, est ajoutée à la fin.</p>
      <label class="f"><span>Destinataire</span><input type="text" id="mTo" value="${esc(to)}" placeholder="adresse@exemple.fr"></label>
      <label class="f"><span>Objet</span><input type="text" id="mSubj" maxlength="250"></label>
      <label class="f"><span>Message</span><textarea id="mBody" rows="10"></textarea></label>
      <label class="f"><span>Pièces jointes (3 Mo au total)</span><input type="file" id="mFiles" multiple></label>
      <div id="mFilesList" class="note" style="margin:0"></div>
      <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="mTrack" checked> Savoir si le destinataire a ouvert l'e-mail</label>
    </div>
    <div class="mf"><button type="button" class="btn" data-x>Annuler</button><button type="submit" class="btn primary">Envoyer</button></div></form></div>`;
  const f = $("#mailForm");
  $("#layer").onclick = e => { if (e.target.closest("[data-x]")) closeModal(); };
  const MAX_FILES = 3 * 1024 * 1024;
  const sizeOf = () => [...$("#mFiles").files].reduce((n, x) => n + x.size, 0);
  const mo = n => (n / 1048576).toFixed(1).replace(".", ",") + " Mo";
  $("#mFiles").onchange = () => { const fs = [...$("#mFiles").files], n = sizeOf();
    $("#mFilesList").innerHTML = fs.length ? fs.map(x => esc(x.name) + " (" + mo(x.size) + ")").join(" ; ") + (n > MAX_FILES ? ` <b style="color:var(--bad)">Total ${mo(n)} : trop lourd, 3 Mo au maximum.</b>` : "") : ""; };
  const readFile = file => new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok({name: file.name, type: file.type || "application/octet-stream", data: String(r.result).split(",")[1] || ""}); r.onerror = () => ko(new Error("Lecture du fichier impossible : " + file.name)); r.readAsDataURL(file); });
  f.onsubmit = async e => { e.preventDefault();
    const body = {to: $("#mTo").value.trim(), subject: $("#mSubj").value.trim(), body: $("#mBody").value.trim(), person_id, deal_id, track: $("#mTrack").checked};
    if (!body.to) return toast("Indiquez le destinataire.", true);
    if (!body.subject) return toast("Indiquez l'objet.", true);
    if (!body.body) return toast("Le message est vide.", true);
    if (sizeOf() > MAX_FILES) return toast("Les pièces jointes dépassent 3 Mo au total.", true);
    const btn = f.querySelector("[type=submit]"); btn.disabled = true; btn.textContent = "Envoi…";
    try { body.attachments = await Promise.all([...$("#mFiles").files].map(readFile));
      await api("mail_send", {method: "POST", body}); toast("E-mail envoyé"); closeModal(); if (S.panel) loadPanelMails(); }
    catch (err) { btn.disabled = false; btn.textContent = "Envoyer"; failToast(err); }
  };
  setTimeout(() => (to ? $("#mSubj") : $("#mTo"))?.focus(), 30);
}
async function mailToPerson(personId, dealId) {
  try { const p = await api("get", {params: {e: "persons", id: personId}});
    openMail({to: ((p.emails || []).find(x => x.primary) || (p.emails || [])[0] || {}).value || "", person_id: personId, deal_id: dealId || null, name: p.name || ""}); }
  catch (err) { failToast(err); }
}

/* « Où en est-on ? » en haut de la fiche d'une affaire : calculé à chaque ouverture à partir des activités
   et des e-mails déjà chargés pour la fiche, donc toujours à jour, sans rien à saisir. */
function dealSummary(d) {
  const acts = S.panelActs || [], mails = S.panelMails || [];
  const ago = iso => { const n = Math.round((Date.now() - new Date(iso).getTime()) / 864e5); return isNaN(n) ? "" : n <= 0 ? "aujourd'hui" : n === 1 ? "hier" : `il y a ${n} jours`; };
  const done = acts.filter(a => a.done).sort((x, y) => String(y.done_time || y.due_date || "").localeCompare(String(x.done_time || x.due_date || "")));
  const todo = acts.filter(a => !a.done).sort((x, y) => String(x.due_date || "9").localeCompare(String(y.due_date || "9")));
  const last = mails[0], lastIn = mails.find(m => m.direction !== "out"), lastOut = mails.find(m => m.direction === "out");
  const row = (label, html) => `<p style="margin:0 0 6px"><b>${label} :</b> ${html}</p>`;
  let h = "";
  if (last) h += row("Dernier échange", `${esc(ago(last.sent_at))}, e-mail ${last.direction === "out" ? "envoyé" : "reçu"}${last.person_name ? " (" + esc(last.person_name) + ")" : ""} : ${esc(last.subject || "(sans objet)")}`);
  else h += row("Dernier échange", `<small>aucun e-mail rattaché sur les 60 derniers jours</small>`);
  if (lastIn && (!lastOut || String(lastIn.sent_at) > String(lastOut.sent_at)) && d.status === "open")
    h += `<div class="banner" style="margin:0 0 8px">Le client a écrit en dernier (${esc(ago(lastIn.sent_at))}) : une réponse est peut-être attendue.</div>`;
  if (done[0]) h += row("Dernière action faite", `${esc(done[0].subject || "")} (${esc(frDay(done[0].done_time || done[0].due_date))})${done[0].note ? "<br><small>" + esc(String(done[0].note).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 350)) + "</small>" : ""}`);
  if (todo[0]) { const late = todo[0].due_date && todo[0].due_date < today();
    h += row("Prochaine action", `${esc(todo[0].subject || "")} (${esc(todo[0].due_date ? frDay(todo[0].due_date) : "sans date")})${late ? ` <span style="color:var(--bad);font-weight:600">en retard</span>` : ""}${todo.length > 1 ? ` <small>et ${todo.length - 1} autre${todo.length > 2 ? "s" : ""}</small>` : ""}`); }
  else if (d.status === "open") h += `<div class="banner" style="margin:0 0 8px">Aucune activité prévue pour cette affaire.</div>`;
  if (mails.length) h += `<p style="margin:0"><small>${mails.length} e-mail${mails.length > 1 ? "s" : ""} rattaché${mails.length > 1 ? "s" : ""}, détail plus bas.</small></p>`;
  return `<section class="sec"><h3>Où en est-on ?</h3><div style="font-size:13px">${h}</div></section>`;
}

/* « Parcours ScanUp » : ce que le client a déjà fait (démo, test salarié, test cabinet, test responsable de projet).
   Une étape se coche toute seule quand l'historique le montre (visio faite, trace « ScanUp essai » envoyée par ScanUp),
   sinon d'un clic. Les étapes cochées à la main sont gardées sur l'affaire. Affiché pour les affaires ScanUp seulement. */
/* Deux parcours selon le pipeline.
   Clients finaux : le prospect est inscrit comme opérateur sur un module de l'espace démo, puis on lui crée un client test
   dans le cabinet 360skillvue avec ses modules, on inscrit ses opérateurs et on lui envoie les vignettes par e-mail.
   Distributeurs : même parcours, mais le client test est créé dans un cabinet test à son nom (marque blanche), puis on lui
   ouvre peu à peu l'accès responsable de projet et l'accès administrateur du cabinet (les comptes sont d'abord à l'alias de Laure). */
const SU_FINAL = [["su_demo_op", "Démo opérateur (espace démo)"], ["su_demo", "Visio"], ["su_client", "Client test et modules créés"], ["su_ops", "Opérateurs inscrits"], ["su_vignettes", "Vignettes envoyées"]];
const SU_STEPS = [["su_demo_op", "Démo opérateur (espace démo)"], ["su_demo", "Visio"], ["su_cabinet", "Cabinet test créé (marque blanche)"], ["su_client", "Client test et modules créés"], ["su_ops", "Opérateurs inscrits"], ["su_vignettes", "Vignettes envoyées"], ["su_rp", "Accès responsable de projet donné"], ["su_admin", "Accès administrateur donné"]];
const SU_ACTS = new Map();
const suPipe = d => pipeline(d.pipeline_id)?.name || "";
const suApplies = d => !!d && /clients? finaux|distributeur/i.test(suPipe(d));
function scanupBlock(d, acts) {
  if (!suApplies(d)) return "";
  acts = acts || []; SU_ACTS.set(d.id, acts);
  const final = /clients? finaux/i.test(suPipe(d));
  const steps = final ? SU_FINAL : SU_STEPS;
  // Date de la première activité qui prouve l'étape.
  const first = f => acts.filter(f).map(a => String(a.done_time || a.due_date || "").slice(0, 10)).filter(Boolean).sort()[0] || "";
  // Étape du pipeline : seule l'étape en cours prouve quelque chose, et seulement ce qu'elle nomme.
  const stages = pipeline(d.pipeline_id)?.stages || [], si = stages.findIndex(s => s.id === d.stage_id);
  const cur = re => si >= 0 && re.test(stages[si].name || "");
  const visio = first(a => a.done && a.type !== "note" && (a.type === "meeting" || /visio/i.test(a.subject || ""))) || (cur(/visio/i) ? "étape" : "");
  const essai = first(a => /^ScanUp essai/i.test(a.subject || ""));
  const auto = {
    su_demo_op: first(a => a.done && a.type !== "note" && /d[ée]mo.*op[ée]rateur|espace d[ée]mo/i.test(a.subject || "")) || (cur(/d[ée]mo.*op[ée]rateur/i) ? "étape" : ""),
    su_demo: visio,
    // Rien n'est déduit de l'avancement dans le pipeline : une affaire peut être en négociation sans avoir fait d'essai.
    su_client: first(a => /^ScanUp cabinet : client/i.test(a.subject || "")),
    su_ops: essai,
    su_vignettes: first(a => a.done && /vignette/i.test(a.subject || "")),
    // Distributeurs seulement : cabinet en marque blanche, puis accès ouverts peu à peu (l'accès administrateur se coche à la main).
    su_cabinet: first(a => /^ScanUp cabinet : cabinet/i.test(a.subject || "")) || (cur(/cabinet/i) ? "étape" : ""),
    su_rp: first(a => /^ScanUp responsable de projet/i.test(a.subject || "")) || (cur(/essai.*responsable/i) ? "étape" : ""),
  };
  const ex = d.extra || {};
  const items = steps.map(([k, label]) => {
    const man = ex[k] || "", au = auto[k] || "", on = !!(man || au), locked = !man && !!au;
    const when = man ? esc(frDay(man)) : au === "étape" ? "d'après l'étape" : au ? esc(frDay(au)) + " · auto" : "pas encore";
    return `<button type="button" class="su-step${on ? " on" : ""}" data-su="${k}" data-sudeal="${esc(d.id)}" data-suman="${man ? 1 : 0}" ${locked ? "disabled" : ""} title="${locked ? "Repéré automatiquement" : man ? "Cliquer pour décocher" : "Cliquer pour cocher"}"><span>${on ? "✓ " : ""}${label}</span><small>${when}</small></button>`;
  }).join("");
  const next = steps.find(([k]) => !(ex[k] || auto[k]));
  const canCreate = !(ex.su_client || auto.su_client);
  return `<section class="sec" style="margin:0 0 12px"><h3>Parcours ScanUp</h3><div class="su-steps">${items}</div>${next ? `<p style="margin:6px 0 0;font-size:12px"><small>Prochaine étape à proposer : ${esc(next[1].toLowerCase())}.</small></p>` : ""}${canCreate ? `<div style="margin-top:8px"><button type="button" class="btn sm" data-sutrial="${esc(d.id)}">Créer le client test dans ScanUp</button></div>` : ""}</section>`;
}
/* Création du client test dans ScanUp : organisation « … (test) », responsable de projet à l'alias Gmail de la personne
   connectée (jamais remis au client) et opérateurs sans e-mail. Passe par Make, qui détient l'accès au cabinet. */
function openTrial(d) {
  const m = {kind: "trial"}; S.modal = m; histPush();
  const final = /clients? finaux/i.test(suPipe(d));
  const base = (d.org_name || d.title || "client").replace(/\s*\(.*$/, "").trim();
  const slug = norm(base).replace(/[^a-z0-9]/g, "").slice(0, 12) || "client";
  const who = /maxime/i.test(S.me?.email || "") ? "maximebailloud" : "lauredellamonica";
  $("#layer").innerHTML = `<div class="scrim" data-close></div><div class="modal" data-close><form class="mbox" id="trialForm" role="dialog" aria-modal="true" aria-label="Créer le client test dans ScanUp">
    <div class="mh"><h2>Créer le client test dans ScanUp</h2><button type="button" class="btn ghost sm" data-x aria-label="Fermer">${ico("x")}</button></div>
    <div class="mb">
      <p class="note" style="margin:0">Crée dans ScanUp l'organisation cliente, son responsable de projet (votre alias, jamais remis au client) et les opérateurs sans e-mail. Les modules, la session, les crédits et les vignettes restent à faire ensuite.</p>
      <label class="f"><span>Nom du client test (doit contenir « test »)</span><input type="text" id="tName" maxlength="120" value="${esc(base + " (test)")}"></label>
      <div class="grid2">
        <label class="f"><span>N° du cabinet ScanUp</span><input type="number" id="tCab" min="1" value="${final ? 10 : ""}" placeholder="${final ? "" : "cabinet test du distributeur"}"></label>
        <label class="f"><span>Nombre de testeurs</span><input type="number" id="tN" min="1" max="20" value="5"></label>
      </div>
      <label class="f"><span>Identifiant des opérateurs (suivi de 1, 2, 3…)</span><input type="text" id="tPrefix" maxlength="20" value="${esc(slug)}"></label>
      <label class="f"><span>Responsable de projet (alias Gmail)</span><input type="text" id="tRp" value="${esc(who + "+" + slug + "rp@gmail.com")}"></label>
      ${final ? "" : `<p class="note" style="margin:0">Distributeur : le cabinet test doit déjà exister dans ScanUp et figurer dans la table Make des cabinets en essai, avec son compte administrateur.</p>`}
      <div id="tOut" class="note" style="margin:0"></div>
    </div>
    <div class="mf"><button type="button" class="btn" data-x>Fermer</button><button type="submit" class="btn primary">Créer dans ScanUp</button></div></form></div>`;
  $("#layer").onclick = e => { if (e.target.closest("[data-x]")) closeModal(); };
  const f = $("#trialForm");
  f.onsubmit = async e => { e.preventDefault();
    const body = {deal_id: d.id, name: $("#tName").value.trim(), cabinet: Number($("#tCab").value), n: Number($("#tN").value), prefix: $("#tPrefix").value.trim().toLowerCase(), rp_email: $("#tRp").value.trim().toLowerCase()};
    if (!/test/i.test(body.name)) return toast("Le nom doit contenir « test ».", true);
    if (!body.cabinet) return toast("Indiquez le numéro du cabinet.", true);
    const btn = f.querySelector("[type=submit]"); btn.disabled = true; btn.textContent = "Création en cours…";
    $("#tOut").textContent = "Création dans ScanUp : cela prend quelques secondes par compte.";
    try {
      const r = await api("scanup_trial", {method: "POST", body});
      $("#tOut").innerHTML = (r.done || []).map(x => "✓ " + esc(x)).join("<br>") + (r.error ? `<br><b style="color:var(--bad)">${esc(r.error)}</b>` : "<br>Une tâche « préparer les modules et envoyer les vignettes » a été créée.");
      btn.textContent = r.ok ? "Créé" : "Arrêté";
      toast(r.ok ? "Client test créé dans ScanUp" : "Création incomplète", !r.ok);
      try { await loadData(); } catch {}
      if (S.panel) refreshPanel();
    } catch (err) { btn.disabled = false; btn.textContent = "Créer dans ScanUp"; $("#tOut").textContent = ""; failToast(err); }
  };
}
document.addEventListener("click", async ev => {
  const t = ev.target.closest?.("[data-sutrial]");
  if (t) { ev.preventDefault(); const d = S.deals.get(t.dataset.sutrial); if (d) openTrial(d); return; }
  const b = ev.target.closest?.("[data-su]"); if (!b || b.disabled) return;
  ev.preventDefault();
  const id = b.dataset.sudeal, k = b.dataset.su;
  try {
    const row = await updateE("deals", id, {extra: {[k]: b.dataset.suman === "1" ? "" : today()}});
    S.deals.set(row.id, row); toast("Enregistré");
    const tmp = document.createElement("div"); tmp.innerHTML = scanupBlock(row, SU_ACTS.get(id) || []);
    if (tmp.firstElementChild) b.closest("section")?.replaceWith(tmp.firstElementChild);
  } catch (err) { failToast(err); }
});

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
      ${dealSummary(d)}
      ${d.contact_id ? `<section class="sec"><h3>Coordonnées</h3>${contactBlock(d, {dealId: d.id})}</section>` : ""}
      ${scanupBlock(d, S.panelActs || [])}
      <section class="sec"><h3>Affaire</h3><div class="grid2">
        <label class="f"><span>Valeur (€)</span><input type="number" id="dValue" min="0" step="100" value="${esc(d.value || 0)}"></label>
        <label class="f"><span>Clôture prévue</span><input type="date" id="dClose" value="${esc(d.expected_close_date || "")}"></label>
        <label class="f"><span>Pipeline</span><select id="dPipe">${S.pipelines.map(x => `<option value="${esc(x.id)}" ${x.id === d.pipeline_id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label>
        <label class="f"><span>Étape</span><select id="dStage">${p.stages.map(s => `<option value="${esc(s.id)}" ${s.id === d.stage_id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select></label>
        <label class="f"><span>Responsable</span><select id="dOwner"><option value=""></option>${team().map(u => `<option value="${esc(u.id)}" ${u.id === d.owner_id ? "selected" : ""}>${esc(u.name)}</option>`).join("")}</select></label>
        <div class="f"><span>Créée le</span><span style="padding:7px 0;color:var(--fg);font-weight:500">${esc(d.add_time ? new Date(d.add_time).toLocaleDateString("fr-FR") : "")}</span></div></div>
        <div class="grid2">${pickerHtml("org", "org", {id: d.org_id, name: d.org_name}, "Organisation")}${pickerHtml("person", "person", {id: d.person_id, name: d.person_name}, "Personne")}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${d.org_id ? `<button class="btn sm" data-goorg>Voir l'organisation</button>` : ""}${d.person_id ? `<button class="btn sm" data-goperson>Voir la personne</button><button class="btn sm primary" data-mailto>Écrire un e-mail</button>` : ""}</div>
        ${tagField("dTags", (S.dealTags || {})[id])}
        <label class="f"><span>Fiche de cadrage (lien Airtable)</span><input type="url" id="dCadrage" placeholder="Collez ici le lien de la fiche Airtable du client" value="${esc((S.cadrage || {})[id] || "")}"></label>
        <div class="f"><span>Devis et cadrage</span><div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn sm" data-visio title="À remplir pendant ou juste après la visio">Questionnaire de visio</button>
          <button class="btn sm" data-formdevis title="Prépare l'e-mail au client avec le lien du formulaire">Envoyer le formulaire de devis</button>
          <button class="btn sm" data-cadrage>${(S.cadrage || {})[id] ? "Ouvrir la fiche de cadrage" : "Ouvrir la base de cadrage"}</button></div></div></section>
      <section class="sec"><h3>Notes</h3><textarea id="dNotes" rows="5" placeholder="Contexte, besoins, prochaines étapes…">${esc(d.notes || "")}</textarea></section>
      ${actsSection()}
      ${mailsSection()}
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
  dr.querySelector("[data-mailto]")?.addEventListener("click", () => mailToPerson(d.person_id, id));
  $("#dTags", dr).onchange = async e => { try { await saveTags("deal", id, e.target.value); render(); } catch (err) { failToast(err); } };
  $("#dCadrage", dr).onchange = async e => {
    try { const r = await api("cadrage", {method: "POST", body: {deal_id: id, url: e.target.value.trim()}}); S.cadrage = S.cadrage || {}; if (r.url) S.cadrage[id] = r.url; else delete S.cadrage[id]; toast("Enregistré"); drawDeal(id); }
    catch (err) { failToast(err); }
  };
  dr.querySelector("[data-cadrage]").addEventListener("click", () => window.open((S.cadrage || {})[id] || CADRAGE_BASE_URL, "_blank", "noopener"));
  dr.querySelector("[data-visio]").addEventListener("click", () => {
    // Entreprises : espace de Maxime ; distributeurs (mutuelles, cabinets, services de santé au travail) : espace de Laure.
    const base = /distribut/i.test(p.name || "") ? VISIO_FORM_LAURE : VISIO_FORM_MAXIME;
    window.open(base + (d.org_name ? "?prefill_Client=" + encodeURIComponent(d.org_name) : ""), "_blank", "noopener");
  });
  dr.querySelector("[data-formdevis]").addEventListener("click", async () => {
    const link = DEVIS_FORM_URL + (d.org_name ? "?prefill_Entreprise=" + encodeURIComponent(d.org_name) : "");
    let to = "";
    if (d.person_id) { try { const pe = await api("get", {params: {e: "persons", id: d.person_id}}); to = ((pe.emails || [])[0] || {}).value || ""; } catch {} }
    try { await navigator.clipboard.writeText(link); toast("Lien du formulaire copié"); } catch {}
    const subject = "ScanUp : quelques questions pour établir votre devis";
    const body = "Bonjour,\n\nPour vous établir un devis précis, pouvez-vous remplir ce court formulaire ? Comptez cinq minutes.\n\n" + link + "\n\nBien cordialement,";
    window.location.href = "mailto:" + encodeURIComponent(to) + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  });
  bindPicker(dr, "org", v => up({org_id: v?.id || null}, true));
  bindPicker(dr, "person", v => { const patch = {person_id: v?.id || null}; if (v?.raw?.org_id && !d.org_id) patch.org_id = v.raw.org_id; up(patch, true); });
  bindActsSection(dr, {deal_id: id});
  dr.querySelectorAll("[data-extra]").forEach(el => el.addEventListener("change", () => up({extra: {[el.dataset.extra]: el.value}})));
  dr.querySelectorAll("[data-extraset]").forEach(box => box.addEventListener("change", () => up({extra: {[box.dataset.extraset]: [...box.querySelectorAll("input:checked")].map(c => c.value).join(", ")}}, true)));
  const del = dr.querySelector("[data-ddel]");
  del.onclick = async () => { if (!del.dataset.confirm) { del.dataset.confirm = 1; del.textContent = "Confirmer : supprimer l'affaire et garder ses activités"; return; }
    try { await deleteE("deals", id); S.deals.delete(id); toast("Affaire supprimée"); closePanel(); } catch (e) { failToast(e); } };
}

async function newEntity(kind) {
  const v = await quickCreate(kind, kind === "org" ? "Nouvelle organisation" : "Nouvelle personne");
  if (v) openEntity(kind, v.id, true);
}
async function openEntity(kind, id, focusTitle) {
  const dr = openPanelShell(); S.panel = {kind, id}; S.panelEnt = null; S.panelActs = []; S.panelMails = []; S.panelTags = [];
  dr.innerHTML = `<div class="db"><p class="note">Chargement…</p></div>`;
  try {
    const [ent, acts] = await Promise.all([api("get", {params: {e: kind === "org" ? "orgs" : "persons", id}}), api("activities", {params: {[kind + "_id"]: id}})]);
    if (!S.panel || S.panel.id !== id) return;
    S.panelEnt = ent; S.panelActs = acts;
    try { S.panelTags = (await api("tags", {params: {e: kind, id}})).tags || []; } catch { S.panelTags = []; }
    drawEntity(kind, id); loadPanelMails();
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
    <div class="stage-label">${kind === "org" ? "Organisation" : "Personne"}${kind === "person" && e.org_name ? ` · <b>${esc(e.org_name)}</b>` : ""}</div>
      ${kind === "person" && (e.emails || []).length ? `<div style="margin-top:10px"><button class="btn sm primary" data-mailto>Écrire un e-mail</button></div>` : ""}</div>
    <div class="db">
      <section class="sec"><h3>Coordonnées</h3><div class="grid2">
      ${kind === "org" ? `<label class="f"><span>Adresse</span><input type="text" id="eAddr" value="${esc(e.address || "")}"></label><label class="f"><span>Site web</span><input type="text" id="eWeb" value="${esc(e.website || "")}"></label>`
        : `<label class="f"><span>E-mails (un par ligne)</span><textarea id="eMails" rows="2">${esc(lines(e.emails))}</textarea></label><label class="f"><span>Téléphones (un par ligne)</span><textarea id="ePhones" rows="2">${esc(lines(e.phones))}</textarea></label>`}
        <label class="f"><span>Responsable</span><select id="eOwner"><option value=""></option>${team().map(u => `<option value="${esc(u.id)}" ${u.id === e.owner_id ? "selected" : ""}>${esc(u.name)}</option>`).join("")}</select></label></div>
        ${tagField("eTags", S.panelTags)}
        ${kind === "person" ? pickerHtml("org", "org", {id: e.org_id, name: e.org_name}, "Organisation") + (e.org_id ? `<div><button class="btn sm" data-goorg>Voir l'organisation</button></div>` : "") : ""}
        ${kind === "person" && (e.phones || []).length ? `<p class="note">Appeler : ${e.phones.map(x => `<a href="tel:${esc(String(x.value).replace(/[^+\d]/g, ""))}">${esc(x.value)}</a>`).join(", ")}</p>` : ""}</section>
      ${kind === "org" ? `<section class="sec"><h3>Personnes <button class="btn sm" data-newperson>${ico("plus")}Personne</button></h3>${(e.persons || []).length ? `<div class="rows">${e.persons.map(x => `<div class="r crow" tabindex="0" data-gop="${esc(x.id)}"><span class="main"><b>${esc(x.name)}</b><small>${esc([(x.emails || [])[0]?.value, (x.phones || [])[0]?.value].filter(Boolean).join(" · "))}</small></span><span>${(x.emails || []).length ? `<button class="btn sm" data-mailp="${esc(x.id)}">Écrire</button>` : ""}</span></div>`).join("")}</div>` : `<p class="note">Aucune personne rattachée.</p>`}</section>` : ""}
      <section class="sec"><h3>Affaires <button class="btn sm" data-newdeal>${ico("plus")}Affaire</button></h3>${deals.length ? `<div class="rows">${deals.map(d => `<div class="r crow" tabindex="0" data-god="${esc(d.id)}"><span class="main"><b>${esc(d.title)}</b><small>${esc((stageOf(d.stage_id)?.s.name) || "")}${d.value ? " · " + eur(d.value) : ""}</small></span><span>${d.status === "won" ? `<span class="won-tag">Gagnée</span>` : d.status === "lost" ? `<span class="lost-tag">Perdue</span>` : `<span class="chip ok">En cours</span>`}</span></div>`).join("")}</div>` : `<p class="note">Aucune affaire.</p>`}</section>
      ${actsSection()}
      ${mailsSection()}
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
  $("#eTags", dr).onchange = async ev => { try { await saveTags(kind, id, ev.target.value); } catch (err) { failToast(err); } };
  if ($("#eAddr", dr)) $("#eAddr", dr).onchange = ev => up({address: ev.target.value});
  if ($("#eWeb", dr)) $("#eWeb", dr).onchange = ev => up({website: ev.target.value});
  const toList = v => v.split(/\n+/).map(x => x.trim()).filter(Boolean).map((value, i) => ({value, primary: i === 0}));
  if ($("#eMails", dr)) $("#eMails", dr).onchange = ev => up({emails: toList(ev.target.value)}, true);
  if ($("#ePhones", dr)) $("#ePhones", dr).onchange = ev => up({phones: toList(ev.target.value)}, true);
  $("#eOwner", dr).onchange = ev => up({owner_id: ev.target.value || null});
  $("#eNotes", dr).onchange = ev => up({notes: ev.target.value});
  bindPicker(dr, "org", v => up({org_id: v?.id || null}, true));
  dr.querySelector("[data-goorg]")?.addEventListener("click", () => openEntity("org", e.org_id));
  dr.querySelector("[data-mailto]")?.addEventListener("click", () => mailToPerson(id, null));
  dr.querySelectorAll("[data-mailp]").forEach(b => b.onclick = ev => { ev.stopPropagation(); mailToPerson(b.dataset.mailp, null); });
  dr.querySelectorAll("[data-gop]").forEach(r => r.onclick = () => openEntity("person", r.dataset.gop));
  dr.querySelectorAll("[data-god]").forEach(r => r.onclick = () => openDeal(r.dataset.god));
  dr.querySelector("[data-newdeal]").onclick = () => newDeal(kind === "org" ? {org_id: id, org_name: e.name} : {person_id: id, person_name: e.name, org_id: e.org_id, org_name: e.org_name});
  dr.querySelector("[data-newperson]")?.addEventListener("click", async () => {
    try { const row = await createE("persons", {name: "Nouvelle personne", first_name: "Nouvelle", last_name: "personne", org_id: id, owner_id: S.me.id}); openEntity("person", row.id, true); } catch (err) { failToast(err); } });
  bindActsSection(dr, kind === "org" ? {org_id: id, org_name: e.name} : {person_id: id, person_name: e.name, org_id: e.org_id, org_name: e.org_name});
  dr.querySelectorAll("[data-extra]").forEach(el => el.addEventListener("change", () => up({extra: {[el.dataset.extra]: el.value}})));
  dr.querySelectorAll("[data-extraset]").forEach(box => box.addEventListener("change", () => up({extra: {[box.dataset.extraset]: [...box.querySelectorAll("input:checked")].map(c => c.value).join(", ")}}, true)));
  const del = dr.querySelector("[data-edel]");
  del.onclick = async () => { if (!del.dataset.confirm) { del.dataset.confirm = 1; del.textContent = "Confirmer la suppression de la fiche"; return; }
    try { await deleteE(colName, id); toast("Fiche supprimée"); const deals = await api("deals"); S.deals = new Map(deals.map(d => [d.id, d])); closePanel(); } catch (err) { failToast(err); } };
}

/* ---------- démarrage et actualisation ---------- */
$("#nav").onclick = e => { const b = e.target.closest("button[data-v]"); if (b) go(b.dataset.v); };
// Premier affichage avant l'arrivée des données : une erreur ici ne doit jamais empêcher le chargement qui suit.
try { render(); } catch (e) { console.error(e); }
(async () => {
  // Si le chargement dure, on dit ce qui est attendu au lieu de laisser « Chargement du CRM… » sans explication.
  const t0 = Date.now();
  const slow = setInterval(() => {
    if (S.ready) return clearInterval(slow);
    const sec = Math.round((Date.now() - t0) / 1000); if (sec < 6) return;
    const what = [...PENDING].map(x => x.split(" ")[0] + " depuis " + Math.round((Date.now() - Number(x.split(" ")[1])) / 1000) + " s").join(", ") || "aucune demande en cours";
    $("#main").innerHTML = `<div class="wrap"><div class="empty"><h3>Le chargement est long (${sec} s)</h3><p>En attente du serveur : ${esc(what)}.</p><p><small>Version ${esc((document.querySelector('script[src*="app.js"]')?.src || "").split("v=")[1] || "")} · ${navigator.onLine ? "connexion internet active" : "pas de connexion internet"}</small></p><button class="btn primary" id="slowReload">Recharger</button></div></div>`;
    $("#slowReload").onclick = () => location.reload();
  }, 2000);
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
