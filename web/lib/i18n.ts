// Minimal i18n — no library, just typed dict + React context.
// 4 locales: zh (default), en, ja, es

export type Locale = "zh" | "en" | "ja" | "es";
export const LOCALES: Locale[] = ["zh", "en", "ja", "es"];
// Locales actually exposed in the UI switcher. ja/es dicts are kept for the
// marketing pages but the dashboard only offers 中/EN.
export const EXPOSED_LOCALES: Locale[] = ["zh", "en"];
export const LOCALE_LABELS: Record<Locale, string> = {
  zh: "中文",
  en: "English",
  ja: "日本語",
  es: "Español",
};

type Dict = {
  // nav
  nav_try: string;
  nav_pricing: string;
  nav_github: string;
  nav_signup: string;
  nav_login: string;
  nav_dashboard: string;

  // landing
  hero_eyebrow: string;
  hero_title_a: string;          // "From"
  hero_title_idea: string;        // "idea"  (struck)
  hero_title_b: string;          // "to"
  hero_title_paper: string;       // "paper"
  hero_desc: string;
  hero_cta_start: string;
  hero_cta_pricing: string;
  hero_perks: string[];

  how_eyebrow: string;
  how_title: string;
  how_subtitle: string;
  how_steps: { n: string; title: string; desc: string }[];

  testimonial_quote: string;
  testimonial_author: string;

  oss_title: string;
  oss_desc: string;
  oss_cta: string;

  // try page
  try_eyebrow: string;
  try_title_a: string;
  try_title_b: string;
  try_desc: string;
  try_label: string;
  try_placeholder: string;
  try_example_btn: string;
  try_submit: string;
  try_thinking: string;
  try_error_short: string;
  try_critique_btn: string;
  try_critique_loading: string;
  try_cta_more: string;
  try_cta_plans: string;

  // pricing
  pricing_title_a: string;
  pricing_title_b: string;
  pricing_subtitle: string;
  pricing_annual_note: string;
  pricing_contact: string;
  faq_title: string;

  // signup
  signup_eyebrow: string;
  signup_title_a: string;
  signup_title_b: string;
  signup_desc: string;
  signup_email_label: string;
  signup_context_label: string;
  signup_source_label: string;
  signup_submit: string;
  signup_submit_loading: string;
  signup_disclaimer: string;
  signup_success_title: string;
  signup_success_will_email: string;
  signup_to_dashboard: string;
  signup_try_demo: string;
  signup_share_x: string;

  // login
  login_eyebrow: string;
  login_title: string;
  login_desc: string;
  login_token_label: string;
  login_token_placeholder: string;
  login_submit: string;
  login_alt: string;
  login_alt_link: string;

  // dashboard
  dash_tab_chat: string;
  dash_tab_hyps: string;
  dash_tab_data: string;
  dash_tab_queue: string;
  dash_chat_empty: string;
  dash_chat_placeholder: string;
  dash_chat_send: string;

  // hypothesis ppt
  ppt_back: string;
  ppt_regenerate: string;
  ppt_expand_eyebrow: string;
  ppt_expand_desc: string;
  ppt_generate: string;
  ppt_generating: string;
  ppt_nav_hint: string;

  // dashboard chrome
  dash_tab_advisor: string;
  dash_chat_thinking: string;
  dash_chat_advisor_label: string;
  dash_more: string;
  dash_less: string;
  dash_view_ppt: string;
  dash_expand_ppt: string;
  dash_row_hypothesis: string;
  dash_row_identification: string;
  dash_row_theory: string;
  dash_row_notes: string;
  dash_feas: string;
  dash_ab: string;
  dash_in_line_a: string;
  dash_in_line_b: string;
  // queue / waitlist
  queue_launch_progress: string;
  queue_more_to_launch: string;
  queue_hit_target: string;
  queue_signup_info: string;
  queue_position: string;
  queue_email: string;
  queue_joined: string;
  queue_source: string;
  queue_refer: string;
  queue_referred: string;
  queue_copy: string;
  queue_copied: string;
  // no-token page
  notoken_title_a: string;
  notoken_title_em: string;
  notoken_desc: string;
  notoken_login: string;
  notoken_join: string;
  // hypothesis detail page chrome
  ppt_404: string;
  ppt_not_exist: string;
  ppt_load_fail: string;
  ppt_back_dash: string;
  ppt_loading_proposal: string;
  ppt_prev: string;
  ppt_next: string;
  ppt_slide_question: string;
  ppt_h_why_top: string;
  ppt_h_why_solvea: string;
  ppt_design: string;
  ppt_outcomes: string;
  ppt_h_outcomes: string;
  ppt_primary: string;
  ppt_secondary: string;
  ppt_mediators: string;
  ppt_rand_unit: string;
  ppt_duration: string;
  ppt_logic: string;
  ppt_treatment_arms: string;
  ppt_identification: string;
  ppt_pre_registered: string;
  ppt_hypotheses: string;
  ppt_sample_power: string;
  ppt_h_sample: string;
  ppt_per_arm: string;
  ppt_total_n: string;
  ppt_power: string;
  ppt_mde: string;
  ppt_weeks_collect: string;
  ppt_implementation: string;
  ppt_h_impl: string;
  ppt_engineering: string;
  ppt_compute_cost: string;
  ppt_ops_needed: string;
  ppt_ops_steps: string;
  ppt_dependencies: string;
  ppt_journals: string;
  ppt_h_journals: string;
  ppt_theory_anchors: string;
  ppt_h_theory: string;
  ppt_risks: string;
  ppt_h_risks: string;
  ppt_mitigation: string;
  ppt_pitches: string;
  ppt_h_pitches: string;
  ppt_weeks_unit: string;

  // common
  loading: string;
};

