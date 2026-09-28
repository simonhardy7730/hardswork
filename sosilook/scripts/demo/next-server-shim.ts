// Remplace next/server dans la version démo navigateur : les routes API tournent dans la page.
export const NextResponse = {
  json: (body: unknown, init?: ResponseInit) => Response.json(body, init),
};
