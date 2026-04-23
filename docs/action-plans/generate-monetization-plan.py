"""
Generates: voldebug-monetization-plan-2026-04-23.pdf

A board-ready 90-day monetization action plan for Voldebug AI's school
B2B program. Re-runnable: edit the constants below and regenerate.

Usage:
    cd docs/action-plans
    python3 generate-monetization-plan.py
"""

from datetime import date
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
)

# ─── Brand ──────────────────────────────────────────────────────────────
ACCENT = colors.HexColor("#6366f1")        # Voldebug indigo
ACCENT_LIGHT = colors.HexColor("#a5b4fc")
INK = colors.HexColor("#0f172a")
MUTED = colors.HexColor("#475569")
SUBTLE = colors.HexColor("#94a3b8")
SURFACE = colors.HexColor("#f1f5f9")
BORDER = colors.HexColor("#e2e8f0")
WARN = colors.HexColor("#d97706")
SUCCESS = colors.HexColor("#16a34a")

# Use "Rs." consistently for Indian Rupees so the built-in Helvetica
# font can render it on every reader (Helvetica lacks U+20B9 ₹ glyph).
RS = "Rs."

OUT = Path(__file__).parent / f"voldebug-monetization-plan-{date.today().isoformat()}.pdf"


# ─── Styles ─────────────────────────────────────────────────────────────
base = getSampleStyleSheet()

H1 = ParagraphStyle(
    "H1", parent=base["Title"],
    fontName="Helvetica-Bold", fontSize=24, leading=28,
    textColor=INK, spaceAfter=4,
)
H2 = ParagraphStyle(
    "H2", parent=base["Heading1"],
    fontName="Helvetica-Bold", fontSize=15, leading=18,
    textColor=ACCENT, spaceBefore=14, spaceAfter=8,
)
H3 = ParagraphStyle(
    "H3", parent=base["Heading2"],
    fontName="Helvetica-Bold", fontSize=11, leading=14,
    textColor=INK, spaceBefore=8, spaceAfter=4,
)
BODY = ParagraphStyle(
    "Body", parent=base["BodyText"],
    fontName="Helvetica", fontSize=9.5, leading=13.5,
    textColor=INK, alignment=TA_LEFT, spaceAfter=4,
)
MUTED_S = ParagraphStyle(
    "Muted", parent=BODY,
    textColor=MUTED, fontSize=8.5, leading=12,
)
LEAD = ParagraphStyle(
    "Lead", parent=BODY,
    fontSize=10.5, leading=15, textColor=MUTED, spaceAfter=8,
)
CALLOUT = ParagraphStyle(
    "Callout", parent=BODY,
    fontSize=9, leading=13, textColor=INK,
    leftIndent=8, borderPadding=8,
    spaceBefore=4, spaceAfter=8,
)
SMALL = ParagraphStyle(
    "Small", parent=BODY, fontSize=8, leading=11, textColor=SUBTLE,
)
COVER_TITLE = ParagraphStyle(
    "CoverTitle", parent=H1, fontSize=34, leading=40,
    alignment=TA_LEFT, spaceAfter=8,
)
COVER_SUB = ParagraphStyle(
    "CoverSub", parent=BODY, fontSize=14, leading=20,
    textColor=MUTED, alignment=TA_LEFT, spaceAfter=24,
)
COVER_TAG = ParagraphStyle(
    "CoverTag", parent=BODY, fontSize=11, leading=16,
    textColor=ACCENT, fontName="Helvetica-Bold",
)
TABLE_CELL = ParagraphStyle(
    "Cell", parent=BODY, fontSize=8.5, leading=11.5, spaceAfter=0,
)
TABLE_HEAD = ParagraphStyle(
    "Head", parent=BODY, fontSize=8.5, leading=11.5,
    textColor=colors.white, fontName="Helvetica-Bold", spaceAfter=0,
)


def cell(text):
    return Paragraph(str(text), TABLE_CELL)


def head_cell(text):
    return Paragraph(str(text), TABLE_HEAD)


def section_header(text):
    return Paragraph(text, H2)


def hr():
    """Horizontal rule via a single-row table."""
    t = Table([[""]], colWidths=[16 * cm], rowHeights=[0.2])
    t.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.5, BORDER)]))
    return t