const zh: Dict = {
  nav_try: "免费试用",
  nav_pricing: "价格",
  nav_github: "GitHub",
  nav_signup: "加入等待名单",
  nav_login: "登录",
  nav_dashboard: "工作台",

  hero_eyebrow: "VOL. 01 · 基于开源 AI-RESEARCHER 构建",
  hero_title_a: "从",
  hero_title_idea: "想法",
  hero_title_b: "到",
  hero_title_paper: "论文",
  hero_desc: "输入你的想法或数据。获得研究方案、实验设计和完整论文初稿。基于 SakanaAI AI-Scientist-v2 + MiroMind MiroThinker。",
  hero_cta_start: "免费开始 →",
  hero_cta_pricing: "查看价格",
  hero_perks: ["⚡ 15 分钟出 5 个方向", "🔬 残酷同行评审", "📄 LaTeX + PDF 导出", "🔐 不用你的数据训练"],

  how_eyebrow: "工作流",
  how_title: "怎么运作",
  how_subtitle: "四步，一个下午。",
  how_steps: [
    { n: "01", title: "输入", desc: "粘贴想法、上传 PDF 提案、或拖入 CSV 数据。" },
    { n: "02", title: "方案", desc: "AI 给出 5 个候选方向 + DeepCritique 评审 + 锦标赛排名。" },
    { n: "03", title: "数据", desc: "上传实验结果。系统把结果对应到选定方向。" },
    { n: "04", title: "论文", desc: "LaTeX + PDF 初稿，可直接交给导师或投稿。" },
  ],

  testimonial_quote: "用它选了 HKU DBA 博士论文主题。17 个候选方向、残酷同行评审、自动给三位导师发邮件。3 天，一个人。",
  testimonial_author: "— Hunter，HKU DBA 候选人 · 首位付费用户",

  oss_title: "基于开源构建",
  oss_desc: "核心 pipeline 是 MIT 协议开源在 GitHub。可以本地免费跑。我们只是让它好用。",
  oss_cta: "github.com/mguozhen/ai-researcher →",

  try_eyebrow: "试用 · 无需注册，每次访问一次免费",
  try_title_a: "粘贴你的",
  try_title_b: "研究上下文",
  try_desc: "粘贴研究背景、已有数据、或提案草稿。约 30 秒返回 5 个候选研究方向，含 paradox + 识别策略 + 期刊命中。",
  try_label: "你的研究上下文",
  try_placeholder: "例如：我是博士在读 / 研究 ...",
  try_example_btn: "用示例试试",
  try_submit: "生成 5 个方向 →",
  try_thinking: "思考中… (~30 秒)",
  try_error_short: "至少需要 20 个字符描述研究上下文。",
  try_critique_btn: "⚡ 获取 reviewer-2 评审 →",
  try_critique_loading: "调动 reviewer-2 残酷模式… (~15 秒)",
  try_cta_more: "想要 DeepCritique？锦标赛排名？完整论文写作？",
  try_cta_plans: "查看套餐 →",

  pricing_title_a: "为",
  pricing_title_b: "研究者",
  pricing_subtitle: "免费开始。出第一篇论文时再升级。随时取消。",
  pricing_annual_note: "年付节省约 15%。需要更多额度或席位？",
  pricing_contact: "联系我们",
  faq_title: "常见问题",

  signup_eyebrow: "等待名单 · 100 人时开放",
  signup_title_a: "加入",
  signup_title_b: "等待名单",
  signup_desc: "前 10 名免费获得 90 天 Scholar 套餐，换取一句评价。100 人到达时开放公测。",
  signup_email_label: "邮箱",
  signup_context_label: "你打算用 arxify 做什么？（可选）",
  signup_source_label: "怎么找到我们的？（可选）",
  signup_submit: "保留我的位置 →",
  signup_submit_loading: "加入中…",
  signup_disclaimer: "公测开放时我们立刻邮件通知。随时取消；无需绑卡。",
  signup_success_title: "你是第 # 位。",
  signup_success_will_email: "公测开放时通知",
  signup_to_dashboard: "前往工作台 →",
  signup_try_demo: "试用 demo",
  signup_share_x: "分享到 X",

  login_eyebrow: "已有账号",
  login_title: "登录",
  login_desc: "粘贴你 signup 时拿到的 token。Beta 后会改成邮箱魔法链接登录。",
  login_token_label: "Token",
  login_token_placeholder: "比如 2O7Ej86H2k6XLmtJVb-m5w",
  login_submit: "进入工作台 →",
  login_alt: "没有 token？",
  login_alt_link: "加入等待名单",

  dash_tab_chat: "💬 对话",
  dash_tab_hyps: "📋 研究假设",
  dash_tab_data: "🗄️ 数据源",
  dash_tab_queue: "📬 等待名单",
  dash_chat_empty: "问任何关于 17 个方向、数据源、或导师策略的问题。",
  dash_chat_placeholder: "比如 D8 vs D14 哪个更稳？⌘+Enter 发送",
  dash_chat_send: "发送",

  ppt_back: "← 返回",
  ppt_regenerate: "↻ 重新生成",
  ppt_expand_eyebrow: "⚡ 扩展为 PPT",
  ppt_expand_desc: "按 Hunter 的开题报告框架生成 13 张 slide：一句话问题 / 为什么顶刊 / 为什么 Solvea 独家 / 实验设计 / Outcome / Hypotheses / Sample power / 实施成本 / 期刊 / 文献锚 / 风险 / 三位老师的电梯演讲。",
  ppt_generate: "生成完整提案 →",
  ppt_generating: "生成提案中 (~30 秒)…",
  ppt_nav_hint: "← → 空格切换 · Esc 退出 · 0-9 跳转",

  dash_tab_advisor: "💬 AI 导师",
  dash_chat_thinking: "思考中…",
  dash_chat_advisor_label: "ai 导师 · claude",
  dash_more: "+ 展开",
  dash_less: "− 收起",
  dash_view_ppt: "查看 PPT →",
  dash_expand_ppt: "扩展为 PPT →",
  dash_row_hypothesis: "假设",
  dash_row_identification: "识别策略",
  dash_row_theory: "理论锚点",
  dash_row_notes: "备注",
  dash_feas: "可行性",
  dash_ab: "A/B",
  dash_in_line_a: "你排在第 ",
  dash_in_line_b: " 位。",
  queue_launch_progress: "上线进度",
  queue_more_to_launch: "还差 {n} 个就上线。",
  queue_hit_target: "🎉 已达目标。本周开放 Beta。",
  queue_signup_info: "你的注册信息",
  queue_position: "排位",
  queue_email: "邮箱",
  queue_joined: "加入时间",
  queue_source: "来源",
  queue_refer: "邀请好友",
  queue_referred: "已邀请：",
  queue_copy: "复制",
  queue_copied: "已复制！",
  notoken_title_a: "你还没",
  notoken_title_em: "加入",
  notoken_desc: "可能你还没加入，或者换了设备。",
  notoken_login: "登录",
  notoken_join: "加入等待名单 →",
  ppt_404: "404 · 未找到",
  ppt_not_exist: "假设 {code} 不存在",
  ppt_load_fail: "无法加载这个假设",
  ppt_back_dash: "← 返回工作台",
  ppt_loading_proposal: "加载提案中…",
  ppt_prev: "← 上一页",
  ppt_next: "下一页 →",
  ppt_slide_question: "一句话问题",
  ppt_h_why_top: "为什么能上顶刊",
  ppt_h_why_solvea: "为什么只有 Solvea 能回答",
  ppt_design: "实验设计",
  ppt_outcomes: "结果变量",
  ppt_h_outcomes: "我们测量什么",
  ppt_primary: "主要",
  ppt_secondary: "次要",
  ppt_mediators: "中介变量",
  ppt_rand_unit: "随机化单位",
  ppt_duration: "周期",
  ppt_logic: "逻辑",
  ppt_treatment_arms: "处理组",
  ppt_identification: "识别策略",
  ppt_pre_registered: "预注册",
  ppt_hypotheses: "假设",
  ppt_sample_power: "样本与功效",
  ppt_h_sample: "多大？多久？",
  ppt_per_arm: "每组",
  ppt_total_n: "总样本 N",
  ppt_power: "功效",
  ppt_mde: "最小可检测效应",
  ppt_weeks_collect: "采集周数",
  ppt_implementation: "实施",
  ppt_h_impl: "成本与时间线",
  ppt_engineering: "工程",
  ppt_compute_cost: "算力成本",
  ppt_ops_needed: "所需运营",
  ppt_ops_steps: "运营步骤",
  ppt_dependencies: "依赖项",
  ppt_journals: "目标期刊",
  ppt_h_journals: "投向哪里",
  ppt_theory_anchors: "理论锚点",
  ppt_h_theory: "文献框架",
  ppt_risks: "风险",
  ppt_h_risks: "什么会让它失败",
  ppt_mitigation: "缓解：",
  ppt_pitches: "电梯演讲",
  ppt_h_pitches: "三位导师的 30 秒 pitch",
  ppt_weeks_unit: " 周",

  loading: "加载中…",
};

