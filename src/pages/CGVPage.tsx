import React from 'react';
import { useLanguage } from '../i18n';
import { Link } from '../i18n/Link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';

const SECTIONS = [
  {
    title: '1. Identification du vendeur',
    paragraphs: [
      "Le vendeur dépend du pays du Client : pour un Client établi en France, le contrat est conclu avec 360skillvue SAS ; pour un Client établi en Suisse ou dans un autre pays, avec 360skillvue Sàrl. Chacune est désignée ci-après « le Vendeur ». Le devis indique la société concernée.",
    ],
    content: [
      { label: 'Clients en France', value: '360skillvue, société par actions simplifiée à associé unique au capital de 20 000 €, siège social 122 rue Amelot, 75011 Paris, France, RCS Paris 951 352 384' },
      { label: 'Clients en Suisse et hors de France', value: '360skillvue Sàrl, société à responsabilité limitée de droit suisse au capital de CHF 20 000, siège Route de Crassier 7, 1262 Eysins (VD), Suisse, IDE CHE-451.592.837' },
      { label: 'E-mail', value: 'hello@360skillvue.com' },
      { label: 'Site web', value: 'https://360skillvue.com/' },
    ],
  },
  {
    title: '2. Objet',
    paragraphs: [
      "Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles entre le Vendeur et toute personne morale ou physique souhaitant procéder à l'achat d'une offre commerciale ScanUp, ci-après « le Client ».",
      "Toute commande implique l'acceptation pleine et entière des présentes CGV, qui prévalent sur toute autre condition à l'exception de celles expressément acceptées par écrit par le Vendeur.",
    ],
  },
  {
    title: '3. Offres et tarification',
    paragraphs: [
      "Les offres commerciales (dépistages, livrables, formations et prestations associées) sont présentées sur le site 360skillvue.com ou dans les devis transmis par voie électronique.",
      "Les prix sont indiqués en euros (EUR) pour les clients en France et en francs suisses (CHF) ou en euros pour les autres clients, hors taxes, sauf mention contraire. Les tarifs applicables sont ceux en vigueur à la date de confirmation de la commande.",
      "Le Vendeur se réserve le droit de modifier ses tarifs à tout moment, sans que cela affecte les commandes déjà confirmées.",
    ],
  },
  {
    title: '4. Commande et formation du contrat',
    paragraphs: [
      "La commande est ferme et définitive dès la signature d'un devis par le Client. Un e-mail de confirmation récapitulatif est envoyé au Client.",
      "Le Vendeur se réserve le droit de refuser toute commande pour des motifs légitimes (insolvabilité, non-conformité aux conditions d'utilisation, etc.).",
    ],
  },
  {
    title: '5. Session de dépistage et facturation',
    paragraphs: [
      "Sauf mention contraire dans le devis, la prestation prend la forme d'une session d'un ou trois mois, ouverte au Client pour mener sa campagne de dépistage.",
      "La facturation intervient à la fin de la session, sur la base du nombre de dépistages réellement réalisés et des livrables commandés, au tarif indiqué dans le devis. Il n'y a ni abonnement ni engagement de durée.",
    ],
  },
  {
    title: '6. Modalités de paiement',
    paragraphs: [
      "Le paiement s'effectue par virement bancaire ou tout autre moyen accepté et précisé sur la facture.",
      "Sauf accord particulier, les factures sont payables à 30 jours à compter de leur date d'émission. Pour les clients en France, tout retard de paiement entraîne de plein droit l'application de pénalités de retard au taux prévu à l'article L. 441-10 du Code de commerce et d'une indemnité forfaitaire pour frais de recouvrement de 40 €. Pour les autres clients, des intérêts moratoires au taux légal suisse sont dus, ainsi qu'une indemnité forfaitaire de CHF 40 pour frais de recouvrement.",
    ],
  },
  {
    title: '7. Accès au service',
    paragraphs: [
      "La plateforme ScanUp est un service en ligne accessible via un navigateur web. L'accès est ouvert au Client dans un délai de 48 heures ouvrées suivant la confirmation de commande.",
      "Les identifiants de connexion sont transmis par e-mail à l'adresse indiquée lors de la commande. Le Client est responsable de la confidentialité de ses accès.",
    ],
  },
  {
    title: '8. Droit de rétractation',
    paragraphs: [
      "Les offres ScanUp s'adressent aux professionnels. Lorsque la réglementation applicable reconnaît au Client un droit de rétractation (directive européenne 2011/83/UE pour les consommateurs de l'Union européenne), il dispose d'un délai de 14 jours calendaires à compter de la commande pour l'exercer, sans avoir à en justifier les motifs.",
      "Ce droit ne s'applique pas aux services dont l'exécution a commencé avec l'accord exprès du Client avant l'expiration du délai de rétractation.",
      "Pour exercer ce droit, le Client doit notifier sa décision par e-mail à : hello@360skillvue.com.",
    ],
  },
  {
    title: '9. Durée et résiliation',
    paragraphs: [
      "Le contrat prend fin à l'issue de la session et de la remise des livrables commandés, sauf durée différente prévue au devis.",
      "En cas de manquement grave aux CGU ou aux CGV non remédié dans un délai de 15 jours suivant mise en demeure, le Vendeur se réserve le droit de suspendre ou résilier le contrat sans indemnité.",
    ],
  },
  {
    title: '10. Responsabilité et garanties',
    paragraphs: [
      "Le Vendeur s'engage à fournir la plateforme ScanUp avec une disponibilité cible de 99,5 % (hors maintenances planifiées).",
      "La responsabilité du Vendeur est limitée aux dommages directs et ne peut excéder le montant total des sommes versées par le Client au cours des 12 derniers mois précédant le sinistre.",
      "Le Vendeur ne saurait être tenu responsable des dommages indirects, pertes d'exploitation ou de données imputables à une mauvaise utilisation du service ou à des causes extérieures.",
    ],
  },
  {
    title: '11. Propriété intellectuelle',
    paragraphs: [
      "L'ensemble des éléments constituant la plateforme ScanUp (interfaces, contenus, questionnaires, bases de données) est la propriété exclusive de 360skillvue Sàrl ou de ses partenaires et est protégé par les droits de propriété intellectuelle applicables.",
      "Le Client bénéficie d'une licence d'utilisation non exclusive et non transférable pour la durée du contrat et dans le seul cadre de son activité professionnelle interne.",
    ],
  },
  {
    title: '12. Protection des données personnelles',
    paragraphs: [
      "Dans le cadre de l'exécution du contrat, le Vendeur traite des données personnelles en qualité de sous-traitant au sens du RGPD. Un accord de traitement des données (DPA) est disponible sur demande.",
      "La politique de confidentialité détaillée est consultable à l'adresse : https://360skillvue.com/politique-confidentialite.",
    ],
  },
  {
    title: '13. Droit applicable et règlement des litiges',
    paragraphs: [
      "En cas de litige, les parties s'efforceront de trouver une solution amiable.",
      "Les contrats conclus avec 360skillvue SAS sont soumis au droit français ; à défaut d'accord amiable, les tribunaux compétents de Paris auront juridiction exclusive.",
      "Les contrats conclus avec 360skillvue Sàrl sont soumis au droit suisse ; à défaut d'accord amiable, les tribunaux compétents du canton de Vaud (Suisse) auront juridiction exclusive.",
      "Pour les clients consommateurs résidant dans l'Union européenne, les dispositions impératives du droit de la consommation applicable dans leur pays de résidence demeurent en vigueur.",
    ],
  },
  {
    title: '14. Mise à jour',
    paragraphs: [
      "Le Vendeur se réserve le droit de modifier les présentes CGV à tout moment. Les nouvelles CGV seront notifiées au Client avec un préavis de 30 jours et s'appliqueront aux contrats conclus postérieurement à leur entrée en vigueur.",
    ],
  },
];

