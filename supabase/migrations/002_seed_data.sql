-- =============================================
-- REKRUUT — Données de test (seed)
-- Désactiver RLS temporairement pour l'insertion
-- =============================================

-- Organisations de test
INSERT INTO organizations (id, name, type, address, city, region, phone, email, website)
VALUES
  (
    'a1b2c3d4-0001-0001-0001-000000000001',
    'Interim Solutions Wallonie',
    'agency',
    'Rue de Namur 45',
    'Liège',
    'wallonie',
    '+32 4 222 33 44',
    'contact@interim-solutions.be',
    'https://interim-solutions.be'
  ),
  (
    'a1b2c3d4-0002-0002-0002-000000000002',
    'LogiTech Industries SA',
    'company',
    'Zone Industrielle du Trilogiport',
    'Liège',
    'wallonie',
    '+32 4 333 44 55',
    'rh@logitech-industries.be',
    NULL
  );

-- Abonnements
INSERT INTO subscriptions (organization_id, plan, status, trial_ends_at)
VALUES
  (
    'a1b2c3d4-0001-0001-0001-000000000001',
    'agency',
    'trial',
    NOW() + INTERVAL '30 days'
  ),
  (
    'a1b2c3d4-0002-0002-0002-000000000002',
    'starter',
    'trial',
    NOW() + INTERVAL '30 days'
  );

-- =============================================
-- Offres d'emploi (5 offres)
-- Note: created_by sera mis à jour manuellement
-- après création des utilisateurs auth
-- =============================================

-- On crée un UUID fictif pour created_by (sera remplacé après auth)
-- Ces offres appartiennent à l'agence

INSERT INTO job_offers (
  id, organization_id, created_by,
  title, description, contract_type, sector, city, region,
  salary_min, salary_max, salary_period, show_salary,
  required_licenses, required_languages, shift_type,
  is_urgent, status
)
VALUES
  (
    'b1b2c3d4-0001-0001-0001-000000000001',
    'a1b2c3d4-0001-0001-0001-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'Cariste CACES 3',
    'Nous recherchons un cariste expérimenté avec CACES 3 pour notre client basé à Liège. Poste en horaire de jour, du lundi au vendredi.

Missions :
- Réception et mise en stock de marchandises
- Préparation de commandes
- Utilisation du chariot élévateur CACES 3
- Contrôle des stocks

Profil :
- CACES 3 en cours de validité obligatoire
- Expérience minimum 2 ans en logistique
- Rigoureux et organisé',
    'interim',
    'logistique',
    'Liège',
    'wallonie',
    1400, 1700, 'mois', TRUE,
    ARRAY['B'],
    ARRAY['fr'],
    'jour',
    TRUE,
    'active'
  ),
  (
    'b1b2c3d4-0002-0002-0002-000000000002',
    'a1b2c3d4-0001-0001-0001-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'Chauffeur SPL — Distribution régionale',
    'Notre client, leader de la distribution en Wallonie, recrute un chauffeur SPL pour ses tournées régionales.

Missions :
- Livraison de marchandises en régional (découchés rares)
- Conduite d'un ensemble routier de type semi-remorque
- Chargement/déchargement avec hayon

Profil :
- Permis CE + FIMO/FCO à jour
- 3 ans d''expérience minimum
- Bonne connaissance du réseau wallon',
    'cdi',
    'transport',
    'Namur',
    'wallonie',
    2200, 2800, 'mois', TRUE,
    ARRAY['B', 'C', 'CE'],
    ARRAY['fr'],
    'jour',
    FALSE,
    'active'
  ),
  (
    'b1b2c3d4-0003-0003-0003-000000000003',
    'a1b2c3d4-0001-0001-0001-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'Opérateur de production — industrie alimentaire',
    'Intégrez une usine agroalimentaire moderne à Charleroi. Poste en équipe 2x8.

Missions :
- Surveillance et alimentation des lignes de production
- Contrôle qualité visuel
- Respect des normes HACCP
- Nettoyage et entretien du poste

Profil :
- Première expérience en industrie souhaitée
- Disponible pour les horaires 2x8 (6h-14h / 14h-22h)
- Sérieux et ponctuel',
    'interim',
    'industrie',
    'Charleroi',
    'wallonie',
    13, 15, 'heure', TRUE,
    ARRAY[]::TEXT[],
    ARRAY['fr'],
    'flexible',
    FALSE,
    'active'
  ),
  (
    'b1b2c3d4-0004-0004-0004-000000000004',
    'a1b2c3d4-0002-0002-0002-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'Agent logistique polyvalent',
    'LogiTech Industries recrute un agent logistique pour son entrepôt de 15 000 m².

Missions :
- Réception de marchandises
- Scan et contrôle des palettes
- Rangement en rack
- Préparation de commandes

Profil :
- CACES 1 et/ou 3 apprécié
- Dynamique et rigoureux
- Disponible immédiatement',
    'cdd',
    'logistique',
    'Liège',
    'wallonie',
    NULL, NULL, NULL, FALSE,
    ARRAY[]::TEXT[],
    ARRAY['fr', 'nl'],
    'jour',
    TRUE,
    'active'
  ),
  (
    'b1b2c3d4-0005-0005-0005-000000000005',
    'a1b2c3d4-0001-0001-0001-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'Agent de sécurité — site industriel',
    'Pour un client dans le secteur pétrochimique, nous recrutons un agent de sécurité SSIAP.

Missions :
- Surveillance du site 24h/24
- Contrôle des accès
- Rondes de sécurité
- Intervention en cas d''incident

Profil :
- Carte professionnelle en cours de validité
- SSIAP 1 minimum
- Disponible pour les nuits et week-ends',
    'interim',
    'securite',
    'Liège',
    'wallonie',
    14, 17, 'heure', TRUE,
    ARRAY['B'],
    ARRAY['fr'],
    'nuit',
    FALSE,
    'active'
  );