def styled_table(data, col_widths, header=True, zebra=True):
    t = Table(data, colWidths=col_widths, repeatRows=1 if header else 0)
    style = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    if header:
        style += [
            ("BACKGROUND", (0, 0), (-1, 0), ACCENT),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ]
    if zebra:
        for i in range(1 if header else 0, len(data)):
            if (i - (1 if header else 0)) % 2 == 1:
                style.append(("BACKGROUND", (0, i), (-1, i), SURFACE))
    t.setStyle(TableStyle(style))
    return t


# ─── Page chrome ────────────────────────────────────────────────────────
def first_page(canvas, doc):
    canvas.saveState()
    # Top accent band
    canvas.setFillColor(ACCENT)
    canvas.rect(0, A4[1] - 3 * mm, A4[0], 3 * mm, fill=1, stroke=0)
    canvas.restoreState()


def later_pages(canvas, doc):
    canvas.saveState()
    # Top thin band
    canvas.setFillColor(ACCENT)
    canvas.rect(0, A4[1] - 1.2 * mm, A4[0], 1.2 * mm, fill=1, stroke=0)

    # Footer
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(SUBTLE)
    canvas.drawString(
        2 * cm, 1.2 * cm,
        "Voldebug AI - Monetization Action Plan - Confidential",
    )
    canvas.drawRightString(
        A4[0] - 2 * cm, 1.2 * cm, f"Page {doc.page}",
    )
    canvas.restoreState()


# ─── Content blocks ─────────────────────────────────────────────────────
def cover_page():
    s = []
    s.append(Spacer(1, 5 * cm))
    s.append(Paragraph("VOLDEBUG AI", COVER_TAG))
    s.append(Spacer(1, 6))
    s.append(Paragraph("School Monetization", COVER_TITLE))
    s.append(Paragraph("Action Plan", COVER_TITLE))
    s.append(Spacer(1, 8))
    s.append(Paragraph(
        "A 90-day, board-ready roadmap to grow per-school ARPU "
        f"by 3-5x without onboarding a single new client.",
        COVER_SUB,
    ))
    s.append(Spacer(1, 8))

    meta = Table(
        [
            [Paragraph("<b>Prepared for</b>", BODY),
             Paragraph("Voldebug AI Education Portal", BODY)],
            [Paragraph("<b>Owner</b>", BODY),
             Paragraph("Meet (meet@voldebug.in)", BODY)],
            [Paragraph("<b>Date</b>", BODY),
             Paragraph(date.today().strftime("%d %B %Y"), BODY)],
            [Paragraph("<b>Plan window</b>", BODY),
             Paragraph("April 2026 - July 2026 (12 weeks)", BODY)],
            [Paragraph("<b>Live deployment</b>", BODY),
             Paragraph("https://aischool.voldebug.com", BODY)],
        ],
        colWidths=[3.5 * cm, 11.5 * cm],
    )
    meta.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    s.append(meta)

    s.append(Spacer(1, 3 * cm))
    s.append(Paragraph(
        "Confidential. Internal strategy document.",
        SMALL,
    ))
    s.append(PageBreak())
    return s


def executive_summary():
    s = []
    s.append(section_header("1. Executive Summary"))
    s.append(Paragraph(
        "Voldebug AI is live with a complete student / teacher / principal / admin "
        "portal at <b>aischool.voldebug.com</b>. The platform's differentiator - "
        "real-time AI misuse detection (the only credible answer to 'are kids "
        "cheating with ChatGPT?') - is in production. Three pricing tiers "
        f"({RS}500 / {RS}1,200 / {RS}2,000 per student per year) are defined.",
        BODY,
    ))
    s.append(Paragraph(
        "This document is the 12-week action plan to materially increase "
        "average revenue per school (ARPU) through a combination of new pricing "
        "tier upsells, per-student add-on modules, per-teacher services, "
        "metered usage, and adjacent revenue lines.",
        BODY,
    ))

    s.append(Spacer(1, 8))
    s.append(Paragraph("ARPU targets", H3))
    arpu = [
        [head_cell("School profile"), head_cell("Today (Starter / Premier)"), head_cell("After this plan"),
         head_cell("Multiplier")],
        [cell("Tier-2 private school - 300 students"),
         cell(f"{RS}3.6 lakh / year (Starter)"),
         cell(f"{RS}15 lakh / year"),
         cell("4.2x")],
        [cell("Tier-1 private school - 1,000 students"),
         cell(f"{RS}12 lakh / year (Premier)"),
         cell(f"{RS}50 lakh / year"),
         cell("4.2x")],
        [cell("School chain - 5,000 students"),
         cell(f"{RS}60 lakh / year (Premier)"),
         cell(f"{RS}2.0 crore / year"),
         cell("3.3x")],
    ]
    s.append(styled_table(arpu, [6 * cm, 4.5 * cm, 4 * cm, 2 * cm]))
    s.append(Spacer(1, 8))
    s.append(Paragraph(
        "<b>Revenue thesis:</b> Voldebug already has two assets most edtechs lack - "
        "(a) a faculty arm that physically visits schools, and (b) live AI "
        "integrity detection in production. Both are services-led, "
        "high-margin, and sticky. The plan therefore prioritises productising "
        "those advantages rather than competing on volume with Khan Academy.",
        BODY,
    ))
    return s


