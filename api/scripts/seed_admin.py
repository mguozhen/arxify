"""Seed admin account + Hunter's HKU DBA dissertation workspace.

Run once locally:
    cd /Users/hunter/arxify
    ./api/venv/bin/python -m api.scripts.seed_admin

Idempotent — re-running updates the workspace if email already exists.
"""
from __future__ import annotations

import json
import secrets

from api.utils.db import conn

ADMIN_EMAIL = "mguozhen@gmail.com"
ADMIN_NAME = "Hunter (郭振) · HKU DBA"

WORKSPACE_TITLE = "HKU DBA Dissertation — LLM Customer Service"
WORKSPACE_DESC = (
    "Hunter's HKU DBA dissertation workspace. 11-database Solvea/VOC.ai "
    "production data lake (1.9B conversations, 8.7M handoff events, Jan 2024–). "
    "Target answer: Nov 2026."
)


# 17 research directions accumulated across our sessions
HYPOTHESES = [
    # H3 already published
    {
        "code": "H3",
        "title": "The Handoff Agency Paradox",
        "paradox": "AI 自主转人工是诚信信号，系统强转无效果 — 同样的转人工事件，自主决定的客户 NPS 高 2.7 分",
        "hypothesis": "Customer feedback after AI→human handoff depends on WHO initiated the handoff, not the handoff itself. AI-self-initiated handoffs signal 'AI knows its limits' (separating equilibrium); system-rule-triggered handoffs carry no information.",
        "identification": "Multi-tenant FE regression + Kamenica-Gentzkow Bayesian persuasion framing. 330K handoff events.",
        "theory_anchor": "Kim et al. (2024) verbalized uncertainty / Kamenica-Gentzkow (2011) Bayesian persuasion",
        "journal_target": "Mark Sci",
        "feasibility_6mo": 5,
        "ab_test_difficulty": 3,
        "status": "main",
        "notes": "已完稿 v2. Chapter 0 of dissertation.",
    },
    {
        "code": "D1",
        "title": "Engagement Fatigue Paradox",
        "paradox": "Visit-1 fb=3.99 → visit 4-5 fb=2.44 (跌 40%). 客户越用 AI 越烦",
        "hypothesis": "Customer satisfaction with AI customer service declines across repeat visits because customers' expectation of 'AI remembers me' grows faster than AI's actual continuity.",
        "identification": "lead × time panel FE + Heckman attrition correction + tenant model upgrade as IV",
        "theory_anchor": "Oliver (1980) expectation-disconfirmation × Bendapudi-Leone (2003) co-production",
        "journal_target": "JM",
        "feasibility_6mo": 5,
        "ab_test_difficulty": 2,
        "status": "shortlisted",
        "notes": "A/B 设计: lead-visit-level Memory vs No-Memory injection",
    },
    {
        "code": "D5",
        "title": "TARS Migration as Natural Experiment",
        "paradox": "27.8 万工单从老系统 cactus 迁到新系统 tars — 同 tenant 同客户 pre-post 比较",
        "hypothesis": "AI customer service system migration causally improves resolve_duration and handoff_rate independent of tenant heterogeneity.",
        "identification": "Staggered DID (Callaway-Sant'Anna 2021) + tenant FE + cohort×month FE",
        "theory_anchor": "Tsai-Tan (2017) service system replacement / 周黎安制度替换框架",
        "journal_target": "MISQ",
        "feasibility_6mo": 3,
        "ab_test_difficulty": 5,
        "status": "shortlisted",
        "notes": "需要业务方提供迁移政策时间线",
    },
    {
        "code": "D8",
        "title": "Follow-up Signal Paradox ⭐",
        "paradox": "Auto follow-up 发到第 3-4 条客户开始反感. 拐点之后回复率反跌、投诉飙升",
        "hypothesis": "Automated follow-up has inverted-U effect on reply rate. Below threshold = positive signal; above threshold = noise/spam.",
        "identification": "Ticket-level 5-arm RCT (1/2/3/4 follow-ups) + platform policy change DID",
        "theory_anchor": "Green-Swets signal detection / Spence (1973) signaling",
        "journal_target": "Mgmt Sci",
        "feasibility_6mo": 5,
        "ab_test_difficulty": 1,
        "status": "main",
        "notes": "Hunter's推荐主篇. 1.6M 行 multiple_follow_ups 数据现成.",
    },
    {
        "code": "D11",
        "title": "AI Humility Paradox",
        "paradox": "AI 说'我不太确定但可能是 X'反而比 100% 笃定回答更被信任",
        "hypothesis": "AI verbalized uncertainty (hedging language) increases customer trust vs confident assertions of equal correctness.",
        "identification": "LLM system prompt A/B (3 hedging levels) × confidence score",
        "theory_anchor": "Kim et al. (2024) FAccT, verbalized uncertainty",
        "journal_target": "JM",
        "feasibility_6mo": 5,
        "ab_test_difficulty": 1,
        "status": "main",
        "notes": "与 H3 同源 (诚信信号家族). 主推副篇.",
    },
    {
        "code": "D12",
        "title": "Faked Thinking Paradox",
        "paradox": "AI 秒回让客户觉得敷衍; 故意慢 5 秒 + '正在思考...'反而觉得专业",
        "hypothesis": "Customer-perceived AI quality follows inverted-U over response delay. 0s and 15s both worse than ~5-8s + visible 'thinking' process.",
        "identification": "Front-end timer A/B with 4 arms (instant / 5s blank / 5s process-shown / 15s process-shown)",
        "theory_anchor": "Buell & Norton (2011) Operational Transparency, HBS",
        "journal_target": "Mgmt Sci",
        "feasibility_6mo": 5,
        "ab_test_difficulty": 1,
        "status": "candidate",
        "notes": "纯前端工程, 1-2 天可上线 A/B",
    },
    {
        "code": "D13",
        "title": "Compensation Attribution Paradox",
        "paradox": "同样 10 元优惠券, AI 自动派 vs 人工特批客户心理价值差异显著",
        "hypothesis": "Identical monetary compensation has different psychological value depending on attributed source (AI automatic vs human discretionary).",
        "identification": "Promo voucher A/B with framing manipulation (实际逻辑相同, 只改文案归因)",
        "theory_anchor": "Spence (1973) signaling × Heider attribution theory",
        "journal_target": "Mark Sci",
        "feasibility_6mo": 4,
        "ab_test_difficulty": 2,
        "status": "candidate",
        "notes": "蔡靖喜欢的 RCT 风格",
    },
    {
        "code": "D14",
        "title": "AI-Human Detection Mismatch Paradox",
        "paradox": "被 AI 标记的工单, 人工修复效果反而比未标记的相同严重度工单更差",
        "hypothesis": "Algorithmic flagging triggers diagnostic overshadowing in human agents — they reduce their own diagnostic effort because 'AI already saw the problem'.",
        "identification": "PSM matching of flagged vs unflagged at same severity + DID around flag-threshold changes",
        "theory_anchor": "Automation bias / diagnostic overshadowing (medical IT literature)",
        "journal_target": "MISQ",
        "feasibility_6mo": 4,
        "ab_test_difficulty": 3,
        "status": "candidate",
        "notes": "AI-Scientist-v2 + MiroThinker 跑出来的方向 (D14 family)",
    },
    {
        "code": "D15",
        "title": "Frictionless Recovery Paradox",
        "paradox": "AI 秒处理投诉 → 即时满意度高 + 长期续约率反而低 (短长期分叉)",
        "hypothesis": "Immediate-satisfaction and long-term-retention diverge for service recovery. Frictionless recovery wins short-term, frictional recovery wins long-term.",
        "identification": "RCT on complaint tickets (instant AI vs delayed human-checked) + 90-day retention follow-up",
        "theory_anchor": "Effort-justification (Festinger) + Customer Journey Memory",
        "journal_target": "JCR",
        "feasibility_6mo": 3,
        "ab_test_difficulty": 2,
        "status": "candidate",
        "notes": "需要 90 天 follow-up",
    },
    {
        "code": "D16",
        "title": "Moral Distance Paradox",
        "paradox": "AI 道歉后再人工道歉, 反而稀释道歉信号; 仅人道歉效果更好",
        "hypothesis": "Apology signal value follows speaker cost. AI apology is 'cheap signal' that crowds out subsequent human apology effectiveness.",
        "identification": "3-arm RCT on apology source (double / human-only / AI-only) × complaint severity",
        "theory_anchor": "Moral economics × Algorithmic governance",
        "journal_target": "JCR / Org Sci",
        "feasibility_6mo": 3,
        "ab_test_difficulty": 2,
        "status": "candidate",
        "notes": "Trilogy chapter 4 候选",
    },
    {
        "code": "D17",
        "title": "Recovery-Legitimacy Paradox",
        "paradox": "显性人工恢复 → 显得平台越无能 → 侵蚀算法合法性",
        "hypothesis": "Visible human override after AI failure erodes tenant-level NPS even when the override is technically correct.",
        "identification": "Tenant-level NPS regression on human-override-visibility × baseline AI quality",
        "theory_anchor": "Suchman (1995) organizational legitimacy × Wirtz et al (2018) algorithmic authority",
        "journal_target": "Org Sci",
        "feasibility_6mo": 3,
        "ab_test_difficulty": 4,
        "status": "future",
        "notes": "理论上耀眼但 A/B 难做",
    },
    {
        "code": "D18",
        "title": "Delegated Accountability Paradox",
        "paradox": "AI + 人工双层流程, 反而比纯人工质量低 — 双方都不真正担责",
        "hypothesis": "Diffusion of responsibility (Latane-Darley 1968) operates in human-AI workflows: bothresponsibility-attribution paths reduce diagnostic effort.",
        "identification": "Quasi-experiment around tenant adopting two-tier (AI→human) vs one-tier (human only) workflows",
        "theory_anchor": "Latane-Darley (1968) bystander / diffusion of responsibility",
        "journal_target": "Org Sci",
        "feasibility_6mo": 3,
        "ab_test_difficulty": 3,
        "status": "future",
    },
    {
        "code": "D19",
        "title": "Algorithmic Escalation Paradox",
        "paradox": "AI 触发升级的工单, agent 视为'AI 烦我'而非'客户问题', 处理质量下降",
        "hypothesis": "Human agent response quality depends on perceived trigger source. AI-triggered escalation perceived as algorithmic interruption; customer-triggered escalation perceived as legitimate request.",
        "identification": "Compare AI-flag-triggered vs customer-insistence-triggered escalations matched on issue severity",
        "theory_anchor": "Bailey-Barley (2020) algorithmic pushback / frame hijacking",
        "journal_target": "MISQ",
        "feasibility_6mo": 4,
        "ab_test_difficulty": 3,
        "status": "future",
    },
    {
        "code": "D20",
        "title": "AI Recovery Substitution Paradox",
        "paradox": "AI 失败创造的人工修复机会, 比人工自己制造的失败的修复效果更好 +18% NPS",
        "hypothesis": "Customers anchor recovery expectations to AI's perceived agency. Human recovery from AI failure 'over-attributed' positive.",
        "identification": "PSM on similar-severity AI-induced vs human-induced failures + post-recovery NPS DID",
        "theory_anchor": "Service recovery paradox (McCollough-Bharadwaj 1992) — boundary condition under AI failure attribution",
        "journal_target": "JM",
        "feasibility_6mo": 4,
        "ab_test_difficulty": 3,
        "status": "candidate",
        "notes": "AI-Scientist-v2 直接生成方向",
    },
    {
        "code": "D21",
        "title": "Algorithmic Commoning Paradox",
        "paradox": "早期高量 tenant 给晚期 tenant 提供 AI 学习外溢, 后者免费搭车却也丧失差异化",
        "hypothesis": "Cross-tenant learning spillovers in multi-tenant LLM platforms reduce competitive differentiation among late adopters.",
        "identification": "Tenant×cohort panel FE with shared-model knowledge accumulation as cross-tenant IV",
        "theory_anchor": "IT capital theory (Bharadwaj 2000) — multi-tenant edge case",
        "journal_target": "MISQ",
        "feasibility_6mo": 2,
        "ab_test_difficulty": 5,
        "status": "future",
    },
    {
        "code": "D22",
        "title": "AI Congestion Paradox",
        "paradox": "AI 智能升级反而制造人工瓶颈 — 集中升级时点超过人工容量",
        "hypothesis": "AI handoff routing creates endogenous queueing congestion at human agent layer, worse than uniform random escalation.",
        "identification": "Time-series of handoff burst events × wait time × resolution quality",
        "theory_anchor": "Queueing theory / endogenous arrival process",
        "journal_target": "Mgmt Sci (POM)",
        "feasibility_6mo": 3,
        "ab_test_difficulty": 4,
        "status": "future",
    },
    {
        "code": "D24",
        "title": "Emotional Labor Intensification Paradox",
        "paradox": "AI 替代轻松工单 → 人工只剩情绪密集工单 → AHT 上 9% + 后半 shift 拒绝率飙升",
        "hypothesis": "AI deployment concentrates emotionally demanding interactions on human agents, increasing within-shift performance degradation despite reducing transaction volume.",
        "identification": "Agent-shift-level panel + DID around tenant AI adoption + cumulative emotional exposure",
        "theory_anchor": "Hochschild (1983) emotional labor / Demerouti-Bakker JD-R",
        "journal_target": "Org Sci",
        "feasibility_6mo": 4,
        "ab_test_difficulty": 4,
        "status": "candidate",
    },
]


