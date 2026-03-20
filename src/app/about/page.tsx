export default function AboutPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">关于学古诗</h1>
      
      <div className="space-y-8">
        {/* 项目简介 */}
        <section>
          <p className="text-lg text-muted-foreground leading-relaxed">
            学古诗是一个基于 Next.js 开发的诗词学习网站，帮助用户学习和背诵古诗词。
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            本项目由 <a href="https://opencode.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenCode</a> 生成，基于 AI 辅助开发。
          </p>
        </section>

        {/* 功能特性 */}
        <section>
          <h2 className="text-xl font-semibold mb-4">功能特性</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">学习模式</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><strong>学习模式</strong>：查看诗词全文，包含拼音标注、译文、注释、创作背景、赏析</li>
                <li><strong>背诵模式</strong>：智能背诵辅助，支持多种提示方式
                  <ul className="list-circle list-inside ml-4 mt-1 space-y-1">
                    <li>显示首字/尾字提示</li>
                    <li>随机显示单个汉字</li>
                    <li>随机提示功能（点击可重新随机）</li>
                  </ul>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">核心功能</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><strong>多选集支持</strong>：小学古诗、初中古诗、高中古诗等</li>
                <li><strong>分册选择</strong>：按年级/学期分册浏览</li>
                <li><strong>进度追踪</strong>：状态指示点显示已掌握/未掌握/待学习</li>
                <li><strong>正确率统计</strong>：实时显示背诵正确率</li>
                <li><strong>继续学习</strong>：背诵完成后可继续下一分册</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">本地数据管理</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><strong>IndexedDB 缓存</strong>：诗词详情和拼音数据本地缓存</li>
                <li><strong>数据筛选</strong>：支持关键字搜索和朝代筛选</li>
                <li><strong>批量操作</strong>：批量删除、批量更新</li>
                <li><strong>预览功能</strong>：查看完整诗词详情（含拼音、译文、注释等）</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">界面特性</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><strong>响应式设计</strong>：支持 PC 端和移动端</li>
                <li><strong>暗色模式</strong>：支持明暗主题切换</li>
                <li><strong>侧边栏折叠</strong>：PC 端可收起侧边栏</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 技术栈 */}
        <section>
          <h2 className="text-xl font-semibold mb-4">技术栈</h2>
          <div className="flex flex-wrap gap-2">
            {["Next.js 16", "React 19", "Tailwind CSS", "shadcn/ui", "IndexedDB", "Turbopack"].map((tech) => (
              <span key={tech} className="px-3 py-1 bg-muted rounded-full text-sm">
                {tech}
              </span>
            ))}
          </div>
        </section>

        {/* 数据来源 */}
        <section>
          <h2 className="text-xl font-semibold mb-4">数据来源</h2>
          <p className="text-muted-foreground">
            本项目使用 <a href="https://api.xuegushi.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">学古诗 API</a> 获取诗词数据。
          </p>
        </section>
      </div>
    </div>
  );
}
