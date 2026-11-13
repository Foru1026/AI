import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { randomUUID } from "node:crypto";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Local stand-in for the production contact endpoint: validates like the real one and returns { ok, id }.
function contactMock() {
  const handler = (req, res, next) => {
    if (req.url !== "/api/contact") return next();
    const reply = (status, body) => {
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
      let data;
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

export default defineConfig({
  plugins: [react(), contactMock()],
});
