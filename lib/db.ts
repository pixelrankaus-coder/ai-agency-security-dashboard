// lib/db.ts
// Database service layer - all Supabase operations go through here
// Replaces lib/storage.ts (JSON file storage)

import { createServerClient } from "./supabase/server";
import type {
  Company,
  Profile,
  Site,
  Scan,
  Finding,
} from "./supabase/types";

// ==================
// COMPANIES
// ==================
export async function getCompanies() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("name");
  if (error) throw error;
  return data as Company[];
}

export async function getCompany(id: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Company;
}

export async function createCompany(company: Partial<Company>) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("companies")
    .insert(company)
    .select()
    .single();
  if (error) throw error;
  return data as Company;
}

export async function updateCompany(id: string, updates: Partial<Company>) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("companies")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Company;
}

export async function deleteCompany(id: string) {
  const supabase = createServerClient();
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) throw error;
}

// ==================
// DEFAULT COMPANY (for transition period before auth)
// ==================
export async function getOrCreateDefaultCompany(): Promise<Company> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("companies")
    .select("*")
    .limit(1)
    .single();

  if (data) return data as Company;

  // Create default company
  const { data: newCompany, error } = await supabase
    .from("companies")
    .insert({
      name: "My Agency",
      slug: "my-agency",
      subscription_plan: "enterprise",
      subscription_status: "active",
      scans_per_month: 9999,
    })
    .select()
    .single();

  if (error) throw error;
  return newCompany as Company;
}

// ==================
// SITES
// ==================
export async function getSites(companyId?: string) {
  const supabase = createServerClient();
  let query = supabase
    .from("sites")
    .select("*")
    .order("created_at", { ascending: false });
  if (companyId) query = query.eq("company_id", companyId);
  const { data, error } = await query;
  if (error) throw error;
  return data as Site[];
}

export async function getSite(id: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("sites")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Site;
}

export async function createSite(site: Partial<Site>) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("sites")
    .insert(site)
    .select()
    .single();
  if (error) throw error;
  return data as Site;
}

export async function updateSite(id: string, updates: Partial<Site>) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("sites")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Site;
}

export async function deleteSite(id: string) {
  const supabase = createServerClient();
  const { error } = await supabase.from("sites").delete().eq("id", id);
  if (error) throw error;
}

// ==================
// SCANS
// ==================
export async function getScans(
  companyId?: string,
  siteId?: string,
  limit = 50
) {
  const supabase = createServerClient();
  let query = supabase
    .from("scans")
    .select(
      "id, site_id, company_id, scan_source, url, scanners, status, progress, current_scanner, total_findings, severity_counts, grade, score, error, duration_seconds, created_at, completed_at, started_by"
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (companyId) query = query.eq("company_id", companyId);
  if (siteId) query = query.eq("site_id", siteId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getScan(id: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("scans")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Scan;
}

export async function createScan(scan: Partial<Scan>) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("scans")
    .insert(scan)
    .select()
    .single();
  if (error) throw error;
  return data as Scan;
}

export async function updateScan(id: string, updates: Partial<Scan>) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("scans")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Scan;
}

export async function deleteScan(id: string) {
  const supabase = createServerClient();
  const { error } = await supabase.from("scans").delete().eq("id", id);
  if (error) throw error;
}

// ==================
// FINDINGS
// ==================
export async function createFindings(findings: Partial<Finding>[]) {
  if (findings.length === 0) return [];
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("findings")
    .insert(findings)
    .select();
  if (error) throw error;
  return data as Finding[];
}

export async function getFindings(
  scanId?: string,
  siteId?: string,
  companyId?: string
) {
  const supabase = createServerClient();
  let query = supabase
    .from("findings")
    .select("*")
    .order("created_at", { ascending: false });
  if (scanId) query = query.eq("scan_id", scanId);
  if (siteId) query = query.eq("site_id", siteId);
  if (companyId) query = query.eq("company_id", companyId);
  const { data, error } = await query;
  if (error) throw error;
  return data as Finding[];
}

// ==================
// PROFILES
// ==================
export async function getProfile(userId: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Profile>
) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}
