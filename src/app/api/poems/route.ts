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

export async function GET() {
  const data63Grades = loadGradesFromDir(path.join(dataDir, "data_63"));
  const data54Grades = loadGradesFromDir(path.join(dataDir, "data_54"));
  
  const systems: System[] = [
    { id: "63", name: "六三学制", grades: data63Grades },
    { id: "54", name: "五四学制", grades: data54Grades },
  ];
  
  return NextResponse.json(systems);
}
