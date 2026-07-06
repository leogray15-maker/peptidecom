"use client";

/** fetch() for admin CRM mutations with recovery baked in: a 401 (expired /
 * missing session) sends the admin to the login page and back here after,
 * instead of dead-ending on an "Unauthorized" message. Throws a friendly
 * Error for every non-OK response. */
export async function adminFetch(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.ok) return res;

  if (res.status === 401) {
    const cb = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.assign(`/login?callbackUrl=${cb}`);
    throw new Error("Your session has expired — taking you to log in…");
  }
  if (res.status === 403) {
    throw new Error("This account doesn't have admin access.");
  }
  const data = await res.json().catch(() => null);
  throw new Error(data?.error ?? "Something went wrong.");
}
