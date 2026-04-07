import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight, Users, Search, Loader2, AlertCircle,
  Mail, Phone, Globe, MapPin, Maximize2, Minimize2, X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useLanguage } from '../i18n';
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type CompetenceKey =
  | 'formation' | 'materiel' | 'ergonome_presentiel'
  | 'psychologue_presentiel' | 'consultant_prevention' | 'non_defini';

interface CompetenceInfo { key: CompetenceKey; label: string; color: string }

interface Professional {
  id: number; name: string; company: string;
  competences: CompetenceInfo[];
  email: string; phone: string; website: string; description: string;
  zone: string; radius: number; lat?: number; lng?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COMPETENCES: Record<CompetenceKey, CompetenceInfo> = {
  formation:              { key: 'formation',              label: 'Formation Qualiopi',     color: '#16a34a' },
  materiel:               { key: 'materiel',               label: 'Matériel Ergonomique',   color: '#ea580c' },
  ergonome_presentiel:    { key: 'ergonome_presentiel',    label: 'Ergonome Présentiel',    color: '#dc2626' },
  psychologue_presentiel: { key: 'psychologue_presentiel', label: 'Psychologue Présentiel', color: '#2563eb' },
  consultant_prevention:  { key: 'consultant_prevention',  label: 'Consultant Prévention',  color: '#7c3aed' },
  non_defini:             { key: 'non_defini',             label: 'Autre',                  color: '#64748b' },
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

// FILTERS are built dynamically inside the component using translated labels

// ─── Zone radius ──────────────────────────────────────────────────────────────

const FRENCH_REGIONS = [
  'auvergne-rhone-alpes','auvergne rhone alpes',
  'bourgogne-franche-comte','bourgogne franche comte',
  'bretagne','centre-val de loire','centre val de loire','corse',
  'grand est','hauts-de-france','hauts de france',
  'ile-de-france','ile de france','normandie',
  'nouvelle-aquitaine','nouvelle aquitaine','occitanie',
  'pays de la loire','provence-alpes-cote dazur','provence alpes cote dazur','paca',
  'guadeloupe','martinique','guyane','la reunion','reunion','mayotte',
];

function getZoneRadius(zone: string): number {
  const n = zone.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, ' ').trim();
  if (n === 'france') return 500_000;
  if (n === 'suisse') return 100_000;
  if (FRENCH_REGIONS.some(r => n.includes(r))) return 150_000;
  return 30_000;
}

// ─── Geocoding ────────────────────────────────────────────────────────────────

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

// ─── Pipedrive ────────────────────────────────────────────────────────────────

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
      const rawComp = p[FIELD_COMPETENCES];
      const ids     = (Array.isArray(rawComp) ? rawComp.map(String) : rawComp ? [String(rawComp)] : []);
      const comps   = ids.filter((id: string) => COMPETENCE_ID_MAP[id]).map((id: string) => COMPETENCES[COMPETENCE_ID_MAP[id]]);
      if (!comps.length) comps.push(COMPETENCES.non_defini);
      const rawSite: string = p[FIELD_WEBSITE] || '';
      return {
        id: p.id, name: p.name || 'Sans nom', company: p.org_id?.name || '',
        competences: comps,
        email: p.email?.[0]?.value || '', phone: p.phone?.[0]?.value || '',
        website: rawSite && !rawSite.startsWith('http') ? `https://${rawSite}` : rawSite,
        description: p[FIELD_DESCRIPTION] || '', zone: p[FIELD_ADDRESS],
        radius: getZoneRadius(p[FIELD_ADDRESS]),
      };
    });
}

// ─── Map helpers ──────────────────────────────────────────────────────────────

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

