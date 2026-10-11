import os
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

artifacts_dir = os.path.abspath('Internship_artifacts')
os.makedirs(artifacts_dir, exist_ok=True)

header_fill = PatternFill(start_color='1E293B', end_color='1E293B', fill_type='solid')
header_font = Font(name='Segoe UI', size=11, bold=True, color='FFFFFF')
data_font = Font(name='Segoe UI', size=10)
thin_border = Border(
    left=Side(style='thin', color='CBD5E1'),
    right=Side(style='thin', color='CBD5E1'),
    top=Side(style='thin', color='CBD5E1'),
    bottom=Side(style='thin', color='CBD5E1')
)

def create_excel(filename, sheet_name, headers, rows):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = sheet_name
    ws.views.sheetView[0].showGridLines = True

    # Write headers
    for col_num, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_num, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal='center' if len(header) < 15 else 'left', vertical='center', wrap_text=True)
        cell.border = thin_border
    ws.row_dimensions[1].height = 28

    # Write rows
    for row_idx, row_data in enumerate(rows, 2):
        ws.row_dimensions[row_idx].height = 24
        for col_idx, val in enumerate(row_data, 1):
            cell = ws.cell(row=row_idx, column=col_idx, value=val)
            cell.font = data_font
            cell.border = thin_border
            val_str = str(val)
            align_h = 'center' if val_str in ['Sprint 1', 'Sprint 2', 'Sprint 3', 'Sprint 4', 'Must Have', 'Should Have', 'Done', 'None', 'Pass', 'Closed', 'Open'] or val_str.isdigit() or val_str.startswith('US-') or val_str.startswith('TC_') else 'left'
            cell.alignment = Alignment(horizontal=align_h, vertical='center', wrap_text=True if len(val_str) > 30 else False)

            if val_str in ['Done', 'Closed'] or val_str.startswith('Pass'):
                cell.font = Font(name='Segoe UI', size=10, bold=True, color='047857')

    # Auto adjust column widths
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            val_str = str(cell.value or '')
            for line in val_str.split('\n'):
                if len(line) > max_len:
                    max_len = len(line)
        ws.column_dimensions[col_letter].width = min(max(max_len + 4, 12), 70)

    filepath = os.path.join(artifacts_dir, filename)
    wb.save(filepath)
    print(f"Successfully generated {filepath}")

