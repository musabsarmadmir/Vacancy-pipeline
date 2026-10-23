import { Unit } from "./types";

const properties = [
  ["The Juniper", "Calgary", "111 8 Ave SW"],
  ["Parkline", "Calgary", "425 17 Ave SW"],
  ["Beltline House", "Calgary", "909 12 St SW"],
  ["Riverbend", "Edmonton", "10320 102 Ave NW"],
  ["The Mckenzie", "Edmonton", "11806 104 St NW"],
  ["Oliver Row", "Edmonton", "10020 117 St NW"]
] as const;

const names = ["Apt", "Suite", "Unit"];
const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString();

export const demoUnits: Unit[] = Array.from({ length: 800 }, (_, index) => {
  const [property_name, city, address] = properties[index % properties.length];
  const cycle = index % 17;
  const isLeased = cycle < 4;
  const isOccupied = cycle > 8;
  const noticeAge = 18 + ((index * 7) % 58);
  const moveOutAge = noticeAge - 8;
  const listedAge = moveOutAge - 3;
  const showingAge = listedAge - 9;
  const applicationAge = showingAge - 8;
  return {
    id: `demo-${index + 1}`,
    unit_number: `${names[index % names.length]} ${100 + (index % 30)}`,
    property_name,
    address,
    city,
    bedrooms: index % 9 === 0 ? 2 : index % 4 === 0 ? 1 : 0,
    monthly_rent: 1180 + ((index * 83) % 1050),
    status: isLeased ? "leased" : isOccupied ? "occupied" : "vacant",
    notice_at: isOccupied ? null : iso(noticeAge),
    move_out_at: isOccupied || cycle === 16 ? null : iso(moveOutAge),
    listed_at: isOccupied || cycle === 15 || cycle === 16 ? null : iso(listedAge),
    first_showing_at: isOccupied || cycle % 7 === 6 ? null : iso(showingAge),
    application_at: isLeased || cycle % 5 > 2 ? null : iso(applicationAge),
    lease_signed_at: isLeased ? iso(2 + (index % 13)) : null
  };
});
