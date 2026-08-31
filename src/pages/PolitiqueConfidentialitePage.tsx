import React from 'react';
import { useLanguage } from '../i18n';
import { Link } from '../i18n/Link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';

const SECTIONS = [
  {
    title: '1. Responsable du traitement',
    content: [
      { label: 'Société', value: '360SkillVue Sàrl' },
      { label: 'Siège social', value: 'Rue du Centre 142, c/o Cofidex SA, 1025 Saint-Sulpice (VD), Suisse' },
      { label: 'Contact', value: 'tech@360skillvue.com' },
    ],
  },
  {
    title: '2. Données collectées',
    paragraphs: [
      'Dans le cadre de l\'utilisation du site et de la plateforme ScanUp, 360SkillVue Sàrl peut collecter les données suivantes :',
    ],
    list: [
      'Données d\'identification : nom, prénom, adresse e-mail professionnelle',
      'Données de connexion : adresse IP, logs de navigation, cookies de session',
      'Données liées aux questionnaires : réponses anonymisées aux modules de dépistage TMS et RPS',
      'Données de contact : messages envoyés via le formulaire de contact',
    ],
  },
  {
    title: '3. Finalités du traitement',
    paragraphs: [
      'Les données collectées sont utilisées aux fins suivantes :',
    ],
    list: [
      'Fourniture et amélioration de la plateforme ScanUp',
      'Génération de bilans individuels et collectifs anonymisés',
      'Gestion des demandes de contact et de support',
      'Respect des obligations légales (LPD, RGPD)',
    ],
  },
  {
    title: '4. Base légale du traitement',
    paragraphs: [
      'Le traitement des données repose sur les bases légales suivantes : consentement de l\'utilisateur, exécution d\'un contrat, respect d\'obligations légales, et intérêt légitime de 360SkillVue Sàrl dans le cadre de l\'amélioration de ses services.',
    ],
  },
  {
    title: '5. Durée de conservation',
    paragraphs: [
      'Les données personnelles sont conservées pour la durée strictement nécessaire à l\'accomplissement des finalités décrites ci-dessus, et au maximum pendant 3 ans après la dernière interaction avec le service. Les données anonymisées peuvent être conservées indéfiniment à des fins statistiques.',
    ],
  },
  {
    title: '6. Destinataires des données',
    paragraphs: [
      'Les données personnelles ne sont ni vendues, ni louées, ni cédées à des tiers. Elles peuvent être communiquées aux sous-traitants techniques strictement nécessaires au fonctionnement de la plateforme (hébergeur, prestataires de messagerie), dans le respect des obligations de confidentialité.',
    ],
  },
  {
    title: '7. Hébergement et sécurité',
    paragraphs: [
      'Les données sont hébergées sur des serveurs certifiés HDS (Hébergeur de Données de Santé) gérés par OVHcloud, situés en France. Des mesures techniques et organisationnelles appropriées sont mises en place pour garantir la sécurité, la confidentialité et l\'intégrité des données.',
    ],
  },
  {
    title: '8. Droits des utilisateurs',
    paragraphs: [
      'Conformément à la Loi fédérale sur la protection des données (LPD) et au Règlement général sur la protection des données (RGPD), tout utilisateur dispose des droits suivants :',
    ],
    list: [
      'Droit d\'accès à ses données personnelles',
      'Droit de rectification des données inexactes',
      'Droit à l\'effacement (« droit à l\'oubli »)',
      'Droit à la portabilité des données',
      'Droit d\'opposition au traitement',
      'Droit de retrait du consentement à tout moment',
    ],
    after: 'Pour exercer ces droits, contactez : tech@360skillvue.com. Toute demande sera traitée dans un délai maximum de 30 jours.',
  },
  {
    title: '9. Cookies',
    paragraphs: [
      'Le site utilise des cookies techniques nécessaires au bon fonctionnement de la navigation. Aucun cookie publicitaire ou de traçage tiers n\'est déposé sans consentement préalable.',
      'L\'utilisateur peut gérer ses préférences cookies via les paramètres de son navigateur. Le refus des cookies techniques peut altérer certaines fonctionnalités du site.',
    ],
  },
  {
    title: '10. Transferts internationaux',
    paragraphs: [
      'Les données sont hébergées en France (Union européenne). Aucun transfert de données vers des pays tiers n\'est effectué sans garanties appropriées conformes au RGPD et à la LPD.',
    ],
  },
  {
    title: '11. Droit applicable',
    paragraphs: [
      'La présente politique de confidentialité est régie par le droit suisse. En cas de litige, les tribunaux compétents du canton de Vaud auront juridiction exclusive.',
    ],
  },
  {
    title: '12. Modifications',
    paragraphs: [
      'Cette politique peut être mise à jour à tout moment. La date de dernière mise à jour est indiquée en haut de ce document. L\'utilisation continue du site après modification vaut acceptation de la nouvelle politique.',
    ],
  },
];

export default function PolitiqueConfidentialitePage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-white font-sans text-scanup-navy flex flex-col">
      <PageMeta
        title={t.meta.confidentialite.title}
        description={t.meta.confidentialite.description}
        path="/politique-confidentialite"
      />
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="mb-12">
          <p className="text-[11px] font-semibold text-scanup-blue uppercase tracking-widest mb-3">Informations légales</p>
          <h1 className="text-[36px] font-bold tracking-tight mb-4">Politique de confidentialité</h1>
          <p className="text-[13px] text-scanup-graytext">
            Seule la version française des informations légales fait foi.<br />
            Dernière mise à jour : <strong>23 mars 2026</strong>
          </p>
          <div className="flex gap-4 mt-4">
            <Link to="/mentions-legales" className="text-[13px] text-scanup-blue hover:underline font-medium">Mentions légales</Link>
            <Link to="/cgu" className="text-[13px] text-scanup-blue hover:underline font-medium">CGU</Link>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {SECTIONS.map((section, i) => (
            <section key={i} className="border-t border-black/[0.07] pt-8">
              <h2 className="text-[17px] font-semibold mb-4">{section.title}</h2>

              {section.content && (
                <dl className="space-y-2 mb-4">
                  {section.content.map((row, j) => (
                    <div key={j} className="flex flex-col sm:flex-row sm:gap-4">
                      <dt className="text-[13px] font-medium text-scanup-navy/60 sm:w-48 flex-shrink-0">{row.label}</dt>
                      <dd className="text-[13px] text-scanup-navy">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {section.paragraphs && (
                <div className="space-y-3 mb-3">
                  {section.paragraphs.map((p, j) => (
                    <p key={j} className="text-[14px] text-scanup-graytext leading-relaxed">{p}</p>
                  ))}
                </div>
              )}

              {section.list && (
                <ul className="space-y-1.5 mb-3 pl-4">
                  {section.list.map((item, j) => (
                    <li key={j} className="text-[14px] text-scanup-graytext leading-relaxed flex gap-2">
                      <span className="text-scanup-blue flex-shrink-0">—</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}

              {section.after && (
                <p className="text-[14px] text-scanup-graytext leading-relaxed mt-3">{section.after}</p>
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
