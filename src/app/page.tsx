import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">欢迎来到学古诗</h1>
      <p className="text-muted-foreground mb-4">
        这里是学习中华传统诗词的乐园。
      </p>
      <Link
        href="/learn"
        className="text-primary hover:underline"
      >
        开始学习 →
      </Link>
    </div>
  );
}