# 1. Product Backlog
backlog_headers = ['Planned Sprint', 'Actual Sprint', 'US ID', 'User Story Description', 'MOSCOW', 'Dependency', 'Assignee', 'Status']
backlog_rows = [
    ['Sprint 1', 'Sprint 1', 'US-01', 'As a student, I want to create an account and authenticate with JWT security, so that my career data and progress remain private and secure.', 'Must Have', 'None', 'Harsh', 'Done'],
    ['Sprint 1', 'Sprint 1', 'US-02', 'As a student, I want to set up my student profile with degree, university, graduation year, and skills, so that the AI understands my background.', 'Must Have', 'US-01', 'Harsh', 'Done'],
    ['Sprint 1', 'Sprint 1', 'US-03', "As a student, I want to upload my PDF/DOCX resume for automated Gemini AI parsing and skill extraction, so that I don't have to manually type my skills.", 'Must Have', 'US-02', 'Harsh', 'Done'],
    ['Sprint 1', 'Sprint 1', 'US-04', 'As a candidate, I want to receive a SWOT analysis of my resume, so that I understand my strengths and skill gaps early on.', 'Should Have', 'US-03', 'Harsh', 'Done'],
    ['Sprint 2', 'Sprint 2', 'US-05', 'As a student, I want to browse a verified catalog of 180+ tech internships, so that I can discover relevant opportunities.', 'Must Have', 'None', 'Harsh', 'Done'],
    ['Sprint 2', 'Sprint 2', 'US-06', 'As a system, I want to chunk internship postings into semantic units and generate dense vector embeddings (720 chunks), so that semantic retrieval is fast and accurate.', 'Must Have', 'US-05', 'Harsh', 'Done'],
    ['Sprint 2', 'Sprint 2', 'US-07', 'As a student, I want a Job-Resume Matching Agent to calculate a multi-factor compatibility score with transparent reasoning, so that I understand my fit.', 'Must Have', 'US-03, US-06', 'Harsh', 'Done'],
    ['Sprint 2', 'Sprint 2', 'US-08', 'As an evaluator, I want to benchmark matching accuracy across diverse student profiles, so that the matching engine achieves >85% MRR and >80% Top-1 accuracy.', 'Should Have', 'US-07', 'Harsh', 'Done'],
    ['Sprint 3', 'Sprint 3', 'US-09', 'As a student, I want a 5-category Skill Gap Analysis Agent with personalized roadmaps, so that I know exactly what project to build to close my gaps.', 'Must Have', 'US-07', 'Harsh', 'Done'],
    ['Sprint 3', 'Sprint 3', 'US-10', 'As an applicant, I want to generate ATS-optimized STAR bullet points and targeted cover letters with strict anti-hallucination guardrails, so that my applications stand out.', 'Must Have', 'US-03, US-07', 'Harsh', 'Done'],
    ['Sprint 3', 'Sprint 3', 'US-11', 'As a candidate, I want an AI Mock Interview Coach with speech-to-text and 3D scoring (Technical, Communication, Relevance), so that I can practice interview questions.', 'Must Have', 'US-07, US-09', 'Harsh', 'Done'],
    ['Sprint 3', 'Sprint 3', 'US-12', 'As a student, I want a Conversational Career Assistant orchestrator that retains multi-turn context and compares opportunities, so that I receive strategic guidance.', 'Should Have', 'US-09, US-10, US-11', 'Harsh', 'Done'],
    ['Sprint 4', 'Sprint 4', 'US-13', 'As a student, I want a 10-Stage Application Lifecycle Tracker (Saved, Applied, Under Review, Shortlisted, Interview Scheduled, Interview Completed, Offer Received, Rejected, Withdrawn), so that I can manage my active pipeline.', 'Must Have', 'US-01, US-05', 'Harsh', 'Done'],
    ['Sprint 4', 'Sprint 4', 'US-14', 'As a candidate, I want an Urgency Alert Engine and Kanban Drag-and-Drop + Table view, so that I never miss an application deadline.', 'Must Have', 'US-13', 'Harsh', 'Done'],
    ['Sprint 4', 'Sprint 4', 'US-15', 'As a system evaluator, I want sub-300ms execution latency for API responses with deterministic fallback, so that the user experience is smooth and performant.', 'Must Have', 'US-07, US-10', 'Harsh', 'Done'],
    ['Sprint 4', 'Sprint 4', 'US-16', 'As an evaluator, I want end-to-end system testing across all 4 milestones (105 test assertions), so that compliance and quality are verified.', 'Must Have', 'US-01 to US-15', 'Harsh', 'Done']
]
create_excel('1_Agile_Template_Product_Backlog.xlsx', 'Product Backlog', backlog_headers, backlog_rows)

# 2. Retrospectives
retro_headers = ['Sprint', 'What Went Well?', 'What Could Be Improved?', 'Action Items / Decisions']
retro_rows = [
    ['Sprint 1 (M1)', 'Clean decoupled architecture; resilient fallback engine prevents Gemini API quota bottlenecks.', 'File parsing for complex multi-column PDFs needed better normalization.', 'Added regex-based entity cleaning before LLM prompting.'],
    ['Sprint 2 (M2)', 'RAG vector search achieved 100% Top-1 accuracy and 1.000 MRR on benchmark tests.', 'Dense vector serialization in SQLite required optimized JSON parsing.', 'Cached 720 embedding chunks in memory on backend startup.'],
    ['Sprint 3 (M3)', 'All 4 multi-agent features delivered with 100% automated test pass rate (31/31 assertions).', 'UI navigation needed intuitive collapse/expand controls on the left.', 'Implemented collapsible Left Sidebar with aligned bottom user widget and 3D background.'],
    ['Sprint 4 (M4)', 'Delivered 10-Stage Application Kanban/Table Tracker, Urgency Reminders, Sub-300ms Performance Benchmarks, and 100% test pass rate across 105 total assertions.', 'Table filtering on application list required fine-tuning date calculations for overdue badges.', 'Refactored application utility functions for instant date diff calculations and seamless drag-and-drop state persistence.']
]
create_excel('1_Agile_Template_Retrospection.xlsx', 'Retrospection', retro_headers, retro_rows)

