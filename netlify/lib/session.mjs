// Tiny signed-cookie session helper (no external deps).
// A "session" is base64url(JSON payload) + "." + HMAC-SHA256(payload, SESSION_SECRET).
import crypto from "node:crypto";

const SECRET = process.env.SESSION_SECRET || "dev-insecure-secret-change-me";
const DEFAULT_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const b64url = (buf) => Buffer.from(buf).toString("base64url");
const fromB64url = (s) => Buffer.from(s, "base64url");

export function sign(payloadObj) {
  const payload = b64url(JSON.stringify(payloadObj));
  const mac = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}

export function verify(token) {
  if (!token || !token.includes(".")) return null;
  const [payload, mac] = token.split(".");
  const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  const a = Buffer.from(mac), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const obj = JSON.parse(fromB64url(payload).toString());
    if (obj.exp && Date.now() > obj.exp) return null;
    return obj;
  } catch {
    return null;
  }
}

export function cookie(name, value, { maxAge = DEFAULT_MAX_AGE, clear = false } = {}) {
  return [
    `${name}=${value}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${clear ? 0 : maxAge}`,
  ].join("; ");
}

export function readCookie(req, name) {
  const header = req.headers.get("cookie") || "";
  const m = header.match(new RegExp("(?:^|; )" + name + "=([^;]+)"));
  return m ? m[1] : null;
}

export function appOrigin(req) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  return new URL(req.url).origin;
}