export default function CGVPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-white font-sans text-scanup-navy flex flex-col">
      <PageMeta
        title={t.meta.cgv.title}
        description={t.meta.cgv.description}
        path="/cgv"
        noindexTranslations
      />
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-6 py-20 w-full">
        {/* Header */}
        <div className="mb-12">
          <p className="text-[11px] font-semibold text-scanup-blue uppercase tracking-widest mb-3">{t.legal.label}</p>
          <h1 className="text-[36px] font-bold tracking-tight mb-4">{t.meta.cgv.title}</h1>
          <p className="text-[13px] text-scanup-graytext">
            {t.legal.frenchOnly}<br />
            {t.legal.lastUpdated} <strong>{t.legal.updatedOn}</strong>
          </p>
          <div className="flex flex-wrap gap-4 mt-4">
            <Link to="/cgu" className="text-[13px] text-scanup-blue hover:underline font-medium">{t.footer.cgu}</Link>
            <Link to="/mentions-legales" className="text-[13px] text-scanup-blue hover:underline font-medium">{t.footer.legal}</Link>
            <Link to="/politique-confidentialite" className="text-[13px] text-scanup-blue hover:underline font-medium">{t.footer.privacy}</Link>
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
          <Link to="/" className="text-[13px] text-scanup-blue hover:underline">{t.legal.backHome}</Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