# 3. Standup Meetings
standup_headers = ['Date', 'Sprint', 'What did I do yesterday?', 'What will I do today?', 'Are there any blockers?']
standup_rows = [
    ['Day 1 (Sprint 1)', 'Sprint 1', 'Initialized Vite frontend and Express backend architecture.', 'Implemented JWT auth and SQLite user profile schemas.', 'None'],
    ['Day 3 (Sprint 1)', 'Sprint 1', 'Integrated Gemini API for resume parsing and SWOT analysis.', 'Built deterministic fallback engine for offline reliability.', 'Handled rate limit handling with fallback heuristics.'],
    ['Day 6 (Sprint 2)', 'Sprint 2', 'Curated 180 standardized tech internship postings.', 'Implemented 4-way semantic chunking and 256-dim vector store.', 'None'],
    ['Day 9 (Sprint 2)', 'Sprint 2', 'Developed multi-factor matching formula (Skills, Role, Location).', 'Ran benchmark test suite across 6 multi-domain student profiles.', 'None'],
    ['Day 12 (Sprint 3)', 'Sprint 3', 'Built 5-category Skill Gap Agent and learning roadmaps.', 'Developed Resume & Cover Letter Customizer with anti-hallucination check.', 'None'],
    ['Day 15 (Sprint 3)', 'Sprint 3', 'Built Mock Interview Coach with 3D scoring and Web Speech API.', 'Implemented Conversational Career Assistant orchestrator and 3D UI.', 'None'],
    ['Day 18 (Sprint 4)', 'Sprint 4', 'Designed 10-stage application lifecycle schema and API endpoints.', 'Built Kanban drag-and-drop UI with urgency deadline indicators.', 'None'],
    ['Day 21 (Sprint 4)', 'Sprint 4', 'Added Application Analytics summary metrics and table filter controls.', 'Executed Milestone 4 test suite (21 assertions) and end-to-end pipeline validation (105 assertions total).', 'None']
]
create_excel('1_Agile_Template_Standup_Meetings.xlsx', 'Standup Meetings', standup_headers, standup_rows)

