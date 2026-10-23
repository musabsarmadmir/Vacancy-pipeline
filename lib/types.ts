export type City = "Calgary" | "Edmonton";
export type PipelineStage = "notice" | "move_out" | "listed" | "showing" | "application" | "lease_signed";

export type Unit = {
  id: string;
  unit_number: string;
  property_name: string;
  address: string;
  city: City;
  bedrooms: number;
  monthly_rent: number;
  status: "occupied" | "vacant" | "leased";
  notice_at: string | null;
  move_out_at: string | null;
  listed_at: string | null;
  first_showing_at: string | null;
  application_at: string | null;
  lease_signed_at: string | null;
};

export const STAGES: { key: PipelineStage; label: string; shortLabel: string; color: string }[] = [
  { key: "notice", label: "Notice", shortLabel: "Notice", color: "#8b5cf6" },
  { key: "move_out", label: "Move-out", shortLabel: "Move-out", color: "#f59e0b" },
  { key: "listed", label: "Listed", shortLabel: "Listed", color: "#0ea5e9" },
  { key: "showing", label: "Showing", shortLabel: "Showing", color: "#14b8a6" },
  { key: "application", label: "Application", shortLabel: "Application", color: "#f97316" },
  { key: "lease_signed", label: "Lease signed", shortLabel: "Leased", color: "#22c55e" }
];
