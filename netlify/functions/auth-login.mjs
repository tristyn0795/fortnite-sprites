// Step 1 of Epic login: redirect the user to Epic's consent screen.
import crypto from "node:crypto";
import { sign, cookie, appOrigin } from "../lib/session.mjs";

const AUTHORIZE = "https://www.epicgames.com/id/authorize";

export default async (req) => {
  const clientId = process.env.EPIC_CLIENT_ID;
  if (!clientId) return new Response("Server missing EPIC_CLIENT_ID", { status: 500 });

  const origin = appOrigin(req);
  const state = crypto.randomBytes(16).toString("hex");

  const authUrl = new URL(AUTHORIZE);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "basic_profile");
  authUrl.searchParams.set("redirect_uri", `${origin}/api/auth/callback`);
  authUrl.searchParams.set("state", state);

  // Stash state in a short-lived signed cookie to defend against CSRF.
  const stateToken = sign({ state, exp: Date.now() + 10 * 60 * 1000 });
  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl.toString(),
      "Set-Cookie": cookie("oauth_state", stateToken, { maxAge: 600 }),
    },
  });
};

export const config = { path: "/api/auth/login" };
