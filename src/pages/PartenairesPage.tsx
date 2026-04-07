import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight, Users, Search, Loader2, AlertCircle,
  Mail, Phone, Globe, MapPin, Maximize2, Minimize2, ChevronDown,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// ─── Types ──────────────────────────────────────────────────────────────────

type CompetenceKey =
  | 'formation' | 'materiel' | 'ergonome_presentiel'
  | 'psychologue_presentiel' | 'consultant_prevention' | 'non_defini';

interface CompetenceInfo { key: CompetenceKey; label: string; color: string }

interface Professional {
  id: number; name: string; company: string;
  competences: CompetenceInfo[];
  email: string; phone: string; website: string; description: string;
  zone: string; lat?: number; lng?: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COMPETENCES: Record<CompetenceKey, CompetenceInfo> = {
  formation:              { key: 'formation',              label: 'Formation Qualiopi',     color: '#2ecc71' },
  materiel:               { key: 'materiel',               label: 'Matériel Ergonomique',   color: '#e67e22' },
  ergonome_presentiel:    { key: 'ergonome_presentiel',    label: 'Ergonome Présentiel',    color: '#e74c3c' },
  psychologue_presentiel: { key: 'psychologue_presentiel', label: 'Psychologue Présentiel', color: '#3498db' },
  consultant_prevention:  { key: 'consultant_prevention',  label: 'Consultant Prévention',  color: '#9b59b6' },
  non_defini:             { key: 'non_defini',             label: 'Autre',                  color: '#95a5a6' },
};

const COMPETENCE_ID_MAP: Record<string, CompetenceKey> = {
  '251': 'formation', '252': 'materiel', '253': 'ergonome_presentiel',
  '254': 'psychologue_presentiel', '258': 'consultant_prevention',
};

const FIELD_ADDRESS       = 'af8d1eee2986e4b3f27659fbe12d74912ec9f888';
const FIELD_COMPETENCES   = '744a9d6bd818c9ab7716fa4485b37c2bc1d10e46';
const FIELD_DESCRIPTION   = 'c9573d3e2332b5cf10c2263722a64fada3f305c9';
const FIELD_WEBSITE       = '8d3e0e3a94b8a259d0793b24d4d0eae5a1c4a893';
const FIELD_QUALIFICATION = '5e72f39c485ce76cacd08e551767749a5704ee3e';

const GEOCACHE_KEY = 'scanup_geo_v2';
const GEOCACHE_TTL = 14 * 24 * 60 * 60 * 1000;
const BATCH_SIZE   = 8;

const FILTERS = [
  { key: 'all', label: 'Tous', color: '#0068FF' },
  ...Object.values(COMPETENCES).filter(c => c.key !== 'non_defini'),
];

// ─── Geocoding ───────────────────────────────────────────────────────────────

type GeoCache = Record<string, { lat: number; lng: number; ts: number }>;

function readCache(): GeoCache {
  try { return JSON.parse(localStorage.getItem(GEOCACHE_KEY) || '{}'); } catch { return {}; }
}
function writeCache(addr: string, c: { lat: number; lng: number }) {
  try {
    const cache = readCache();
    cache[addr.toLowerCase()] = { ...c, ts: Date.now() };
    localStorage.setItem(GEOCACHE_KEY, JSON.stringify(cache));
  } catch {}
}
async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  const key = address.toLowerCase().trim();
  const c = readCache();
  if (c[key] && Date.now() - c[key].ts < GEOCACHE_TTL) return { lat: c[key].lat, lng: c[key].lng };
  try {
    const res  = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=1&lang=fr`);
    const data = await res.json();
    if (data.features?.[0]?.geometry?.coordinates) {
      const [lng, lat] = data.features[0].geometry.coordinates as [number, number];
      writeCache(address, { lat, lng });
      return { lat, lng };
    }
  } catch {}
  return null;
}

// ─── Pipedrive ───────────────────────────────────────────────────────────────

async function fetchAllContacts(apiKey: string): Promise<any[]> {
  const all: any[] = [];
  let start = 0;
  while (true) {
    const res  = await fetch(`https://360skillvue.pipedrive.com/api/v1/persons?start=${start}&limit=500&api_token=${encodeURIComponent(apiKey)}`);
    if (!res.ok) throw new Error(`Pipedrive ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.data?.length) break;
    all.push(...data.data);
    if (data.data.length < 500) break;
    start += 500;
  }
  return all;
}

function parseContacts(raw: any[]): Professional[] {
  return raw
    .filter(p => p[FIELD_ADDRESS] && p[FIELD_QUALIFICATION])
    .map(p => {
      const rawComp  = p[FIELD_COMPETENCES];
      const ids      = (Array.isArray(rawComp) ? rawComp.map(String) : rawComp ? [String(rawComp)] : []);
      const comps    = ids.filter((id: string) => COMPETENCE_ID_MAP[id]).map((id: string) => COMPETENCES[COMPETENCE_ID_MAP[id]]);
      if (!comps.length) comps.push(COMPETENCES.non_defini);
      const rawSite: string = p[FIELD_WEBSITE] || '';
      return {
        id: p.id, name: p.name || 'Sans nom', company: p.org_id?.name || '',
        competences: comps,
        email: p.email?.[0]?.value || '', phone: p.phone?.[0]?.value || '',
        website: rawSite && !rawSite.startsWith('http') ? `https://${rawSite}` : rawSite,
        description: p[FIELD_DESCRIPTION] || '', zone: p[FIELD_ADDRESS],
      };
    });
}

