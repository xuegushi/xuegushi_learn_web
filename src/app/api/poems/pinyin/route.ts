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

function generateNumericId(title: string, author: string): number {
  const hash = crypto.createHash("md5").update(`${title}-${author}`).digest("hex");
  return parseInt(hash.substring(0, 8), 16) % 100000000;
}

function findPoemByNumericId(poemId: number): PoemDetail | null {
  const data63Grades = loadGradesFromDir(path.join(dataDir, "data_63"));
  const data54Grades = loadGradesFromDir(path.join(dataDir, "data_54"));
  
  const allGrades = [...data63Grades, ...data54Grades];
  
  for (const grade of allGrades) {
    for (const semester of grade.册次) {
      for (const poem of semester.古诗词) {
        if (generateNumericId(poem.标题, poem.作者) === poemId) {
          return poem;
        }
      }
    }
  }
  
  return null;
}

function splitToPinyinArray(pinyinStr: string): string[] {
  return pinyinStr.split("").filter(Boolean);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const poemIdStr = searchParams.get("poem_id");
  
  if (!poemIdStr) {
    return NextResponse.json({ error: "poem_id is required" }, { status: 400 });
  }
  
  const poemId = parseInt(poemIdStr);
  
  if (isNaN(poemId)) {
    return NextResponse.json({ error: "poem_id must be a number" }, { status: 400 });
  }
  
  const poem = findPoemByNumericId(poemId);
  
  if (!poem) {
    return NextResponse.json({ error: "poem not found" }, { status: 404 });
  }
  
  const titlePinyin = poem.拼音 && poem.拼音.length > 0 
    ? splitToPinyinArray(poem.拼音[0]) 
    : [];
  
  const authorPinyin = poem.拼音 && poem.拼音.length > 1 
    ? splitToPinyinArray(poem.拼音[1]) 
    : [];
  
  const contentPinyin: string[][] = poem.拼音 && poem.拼音.length > 2
    ? poem.拼音.slice(2).map(line => splitToPinyinArray(line))
    : [];
  
  return NextResponse.json({
    _id: poemId.toString(),
    title: titlePinyin,
    author: authorPinyin,
    content: contentPinyin,
    xu: null,
  });
}
