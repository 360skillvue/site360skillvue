<?php

/**
 * Plugin Name: Pipedrive Leaflet Map Integration - Version 7.4 avec Filtre "France"
 * Description: Affiche tous les contacts Pipedrive avec pagination, gestion des doublons et masquage des localisations "France"
 * Version: 7.4
 * Author: Tech Team 360SkillVue
 * Text Domain: pipedrive-leaflet
 */

// Sécurité : Empêcher l'accès direct au fichier
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// --- Section 0: Traductions multilingues mises à jour ---
function pipedrive_get_translations() {
    // Forcer le français sur la page suisse
    $current_url = $_SERVER['REQUEST_URI'] ?? '';
    $is_swiss_page = (strpos($current_url, '/ch/') !== false);

    $lang = $is_swiss_page ? 'fr_FR' : get_locale();

    $translations = [
        'fr_FR' => [
            'map_title' => 'Carte des Professionnels',
            'professionals' => 'Professionnels',
            'formation' => 'Formation Qualiopi',
            'materiel' => 'Matériel Ergonomique',
            'ergonome_presentiel' => 'Ergonome Présentiel',
            'psychologue_presentiel' => 'Psychologue Présentiel',
            'consultant_prevention' => 'Consultant Prévention',
            'non_defini' => 'Sans compétence définie',
            'filter_by' => 'Filtrer par compétence :',
            'all' => 'Toutes',
            'list_title' => 'Rechercher par localisation',
            'no_data' => 'Aucun professionnel disponible pour le moment.',
            'check_config' => 'Vérifiez la configuration de l\'API Pipedrive.',
            'search_placeholder' => 'Rechercher un professionnel...',
            'location_na' => 'Lieu non précisé',
            'loading' => 'Chargement...',
            'multiple_competences' => 'Compétences multiples',
            'company' => 'Entreprise',
            'activity_description' => 'Descriptif activité',
            'email' => 'Email',
            'phone' => 'Téléphone',
            'website' => 'Site web',
            'contact_info' => 'Informations de contact',
            'no_company' => 'Entreprise non renseignée',
            'no_description' => 'Descriptif non disponible',
            'no_email' => 'Email non renseigné',
            'no_phone' => 'Téléphone non renseigné',
            'no_website' => 'Site web non renseigné',
            'competences' => 'Compétences',
            'professionals_in_location' => 'professionnels dans cette zone',
            'see_all' => 'Voir tous',
            'cluster_popup_title' => 'Professionnels regroupés'
        ],
        'en_US' => [
            'map_title' => 'Professionals Map',
            'professionals' => 'Professionals',
            'formation' => 'Qualiopi Training',
            'materiel' => 'Ergonomic Equipment',
            'ergonome_presentiel' => 'In-Person Ergonomist',
            'psychologue_presentiel' => 'In-Person Psychologist',
            'consultant_prevention' => 'Prevention Consultant',
            'non_defini' => 'No defined skills',
            'filter_by' => 'Filter by skill:',
            'all' => 'All',
            'list_title' => 'Professionals list',
            'no_data' => 'No professionals available at the moment.',
            'check_config' => 'Please check Pipedrive API configuration.',
            'search_placeholder' => 'Search for a professional...',
            'location_na' => 'Location not specified',
            'loading' => 'Loading...',
            'multiple_competences' => 'Multiple skills',
            'company' => 'Company',
            'activity_description' => 'Activity description',
            'email' => 'Email',
            'phone' => 'Phone',
            'website' => 'Website',
            'contact_info' => 'Contact information',
            'no_company' => 'Company not specified',
            'no_description' => 'Description not available',
            'no_email' => 'Email not provided',
            'no_phone' => 'Phone not provided',
            'no_website' => 'Website not provided',
            'competences' => 'Skills',
            'professionals_in_location' => 'professionals in this area',
            'see_all' => 'See all',
            'cluster_popup_title' => 'Grouped Professionals'
        ],
        'default' => [
            'map_title' => 'Professionals Map',
            'professionals' => 'Professionals',
            'formation' => 'Qualiopi Training',
            'materiel' => 'Ergonomic Equipment',
            'ergonome_presentiel' => 'In-Person Ergonomist',
            'psychologue_presentiel' => 'In-Person Psychologist',
            'consultant_prevention' => 'Prevention Consultant',
            'non_defini' => 'No defined skills',
            'filter_by' => 'Filter by skill:',
            'all' => 'All',
            'list_title' => 'Professionals list',
            'no_data' => 'No professionals available.',
            'check_config' => 'Check API configuration.',
            'search_placeholder' => 'Search...',
            'location_na' => 'Location N/A',
            'loading' => 'Loading...',
            'multiple_competences' => 'Multiple skills',
            'company' => 'Company',
            'activity_description' => 'Activity description',
            'email' => 'Email',
            'phone' => 'Phone',
            'website' => 'Website',
            'contact_info' => 'Contact information',
            'no_company' => 'Company N/A',
            'no_description' => 'Description N/A',
            'no_email' => 'Email N/A',
            'no_phone' => 'Phone N/A',
            'no_website' => 'Website N/A',
            'competences' => 'Skills',
            'professionals_in_location' => 'professionals in this area',
            'see_all' => 'See all',
            'cluster_popup_title' => 'Grouped Professionals'
        ]
    ];
    
    return $translations[$lang] ?? $translations['default'];
}

// --- Section 1: Styles CSS mis à jour avec support pour les clusters ---