const en: Dict = {
  nav_try: "Try free",
  nav_pricing: "Pricing",
  nav_github: "GitHub",
  nav_signup: "Join waitlist",
  nav_login: "Log in",
  nav_dashboard: "Dashboard",

  hero_eyebrow: "VOL. 01 · BUILT ON OPEN-SOURCE AI-RESEARCHER",
  hero_title_a: "From",
  hero_title_idea: "idea",
  hero_title_b: "to",
  hero_title_paper: "paper",
  hero_desc: "Drop in your idea or data. Get a research plan, experiment design, and full paper draft. Built on SakanaAI AI-Scientist-v2 + MiroMind MiroThinker.",
  hero_cta_start: "Start free →",
  hero_cta_pricing: "See pricing",
  hero_perks: ["⚡ 5 ideas in 15 min", "🔬 Brutal peer review", "📄 LaTeX + PDF export", "🔐 No training on your data"],

  how_eyebrow: "Workflow",
  how_title: "How it works",
  how_subtitle: "Four steps, one afternoon.",
  how_steps: [
    { n: "01", title: "Input", desc: "Paste your idea, upload a PDF proposal, or drop a CSV of data." },
    { n: "02", title: "Plan", desc: "AI drafts 5 candidate directions + DeepCritique peer review + tournament ranking." },
    { n: "03", title: "Data", desc: "Upload experiment results. We map them to the chosen plan." },
    { n: "04", title: "Paper", desc: "LaTeX + PDF draft, ready to hand to your advisor or submit." },
  ],

  testimonial_quote: "Used it to pick my HKU DBA dissertation topic. 17 candidate directions, brutal peer review, automated email to three advisors. Three days, one person.",
  testimonial_author: "— Hunter, HKU DBA Candidate · first paying customer",

  oss_title: "Built on open source",
  oss_desc: "The core pipeline is MIT-licensed and on GitHub. Run it locally for free. We just make it easy.",
  oss_cta: "github.com/mguozhen/ai-researcher →",

  try_eyebrow: "TRY IT — NO SIGNUP, ONE FREE RUN PER VISIT",
  try_title_a: "Drop in your",
  try_title_b: "context",
  try_desc: "Paste your research background, existing data, or proposal sketch. Get 5 candidate directions with paradox + identification + journal fit in ~30 seconds.",
  try_label: "Your research context",
  try_placeholder: "e.g. I'm a PhD candidate studying ...",
  try_example_btn: "Try with example",
  try_submit: "Generate 5 directions →",
  try_thinking: "Thinking… (~30s)",
  try_error_short: "Need at least 20 characters describing your research context.",
  try_critique_btn: "⚡ Get reviewer-2 critique →",
  try_critique_loading: "Channeling reviewer-2 brutality… (~15s)",
  try_cta_more: "Want DeepCritique on these? Tournament ranking? Full paper writeup?",
  try_cta_plans: "See plans →",

  pricing_title_a: "Pricing for",
  pricing_title_b: "researchers",
  pricing_subtitle: "Start free. Upgrade when you ship your first paper. Cancel anytime.",
  pricing_annual_note: "Annual billing saves about 15%. Need more credits or seats?",
  pricing_contact: "Contact us",
  faq_title: "Frequently asked",

  signup_eyebrow: "WAITLIST · LAUNCHING WHEN WE HIT 100",
  signup_title_a: "Get on the",
  signup_title_b: "waitlist",
  signup_desc: "First 10 signups get 90 days of Scholar free in exchange for a testimonial. Launching when 100 are in.",
  signup_email_label: "Email",
  signup_context_label: "What would you use arxify for? (optional)",
  signup_source_label: "How did you find us? (optional)",
  signup_submit: "Reserve my spot →",
  signup_submit_loading: "Joining…",
  signup_disclaimer: "We'll email you the moment beta opens. Cancel anytime; no card on file.",
  signup_success_title: "You're #X on the list.",
  signup_success_will_email: "We'll email when beta opens",
  signup_to_dashboard: "Go to dashboard →",
  signup_try_demo: "Try the demo",
  signup_share_x: "Share on X",

  login_eyebrow: "ALREADY IN",
  login_title: "Log in",
  login_desc: "Paste the token you got at signup. Email magic-link will arrive at beta.",
  login_token_label: "Token",
  login_token_placeholder: "e.g. 2O7Ej86H2k6XLmtJVb-m5w",
  login_submit: "Enter dashboard →",
  login_alt: "No token yet?",
  login_alt_link: "Join the waitlist",

  dash_tab_chat: "💬 Chat",
  dash_tab_hyps: "📋 Hypotheses",
  dash_tab_data: "🗄️ Data sources",
  dash_tab_queue: "📬 Waitlist",
  dash_chat_empty: "Ask anything about your directions, data sources, or advisor strategy.",
  dash_chat_placeholder: "e.g. D8 vs D14 which is cleaner? ⌘+Enter to send",
  dash_chat_send: "Send",

  ppt_back: "← back",
  ppt_regenerate: "↻ regenerate",
  ppt_expand_eyebrow: "⚡ EXPAND TO PPT",
  ppt_expand_desc: "Hunter's proposal framework. 13 sections: one-line question / why top-tier / why Solvea-exclusive / design / outcomes / hypotheses / sample power / cost / journals / theory / risks / 3 advisor pitches.",
  ppt_generate: "Generate full proposal →",
  ppt_generating: "Generating (~30s)…",
  ppt_nav_hint: "← → space to navigate · Esc to exit · 0-9 to jump",

  dash_tab_advisor: "💬 AI Advisor",
  dash_chat_thinking: "thinking…",
  dash_chat_advisor_label: "ai advisor · claude",
  dash_more: "+ more",
  dash_less: "− less",
  dash_view_ppt: "view ppt →",
  dash_expand_ppt: "expand to ppt →",
  dash_row_hypothesis: "Hypothesis",
  dash_row_identification: "Identification",
  dash_row_theory: "Theory anchor",
  dash_row_notes: "Notes",
  dash_feas: "FEAS",
  dash_ab: "A/B",
  dash_in_line_a: "You're #",
  dash_in_line_b: " in line.",
  queue_launch_progress: "Launch progress",
  queue_more_to_launch: "{n} more to launch.",
  queue_hit_target: "🎉 We hit target. Beta opening this week.",
  queue_signup_info: "Your signup info",
  queue_position: "Position",
  queue_email: "Email",
  queue_joined: "Joined",
  queue_source: "Source",
  queue_refer: "Refer friends",
  queue_referred: "Referred: ",
  queue_copy: "Copy",
  queue_copied: "Copied!",
  notoken_title_a: "You're not ",
  notoken_title_em: "in",
  notoken_desc: "Either you haven't joined yet, or you're on a different device.",
  notoken_login: "Log in",
  notoken_join: "Join waitlist →",
  ppt_404: "404 · NOT FOUND",
  ppt_not_exist: "Hypothesis {code} doesn't exist",
  ppt_load_fail: "Couldn't load this hypothesis",
  ppt_back_dash: "← Back to dashboard",
  ppt_loading_proposal: "Loading proposal…",
  ppt_prev: "← Prev",
  ppt_next: "Next →",
  ppt_slide_question: "ONE-LINE QUESTION",
  ppt_h_why_top: "Why this lands at top-tier journals",
  ppt_h_why_solvea: "Why only Solvea can answer this",
  ppt_design: "EXPERIMENT DESIGN",
  ppt_outcomes: "Outcome Variables",
  ppt_h_outcomes: "What we measure",
  ppt_primary: "Primary",
  ppt_secondary: "Secondary",
  ppt_mediators: "Mediators",
  ppt_rand_unit: "Randomization unit",
  ppt_duration: "Duration",
  ppt_logic: "Logic",
  ppt_treatment_arms: "Treatment arms",
  ppt_identification: "Identification",
  ppt_pre_registered: "PRE-REGISTERED",
  ppt_hypotheses: "Hypotheses",
  ppt_sample_power: "Sample Size & Power",
  ppt_h_sample: "How big? How long?",
  ppt_per_arm: "Per arm",
  ppt_total_n: "Total N",
  ppt_power: "Power",
  ppt_mde: "MDE",
  ppt_weeks_collect: "Weeks to collect",
  ppt_implementation: "IMPLEMENTATION",
  ppt_h_impl: "Cost & timeline",
  ppt_engineering: "Engineering",
  ppt_compute_cost: "Compute cost",
  ppt_ops_needed: "Ops needed",
  ppt_ops_steps: "Ops Steps",
  ppt_dependencies: "Dependencies",
  ppt_journals: "JOURNAL TARGETS",
  ppt_h_journals: "Where this lands",
  ppt_theory_anchors: "THEORY ANCHORS",
  ppt_h_theory: "Literature framework",
  ppt_risks: "RISKS",
  ppt_h_risks: "What could kill this",
  ppt_mitigation: "Mitigation: ",
  ppt_pitches: "ELEVATOR PITCHES",
  ppt_h_pitches: "30-second pitch for each advisor",
  ppt_weeks_unit: " weeks",

  loading: "Loading…",
};

