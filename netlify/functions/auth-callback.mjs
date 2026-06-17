// Step 2 of Epic login: Epic redirects back here with ?code & ?state.
// We verify state, exchange the code for a token, read the profile, and set our session cookie.
import { sign, verify, cookie, readCookie, appOrigin } from "../lib/session.mjs";

const TOKEN = "https://api.epicgames.dev/epic/oauth/v1/token";
const USERINFO = "https://api.epicgames.dev/epic/oauth/v2/userInfo";

export default async (req) => {
  const origin = appOrigin(req);
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");

  const verified = verify(readCookie(req, "oauth_state"));
  if (!code || !verified || verified.state !== returnedState) {
    return Response.redirect(`${origin}/?login=failed`, 302);
  }

  const clientId = process.env.EPIC_CLIENT_ID;
  const clientSecret = process.env.EPIC_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return Response.redirect(`${origin}/?login=failed`, 302);
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const tokRes = await fetch(TOKEN, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${origin}/api/auth/callback`,
    }),
  });
  if (!tokRes.ok) return Response.redirect(`${origin}/?login=failed`, 302);
  const tok = await tokRes.json();

  // Prefer the userInfo endpoint for a stable account id + display name.
  let accountId = tok.account_id;
  let name = tok.displayName;
  try {
    const uiRes = await fetch(USERINFO, {
      headers: { Authorization: `Bearer ${tok.access_token}` },
    });
    if (uiRes.ok) {
      const ui = await uiRes.json();
      accountId = ui.sub || accountId;
      name = ui.preferred_username || ui.display || name;
    }
  } catch {
    /* fall back to token fields */
  }

  if (!accountId) return Response.redirect(`${origin}/?login=failed`, 302);

  const session = sign({
    accountId,
    name: name || "Epic Player",
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
  });

  const headers = new Headers();
  headers.append("Location", `${origin}/?login=ok`);
  headers.append("Set-Cookie", cookie("sid", session));
  headers.append("Set-Cookie", cookie("oauth_state", "", { clear: true }));
  return new Response(null, { status: 302, headers });
};

export const config = { path: "/api/auth/callback" };
