import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding.");
}

const db = createClient(url, key);

const properties = [
  ["The Juniper", "Calgary", "111 8 Ave SW"],
  ["Parkline", "Calgary", "425 17 Ave SW"],
  ["Beltline House", "Calgary", "909 12 St SW"],
  ["Riverbend", "Edmonton", "10320 102 Ave NW"],
  ["The Mckenzie", "Edmonton", "11806 104 St NW"],
  ["Oliver Row", "Edmonton", "10020 117 St NW"],
] as const;

const stageCounts = [
  ["Notice", 75],
  ["Move-out", 75],
  ["Listed", 300],
  ["Showing", 75],
  ["Application", 50],
  ["Lease signed", 25],
] as const;

const owners = ["J. Lee", "A. Chen", "R. Miller", "T. Singh"];
const day = 86400000;
const isoDaysAgo = (daysAgo: number) => new Date(Date.now() - daysAgo * day).toISOString();
const isoDaysFromNow = (daysFromNow: number) => new Date(Date.now() + daysFromNow * day).toISOString();

let index = 0;
const rows = stageCounts.flatMap(([stage, count]) =>
  Array.from({ length: count }, (_, offset) => {
    const unitIndex = index++;
    const [property_name, city, address] = properties[unitIndex % properties.length];
    const unit_number = `Unit ${String(unitIndex + 1).padStart(3, "0")}`;
    const monthly_rent = 1250 + ((unitIndex * 83) % 1450);
    const owner = owners[unitIndex % owners.length];
    const bedrooms = unitIndex % 10 === 0 ? 2 : unitIndex % 3 === 0 ? 1 : 0;

    const noticeAge = 14 + ((unitIndex * 5) % 45);
    const moveOutAge = 3 + ((unitIndex * 7) % 42);
    const listedAge = 3 + ((unitIndex * 11) % 58);
    const showingAge = 2 + ((unitIndex * 13) % 32);
    const applicationAge = 2 + ((unitIndex * 17) % 26);
    const leaseSignedAge = 1 + (unitIndex % 18);

    const isOccupied = stage === "Notice";
    const isLeased = stage === "Lease signed";
    const moveOutDate = isOccupied
      ? isoDaysFromNow(7 + (unitIndex % 45)).slice(0, 10)
      : isoDaysAgo(moveOutAge).slice(0, 10);

    const notice_at = isOccupied
      ? isoDaysAgo(noticeAge)
      : stage === "Move-out" || stage === "Listed" || stage === "Showing" || stage === "Application"
        ? isoDaysAgo(moveOutAge + 8)
        : null;
    const move_out_at = isOccupied ? null : isoDaysAgo(moveOutAge);
    const listed_at = ["Listed", "Showing", "Application", "Lease signed"].includes(stage)
      ? isoDaysAgo(listedAge)
      : null;
    const first_showing_at = ["Showing", "Application", "Lease signed"].includes(stage)
      ? isoDaysAgo(showingAge)
      : null;
    const application_at = ["Application", "Lease signed"].includes(stage)
      ? isoDaysAgo(applicationAge)
      : null;
    const lease_signed_at = isLeased ? isoDaysAgo(leaseSignedAge) : null;
    const stage_entered_at =
      stage === "Notice" ? notice_at :
      stage === "Move-out" ? move_out_at :
      stage === "Listed" ? listed_at :
      stage === "Showing" ? first_showing_at :
      stage === "Application" ? application_at :
      lease_signed_at;

    return {
      unit_number,
      property_name,
      address,
      city,
      bedrooms,
      monthly_rent,
      status: isLeased ? "leased" : isOccupied ? "occupied" : "vacant",
      notice_at,
      move_out_at,
      listed_at,
      first_showing_at,
      application_at,
      lease_signed_at,
      building: property_name,
      unit_label: unit_number,
      stage,
      stage_entered_at,
      move_out_date: moveOutDate,
      rent: monthly_rent,
      owner,
      listing_draft: ["Listed", "Showing", "Application", "Lease signed"].includes(stage)
        ? `Rental listing draft for ${property_name} ${unit_number}.`
        : null,
    };
  }),
);

async function main() {
  const { error } = await db.from("units").upsert(rows, {
    onConflict: "property_name,unit_number",
  });

  if (error) throw error;

  console.log(`Seeded ${rows.length} synthetic units across Calgary and Edmonton.`);
  for (const [stage, count] of stageCounts) {
    console.log(`${stage}: ${count}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
