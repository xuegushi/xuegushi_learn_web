import { NextResponse } from "next/server";
import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const poemIdStr = searchParams.get("poem_id");

    if (!poemIdStr) {
      return NextResponse.json({ error: "poem_id is required" }, { status: 400 });
    }

    const data = await api.get(API_ENDPOINTS.POEMS_PINYIN, { poem_id: poemIdStr });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch pinyin" }, { status: 500 });
  }
}
