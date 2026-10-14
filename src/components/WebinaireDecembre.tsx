import { CalendarDays, ArrowRight } from 'lucide-react';
import { useLanguage } from '../i18n';

/** Webinaire du jeudi 3 decembre 2026, 12h00 a 13h00 (heure de Paris).
 *  Le bandeau et l'encadre disparaissent automatiquement a la fin du webinaire. */
const FIN_WEBINAIRE = new Date('2026-12-03T13:00:00+01:00').getTime();
const LIEN = '/webinaire.html';

function actif(lang: string) {
  return lang === 'fr' && Date.now() < FIN_WEBINAIRE;
}

/** Bandeau fin, sous le bandeau de maintenance, sur toutes les pages en francais. */
export function WebinaireBandeau() {
  const { lang } = useLanguage();
  if (!actif(lang)) return null;
  return (
    <a href={LIEN} className="block w-full bg-scanup-blue hover:bg-[#0057D6] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex items-center justify-center gap-2 text-white text-[12px] sm:text-[13px] font-medium text-center">
        <CalendarDays size={13} className="flex-shrink-0" />
        <span>
          Webinaire gratuit jeudi 3 décembre, 12h00 à 13h00 : et les salariés qu’on ne voit jamais ?
          <span className="underline underline-offset-2 ml-2 font-semibold">Je m’inscris</span>
        </span>
      </div>
    </a>
  );
}

/** Encadre de la page d'accueil. */
export function WebinaireEncadre() {
  const { lang } = useLanguage();
  if (!actif(lang)) return null;
  return (
    <section className="py-12 px-6 bg-white">
      <div className="max-w-6xl mx-auto rounded-2xl border border-scanup-blue/20 bg-[#DBEAFE]/50 p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1">
          <span className="inline-block text-[12px] font-medium text-scanup-blue bg-white rounded-lg px-3 py-1 mb-3">
            Webinaire gratuit, en ligne
          </span>
          <h2 className="text-[22px] md:text-[26px] font-semibold text-scanup-navy leading-tight mb-2">
            Prévention TMS et RPS : et les salariés qu’on ne voit jamais ?
          </h2>
          <p className="text-[15px] text-scanup-graytext mb-2">
            Les télétravailleurs, que l’on ne voit jamais à leur poste ; ceux qui n’osent pas parler de ce qu’ils vivent ; les salariés des sites protégés, ceux qui interviennent chez un tiers, les isolés, ceux qui ne parlent pas la langue des intervenants en santé au travail.
            Une heure pour les inclure dans la prévention des TMS et des RPS, avec une ergonome, une psychologue clinicienne, notre responsable qualité et le témoignage d’une entreprise cliente.
          </p>
          <p className="text-[14px] font-semibold text-scanup-navy">Jeudi 3 décembre 2026, 12h00 à 13h00 · replay envoyé aux inscrits</p>
        </div>
        <a
          href={LIEN}
          className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-[10px] bg-scanup-blue hover:bg-[#0057D6] text-white text-[15px] font-semibold whitespace-nowrap transition-colors"
        >
          Je réserve ma place <ArrowRight size={16} />
        </a>
      </div>
    </section>
  );
}
