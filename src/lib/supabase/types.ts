export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ── Enums ────────────────────────────────────────────
export type OrganizationType = "agency" | "company";
export type Region = "wallonie" | "bruxelles" | "flandre";
export type UserRole = "admin" | "recruiter" | "viewer";
export type ContractType = "interim" | "cdi" | "cdd" | "apprentissage";
export type Sector =
  | "logistique"
  | "industrie"
  | "construction"
  | "transport"
  | "nettoyage"
  | "securite"
  | "autre";
export type SalaryPeriod = "heure" | "jour" | "mois";
export type ShiftType = "jour" | "nuit" | "week-end" | "flexible";
export type JobStatus = "draft" | "active" | "paused" | "closed";
export type CandidateAvailability = "immediate" | "1_semaine" | "1_mois";
export type CandidateStatus = "actif" | "en_mission" | "inactif" | "place";
export type ApplicationStatus =
  | "nouveau"
  | "contacte"
  | "entretien"
  | "place"
  | "refuse";
export type SubscriptionPlan = "starter" | "pro" | "agency";
export type SubscriptionStatus = "trial" | "active" | "cancelled";
export type License = "B" | "C" | "CE" | "CACES1" | "CACES3" | "CACES5";
export type Language = "fr" | "nl" | "en";

// ── Row types (what the DB returns) ─────────────────
export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  address: string | null;
  city: string | null;
  region: Region | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  primary_color: string | null;
  created_at: string;
}

export interface User {
  id: string;
  organization_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface JobOffer {
  id: string;
  organization_id: string;
  created_by: string;
  title: string;
  description: string | null;
  contract_type: ContractType;
  sector: Sector;
  city: string;
  region: Region;
  salary_min: number | null;
  salary_max: number | null;
  salary_period: SalaryPeriod | null;
  show_salary: boolean;
  required_licenses: string[];
  required_languages: string[];
  shift_type: ShiftType | null;
  start_date: string | null;
  is_urgent: boolean;
  status: JobStatus;
  views_count: number;
  applications_count: number;
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  city: string | null;
  region: Region | null;
  availability: CandidateAvailability;
  licenses: string[];
  languages: string[];
  has_caces: boolean;
  caces_types: string[];
  experience_years: number | null;
  sectors: string[];
  notes: string | null;
  status: CandidateStatus;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  job_offer_id: string;
  candidate_id: string | null;
  applicant_name: string;
  applicant_phone: string;
  applicant_email: string | null;
  cover_message: string | null;
  licenses: string[];
  has_caces: boolean;
  caces_types: string[];
  availability: CandidateAvailability;
  status: ApplicationStatus;
  notes: string | null;
  applied_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  organization_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trial_ends_at: string | null;
  current_period_end: string | null;
  created_at: string;
}

// ── Insert types ─────────────────────────────────────
export type OrganizationInsert = {
  name: string;
  type: OrganizationType;
  address?: string | null;
  city?: string | null;
  region?: Region | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
};

export type UserInsert = {
  id: string;
  organization_id: string;
  email: string;
  full_name: string;
  role?: UserRole;
};

export type JobOfferInsert = {
  organization_id: string;
  created_by: string;
  title: string;
  description?: string | null;
  contract_type: ContractType;
  sector: Sector;
  city: string;
  region: Region;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_period?: SalaryPeriod | null;
  show_salary?: boolean;
  required_licenses?: string[];
  required_languages?: string[];
  shift_type?: ShiftType | null;
  start_date?: string | null;
  is_urgent?: boolean;
  status?: JobStatus;
};

export type CandidateInsert = {
  organization_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string | null;
  city?: string | null;
  region?: Region | null;
  availability?: CandidateAvailability;
  licenses?: string[];
  languages?: string[];
  has_caces?: boolean;
  caces_types?: string[];
  experience_years?: number | null;
  sectors?: string[];
  notes?: string | null;
  status?: CandidateStatus;
};

export type ApplicationInsert = {
  job_offer_id: string;
  candidate_id?: string | null;
  applicant_name: string;
  applicant_phone: string;
  applicant_email?: string | null;
  cover_message?: string | null;
  licenses?: string[];
  has_caces?: boolean;
  caces_types?: string[];
  availability?: CandidateAvailability;
  status?: ApplicationStatus;
  notes?: string | null;
};

export type SubscriptionInsert = {
  organization_id: string;
  plan?: SubscriptionPlan;
  status?: SubscriptionStatus;
  trial_ends_at?: string | null;
  current_period_end?: string | null;
};

// ── Supabase Database schema ─────────────────────────
// Utilise `type` (pas `interface`) pour la compatibilité avec supabase-js v2
export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: OrganizationInsert;
        Update: Partial<OrganizationInsert>;
        Relationships: never[];
      };
      users: {
        Row: User;
        Insert: UserInsert;
        Update: Partial<Omit<UserInsert, "id">>;
        Relationships: never[];
      };
      job_offers: {
        Row: JobOffer;
        Insert: JobOfferInsert;
        Update: Partial<JobOfferInsert>;
        Relationships: never[];
      };
      candidates: {
        Row: Candidate;
        Insert: CandidateInsert;
        Update: Partial<CandidateInsert>;
        Relationships: never[];
      };
      applications: {
        Row: Application;
        Insert: ApplicationInsert;
        Update: Partial<ApplicationInsert>;
        Relationships: never[];
      };
      subscriptions: {
        Row: Subscription;
        Insert: SubscriptionInsert;
        Update: Partial<SubscriptionInsert>;
        Relationships: never[];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
