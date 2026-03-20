import { NextResponse } from "next/server";
import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const size = parseInt(searchParams.get("size") || "12");

    const data = await api.get(API_ENDPOINTS.POEMS_CATALOG_LIST, { page, size });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ list: [], total: 0, page: 1, size: 12 });
  }
}