-- =============================================
-- Candidats (20 candidats avec vrais noms belges)
-- =============================================

INSERT INTO candidates (
  organization_id, first_name, last_name, phone, email,
  city, region, availability, licenses, languages,
  has_caces, caces_types, experience_years, sectors, status
)
VALUES
  -- Candidats actifs disponibles immédiatement
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Jean-Pierre', 'Dubois', '+32 4 111 22 33', 'jp.dubois@email.be',
   'Liège', 'wallonie', 'immediate', ARRAY['B', 'C'], ARRAY['fr'], TRUE, ARRAY['CACES3'], 5, ARRAY['logistique', 'transport'], 'actif'),

  ('a1b2c3d4-0001-0001-0001-000000000001', 'Ahmed', 'Benali', '+32 4 222 33 44', 'a.benali@email.be',
   'Liège', 'wallonie', 'immediate', ARRAY['B'], ARRAY['fr', 'nl'], TRUE, ARRAY['CACES1', 'CACES3'], 3, ARRAY['logistique'], 'actif'),

  ('a1b2c3d4-0001-0001-0001-000000000001', 'Pieter', 'Van den Berg', '+32 4 333 44 55', NULL,
   'Liège', 'wallonie', 'immediate', ARRAY['B', 'C', 'CE'], ARRAY['fr', 'nl'], FALSE, ARRAY[]::TEXT[], 8, ARRAY['transport'], 'actif'),

  ('a1b2c3d4-0001-0001-0001-000000000001', 'Marie', 'Lecomte', '+32 478 12 34 56', 'marie.lecomte@gmail.com',
   'Namur', 'wallonie', '1_semaine', ARRAY['B'], ARRAY['fr'], FALSE, ARRAY[]::TEXT[], 2, ARRAY['industrie', 'logistique'], 'actif'),

  ('a1b2c3d4-0001-0001-0001-000000000001', 'Mohammed', 'El Fassi', '+32 485 23 45 67', NULL,
   'Charleroi', 'wallonie', 'immediate', ARRAY['B'], ARRAY['fr', 'nl'], TRUE, ARRAY['CACES1'], 1, ARRAY['logistique'], 'actif'),

  ('a1b2c3d4-0001-0001-0001-000000000001', 'Kevin', 'Renard', '+32 472 34 56 78', 'k.renard@hotmail.com',
   'Liège', 'wallonie', 'immediate', ARRAY['B', 'C'], ARRAY['fr'], TRUE, ARRAY['CACES3', 'CACES5'], 6, ARRAY['logistique', 'industrie'], 'actif'),

  ('a1b2c3d4-0001-0001-0001-000000000001', 'Sofia', 'Nguyen', '+32 496 45 67 89', 'sofia.nguyen@gmail.com',
   'Liège', 'wallonie', '1_mois', ARRAY['B'], ARRAY['fr'], FALSE, ARRAY[]::TEXT[], 3, ARRAY['industrie'], 'actif'),

  ('a1b2c3d4-0001-0001-0001-000000000001', 'Bruno', 'Masson', '+32 476 56 78 90', NULL,
   'Huy', 'wallonie', 'immediate', ARRAY['B'], ARRAY['fr'], TRUE, ARRAY['CACES1', 'CACES3', 'CACES5'], 10, ARRAY['logistique'], 'en_mission'),

  ('a1b2c3d4-0001-0001-0001-000000000001', 'Lucie', 'Lambert', '+32 499 67 89 01', 'lucie.lambert@email.be',
   'Namur', 'wallonie', '1_semaine', ARRAY['B'], ARRAY['fr'], FALSE, ARRAY[]::TEXT[], 4, ARRAY['nettoyage'], 'actif'),

  ('a1b2c3d4-0001-0001-0001-000000000001', 'Sébastien', 'Pire', '+32 471 78 90 12', NULL,
   'Liège', 'wallonie', 'immediate', ARRAY['B', 'C', 'CE'], ARRAY['fr'], FALSE, ARRAY[]::TEXT[], 7, ARRAY['transport'], 'actif'),

  ('a1b2c3d4-0001-0001-0001-000000000001', 'Fatima', 'Oukili', '+32 488 89 01 23', 'f.oukili@gmail.com',
   'Charleroi', 'wallonie', 'immediate', ARRAY['B'], ARRAY['fr', 'nl'], FALSE, ARRAY[]::TEXT[], 2, ARRAY['industrie', 'nettoyage'], 'actif'),

  ('a1b2c3d4-0001-0001-0001-000000000001', 'Julien', 'Colignon', '+32 474 90 12 34', NULL,
   'Seraing', 'wallonie', 'immediate', ARRAY['B'], ARRAY['fr'], TRUE, ARRAY['CACES3'], 4, ARRAY['logistique', 'industrie'], 'en_mission'),

  ('a1b2c3d4-0001-0001-0001-000000000001', 'Nicolas', 'Fonteneau', '+32 491 01 23 45', 'n.fonteneau@email.be',
   'Liège', 'wallonie', '1_semaine', ARRAY['B', 'C'], ARRAY['fr'], FALSE, ARRAY[]::TEXT[], 5, ARRAY['transport', 'logistique'], 'actif'),

  ('a1b2c3d4-0001-0001-0001-000000000001', 'Layla', 'Benmoussa', '+32 477 12 23 34', NULL,
   'Liège', 'wallonie', 'immediate', ARRAY['B'], ARRAY['fr', 'nl', 'en'], FALSE, ARRAY[]::TEXT[], 1, ARRAY['nettoyage'], 'actif'),

  ('a1b2c3d4-0001-0001-0001-000000000001', 'Christophe', 'Lejeune', '+32 494 23 34 45', 'c.lejeune@hotmail.com',
   'Namur', 'wallonie', 'immediate', ARRAY['B'], ARRAY['fr'], TRUE, ARRAY['CACES1', 'CACES3'], 9, ARRAY['logistique'], 'place'),

  ('a1b2c3d4-0001-0001-0001-000000000001', 'Alexia', 'Gilles', '+32 473 34 45 56', NULL,
   'Liège', 'wallonie', '1_mois', ARRAY['B'], ARRAY['fr'], FALSE, ARRAY[]::TEXT[], 2, ARRAY['industrie'], 'actif'),

  ('a1b2c3d4-0001-0001-0001-000000000001', 'Mehdi', 'Zahraoui', '+32 486 45 56 67', 'm.zahraoui@gmail.com',
   'Charleroi', 'wallonie', 'immediate', ARRAY['B', 'C'], ARRAY['fr', 'nl'], FALSE, ARRAY[]::TEXT[], 4, ARRAY['transport'], 'actif'),

  ('a1b2c3d4-0001-0001-0001-000000000001', 'Thomas', 'Pirard', '+32 479 56 67 78', NULL,
   'Liège', 'wallonie', 'immediate', ARRAY['B'], ARRAY['fr'], TRUE, ARRAY['CACES5'], 6, ARRAY['logistique'], 'actif'),

  ('a1b2c3d4-0001-0001-0001-000000000001', 'Amina', 'Khaldi', '+32 492 67 78 89', 'amina.khaldi@email.be',
   'Liège', 'wallonie', '1_semaine', ARRAY['B'], ARRAY['fr', 'nl'], FALSE, ARRAY[]::TEXT[], 3, ARRAY['industrie', 'nettoyage'], 'actif'),

  ('a1b2c3d4-0001-0001-0001-000000000001', 'Romain', 'Wathelet', '+32 475 78 89 90', NULL,
   'Huy', 'wallonie', 'immediate', ARRAY['B', 'C', 'CE'], ARRAY['fr'], FALSE, ARRAY[]::TEXT[], 12, ARRAY['transport', 'logistique'], 'en_mission');

