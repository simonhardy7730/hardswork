-- Types d'offres : job étudiant, flexi-job, stage (étape 1 du brief jobs étudiants / flexi-jobs)
-- Extension de l'énumération existante, sans toucher aux offres déjà créées.
ALTER TYPE contract_type ADD VALUE IF NOT EXISTS 'etudiant';
ALTER TYPE contract_type ADD VALUE IF NOT EXISTS 'flexi';
ALTER TYPE contract_type ADD VALUE IF NOT EXISTS 'stage';