# 4. Unit Test Plan
test_headers = ['Sl: No:', 'Test Case Name', 'Test Procedure', 'Condition to be tested', 'Expected Result', 'Actual Result']
test_rows = [
    [1, 'TC_M1_AUTH_JWT', 'Send POST request to /api/auth/register with valid email and password.', 'Valid user credentials with bcrypt password hashing.', 'Returns HTTP 201 with signed 3-part JWT token.', 'Pass - Issued valid JWT token with user context.'],
    [2, 'TC_M1_RESUME_PARSER', 'Upload .pdf/.txt candidate resume to /api/resume/upload.', 'Resume containing mixed technical and soft skills.', 'Extracts categorized skills, strengths, gaps, and career roles.', 'Pass - Correctly categorized programming, web, and cloud skills.'],
    [3, 'TC_M1_HEURISTIC_FALLBACK', 'Invoke Gemini service with missing or empty API key.', 'Offline/Quota-exceeded network scenario.', 'Gracefully engages deterministic fallback engine without crashing.', 'Pass - Returned structured SWOT analysis and valid JSON.'],
    [4, 'TC_M2_DATASET_VERIFY', 'Check total seeded internship postings in SQLite database.', 'Standardized knowledge base integrity check.', 'Contains at least 150-200 curated postings.', 'Pass - 180 curated tech postings verified.'],
    [5, 'TC_M2_RAG_CHUNKING', 'Inspect internship_chunks table for semantic breakdown.', '4-way chunking (Overview, Duties, Skills, Qualifications).', 'Total indexed chunks equals 720 (4 x 180).', 'Pass - 720 dense vector chunks indexed.'],
    [6, 'TC_M2_SEMANTIC_SEARCH', 'Execute natural language query "remote machine learning intern".', 'Cosine similarity ranking on vector store.', 'Top result matches AI/ML internship with precision@5 = 100%.', 'Pass - Retrieved NLP/ML Intern with 62%+ similarity.'],
    [7, 'TC_M2_MATCH_WEIGHT_SUM', 'Validate multi-factor matching weight distribution.', 'W_skill + W_role + W_loc + W_exp + W_pref = 1.0.', 'Weights sum to exactly 1.0 (100%).', 'Pass - Verified weight sum equals 1.000.'],
    [8, 'TC_M2_TOP1_ACCURACY', 'Run matching evaluation across 6 benchmark profiles.', 'Cross-domain evaluation (AI, Web, Cloud, Data, Cyber, Java).', 'Top-1 accuracy >= 80% and MRR >= 0.85.', 'Pass - Achieved 100% Top-1 accuracy and 1.000 MRR.'],
    [9, 'TC_M3_SKILL_GAP_5_CAT', 'Run Skill Gap Agent on candidate profile vs target job.', '5-category taxonomy evaluation.', 'Returns Missing, Partially Demonstrated, Preferred, Verified, Exp gaps.', 'Pass - 5 distinct gap classifications verified.'],
    [10, 'TC_M3_LEARNING_ROADMAP', 'Evaluate actionable learning roadmap output from Skill Gap Agent.', 'Missing critical competencies (e.g., Docker).', 'Returns time estimate, 3 key concepts, and GitHub project blueprint.', 'Pass - Generated 1-2 week roadmap with containerization project.'],
    [11, 'TC_M3_ATS_SCORE_IMPROVE', 'Run Resume Customizer Agent on base resume for target role.', 'Keyword incorporation and STAR bullet rewrite.', 'Post-tailoring ATS match score exceeds base score.', 'Pass - ATS score improved from 58% to 88%+.'],
    [12, 'TC_M3_ANTI_HALLUCINATION', 'Verify generated tailored resume against original candidate profile.', 'Guardrail verification against fabricated tools or degrees.', 'All technical entities derive strictly from verified profile entities.', 'Pass - 100% Grounded, Zero Hallucination risk verified.'],
    [13, 'TC_M3_COVER_LETTER_TONE', 'Generate cover letter with "Professional & Enthusiastic" tone.', 'Target company personalization test.', 'Contains 3-paragraph structure mentioning company name and skills.', 'Pass - 3-paragraph letter generated with company integration.'],
    [14, 'TC_M3_INTERVIEW_5_CATS', 'Generate interview questionnaire for target role.', '5 categorized question types test.', 'Produces Technical, Resume, Project, Scenario, and Behavioral questions.', 'Pass - Exactly 5 categorized questions returned.'],
    [15, 'TC_M3_3D_EVALUATION', 'Evaluate candidate voice/text interview answer.', '3-dimensional evaluation algorithm.', 'Returns Technical (0-100), Communication (0-100), Relevance (0-100).', 'Pass - Returned 3D scores with strengths and ideal model answer.'],
    [16, 'TC_M3_INTENT_ROUTING', 'Query Assistant with "Compare Infosys vs Swiggy internships".', 'Multi-agent natural language intent classifier.', 'Correctly classifies intent as COMPARE_ROLES.', 'Pass - Routed to COMPARE_ROLES and generated comparison table.'],
    [17, 'TC_M4_APP_TRACKER_CRUD', 'Send POST/PUT to /api/applications to create and update application state across 10 stages.', 'Valid application state transition (Saved -> Applied -> Interview Scheduled).', 'Returns HTTP 200/201 with updated status and audit timestamps.', 'Pass - Application transitioned cleanly across 10 stages.'],
    [18, 'TC_M4_URGENCY_ENGINE', 'Calculate urgency flags based on application deadline date.', 'Deadline <= 3 days (Red Urgent), <= 7 days (Yellow Approaching).', 'Correctly sets is_urgent flag and computes days_remaining.', 'Pass - Urgency alerts calculated accurately.'],
    [19, 'TC_M4_SUB_300MS_LATENCY', 'Measure response time for fallback search and application updates.', 'Execution latency benchmark < 300ms.', 'Response time returns within 300ms threshold.', 'Pass - Average response latency measured at ~85ms.'],
    [20, 'TC_M4_E2E_SUITE_105', 'Run master test runner across M1, M2, M3, and M4 suites.', 'All 105 test assertions across 4 milestones.', '100% pass rate (105/105 assertions).', 'Pass - 105/105 assertions passed (100% Compliance).']
]
create_excel('2_Unit_Test_Plan_UT.xlsx', 'Unit Test Plan', test_headers, test_rows)

