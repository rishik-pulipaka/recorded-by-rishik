// API client for the FastAPI backend. Only the two calls the site
// actually makes live here: submitting a booking and the contact form.
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

async function apiFetch<T>(
  path: string,
  options?: RequestInit & { next?: { revalidate?: number } }
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body}`);
  }
  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

export async function submitBooking(data: unknown) {
  return apiFetch("/api/v1/bookings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function submitContactForm(data: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}) {
  return apiFetch("/api/v1/contact", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
