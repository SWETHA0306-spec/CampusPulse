const BASE_URL = import.meta.env.VITE_PLACEMENT_API_URL || "http://localhost:8001";

async function getJSON(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export async function fetchCompanies() {
  return getJSON("/api/companies");
}

export async function fetchShortlist(company) {
  return getJSON(`/api/shortlist/${encodeURIComponent(company)}`);
}

export async function sendNotifications(company) {
  const res = await fetch(`${BASE_URL}/api/notify/${encodeURIComponent(company)}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}
