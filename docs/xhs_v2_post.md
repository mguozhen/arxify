# 小红书 v2 Post — 产品已上线版

🎯 我做了一个 AI 研究员 SaaS，上线了

📍 一周前：在小红书发了个 AI Researcher pipeline 招募共创伙伴
📍 这周：我把它做成产品了，**arxify**，上 GitHub 了

→ 30 秒输入研究背景 → 5 个候选方向 + reviewer-2 brutal 审稿
→ 完全免费试 → github.com/mguozhen/arxify

—————————————

🔧 它能干啥

输入：你的研究背景（一段话 / 数据描述 / 开题报告）

输出：5 张研究方向卡片，每张含：
✅ 标题 + 反直觉 paradox
✅ Hypothesis（H1 statement）
✅ Identification 策略（DID/IV/RDD/RCT）
✅ Theory anchor + 文献
✅ 目标顶刊（MISQ/Mgmt Sci/JM/Mark Sci/JCR/Org Sci）
✅ 6 月可行性评分 ⭐⭐⭐⭐⭐
✅ A/B 难度评分 ⭐⭐⭐⭐⭐

每个方向旁边一个按钮：「⚡ Get reviewer-2 critique」
点一下：MiroThinker 化身 reviewer-2 给你 brutal 审稿：
- Novelty 1-10 分
- Top 3 weaknesses
- 你必须引但没引的 canonical 文献
- Reviewer 2 最可能 kill 你的那一句
- 一个最关键的修改建议
- Verdict: ACCEPT / MAJOR_REVISION / REJECT

—————————————

📊 实测产出（我用自己 DBA 数据跑的）

输入："I study LLM customer service with 1.9B conversations and 8.7M handoff events..."

30 秒后吐出：
1. The Handoff Paradox（MISQ）—— Novelty 6/10, MAJOR_REVISION
2. The Transparency Tax（Mgmt Sci）—— Feasibility ⭐⭐⭐⭐
3. The Expertise Trap（Org Sci）
4. The Confidence Curse（MISQ）
5. The Learning Subsidy Paradox（Mgmt Sci）

每条都能写一篇顶刊。这是 AI 给我老板看的草稿。

—————————————

💰 定价（参考 Manus）

🆓 Spark — $0/mo (300 credits, 1 项目)
🎓 Scholar — $39/mo (5K credits, 论文 draft + Zotero)
🧪 Lab — $99/mo (15K credits, 团队 + 实验沙盒 + API)

年付 15% off。

—————————————

🛠 技术栈

前端：Next.js 15 + Tailwind 4
后端：FastAPI + SQLite (MVP) / Postgres (prod)
LLM：Claude Sonnet 4.5 (ideation + critique) + MiroThinker (deep research)
基础：基于开源 ai-researcher (SakanaAI/AI-Scientist-v2 + MiroMindAI/MiroThinker 整合包)

全部源码：
🔗 github.com/mguozhen/arxify    （SaaS 层）
🔗 github.com/mguozhen/ai-researcher  （核心 pipeline）

—————————————

🤝 找前 10 个 beta 用户

加 waitlist 的前 10 个，**送 90 天 Scholar 免费**（$117 价值），换一个 testimonial。

📚 学术圈：在读博 / 想读博 / 正在选题 → 试试 /try
🛠️ 工程圈：想搭 AI Researcher 系统 → fork GitHub
🧪 数据持有方：你有领域生产数据 → 互补合作
💼 想做 AI for Science 的 → DM 我

—————————————

域名：暂时本地跑（http://127.0.0.1:3000）
域名注册中（推荐 arxify.io，给我点个赞先 lock 一下）

一个人 + 两个 AI 模型 + 一台 Mac
↓
一个研究实验室
↓
一个可付费的 SaaS

3 天。

#AI #SaaS #DBA #博士论文 #创业 #人工智能 #研究生 #AI辅助科研 #开源 #独立开发 #SakanaAI #Claude #indie
