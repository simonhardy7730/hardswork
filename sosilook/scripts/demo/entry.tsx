/**
 * Version démo 100 % navigateur : le vrai site (même interface, mêmes calculs),
 * avec les routes /api/analyze et /api/search exécutées dans la page, en mode démo.
 */
import { createRoot } from "react-dom/client";
import Home from "@/app/page";
import { POST as analyze } from "@/app/api/analyze/route";
import { POST as search } from "@/app/api/search/route";

const ROUTES: Record<string, (req: Request) => Promise<Response>> = {
  "/api/analyze": analyze,
  "/api/search": search,
};

const realFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.pathname : input.url;
  const route = ROUTES[url];
  if (!route) return realFetch(input, init);
  // Un petit délai, comme une vraie recherche
  await new Promise((r) => setTimeout(r, url === "/api/analyze" ? 900 : 700));
  return route(new Request(`https://demo.sosilook${url}`, init));
};

createRoot(document.getElementById("sosilook-root")!).render(<Home />);