DATA_SOURCES = [
    {
        "name": "cactus_prod",
        "kind": "mysql",
        "description": "老工单系统 + 客服核心数据",
        "stats": "322 表 / 1.9B 行 / 4 TB. tickets / livechat_reports / general_survey_responses / promo_codes / ai_request_logs / escalation_cases",
        "notes": "主用 transcript、handoff、NPS、 promo 数据",
    },
    {
        "name": "shulex_gpt_prod",
        "kind": "mysql",
        "description": "BOT / LLM 客服系统",
        "stats": "106 表 / 69M 行 / 220 GB. transcript 14M / token 980K / multiple_follow_ups 1.6M / persona / chat_flow_graph / sop / outbound",
        "notes": "D8 主数据 (multiple_follow_ups). voice_transcript 9.3K 通话 (D2)",
    },
    {
        "name": "shulex_qam_prod",
        "kind": "mysql",
        "description": "QAM 知识库",
        "stats": "30 表 / 81M 行 / 43 GB. ku_history 73M (知识库版本演化) / learn_chat / daily_cluster_record / question_ticket",
        "notes": "D7 Knowledge Drift Paradox 主数据",
    },
    {
        "name": "tars_prod_app",
        "kind": "mysql",
        "description": "新一代工单系统 (cactus 继任者)",
        "stats": "94 表 / 329M 行 / 237 GB. dwd_ticket_info 506K (含 resolve_duration / channel / brand / category) / migrate_data 278K (cactus→tars 迁移自然实验)",
        "notes": "D5 TARS Migration 主数据",
    },
    {
        "name": "shulex_voc_prod_v2",
        "kind": "mysql",
        "description": "VOC AI 评论智能产品",
        "stats": "105 表 / 132M 行. dai_comments / voc_report / voc_llm_usage 1.4M",
        "notes": "D4 跨产品 AI 资本溢出 (Solvea × VOC AI 同 tenant)",
    },
    {
        "name": "shulex_collector_prod",
        "kind": "mysql",
        "description": "原始日志库",
        "stats": "13 表 / 622M 行 / 2.1 TB. log_a/b/c/d + job_a/b/c/d",
        "notes": "尚未深掘",
    },
    {
        "name": "AI-Scientist-v2 + MiroThinker pipeline",
        "kind": "api",
        "description": "本地 ideation + critique + tournament pipeline",
        "stats": "Claude Sonnet 4.5 (via flatkey) + MiroThinker DeepResearch",
        "notes": "用于研究方向自动生成 / brutal critique / 排名",
    },
    {
        "name": "discovery_engine_h3_paper_v2",
        "kind": "file",
        "description": "已完稿 H3 论文 v2",
        "stats": "discovery_engine_h3_paper_v2.pdf + .md + .docx + .html",
        "notes": "Chapter 0 of dissertation. 配套 stage1_dataset.csv + regression_results.csv",
    },
]