const ja: Dict = {
  nav_try: "無料で試す",
  nav_pricing: "料金",
  nav_github: "GitHub",
  nav_signup: "ウェイトリスト",
  nav_login: "ログイン",
  nav_dashboard: "ダッシュボード",

  hero_eyebrow: "VOL. 01 · オープンソース AI-RESEARCHER をベースに",
  hero_title_a: "アイデアから",
  hero_title_idea: "アイデア",
  hero_title_b: "へ",
  hero_title_paper: "論文",
  hero_desc: "アイデアやデータを入力すれば、研究計画、実験設計、論文ドラフトが得られます。SakanaAI AI-Scientist-v2 + MiroMind MiroThinker ベース。",
  hero_cta_start: "無料で始める →",
  hero_cta_pricing: "料金を見る",
  hero_perks: ["⚡ 15 分で 5 案", "🔬 厳しい査読", "📄 LaTeX + PDF 出力", "🔐 学習に使わない"],

  how_eyebrow: "ワークフロー",
  how_title: "仕組み",
  how_subtitle: "4 ステップ、半日で。",
  how_steps: [
    { n: "01", title: "入力", desc: "アイデアの貼り付け、PDF 提案のアップロード、CSV データのドロップ。" },
    { n: "02", title: "計画", desc: "5 つの候補方向 + DeepCritique 査読 + トーナメント順位付け。" },
    { n: "03", title: "データ", desc: "実験結果をアップロードし、計画と紐付け。" },
    { n: "04", title: "論文", desc: "LaTeX + PDF ドラフト。指導教員に渡せる完成度。" },
  ],

  testimonial_quote: "HKU DBA 博士論文のテーマ選定に使用。17 個の候補方向、厳しい査読、3 人の指導教員への自動メール。3 日、1 人で。",
  testimonial_author: "— Hunter, HKU DBA 候補者 · 最初の有料ユーザー",

  oss_title: "オープンソースをベースに",
  oss_desc: "コアパイプラインは MIT ライセンスで GitHub に公開。ローカルで無料で動かせます。",
  oss_cta: "github.com/mguozhen/ai-researcher →",

  try_eyebrow: "試用 · 登録不要、1 訪問あたり 1 回無料",
  try_title_a: "研究の",
  try_title_b: "コンテキスト",
  try_desc: "研究背景、既存データ、提案スケッチを貼り付けてください。約 30 秒で 5 つの候補方向 (paradox + 識別戦略 + ジャーナル適合) が得られます。",
  try_label: "研究コンテキスト",
  try_placeholder: "例：私は博士課程の学生で…",
  try_example_btn: "サンプルで試す",
  try_submit: "5 つの方向を生成 →",
  try_thinking: "思考中… (~30 秒)",
  try_error_short: "研究コンテキストの説明は 20 文字以上必要です。",
  try_critique_btn: "⚡ Reviewer 2 査読 →",
  try_critique_loading: "Reviewer 2 召喚中… (~15 秒)",
  try_cta_more: "DeepCritique？トーナメント順位？論文ドラフト？",
  try_cta_plans: "プランを見る →",

  pricing_title_a: "研究者向け",
  pricing_title_b: "料金",
  pricing_subtitle: "無料で開始。最初の論文を出すときにアップグレード。いつでも解約可。",
  pricing_annual_note: "年払いで約 15% 節約。クレジットや席数の追加が必要な場合は",
  pricing_contact: "お問い合わせ",
  faq_title: "よくある質問",

  signup_eyebrow: "ウェイトリスト · 100 人到達時にローンチ",
  signup_title_a: "ウェイトリストに",
  signup_title_b: "参加",
  signup_desc: "最初の 10 名は Scholar プラン 90 日無料（証言と引き換え）。100 名到達時に開放。",
  signup_email_label: "メールアドレス",
  signup_context_label: "arxify をどう使いますか？（任意）",
  signup_source_label: "どこで知りましたか？（任意）",
  signup_submit: "参加する →",
  signup_submit_loading: "参加中…",
  signup_disclaimer: "ベータ開放時にメール通知。いつでも取り消し可。カード登録不要。",
  signup_success_title: "あなたは # 番目。",
  signup_success_will_email: "ベータ開放時に通知します",
  signup_to_dashboard: "ダッシュボードへ →",
  signup_try_demo: "デモを試す",
  signup_share_x: "X でシェア",

  login_eyebrow: "登録済みの方",
  login_title: "ログイン",
  login_desc: "Signup 時に受け取った token を貼り付けてください。",
  login_token_label: "Token",
  login_token_placeholder: "例：2O7Ej86H2k6XLmtJVb-m5w",
  login_submit: "ダッシュボードへ →",
  login_alt: "Token がない？",
  login_alt_link: "ウェイトリストに参加",

  dash_tab_chat: "💬 チャット",
  dash_tab_hyps: "📋 仮説",
  dash_tab_data: "🗄️ データソース",
  dash_tab_queue: "📬 ウェイトリスト",
  dash_chat_empty: "方向性、データ、指導教員戦略について質問できます。",
  dash_chat_placeholder: "例：D8 vs D14 はどちらが安定？ ⌘+Enter で送信",
  dash_chat_send: "送信",

  ppt_back: "← 戻る",
  ppt_regenerate: "↻ 再生成",
  ppt_expand_eyebrow: "⚡ PPT に展開",
  ppt_expand_desc: "Hunter の開題報告フレームワーク。13 セクション。",
  ppt_generate: "提案を生成 →",
  ppt_generating: "生成中 (~30 秒)…",
  ppt_nav_hint: "← → スペースで移動 · Esc で終了 · 0-9 でジャンプ",

  dash_tab_advisor: "💬 AI Advisor",
  dash_chat_thinking: "thinking…",
  dash_chat_advisor_label: "ai advisor · claude",
  dash_more: "+ more",
  dash_less: "− less",
  dash_view_ppt: "view ppt →",
  dash_expand_ppt: "expand to ppt →",
  dash_row_hypothesis: "Hypothesis",
  dash_row_identification: "Identification",
  dash_row_theory: "Theory anchor",
  dash_row_notes: "Notes",
  dash_feas: "FEAS",
  dash_ab: "A/B",
  dash_in_line_a: "You're #",
  dash_in_line_b: " in line.",
  queue_launch_progress: "Launch progress",
  queue_more_to_launch: "{n} more to launch.",
  queue_hit_target: "🎉 We hit target. Beta opening this week.",
  queue_signup_info: "Your signup info",
  queue_position: "Position",
  queue_email: "Email",
  queue_joined: "Joined",
  queue_source: "Source",
  queue_refer: "Refer friends",
  queue_referred: "Referred: ",
  queue_copy: "Copy",
  queue_copied: "Copied!",
  notoken_title_a: "You're not ",
  notoken_title_em: "in",
  notoken_desc: "Either you haven't joined yet, or you're on a different device.",
  notoken_login: "Log in",
  notoken_join: "Join waitlist →",
  ppt_404: "404 · NOT FOUND",
  ppt_not_exist: "Hypothesis {code} doesn't exist",
  ppt_load_fail: "Couldn't load this hypothesis",
  ppt_back_dash: "← Back to dashboard",
  ppt_loading_proposal: "Loading proposal…",
  ppt_prev: "← Prev",
  ppt_next: "Next →",
  ppt_slide_question: "ONE-LINE QUESTION",
  ppt_h_why_top: "Why this lands at top-tier journals",
  ppt_h_why_solvea: "Why only Solvea can answer this",
  ppt_design: "EXPERIMENT DESIGN",
  ppt_outcomes: "Outcome Variables",
  ppt_h_outcomes: "What we measure",
  ppt_primary: "Primary",
  ppt_secondary: "Secondary",
  ppt_mediators: "Mediators",
  ppt_rand_unit: "Randomization unit",
  ppt_duration: "Duration",
  ppt_logic: "Logic",
  ppt_treatment_arms: "Treatment arms",
  ppt_identification: "Identification",
  ppt_pre_registered: "PRE-REGISTERED",
  ppt_hypotheses: "Hypotheses",
  ppt_sample_power: "Sample Size & Power",
  ppt_h_sample: "How big? How long?",
  ppt_per_arm: "Per arm",
  ppt_total_n: "Total N",
  ppt_power: "Power",
  ppt_mde: "MDE",
  ppt_weeks_collect: "Weeks to collect",
  ppt_implementation: "IMPLEMENTATION",
  ppt_h_impl: "Cost & timeline",
  ppt_engineering: "Engineering",
  ppt_compute_cost: "Compute cost",
  ppt_ops_needed: "Ops needed",
  ppt_ops_steps: "Ops Steps",
  ppt_dependencies: "Dependencies",
  ppt_journals: "JOURNAL TARGETS",
  ppt_h_journals: "Where this lands",
  ppt_theory_anchors: "THEORY ANCHORS",
  ppt_h_theory: "Literature framework",
  ppt_risks: "RISKS",
  ppt_h_risks: "What could kill this",
  ppt_mitigation: "Mitigation: ",
  ppt_pitches: "ELEVATOR PITCHES",
  ppt_h_pitches: "30-second pitch for each advisor",
  ppt_weeks_unit: " weeks",

  loading: "読み込み中…",
};

