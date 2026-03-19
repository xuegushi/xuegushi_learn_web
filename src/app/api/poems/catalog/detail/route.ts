import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

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

function generatePoemId(title: string, author: string): string {
  return crypto.createHash("md5").update(`${title}-${author}`).digest("hex").substring(0, 12);
}

function getTargetType(poem: PoemDetail): string {
  return "诗";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const catalogId = searchParams.get("catalog_id");
  
  if (!catalogId) {
    return NextResponse.json({ error: "catalog_id is required" }, { status: 400 });
  }
  
  const data63Grades = loadGradesFromDir(path.join(dataDir, "data_63"));
  const data54Grades = loadGradesFromDir(path.join(dataDir, "data_54"));
  
  const systems: System[] = [
    { id: "63", name: "六三学制", grades: data63Grades },
    { id: "54", name: "五四学制", grades: data54Grades },
  ];
  
  const system = systems.find((s) => s.id === catalogId);
  
  if (!system) {
    return NextResponse.json({ error: "catalog not found" }, { status: 404 });
  }
  
  const now = new Date().toISOString();
  
  const fascicules = system.grades.flatMap((grade, gradeIndex) =>
    grade.册次.map((semester, semesterIndex) => {
      const fasciculeId = `${system.id}-${gradeIndex + 1}-${semesterIndex + 1}`;
      const poems = semester.古诗词.map((poem, poemIndex) => ({
        type: "poem" as const,
        title: poem.标题,
        author: poem.作者,
        dynasty: poem.朝代,
        target_id: parseInt(generatePoemId(poem.标题, poem.作者), 16) % 100000000,
        target_type: getTargetType(poem),
        tag: "",
        order: poemIndex + 1,
      }));
      
      return {
        fascicule: fasciculeId,
        fascicule_name: `${grade.年级}${semester.册}`,
        edition: "",
        catalog_id: system.id,
        thumbnail: "",
        big_thumbnail: "",
        creator_id: 10,
        status: "active",
        created_at: now,
        updated_at: now,
        poems,
      };
    })
  );
  
  return NextResponse.json({
    catalog: system.id,
    catalog_name: system.name,
    thumbnail: "",
    intro: `${system.name}包含${system.grades.length}个年级的古诗词`,
    description: `${system.name}教材对应的古诗词选集`,
    profile: `${system.name}古诗词`,
    fasc_title: "",
    creator_id: 10,
    pv_count: 0,
    status: "active",
    tag: "",
    created_at: now,
    updated_at: now,
    grades: system.grades,
    fascicules,
  });
}
