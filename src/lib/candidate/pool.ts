/** Interrupteur de la candidathèque : fermée tant que CANDIDATE_POOL_ENABLED n'est pas "true" (variable Vercel). */
export function poolEnabled(): boolean {
  return process.env.CANDIDATE_POOL_ENABLED === "true";
}
