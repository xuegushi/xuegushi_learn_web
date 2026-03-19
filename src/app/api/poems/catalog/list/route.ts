import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "src/data");

interface PoemDetail {
  标题: string;
  作者: string;
  朝代: string;
  拼音?: string[];
  原文?: string[];
  译文?: string;
  创作背景?: string;
  赏析?: string;
  注释?: string[];
}

interface GradeData {
  年级: string;
  册次: {
    册: string;
    古诗词: PoemDetail[];
  }[];
}

interface System {
  id: string;
  name: string;
  grades: GradeData[];
}

interface CatalogItem {
  catalog: string;
  catalog_name: string;
  thumbnail: string;
  intro: string;
  description: string;
  profile: string;
  fasc_title: string;
  creator_id: number;
  pv_count: number;
  status: string;
  tag: string;
  created_at: string;
  updated_at: string;
}

function loadGradesFromDir(dir: string): GradeData[] {
  const grades: GradeData[] = [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".json")).sort();
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as GradeData;
    grades.push(data);
  }
  
  return grades;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const size = parseInt(searchParams.get("size") || "12");
  
  const data63Grades = loadGradesFromDir(path.join(dataDir, "data_63"));
  const data54Grades = loadGradesFromDir(path.join(dataDir, "data_54"));
  
  const systems: System[] = [
    { id: "63", name: "六三学制", grades: data63Grades },
    { id: "54", name: "五四学制", grades: data54Grades },
  ];
  
  const now = new Date().toISOString();
  
  const catalog: CatalogItem[] = systems.map((s) => ({
    catalog: s.id,
    catalog_name: s.name,
    thumbnail: "",
    intro: `${s.name}包含${s.grades.length}个年级的古诗词`,
    description: `${s.name}教材对应的古诗词选集`,
    profile: `${s.name}古诗词`,
    fasc_title: "",
    creator_id: 10,
    pv_count: 0,
    status: "active",
    tag: "",
    created_at: now,
    updated_at: now,
  }));
  
  const startIndex = (page - 1) * size;
  const endIndex = startIndex + size;
  const paginatedCatalog = catalog.slice(startIndex, endIndex);
  
  return NextResponse.json({
    list: paginatedCatalog,
    total: catalog.length,
    page,
    size,
  });
}
