// All API calls use relative paths — Vite's dev proxy forwards them to
// the Python backend on localhost:8000 with no CORS issues.
// In production, configure your web server (nginx/caddy) to forward /api/* to the FastAPI server.

async function getJSON(path) {
  const res = await fetch(path);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export async function fetchRiskProfile(rollNo) {
  return getJSON(`/api/students/${rollNo}/risk`);
}

export async function fetchRecoveryPlan(rollNo) {
  return getJSON(`/api/students/${rollNo}/recovery-plan`);
}

export async function fetchIntensity(rollNo) {
  return getJSON(`/api/students/${rollNo}/intensity`);
}

export async function fetchResources(rollNo) {
  return getJSON(`/api/students/${rollNo}/resources`);
}

export async function fetchRevisionPlan(rollNo) {
  return getJSON(`/api/students/${rollNo}/revision-plan`);
}
