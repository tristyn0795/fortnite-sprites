// Clears the session cookie and returns to the app.
import { cookie, appOrigin } from "../lib/session.mjs";

export default async (req) => {
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${appOrigin(req)}/`,
      "Set-Cookie": cookie("sid", "", { clear: true }),
    },
  });
};

export const config = { path: "/api/logout" };
