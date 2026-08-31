import React from 'react';
import { useLanguage } from '../i18n';
import { Link } from '../i18n/Link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';

const SECTIONS = [
  {
    title: '1. Identification de l\'éditeur du site',
    content: [
      { label: 'Raison sociale', value: '360SkillVue Sàrl' },
      { label: 'Forme juridique', value: 'Société à responsabilité limitée de droit suisse' },
      { label: 'Siège social', value: 'Rue du Centre 142, c/o Cofidex SA, 1025 Saint-Sulpice (VD), Suisse' },
      { label: 'Numéro IDE', value: 'CHE-451.592.837' },
      { label: 'Capital social', value: 'CHF 20\'000' },
      { label: 'Date de constitution', value: '11 septembre 2024' },
      { label: 'Organe de publication', value: 'Feuille officielle suisse du commerce (FOSC)' },
    ],
  },
  {
    title: '2. Représentants légaux',
    paragraphs: [
      'Gérant et président : David Pereira, avec signature individuelle.',
      'Associée-gérante : Laure Dellamonica, avec signature collective à deux.',
    ],
  },
  {
    title: '3. Activité de la société',
    paragraphs: [
      '360SkillVue Sàrl a pour but la prestation de tous services dans le domaine de l\'informatique, notamment l\'édition de logiciels, de solutions d\'apprentissage en ligne et de diagnostic à distance.',
    ],
  },
  {
    title: '4. Contact',
    content: [
      { label: 'Adresse e-mail', value: 'tech@360skillvue.com' },
      { label: 'Site web', value: 'https://360skillvue.com/' },
    ],
  },
  {
    title: '5. Hébergement du site',
    content: [
      { label: 'Site vitrine', value: 'WordPress – hébergé par OVH' },
      { label: 'Plateforme', value: 'Hébergement sur serveurs certifiés HDS – OVHcloud' },
    ],
  },
  {
    title: '6. Propriété intellectuelle',
    paragraphs: [
      'L\'ensemble du contenu de ce site (textes, images, graphismes, logos, icônes, sons, logiciels, etc.) est la propriété exclusive de 360SkillVue Sàrl ou de ses partenaires et est protégé par les lois suisses et internationales relatives à la propriété intellectuelle.',
      'Toute reproduction, représentation, modification, publication, transmission, dénaturation, totale ou partielle du site ou de son contenu, par quelque procédé que ce soit, et sur quelque support que ce soit, est interdite sans l\'autorisation écrite préalable de 360SkillVue Sàrl.',
      'Toute utilisation non autorisée du contenu du site constituerait une contrefaçon sanctionnée par les dispositions légales applicables.',
    ],
  },
  {
    title: '7. Protection des données personnelles',
    paragraphs: [
      '360SkillVue Sàrl s\'engage à protéger la vie privée des utilisateurs de son site web, conformément à la Loi fédérale sur la protection des données (LPD) et, le cas échéant, au Règlement général sur la protection des données (RGPD) de l\'Union européenne.',
      'Les données personnelles collectées sur ce site sont destinées exclusivement à un usage interne par 360SkillVue Sàrl. Elles ne seront en aucun cas cédées ou vendues à des tiers sans le consentement préalable de l\'utilisateur.',
      'Conformément à la LPD et au RGPD, tout utilisateur dispose d\'un droit d\'accès, de rectification, de suppression et de portabilité de ses données personnelles. Pour exercer ces droits, veuillez contacter : tech@360skillvue.com.',
    ],
  },
  {
    title: '8. Cookies',
    paragraphs: [
      'Le site 360SkillVue peut utiliser des cookies afin d\'améliorer l\'expérience de navigation des utilisateurs. Les cookies sont de petits fichiers texte stockés sur le terminal de l\'utilisateur.',
      'L\'utilisateur peut configurer son navigateur pour refuser les cookies ou être averti lorsqu\'un cookie est déposé. Le refus des cookies peut limiter l\'accès à certaines fonctionnalités du site.',
    ],
  },
  {
    title: '9. Limitation de responsabilité',
    paragraphs: [
      '360SkillVue Sàrl s\'efforce de fournir sur le site des informations aussi précises que possible. Toutefois, elle ne saurait être tenue responsable des omissions, inexactitudes ou carences dans la mise à jour de ces informations, qu\'elles soient de son fait ou du fait de tiers partenaires.',
      'Les informations présentes sur ce site sont fournies à titre indicatif et ne sauraient constituer un conseil juridique, technique ou commercial. 360SkillVue Sàrl décline toute responsabilité pour tout dommage résultant de l\'utilisation du site ou de l\'impossibilité d\'y accéder.',
    ],
  },
  {
    title: '10. Liens hypertextes',
    paragraphs: [
      'Le site 360SkillVue peut contenir des liens hypertextes vers d\'autres sites. 360SkillVue Sàrl n\'exerce aucun contrôle sur le contenu de ces sites tiers et décline toute responsabilité quant à leur contenu ou aux dommages pouvant résulter de leur consultation.',
    ],
  },
  {
    title: '11. Droit applicable et juridiction compétente',
    paragraphs: [
      'Les présentes CGU sont régies par le droit suisse. En cas de litige, et après échec de toute tentative de recherche d\'une solution amiable, les tribunaux compétents du canton de Vaud auront juridiction exclusive.',
    ],
  },
  {
    title: '12. Révision',
    paragraphs: [
      'Conformément à la déclaration du 11 septembre 2024, la société n\'est pas soumise à une révision ordinaire et a renoncé à une révision restreinte (opting-out).',
    ],
  },
];

export default function CGUPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-white font-sans text-scanup-navy flex flex-col">
      <PageMeta
        title={t.meta.cgu.title}
        description={t.meta.cgu.description}
        path="/cgu"
      />
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="mb-12">
          <p className="text-[11px] font-semibold text-scanup-blue uppercase tracking-widest mb-3">Informations légales</p>
          <h1 className="text-[36px] font-bold tracking-tight mb-4">Conditions Générales d'Utilisation</h1>
          <p className="text-[13px] text-scanup-graytext">
            Seule la version française des informations légales fait foi.<br />
            Dernière mise à jour : <strong>23 mars 2026</strong>
          </p>
          <div className="flex gap-4 mt-4">
            <Link to="/mentions-legales" className="text-[13px] text-scanup-blue hover:underline font-medium">Mentions légales</Link>
            <Link to="/politique-confidentialite" className="text-[13px] text-scanup-blue hover:underline font-medium">Politique de confidentialité</Link>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {SECTIONS.map((section, i) => (
            <section key={i} className="border-t border-black/[0.07] pt-8">
              <h2 className="text-[17px] font-semibold mb-4">{section.title}</h2>

              {section.content && (
                <dl className="space-y-2">
                  {section.content.map((row, j) => (
                    <div key={j} className="flex flex-col sm:flex-row sm:gap-4">
                      <dt className="text-[13px] font-medium text-scanup-navy/60 sm:w-48 flex-shrink-0">{row.label}</dt>
                      <dd className="text-[13px] text-scanup-navy">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {section.paragraphs && (
                <div className="space-y-3">
                  {section.paragraphs.map((p, j) => (
                    <p key={j} className="text-[14px] text-scanup-graytext leading-relaxed">{p}</p>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Back */}
        <div className="mt-16 pt-8 border-t border-black/[0.07]">
          <Link to="/" className="text-[13px] text-scanup-blue hover:underline">← Retour à l'accueil</Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
