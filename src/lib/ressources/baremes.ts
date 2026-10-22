// Barèmes minimums par commission paritaire. UNIQUEMENT des chiffres lus sur un document officiel/syndical
// publié, avec la date d'entrée en vigueur. Les montants sont des MINIMUMS bruts : un contrat peut payer plus.
export type Bareme = {
  cp: string;
  slug: string;
  titre: string;
  secteur: string;
  enVigueur: string; // AAAA-MM-JJ
  prochaine?: string;
  verifie: string;
  unite: "€/h brut";
  heures?: string;
  lignes: { cat: string; label?: string; montant: number }[];
  notes: string[];
  sources: { label: string; url: string }[];
};

export const BAREMES: Bareme[] = [
  {
    cp: "124", slug: "cp-124-construction", titre: "Construction (CP 124)", secteur: "construction",
    enVigueur: "2026-10-01", verifie: "2026-10-22", unite: "€/h brut",
    lignes: [
      { cat: "Cat. I", label: "Manœuvre", montant: 18.747 },
      { cat: "Cat. I A", label: "1er manœuvre", montant: 19.680 },
      { cat: "Cat. II", label: "Spécialisé", montant: 19.985 },
      { cat: "Cat. II A", label: "Spécialisé d'élite", montant: 20.984 },
      { cat: "Cat. III", label: "Qualifié I", montant: 21.254 },
      { cat: "Cat. IV", label: "Qualifié II", montant: 22.561 },
      { cat: "Chef d'équipe A", label: "Qualifié I", montant: 23.379 },
      { cat: "Chef d'équipe B", label: "Qualifié II", montant: 24.790 },
      { cat: "Contremaître", montant: 27.003 },
      { cat: "Étudiants", label: "nouveau barème", montant: 16.175 },
    ],
    notes: [
      "Chauffeurs de camions-mixers et opérateurs de pompes à béton : 21,254 €/h pour les nouveaux entrants dans le métier (cat. III), 22,561 €/h après 1 an et obtention de l'attestation (cat. IV).",
      "Le secteur prévoit aussi des indemnités (coût et logement, supplément pétrochimie, indemnité vélo…), qui s'ajoutent au salaire horaire.",
    ],
    sources: [{ label: "CSC Bâtiment-Industrie-Énergie : Chronique Construction, 4e trimestre 2026", url: "https://www.lacsc.be/docs/default-source/acvbie-cscbie-document/sectoraal-sectoriel/bouw-construction/folders/chronique-construction-4t2026.pdf" }],
  },
  {
    cp: "121", slug: "cp-121-nettoyage", titre: "Nettoyage (CP 121)", secteur: "nettoyage",
    enVigueur: "2026-07-01", prochaine: "Prochaine indexation prévue le 1er janvier 2027.", verifie: "2026-10-22", unite: "€/h brut", heures: "Régime de 37 heures par semaine",
    lignes: [
      { cat: "1.A", montant: 17.166 }, { cat: "1.B", montant: 17.701 }, { cat: "1.C", montant: 17.869 }, { cat: "1.D", montant: 18.2305 },
      { cat: "2.A", montant: 18.2775 }, { cat: "2.B", montant: 18.801 }, { cat: "2.C", montant: 19.014 }, { cat: "2.D", montant: 18.801 },
      { cat: "2.E", montant: 18.989 }, { cat: "2.F", montant: 17.492 },
      { cat: "3.A", montant: 19.5145 }, { cat: "3.B", montant: 19.3775 }, { cat: "3.C", montant: 20.5325 }, { cat: "3.D", montant: 21.0555 }, { cat: "3.E", montant: 21.719 },
      { cat: "4.A et 7.A", montant: 19.3775 }, { cat: "4.B et 7.B", montant: 19.8545 }, { cat: "4.C et 7.C", montant: 20.1875 }, { cat: "4.D et 7.D", montant: 20.5235 },
    ],
    notes: [
      "La catégorie dépend de la fonction exercée (nettoyage habituel, nettoyage industriel, etc.) : elle est indiquée dans ton contrat. La fiche officielle détaille chaque catégorie.",
      "Des suppléments (travail du soir, de nuit, du week-end…) existent en plus : voir la fiche officielle.",
    ],
    sources: [{ label: "SPF Emploi : fiche CP 121 (dernière adaptation 08/09/2026)", url: "https://emploi.belgique.be/sites/default/files/content/documents/International/Fiches%20Limosa/D%C3%A9tachement121.pdf" }],
  },
];

export const baremeBySlug = (s: string) => BAREMES.find((b) => b.slug === s);
export const eur = (n: number) => n.toLocaleString("fr-BE", { minimumFractionDigits: 2, maximumFractionDigits: 4 }) + " €";