// ─── ProCard ──────────────────────────────────────────────────────────────────

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
      className={`relative cursor-pointer overflow-hidden transition-all duration-200 rounded-2xl ${
        selected
          ? 'bg-white shadow-md ring-1 ring-black/[0.08]'
          : 'bg-white/60 hover:bg-white hover:shadow-sm ring-1 ring-black/[0.06]'
      }`}
    >
      {/* Top color accent */}
      <div className="h-[3px] w-full rounded-t-2xl" style={{ background: primary.color }} />

      <div className="px-4 py-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="min-w-0">
            <p className="font-semibold text-[13px] text-scanup-navy leading-snug truncate">{pro.name}</p>
            {pro.company && (
              <p className="text-[11px] text-scanup-blue font-medium mt-0.5 truncate">{pro.company}</p>
            )}
          </div>
          {pro.lat && (
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
              style={{ background: primary.color }} />
          )}
        </div>

        {/* Pills */}
        <div className="flex flex-wrap gap-1 mb-2.5">
          {pro.competences.map(c => (
            <span
              key={c.key}
              className="inline-flex items-center px-2 py-[2px] rounded-full text-[9px] font-semibold tracking-wide"
              style={{ background: `${c.color}12`, color: c.color }}
            >
              {c.label}
            </span>
          ))}
        </div>

        {/* Zone */}
        <div className="flex items-center gap-1.5 text-[11px] text-scanup-graytext/80">
          <MapPin size={9} className="flex-shrink-0" />
          <span className="truncate">{pro.zone}</span>
        </div>

        {/* Expanded */}
        <AnimatePresence>
          {selected && (pro.email || pro.phone || pro.website || pro.description) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-black/[0.05] flex flex-col gap-1.5">
                {pro.description && (
                  <p className="text-[11px] text-scanup-graytext leading-relaxed mb-1 line-clamp-3">
                    {pro.description}
                  </p>
                )}
                {pro.email && (
                  <a href={`mailto:${pro.email}`} onClick={e => e.stopPropagation()}
                    className="flex items-center gap-2 text-[11px] text-scanup-graytext hover:text-scanup-blue transition-colors truncate group">
                    <Mail size={10} className="flex-shrink-0 text-scanup-blue/60 group-hover:text-scanup-blue transition-colors" />
                    {pro.email}
                  </a>
                )}
                {pro.phone && (
                  <a href={`tel:${pro.phone}`} onClick={e => e.stopPropagation()}
                    className="flex items-center gap-2 text-[11px] text-scanup-graytext hover:text-scanup-blue transition-colors group">
                    <Phone size={10} className="flex-shrink-0 text-scanup-blue/60 group-hover:text-scanup-blue transition-colors" />
                    {pro.phone}
                  </a>
                )}
                {pro.website && (
                  <a href={pro.website} target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-2 text-[11px] text-scanup-graytext hover:text-scanup-blue transition-colors truncate group">
                    <Globe size={10} className="flex-shrink-0 text-scanup-blue/60 group-hover:text-scanup-blue transition-colors" />
                    {pro.website.replace(/^https?:\/\//, '')}
                  </a>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PartenairesPage() {
  const { t } = useLanguage();

  const FILTERS = [
    { key: 'all', label: t.partenaires.filterAll, color: '#0068FF' },
    ...Object.values(COMPETENCES).filter(c => c.key !== 'non_defini').map(c => ({
      ...c,
      label: t.partenaires.competences[c.key as keyof typeof t.partenaires.competences] || c.label,
    })),
  ];

  const [pros, setPros]             = useState<Professional[]>([]);
  const [loading, setLoading]       = useState(true);
  const [progress, setProgress]     = useState({ done: 0, total: 0 });
  const [filter, setFilter]         = useState('all');
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState<Professional | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const cardRefs                    = useRef<Map<number, HTMLDivElement>>(new Map());
  const aborted                     = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = fullscreen ? 'hidden' : '';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [fullscreen]);

  useEffect(() => {
    aborted.current = false;
    load();
    return () => { aborted.current = true; };
  }, []);

  useEffect(() => {
    if (selected) cardRefs.current.get(selected.id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selected]);

  async function load() {
    const apiKey = import.meta.env.VITE_PIPEDRIVE_API_KEY as string | undefined;
    if (!apiKey) { setError(t.partenaires.errorMissingKey); setLoading(false); return; }
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

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const sidebar = (
    <div className={`flex flex-col bg-[#f8f9fb] border-l border-black/[0.06] flex-shrink-0 ${fullscreen ? 'w-[360px]' : 'w-full md:w-[340px] lg:w-[380px]'}`}>

      {/* Sidebar header */}
      <div className="px-4 pt-4 pb-3 border-b border-black/[0.06] flex-shrink-0 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            {loading && progress.total === 0 ? (
              <div className="flex items-center gap-2 text-[12px] text-scanup-graytext">
                <Loader2 size={12} className="animate-spin text-scanup-blue" />
                {t.partenaires.loading}
              </div>
            ) : (
              <p className="text-[13px] font-semibold text-scanup-navy">
                {filtered.length} {filtered.length !== 1 ? t.partenaires.professionalsCountPlural : t.partenaires.professionalsCount}
                {filter !== 'all' && <span className="text-scanup-graytext font-normal"> {t.partenaires.filtered}</span>}
              </p>
            )}
            {loading && progress.total > 0 && (
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 h-0.5 bg-black/[0.07] rounded-full overflow-hidden w-28">
                  <div
                    className="h-full bg-scanup-blue rounded-full transition-all duration-500"
                    style={{ width: `${(progress.done / progress.total) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-scanup-graytext tabular-nums">{progress.done}/{progress.total}</span>
              </div>
            )}
          </div>
          {selected && (
            <button
              onClick={() => setSelected(null)}
              className="text-[10px] text-scanup-graytext hover:text-scanup-navy transition-colors flex items-center gap-1"
            >
              <X size={10} /> {t.partenaires.clear}
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-scanup-graytext/50 pointer-events-none" />
          <input
            type="text"
            placeholder={t.partenaires.searchPlaceholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-[12px] bg-[#f8f9fb] rounded-xl border border-black/[0.08] focus:outline-none focus:border-scanup-blue/40 focus:bg-white transition-all placeholder:text-scanup-graytext/50"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
        {filtered.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-[13px] text-scanup-graytext">{t.partenaires.noResults}</p>
            <button onClick={() => { setFilter('all'); setSearch(''); }}
              className="mt-2 text-[11px] text-scanup-blue hover:underline">
              {t.partenaires.resetFilters}
            </button>
          </div>
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
      <div className="px-4 py-3 border-t border-black/[0.06] bg-white flex-shrink-0">
        <p className="text-[9px] font-semibold text-scanup-graytext/60 uppercase tracking-widest mb-2">{t.partenaires.legendTitle}</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {Object.values(COMPETENCES).filter(c => c.key !== 'non_defini').map(c => (
            <button
              key={c.key}
              onClick={() => setFilter(f => f === c.key ? 'all' : c.key)}
              className="flex items-center gap-1.5 hover:opacity-70 transition-opacity text-left"
            >
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
              <span className="text-[10px] text-scanup-graytext leading-tight">{c.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Map block ──────────────────────────────────────────────────────────────
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://www.openstreetmap.fr">OSM France</a>'
          url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"
          maxZoom={20}
        />

        {/* Zone circles */}
        {onMap.map(pro => {
          const r = pro.radius;
          const fillOpacity   = r >= 200_000 ? 0.02 : r >= 100_000 ? 0.04 : 0.08;
          const strokeOpacity = r >= 200_000 ? 0.2  : r >= 100_000 ? 0.3  : 0.4;
          return (
            <Circle
              key={`zone-${pro.id}`}
              center={[pro.lat!, pro.lng!]}
              radius={r}
              pathOptions={{
                color: pro.competences[0].color,
                weight: 1.5,
                opacity: strokeOpacity,
                fillColor: pro.competences[0].color,
                fillOpacity,
              }}
            />
          );
        })}

        {/* Markers */}
        {onMap.map(pro => (
          <CircleMarker
            key={pro.id}
            center={[pro.lat!, pro.lng!]}
            radius={selected?.id === pro.id ? 9 : 6}
            pathOptions={{
              color: 'white',
              weight: selected?.id === pro.id ? 2.5 : 2,
              fillColor: pro.competences[0].color,
              fillOpacity: 1,
            }}
            eventHandlers={{ click: () => handleSelect(pro) }}
          >
            <Popup maxWidth={280} minWidth={240} className="clean-popup">
              <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', padding: '2px 0', lineHeight: 1.5 }}>
                <div style={{ height: '3px', background: pro.competences[0].color, borderRadius: '2px 2px 0 0', margin: '-8px -20px 10px' }} />
                <p style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a', margin: '0 0 1px' }}>{pro.name}</p>
                {pro.company && <p style={{ fontSize: '11px', color: '#0068FF', margin: '0 0 8px', fontWeight: 600 }}>{pro.company}</p>}

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: '#94a3b8', marginBottom: '8px' }}>
                  <span>📍</span> {pro.zone}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: pro.description || pro.email || pro.phone || pro.website ? '10px' : '0' }}>
                  {pro.competences.map(c => (
                    <span key={c.key} style={{
                      background: `${c.color}15`, color: c.color,
                      fontSize: '9px', padding: '2px 7px', borderRadius: '99px', fontWeight: 600,
                    }}>
                      {c.label}
                    </span>
                  ))}
                </div>

                {pro.description && (
                  <p style={{ fontSize: '11px', color: '#475569', margin: '0 0 10px', lineHeight: 1.55, borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                    {pro.description.length > 180 ? pro.description.slice(0, 180) + '…' : pro.description}
                  </p>
                )}

                {(pro.email || pro.phone || pro.website) && (
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {pro.email && (
                      <a href={`mailto:${pro.email}`} style={{ fontSize: '11px', color: '#0068FF', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10px' }}>✉</span> {pro.email}
                      </a>
                    )}
                    {pro.phone && (
                      <a href={`tel:${pro.phone}`} style={{ fontSize: '11px', color: '#0068FF', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10px' }}>📞</span> {pro.phone}
                      </a>
                    )}
                    {pro.website && (
                      <a href={pro.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#0068FF', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10px' }}>🌐</span> {pro.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Fullscreen toggle */}
      <button
        onClick={() => setFullscreen(f => !f)}
        className="absolute bottom-4 right-4 z-[400] bg-white rounded-xl border border-black/[0.08] shadow-md p-2.5 hover:shadow-lg transition-all hover:scale-105 active:scale-95"
        title={fullscreen ? t.partenaires.reduce : t.partenaires.fullscreen}
      >
        {fullscreen
          ? <Minimize2 size={14} className="text-scanup-navy" />
          : <Maximize2 size={14} className="text-scanup-navy" />
        }
      </button>
    </div>
  );

  return (
    <div className="min-h-screen font-sans text-scanup-navy bg-white">

      <Navbar />

      {/* ── Hero header ────────────────────────────────────────────── */}
      <div className="bg-[#f8f9fb] border-b border-black/[0.05]">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-2 text-scanup-blue text-[11px] font-semibold uppercase tracking-widest mb-3">
              <Users size={11} />
              <span>{t.partenaires.badge}</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-[24px] sm:text-[32px] md:text-[40px] font-bold tracking-tight leading-tight">
                  {t.partenaires.title}{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-scanup-blue to-scanup-turquoise">
                    {t.partenaires.titleHighlight}
                  </span>
                </h1>
                <p className="text-[15px] text-scanup-graytext mt-2 max-w-xl leading-relaxed">
                  {t.partenaires.subtitle}
                </p>
              </div>
              {pros.length > 0 && (
                <div className="flex items-center gap-6 flex-shrink-0 pb-0.5">
                  {[
                    { value: pros.length, label: t.partenaires.statProfessionnels },
                    { value: onMap.length, label: t.partenaires.statGeolocalises },
                    { value: new Set(pros.flatMap(p => p.competences.map(c => c.key))).size, label: t.partenaires.statSpecialites },
                  ].map((stat, i) => (
                    <React.Fragment key={stat.label}>
                      {i > 0 && <div className="w-px h-8 bg-black/[0.08]" />}
                      <div>
                        <p className="text-[22px] sm:text-[28px] font-bold text-scanup-blue leading-none tabular-nums">{stat.value}</p>
                        <p className="text-[11px] text-scanup-graytext mt-0.5">{stat.label}</p>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────── */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-3">
            <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={16} />
            <p className="text-[13px] text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* ── Filters ────────────────────────────────────────────────── */}
      {!error && !fullscreen && (
        <div className="max-w-7xl mx-auto px-6 pt-4 pb-2">
          <div className="flex items-center gap-2 flex-wrap">
            {FILTERS.map(f => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className="px-4 py-2 rounded-full text-[12px] font-medium whitespace-nowrap transition-all border"
                  style={active
                    ? { background: f.color, color: '#fff', borderColor: f.color }
                    : { background: '#fff', color: '#64748b', borderColor: '#e2e8f0' }
                  }
                >
                  {f.label}
                  {active && filter !== 'all' && (
                    <span className="ml-2 text-white/70 text-[10px]">
                      {filtered.length}
                    </span>
                  )}
                </button>
              );
            })}
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="text-[11px] text-scanup-graytext hover:text-scanup-navy transition-colors ml-1 flex items-center gap-1"
              >
                <X size={11} /> {t.partenaires.reset}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Map + sidebar ──────────────────────────────────────────── */}
      {!error && !fullscreen && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl overflow-hidden border border-black/[0.07] shadow-xl shadow-black/[0.04] flex flex-col md:flex-row"
            style={{ height: 'min(560px, calc(100vh - 120px))' }}
          >
            {mapBlock}
            {sidebar}
          </motion.div>
        </div>
      )}

      {/* ── Fullscreen ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[999] flex bg-white"
          >
            {mapBlock}
            {sidebar}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      {!fullscreen && (
        <section className="py-20 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-scanup-blue/[0.07] text-scanup-blue text-[11px] font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
              <Users size={11} /> {t.partenaires.ctaBadge}
            </div>
            <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight mb-4">
              {t.partenaires.ctaTitle.split('\n').map((line, i) => (
                <React.Fragment key={i}>{line}{i < t.partenaires.ctaTitle.split('\n').length - 1 && <br />}</React.Fragment>
              ))}
            </h2>
            <p className="text-[15px] text-scanup-graytext leading-relaxed mb-8 max-w-lg mx-auto">
              {t.partenaires.ctaSubtitle}
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="bg-scanup-blue text-white px-8 py-3.5 rounded-full font-semibold text-[14px] hover:bg-blue-700 transition-colors shadow-lg shadow-scanup-blue/20 inline-flex items-center gap-2 group"
            >
              {t.partenaires.ctaButton}
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </motion.button>
          </div>
        </section>
      )}
    </div>
  );
}