SYSTEM_PROMPT = """You are an AI research advisor speaking with Hunter (郭振), HKU DBA candidate.

Hunter's dissertation context (always available to you):
- Target defense: November 2026
- Topic: Boundary conditions of human service recovery mechanisms in the AI era
- Already published: H3 paper "Handoff Agency Paradox" (v2 finished, advisors signed off)
- Data: 11-database Solvea/VOC.ai production lake (1.9B conversations, 8.7M handoff events, Jan 2024–)
- Three advisors:
  - Prof. Chen LIN (HKU, primary, corporate finance / law-and-finance)
  - Prof. Li-An ZHOU (PKU, institutional economics / promotion tournament)
  - Prof. Jing CAI (UMD, J-PAL Firms co-chair, field RCT)
- 17 candidate research directions already curated (D1, D5, D8, D11-D24 + H3)
- Current recommendation: D8 (Follow-up Signal Paradox) as main + D1 or D11 as second

Help Hunter:
- Refine specific hypotheses
- Pressure-test identification strategies
- Suggest counter-arguments reviewers might raise
- Adjust framing for specific advisor preferences
- Generate concrete next steps (SQL queries, A/B designs, IRB language)

Be terse, specific, builder-to-builder. Reference exact direction codes (D8, H3) when relevant.
Don't hedge. Don't sycophant. If a direction looks weak, say so.
"""