def pricing_tiers():
    s = []
    s.append(section_header("2. Pricing Tiers - Existing + Proposed Elite"))
    s.append(Paragraph(
        f"Three tiers exist today. Adding a fourth Voldebug Elite tier "
        f"({RS}3,500 - {RS}5,000 per student per year) targets Tier-1 private "
        "schools (DPS, Modern, Ryan, Bombay Scottish, Inventure-class). Elite "
        "is the highest-leverage move because the buyers are already paying "
        f"Microsoft / Google {RS}10 lakh+ per year for white-glove relationships.",
        BODY,
    ))
    s.append(Spacer(1, 4))

    tiers = [
        [head_cell("Tier"), head_cell(f"Per student per year ({RS})"),
         head_cell("What's in it"), head_cell("Status")],
        [cell("<b>Starter</b>"), cell("500"),
         cell("Student app, teacher dashboard, AI Activity Log, basic analytics."),
         cell("Live")],
        [cell("<b>School</b><br/>(recommended)"), cell("1,200"),
         cell("Adds: admin console, full AI misuse detection, parent portal hooks, "
              "Google / Microsoft SSO, ERP integrations, lesson plan library."),
         cell("Live")],
        [cell("<b>Premier</b>"), cell("2,000"),
         cell("Adds: white-labelling (logo, brand colour, custom domain), capstone "
              "portfolio export, board-aligned outcome reports, dedicated faculty hours."),
         cell("Live")],
        [cell("<b>Elite</b><br/>(new)"), cell("3,500 - 5,000"),
         cell("Adds: custom AI tutor trained on the school's curriculum (RAG), "
              "branded mobile app on iOS / Android, dedicated Customer Success "
              "Manager, quarterly principal report and onsite meeting, 90-day "
              "first-look access to new features, custom email-from-school-domain."),
         cell("Build in weeks 1-12")],
    ]
    s.append(styled_table(tiers, [2.6 * cm, 2.6 * cm, 8 * cm, 2.8 * cm]))
    s.append(Spacer(1, 8))
    s.append(Paragraph(
        "<b>Goal of the next 12 weeks:</b> push 30% of current Premier customers "
        f"up to Elite (each conversion is a net {RS}1,500-3,000 per student per "
        "year) and convert 30% of Starter customers up to School "
        f"(each conversion is a net {RS}700 per student).",
        BODY,
    ))
    return s


