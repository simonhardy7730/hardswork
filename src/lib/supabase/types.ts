export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
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
        };
        Insert: Omit<
          Database["public"]["Tables"]["organizations"]["Row"],
          "id" | "created_at"
        > &
          Partial<
            Pick<
              Database["public"]["Tables"]["organizations"]["Row"],
              "id" | "created_at"
            >
          >;
        Update: Partial<Database["public"]["Tables"]["organizations"]["Row"]>;
      };
      users: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          full_name: string;
          role: UserRole;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["users"]["Row"],
          "created_at"
        > &
          Partial<
            Pick<Database["public"]["Tables"]["users"]["Row"], "created_at">
          >;
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
      };
      job_offers: {
        Row: {
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
          required_licenses: License[];
          required_languages: Language[];
          shift_type: ShiftType | null;
          start_date: string | null;
          is_urgent: boolean;
          status: JobStatus;
          views_count: number;
          applications_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["job_offers"]["Row"],
          "id" | "created_at" | "updated_at" | "views_count" | "applications_count"
        > &
          Partial<
            Pick<
              Database["public"]["Tables"]["job_offers"]["Row"],
              | "id"
              | "created_at"
              | "updated_at"
              | "views_count"
              | "applications_count"
            >
          >;
        Update: Partial<Database["public"]["Tables"]["job_offers"]["Row"]>;
      };
      candidates: {
        Row: {
          id: string;
          organization_id: string;
          first_name: string;
          last_name: string;
          phone: string;
          email: string | null;
          city: string | null;
          region: Region | null;
          availability: CandidateAvailability;
          licenses: License[];
          languages: Language[];
          has_caces: boolean;
          caces_types: string[];
          experience_years: number | null;
          sectors: Sector[];
          notes: string | null;
          status: CandidateStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["candidates"]["Row"],
          "id" | "created_at" | "updated_at"
        > &
          Partial<
            Pick<
              Database["public"]["Tables"]["candidates"]["Row"],
              "id" | "created_at" | "updated_at"
            >
          >;
        Update: Partial<Database["public"]["Tables"]["candidates"]["Row"]>;
      };
      applications: {
        Row: {
          id: string;
          job_offer_id: string;
          candidate_id: string | null;
          applicant_name: string;
          applicant_phone: string;
          applicant_email: string | null;
          cover_message: string | null;
          licenses: License[];
          has_caces: boolean;
          caces_types: string[];
          availability: CandidateAvailability;
          status: ApplicationStatus;
          notes: string | null;
          applied_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["applications"]["Row"],
          "id" | "applied_at" | "updated_at"
        > &
          Partial<
            Pick<
              Database["public"]["Tables"]["applications"]["Row"],
              "id" | "applied_at" | "updated_at"
            >
          >;
        Update: Partial<Database["public"]["Tables"]["applications"]["Row"]>;
      };
      subscriptions: {
        Row: {
          id: string;
          organization_id: string;
          plan: SubscriptionPlan;
          status: SubscriptionStatus;
          trial_ends_at: string | null;
          current_period_end: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["subscriptions"]["Row"],
          "id" | "created_at"
        > &
          Partial<
            Pick<
              Database["public"]["Tables"]["subscriptions"]["Row"],
              "id" | "created_at"
            >
          >;
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type User = Database["public"]["Tables"]["users"]["Row"];
export type JobOffer = Database["public"]["Tables"]["job_offers"]["Row"];
export type Candidate = Database["public"]["Tables"]["candidates"]["Row"];
export type Application = Database["public"]["Tables"]["applications"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
