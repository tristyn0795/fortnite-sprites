// Returns whether the current visitor has a valid Epic session.
import { verify, readCookie } from "../lib/session.mjs";

export default async (req) => {
  const s = verify(readCookie(req, "sid"));
  // `epic` tells the app whether "Sign in with Epic" is configured on this deploy,
  // so it can hide that button when only the sync-code path is set up.
  const epic = !!process.env.EPIC_CLIENT_ID;
  return Response.json(
    s ? { loggedIn: true, name: s.name, epic } : { loggedIn: false, epic }
  );
};

export const config = { path: "/api/me" };