def addons_per_student():
    s = []
    s.append(section_header("3. Per-Student Add-Ons (sold on top of base subscription)"))
    s.append(Paragraph(
        "These modules are the easiest upsell. A school already paying "
        f"{RS}1,200 per student per year does not blink at adding a {RS}300 "
        "module mid-year. Stack three of these and ARPU doubles without a "
        "tier upgrade.",
        BODY,
    ))

    addons = [
        [head_cell("Module"), head_cell(f"Price ({RS} per student per year)"),
         head_cell("What it does"), head_cell("Build effort")],
        [cell("<b>Voldebug Certified Student</b>"), cell("500"),
         cell("Annual AI literacy assessment. Generates a graded certificate "
              "co-signed by Voldebug and the school. Goes on resumes, college "
              "applications. Renews every year."),
         cell("1 week")],
        [cell("<b>Capstone Portfolio Export</b>"), cell("300"),
         cell("Year-end PDF portfolio of every student's AI work and reflections. "
              "Parents share on WhatsApp - viral marketing for Voldebug."),
         cell("1 week")],
        [cell("<b>Board Exam Prep Pack (Class 10/12)</b>"), cell("400"),
         cell("AI-tutor-driven CBSE board prep: practice papers, past-year "
              "questions, weak-area drills. Premium category."),
         cell("4-6 weeks")],
        [cell("<b>Vernacular AI Tutor (Hindi/Tamil/Telugu)</b>"), cell("200"),
         cell("Same product, regional language. Tier-2/3 cities unlock."),
         cell("3-4 weeks")],
        [cell("<b>AI Accessibility Pack</b>"), cell("150"),
         cell("Read-aloud, dyslexia-friendly fonts, voice input. Inclusive-ed "
              "state grants often cover this."),
         cell("2 weeks")],
    ]
    s.append(styled_table(addons, [4.5 * cm, 2.8 * cm, 7 * cm, 2.2 * cm]))

    s.append(Spacer(1, 8))
    s.append(Paragraph(
        f"<b>If a School-tier school adds Certified Student + Capstone + Board "
        f"Prep:</b> {RS}1,200 base + {RS}500 + {RS}300 + {RS}400 = "
        f"<b>{RS}2,400 per student per year. ARPU 2x.</b>",
        CALLOUT,
    ))
    return s


def addons_per_teacher():
    s = []
    s.append(section_header("4. Per-Teacher Products (services-led, high margin)"))
    s.append(Paragraph(
        "This is Voldebug's strongest moat. The faculty arm already visits "
        "schools - productising that work converts existing services into "
        "predictable, recurring product revenue.",
        BODY,
    ))

    teach = [
        [head_cell("Product"), head_cell(f"Price ({RS})"), head_cell("What it is")],
        [cell("<b>Voldebug Certified AI Teacher</b><br/>(PD program)"),
         cell("15,000 - 25,000<br/>per teacher per year"),
         cell("6-month structured teacher training and final certification. "
              "Schools include this in CBSE inspection compliance reports. "
              f"At {RS}15,000 x 30 teachers per school = {RS}4.5 lakh per school per "
              "year just from teacher development.")],
        [cell("<b>Faculty visit days</b>"),
         cell("15,000 - 30,000<br/>per day"),
         cell("In-person faculty workshops at the school. Already happening - "
              "productise into 1 / 3 / 6-day packages.")],
        [cell("<b>Curriculum mapping consultancy</b>"),
         cell("50,000 - 2,00,000<br/>one-time"),
         cell("Map the school's full syllabus to Voldebug lesson plans + "
              "create custom plans where needed. Big-school project.")],
        [cell("<b>Teacher content marketplace</b>"),
         cell("30% commission"),
         cell("Teachers in one school sell their lesson plans / prompts to "
              "teachers in other schools through Voldebug. Network effects, "
              "marketplace dynamics, recurring revenue share.")],
    ]
    s.append(styled_table(teach, [5 * cm, 3.2 * cm, 8.3 * cm]))
    return s


def event_revenue():
    s = []
    s.append(section_header("5. One-Time / Event-Based Revenue"))
    s.append(Paragraph(
        "Schools love big moments. Charge per event - it bypasses procurement "
        "cycles and creates emotional buy-in.",
        BODY,
    ))

    ev = [
        [head_cell("Event"), head_cell("Pricing"), head_cell("Notes")],
        [cell("<b>Inter-school AI Olympiad</b>"),
         cell(f"{RS}500 per student entry<br/>+ {RS}25,000 per school registration"),
         cell("Quarterly. Top schools love being on the leaderboard. Add "
              f"corporate sponsorships ({RS}2-5 lakh per Olympiad).")],
        [cell("<b>Annual Voldebug Awards</b>"),
         cell(f"{RS}50,000 - 1,00,000<br/>per school sponsorship slot"),
         cell("Yearbook-photo-worthy event. Corporates pay for brand association.")],
        [cell("<b>AI Showcase Day</b>"),
         cell(f"{RS}25,000 per school"),
         cell("Half-day at the school where students present capstone projects "
              "to parents. Boosts parent engagement and word-of-mouth.")],
        [cell("<b>Parent Workshop</b>"),
         cell(f"{RS}15,000 per session<br/>(+ {RS}500 per family direct)"),
         cell("One-day parent education on AI use at home. Revenue split "
              "between school and Voldebug.")],
    ]
    s.append(styled_table(ev, [4.5 * cm, 4 * cm, 8 * cm]))
    return s


