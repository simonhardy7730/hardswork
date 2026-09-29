import type { Gender } from "./types";

export const GENDER_LABEL: Record<Gender, string> = { homme: "Homme", femme: "Femme", mixte: "Mixte" };

const GENDER_WORDS = /\b(homme|hommes|femme|femmes|mixte|unisexe)\b/gi;

/**
 * Chaque recherche précise pour qui est la pièce : sans « homme » ou « femme »,
 * les boutiques mélangent les rayons (un pantalon gris ouvre souvent le rayon femme).
 * Le mot déjà présent est remplacé par le bon, pour qu'une correction de l'utilisateur l'emporte.
 */
export function withGender(query: string, gender: Gender): string {
  const bare = query.replace(GENDER_WORDS, " ").replace(/\s+/g, " ").trim();
  return gender === "mixte" ? bare : `${bare} ${gender}`;
}
