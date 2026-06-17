// Per-account cloud storage of the MANUAL collection (checkmarks + custom sprites).
// GET  -> returns the signed-in account's saved progress.
// PUT  -> overwrites it with the posted { state, levels, custom, deleted }.
import { getStore } from "@netlify/blobs";
import { verify, readCookie } from "../lib/session.mjs";

export default async (req) => {
  const s = verify(readCookie(req, "sid"));
  if (!s) {
    return new Response(JSON.stringify({ error: "not_authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const store = getStore("sprite-progress");

  if (req.method === "GET") {
    const data = await store.get(s.accountId, { type: "json" });
    return Response.json(data || { state: {}, levels: {}, custom: [], deleted: [] });
  }

  if (req.method === "PUT" || req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response("bad json", { status: 400 });
    }
    const clean = {
      state: body && typeof body.state === "object" && body.state ? body.state : {},
      levels: body && typeof body.levels === "object" && body.levels ? body.levels : {},
      custom: Array.isArray(body && body.custom) ? body.custom : [],
      deleted: Array.isArray(body && body.deleted) ? body.deleted : [],
      updated: Date.now(),
    };
    await store.setJSON(s.accountId, clean);
    return Response.json({ ok: true });
  }

  return new Response("method not allowed", { status: 405 });
};

export const config = { path: "/api/progress" };
