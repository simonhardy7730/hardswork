/**
 * « Voir l'offre » doit arriver directement sur le site du vendeur, avec la pièce déjà cherchée.
 * 1. Boutiques dont l'adresse de recherche est connue : leur page de recherche, requête remplie.
 * 2. Toutes les autres (dont le site officiel de n'importe quelle marque) : la redirection
 *    « premier résultat » de DuckDuckGo (préfixe « \ »), qui ouvre directement la page la plus
 *    pertinente, en général la fiche produit chez ce vendeur.
 */
const SEARCH_URLS: Array<[RegExp, (q: string) => string]> = [
  [/zalando/, (q) => `https://www.zalando.fr/catalogue/?q=${q}`],
  [/vinted/, (q) => `https://www.vinted.fr/catalog?search_text=${q}`],
  [/vestiaire/, (q) => `https://fr.vestiairecollective.com/search/?q=${q}`],
  [/asos/, (q) => `https://www.asos.com/fr/search/?q=${q}`],
  [/\bzara\b/, (q) => `https://www.zara.com/fr/fr/search?searchTerm=${q}`],
  [/\bh&m\b|\bh ?& ?m\b|^hm$/, (q) => `https://www2.hm.com/fr_fr/search-results.html?q=${q}`],
  [/uniqlo/, (q) => `https://www.uniqlo.com/fr/fr/search?q=${q}`],
  [/ebay/, (q) => `https://www.ebay.fr/sch/i.html?_nkw=${q}`],
  [/leboncoin/, (q) => `https://www.leboncoin.fr/recherche?text=${q}`],
  [/amazon/, (q) => `https://www.amazon.fr/s?k=${q}`],
  [/chrono24/, (q) => `https://www.chrono24.fr/search/index.htm?query=${q}`],
  [/aliexpress/, (q) => `https://fr.aliexpress.com/wholesale?SearchText=${q}`],
];

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

/** Lien direct vers la recherche `query` chez le vendeur `seller`. */
export function merchantUrl(seller: string, query: string): string {
  const s = normalize(seller);
  const q = query.replace(/\s+/g, " ").trim();
  const known = SEARCH_URLS.find(([re]) => re.test(s));
  if (known) return known[1](encodeURIComponent(q));
  // Le vendeur d'abord (s'il n'est pas déjà dans la requête) : la redirection vise son site plutôt qu'un comparateur.
  const target = normalize(q).includes(s) ? q : `${seller} ${q}`;
  return `https://duckduckgo.com/?q=${encodeURIComponent(`\\${target}`)}`;
}
