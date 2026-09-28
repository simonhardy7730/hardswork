// La version démo n'appelle jamais Claude (pas de clé) : on évite d'embarquer le SDK dans la page.
export default class Anthropic {
  constructor() {
    throw new Error("Indisponible dans la démo");
  }
}
export const zodOutputFormat = () => ({});