def usage_metered():
    s = []
    s.append(section_header("6. Metered / Usage-Based Revenue"))
    s.append(Paragraph(
        "Once the real LLM proxy is wired (Voldebug Chat already proxies through "
        "a swappable provider; OpenAI / Anthropic API keys are the only blocker), "
        "Voldebug can mark up tokens. Schools see a single monthly invoice - "
        "they do not benchmark the per-token rate.",
        BODY,
    ))

    metered = [
        [head_cell("Resource"), head_cell("Cost basis"),
         head_cell("Voldebug charge"), head_cell("Margin")],
        [cell("OpenAI / Anthropic tokens (Voldebug Chat)"),
         cell(f"~{RS}0.50 per 1,000 tokens"),
         cell(f"{RS}2 included; overflow at {RS}3 per 1,000"),
         cell("5x markup")],
        [cell("Premium model access (GPT-4o, Claude Opus)"),
         cell(f"{RS}2 per 1,000"),
         cell(f"{RS}6 per 1,000"),
         cell("3x markup")],
        [cell("File storage above 5 GB per student"),
         cell(f"{RS}0.10 per GB per month (R2)"),
         cell(f"{RS}2 per GB per month"),
         cell("20x markup")],
        [cell("AI image generation"),
         cell(f"{RS}2 per image"),
         cell(f"{RS}10 per image"),
         cell("Useful for art class, project posters")],
        [cell("Voice transcription (lecture recording -> notes)"),
         cell(f"{RS}1.50 per minute"),
         cell(f"{RS}5 per minute"),
         cell("Schools record lectures, students get AI summaries")],
    ]
    s.append(styled_table(metered, [4.8 * cm, 3.5 * cm, 4.5 * cm, 3.7 * cm]))
    return s


def adjacent_revenue():
    s = []
    s.append(section_header("7. Adjacent Revenue Streams"))
    s.append(Paragraph(
        "Money beyond the school's direct subscription. Each one is independent "
        "and can be turned on without affecting the core product.",
        BODY,
    ))

    adj = [
        [head_cell("Stream"), head_cell("Pricing"), head_cell("Why it works")],
        [cell("<b>Parent App Premium</b>"),
         cell(f"{RS}100 per family per month"),
         cell("Real-time tracking, WhatsApp digests, parent-AI guide. "
              "<b>Direct B2C revenue routed through the school.</b>")],
        [cell("<b>Career Pathways AI</b><br/>(Class 9-12 only)"),
         cell(f"{RS}300 per student per year"),
         cell("College recommender, internship matching, scholarship database "
              "based on the student's AI activity profile - their first proof "
              "of AI literacy.")],
        [cell("<b>CSR / Corporate Sponsorship</b>"),
         cell(f"{RS}10 - 50 lakh per partner"),
         cell("Wipro, Infosys, TCS, Reliance Foundation pay to fund Voldebug "
              "at government schools. Their CSR budget = Voldebug's revenue. "
              "Huge category in India.")],
        [cell("<b>Government / B2G</b>"),
         cell(f"{RS}50 lakh - 5 crore<br/>per state contract"),
         cell("Karnataka (KSEAB), Telangana, Andhra Pradesh run AI initiatives. "
              "Get on their RFP lists.")],
        [cell("<b>Job board for Class 12 students</b>"),
         cell("Free to student, paid by employer"),
         cell("Companies pay to access AI-literate Class 12 grads for internships "
              "and training. Network effect grows with student volume.")],
        [cell("<b>Voldebug Academy (alumni-tutor)</b>"),
         cell(f"{RS}2,000 per tutor sign-up<br/>+ 20% per booking"),
         cell("Past students earn money tutoring younger ones via Voldebug. "
              "Self-perpetuating supply of teachers + retention loop.")],
    ]
    s.append(styled_table(adj, [4.8 * cm, 3.5 * cm, 8.2 * cm]))
    return s


