import { NextResponse } from "next/server";
import { api } from "@/lib/api/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "poem ID is required" }, { status: 400 });
    }

    const data = await api.get(`/api/poems/${id}`);

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch poem" }, { status: 500 });
  }
}
