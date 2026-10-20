-- 032 : vrais secteurs Commerce, Horeca et Administratif (au lieu de tout ranger dans « Autre »).
-- À exécuter SEUL (ALTER TYPE ... ADD VALUE ne peut pas être utilisé dans la même transaction).
ALTER TYPE sector_type ADD VALUE IF NOT EXISTS 'commerce';
ALTER TYPE sector_type ADD VALUE IF NOT EXISTS 'horeca';
ALTER TYPE sector_type ADD VALUE IF NOT EXISTS 'administratif';
