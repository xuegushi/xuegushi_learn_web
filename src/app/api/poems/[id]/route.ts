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

function generateNumericId(title: string, author: string): number {
  const hash = crypto.createHash("md5").update(`${title}-${author}`).digest("hex");
  return parseInt(hash.substring(0, 8), 16) % 100000000;
}

function findPoemById(poemId: string): { 
  poem: PoemDetail; 
  catalogId: string; 
  catalogName: string; 
  grade: string; 
  semester: string 
} | null {
  const data63Grades = loadGradesFromDir(path.join(dataDir, "data_63"));
  const data54Grades = loadGradesFromDir(path.join(dataDir, "data_54"));
  
  const systems: System[] = [
    { id: "63", name: "六三学制", grades: data63Grades },
    { id: "54", name: "五四学制", grades: data54Grades },
  ];
  
  for (const system of systems) {
    for (const grade of system.grades) {
      for (const semester of grade.册次) {
        for (const poem of semester.古诗词) {
          if (generatePoemId(poem.标题, poem.作者) === poemId) {
            return {
              poem,
              catalogId: system.id,
              catalogName: system.name,
              grade: grade.年级,
              semester: semester.册,
            };
          }
        }
      }
    }
  }
  
  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  if (!id) {
    return NextResponse.json({ error: "poem ID is required" }, { status: 400 });
  }
  
  const result = findPoemById(id);
  
  if (!result) {
    return NextResponse.json({ error: "poem not found" }, { status: 404 });
  }
  
  const { poem, catalogId, catalogName, grade, semester } = result;
  
  const poemData = {
    id: generateNumericId(poem.标题, poem.作者),
    source_id: generateNumericId(poem.标题, poem.作者),
    title: poem.标题,
    author: poem.作者,
    dynasty: poem.朝代,
    tags: "",
    content: {
      content: poem.原文 || [],
    },
    background: poem.创作背景 || "",
    type: "诗",
    like_count: 0,
    author_source_id: 0,
    author_id: 0,
    collect_count: 0,
    pv_count: 0,
    text_content: poem.原文?.join("") || "",
    like_status: false,
    collect_status: false,
    author_avatar: "",
  };
  
  const authorData = {
    dynasty: poem.朝代,
    author_name: poem.作者,
    like_count: 0,
    profile: "",
    collect_count: 0,
    pv_count: 0,
    avatar: "",
    title: "",
    describe: "",
    styled: "",
    poems_count: 0,
    sentences_count: 0,
  };
  
  const detailData = {
    poem_id: generateNumericId(poem.标题, poem.作者),
    source_id: generateNumericId(poem.标题, poem.作者),
    poem_title: poem.标题,
    yi: poem.译文 ? {
      reference: { title: "译文", content: [] },
      content: [poem.译文],
    } : null,
    zhu: poem.注释 && poem.注释.length > 0 ? {
      reference: { title: "注释", content: [] },
      content: poem.注释,
    } : null,
    shangxi: poem.赏析 ? {
      reference: { title: "赏析", content: "" },
      content: [poem.赏析],
    } : null,
    more_infos: "",
  };
  
  const now = new Date().toISOString();
  
  return NextResponse.json({
    poem: {
      ...poemData,
      catalog_id: catalogId,
      catalog_name: catalogName,
      grade,
      semester,
    },
    author: authorData,
    detail: detailData,
    sentences: [],
    poems_count: 0,
    created_at: now,
    updated_at: now,
  });
}
