// lib/api.ts

const API_BASE = "/api";

// ==================
// SCANS
// ==================

export async function fetchScans(params?: {
  limit?: number;
  company_id?: string;
  site_id?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.company_id) searchParams.set("company_id", params.company_id);
  if (params?.site_id) searchParams.set("site_id", params.site_id);

  const url = `${API_BASE}/scans${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch scans");
  return res.json();
}

export async function fetchScan(id: string) {
  const res = await fetch(`${API_BASE}/scans/${id}`);
  if (!res.ok) throw new Error("Scan not found");
  return res.json();
}

export async function startScan(data: {
  site_id: string;
  scanners?: string[];
  skip_ai?: boolean;
}) {
  const res = await fetch(`${API_BASE}/scans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to start scan");
  return res.json();
}

export async function deleteScan(id: string) {
  const res = await fetch(`${API_BASE}/scans/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete scan");
  return res.json();
}

// ==================
// SITES
// ==================

export async function fetchSites(companyId?: string) {
  const url = companyId
    ? `${API_BASE}/sites?company_id=${encodeURIComponent(companyId)}`
    : `${API_BASE}/sites`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch sites");
  return res.json();
}

export async function fetchSite(id: string) {
  const res = await fetch(`${API_BASE}/sites/${id}`);
  if (!res.ok) throw new Error("Site not found");
  return res.json();
}

export async function createSite(data: {
  url: string;
  name?: string;
  notes?: string;
  company_id?: string;
}) {
  const res = await fetch(`${API_BASE}/sites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create site");
  return res.json();
}

export async function deleteSite(id: string) {
  const res = await fetch(`${API_BASE}/sites/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete site");
  return res.json();
}

// ==================
// COMPANIES
// ==================

export async function fetchCompanies() {
  const res = await fetch(`${API_BASE}/companies`);
  if (!res.ok) throw new Error("Failed to fetch companies");
  return res.json();
}

export async function createCompany(data: {
  name: string;
  slug: string;
  website?: string;
  notes?: string;
}) {
  const res = await fetch(`${API_BASE}/companies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create company");
  return res.json();
}

// ==================
// HEALTH
// ==================

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error("Backend not available");
  return res.json();
}

// ==================
// DEPRECATED - Legacy client functions
// Use fetchSites, createSite, deleteSite instead
// ==================

/** @deprecated Use fetchSites instead */
export async function fetchClients() {
  return fetchSites();
}

/** @deprecated Use createSite instead */
export async function createClient(data: {
  name: string;
  website: string;
  notes?: string;
}) {
  return createSite({
    url: data.website,
    name: data.name,
    notes: data.notes,
  });
}

/** @deprecated Use deleteSite instead */
export async function deleteClient(id: string) {
  return deleteSite(id);
}
