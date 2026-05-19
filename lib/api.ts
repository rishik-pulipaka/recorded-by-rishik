const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

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
  return res.json() as Promise<T>;
}

export async function getPricing() {
  try {
    return await apiFetch<unknown[]>("/api/v1/pricing", {
      next: { revalidate: 300 },
    });
  } catch {
    return null;
  }
}

export async function createQuote(data: {
  session_id: string;
  shoot_type: string;
  package_id: string;
  addon_ids: string[];
  date: string;
  location: string;
}) {
  return apiFetch("/api/v1/quotes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getAvailability(from: string, to: string) {
  try {
    return await apiFetch<{ start: string; end: string; available: boolean }[]>(
      `/api/v1/availability?from=${from}&to=${to}`
    );
  } catch {
    return null;
  }
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