-- =============================================
-- Candidatures (30 candidatures réparties dans le pipeline)
-- =============================================

INSERT INTO applications (
  job_offer_id, applicant_name, applicant_phone, applicant_email,
  licenses, has_caces, caces_types, availability, status, applied_at
)
VALUES
  -- Offre Cariste CACES 3 (b1b2c3d4-0001...)
  ('b1b2c3d4-0001-0001-0001-000000000001', 'Jean-Pierre Dubois', '+32 4 111 22 33', 'jp.dubois@email.be',
   ARRAY['B', 'C'], TRUE, ARRAY['CACES3'], 'immediate', 'entretien', NOW() - INTERVAL '3 days'),

  ('b1b2c3d4-0001-0001-0001-000000000001', 'Ahmed Benali', '+32 4 222 33 44', 'a.benali@email.be',
   ARRAY['B'], TRUE, ARRAY['CACES1', 'CACES3'], 'immediate', 'contacte', NOW() - INTERVAL '2 days'),

  ('b1b2c3d4-0001-0001-0001-000000000001', 'Kevin Renard', '+32 472 34 56 78', NULL,
   ARRAY['B', 'C'], TRUE, ARRAY['CACES3', 'CACES5'], 'immediate', 'nouveau', NOW() - INTERVAL '1 day'),

  ('b1b2c3d4-0001-0001-0001-000000000001', 'Christophe Lejeune', '+32 494 23 34 45', 'c.lejeune@hotmail.com',
   ARRAY['B'], TRUE, ARRAY['CACES1', 'CACES3'], 'immediate', 'place', NOW() - INTERVAL '10 days'),

  ('b1b2c3d4-0001-0001-0001-000000000001', 'Thomas Pirard', '+32 479 56 67 78', NULL,
   ARRAY['B'], TRUE, ARRAY['CACES5'], 'immediate', 'refuse', NOW() - INTERVAL '7 days'),

  ('b1b2c3d4-0001-0001-0001-000000000001', 'Julien Colignon', '+32 474 90 12 34', NULL,
   ARRAY['B'], TRUE, ARRAY['CACES3'], 'immediate', 'nouveau', NOW() - INTERVAL '4 hours'),

  -- Offre Chauffeur SPL (b1b2c3d4-0002...)
  ('b1b2c3d4-0002-0002-0002-000000000002', 'Pieter Van den Berg', '+32 4 333 44 55', NULL,
   ARRAY['B', 'C', 'CE'], FALSE, ARRAY[]::TEXT[], 'immediate', 'entretien', NOW() - INTERVAL '5 days'),

  ('b1b2c3d4-0002-0002-0002-000000000002', 'Sébastien Pire', '+32 471 78 90 12', NULL,
   ARRAY['B', 'C', 'CE'], FALSE, ARRAY[]::TEXT[], 'immediate', 'contacte', NOW() - INTERVAL '3 days'),

  ('b1b2c3d4-0002-0002-0002-000000000002', 'Romain Wathelet', '+32 475 78 89 90', NULL,
   ARRAY['B', 'C', 'CE'], FALSE, ARRAY[]::TEXT[], 'immediate', 'nouveau', NOW() - INTERVAL '1 day'),

  ('b1b2c3d4-0002-0002-0002-000000000002', 'Nicolas Fonteneau', '+32 491 01 23 45', 'n.fonteneau@email.be',
   ARRAY['B', 'C'], FALSE, ARRAY[]::TEXT[], '1_semaine', 'refuse', NOW() - INTERVAL '8 days'),

  ('b1b2c3d4-0002-0002-0002-000000000002', 'Mehdi Zahraoui', '+32 486 45 56 67', NULL,
   ARRAY['B', 'C'], FALSE, ARRAY[]::TEXT[], 'immediate', 'nouveau', NOW() - INTERVAL '12 hours'),

  -- Offre Opérateur production (b1b2c3d4-0003...)
  ('b1b2c3d4-0003-0003-0003-000000000003', 'Marie Lecomte', '+32 478 12 34 56', 'marie.lecomte@gmail.com',
   ARRAY['B'], FALSE, ARRAY[]::TEXT[], '1_semaine', 'contacte', NOW() - INTERVAL '4 days'),

  ('b1b2c3d4-0003-0003-0003-000000000003', 'Fatima Oukili', '+32 488 89 01 23', 'f.oukili@gmail.com',
   ARRAY['B'], FALSE, ARRAY[]::TEXT[], 'immediate', 'entretien', NOW() - INTERVAL '6 days'),

  ('b1b2c3d4-0003-0003-0003-000000000003', 'Sofia Nguyen', '+32 496 45 67 89', 'sofia.nguyen@gmail.com',
   ARRAY['B'], FALSE, ARRAY[]::TEXT[], '1_mois', 'nouveau', NOW() - INTERVAL '2 days'),

  ('b1b2c3d4-0003-0003-0003-000000000003', 'Amina Khaldi', '+32 492 67 78 89', 'amina.khaldi@email.be',
   ARRAY['B'], FALSE, ARRAY[]::TEXT[], '1_semaine', 'place', NOW() - INTERVAL '15 days'),

  ('b1b2c3d4-0003-0003-0003-000000000003', 'Layla Benmoussa', '+32 477 12 23 34', NULL,
   ARRAY['B'], FALSE, ARRAY[]::TEXT[], 'immediate', 'nouveau', NOW() - INTERVAL '6 hours'),

  ('b1b2c3d4-0003-0003-0003-000000000003', 'Mohammed El Fassi', '+32 485 23 45 67', NULL,
   ARRAY['B'], TRUE, ARRAY['CACES1'], 'immediate', 'contacte', NOW() - INTERVAL '3 days'),

  -- Offre Agent logistique PME (b1b2c3d4-0004...)
  ('b1b2c3d4-0004-0004-0004-000000000004', 'Bruno Masson', '+32 476 56 78 90', NULL,
   ARRAY['B'], TRUE, ARRAY['CACES1', 'CACES3', 'CACES5'], 'immediate', 'place', NOW() - INTERVAL '12 days'),

  ('b1b2c3d4-0004-0004-0004-000000000004', 'Alexia Gilles', '+32 473 34 45 56', NULL,
   ARRAY['B'], FALSE, ARRAY[]::TEXT[], '1_mois', 'refuse', NOW() - INTERVAL '9 days'),

  ('b1b2c3d4-0004-0004-0004-000000000004', 'Mohammed El Fassi', '+32 485 23 45 67', NULL,
   ARRAY['B'], TRUE, ARRAY['CACES1'], 'immediate', 'entretien', NOW() - INTERVAL '4 days'),

  ('b1b2c3d4-0004-0004-0004-000000000004', 'Kevin Renard', '+32 472 34 56 78', 'k.renard@hotmail.com',
   ARRAY['B', 'C'], TRUE, ARRAY['CACES3', 'CACES5'], 'immediate', 'contacte', NOW() - INTERVAL '2 days'),

  ('b1b2c3d4-0004-0004-0004-000000000004', 'Thomas Pirard', '+32 479 56 67 78', NULL,
   ARRAY['B'], TRUE, ARRAY['CACES5'], 'immediate', 'nouveau', NOW() - INTERVAL '1 day'),

  ('b1b2c3d4-0004-0004-0004-000000000004', 'Julien Martin', '+32 471 99 88 77', NULL,
   ARRAY['B'], FALSE, ARRAY[]::TEXT[], 'immediate', 'nouveau', NOW() - INTERVAL '3 hours'),

  -- Offre Agent de sécurité (b1b2c3d4-0005...)
  ('b1b2c3d4-0005-0005-0005-000000000005', 'Nicolas Fonteneau', '+32 491 01 23 45', 'n.fonteneau@email.be',
   ARRAY['B', 'C'], FALSE, ARRAY[]::TEXT[], '1_semaine', 'contacte', NOW() - INTERVAL '5 days'),

  ('b1b2c3d4-0005-0005-0005-000000000005', 'Mehdi Zahraoui', '+32 486 45 56 67', NULL,
   ARRAY['B'], FALSE, ARRAY[]::TEXT[], 'immediate', 'nouveau', NOW() - INTERVAL '2 days'),

  ('b1b2c3d4-0005-0005-0005-000000000005', 'Romain Wathelet', '+32 475 78 89 90', NULL,
   ARRAY['B'], FALSE, ARRAY[]::TEXT[], 'immediate', 'refuse', NOW() - INTERVAL '11 days'),

  ('b1b2c3d4-0005-0005-0005-000000000005', 'Sébastien Pire', '+32 471 78 90 12', NULL,
   ARRAY['B'], FALSE, ARRAY[]::TEXT[], 'immediate', 'entretien', NOW() - INTERVAL '6 days'),

  ('b1b2c3d4-0005-0005-0005-000000000005', 'Christophe Lejeune', '+32 494 23 34 45', NULL,
   ARRAY['B'], FALSE, ARRAY[]::TEXT[], 'immediate', 'place', NOW() - INTERVAL '20 days'),

  ('b1b2c3d4-0005-0005-0005-000000000005', 'Pieter Van den Berg', '+32 4 333 44 55', NULL,
   ARRAY['B', 'C'], FALSE, ARRAY[]::TEXT[], 'immediate', 'nouveau', NOW() - INTERVAL '8 hours'),

  ('b1b2c3d4-0005-0005-0005-000000000005', 'Lucie Lambert', '+32 499 67 89 01', 'lucie.lambert@email.be',
   ARRAY['B'], FALSE, ARRAY[]::TEXT[], '1_semaine', 'nouveau', NOW() - INTERVAL '1 day');

-- Mise à jour des compteurs applications_count
UPDATE job_offers SET applications_count = (
  SELECT COUNT(*) FROM applications WHERE job_offer_id = job_offers.id
);