add_action('wp_head', 'pipedrive_map_360_styles');
function pipedrive_map_360_styles() {
    ?>
    <style>
        /* Variables CSS pour les compétences */
        :root {
            --360-blue: #0063DC;
            --360-blue-dark: #004ba0;
            --360-gray-light: #f7f7f7;
            --360-gray: #e9ecef;
            --360-gray-dark: #6c757d;
            --360-text: #333333;
            --360-formation: #2ecc71;
            --360-materiel: #e67e22;
            --360-ergonome-presentiel: #e74c3c;
            --360-psychologue-presentiel: #3498db;
            --360-consultant-prevention: #9b59b6;
            --360-multiple: #2c3e50;
            --360-non-defini: #95a5a6;
            --360-shadow: 0 2px 10px rgba(0,0,0,0.1);
            --360-radius: 8px;
            --360-transition: all 0.3s ease;
        }

        /* Conteneur principal */
        .pipedrive-map-container-360 {
            background: white;
            border-radius: var(--360-radius);
            box-shadow: var(--360-shadow);
            overflow: hidden;
            margin: 30px 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            min-height: 1000px;
        }

        /* En-tête */
        .pipedrive-map-header-360 {
            background: var(--360-gray-light);
            padding: 15px;
            text-align: center;
            border-bottom: 1px solid var(--360-gray);
        }

        .pipedrive-map-title-360 {
            color: var(--360-text);
            font-size: 1.6rem;
            font-weight: 600;
            margin: 0;
            letter-spacing: -0.5px;
        }

        /* Section des statistiques */
        .pipedrive-stats-section-360 {
            background: white;
            padding: 10px 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 15px;
            flex-wrap: wrap;
            border-bottom: 1px solid var(--360-gray);
        }

        .stat-item-360 {
            text-align: center;
            min-width: 70px;
        }

        .stat-number-360 {
            font-size: 1.4rem;
            font-weight: 700;
            color: var(--360-blue);
            line-height: 1;
            margin: 0;
        }

        .stat-label-360 {
            font-size: 0.7rem;
            color: var(--360-gray-dark);
            margin-top: 3px;
        }

        /* Couleurs spécifiques pour chaque compétence dans les stats */
        .stat-item-360.formation .stat-number-360 { color: var(--360-formation); }
        .stat-item-360.materiel .stat-number-360 { color: var(--360-materiel); }
        .stat-item-360.ergonome_presentiel .stat-number-360 { color: var(--360-ergonome-presentiel); }
        .stat-item-360.psychologue_presentiel .stat-number-360 { color: var(--360-psychologue-presentiel); }
        .stat-item-360.consultant_prevention .stat-number-360 { color: var(--360-consultant-prevention); }
        .stat-item-360.multiple .stat-number-360 { color: var(--360-multiple); }
        .stat-item-360.non_defini .stat-number-360 { color: var(--360-non-defini); }

        /* Section des filtres */
        .pipedrive-filters-section-360 {
            background: var(--360-gray-light);
            padding: 8px 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            flex-wrap: wrap;
            border-bottom: 1px solid var(--360-gray);
        }

        .filter-label-360 {
            font-size: 0.85rem;
            color: var(--360-gray-dark);
            font-weight: 500;
            margin-right: 8px;
        }

        .filter-btn-360 {
            background: white;
            border: 1px solid #ddd;
            color: var(--360-text);
            padding: 5px 12px;
            border-radius: 20px;
            cursor: pointer;
            transition: var(--360-transition);
            font-weight: 500;
            font-size: 0.8rem;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            white-space: nowrap;
        }

        .filter-btn-360:hover {
            background: var(--360-gray-light);
            border-color: var(--360-blue);
            transform: translateY(-1px);
        }

        .filter-btn-360.active {
            background: var(--360-blue);
            color: white;
            border-color: var(--360-blue);
            box-shadow: 0 2px 4px rgba(0, 99, 220, 0.3);
        }

        /* Couleurs actives pour chaque compétence */
        .filter-btn-360.active.formation { background: var(--360-formation); border-color: var(--360-formation); }
        .filter-btn-360.active.materiel { background: var(--360-materiel); border-color: var(--360-materiel); }
        .filter-btn-360.active.ergonome_presentiel { background: var(--360-ergonome-presentiel); border-color: var(--360-ergonome-presentiel); }
        .filter-btn-360.active.psychologue_presentiel { background: var(--360-psychologue-presentiel); border-color: var(--360-psychologue-presentiel); }
        .filter-btn-360.active.consultant_prevention { background: var(--360-consultant-prevention); border-color: var(--360-consultant-prevention); }
        .filter-btn-360.active.multiple { background: var(--360-multiple); border-color: var(--360-multiple); }
        .filter-btn-360.active.non_defini { background: var(--360-non-defini); border-color: var(--360-non-defini); }

        /* Section principale avec carte */
        .pipedrive-content-section-360 {
            display: grid;
            grid-template-columns: 1fr 350px;
            background: white;
            min-height: 900px;
        }

        /* Carte */
        .pipedrive-map-wrapper-360 {
            position: relative;
            background: #f0f0f0;
            min-height: 900px;
        }

        .pipedrive-map-wrapper-360 .leaflet-container {
            height: 100%;
            min-height: 900px;
        }

        /* Liste des professionnels */
        .pipedrive-list-section-360 {
            background: var(--360-gray-light);
            border-left: 1px solid var(--360-gray);
            overflow-y: auto;
            max-height: 900px;
        }

        .pipedrive-list-header-360 {
            background: white;
            padding: 12px 15px;
            position: sticky;
            top: 0;
            z-index: 10;
            border-bottom: 1px solid var(--360-gray);
        }

        .pipedrive-list-title-360 {
            font-size: 1rem;
            font-weight: 600;
            margin: 0 0 10px 0;
            color: var(--360-text);
        }

        .pipedrive-list-search-360 {
            width: 100%;
            padding: 6px 12px;
            border: 1px solid #ddd;
            border-radius: 20px;
            font-size: 0.85rem;
            transition: var(--360-transition);
        }

        .pipedrive-list-search-360:focus {
            outline: none;
            border-color: var(--360-blue);
            box-shadow: 0 0 0 3px rgba(0, 99, 220, 0.1);
        }

        .pipedrive-list-content-360 {
            padding: 8px;
            display: flex;
            flex-direction: column;
        }

        /* Items de la liste */
        .professional-item-360 {
            background: white;
            border-radius: var(--360-radius);
            padding: 12px 14px;
            margin-bottom: 8px;
            cursor: pointer;
            transition: var(--360-transition);
            border: 1px solid transparent;
            display: block;
        }

        .professional-item-360:hover {
            transform: translateX(3px);
            box-shadow: var(--360-shadow);
            border-color: var(--360-gray);
        }

        .professional-item-360.highlighted {
            border-color: var(--360-blue);
            box-shadow: 0 0 0 2px rgba(0, 99, 220, 0.2);
            background: #f8f9ff;
        }

        .professional-item-360.filtered-hidden {
            display: none !important;
        }

        /* Header de chaque item */
        .professional-header-360 {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
        }

        .professional-icon-360 {
            font-size: 16px;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            flex-shrink: 0;
        }

        /* Icônes pour toutes les compétences */
        .professional-icon-360.formation { background: rgba(46, 204, 113, 0.1); }
        .professional-icon-360.materiel { background: rgba(230, 126, 34, 0.1); }
        .professional-icon-360.ergonome_presentiel { background: rgba(231, 76, 60, 0.1); }
        .professional-icon-360.psychologue_presentiel { background: rgba(52, 152, 219, 0.1); }
        .professional-icon-360.consultant_prevention { background: rgba(155, 89, 182, 0.1); }
        .professional-icon-360.multiple { background: linear-gradient(45deg, rgba(46, 204, 113, 0.1), rgba(231, 76, 60, 0.1)); }
        .professional-icon-360.non_defini { background: rgba(149, 165, 166, 0.1); }

        .professional-name-360 {
            font-weight: 600;
            color: var(--360-text);
            margin: 0;
            font-size: 0.95rem;
            flex: 1;
        }

        /* Informations détaillées */
        .professional-details-360 {
            margin-left: 42px;
        }

        .professional-company-360 {
            font-size: 0.8rem;
            color: var(--360-blue);
            font-weight: 500;
            margin-bottom: 4px;
        }

        .professional-competences-360 {
            font-size: 0.7rem;
            color: var(--360-gray-dark);
            margin-bottom: 4px;
        }

        .professional-location-360 {
            font-size: 0.75rem;
            color: var(--360-gray-dark);
            display: flex;
            align-items: center;
            gap: 3px;
            margin-bottom: 6px;
        }

        /* Tags pour compétences multiples */
        .professional-competences-tags-360 {
            display: flex;
            flex-wrap: wrap;
            gap: 3px;
            margin-bottom: 6px;
        }

        .competence-tag-360 {
            font-size: 0.6rem;
            padding: 1px 5px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
        }

        .competence-tag-360.formation { background: var(--360-formation); }
        .competence-tag-360.materiel { background: var(--360-materiel); }
        .competence-tag-360.ergonome_presentiel { background: var(--360-ergonome-presentiel); }
        .competence-tag-360.psychologue_presentiel { background: var(--360-psychologue-presentiel); }
        .competence-tag-360.consultant_prevention { background: var(--360-consultant-prevention); }
        .competence-tag-360.non_defini { background: var(--360-non-defini); }

        /* Informations de contact */
        .professional-contact-360 {
            font-size: 0.7rem;
            color: var(--360-gray-dark);
            margin-bottom: 2px;
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .professional-contact-360 .contact-icon {
            width: 12px;
            text-align: center;
        }

        .professional-contact-360 a {
            color: var(--360-blue);
            text-decoration: none;
        }

        .professional-contact-360 a:hover {
            text-decoration: underline;
        }

        /* Descriptif d'activité */
        .professional-description-360 {
            font-size: 0.7rem;
            color: var(--360-gray-dark);
            margin-top: 6px;
            padding-top: 6px;
            border-top: 1px solid #eee;
            line-height: 1.3;
            max-height: 60px;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* NOUVEAUX STYLES POUR LES POPUPS CLUSTER */
        .cluster-popup-360 {
            padding: 18px 22px;
            text-align: left;
            min-width: 300px;
            max-width: 400px;
        }

        .cluster-popup-header-360 {
            text-align: center;
            margin-bottom: 15px;
            padding-bottom: 12px;
            border-bottom: 2px solid var(--360-blue);
        }

        .cluster-popup-title-360 {
            font-size: 1.2rem;
            font-weight: 600;
            color: var(--360-blue);
            margin: 0 0 8px;
        }

        .cluster-popup-count-360 {
            font-size: 0.9rem;
            color: var(--360-gray-dark);
            margin: 0;
        }

        .cluster-professionals-list-360 {
            max-height: 300px;
            overflow-y: auto;
        }

        .cluster-professional-item-360 {
            border: 1px solid #eee;
            border-radius: var(--360-radius);
            padding: 12px;
            margin-bottom: 8px;
            background: #fafafa;
        }

        .cluster-professional-item-360:last-child {
            margin-bottom: 0;
        }

        .cluster-professional-header-360 {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
        }

        .cluster-professional-icon-360 {
            font-size: 16px;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            flex-shrink: 0;
        }

        .cluster-professional-name-360 {
            font-weight: 600;
            color: var(--360-text);
            margin: 0;
            font-size: 0.9rem;
            flex: 1;
        }

        .cluster-professional-details-360 {
            margin-left: 38px;
        }

        .cluster-professional-company-360 {
            font-size: 0.8rem;
            color: var(--360-blue);
            font-weight: 500;
            margin-bottom: 4px;
        }

        .cluster-professional-competences-360 {
            display: flex;
            flex-wrap: wrap;
            gap: 3px;
            margin-bottom: 6px;
        }

        .cluster-competence-tag-360 {
            font-size: 0.6rem;
            padding: 1px 6px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
        }

        .cluster-professional-contact-360 {
            font-size: 0.7rem;
            color: var(--360-gray-dark);
            margin-bottom: 2px;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .cluster-professional-contact-360 a {
            color: var(--360-blue);
            text-decoration: none;
        }

        .cluster-professional-contact-360 a:hover {
            text-decoration: underline;
        }

        /* Popup personnalisé standard */
        .leaflet-popup-content-wrapper {
            border-radius: var(--360-radius);
            box-shadow: var(--360-shadow);
        }

        .leaflet-popup-content {
            margin: 0;
            min-width: 280px;
        }

        .professional-popup-360 {
            padding: 18px 22px;
            text-align: left;
            min-width: 260px;
        }

        .popup-header-360 {
            text-align: center;
            margin-bottom: 12px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }

        .popup-icon-360 {
            font-size: 28px;
            margin-bottom: 8px;
        }

        .popup-name-360 {
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--360-text);
            margin: 0 0 6px;
        }

        .popup-company-360 {
            font-size: 0.9rem;
            color: var(--360-blue);
            font-weight: 500;
            margin-bottom: 8px;
        }

        .popup-competences-360 {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 4px;
            margin-bottom: 8px;
        }

        .popup-competence-360 {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 0.7rem;
            font-weight: 500;
            color: white;
        }

        /* Couleurs des popups pour toutes les compétences */
        .popup-competence-360.formation { background: var(--360-formation); }
        .popup-competence-360.materiel { background: var(--360-materiel); }
        .popup-competence-360.ergonome_presentiel { background: var(--360-ergonome-presentiel); }
        .popup-competence-360.psychologue_presentiel { background: var(--360-psychologue-presentiel); }
        .popup-competence-360.consultant_prevention { background: var(--360-consultant-prevention); }
        .popup-competence-360.non_defini { background: var(--360-non-defini); }

        .popup-info-section-360 {
            margin-top: 12px;
        }

        .popup-info-item-360 {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 6px;
            font-size: 0.8rem;
        }

        .popup-info-icon-360 {
            width: 16px;
            text-align: center;
            color: var(--360-gray-dark);
        }

        .popup-info-item-360 a {
            color: var(--360-blue);
            text-decoration: none;
        }

        .popup-info-item-360 a:hover {
            text-decoration: underline;
        }

        .popup-description-360 {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #eee;
            font-size: 0.75rem;
            color: var(--360-gray-dark);
            line-height: 1.4;
            max-height: 80px;
            overflow-y: auto;
        }

        /* Chargement */
        .pipedrive-loading-360 {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 60px;
            flex-direction: column;
            gap: 20px;
        }

        .loading-spinner-360 {
            width: 40px;
            height: 40px;
            border: 3px solid var(--360-gray);
            border-top: 3px solid var(--360-blue);
            border-radius: 50%;
            animation: spin360 1s linear infinite;
        }

        @keyframes spin360 {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* Message vide */
        .pipedrive-empty-360 {
            text-align: center;
            padding: 40px;
            color: var(--360-gray-dark);
        }

        /* Marqueurs cachés par les filtres */
        .leaflet-marker-icon.filtered-hidden {
            display: none !important;
        }

        .leaflet-marker-shadow.filtered-hidden {
            display: none !important;
        }

        .leaflet-interactive.filtered-hidden {
            display: none !important;
        }

        /* Indicateur de pagination */
        .pagination-status-360 {
            background: #e3f2fd;
            padding: 8px 15px;
            border-bottom: 1px solid var(--360-gray);
            text-align: center;
            font-size: 0.8rem;
            color: var(--360-gray-dark);
        }

        .pagination-progress-360 {
            background: var(--360-blue);
            height: 3px;
            border-radius: 2px;
            transition: width 0.3s ease;
        }

        /* Responsive */
        @media (max-width: 1400px) {
            .pipedrive-content-section-360 {
                grid-template-columns: 1fr 320px;
            }
        }

        @media (max-width: 1200px) {
            .pipedrive-content-section-360 {
                grid-template-columns: 1fr 300px;
            }
        }

        @media (max-width: 1024px) {
            .pipedrive-content-section-360 {
                grid-template-columns: 1fr;
                min-height: 700px;
            }

            .pipedrive-list-section-360 {
                border-left: none;
                border-top: 1px solid var(--360-gray);
                max-height: 400px;
            }

            .pipedrive-map-wrapper-360 {
                min-height: 600px;
            }

            .pipedrive-map-wrapper-360 .leaflet-container {
                min-height: 600px;
            }
        }

        @media (max-width: 768px) {
            .pipedrive-map-container-360 {
                min-height: 700px;
            }

            .pipedrive-map-title-360 {
                font-size: 1.4rem;
            }

            .pipedrive-stats-section-360 {
                gap: 12px;
                padding: 8px;
            }

            .stat-number-360 {
                font-size: 1.2rem;
            }

            .stat-label-360 {
                font-size: 0.65rem;
            }

            .filter-btn-360 {
                padding: 4px 10px;
                font-size: 0.75rem;
            }

            .pipedrive-content-section-360 {
                min-height: 600px;
            }

            .pipedrive-map-wrapper-360 {
                min-height: 500px;
            }

            .pipedrive-map-wrapper-360 .leaflet-container {
                min-height: 500px;
            }

            .professional-item-360 {
                padding: 10px 12px;
            }

            .professional-details-360 {
                margin-left: 38px;
            }

            .professional-popup-360 {
                min-width: 240px;
                padding: 15px 18px;
            }

            .cluster-popup-360 {
                min-width: 280px;
                max-width: 320px;
            }
        }
    </style>
    <?php
}

// --- Section 2: Pages d'options (inchangées) ---

add_action('admin_menu', 'pipedrive_map_settings_page');
function pipedrive_map_settings_page() {
    add_options_page(
        'Pipedrive Leaflet Map Settings',
        'Pipedrive Map',
        'manage_options',
        'pipedrive-map-settings',
        'pipedrive_map_settings_page_html'
    );
}

function pipedrive_map_settings_page_html() {
    if (!current_user_can('manage_options')) {
        return;
    }
    ?>
    <div class="wrap">
        <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
        <form action="options.php" method="post">
            <?php
            settings_fields('pipedrive_map_options_group');
            do_settings_sections('pipedrive-map-settings');
            submit_button('Enregistrer les modifications');
            ?>
        </form>
        
        <hr>
        <h2>Debug</h2>
        <p>Cliquez sur le bouton ci-dessous pour vérifier les données récupérées depuis Pipedrive :</p>
        <button type="button" class="button" onclick="window.location.href='<?php echo admin_url('admin.php?page=pipedrive-map-settings&debug=1'); ?>'">
            Afficher les données de debug
        </button>
        
        <?php if (isset($_GET['debug'])): ?>
            <div style="margin-top: 20px; padding: 20px; background: #f0f0f0; border: 2px solid #0063DC; margin: 20px 0; border-radius: 8px;">
                <h3>Données de debug</h3>
                <?php pipedrive_debug_data(); ?>
            </div>
        <?php endif; ?>
    </div>
    <?php
}

add_action('admin_init', 'pipedrive_map_settings_init');
function pipedrive_map_settings_init() {
    register_setting('pipedrive_map_options_group', 'pipedrive_api_key');

    add_settings_section(
        'pipedrive_map_section_api',
        'Configuration API Pipedrive',
        null,
        'pipedrive-map-settings'
    );

    add_settings_field(
        'pipedrive_api_key_field',
        'Clé API Pipedrive',
        'pipedrive_api_key_field_cb',
        'pipedrive-map-settings',
        'pipedrive_map_section_api',
        [
            'label_for' => 'pipedrive_api_key_id',
            'class' => 'pipedrive_map_row',
        ]
    );
}

function pipedrive_api_key_field_cb($args) {
    $option = get_option('pipedrive_api_key');
    ?>
    <input type="text" id="<?php echo esc_attr($args['label_for']); ?>"
           name="pipedrive_api_key" value="<?php echo esc_attr($option); ?>" style="width: 400px;">
    <p class="description">
        Entrez votre clé API Pipedrive. Trouvez-la dans Pipedrive > Préférences personnelles > API.
    </p>
    <?php
}

// --- Section 3: Fonction de géocodage (inchangée) ---

function geocode_address_with_nominatim($address_string) {
    if (empty($address_string)) {
        return null;
    }

    $transient_key = 'geo_' . md5(strtolower($address_string));
    $cached_coords = get_transient($transient_key);

    if (false !== $cached_coords) {
        if ($cached_coords === 'not_found') return null;
        return $cached_coords;
    }

    $email_for_user_agent = 'tech@360skillvue.com';
    
    $url = 'https://nominatim.openstreetmap.org/search?q=' . urlencode($address_string) . '&format=json&limit=1&email=' . urlencode($email_for_user_agent);
    
    $args = [
        'user-agent' => 'WordPress Pipedrive Map Plugin/7.4 (' . $email_for_user_agent . ')',
        'timeout' => 60,
    ];

    $response = wp_remote_get($url, $args);
    sleep(1);

    if (is_wp_error($response)) {
        error_log('Erreur Nominatim: ' . $response->get_error_message());
        return null;
    }
    
    $response_code = wp_remote_retrieve_response_code($response);
    if ($response_code != 200) {
        set_transient($transient_key, 'not_found', HOUR_IN_SECONDS);
        return null;
    }

    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);

    if (!empty($data) && isset($data[0]['lat'], $data[0]['lon'])) {
        $coordinates = [
            'lat' => $data[0]['lat'],
            'lng' => $data[0]['lon'],
            'display_name' => $data[0]['display_name'] ?? '',
            'country' => $data[0]['address']['country'] ?? ''
        ];
        set_transient($transient_key, $coordinates, WEEK_IN_SECONDS);
        return $coordinates;
    }

    set_transient($transient_key, 'not_found', 3 * HOUR_IN_SECONDS);
    return null;
}

// --- Section 4: Fonction helper pour les marqueurs par compétences ---

function get_marker_icon_url($primary_competence) {
    $icon_mapping = [
        'formation' => 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
        'materiel' => 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
        'ergonome_presentiel' => 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        'psychologue_presentiel' => 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
        'consultant_prevention' => 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
        'multiple' => 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-black.png',
        'non_defini' => 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
        'cluster' => 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png'
    ];
    
    return $icon_mapping[$primary_competence] ?? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon.png';
}

// --- Section 5: Fonction pour valider et formater les URLs ---

function format_website_url($url) {
    if (empty($url)) {
        return '';
    }
    
    // Nettoyer l'URL
    $url = trim($url);
    
    // Si l'URL ne commence pas par http:// ou https://, ajouter https://
    if (!preg_match('/^https?:\/\//', $url)) {
        $url = 'https://' . $url;
    }
    
    // Valider l'URL
    if (filter_var($url, FILTER_VALIDATE_URL)) {
        return $url;
    }
    
    return '';
}

// --- Section 6: NOUVELLE FONCTION DE PAGINATION AUTOMATIQUE ---

/**
 * Récupère TOUS les contacts Pipedrive avec pagination automatique
 * Fait des appels successifs par lots de 500 jusqu'à avoir tout récupéré
 */
function fetch_all_pipedrive_contacts_with_pagination($pipedrive_api_key, $pipedrive_domain) {
    $all_contacts = [];
    $start = 0;
    $limit = 500;
    $has_more = true;
    $total_calls = 0;
    $max_calls = 50; // Sécurité : limite à 25000 contacts maximum
    
    error_log("Pipedrive Map v7.4: Début de la récupération avec pagination automatique");
    
    while ($has_more && $total_calls < $max_calls) {
        $total_calls++;
        
        // Construire l'URL avec pagination
        $api_url = sprintf(
            'https://%s/api/v1/persons?start=%d&limit=%d&api_token=%s',
            $pipedrive_domain,
            $start,
            $limit,
            $pipedrive_api_key
        );
        
        error_log("Pipedrive Map: Appel #{$total_calls} - Récupération de {$start} à " . ($start + $limit));
        
        // Faire l'appel API
        $api_response = wp_remote_get($api_url, ['timeout' => 60]);
        
        if (is_wp_error($api_response)) {
            error_log('Pipedrive Map: Erreur API appel #' . $total_calls . ' - ' . $api_response->get_error_message());
            break;
        }
        
        $api_response_code = wp_remote_retrieve_response_code($api_response);
        if ($api_response_code != 200) {
            error_log('Pipedrive Map: Erreur HTTP ' . $api_response_code . ' sur appel #' . $total_calls);
            break;
        }
        
        $body = wp_remote_retrieve_body($api_response);
        $pipedrive_data = json_decode($body, true);
        
        if (empty($pipedrive_data['data'])) {
            error_log("Pipedrive Map: Aucune donnée reçue sur appel #{$total_calls} - Arrêt de la pagination");
            break;
        }
        
        $batch_count = count($pipedrive_data['data']);
        error_log("Pipedrive Map: Appel #{$total_calls} - {$batch_count} contacts récupérés");
        
        // Ajouter les contacts de ce lot au tableau total
        $all_contacts = array_merge($all_contacts, $pipedrive_data['data']);
        
        // Vérifier s'il y a plus de données
        if ($batch_count < $limit) {
            // Si on a reçu moins que la limite, c'est qu'on a tout récupéré
            $has_more = false;
            error_log("Pipedrive Map: Dernier lot ({$batch_count} < {$limit}) - Fin de la pagination");
        } else {
            // Préparer le prochain appel
            $start += $limit;
            
            // Petite pause pour ne pas surcharger l'API
            sleep(1);
        }
    }
    
    error_log("Pipedrive Map: Pagination terminée - {$total_calls} appels effectués, " . count($all_contacts) . " contacts au total");
    
    return $all_contacts;
}

// --- Section 7: NOUVELLE FONCTION pour gérer les doublons de localisation ---

/**
 * Groupe les contacts par coordonnées identiques et applique des offsets
 * pour éviter la superposition des marqueurs
 */
function group_contacts_by_location($contacts) {
    $grouped_contacts = [];
    $location_groups = [];
    
    // Grouper par coordonnées (avec une tolérance de 0.001 pour les coordonnées très proches)
    foreach ($contacts as $contact) {
        $lat_key = round((float)$contact['lat'], 3);
        $lng_key = round((float)$contact['lng'], 3);
        $location_key = $lat_key . ',' . $lng_key;
        
        if (!isset($location_groups[$location_key])) {
            $location_groups[$location_key] = [];
        }
        
        $location_groups[$location_key][] = $contact;
    }
    
    error_log("Pipedrive Map v7.4: " . count($location_groups) . " groupes de localisation trouvés");
    
    foreach ($location_groups as $location_key => $group_contacts) {
        if (count($group_contacts) === 1) {
            // Localisation unique : garder tel quel
            $grouped_contacts[] = $group_contacts[0];
        } else {
            // Localisation multiple : créer des offsets en cercle
            error_log("Pipedrive Map: " . count($group_contacts) . " contacts trouvés au même endroit ({$location_key})");
            
            $base_lat = (float)$group_contacts[0]['lat'];
            $base_lng = (float)$group_contacts[0]['lng'];
            
            // Paramètres pour l'offset adaptatif
            $contact_count = count($group_contacts);
            if ($contact_count <= 3) {
                $offset_radius = 0.045; // ~5km d'écart pour petits groupes
            } elseif ($contact_count <= 6) {
                $offset_radius = 0.07; // ~7km d'écart pour groupes moyens
            } else {
                $offset_radius = 0.09; // ~9km d'écart pour gros groupes
            }

            $angle_step = (2 * M_PI) / $contact_count;
            
            foreach ($group_contacts as $index => $contact) {
                if ($index === 0) {
                    // Le premier contact garde la position originale
                    $contact['is_grouped'] = true;
                    $contact['group_size'] = count($group_contacts);
                    $contact['group_index'] = 0;
                    $grouped_contacts[] = $contact;
                } else {
                    // Les autres contacts sont décalés en spirale pour un meilleur éparpillement
                    if ($contact_count > 8) {
                        // Spirale pour les gros groupes
                        $spiral_factor = 1 + ($index * 0.3); // Augmente le rayon progressivement
                        $angle = $angle_step * $index * 1.618; // Nombre d'or pour une répartition optimale
                        $current_radius = $offset_radius * $spiral_factor;
                    } else {
                        // Cercle simple pour les petits groupes
                        $angle = $angle_step * $index;
                        $current_radius = $offset_radius;
                    }

                    $offset_lat = $base_lat + ($current_radius * cos($angle));
                    $offset_lng = $base_lng + ($current_radius * sin($angle));
                    
                    $contact['lat'] = $offset_lat;
                    $contact['lng'] = $offset_lng;
                    $contact['original_lat'] = $base_lat;
                    $contact['original_lng'] = $base_lng;
                    $contact['is_grouped'] = true;
                    $contact['group_size'] = count($group_contacts);
                    $contact['group_index'] = $index;
                    
                    $grouped_contacts[] = $contact;
                }
            }
        }
    }
    
    error_log("Pipedrive Map v7.4: " . count($grouped_contacts) . " contacts traités avec gestion des doublons");
    
    return $grouped_contacts;
}

// --- Section 8: Récupération des données Pipedrive avec FILTRE "FRANCE" ---

function get_pipedrive_contacts_for_map() {
    // Configuration pour les gros traitements
    ini_set('max_execution_time', 900); // 15 minutes
    ini_set('memory_limit', '2048M'); // 2GB
    set_time_limit(900);
    
    $contacts_cache_key = 'pipedrive_map_processed_contacts_v25'; // NOUVEAU CACHE v25 : fix rayons régions 150km + groupement France
    $cached_contacts_data = get_transient($contacts_cache_key);
    
    if (false !== $cached_contacts_data && !isset($_GET['force_refresh'])) {
        error_log('Pipedrive Map: Utilisation du cache v25 - ' . count($cached_contacts_data) . ' contacts');
        return $cached_contacts_data;
    }

    $pipedrive_api_key = get_option('pipedrive_api_key');
    if (empty($pipedrive_api_key)) {
        error_log('Pipedrive Map: Clé API non configurée');
        return [];
    }

    $pipedrive_domain = '360skillvue.pipedrive.com';
    
    // Clés des champs
    $address_field_key = 'af8d1eee2986e4b3f27659fbe12d74912ec9f888'; // Zone d'intervention
    $competences_field_key = '744a9d6bd818c9ab7716fa4485b37c2bc1d10e46'; // Compétences du prestataire référencé
    $description_field_key = 'c9573d3e2332b5cf10c2263722a64fada3f305c9'; // Descriptif activité
    $website_field_key = '8d3e0e3a94b8a259d0793b24d4d0eae5a1c4a893'; // Site web
    $qualification_date_key = '5e72f39c485ce76cacd08e551767749a5704ee3e'; // Date de qualification
    
    // Mapping complet des compétences
    $competences_mapping = [
        '251' => ['competence' => 'formation', 'label' => 'Formation Qualiopi', 'icon' => '🎓', 'color' => '#2ecc71'],
        '252' => ['competence' => 'materiel', 'label' => 'Matériel Ergonomique', 'icon' => '🔧', 'color' => '#e67e22'],
        '253' => ['competence' => 'ergonome_presentiel', 'label' => 'Ergonome Présentiel', 'icon' => '⚙️', 'color' => '#e74c3c'],
        '254' => ['competence' => 'psychologue_presentiel', 'label' => 'Psychologue Présentiel', 'icon' => '🧠', 'color' => '#3498db'],
        '258' => ['competence' => 'consultant_prevention', 'label' => 'Consultant Prévention', 'icon' => '🛡️', 'color' => '#9b59b6']
    ];
    
    // ===== RÉCUPÉRATION AVEC PAGINATION AUTOMATIQUE =====
    $all_pipedrive_contacts = fetch_all_pipedrive_contacts_with_pagination($pipedrive_api_key, $pipedrive_domain);
    
    if (empty($all_pipedrive_contacts)) {
        error_log('Pipedrive Map: Aucune donnée récupérée avec la pagination');
        return [];
    }

    error_log('Pipedrive Map: ' . count($all_pipedrive_contacts) . ' contacts récupérés au total avec pagination');
    
    $contacts_for_map = [];
    $contacts_without_zone = [];
    $contacts_without_qualification = [];
    $geocoding_success = 0;
    $geocoding_failed = 0;

    foreach ($all_pipedrive_contacts as $person) {
        $name = $person['name'] ?? 'Sans nom';
        
        // 1. Vérifier qu'il y a une zone d'intervention
        $zone_intervention = null;
        if (isset($person[$address_field_key]) && !empty($person[$address_field_key])) {
            $zone_intervention = $person[$address_field_key];
        } else {
            $contacts_without_zone[] = $name;
            continue;
        }

    

        // 2. Vérifier qu'il y a une date de qualification
        if (isset($person[$qualification_date_key]) && !empty($person[$qualification_date_key])) {
            $qualification_date = $person[$qualification_date_key];
        } else {
            $contacts_without_qualification[] = $name;
            continue; // PASSER AU SUIVANT si pas de date de qualification
        }
        
        // 3. Récupérer les informations de contact
        $email = '';
        if (!empty($person['email']) && isset($person['email'][0]['value'])) {
            $email = $person['email'][0]['value'];
        }
        
        $phone = '';
        if (!empty($person['phone']) && isset($person['phone'][0]['value'])) {
            $phone = $person['phone'][0]['value'];
        }
        
        // 4. Récupérer le SITE WEB
        $website = '';
        if (isset($person[$website_field_key]) && !empty($person[$website_field_key])) {
            $website = format_website_url($person[$website_field_key]);
        }
        
        // 5. Récupérer l'entreprise (org_id)
        $company_name = '';
        if (!empty($person['org_id']) && isset($person['org_id']['name'])) {
            $company_name = $person['org_id']['name'];
        }
        
        // 6. Récupérer le descriptif d'activité
        $activity_description = '';
        if (isset($person[$description_field_key]) && !empty($person[$description_field_key])) {
            $activity_description = $person[$description_field_key];
        }
        
        // 7. Gérer les compétences multiples ou uniques
        $competences = [];
        $competences_value = $person[$competences_field_key] ?? null;
        
        if (!empty($competences_value)) {
            // Si c'est un array (compétences multiples)
            if (is_array($competences_value)) {
                foreach ($competences_value as $competence_id) {
                    if (isset($competences_mapping[$competence_id])) {
                        $competences[] = $competences_mapping[$competence_id];
                    }
                }
            } else {
                // Si c'est une seule valeur
                if (isset($competences_mapping[$competences_value])) {
                    $competences[] = $competences_mapping[$competences_value];
                }
            }
        }
        
        // Si aucune compétence reconnue, on affiche comme "Non défini"
        if (empty($competences)) {
            $competences[] = [
                'competence' => 'non_defini',
                'label' => 'Sans compétence définie',
                'icon' => '👤',
                'color' => '#95a5a6'
            ];
        }
        
        // Déterminer la compétence principale et si c'est multiple
        $primary_competence = $competences[0];
        $is_multiple = count($competences) > 1;
        
        if ($is_multiple) {
            $display_competence = 'multiple';
            $display_label = pipedrive_get_translations()['multiple_competences'];
            $display_icon = '🔄';
            $display_color = '#2c3e50';
        } else {
            $display_competence = $primary_competence['competence'];
            $display_label = $primary_competence['label'];
            $display_icon = $primary_competence['icon'];
            $display_color = $primary_competence['color'];
        }
        
        // 8. Géocoder l'adresse
        $geocoded_coords = geocode_address_with_nominatim($zone_intervention);
        
        if (!$geocoded_coords) {
            error_log("Pipedrive Map: Échec géocodage pour $name - $zone_intervention");
            $geocoding_failed++;
            continue;
        }

        $geocoding_success++;

        // Extraire la ville de l'adresse
        $city_display = '';
        $parts = explode(',', $zone_intervention);
        if (count($parts) > 0) {
            $city_display = trim($parts[0]);
            $city_display = preg_replace('/^[0-9]{4,5}\s+/', '', $city_display);
        }
        if (empty($city_display)) {
            $city_display = pipedrive_get_translations()['location_na'];
        }

        // Créer les classes de filtrage
        $filter_classes = [];
        if ($is_multiple) {
            $filter_classes[] = 'multiple';
            foreach ($competences as $competence) {
                $filter_classes[] = $competence['competence'];
            }
        } else {
            $filter_classes[] = $display_competence;
        }

        // NOUVELLE LOGIQUE POUR LE RAYON DYNAMIQUE
        $radius = 30000; // Rayon par défaut de 30 km

        // Normalisation avancée pour gérer les accents et variantes
        $normalized_zone = strtolower(trim($zone_intervention));
        $normalized_zone = remove_accents($normalized_zone); // Fonction WordPress
        $normalized_zone = preg_replace('/[^a-z0-9\s\-]/', '', $normalized_zone); // Garder seulement lettres, chiffres, espaces et tirets
        $normalized_zone = preg_replace('/\s+/', ' ', $normalized_zone); // Normaliser les espaces multiples

        $french_regions = [
            'auvergne-rhone-alpes', 'auvergne rhone alpes',
            'bourgogne-franche-comte', 'bourgogne franche comte',
            'bretagne',
            'centre-val de loire', 'centre val de loire',
            'corse',
            'grand est',
            'hauts-de-france', 'hauts de france',
            'ile-de-france', 'ile de france',
            'normandie',
            'nouvelle-aquitaine', 'nouvelle aquitaine',
            'occitanie',
            'pays de la loire',
            'provence-alpes-cote dazur', 'provence alpes cote dazur', 'paca',
            'guadeloupe',
            'martinique',
            'guyane',
            'la reunion', 'reunion',
            'mayotte'
        ];

        $is_region = false;
		foreach ($french_regions as $region_name) {
		    if (strpos($normalized_zone, $region_name) !== false) {
		        $is_region = true;
		        break; // On a trouvé une correspondance, on arrête la boucle
		    }
		}

		if ($normalized_zone === 'france') {
		    $radius = 500000; // 500 km pour la France
		    error_log("RAYON: '$zone_intervention' → France → 500km");
		} elseif ($normalized_zone === 'suisse') {
		    $radius = 100000; // 100 km pour la Suisse
		    error_log("RAYON: '$zone_intervention' → Suisse → 100km");
		} elseif ($is_region) { // <-- On utilise notre nouvelle variable
		    $radius = 150000; // 150 km pour les régions françaises
		    error_log("RAYON: '$zone_intervention' → Région détectée '$normalized_zone' → 150km");
		} else {
		    $radius = 30000; // 30 km par défaut
		    error_log("RAYON: '$zone_intervention' → Normalisé: '$normalized_zone' → 30km (défaut)");
		}

        $contact_data = [
            'lat' => $geocoded_coords['lat'],
            'lng' => $geocoded_coords['lng'],
            'name' => esc_html($name),
            'competence' => $display_competence,
            'competence_label' => $display_label,
            'city' => esc_html($city_display),
            'country' => esc_html($geocoded_coords['country'] ?? ''),
            'color' => $display_color,
            'iconUrl' => get_marker_icon_url($display_competence),
            'iconEmoji' => $display_icon,
            'radius' => $radius,
            'address' => $zone_intervention,
            'competences' => $competences,
            'is_multiple' => $is_multiple,
            'filter_classes' => $filter_classes,
            // Informations complètes avec SITE WEB
            'company' => esc_html($company_name),
            'email' => sanitize_email($email),
            'phone' => esc_html($phone),
            'website' => esc_url($website),
            'activity_description' => esc_html($activity_description),
            // NOUVEAUX CHAMPS pour la gestion des groupes
            'is_grouped' => false,
            'group_size' => 1,
            'group_index' => 0
        ];
        
        $contacts_for_map[] = $contact_data;
    }

    // ===== NOUVELLE ÉTAPE : GESTION DES DOUBLONS DE LOCALISATION =====
    error_log("Pipedrive Map v7.4: Avant gestion des doublons - " . count($contacts_for_map) . " contacts");
    $contacts_for_map = group_contacts_by_location($contacts_for_map);
    error_log("Pipedrive Map v7.4: Après gestion des doublons - " . count($contacts_for_map) . " contacts");

    // Statistiques finales
    error_log('Pipedrive Map v7.4: RÉSULTATS FINAUX AVEC PAGINATION ET GESTION DES DOUBLONS:');
    error_log('- Total contacts Pipedrive récupérés: ' . count($all_pipedrive_contacts));
    error_log('- Contacts sans zone d\'intervention: ' . count($contacts_without_zone));
    error_log('- Contacts sans date de qualification: ' . count($contacts_without_qualification));
    error_log('- Géocodage réussi: ' . $geocoding_success);
    error_log('- Géocodage échoué: ' . $geocoding_failed);
    error_log('- CONTACTS FINAUX SUR LA CARTE: ' . count($contacts_for_map));
    
    if (!empty($contacts_without_zone)) {
        error_log('Pipedrive Map: Contacts sans zone d\'intervention: ' . implode(', ', array_slice($contacts_without_zone, 0, 10)) . (count($contacts_without_zone) > 10 ? '...' : ''));
    }
    
    if (!empty($contacts_without_qualification)) {
        error_log('Pipedrive Map: Contacts sans date de qualification: ' . implode(', ', array_slice($contacts_without_qualification, 0, 10)) . (count($contacts_without_qualification) > 10 ? '...' : ''));
    }
    
    // Sauvegarder en cache pendant 2 heures
    set_transient($contacts_cache_key, $contacts_for_map, 2 * HOUR_IN_SECONDS);
    return $contacts_for_map;
}

// --- Section 9: Shortcode principal avec GESTION DES DOUBLONS ---

add_shortcode('pipedrive_leaflet_map', 'display_pipedrive_leaflet_map_360_shortcode');
function display_pipedrive_leaflet_map_360_shortcode($atts) {
    $translations = pipedrive_get_translations();
    $contacts = get_pipedrive_contacts_for_map();

    if (empty($contacts)) {
        return '<div class="pipedrive-map-container-360">
                    <div class="pipedrive-empty-360">
                        <div class="loading-spinner-360"></div>
                        <p>' . esc_html($translations['no_data']) . '</p>
                        <p>' . esc_html($translations['check_config']) . '</p>
                    </div>
                </div>';
    }

    // Détecter si on est sur la page suisse
    $current_url = $_SERVER['REQUEST_URI'] ?? '';
    $is_swiss_page = (strpos($current_url, '/ch/') !== false);

    // Coordonnées par défaut selon la page
    $default_lat = $is_swiss_page ? '46.8182' : '46.603354';
    $default_lng = $is_swiss_page ? '8.2275' : '1.888334';
    $default_zoom = $is_swiss_page ? '8' : '6';

    $map_atts = shortcode_atts([
        'lat' => $default_lat,
        'lng' => $default_lng,
        'zoom' => $default_zoom,
        'height' => '900',
        'width' => '100%',
    ], $atts);

    // Statistiques par compétence
    $competence_counts = [];
    foreach ($contacts as $contact) {
        if ($contact['is_multiple']) {
            foreach ($contact['competences'] as $competence) {
                $competence_key = $competence['competence'];
                if (!isset($competence_counts[$competence_key])) {
                    $competence_counts[$competence_key] = 0;
                }
                $competence_counts[$competence_key]++;
            }
            if (!isset($competence_counts['multiple'])) {
                $competence_counts['multiple'] = 0;
            }
            $competence_counts['multiple']++;
        } else {
            $competence = $contact['competence'];
            if (!isset($competence_counts[$competence])) {
                $competence_counts[$competence] = 0;
            }
            $competence_counts[$competence]++;
        }
    }
    
    $total_count = count($contacts);
    $map_id = 'pipedrive-map-' . uniqid();

    $output = '<div class="pipedrive-map-container-360" id="' . esc_attr($map_id) . '">';
    
    // En-tête
    $output .= '<div class="pipedrive-map-header-360">
                    <h2 class="pipedrive-map-title-360">' . esc_html($translations['map_title']) . '</h2>
                </div>';
    
    // Statistiques
    $output .= '<div class="pipedrive-stats-section-360">
                    <div class="stat-item-360">
                        <p class="stat-number-360">' . $total_count . '</p>
                        <p class="stat-label-360">' . esc_html($translations['professionals']) . '</p>
                    </div>';
    
    foreach ($competence_counts as $competence => $count) {
        if ($count > 0 && $competence !== 'non_defini') {
            $label = $translations[$competence] ?? ucfirst($competence);
            
            $output .= '<div class="stat-item-360 ' . esc_attr($competence) . '">
                            <p class="stat-number-360">' . $count . '</p>
                            <p class="stat-label-360">' . esc_html($label) . '</p>
                        </div>';
        }
    }
    
    $output .= '</div>';
    
    // Filtres par compétences
    $output .= '<div class="pipedrive-filters-section-360">
                    <span class="filter-label-360">' . esc_html($translations['filter_by']) . '</span>
                    <button class="filter-btn-360 active" data-filter="all">
                        <span>👁️</span>
                        <span>' . esc_html($translations['all']) . '</span>
                    </button>';
    
    $added_filters = [];
    foreach ($contacts as $contact) {
        if ($contact['is_multiple']) {
            if (!in_array('multiple', $added_filters)) {
                $output .= '<button class="filter-btn-360 multiple" data-filter="multiple">
                                <span>🔄</span>
                                <span>' . esc_html($translations['multiple_competences']) . '</span>
                            </button>';
                $added_filters[] = 'multiple';
            }
            
            foreach ($contact['competences'] as $competence) {
                $competence_key = $competence['competence'];
                if (!in_array($competence_key, $added_filters) && $competence_key !== 'non_defini') {
                    $output .= '<button class="filter-btn-360 ' . esc_attr($competence_key) . '" data-filter="' . esc_attr($competence_key) . '">
                                    <span>' . esc_html($competence['icon']) . '</span>
                                    <span>' . esc_html($competence['label']) . '</span>
                                </button>';
                    $added_filters[] = $competence_key;
                }
            }
        } else {
            $competence = $contact['competence'];
            if (!in_array($competence, $added_filters) && $competence !== 'non_defini') {
                $output .= '<button class="filter-btn-360 ' . esc_attr($competence) . '" data-filter="' . esc_attr($competence) . '">
                                <span>' . esc_html($contact['iconEmoji']) . '</span>
                                <span>' . esc_html($contact['competence_label']) . '</span>
                            </button>';
                $added_filters[] = $competence;
            }
        }
    }
    
    $output .= '</div>';

    // Section principale
    $output .= '<div class="pipedrive-content-section-360">
                    <div class="pipedrive-map-wrapper-360">
                        <div id="' . esc_attr($map_id) . '-map">';

    // Carte Leaflet avec marqueurs individuels
    $map_shortcode = sprintf(
        '[leaflet-map lat=%s lng=%s zoom=%s height=%s width="%s" doubleClickZoom=true scrollWheelZoom=true]',
        esc_attr($map_atts['lat']),
        esc_attr($map_atts['lng']),
        esc_attr($map_atts['zoom']),
        esc_attr($map_atts['height']),
        esc_attr($map_atts['width'])
    );

    $markers_shortcode = '';
    foreach ($contacts as $index => $contact) {
        $marker_id = $map_id . '-marker-' . $index;
        $circle_id = $map_id . '-circle-' . $index;
        
        $filter_classes_str = implode(' ', $contact['filter_classes']);
        
        // Ajouter classe pour les contacts groupés
        if ($contact['is_grouped'] && $contact['group_size'] > 1) {
            $filter_classes_str .= ' grouped-contact group-size-' . $contact['group_size'];
        }
        
        // Cercles de zone avec opacité dynamique
        $radius = intval($contact['radius']);
        $fillOpacity = $radius >= 200000 ? "0.02" : ($radius >= 100000 ? "0.04" : "0.08"); // Plus transparent pour les gros rayons
        $opacity = $radius >= 200000 ? "0.2" : ($radius >= 100000 ? "0.3" : "0.4"); // Bordure plus transparente pour les gros rayons

        $markers_shortcode .= sprintf(
            '[leaflet-circle lat=%s lng=%s radius=%d color="%s" fillColor="%s" fillOpacity="%s" weight="2" opacity="%s" className="zone-circle-%s %s" id="%s"]',
            esc_attr($contact['lat']),
            esc_attr($contact['lng']),
            intval($contact['radius']),
            esc_attr($contact['color']),
            esc_attr($contact['color']),
            $fillOpacity,
            $opacity,
            esc_attr($contact['competence']),
            esc_attr($filter_classes_str),
            esc_attr($circle_id)
        );
        
        // Popup enrichi
        $popup_content = '<div class="professional-popup-360">
                            <div class="popup-header-360">
                                <div class="popup-icon-360">' . esc_html($contact['iconEmoji']) . '</div>
                                <h3 class="popup-name-360">' . esc_html($contact['name']) . '</h3>';
        
        if (!empty($contact['company'])) {
            $popup_content .= '<div class="popup-company-360">' . esc_html($contact['company']) . '</div>';
        }
        
        // Afficher info de groupement si applicable
        if ($contact['is_grouped'] && $contact['group_size'] > 1) {
            $popup_content .= '<div style="background: #e3f2fd; padding: 6px 10px; border-radius: 4px; margin: 8px 0; font-size: 0.75rem; color: #1565c0;">
                                📍 ' . sprintf($translations['professionals_in_location'], $contact['group_size']) . '
                              </div>';
        }
        
        $popup_content .= '<div class="popup-competences-360">';
        foreach ($contact['competences'] as $competence) {
            $popup_content .= '<div class="popup-competence-360 ' . esc_attr($competence['competence']) . '">' . 
                            esc_html($competence['label']) . 
                            '</div>';
        }
        $popup_content .= '</div></div>';
        
        // Informations de contact
        $popup_content .= '<div class="popup-info-section-360">';
        
        $popup_content .= '<div class="popup-info-item-360">
                            <span class="popup-info-icon-360">📍</span>
                            <span>' . esc_html($contact['city']) . 
                            (!empty($contact['country']) ? ', ' . esc_html($contact['country']) : '') . 
                            '</span>
                          </div>';
        
        if (!empty($contact['email'])) {
            $popup_content .= '<div class="popup-info-item-360">
                                <span class="popup-info-icon-360">✉️</span>
                                <a href="mailto:' . esc_attr($contact['email']) . '">' . esc_html($contact['email']) . '</a>
                              </div>';
        }
        
        if (!empty($contact['phone'])) {
            $popup_content .= '<div class="popup-info-item-360">
                                <span class="popup-info-icon-360">📞</span>
                                <a href="tel:' . esc_attr($contact['phone']) . '">' . esc_html($contact['phone']) . '</a>
                              </div>';
        }
        
        if (!empty($contact['website'])) {
            $popup_content .= '<div class="popup-info-item-360">
                                <span class="popup-info-icon-360">🌐</span>
                                <a href="' . esc_attr($contact['website']) . '" target="_blank" rel="noopener">' . esc_html($contact['website']) . '</a>
                              </div>';
        }
        
        $popup_content .= '</div>';
        
        // Descriptif d'activité
        if (!empty($contact['activity_description'])) {
            $popup_content .= '<div class="popup-description-360">
                                <strong>' . esc_html($translations['activity_description']) . ' :</strong><br>
                                ' . esc_html($contact['activity_description']) . '
                              </div>';
        }
        
        $popup_content .= '</div>';
        
        // Marqueurs individuels - Masquer les points "France"
        $contact_zone = strtolower(trim($contact['address'] ?? ''));
        if (function_exists('remove_accents')) {
            $contact_zone = remove_accents($contact_zone);
        }
        $contact_zone = preg_replace('/[^a-z0-9\s\-]/', '', $contact_zone);

        // Afficher le marqueur seulement si ce n'est pas "France"
        if ($contact_zone !== 'france') {
            $markers_shortcode .= sprintf(
                '[leaflet-marker lat=%s lng=%s iconUrl="%s" iconSize="25,41" iconAnchor="12,41" popupAnchor="1,-34" className="marker-%s %s" id="%s"]%s[/leaflet-marker]',
                esc_attr($contact['lat']),
                esc_attr($contact['lng']),
                esc_attr($contact['iconUrl']),
                esc_attr($contact['competence']),
                esc_attr($filter_classes_str),
                esc_attr($marker_id),
                $popup_content
            );
        }
    }

    $output .= do_shortcode($map_shortcode . $markers_shortcode);
    $output .= '</div></div>';

    // Liste des professionnels
    $output .= '<div class="pipedrive-list-section-360">
                    <div class="pipedrive-list-header-360">
                        <h3 class="pipedrive-list-title-360">' . esc_html($translations['list_title']) . '</h3>
                        <input type="text" class="pipedrive-list-search-360" placeholder="' . esc_attr($translations['search_placeholder']) . '">
                    </div>
                    <div class="pipedrive-list-content-360" id="' . esc_attr($map_id) . '-list">';

    // Séparer les contacts pour la recherche intelligente
    // Sur la page suisse, on met les suisses en premier
    // Sur les autres pages, on met les non-France en premier

    if ($is_swiss_page) {
        // Pour la page suisse : afficher UNIQUEMENT les prestataires suisses
        $swiss_contacts = [];

        foreach ($contacts as $contact) {
            // Vérifier dans le champ 'address' (zone d'intervention) et 'country'
            $address = strtolower(trim($contact['address'] ?? ''));
            $country = strtolower(trim($contact['country'] ?? ''));
            $city = strtolower(trim($contact['city'] ?? ''));

            // Nettoyer les accents
            if (function_exists('remove_accents')) {
                $address = remove_accents($address);
                $country = remove_accents($country);
                $city = remove_accents($city);
            }

            $is_swiss = (
                stripos($address, 'suisse') !== false ||
                stripos($country, 'suisse') !== false ||
                stripos($city, 'suisse') !== false ||
                stripos($address, 'switzerland') !== false ||
                stripos($country, 'switzerland') !== false ||
                stripos($address, 'schweiz') !== false ||
                stripos($country, 'schweiz') !== false
            );

            // Sur la page suisse, on garde UNIQUEMENT les contacts suisses
            if ($is_swiss) {
                $swiss_contacts[] = $contact;
            }
        }

        // Tri par nom
        usort($swiss_contacts, function($a, $b) {
            return strcmp($a['name'], $b['name']);
        });

        // Liste finale : uniquement les Suisses
        $sorted_contacts = $swiss_contacts;
    } else {
        // Pour les autres pages : séparer France et non-France
        $france_contacts = [];
        $other_contacts = [];

        foreach ($contacts as $contact) {
            $zone = strtolower(trim($contact['address'] ?? ''));
            if (function_exists('remove_accents')) {
                $zone = remove_accents($zone);
            }
            $zone = preg_replace('/[^a-z0-9\s\-]/', '', $zone);

            if ($zone === 'france') {
                $france_contacts[] = $contact;
            } else {
                $other_contacts[] = $contact;
            }
        }

        // Tri des contacts non-France par nom
        usort($other_contacts, function($a, $b) {
            return strcmp($a['name'], $b['name']);
        });

        // Tri des contacts France par nom
        usort($france_contacts, function($a, $b) {
            return strcmp($a['name'], $b['name']);
        });

        // Créer la liste finale : autres d'abord, puis France
        $sorted_contacts = array_merge($other_contacts, $france_contacts);
    }

    foreach ($sorted_contacts as $index => $contact) {
        $item_id = $map_id . '-item-' . $index;
        $marker_id = $map_id . '-marker-' . $index;
        
        $filter_classes_str = implode(' ', $contact['filter_classes']);
        
        // Créer une chaîne de recherche incluant toutes les informations
        $search_string = strtolower($contact['name'] . ' ' . $contact['city'] . ' ' . $contact['company'] . ' ' . $contact['competence_label'] . ' ' . ($contact['address'] ?? ''));

        // Supprimer les accents pour faciliter la recherche
        if (function_exists('remove_accents')) {
            $search_string = remove_accents($search_string);
        }

        // Marquer les contacts France pour la recherche
        $is_france_contact = false;
        $zone = strtolower(trim($contact['address'] ?? ''));
        if (function_exists('remove_accents')) {
            $zone = remove_accents($zone);
        }
        $zone = preg_replace('/[^a-z0-9\s\-]/', '', $zone);
        if ($zone === 'france') {
            $is_france_contact = true;
        }

        $output .= '<div class="professional-item-360' . ($is_france_contact ? ' france-contact' : '') . '"
                         data-filter-classes="' . esc_attr($filter_classes_str) . '"
                         data-marker-id="' . esc_attr($marker_id) . '"
                         data-lat="' . esc_attr($contact['lat']) . '"
                         data-lng="' . esc_attr($contact['lng']) . '"
                         data-search="' . esc_attr($search_string) . '"
                         id="' . esc_attr($item_id) . '">
                        
                        <div class="professional-header-360">
                            <div class="professional-icon-360 ' . esc_attr($contact['competence']) . '">
                                ' . esc_html($contact['iconEmoji']) . '
                            </div>
                            <h4 class="professional-name-360">' . esc_html($contact['name']) . '</h4>';
        
        // Indicateur de groupement dans la liste
        if ($contact['is_grouped'] && $contact['group_size'] > 1) {
            $output .= '<span style="background: #e3f2fd; color: #1565c0; font-size: 0.6rem; padding: 2px 6px; border-radius: 10px; margin-left: 5px;">
                            👥 ' . $contact['group_size'] . '
                        </span>';
        }
        
        $output .= '</div>
                        
                        <div class="professional-details-360">';
        
        // Entreprise
        if (!empty($contact['company'])) {
            $output .= '<div class="professional-company-360">🏢 ' . esc_html($contact['company']) . '</div>';
        }
        
        // Compétences
        if ($contact['is_multiple']) {
            $output .= '<div class="professional-competences-tags-360">';
            foreach ($contact['competences'] as $competence) {
                $output .= '<span class="competence-tag-360 ' . esc_attr($competence['competence']) . '">' . esc_html($competence['label']) . '</span>';
            }
            $output .= '</div>';
        } else {
            $output .= '<p class="professional-competences-360">' . esc_html($contact['competence_label']) . '</p>';
        }
        
        // Localisation
        $output .= '<div class="professional-location-360">
                        <span>📍</span>
                        <span>' . esc_html($contact['city']) . '</span>
                    </div>';
        
        // Informations de contact
        if (!empty($contact['email'])) {
            $output .= '<div class="professional-contact-360">
                            <span class="contact-icon">✉️</span>
                            <a href="mailto:' . esc_attr($contact['email']) . '">' . esc_html($contact['email']) . '</a>
                        </div>';
        }
        
        if (!empty($contact['phone'])) {
            $output .= '<div class="professional-contact-360">
                            <span class="contact-icon">📞</span>
                            <a href="tel:' . esc_attr($contact['phone']) . '">' . esc_html($contact['phone']) . '</a>
                        </div>';
        }
        
        if (!empty($contact['website'])) {
            $output .= '<div class="professional-contact-360">
                            <span class="contact-icon">🌐</span>
                            <a href="' . esc_attr($contact['website']) . '" target="_blank" rel="noopener">' . esc_html($contact['website']) . '</a>
                        </div>';
        }
        
        // Descriptif d'activité (tronqué)
        if (!empty($contact['activity_description'])) {
            $truncated_description = strlen($contact['activity_description']) > 120 ? 
                                    substr($contact['activity_description'], 0, 120) . '...' : 
                                    $contact['activity_description'];
            $output .= '<div class="professional-description-360">
                            ' . esc_html($truncated_description) . '
                        </div>';
        }
        
        $output .= '</div></div>'; // Fin details et item
    }

    $output .= '</div></div>'; // Fin liste
    $output .= '</div>'; // Fin content section
    $output .= '</div>'; // Fin container

    // JavaScript pour les filtres et interactions
    $output .= '<script>
    (function() {
        let mapInstance = null;
        let allMarkers = [];
        let allCircles = [];
        let currentFilter = "all";
        const mapId = "' . esc_js($map_id) . '";

        document.addEventListener("DOMContentLoaded", function() {
            setTimeout(initializeMap360, 1000);
        });

        function initializeMap360() {
            if (typeof window.WPLeafletMapPlugin !== "undefined" && window.WPLeafletMapPlugin.maps.length > 0) {
                mapInstance = window.WPLeafletMapPlugin.maps[window.WPLeafletMapPlugin.maps.length - 1];
                collectMapElements();
                setupFilters();
                setupListInteractions();
                setupSearch();
            } else {
                setTimeout(initializeMap360, 500);
            }
        }

        function collectMapElements() {
            if (!mapInstance) return;
            
            mapInstance.eachLayer(function(layer) {
                if (layer instanceof L.Marker) {
                    allMarkers.push(layer);
                } else if (layer instanceof L.Circle) {
                    allCircles.push(layer);
                }
            });
            
            console.log("Pipedrive Map v7.4: Collecté", allMarkers.length, "marqueurs et", allCircles.length, "cercles avec gestion des doublons");
        }

        function setupFilters() {
            const filterButtons = document.querySelectorAll(`#${mapId} .filter-btn-360`);
            
            filterButtons.forEach(button => {
                button.addEventListener("click", function() {
                    currentFilter = this.dataset.filter;
                    
                    filterButtons.forEach(btn => btn.classList.remove("active"));
                    this.classList.add("active");
                    
                    applyFilter(currentFilter);
                });
            });
        }

        function applyFilter(filter) {
            console.log("Application du filtre:", filter);

            // Filtrer les marqueurs
            allMarkers.forEach((marker, index) => {
                const element = marker.getElement();
                if (element) {
                    const classList = element.className || "";

                    let shouldShow = false;

                    if (filter === "all") {
                        shouldShow = true;
                    } else {
                        shouldShow = classList.includes(filter);
                    }

                    if (shouldShow) {
                        element.style.display = "block";
                        if (marker._icon) {
                            marker._icon.style.display = "block";
                            marker._icon.classList.remove("filtered-hidden");
                        }
                        if (marker._shadow) {
                            marker._shadow.style.display = "block";
                            marker._shadow.classList.remove("filtered-hidden");
                        }
                    } else {
                        element.style.display = "none";
                        if (marker._icon) {
                            marker._icon.style.display = "none";
                            marker._icon.classList.add("filtered-hidden");
                        }
                        if (marker._shadow) {
                            marker._shadow.style.display = "none";
                            marker._shadow.classList.add("filtered-hidden");
                        }
                    }
                }
            });
            
            // Filtrer les cercles
            allCircles.forEach((circle, index) => {
                const element = circle.getElement();
                if (element) {
                    const classList = element.className.baseVal || element.className || "";
                    
                    let shouldShow = false;
                    
                    if (filter === "all") {
                        shouldShow = true;
                    } else {
                        shouldShow = classList.includes(filter);
                    }
                    
                    if (shouldShow) {
                        element.style.display = "block";
                        element.classList.remove("filtered-hidden");
                    } else {
                        element.style.display = "none";
                        element.classList.add("filtered-hidden");
                    }
                }
            });
            
            filterList();
        }

        // Fonction pour supprimer les accents
        function removeAccents(str) {
            return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }

        function filterList() {
            const listItems = document.querySelectorAll(`#${mapId}-list .professional-item-360`);
            const searchValue = removeAccents(document.querySelector(`#${mapId} .pipedrive-list-search-360`).value.toLowerCase());

            listItems.forEach(item => {
                const filterClasses = item.getAttribute("data-filter-classes") || "";
                const classesArray = filterClasses.split(" ");
                const searchString = item.dataset.search || "";

                const matchesFilter = currentFilter === "all" || classesArray.includes(currentFilter);
                const matchesSearch = !searchValue || searchString.includes(searchValue);
                const isFranceContact = item.classList.contains("france-contact");

                // Si il y a une recherche, afficher les résultats + toujours les contacts France
                if (matchesFilter && (matchesSearch || (searchValue && isFranceContact))) {
                    item.classList.remove("filtered-hidden");
                    item.style.display = "block";
                } else {
                    item.classList.add("filtered-hidden");
                    item.style.display = "none";
                }
            });
        }

        function setupListInteractions() {
            const listItems = document.querySelectorAll(`#${mapId}-list .professional-item-360`);
            
            listItems.forEach(item => {
                item.addEventListener("click", function() {
                    const lat = parseFloat(this.dataset.lat);
                    const lng = parseFloat(this.dataset.lng);
                    const markerId = this.dataset.markerId;
                    
                    if (mapInstance) {
                        mapInstance.setView([lat, lng], 12, {
                            animate: true,
                            duration: 1
                        });
                        
                        setTimeout(() => {
                            allMarkers.forEach(marker => {
                                const element = marker.getElement();
                                if (element && element.id === markerId) {
                                    marker.openPopup();
                                }
                            });
                        }, 1000);
                    }
                    
                    listItems.forEach(li => li.classList.remove("highlighted"));
                    this.classList.add("highlighted");
                });
            });
        }

        function setupSearch() {
            const searchInput = document.querySelector(`#${mapId} .pipedrive-list-search-360`);
            if (searchInput) {
                searchInput.addEventListener("input", filterList);
            }
        }
    })();
    </script>';

    return $output;
}

// --- Section 10: Fonctions de debug et de nettoyage de cache ---

add_shortcode('pipedrive_clean_failed_cache', 'pipedrive_clean_failed_cache_shortcode');
function pipedrive_clean_failed_cache_shortcode() {
    if (!current_user_can('manage_options')) {
        return '<p>Accès refusé</p>';
    }
    
    $deleted = clean_failed_geocoding_caches();
    return "<p style='color: green;'>✅ {$deleted} caches d'échec supprimés. Rechargez votre carte.</p>";
}

function clean_failed_geocoding_caches() {
    global $wpdb;
    
    // Supprimer tous les caches 'not_found'
    $deleted = $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_geo_%' AND option_value = 'not_found'");
    
    error_log("Pipedrive Map: {$deleted} caches d'échec supprimés");
    return $deleted;
}

// --- Section 11: Fonction de debug mise à jour pour v7.4 ---

function pipedrive_debug_data() {
    $pipedrive_api_key = get_option('pipedrive_api_key');
    if (empty($pipedrive_api_key)) {
        echo '<p style="color: red;">Clé API non configurée !</p>';
        return;
    }

    echo '<p>Clé API configurée : ' . substr($pipedrive_api_key, 0, 10) . '...</p>';

    $pipedrive_domain = '360skillvue.pipedrive.com';
    
    // Test de la pagination avec gestion des doublons
    echo '<h4>🔄 Test de la pagination automatique v7.4 avec gestion des doublons :</h4>';
    
    $all_contacts = fetch_all_pipedrive_contacts_with_pagination($pipedrive_api_key, $pipedrive_domain);
    
    if (!empty($all_contacts)) {
        $total_contacts = count($all_contacts);
        echo "<p style='background: #d4edda; padding: 10px; border-radius: 4px;'>";
        echo "<strong>✅ Pagination réussie !</strong><br>";
        echo "📊 <strong>Total contacts récupérés :</strong> {$total_contacts}<br>";
        echo "🔄 <strong>Méthode :</strong> Appels automatiques par lots de 500<br>";
        echo "📍 <strong>NOUVEAU v7.4 :</strong> Gestion automatique des doublons de localisation et filtre 'France'";
        echo "</p>";
        
        // Test de la gestion des doublons
        echo '<h4>📍 Test de la gestion des doublons de localisation :</h4>';
        
        // Simuler quelques contacts avec des coordonnées proches pour tester
        $test_contacts = array_slice($all_contacts, 0, 10);
        $processed_contacts = [];
        
        foreach ($test_contacts as $contact) {
            if (isset($contact['name'])) {
                $processed_contacts[] = [
                    'name' => $contact['name'],
                    'lat' => '48.8566',
                    'lng' => '2.3522'
                ];
            }
        }
        
        if (!empty($processed_contacts)) {
            echo "<p style='background: #e3f2fd; padding: 10px; border-radius: 4px;'>";
            echo "<strong>🧪 Test avec " . count($processed_contacts) . " contacts simulés à Paris :</strong><br>";
            
            $grouped_test = group_contacts_by_location($processed_contacts);
            
            echo "📍 <strong>Avant regroupement :</strong> " . count($processed_contacts) . " contacts<br>";
            echo "📍 <strong>Après regroupement :</strong> " . count($grouped_test) . " contacts<br>";
            echo "✅ <strong>Offsets appliqués pour éviter la superposition</strong>";
            echo "</p>";
        }
        
        // Analyser les contacts réels avec leurs données complètes
        echo '<h4>📋 Analyse des premiers contacts avec gestion des doublons :</h4>';
        
        $address_field_key = 'af8d1eee2986e4b3f27659fbe12d74912ec9f888';
        $competences_field_key = '744a9d6bd818c9ab7716fa4485b37c2bc1d10e46';
        $description_field_key = 'c9573d3e2332b5cf10c2263722a64fada3f305c9';
        $website_field_key = '8d3e0e3a94b8a259d0793b24d4d0eae5a1c4a893';
        $qualification_date_key = '5e72f39c485ce76cacd08e551767749a5704ee3e';
        
        $competences_mapping = [
            '251' => 'Formation Qualiopi',
            '252' => 'Matériel Ergonomique',
            '253' => 'Ergonome Présentiel',
            '254' => 'Psychologue Présentiel',
            '258' => 'Consultant Prévention'
        ];
        
        $qualified_contacts = [];
        $stats = [
            'with_zone' => 0,
            'with_qualification' => 0,
            'with_both' => 0,
            'with_website' => 0
        ];
        
        foreach (array_slice($all_contacts, 0, 20) as $person) {
            $name = $person['name'] ?? 'Sans nom';
            $zone = $person[$address_field_key] ?? '';
            $qualification = $person[$qualification_date_key] ?? '';
            $website = $person[$website_field_key] ?? '';
            
            if (!empty($zone)) $stats['with_zone']++;
            if (!empty($qualification)) $stats['with_qualification']++;
            if (!empty($zone) && !empty($qualification)) $stats['with_both']++;
            if (!empty($website)) $stats['with_website']++;
            
            if (!empty($zone) && !empty($qualification)) {
                $email = '';
                if (!empty($person['email']) && isset($person['email'][0]['value'])) {
                    $email = $person['email'][0]['value'];
                }
                
                $phone = '';
                if (!empty($person['phone']) && isset($person['phone'][0]['value'])) {
                    $phone = $person['phone'][0]['value'];
                }
                
                $company = '';
                if (!empty($person['org_id']) && isset($person['org_id']['name'])) {
                    $company = $person['org_id']['name'];
                }
                
                $description = $person[$description_field_key] ?? '';
                $website_formatted = format_website_url($website);
                
                // Traiter les compétences
                $competences_raw = $person[$competences_field_key] ?? null;
                $competences_labels = [];
                
                if (!empty($competences_raw)) {
                    if (is_array($competences_raw)) {
                        foreach ($competences_raw as $comp_id) {
                            if (isset($competences_mapping[$comp_id])) {
                                $competences_labels[] = $competences_mapping[$comp_id];
                            }
                        }
                    } else {
                        if (isset($competences_mapping[$competences_raw])) {
                            $competences_labels[] = $competences_mapping[$competences_raw];
                        }
                    }
                }
                
                $qualified_contacts[] = [
                    'name' => $name,
                    'company' => $company,
                    'email' => $email,
                    'phone' => $phone,
                    'website' => $website_formatted,
                    'zone' => $zone,
                    'description' => $description,
                    'competences' => $competences_labels,
                    'qualification_date' => $qualification
                ];
            }
        }
        
        echo "<div style='background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 15px 0;'>";
        echo "<h5>📈 Statistiques sur les 20 premiers contacts :</h5>";
        echo "<ul>";
        echo "<li><strong>Avec zone d'intervention :</strong> {$stats['with_zone']}/20</li>";
        echo "<li><strong>Avec date de qualification :</strong> {$stats['with_qualification']}/20</li>";
        echo "<li><strong>Qualifiés pour la carte :</strong> {$stats['with_both']}/20</li>";
        echo "<li><strong>Avec site web :</strong> {$stats['with_website']}/20</li>";
        echo "</ul>";
        echo "</div>";
        
        if (!empty($qualified_contacts)) {
            echo '<div style="max-height: 600px; overflow-y: auto; border: 1px solid #ccc; padding: 15px; background: white; border-radius: 6px;">';
            
            foreach ($qualified_contacts as $contact) {
                echo '<div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #28a745;">';
                echo '<h6 style="margin: 0 0 10px 0; color: #28a745; font-size: 1.1em;">' . esc_html($contact['name']) . '</h6>';
                
                if (!empty($contact['company'])) {
                    echo '<p style="margin: 5px 0;"><strong>🏢 Entreprise:</strong> ' . esc_html($contact['company']) . '</p>';
                }
                
                if (!empty($contact['email'])) {
                    echo '<p style="margin: 5px 0;"><strong>✉️ Email:</strong> ' . esc_html($contact['email']) . '</p>';
                }
                
                if (!empty($contact['phone'])) {
                    echo '<p style="margin: 5px 0;"><strong>📞 Téléphone:</strong> ' . esc_html($contact['phone']) . '</p>';
                }
                
                if (!empty($contact['website'])) {
                    echo '<p style="margin: 5px 0;"><strong>🌐 Site web:</strong> <a href="' . esc_attr($contact['website']) . '" target="_blank">' . esc_html($contact['website']) . '</a></p>';
                } else {
                    echo '<p style="margin: 5px 0;"><strong>🌐 Site web:</strong> <em>Non renseigné</em></p>';
                }
                
                echo '<p style="margin: 5px 0;"><strong>📍 Zone:</strong> ' . esc_html($contact['zone']) . '</p>';
                echo '<p style="margin: 5px 0;"><strong>📅 Qualification:</strong> ' . esc_html($contact['qualification_date']) . '</p>';
                
                if (!empty($contact['competences'])) {
                    echo '<p style="margin: 5px 0;"><strong>🎯 Compétences:</strong> ' . esc_html(implode(', ', $contact['competences'])) . '</p>';
                } else {
                    echo '<p style="margin: 5px 0;"><strong>🎯 Compétences:</strong> <em>Aucune compétence définie</em></p>';
                }
                
                if (!empty($contact['description'])) {
                    $truncated = strlen($contact['description']) > 150 ? substr($contact['description'], 0, 150) . '...' : $contact['description'];
                    echo '<p style="margin: 5px 0;"><strong>📝 Descriptif:</strong> ' . esc_html($truncated) . '</p>';
                }
                
                echo '</div>';
            }
            
            echo '</div>';
        }
        
    } else {
        echo '<p style="color: red;">❌ Échec de la récupération avec pagination !</p>';
    }
    
    // Statistiques du cache final v19
    echo '<h4>💾 Statistiques du cache v19 avec rayons dynamiques :</h4>';
    $contacts = get_transient('pipedrive_map_processed_contacts_v19');
    if ($contacts !== false && !empty($contacts)) {
        $competence_stats = [];
        $websites_count = 0;
        $grouped_contacts = 0;
        
        foreach ($contacts as $contact) {
            if ($contact['is_multiple']) {
                foreach ($contact['competences'] as $competence) {
                    $key = $competence['competence'];
                    $competence_stats[$key] = ($competence_stats[$key] ?? 0) + 1;
                }
            } else {
                $key = $contact['competence'];
                $competence_stats[$key] = ($competence_stats[$key] ?? 0) + 1;
            }
            
            if (!empty($contact['website'])) {
                $websites_count++;
            }
            
            if (isset($contact['is_grouped']) && $contact['is_grouped'] && $contact['group_size'] > 1) {
                $grouped_contacts++;
            }
        }
        
        echo "<div style='background: #d1ecf1; padding: 15px; border-radius: 6px;'>";
        echo "<p><strong>📊 Contacts finaux sur la carte :</strong> " . count($contacts) . "</p>";
        echo '<ul>';
        foreach ($competence_stats as $competence => $count) {
            echo '<li><strong>' . esc_html(ucfirst(str_replace('_', ' ', $competence))) . '</strong> : ' . $count . ' professionnel(s)</li>';
        }
        echo '</ul>';
        echo "<p><strong>🌐 Sites web renseignés :</strong> {$websites_count} sur " . count($contacts) . " professionnels</p>";
        echo "<p><strong>📍 NOUVEAU v7.4 - Contacts avec gestion des doublons :</strong> {$grouped_contacts} contacts repositionnés</p>";
        echo "</div>";
        
    } else {
        echo '<p>Cache v19 non encore généré. Utilisez le shortcode pour générer les données.</p>';
    }
}

// --- Section 12: Bouton pour vider le cache ---

add_action('admin_bar_menu', 'pipedrive_map_add_clear_cache_button', 999);
function pipedrive_map_add_clear_cache_button($wp_admin_bar) {
    if (current_user_can('manage_options')) {
        $args = array(
            'id'    => 'pipedrive_map_clear_cache',
            'title' => '🗑️ Vider Cache Pipedrive Map',
            'href'  => add_query_arg('clear_pipedrive_cache', '1'),
        );
        $wp_admin_bar->add_node($args);
    }
}

// Gérer le vidage du cache
add_action('init', 'pipedrive_map_handle_cache_clear');
function pipedrive_map_handle_cache_clear() {
    if (isset($_GET['clear_pipedrive_cache']) && current_user_can('manage_options')) {
        // Supprimer tous les anciens et nouveaux caches
        for ($i = 6; $i <= 19; $i++) {
            delete_transient('pipedrive_map_processed_contacts_v' . $i);
        }
        
        // Supprimer aussi les caches de géocodage
        global $wpdb;
        $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_geo_%'");
        $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_timeout_geo_%'");
        
        // Rediriger sans le paramètre
        wp_redirect(remove_query_arg('clear_pipedrive_cache'));
        exit;
    }
}

// --- Section 13: Shortcode de debug pour les administrateurs ---

add_shortcode('pipedrive_debug', 'pipedrive_debug_shortcode');
function pipedrive_debug_shortcode() {
    if (!current_user_can('manage_options')) {
        return '<p>Accès réservé aux administrateurs.</p>';
    }
    
    ob_start();
    ?>
    <div style="background: #f0f0f0; padding: 20px; border: 2px solid #28a745; margin: 20px 0; border-radius: 8px;">
        <h2 style="color: #28a745; margin-top: 0;">🚀 Debug Complet Pipedrive Map v7.4 - FILTRE "FRANCE"</h2>
        <p style="background: #d4edda; padding: 15px; border: 1px solid #c3e6cb; border-radius: 6px;">
            <strong>Version 7.4 - NOUVELLE FONCTIONNALITÉ :</strong><br>
            🚫 <strong>FILTRE "FRANCE" :</strong> Masque automatiquement les contacts dont la localisation est "France"<br>
            📍 <strong>GESTION DES DOUBLONS :</strong> Évite la superposition des marqueurs ayant la même localisation<br>
            🔄 <strong>OFFSETS AUTOMATIQUES :</strong> Repositionnement en cercle des contacts à la même adresse<br>
            ✅ <strong>PAGINATION MAINTENUE :</strong> Récupération complète de TOUS les contacts
        </p>
        <?php pipedrive_debug_data(); ?>
        
        <div style="margin-top: 20px; padding: 15px; background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 4px;">
            <h4 style="margin-top: 0;">🆕 Nouvelles fonctionnalités v7.4 :</h4>
            <ul>
                <li>🚫 <strong>FILTRE "FRANCE"</strong> - Les contacts avec la zone "France" sont ignorés</li>
                <li>📍 <strong>DÉTECTION DES DOUBLONS</strong> - Groupement par coordonnées identiques (tolérance 0.001°)</li>
                <li>🔄 <strong>OFFSETS EN CERCLE</strong> - Repositionnement automatique avec un rayon de ~500m</li>
                <li>👥 <strong>INDICATEURS VISUELS</strong> - Affichage du nombre de contacts dans la même zone</li>
                <li>🎯 <strong>MARQUEURS INDIVIDUELS</strong> - Chaque contact a son propre marqueur visible</li>
                <li>💾 <strong>CACHE v19</strong> - Nouvelle version pour stocker les données filtrées</li>
                <li>🔍 <strong>LOGS DÉTAILLÉS</strong> - Surveillance des groupements et repositionnements</li>
            </ul>
        </div>

        <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border: 1px solid #ffeeba; border-radius: 4px;">
            <h4 style="margin-top: 0;">🧪 Test de la gestion des doublons v7.4 :</h4>
            <ol>
                <li><strong>Videz le cache v19</strong> avec le bouton dans la barre d'admin</li>
                <li><strong>Utilisez le shortcode</strong> : <code>[pipedrive_leaflet_map]</code></li>
                <li><strong>Observez la carte</strong> - tous les contacts sont maintenant visibles individuellement</li>
                <li><strong>Vérifiez les popups</strong> - indication du nombre de contacts dans la même zone</li>
                <li><strong>Consultez les logs</strong> - détails des groupements détectés et traités</li>
            </ol>
            
            <p style="background: #e2e3e5; padding: 10px; border-radius: 4px; margin-top: 10px;">
                <strong>💡 Principe :</strong> Quand plusieurs contacts ont la même adresse, le premier garde la position originale 
                et les suivants sont décalés en cercle autour de cette position. Chaque contact reste cliquable individuellement !
            </p>
        </div>

        <div style="margin-top: 20px; padding: 15px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;">
            <h4 style="margin-top: 0;">🔧 Comment ça fonctionne techniquement :</h4>
            <ol>
                <li><strong>FILTRAGE :</strong> Les contacts avec la zone "France" sont exclus au début du traitement.</li>
                <li><strong>Groupement :</strong> Les contacts restants sont groupés par coordonnées (tolérance 0.001°)</li>
                <li><strong>Détection :</strong> Si plusieurs contacts ont la même localisation, ils sont identifiés</li>
                <li><strong>Calcul d'offset :</strong> Angles calculés en cercle (2π / nombre de contacts)</li>
                <li><strong>Repositionnement :</strong> Application d'un rayon de 0.005° (~500m) avec cos/sin</li>
                <li><strong>Conservation :</strong> Le premier contact garde sa position originale</li>
                <li><strong>Métadonnées :</strong> Ajout d'informations de groupement pour l'affichage</li>
            </ol>
        </div>
    </div>
    <?php
    return ob_get_clean();
}

// --- Section 14: Widget dashboard mis à jour pour v7.4 ---

add_action('wp_dashboard_setup', 'pipedrive_add_dashboard_widget');
function pipedrive_add_dashboard_widget() {
    if (current_user_can('manage_options')) {
        wp_add_dashboard_widget(
            'pipedrive_map_status',
            '🚀 Pipedrive Map Status v7.4 - FILTRE "FRANCE"',
            'pipedrive_dashboard_widget_content'
        );
    }
}

function pipedrive_dashboard_widget_content() {
    $api_key = get_option('pipedrive_api_key');
    $contacts = get_transient('pipedrive_map_processed_contacts_v19'); // Cache v19
    
    if (empty($api_key)) {
        echo '<p style="color: red;">⚠️ Clé API Pipedrive non configurée</p>';
        echo '<a href="' . admin_url('options-general.php?page=pipedrive-map-settings') . '" class="button">Configurer</a>';
        return;
    }
    
    if ($contacts === false) {
        echo '<p>🔄 Données non encore chargées avec pagination v7.4</p>';
        echo '<p style="font-size: 12px; color: #666;">Première récupération avec gestion des doublons et filtre "France"</p>';
    } else {
        $count = is_array($contacts) ? count($contacts) : 0;
        echo '<p>✅ <strong>' . $count . '</strong> professionnels sur la carte</p>';
        echo '<p style="font-size: 12px; color: #28a745;">🚫 Filtre "France" actif</p>';
        
        if ($count > 0) {
            // Statistiques par compétences et doublons
            $competence_stats = [];
            $websites_count = 0;
            $grouped_contacts = 0;
            
            foreach ($contacts as $contact) {
                if ($contact['is_multiple']) {
                    foreach ($contact['competences'] as $competence) {
                        $key = $competence['competence'];
                        $competence_stats[$key] = ($competence_stats[$key] ?? 0) + 1;
                    }
                } else {
                    $key = $contact['competence'];
                    $competence_stats[$key] = ($competence_stats[$key] ?? 0) + 1;
                }
                
                if (!empty($contact['website'])) {
                    $websites_count++;
                }
                
                if (isset($contact['is_grouped']) && $contact['is_grouped'] && $contact['group_size'] > 1) {
                    $grouped_contacts++;
                }
            }
            
            echo '<div style="background: #f9f9f9; padding: 10px; border-radius: 4px; margin: 10px 0;">';
            echo '<p style="margin: 0; font-size: 12px;"><strong>Répartition par compétences :</strong></p>';
            echo '<ul style="margin: 5px 0; font-size: 11px;">';
            
            $competence_labels = [
                'formation' => '🎓 Formation',
                'materiel' => '🔧 Matériel',
                'ergonome_presentiel' => '⚙️ Ergonome',
                'psychologue_presentiel' => '🧠 Psychologue',
                'consultant_prevention' => '🛡️ Consultant',
                'multiple' => '🔄 Multiples',
                'non_defini' => '❓ Non défini'
            ];
            
            foreach ($competence_stats as $competence => $stat_count) {
                if ($stat_count > 0) {
                    $label = $competence_labels[$competence] ?? ucfirst($competence);
                    echo '<li>' . $label . ': ' . $stat_count . '</li>';
                }
            }
            echo '</ul>';
            
            // Nouvelles statistiques v7.4
            echo '<p style="margin: 5px 0; font-size: 11px;"><strong>🌐 Sites web :</strong> ' . $websites_count . ' renseignés</p>';
            echo '<p style="margin: 5px 0; font-size: 11px;"><strong>📍 Contacts repositionnés :</strong> ' . $grouped_contacts . ' (doublons de localisation)</p>';
            
            echo '</div>';
        }
    }
    
    echo '<p style="background: #d1ecf1; padding: 8px; border-radius: 4px; font-size: 12px;">';
    echo '<strong>v7.4 FILTRE "FRANCE"</strong> - Les contacts avec la localisation "France" sont masqués';
    echo '</p>';
    
    echo '<p>';
    echo '<a href="' . admin_url('options-general.php?page=pipedrive-map-settings') . '" class="button">⚙️ Réglages</a> ';
    echo '<a href="' . admin_url('options-general.php?page=pipedrive-debug') . '" class="button">🔍 Debug v7.4</a> ';
    echo '<a href="' . add_query_arg('clear_pipedrive_cache', '1') . '" class="button">🗑️ Vider Cache v19</a>';
    echo '</p>';
}

// Ajouter une page de debug dans l'admin mise à jour pour v7.4
add_action('admin_menu', 'pipedrive_add_debug_page');
function pipedrive_add_debug_page() {
    add_submenu_page(
        'pipedrive-map-settings',
        'Debug Pipedrive v7.4',
        'Debug Filtre v7.4',
        'manage_options',
        'pipedrive-debug',
        'pipedrive_debug_page_html'
    );
}

function pipedrive_debug_page_html() {
    if (!current_user_can('manage_options')) {
        return;
    }
    ?>
    <div class="wrap">
        <h1>🚀 Debug Complet Pipedrive v7.4 - FILTRE "FRANCE"</h1>
        <div style="background: white; padding: 20px; margin-top: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <?php pipedrive_debug_data(); ?>
        </div>
        
        <div style="background: #e7f3ff; padding: 20px; margin-top: 20px; border-left: 4px solid #28a745;">
            <h2>🚀 Nouveautés v7.4 :</h2>
            <ul>
                <li><strong>FILTRE "FRANCE" :</strong> Les contacts dont la zone d'intervention est "France" sont masqués.</li>
                <li><strong>GESTION DES DOUBLONS :</strong> Détection automatique des contacts avec la même localisation</li>
                <li><strong>OFFSETS EN CERCLE :</strong> Repositionnement intelligent autour de la position originale</li>
                <li><strong>MARQUEURS INDIVIDUELS :</strong> Chaque contact a son propre marqueur visible sur la carte</li>
                <li><strong>CACHE v19 :</strong> Nouvelle version pour stocker les données avec le filtre appliqué</li>
            </ul>
            
            <h3>Problème résolu :</h3>
            <p style="background: #d4edda; padding: 15px; border-radius: 4px;">
                <strong>AVANT v7.4 :</strong> Les contacts avec la localisation "France" étaient visibles et pouvaient couvrir la carte.<br>
                <strong>AVEC v7.4 :</strong> Ces contacts sont désormais ignorés et ne s'affichent plus sur la carte.
            </p>
            
            <h3>Fonctionnement technique :</h3>
            <ol>
                <li><strong>Filtrage :</strong> Le code vérifie si la zone d'intervention est "france" (insensible à la casse) et ignore le contact si c'est le cas.</li>
                <li><strong>Groupement :</strong> Analyse des coordonnées avec tolérance de 0.001° (~110m)</li>
                <li><strong>Détection :</strong> Identification des groupes de 2+ contacts à la même position</li>
                <li><strong>Calcul :</strong> Répartition en cercle avec angle = 2π / nombre de contacts</li>
                <li><strong>Offset :</strong> Application d'un rayon de 0.005° (~500m) avec trigonométrie</li>
            </ol>
            
            <h3>Test de la fonctionnalité :</h3>
            <ol>
                <li><strong>Videz le cache v19</strong> pour forcer le recalcul</li>
                <li><strong>Placez le shortcode</strong> : <code>[pipedrive_leaflet_map]</code></li>
                <li><strong>Observez la carte</strong> - les points "France" ne sont plus visibles</li>
            </ol>
        </div>
    </div>
    <?php
}

// --- Section 15: Shortcodes de test pour les doublons ---

add_shortcode('pipedrive_test_doublons', 'pipedrive_test_doublons_shortcode');
function pipedrive_test_doublons_shortcode() {
    if (!current_user_can('manage_options')) {
        return '<p>Accès réservé aux administrateurs.</p>';
    }
    
    ob_start();
    ?>
    <div style="background: #f8f9fa; padding: 20px; border: 2px solid #007cba; margin: 20px 0; border-radius: 8px;">
        <h3 style="color: #007cba; margin-top: 0;">🧪 Test de la Gestion des Doublons v7.4</h3>
        
        <?php
        // Créer des contacts de test avec la même localisation
        $test_contacts = [
            ['name' => 'Contact A', 'lat' => '48.8566', 'lng' => '2.3522'],
            ['name' => 'Contact B', 'lat' => '48.8566', 'lng' => '2.3522'],
            ['name' => 'Contact C', 'lat' => '48.8566', 'lng' => '2.3522'],
            ['name' => 'Contact D', 'lat' => '48.8567', 'lng' => '2.3523'], // Différent
            ['name' => 'Contact E', 'lat' => '48.8566', 'lng' => '2.3522'], // Même que A,B,C
        ];
        
        echo '<h4>🔄 Test avec 5 contacts dont 4 à la même position...</h4>';
        echo '<div style="background: white; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 12px;">';
        
        echo '<p><strong>Contacts de test :</strong></p>';
        foreach ($test_contacts as $i => $contact) {
            echo "Contact " . ($i + 1) . ": {$contact['name']} - Lat: {$contact['lat']}, Lng: {$contact['lng']}<br>";
        }
        
        echo '<br><p><strong>Application de la fonction group_contacts_by_location()...</strong></p>';
        
        $start_time = microtime(true);
        $grouped_contacts = group_contacts_by_location($test_contacts);
        $end_time = microtime(true);
        
        $duration = round(($end_time - $start_time) * 1000, 2);
        
        echo "<p style='color: #28a745; font-weight: bold;'>✅ Test terminé en {$duration}ms</p>";
        echo "<p><strong>📊 Résultats :</strong></p>";
        echo "<p><strong>Contacts avant :</strong> " . count($test_contacts) . "</p>";
        echo "<p><strong>Contacts après :</strong> " . count($grouped_contacts) . "</p>";
        
        echo '<br><p><strong>Détail des positions après traitement :</strong></p>';
        foreach ($grouped_contacts as $i => $contact) {
            echo "Contact " . ($i + 1) . ": {$contact['name']} - ";
            echo "Lat: " . round($contact['lat'], 6) . ", Lng: " . round($contact['lng'], 6);
            
            if (isset($contact['is_grouped']) && $contact['is_grouped']) {
                echo " <span style='color: #1565c0; font-weight: bold;'>[GROUPÉ - Index: {$contact['group_index']}/{$contact['group_size']}]</span>";
                
                if (isset($contact['original_lat'])) {
                    $offset_lat = round($contact['lat'] - $contact['original_lat'], 6);
                    $offset_lng = round($contact['lng'] - $contact['original_lng'], 6);
                    echo " <span style='color: #d32f2f;'>[Offset: Lat {$offset_lat}, Lng {$offset_lng}]</span>";
                }
            }
            echo "<br>";
        }
        
        // Vérifier que les offsets sont bien appliqués
        $same_position_count = 0;
        $positions = [];
        foreach ($grouped_contacts as $contact) {
            $pos_key = round($contact['lat'], 4) . ',' . round($contact['lng'], 4);
            if (isset($positions[$pos_key])) {
                $same_position_count++;
            } else {
                $positions[$pos_key] = true;
            }
        }
        
        if ($same_position_count === 0) {
            echo "<p style='background: #d4edda; padding: 10px; border-radius: 4px; color: #155724;'>";
            echo "<strong>🎉 Succès !</strong> Tous les contacts ont des positions uniques après traitement.";
            echo "</p>";
        } else {
            echo "<p style='background: #f8d7da; padding: 10px; border-radius: 4px; color: #721c24;'>";
            echo "<strong>⚠️ Attention :</strong> {$same_position_count} contact(s) ont encore la même position.";
            echo "</p>";
        }
        
        echo '</div>';
        ?>
        
        <p style="margin-top: 15px; font-size: 12px; color: #666;">
            <strong>Note :</strong> Ce test simule le traitement appliqué aux vrais contacts de votre base Pipedrive. 
            Dans la pratique, cela évite que plusieurs marqueurs se superposent au même endroit sur la carte.
        </p>
    </div>
    <?php
    return ob_get_clean();
}

// Fonction de nettoyage lors de la désactivation
register_deactivation_hook(__FILE__, 'pipedrive_map_deactivation');
function pipedrive_map_deactivation() {
    // Nettoyer tous les caches
    for ($i = 6; $i <= 19; $i++) {
        delete_transient('pipedrive_map_processed_contacts_v' . $i);
    }
    
    // Nettoyer les caches de géocodage (optionnel)
    global $wpdb;
    $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_geo_%'");
    $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_timeout_geo_%'");
}

// Afficher les infos de version dans les logs
add_action('init', 'pipedrive_map_log_version');
function pipedrive_map_log_version() {
    if (current_user_can('manage_options') && isset($_GET['pipedrive_debug'])) {
        error_log('=== Pipedrive Map Plugin v7.4 - FILTRE "FRANCE" ===');
        error_log('WordPress Version: ' . get_bloginfo('version'));
        error_log('Plugin activé avec pagination, gestion des doublons et filtre "France"');
        error_log('Récupération complète + offsets automatiques + masquage des localisations "France"');
    }
}

?>