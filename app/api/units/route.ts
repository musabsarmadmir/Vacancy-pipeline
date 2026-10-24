import { NextResponse } from "next/server";
import { demoUnits } from "../../../lib/demo-data";
import { supabase } from "../../../lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  if (!supabase) return NextResponse.json({ units: demoUnits, source: "demo" });
  const { data, error } = await supabase.from("units").select("*").order("city").order("property_name").order("unit_number");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ units: data, source: "supabase" });
}