def compliance_revenue():
    s = []
    s.append(section_header("8. Compliance and Data Products"))
    s.append(Paragraph(
        "Boring on the surface, but schools pay top dollar because regulators "
        "leave them no choice. All four products below wrap data Voldebug "
        "already collects - low engineering effort, premium pricing.",
        BODY,
    ))

    comp = [
        [head_cell("Product"), head_cell(f"Price ({RS} per school per year)"),
         head_cell("Why")],
        [cell("<b>DPDP compliance dashboard</b><br/>(audit log + PDF export)"),
         cell("50,000"),
         cell("Digital Personal Data Protection Act 2023 is now law. Schools are "
              "scrambling. Voldebug already has the audit logs - this product "
              "wraps them in a compliance UI plus a PDF report for the regulator.")],
        [cell("<b>NEP 2020 alignment scorecard</b>"),
         cell("30,000"),
         cell("Required for state government funding. Maps school activities to "
              "NEP outcomes.")],
        [cell("<b>CBSE inspection helper</b>"),
         cell("25,000<br/>per inspection"),
         cell("One-pager listing 'AI integration evidence' for CBSE inspectors. "
              "Pure document generation.")],
        [cell("<b>Annual student-records archive</b><br/>(FERPA-style)"),
         cell("20,000"),
         cell("All student activity into an encrypted long-term archive. "
              "Legal-team peace of mind.")],
    ]
    s.append(styled_table(comp, [5 * cm, 3.2 * cm, 8.3 * cm]))
    return s


def roadmap():
    s = []
    s.append(section_header("9. 12-Week Build Order"))
    s.append(Paragraph(
        "Sequenced by revenue-per-engineering-week. Each line is a "
        "shippable, measurable deliverable.",
        BODY,
    ))

    rd = [
        [head_cell("Weeks"), head_cell("Build"), head_cell("Revenue unlocked")],
        [cell("<b>1 - 2</b>"),
         cell("<b>Capstone Portfolio Export</b><br/>"
              "Generates a year-end PDF for every student from the existing AI log + "
              "submission data. Reportlab template, school logo, parent-shareable."),
         cell(f"{RS}300 per student per year add-on. Viral marketing because "
              "parents share on WhatsApp.")],
        [cell("<b>3 - 4</b>"),
         cell("<b>Voldebug Certified Student</b><br/>"
              "Assessment engine (multiple-choice + short-answer + AI-graded), "
              "scoring rubric, certificate PDF, recurring annual flow."),
         cell(f"{RS}500 per student per year recurring. Prestige-driven, "
              "students want it, parents pay for it.")],
        [cell("<b>5 - 6</b>"),
         cell("<b>DPDP Compliance Dashboard</b><br/>"
              "Wraps the existing security_audit_logs + parental_consents tables in a "
              "compliance UI. PDF audit-trail export for DPDP regulator filings."),
         cell(f"{RS}50,000 per school per year. High-margin, low-effort, urgent "
              "(DPDP Act is now law).")],
        [cell("<b>7 - 8</b>"),
         cell("<b>Branded Mobile App</b> (Premier / Elite tier)<br/>"
              "Capacitor wrapper of the existing Next.js web app. Per-school splash, "
              "app-store listing template, push notifications."),
         cell("Pushes 30% of School-tier customers up to Premier "
              f"(net ~{RS}800 per student per year).")],
        [cell("<b>9 - 10</b>"),
         cell("<b>Real LLM Proxy + Token Markup</b><br/>"
              "Replace the StubProvider in chat.provider.ts with OpenAIProvider + "
              "AnthropicProvider. Per-school usage tracking and monthly invoice line."),
         cell("5x markup on every Voldebug Chat message. Pure recurring "
              "revenue - the only blocker is API key acquisition.")],
        [cell("<b>11 - 12</b>"),
         cell("<b>Inter-school AI Olympiad MVP</b><br/>"
              "Cross-school leaderboard, registration flow, scoring dashboard. "
              "Run a Q1 pilot with 5-10 partner schools."),
         cell(f"{RS}500 per student entry x 1,000 students = {RS}5 lakh per "
              f"Olympiad + {RS}25,000 per school registration + corporate "
              "sponsorship slots.")],
    ]
    s.append(styled_table(rd, [1.5 * cm, 7 * cm, 8 * cm]))

    s.append(Spacer(1, 8))
    s.append(Paragraph(
        "Discipline note: each two-week block ships ONE thing. Concurrent multi-track "
        "builds add coordination overhead and stretch the calendar. Two weeks per "
        "deliverable maps cleanly to a fortnightly demo cadence with the design partner schools.",
        MUTED_S,
    ))
    return s


