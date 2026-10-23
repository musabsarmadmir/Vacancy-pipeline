import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding.");
const db = createClient(url, key);
const properties = [["The Juniper", "Calgary", "111 8 Ave SW"], ["Parkline", "Calgary", "425 17 Ave SW"], ["Beltline House", "Calgary", "909 12 St SW"], ["Riverbend", "Edmonton", "10320 102 Ave NW"], ["The Mckenzie", "Edmonton", "11806 104 St NW"], ["Oliver Row", "Edmonton", "10020 117 St NW"]] as const;
const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString();
const rows = Array.from({ length: 800 }, (_, index) => {
  const [property_name, city, address] = properties[index % properties.length];
  const cycle = index % 17, isLeased = cycle < 4, isOccupied = cycle > 8;
  const notice = 18 + ((index * 7) % 58), moveOut = notice - 8, listed = moveOut - 3, showing = listed - 9, application = showing - 8;
  return { unit_number: `Unit ${100 + (index % 30)}`, property_name, address, city, bedrooms: index % 9 === 0 ? 2 : index % 4 === 0 ? 1 : 0, monthly_rent: 1180 + ((index * 83) % 1050), status: isLeased ? "leased" : isOccupied ? "occupied" : "vacant", notice_at: isOccupied ? null : iso(notice), move_out_at: isOccupied || cycle === 16 ? null : iso(moveOut), listed_at: isOccupied || cycle >= 15 ? null : iso(listed), first_showing_at: isOccupied || cycle % 7 === 6 ? null : iso(showing), application_at: isLeased || cycle % 5 > 2 ? null : iso(application), lease_signed_at: isLeased ? iso(2 + (index % 13)) : null };
});
const { error } = await db.from("units").upsert(rows, { onConflict: "property_name,unit_number" });
if (error) throw error;
console.log(`Seeded ${rows.length} synthetic units across Calgary and Edmonton.`);
