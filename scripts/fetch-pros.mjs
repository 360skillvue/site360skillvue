// scripts/fetch-pros.mjs
// Fetches professionals from Pipedrive, geocodes them, writes public/professionals.json
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_KEY = '9253b27b43a478f140271664aa4d040d9079c848';

const FIELD_ADDRESS       = 'af8d1eee2986e4b3f27659fbe12d74912ec9f888';
const FIELD_COMPETENCES   = '744a9d6bd818c9ab7716fa4485b37c2bc1d10e46';
const FIELD_DESCRIPTION   = 'c9573d3e2332b5cf10c2263722a64fada3f305c9';
const FIELD_WEBSITE       = '8d3e0e3a94b8a259d0793b24d4d0eae5a1c4a893';
const FIELD_QUALIFICATION = '5e72f39c485ce76cacd08e551767749a5704ee3e';

const COMPETENCE_ID_MAP = {
  '251': 'formation',
  '252': 'materiel',
  '253': 'ergonome_presentiel',
  '254': 'psychologue_presentiel',
  '258': 'consultant_prevention',
};

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

function getZoneRadius(zone) {
  const n = zone.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, ' ').trim();
  if (n === 'france') return 500000;
  if (n === 'suisse') return 100000;
  if (FRENCH_REGIONS.some(r => n.includes(r))) return 150000;
  return 30000;
}

async function fetchAllContacts() {
  const all = [];
  let start = 0;
  while (true) {
    const res = await fetch(
      `https://360skillvue.pipedrive.com/api/v1/persons?start=${start}&limit=500&api_token=${API_KEY}`
    );
    if (!res.ok) throw new Error(`Pipedrive ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.data?.length) break;
    all.push(...data.data);
    console.log(`  Fetched ${all.length} contacts...`);
    if (data.data.length < 500) break;
    start += 500;
  }
  return all;
}

async function geocode(address) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': '360SkillVue/1.0 (contact@360skillvue.com)' }
    });
    const data = await res.json();
    if (data?.[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch {}
  return null;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('Fetching contacts from Pipedrive...');
  const raw = await fetchAllContacts();
  console.log(`Total contacts: ${raw.length}`);

  const parsed = raw
    .filter(p => p[FIELD_ADDRESS] && p[FIELD_QUALIFICATION])
    .map(p => {
      const rawComp = p[FIELD_COMPETENCES];
      const ids = Array.isArray(rawComp) ? rawComp.map(String) : rawComp ? [String(rawComp)] : [];
      const competences = ids
        .filter(id => COMPETENCE_ID_MAP[id])
        .map(id => COMPETENCE_ID_MAP[id]);
      if (!competences.length) competences.push('non_defini');
      const rawSite = p[FIELD_WEBSITE] || '';
      return {
        id: p.id,
        name: p.name || 'Sans nom',
        company: p.org_id?.name || '',
        competences,
        email: p.email?.[0]?.value || '',
        phone: p.phone?.[0]?.value || '',
        website: rawSite && !rawSite.startsWith('http') ? `https://${rawSite}` : rawSite,
        description: p[FIELD_DESCRIPTION] || '',
        zone: p[FIELD_ADDRESS],
        radius: getZoneRadius(p[FIELD_ADDRESS]),
      };
    });

  console.log(`Contacts after filter: ${parsed.length}`);
  console.log('Geocoding...');

  const result = [];
  for (let i = 0; i < parsed.length; i++) {
    const p = parsed[i];
    const coords = await geocode(p.zone);
    if (coords) {
      result.push({ ...p, lat: coords.lat, lng: coords.lng });
      process.stdout.write(`\r  ${i + 1}/${parsed.length} géocodés`);
    } else {
      console.log(`\n  ⚠ Geocode failed: ${p.zone}`);
    }
    if (i < parsed.length - 1) await sleep(1100); // Nominatim: max 1 req/sec
  }

  console.log(`\nGeocoded: ${result.length}/${parsed.length}`);

  const out = join(__dirname, '..', 'public', 'professionals.json');
  writeFileSync(out, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`✓ Written to public/professionals.json (${result.length} professionals)`);
}

main().catch(e => { console.error(e); process.exit(1); });