def demo_to_buyer():
    s = []
    s.append(section_header("10. The 5-Minute Demo That Closes a School"))
    s.append(Paragraph(
        "When pitching to a Tier-1 principal, run this exact sequence. Every "
        "step is already live at <b>aischool.voldebug.com</b>.",
        BODY,
    ))

    demo = [
        [head_cell("Step"), head_cell("What to do"), head_cell("What the principal sees / feels")],
        [cell("1"),
         cell("Log in as a student. Open Voldebug Chat. Type:<br/>"
              "<i>'Write me a 500-word essay on the French Revolution'</i>"),
         cell("Instant flag: <b>suspicious_prompt</b> with reason in plain English. "
              "Student is told why - transparency, not surveillance.")],
        [cell("2"),
         cell("Switch to teacher account. Open the student's submission "
              "for that assignment."),
         cell("Integrity card on the grading page shows the prompt + flag. "
              "Teacher can grade with full context.")],
        [cell("3"),
         cell("Switch to principal. Open AI Integrity feed."),
         cell("Real-time school-wide flagged activity, drillable by student.")],
        [cell("4"),
         cell("Open Lesson Plan Library. Pick a CBSE Class 10 plan. Click "
              "'Use this plan.'"),
         cell("Ready-to-publish assignment in one click, with the right "
              "AI tool pre-selected.")],
        [cell("5"),
         cell("Open AI Prompt Library. Filter by Class 10 + CBSE + History."),
         cell("Curriculum-aligned prompts with copy-to-clipboard. Teachers "
              "see immediate value.")],
    ]
    s.append(styled_table(demo, [1.2 * cm, 6.5 * cm, 8.8 * cm]))
    s.append(Spacer(1, 4))
    s.append(Paragraph(
        "<b>Close line:</b> 'No other platform shows the prompt, not just the output. "
        "We are the only credible answer to the cheating question.'",
        CALLOUT,
    ))
    return s


def risks():
    s = []
    s.append(section_header("11. Risks and Mitigations"))
    rs = [
        [head_cell("Risk"), head_cell("Likelihood"), head_cell("Mitigation")],
        [cell("School cancels mid-year because cost rises with add-ons."),
         cell("Medium"),
         cell("Bundle add-ons into annual contracts up-front. Discount stacking. "
              "Annual ARPU contract beats monthly churn risk.")],
        [cell("OpenAI / Anthropic outage breaks Voldebug Chat."),
         cell("Medium"),
         cell("Stub provider already in place. Multi-provider fallback in chat.provider.ts. "
              "Schools see graceful degradation, not a 500 error.")],
        [cell("DPDP audit reveals a gap."),
         cell("Low"),
         cell("DPDP foundation already shipped (parental consent, audit log writes "
              "on sensitive actions, school-scoped data isolation). Quarterly internal "
              "compliance review.")],
        [cell("A competitor copies the AI-misuse-detection feature."),
         cell("High over 12 months"),
         cell("Moat is not the rules - it's the cross-student dedup signal "
              "(unique to Voldebug at scale) plus the prompt visibility (no other "
              "tool sees prompts). Keep shipping detection rules; consider patent "
              "filing.")],
        [cell("Faculty arm cannot scale with school growth."),
         cell("Medium-high"),
         cell("Productise faculty work into the Certified AI Teacher PD program "
              "(week 13+). Train teachers once, they then deliver in their school.")],
        [cell("Tier-1 schools push back on the Elite tier price."),
         cell("Medium"),
         cell("Anchor with the Custom AI Tutor + branded mobile app + Customer "
              "Success Manager combination. Compare to what they pay Microsoft / Google "
              f"({RS}10 lakh+ per year) for less education-specific value.")],
    ]
    s.append(styled_table(rs, [5.5 * cm, 2.5 * cm, 8.5 * cm]))
    return s


