import Head from "next/head";
import { HomeModeCard } from "@/components/home/home-mode-card";
import { HomeGuide } from "@/components/home/home-guide";
import { BookOpen, Timer } from "lucide-react";

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4 space-y-8">
      <Head>
        <title>学古诗 - 首页</title>
        <meta
          name="description"
          content="学习模式与背诵模式，助力掌握与记忆的有效融合。"
        />
      </Head>
      <header className="text-center">
        <p className="text-muted-foreground">
          选择你的学习路径：学习模式帮助理解和技能提升，背诵模式专注记忆与巩固。
        </p>
      </header>
      <HomeGuide />
      <div className="grid grid-cols-1 gap-6">
        <HomeModeCard
          title="学习模式"
          icon={<BookOpen className="h-14 w-14" />}
          description="系统化学习诗词内容，掌握结构、拼音、译文和注释等要点。"
          bullets={[
            "浏览目录、选择朝代与课程",
            "逐句解析、拼音标注、注释与译文对照",
            "按进度推演，随时查看学习进度",
          ]}
          ctaLabel="开始学习"
          href="/learn?mode=learn"
          reverse={false}
        />
        <HomeModeCard
          title="背诵模式"
          icon={<Timer className="h-14 w-14" />}
          description="把诗词带进记忆，系统记录掌握情况，并进行定期回顾。"
          bullets={[
            "记录“掌握/未掌握/跳过”状态",
            "生成汇总、导出数据用于复盘",
            "结合打卡和学习进度，提升记忆稳定性",
          ]}
          ctaLabel="开始背诵"
          href="/learn?mode=recite"
          reverse={true}
        />
      </div>
    </main>
  );
}
