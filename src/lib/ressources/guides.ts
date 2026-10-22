// Guides « tes droits » : courts, datés, sourcés. Chaque chiffre vient d'une page officielle
// consultée à la date indiquée. À RELIRE à chaque changement de loi (champ `verifie`).
export type Guide = {
  slug: string;
  titre: string;
  resume: string;
  verifie: string; // AAAA-MM-JJ
  points: { t: string; p: string[] }[];
  sources: { label: string; url: string }[];
};

export const GUIDES: Guide[] = [
  {
    slug: "job-etudiant",
    titre: "Job étudiant : 650 heures par an",
    resume: "Combien d'heures tu peux travailler comme étudiant avec des cotisations réduites, et ce qui se passe au-delà.",
    verifie: "2026-10-22",
    points: [
      { t: "Le contingent", p: [
        "Tu peux travailler jusqu'à 650 heures par année civile avec une cotisation de solidarité réduite (au lieu des cotisations sociales ordinaires).",
        "Le compteur repart à zéro chaque 1er janvier.",
        "Seules les heures réellement prestées comptent, déclarées par l'employeur comme « étudiant ».",
      ] },
      { t: "Si tu dépasses", p: [
        "À partir de la 651e heure, les cotisations ordinaires sont dues : ton salaire net est alors plus bas.",
        "Tu peux suivre ton compteur sur student@work (le site officiel).",
      ] },
      { t: "Conditions", p: [
        "Avoir 15 ans ou plus et ne plus être soumis à l'obligation scolaire à temps plein.",
        "Être inscrit dans un enseignement reconnu ; le travail doit se faire en dehors des périodes de cours obligatoires.",
        "Un arrêté royal du 19 avril 2026 précise les activités possibles pour les jeunes de 15 ans et plus encore soumis à l'obligation scolaire (travail léger).",
      ] },
    ],
    sources: [
      { label: "ONSS – Instructions administratives 2026/3 : Étudiants", url: "https://www.socialsecurity.be/employer/instructions/dmfa/fr/latest/instructions/persons/specific/students.html" },
      { label: "student@work", url: "https://www.studentatwork.be/" },
    ],
  },
  {
    slug: "flexi-job",
    titre: "Flexi-job : comment ça marche en 2026",
    resume: "Un complément de revenu à côté de ton emploi principal : conditions, plafond exonéré, secteurs.",
    verifie: "2026-10-22",
    points: [
      { t: "Pour qui ?", p: [
        "Pour les personnes qui travaillent déjà au moins à 4/5 temps chez un ou plusieurs autres employeurs, et pour les pensionnés.",
        "Tu ne peux pas avoir un autre contrat chez le même employeur pendant le même trimestre.",
      ] },
      { t: "Dans quels secteurs ?", p: [
        "Depuis le 1er juillet 2026, le régime s'applique à tous les secteurs, sauf ceux qui s'en retirent par convention collective. Les fonctions artistiques restent exclues.",
        "Avant d'accepter, vérifie que le secteur de l'employeur n'a pas fait ce retrait.",
      ] },
      { t: "Ce que ça rapporte", p: [
        "Le flexi-salaire est exonéré de cotisations personnelles et d'impôt jusqu'à 18 440 € par an (revenus 2026). Au-delà, la partie en trop est imposable.",
        "Le pécule de vacances est payé en plus, avec le salaire.",
      ] },
    ],
    sources: [
      { label: "Company Belgium : flexi-jobs dans tous les secteurs", url: "https://companybelgium.be/fr/fiches-pratiques/flexi-jobs-tous-secteurs" },
    ],
  },
  {
    slug: "preavis",
    titre: "Préavis : à quoi t'attendre",
    resume: "Les grandes règles du délai de préavis. Les durées exactes dépendent de ta date d'entrée : utilise le calcul officiel.",
    verifie: "2026-10-22",
    points: [
      { t: "Le principe", p: [
        "Le délai dépend de ton ancienneté et de la date à laquelle ton contrat a commencé.",
        "Pour les contrats commencés entre le 1er janvier 2014 et le 1er juin 2026, un licenciement donne par exemple 1 semaine de préavis avant 3 mois d'ancienneté, 12 semaines à 2 ans, 15 semaines à 4 ans, 18 semaines à 5 ans.",
      ] },
      { t: "Ça change pour les nouveaux contrats", p: [
        "Pour les contrats qui commencent à partir du 1er août 2026, les premiers paliers sont modifiés (1 semaine jusqu'à 6 mois, puis 6 semaines de 6 à 9 mois) et le préavis est plafonné à 52 semaines à partir de 17 ans d'ancienneté.",
        "Pour les contrats commencés entre le 1er juin et le 1er août 2026, le plafond de 52 semaines s'applique aussi à partir de 17 ans.",
      ] },
      { t: "Que faire", p: [
        "Regarde ton contrat et ta date d'entrée, puis vérifie dans le tableau officiel du SPF Emploi.",
        "En cas de doute, demande à ton syndicat ou à ton secrétariat social avant de signer quoi que ce soit.",
      ] },
    ],
    sources: [
      { label: "SPF Emploi : fin du contrat à durée indéterminée", url: "https://emploi.belgique.be/fr/themes/contrats-de-travail/fin-du-contrat-de-travail/fin-du-contrat-duree-indeterminee-11" },
    ],
  },
];

export const guideBySlug = (s: string) => GUIDES.find((g) => g.slug === s);