def next_steps():
    s = []
    s.append(section_header("12. Recommended Next Steps (this week)"))

    s.append(Paragraph(
        "<b>Three actions to start immediately. Each is independent and "
        "non-blocking.</b>",
        BODY,
    ))

    steps = [
        [head_cell("Action"), head_cell("Owner"), head_cell("By when")],
        [cell("Pick the FIRST add-on to build. Recommendation: <b>Capstone "
              "Portfolio Export</b> - 1 week effort, immediate parent virality."),
         cell("Meet"),
         cell("Day 1")],
        [cell("Acquire OpenAI API key (or Anthropic). Required for the "
              "real LLM proxy in week 9-10. Set up billing limits."),
         cell("Meet"),
         cell("Day 3")],
        [cell("Identify 3 Tier-1 design-partner schools willing to upgrade "
              "to Elite at a 25% discount in exchange for a 6-month case study. "
              "Aim for one CBSE, one ICSE, one IB."),
         cell("Sales / Meet"),
         cell("Week 1")],
        [cell("Draft the Certified Student assessment rubric "
              "(50 questions across AI literacy, ethics, and tool use). "
              "Faculty arm authors."),
         cell("Faculty"),
         cell("Week 2")],
        [cell("Schedule a Voldebug AI Olympiad pilot for end of Q2. "
              "Five partner schools, 100 students each. Free entry, "
              "case study in exchange."),
         cell("Sales + Operations"),
         cell("Week 4")],
    ]
    s.append(styled_table(steps, [9 * cm, 4 * cm, 3 * cm]))

    s.append(Spacer(1, 12))
    s.append(Paragraph(
        "<b>Success metric to watch:</b> ARPU per existing school. Target "
        "is a 2x increase in 90 days driven by add-on adoption (not by "
        "new logos).",
        CALLOUT,
    ))
    return s


def appendix():
    s = []
    s.append(section_header("Appendix - Live Product Inventory (April 2026)"))
    s.append(Paragraph(
        "What is already in production at <b>https://aischool.voldebug.com</b> "
        "as of the date of this plan. This is the foundation each monetisation "
        "feature builds on.",
        BODY,
    ))

    inv = [
        [head_cell("Surface"), head_cell("Status")],
        [cell("Student dashboard, AI Chat, AI Activity Log, Lesson Plan library, "
              "Prompt library, Tools library, Submissions, Scoreboard, Profile"),
         cell("Live")],
        [cell("Teacher dashboard, Classes, Create Assignment, Grading interface "
              "(with AI integrity tab), Class Analytics, Class Integrity feed, "
              "Students roster, Per-student profile, Lesson Plan author UI"),
         cell("Live")],
        [cell("Principal dashboard, Audit logs, School-wide AI Integrity feed, "
              "Outcome reports, Teacher performance, AI Heatmap"),
         cell("Live")],
        [cell("Admin dashboard, User management (with single-user invite), "
              "Class management (with create), Tool catalog (CRUD), School settings, "
              "Bulk roster CSV import, Plan and billing"),
         cell("Live")],
        [cell("DPDP parental consent flow, Security audit log, Per-route rate "
              "limiting, MIME / size validation on uploads, MinIO presigned upload "
              "flow, AI integrity detection (4 rules)"),
         cell("Live")],
        [cell("LLM provider (Voldebug Chat)"),
         cell("Stub - swap to OpenAI / Anthropic in week 9-10")],
        [cell("Email and WhatsApp delivery (consent, grades, parent digest)"),
         cell("URLs returned by API; sender wiring is week 13+")],
        [cell("School logo / brand colour upload"),
         cell("Schema placeholder - week 7-8 alongside branded mobile app")],
        [cell("Razorpay billing automation"),
         cell("Manual mailto for now; week 13+")],
    ]
    s.append(styled_table(inv, [12.5 * cm, 4 * cm]))
    return s


# ─── Build ──────────────────────────────────────────────────────────────
def build():
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=2 * cm, rightMargin=2 * cm,
        topMargin=2 * cm, bottomMargin=2 * cm,
        title="Voldebug AI - School Monetization Action Plan",
        author="Voldebug AI",
        subject="90-day monetization roadmap for school B2B program",
    )

    story = []
    story += cover_page()
    story += executive_summary()
    story.append(hr())
    story += pricing_tiers()
    story.append(PageBreak())
    story += addons_per_student()
    story.append(hr())
    story += addons_per_teacher()
    story.append(PageBreak())
    story += event_revenue()
    story.append(hr())
    story += usage_metered()
    story.append(PageBreak())
    story += adjacent_revenue()
    story.append(hr())
    story += compliance_revenue()
    story.append(PageBreak())
    story += roadmap()
    story.append(PageBreak())
    story += demo_to_buyer()
    story.append(hr())
    story += risks()
    story.append(PageBreak())
    story += next_steps()
    story.append(PageBreak())
    story += appendix()

    doc.build(story, onFirstPage=first_page, onLaterPages=later_pages)
    print(f"Written: {OUT}")


if __name__ == "__main__":
    build()