// ─── Map helpers (inside MapContainer) ───────────────────────────────────────

function MapFlyTo({ target }: { target: Professional | null }) {
  const map    = useMap();
  const lastId = useRef<number | null>(null);
  useEffect(() => {
    if (target?.lat && target?.lng && target.id !== lastId.current) {
      lastId.current = target.id;
      map.flyTo([target.lat, target.lng], 13, { duration: 0.7 });
    }
  }, [target, map]);
  return null;
}

function MapInvalidate({ trigger }: { trigger: boolean }) {
  const map = useMap();
  useEffect(() => { setTimeout(() => map.invalidateSize(), 60); }, [trigger, map]);
  return null;
}

// ─── Professional card ────────────────────────────────────────────────────────

const ProCard = React.forwardRef<
  HTMLDivElement,
  { pro: Professional; selected: boolean; onClick: () => void }
>(({ pro, selected, onClick }, ref) => {
  const primary = pro.competences[0];
  return (
    <motion.div
      ref={ref}
      onClick={onClick}
      whileHover={selected ? {} : { y: -1 }}
      transition={{ duration: 0.15 }}
      className={`relative rounded-[16px] border cursor-pointer overflow-hidden transition-shadow duration-200 ${
        selected
          ? 'border-scanup-blue/30 shadow-lg shadow-scanup-blue/[0.08]'
          : 'border-scanup-graylight bg-white hover:shadow-md hover:shadow-black/[0.06]'
      } bg-white`}
    >
      {/* Left color accent */}
      <div className="absolute inset-y-0 left-0 w-[3px]" style={{ background: primary.color }} />

      <div className="pl-5 pr-4 py-3.5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="font-semibold text-[13px] text-scanup-navy leading-snug truncate">{pro.name}</p>
            {pro.company && (
              <p className="text-[11px] font-medium text-scanup-blue mt-0.5 truncate">{pro.company}</p>
            )}
          </div>
          {/* located indicator */}
          {pro.lat && (
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ring-2 ring-white"
              style={{ background: primary.color }} />
          )}
        </div>

        {/* Competence pills — site style */}
        <div className="flex flex-wrap gap-1 mb-2">
          {pro.competences.map(c => (
            <span
              key={c.key}
              className="inline-flex items-center px-2 py-[3px] rounded-full text-[9px] font-bold tracking-wide"
              style={{ background: `${c.color}18`, color: c.color, border: `1px solid ${c.color}28` }}
            >
              {c.label}
            </span>
          ))}
        </div>

        {/* Zone */}
        <div className="flex items-center gap-1 text-[11px] text-scanup-graytext">
          <MapPin size={10} className="flex-shrink-0" />
          <span className="truncate">{pro.zone}</span>
        </div>

        {/* Expanded contact details */}
        <AnimatePresence>
          {selected && (pro.email || pro.phone || pro.website || pro.description) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-scanup-graylight/80 flex flex-col gap-1.5">
                {pro.email && (
                  <a href={`mailto:${pro.email}`}
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-2 text-[11px] text-scanup-graytext hover:text-scanup-blue transition-colors truncate">
                    <Mail size={10} className="flex-shrink-0 text-scanup-blue" />{pro.email}
                  </a>
                )}
                {pro.phone && (
                  <a href={`tel:${pro.phone}`}
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-2 text-[11px] text-scanup-graytext hover:text-scanup-blue transition-colors">
                    <Phone size={10} className="flex-shrink-0 text-scanup-blue" />{pro.phone}
                  </a>
                )}
                {pro.website && (
                  <a href={pro.website} target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-2 text-[11px] text-scanup-graytext hover:text-scanup-blue transition-colors truncate">
                    <Globe size={10} className="flex-shrink-0 text-scanup-blue" />
                    {pro.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
                {pro.description && (
                  <p className="text-[11px] text-scanup-graytext leading-relaxed mt-0.5 line-clamp-3">
                    {pro.description}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});
ProCard.displayName = 'ProCard';

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PartenairesPage() {
  const [pros, setPros]         = useState<Professional[]>([]);
  const [loading, setLoading]   = useState(true);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState<Professional | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const cardRefs                = useRef<Map<number, HTMLDivElement>>(new Map());
  const aborted                 = useRef(false);

  // ESC to exit fullscreen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = fullscreen ? 'hidden' : '';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [fullscreen]);

  // Load data
  useEffect(() => {
    aborted.current = false;
    load();
    return () => { aborted.current = true; };
  }, []);

  // Scroll selected card
  useEffect(() => {
    if (selected) cardRefs.current.get(selected.id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selected]);

  async function load() {
    const apiKey = import.meta.env.VITE_PIPEDRIVE_API_KEY as string | undefined;
    if (!apiKey) { setError('VITE_PIPEDRIVE_API_KEY manquante dans .env'); setLoading(false); return; }
    try {
      const raw    = await fetchAllContacts(apiKey);
      const parsed = parseContacts(raw);
      setProgress({ done: 0, total: parsed.length });

      const cache = readCache();
      const ready: Professional[] = [];
      const pending: Professional[] = [];
      for (const p of parsed) {
        const entry = cache[p.zone.toLowerCase().trim()];
        if (entry && Date.now() - entry.ts < GEOCACHE_TTL) ready.push({ ...p, lat: entry.lat, lng: entry.lng });
        else pending.push(p);
      }
      if (ready.length) setPros(ready);
      setProgress({ done: ready.length, total: parsed.length });

      for (let i = 0; i < pending.length; i += BATCH_SIZE) {
        if (aborted.current) break;
        const batch   = pending.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(batch.map(p => geocode(p.zone).then(c => c ? { ...p, ...c } : null)));
        const geo     = results.filter((r): r is NonNullable<typeof r> => r !== null);
        if (geo.length) setPros(prev => [...prev, ...geo]);
        setProgress({ done: ready.length + Math.min(i + BATCH_SIZE, pending.length), total: parsed.length });
        if (i + BATCH_SIZE < pending.length) await new Promise(r => setTimeout(r, 80));
      }
      setLoading(false);
    } catch (e: any) { setError(e?.message || 'Erreur'); setLoading(false); }
  }

  const handleSelect = useCallback((pro: Professional) => {
    setSelected(prev => prev?.id === pro.id ? null : pro);
  }, []);

  const filtered = pros.filter(p => {
    const byType   = filter === 'all' || p.competences.some(c => c.key === filter);
    const q        = search.toLowerCase();
    const bySearch = !q || p.name.toLowerCase().includes(q) || p.company.toLowerCase().includes(q) || p.zone.toLowerCase().includes(q);
    return byType && bySearch;
  });
  const onMap = filtered.filter(p => p.lat && p.lng);

  // ── Sidebar (shared between compact + fullscreen) ────────────────────────
  const sidebar = (
    <div className={`flex flex-col bg-white border-l border-black/[0.06] flex-shrink-0 ${fullscreen ? 'w-[380px]' : 'w-full md:w-[360px] lg:w-[400px]'}`}>

      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-scanup-graylight/60 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[13px] font-bold text-scanup-navy">
              {loading && progress.total === 0 ? 'Chargement…' : `${filtered.length} professionnel${filtered.length !== 1 ? 's' : ''}`}
            </p>
            {loading && progress.total > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1 bg-scanup-graylight rounded-full overflow-hidden w-24">
                  <div
                    className="h-full bg-scanup-blue rounded-full transition-all duration-500"
                    style={{ width: `${(progress.done / progress.total) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-scanup-graytext whitespace-nowrap">{progress.done}/{progress.total}</span>
              </div>
            )}
          </div>
          {loading && progress.total === 0 && <Loader2 size={14} className="animate-spin text-scanup-blue" />}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-scanup-graytext/60 pointer-events-none" />
          <input
            type="text"
            placeholder="Nom, ville, entreprise…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-[12px] bg-scanup-graylight/50 rounded-xl border border-transparent focus:outline-none focus:border-scanup-blue/30 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Filter pills */}
      <div className="px-4 py-2.5 border-b border-scanup-graylight/60 flex-shrink-0">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all flex-shrink-0 border ${
                filter === f.key ? 'text-white border-transparent shadow-sm' : 'bg-white text-scanup-graytext border-scanup-graylight hover:border-scanup-blue/20'
              }`}
              style={filter === f.key ? { background: f.color, borderColor: f.color } : {}}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pro list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {filtered.length === 0 && !loading && (
          <p className="text-center text-[13px] text-scanup-graytext py-10">Aucun résultat</p>
        )}
        {filtered.map(pro => (
          <ProCard
            key={pro.id}
            ref={el => { if (el) cardRefs.current.set(pro.id, el); else cardRefs.current.delete(pro.id); }}
            pro={pro}
            selected={selected?.id === pro.id}
            onClick={() => handleSelect(pro)}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-scanup-graylight/60 flex-shrink-0">
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {Object.values(COMPETENCES).filter(c => c.key !== 'non_defini').map(c => (
            <button
              key={c.key}
              onClick={() => setFilter(f => f === c.key ? 'all' : c.key)}
              className="flex items-center gap-1.5 hover:opacity-60 transition-opacity"
            >
              <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
              <span className="text-[10px] text-scanup-graytext">{c.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Map block (shared) ────────────────────────────────────────────────────
  const mapBlock = (
    <div className="relative flex-1 min-h-0">
      <MapContainer
        center={[46.85, 2.35]}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
        zoomControl
      >
        <MapFlyTo target={selected} />
        <MapInvalidate trigger={fullscreen} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {onMap.map(pro => (
          <CircleMarker
            key={pro.id}
            center={[pro.lat!, pro.lng!]}
            radius={selected?.id === pro.id ? 10 : 6}
            pathOptions={{
              color: 'white',
              weight: selected?.id === pro.id ? 3 : 2,
              fillColor: pro.competences[0].color,
              fillOpacity: 1,
            }}
            eventHandlers={{ click: () => handleSelect(pro) }}
          >
            <Popup maxWidth={220}>
              <div style={{ fontFamily: "'Poppins', sans-serif", padding: '2px 0', lineHeight: 1.4 }}>
                <p style={{ fontWeight: 700, fontSize: '13px', color: '#1C244B', margin: '0 0 2px' }}>{pro.name}</p>
                {pro.company && <p style={{ fontSize: '11px', color: '#0068FF', margin: '0 0 6px' }}>{pro.company}</p>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                  {pro.competences.map(c => (
                    <span key={c.key} style={{ background: c.color, color: '#fff', fontSize: '9px', padding: '2px 7px', borderRadius: '20px', fontWeight: 700 }}>
                      {c.label}
                    </span>
                  ))}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Fullscreen toggle */}
      <button
        onClick={() => setFullscreen(f => !f)}
        className="absolute bottom-4 right-4 z-[400] bg-white/95 backdrop-blur-sm rounded-xl border border-black/[0.08] shadow-lg p-2.5 hover:shadow-xl transition-all hover:scale-105"
        title={fullscreen ? 'Réduire' : 'Plein écran'}
      >
        {fullscreen
          ? <Minimize2 size={15} className="text-scanup-navy" />
          : <Maximize2 size={15} className="text-scanup-navy" />
        }
      </button>
    </div>
  );

  return (
    <div className="min-h-screen font-sans text-scanup-navy bg-white">

      {/* Top bar */}
      <div className="h-[6px] w-full bg-gradient-to-r from-scanup-blue via-scanup-turquoise to-scanup-blue fixed top-0 z-50" />

      {/* Nav */}
      <nav className="sticky top-[6px] z-40 bg-white/90 backdrop-blur-xl border-b border-black/[0.06]">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="cursor-pointer"
          >
            <Link to="/" className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-scanup-blue">ScanUp</span>
              <span className="text-scanup-graytext text-sm">by</span>
              <img src="/Logo360skillvue-200x55.webp" alt="360SkillVue" className="h-8 w-auto" />
            </Link>
          </motion.div>
          <div className="hidden md:flex items-center gap-8 text-[14px]">
            <span className="text-scanup-blue font-semibold">Notre Réseau</span>
            <Link to="/certification-periodique-sante" className="text-scanup-graytext hover:text-scanup-blue transition-colors">Certification Santé</Link>
          </div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
            <button className="hidden sm:block text-scanup-navy font-medium hover:text-scanup-blue transition-colors text-sm">Connexion</button>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              className="bg-scanup-blue text-white px-4 py-2 rounded-full text-[13px] font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-scanup-blue/20">
              Essai gratuit
            </motion.button>
          </motion.div>
        </div>
      </nav>

      {/* ── Page header ────────────────────────────────────────── */}
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-scanup-blue text-[11px] font-bold uppercase tracking-widest mb-2">
          <Users size={12} /> Réseau de professionnels
        </div>
        <h1 className="text-[28px] md:text-[36px] font-bold tracking-tight">
          Carte des{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-scanup-blue to-scanup-turquoise">
            professionnels
          </span>
        </h1>
        <p className="text-[15px] text-scanup-graytext mt-2">
          Ergonomes, psychologues, formateurs et consultants en prévention référencés sur ScanUp.
        </p>
      </div>

      {/* ── Error ──────────────────────────────────────────────── */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 pb-6">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-[13px] text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* ── Compact map + sidebar ─────────────────────────────── */}
      {!error && !fullscreen && (
        <div className="max-w-7xl mx-auto px-6 pb-12">
          <div className="rounded-3xl overflow-hidden border border-black/[0.07] shadow-xl flex flex-col md:flex-row" style={{ height: '520px' }}>
            {mapBlock}
            {sidebar}
          </div>
        </div>
      )}

      {/* ── Fullscreen overlay ─────────────────────────────────── */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[999] flex bg-white"
            style={{ top: 0 }}
          >
            {mapBlock}
            {sidebar}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CTA ────────────────────────────────────────────────── */}
      {!fullscreen && (
        <section className="py-16 px-6 bg-scanup-graylight/40 border-t border-scanup-graylight">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-[24px] md:text-[32px] font-bold tracking-tight mb-3">
              Rejoignez le réseau
            </h2>
            <p className="text-[15px] text-scanup-graytext mb-8 leading-relaxed">
              Ergonome, psychologue, formateur, consultant ? Soyez visible auprès des entreprises qui ont besoin de vos compétences.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="bg-scanup-blue text-white px-7 py-3.5 rounded-full font-semibold text-[14px] hover:bg-blue-700 transition-colors shadow-lg shadow-scanup-blue/20 inline-flex items-center gap-2 group"
            >
              Rejoindre le réseau
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </motion.button>
          </div>
        </section>
      )}
    </div>
  );
}
