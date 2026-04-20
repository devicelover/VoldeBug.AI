// Public API client surface used across the web app.
//
// This file used to call the backend directly with a JWT pulled from the
// NextAuth session. That JWT was visible to client JavaScript and therefore
// vulnerable to XSS exfiltration. We now route every call through
// /api/proxy/* (a Next.js Route Handler) which decodes the encrypted JWT
// cookie server-side and attaches the bearer token there. The bearer token
// never reaches the browser.
//
// All existing call sites keep working because `api` still exposes
// .get/.post/.patch/.put/.delete with the same signatures.
export { ApiClient, api } from "./api-client";
