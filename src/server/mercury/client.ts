import { env } from "../env";

const DEFAULT_BASE = "https://api.mercury.com";

export async function mercuryFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!env.MERCURY_API_KEY) {
    throw new Error("MERCURY_API_KEY is not configured");
  }

  const base = env.MERCURY_API_BASE || DEFAULT_BASE;
  const url = `${base}${path}`;

  const res = await fetch(url, {
    method: "GET",
    ...init,
    headers: {
      Authorization: `Bearer ${env.MERCURY_API_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mercury API error: ${res.status} ${text}`);
  }

  return res.json() as Promise<T>;
}
