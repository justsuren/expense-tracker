import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("start");
  const endDate = searchParams.get("end");
  const status = searchParams.get("status");
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
  const offset = Number(searchParams.get("offset") ?? 0);

  const supabase = createServiceClient();

  let query = supabase
    .from("expenses")
    .select("*")
    .order("submitted_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (startDate) {
    query = query.gte("date", startDate);
  }
  if (endDate) {
    query = query.lte("date", endDate);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ expenses: data, pagination: { limit, offset } });
}

const VALID_STATUSES = new Set(["pending", "needs_review", "approved", "reimbursed"]);

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { ids, status } = body as { ids: string[]; status: string };

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids array required" }, { status: 400 });
  }

  if (!status || !VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const updateData: Record<string, unknown> = { status };
  if (status === "approved") {
    updateData.approved_at = new Date().toISOString();
  } else if (status === "reimbursed") {
    updateData.reimbursed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("expenses")
    .update(updateData)
    .in("id", ids)
    .select("id, status");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ updated: data });
}
