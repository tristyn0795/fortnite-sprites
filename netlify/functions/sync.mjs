// Lightweight cross-device sync with a shared "sync code" — no account, no env vars.
// Anyone who enters the same code reads/writes the same collection.
// The code is hashed before it's used as a storage key, so raw codes are never stored.
import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

function keyFor(code) {
  const pepper = process.env.SYNC_PEPPER || "";
  return crypto.createHash("sha256").update(code + "|" + pepper).digest("hex");
}

export default async (req) => {
  const code = (req.headers.get("x-sync-code") || "").trim();
  if (code.length < 6) {
    return new Response(JSON.stringify({ error: "code_too_short" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const store = getStore("sprite-sync");
  const key = keyFor(code);

  if (req.method === "GET") {
    const data = await store.get(key, { type: "json" });
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
    await store.setJSON(key, clean);
    return Response.json({ ok: true });
  }

  return new Response("method not allowed", { status: 405 });
};

export const config = { path: "/api/sync" };
