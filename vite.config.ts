import { defineConfig, type Connect, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import type { ServerResponse } from "node:http";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ContactPayload {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  website?: unknown;
}

// Local stand-in for the production contact endpoint: validates like the real one and returns { ok, id }.
function contactMock(): Plugin {
  const handler: Connect.NextHandleFunction = (req, res: ServerResponse, next) => {
    if (req.url !== "/api/contact") return next();
    const reply = (status: number, body: Record<string, unknown>) => {
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(body));
    };
    if (req.method !== "POST") return reply(405, { ok: false, code: "method_not_allowed" });
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      let data: ContactPayload;
      try {
        data = JSON.parse(raw);
      } catch {
        return reply(400, { ok: false, code: "invalid_input" });
      }
      const name = String(data.name ?? "").trim();
      const email = String(data.email ?? "").trim();
      const phone = String(data.phone ?? "").trim();
      if (!name || name.length > 120 || !EMAIL.test(email) || email.length > 254 || phone.length > 40) {
        return reply(422, { ok: false, code: "invalid_input" });
      }
      const id = randomUUID();
      if (!data.website) console.log("[contact]", { name, email, phone, key: req.headers["idempotency-key"] });
      setTimeout(() => reply(200, { ok: true, id }), 600);
    });
  };
  return {
    name: "noddal-contact-mock",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

// The datacluster scene is plain un-hashed ES modules; force revalidation so edits are never served stale.
function freshDatacluster(): Plugin {
  const handler: Connect.NextHandleFunction = (req, res, next) => {
    if (req.url?.startsWith("/datacluster/")) res.setHeader("Cache-Control", "no-cache");
    next();
  };
  return {
    name: "noddal-fresh-datacluster",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig({
  appType: "mpa",
  plugins: [react(), contactMock(), freshDatacluster()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
