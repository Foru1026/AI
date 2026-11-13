import { useEffect, useRef, useState } from "react";

const FIELDS = ["name", "email", "phone"];
export const FIELD_LIMITS = { name: 120, email: 254, phone: 40 };
const ENDPOINT = "/api/contact";

const readFields = (data) => Object.fromEntries(FIELDS.map((k) => [k, String(data.get(k) ?? "").trim()]));

function errorMessage(error) {
  if (error?.code === "rate_limited") return "Please wait a few minutes before trying again, or reach us by email.";
  if (error?.code === "invalid_input") return "Please check your name, email and phone number.";
  return "Couldn’t send your details. Please try again or reach us by email.";
}

export function createContactClient({
  fetchImpl = (...args) => fetch(...args),
  getPageUrl = () => location.origin + location.pathname,
  createId = () => crypto.randomUUID(),
} = {}) {
  let attempt = null;
  return async (fields, extra = {}) => {
    const body = JSON.stringify({
      name: fields.name,
      email: fields.email,
      phone: fields.phone,
      website: extra.website || "",
      pageUrl: getPageUrl(),
    });
    if (!attempt || attempt.body !== body) attempt = { body, id: createId(), receipt: null };
    const current = attempt;
    if (current.receipt) return current.receipt;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15e3);
    try {
      const response = await fetchImpl(ENDPOINT, {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        redirect: "error",
        headers: { "Content-Type": "application/json", "Idempotency-Key": current.id },
        body,
        signal: controller.signal,
      });
      const json = await response.json().catch(() => null);
      if (
        !response.ok ||
        json?.ok !== true ||
        typeof json.id !== "string" ||
        !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(json.id)
      ) {
        const error = new Error("Contact request was not accepted");
        error.code = ["rate_limited", "invalid_input"].includes(json?.code) ? json.code : "send_failed";
        throw error;
      }
      current.receipt = { id: json.id };
      return current.receipt;
    } finally {
      clearTimeout(timeout);
    }
  };
}

export function useContactForm(send) {
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const mounted = useRef(true);
  const busy = useRef(false);
  const client = useRef(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (busy.current || (event.currentTarget.reportValidity && !event.currentTarget.reportValidity())) return;
    const data = new FormData(event.currentTarget);
    const fields = readFields(data);
    busy.current = true;
    setPending(true);
    setStatus("");
    try {
      client.current ??= createContactClient();
      await (send || client.current)(fields, { website: String(data.get("website") || "").trim() });
      if (mounted.current) setStatus("Thank you. We’ll be in touch.");
    } catch (error) {
      if (mounted.current) setStatus(errorMessage(error));
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  };

  return { submit, status, pending, clearStatus: () => setStatus("") };
}