const es: Dict = {
  nav_try: "Prueba gratis",
  nav_pricing: "Precios",
  nav_github: "GitHub",
  nav_signup: "Lista de espera",
  nav_login: "Entrar",
  nav_dashboard: "Panel",

  hero_eyebrow: "VOL. 01 · CONSTRUIDO SOBRE AI-RESEARCHER OPEN SOURCE",
  hero_title_a: "De",
  hero_title_idea: "idea",
  hero_title_b: "a",
  hero_title_paper: "paper",
  hero_desc: "Pega tu idea o datos. Obtén plan de investigación, diseño experimental y borrador completo. Basado en SakanaAI AI-Scientist-v2 + MiroMind MiroThinker.",
  hero_cta_start: "Comenzar gratis →",
  hero_cta_pricing: "Ver precios",
  hero_perks: ["⚡ 5 ideas en 15 min", "🔬 Revisión brutal", "📄 LaTeX + PDF", "🔐 Sin entrenar con tus datos"],

  how_eyebrow: "Flujo",
  how_title: "Cómo funciona",
  how_subtitle: "Cuatro pasos, una tarde.",
  how_steps: [
    { n: "01", title: "Entrada", desc: "Pega tu idea, sube un PDF, o un CSV de datos." },
    { n: "02", title: "Plan", desc: "5 direcciones candidatas + DeepCritique + torneo de ranking." },
    { n: "03", title: "Datos", desc: "Sube resultados experimentales. Los mapeamos al plan elegido." },
    { n: "04", title: "Paper", desc: "Borrador LaTeX + PDF listo para tu director o submission." },
  ],

  testimonial_quote: "Lo usé para elegir el tema de mi tesis HKU DBA. 17 direcciones candidatas, revisión brutal, email automático a tres directores. Tres días, una persona.",
  testimonial_author: "— Hunter, candidato HKU DBA · primer cliente de pago",

  oss_title: "Construido sobre open source",
  oss_desc: "El núcleo está bajo MIT en GitHub. Córrelo local gratis. Nosotros solo lo hacemos fácil.",
  oss_cta: "github.com/mguozhen/ai-researcher →",

  try_eyebrow: "PRUEBA · SIN REGISTRO, UNA RONDA GRATIS POR VISITA",
  try_title_a: "Pega tu",
  try_title_b: "contexto",
  try_desc: "Pega tu antecedente de investigación, datos existentes o boceto de propuesta. ~30s para 5 direcciones con paradox + identificación + revista objetivo.",
  try_label: "Tu contexto de investigación",
  try_placeholder: "p.ej. soy candidato a PhD estudiando…",
  try_example_btn: "Probar con ejemplo",
  try_submit: "Generar 5 direcciones →",
  try_thinking: "Pensando… (~30s)",
  try_error_short: "Mínimo 20 caracteres describiendo el contexto.",
  try_critique_btn: "⚡ Pedir crítica reviewer-2 →",
  try_critique_loading: "Convocando brutalidad reviewer-2… (~15s)",
  try_cta_more: "¿Quieres DeepCritique? ¿Ranking torneo? ¿Borrador completo?",
  try_cta_plans: "Ver planes →",

  pricing_title_a: "Precios para",
  pricing_title_b: "investigadores",
  pricing_subtitle: "Empieza gratis. Sube cuando saques tu primer paper. Cancela cuando quieras.",
  pricing_annual_note: "Anual ahorra ~15%. ¿Necesitas más créditos o asientos?",
  pricing_contact: "Contáctanos",
  faq_title: "Preguntas frecuentes",

  signup_eyebrow: "LISTA DE ESPERA · LANZAMIENTO AL LLEGAR A 100",
  signup_title_a: "Únete a la",
  signup_title_b: "lista",
  signup_desc: "Los primeros 10 obtienen 90 días gratis de Scholar a cambio de un testimonio. Lanzamos al llegar a 100.",
  signup_email_label: "Email",
  signup_context_label: "¿Para qué usarías arxify? (opcional)",
  signup_source_label: "¿Cómo nos encontraste? (opcional)",
  signup_submit: "Reservar mi lugar →",
  signup_submit_loading: "Uniéndome…",
  signup_disclaimer: "Te avisamos al abrir beta. Cancela cuando quieras; sin tarjeta.",
  signup_success_title: "Eres el #X de la lista.",
  signup_success_will_email: "Avisamos al abrir beta",
  signup_to_dashboard: "Ir al panel →",
  signup_try_demo: "Probar demo",
  signup_share_x: "Compartir en X",

  login_eyebrow: "YA REGISTRADO",
  login_title: "Entrar",
  login_desc: "Pega el token que recibiste al registrarte.",
  login_token_label: "Token",
  login_token_placeholder: "p.ej. 2O7Ej86H2k6XLmtJVb-m5w",
  login_submit: "Entrar al panel →",
  login_alt: "¿Sin token?",
  login_alt_link: "Únete a la lista",

  dash_tab_chat: "💬 Chat",
  dash_tab_hyps: "📋 Hipótesis",
  dash_tab_data: "🗄️ Datos",
  dash_tab_queue: "📬 Lista",
  dash_chat_empty: "Pregunta sobre direcciones, datos o estrategia con directores.",
  dash_chat_placeholder: "p.ej. ¿D8 vs D14 cuál es más limpio? ⌘+Enter para enviar",
  dash_chat_send: "Enviar",

  ppt_back: "← atrás",
  ppt_regenerate: "↻ regenerar",
  ppt_expand_eyebrow: "⚡ EXPANDIR A PPT",
  ppt_expand_desc: "Marco de propuesta de Hunter. 13 secciones.",
  ppt_generate: "Generar propuesta completa →",
  ppt_generating: "Generando (~30s)…",
  ppt_nav_hint: "← → espacio para navegar · Esc para salir · 0-9 para saltar",

  dash_tab_advisor: "💬 AI Advisor",
  dash_chat_thinking: "thinking…",
  dash_chat_advisor_label: "ai advisor · claude",
  dash_more: "+ more",
  dash_less: "− less",
  dash_view_ppt: "view ppt →",
  dash_expand_ppt: "expand to ppt →",
  dash_row_hypothesis: "Hypothesis",
  dash_row_identification: "Identification",
  dash_row_theory: "Theory anchor",
  dash_row_notes: "Notes",
  dash_feas: "FEAS",
  dash_ab: "A/B",
  dash_in_line_a: "You're #",
  dash_in_line_b: " in line.",
  queue_launch_progress: "Launch progress",
  queue_more_to_launch: "{n} more to launch.",
  queue_hit_target: "🎉 We hit target. Beta opening this week.",
  queue_signup_info: "Your signup info",
  queue_position: "Position",
  queue_email: "Email",
  queue_joined: "Joined",
  queue_source: "Source",
  queue_refer: "Refer friends",
  queue_referred: "Referred: ",
  queue_copy: "Copy",
  queue_copied: "Copied!",
  notoken_title_a: "You're not ",
  notoken_title_em: "in",
  notoken_desc: "Either you haven't joined yet, or you're on a different device.",
  notoken_login: "Log in",
  notoken_join: "Join waitlist →",
  ppt_404: "404 · NOT FOUND",
  ppt_not_exist: "Hypothesis {code} doesn't exist",
  ppt_load_fail: "Couldn't load this hypothesis",
  ppt_back_dash: "← Back to dashboard",
  ppt_loading_proposal: "Loading proposal…",
  ppt_prev: "← Prev",
  ppt_next: "Next →",
  ppt_slide_question: "ONE-LINE QUESTION",
  ppt_h_why_top: "Why this lands at top-tier journals",
  ppt_h_why_solvea: "Why only Solvea can answer this",
  ppt_design: "EXPERIMENT DESIGN",
  ppt_outcomes: "Outcome Variables",
  ppt_h_outcomes: "What we measure",
  ppt_primary: "Primary",
  ppt_secondary: "Secondary",
  ppt_mediators: "Mediators",
  ppt_rand_unit: "Randomization unit",
  ppt_duration: "Duration",
  ppt_logic: "Logic",
  ppt_treatment_arms: "Treatment arms",
  ppt_identification: "Identification",
  ppt_pre_registered: "PRE-REGISTERED",
  ppt_hypotheses: "Hypotheses",
  ppt_sample_power: "Sample Size & Power",
  ppt_h_sample: "How big? How long?",
  ppt_per_arm: "Per arm",
  ppt_total_n: "Total N",
  ppt_power: "Power",
  ppt_mde: "MDE",
  ppt_weeks_collect: "Weeks to collect",
  ppt_implementation: "IMPLEMENTATION",
  ppt_h_impl: "Cost & timeline",
  ppt_engineering: "Engineering",
  ppt_compute_cost: "Compute cost",
  ppt_ops_needed: "Ops needed",
  ppt_ops_steps: "Ops Steps",
  ppt_dependencies: "Dependencies",
  ppt_journals: "JOURNAL TARGETS",
  ppt_h_journals: "Where this lands",
  ppt_theory_anchors: "THEORY ANCHORS",
  ppt_h_theory: "Literature framework",
  ppt_risks: "RISKS",
  ppt_h_risks: "What could kill this",
  ppt_mitigation: "Mitigation: ",
  ppt_pitches: "ELEVATOR PITCHES",
  ppt_h_pitches: "30-second pitch for each advisor",
  ppt_weeks_unit: " weeks",

  loading: "Cargando…",
};

const dicts: Record<Locale, Dict> = { zh, en, ja, es };

export function getDict(locale: Locale): Dict {
  return dicts[locale] || dicts.zh;
}

// Pick a bilingual content field for a hypothesis row. The API returns
// `content_zh` / `content_en` blobs (from the DB content_i18n column); when
// absent we fall back to the raw top-level field so nothing blanks out.
export function pickField(
  h: { content_zh?: Record<string, string> | null; content_en?: Record<string, string> | null; [k: string]: any },
  locale: Locale,
  key: string,
): string {
  const loc = locale === "en" ? h.content_en : h.content_zh;
  return (loc && loc[key]) || h[key] || "";
}