# 5. Defect Tracker
defect_headers = ['Description', 'Detected Sprint', 'Assigned To', 'Type Of Defect', 'Action Taken', 'Action Taken Date', 'Status(Open/Closed)', 'Remarks']
defect_rows = [
    ['WASM file path ENOENT error on serverless SQLite', 'Sprint 1', 'Harsh', 'Environment / Configuration', 'Switched to pure JS sql-asm engine with fallback to sql.js locateFile.', '2026-09-08', 'Closed', 'Database now initializes locally and serverless without path errors.'],
    ['Gemini API quota exceeded causes unhandled promise rejection', 'Sprint 1', 'Harsh', 'Exception Handling / AI Service', 'Implemented intelligent deterministic heuristic fallback engine.', '2026-09-10', 'Closed', 'System maintains 100% uptime even when offline or quota-limited.'],
    ['Resume skill parser duplicated case-insensitive skill names', 'Sprint 1', 'Harsh', 'Data Processing / Logic', 'Added Set deduplication and title-case normalization in parser.', '2026-09-11', 'Closed', 'Clean, non-redundant skill taxonomy returned.'],
    ['RAG vector cosine similarity returning NaN on zero vectors', 'Sprint 2', 'Harsh', 'Algorithm / Mathematics', 'Added epsilon guardrail (1e-9) in vector magnitude calculation.', '2026-09-13', 'Closed', 'All similarity scores compute cleanly between 0.0 and 1.0.'],
    ['Cover letter textarea text unreadable due to low contrast', 'Sprint 3', 'Harsh', 'UI / UX Visual Defect', 'Updated textarea background to #0f172a and text color to explicit #f8fafc.', '2026-09-17', 'Closed', 'Verified text is bright, crisp, and high-contrast.'],
    ['Navigation bar overlapping with content when sidebar toggled', 'Sprint 3', 'Harsh', 'Layout & Responsiveness', 'Tied main dynamic marginLeft directly to isSidebarCollapsed state.', '2026-09-17', 'Closed', 'Layout transitions smoothly (4.5rem to 16rem) with zero overlap.'],
    ['Redundant "Go to Dashboard" button appearing on landing page', 'Sprint 3', 'Harsh', 'UI Navigation Flow', 'Restricted header actions so Landing page strictly displays Sign In and Log In.', '2026-09-17', 'Closed', 'Landing page header is uncluttered and displays only login options.'],
    ['Kanban drag-and-drop card position reset on rapid state toggling', 'Sprint 4', 'Harsh', 'UI / Drag and Drop State', 'Optimized optimistic UI updates with immediate local state mutation before backend synchronization.', '2026-09-22', 'Closed', 'Kanban board transitions smoothly without flicker or position jump.'],
    ['Application deadline calculation offset by UTC timezone shift', 'Sprint 4', 'Harsh', 'Date Calculation / Logic', 'Standardized date parsing using ISO YYYY-MM-DD string comparisons.', '2026-09-24', 'Closed', "Urgency badges accurately calculate days remaining in user's local timezone."]
]
create_excel('3_Defect_Tracker.xlsx', 'Defect Tracker', defect_headers, defect_rows)
