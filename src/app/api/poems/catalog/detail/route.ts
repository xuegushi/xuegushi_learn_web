import { NextResponse } from "next/server";
import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const catalogId = searchParams.get("catalog_id");

    if (!catalogId) {
      return NextResponse.json({ error: "catalog_id is required" }, { status: 400 });
    }

    const data = await api.get(API_ENDPOINTS.POEMS_CATALOG_DETAIL, { catalog_id: catalogId });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch catalog" }, { status: 500 });
  }
}
