import { NextResponse } from "next/server";
import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";

export async function GET() {
  try {
    const data = await api.get(API_ENDPOINTS.POEMS_LIST);

    return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}