def main():
    with conn() as c:
        # 1. Admin / Hunter waitlist entry — promote to #1 + is_admin=1
        existing = c.execute(
            "SELECT id, token FROM waitlist WHERE email = ?", (ADMIN_EMAIL,)
        ).fetchone()
        if existing:
            token = existing["token"]
            c.execute(
                "UPDATE waitlist SET is_admin=1, context=?, source=? WHERE id=?",
                (
                    "Founder. HKU DBA. Built this thing.",
                    "founder",
                    existing["id"],
                ),
            )
            user_id = existing["id"]
            print(f"✓ admin already exists (id={user_id}), promoted to admin")
        else:
            token = secrets.token_urlsafe(16)
            cur = c.execute(
                "INSERT INTO waitlist (email, context, source, token, is_admin) VALUES (?, ?, ?, ?, 1)",
                (
                    ADMIN_EMAIL,
                    "Founder. HKU DBA. Built this thing.",
                    "founder",
                    token,
                ),
            )
            user_id = cur.lastrowid
            print(f"✓ admin created (id={user_id})")

        # 2. Workspace
        ws_existing = c.execute(
            "SELECT id FROM workspaces WHERE owner_email = ? AND title = ?",
            (ADMIN_EMAIL, WORKSPACE_TITLE),
        ).fetchone()
        if ws_existing:
            ws_id = ws_existing["id"]
            print(f"✓ workspace exists (id={ws_id}) — refreshing content")
            c.execute("DELETE FROM hypotheses WHERE workspace_id = ?", (ws_id,))
            c.execute("DELETE FROM data_sources WHERE workspace_id = ?", (ws_id,))
        else:
            cur = c.execute(
                "INSERT INTO workspaces (owner_email, title, description) VALUES (?, ?, ?)",
                (ADMIN_EMAIL, WORKSPACE_TITLE, WORKSPACE_DESC),
            )
            ws_id = cur.lastrowid
            print(f"✓ workspace created (id={ws_id})")

        # 3. Hypotheses
        for h in HYPOTHESES:
            c.execute(
                """INSERT INTO hypotheses
                   (workspace_id, code, title, paradox, hypothesis, identification,
                    theory_anchor, journal_target, feasibility_6mo, ab_test_difficulty,
                    status, notes)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    ws_id,
                    h["code"], h["title"], h["paradox"], h["hypothesis"],
                    h["identification"], h["theory_anchor"], h["journal_target"],
                    h["feasibility_6mo"], h["ab_test_difficulty"],
                    h["status"], h.get("notes"),
                ),
            )
        print(f"✓ {len(HYPOTHESES)} hypotheses seeded")

        # 4. Data sources
        for d in DATA_SOURCES:
            c.execute(
                """INSERT INTO data_sources
                   (workspace_id, name, kind, description, stats, notes)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (
                    ws_id,
                    d["name"], d["kind"], d["description"], d["stats"], d.get("notes"),
                ),
            )
        print(f"✓ {len(DATA_SOURCES)} data sources seeded")

        # 5. Seed an initial system message + assistant greeting
        c.execute("DELETE FROM chat_messages WHERE workspace_id = ?", (ws_id,))
        c.execute(
            "INSERT INTO chat_messages (workspace_id, role, content, model) VALUES (?, ?, ?, ?)",
            (ws_id, "system", SYSTEM_PROMPT, "claude-sonnet-4-5"),
        )
        c.execute(
            "INSERT INTO chat_messages (workspace_id, role, content, model) VALUES (?, ?, ?, ?)",
            (ws_id, "assistant",
             "Hi Hunter. Workspace loaded — 17 directions across 6 status tiers, 8 data sources, H3 published. "
             "Ready to pressure-test D8 / D11 / D14 / D5 / your advisor pitch. What's on top of mind?",
             "claude-sonnet-4-5"),
        )
        print(f"✓ chat seeded with system + greeting")

        print()
        print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print(f"  Admin email:  {ADMIN_EMAIL}")
        print(f"  Token:        {token}")
        print(f"  Workspace #:  {ws_id}")
        print(f"  Login URL:    http://127.0.0.1:3000/dashboard?token={token}")
        print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")


if __name__ == "__main__":
    main()
