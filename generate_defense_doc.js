/**
 * SIYASAT System Architecture & Defense Summary Document Generator
 * Branch: prototype-3 | Release: v1.0-ReleaseCandidate | September 2026
 * Uses: docx (already in backend/node_modules)
 */

const path = require('path');
const fs   = require('fs');

// Resolve docx from backend/node_modules (already installed as devDependency)
const docxPath = path.join(__dirname, 'backend', 'node_modules', 'docx');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, ShadingType, VerticalAlign,
  Header, Footer, PageNumber, NumberFormat,
  TableOfContents, StyleLevel, LevelFormat,
  UnderlineType, PageBreak, convertInchesToTwip
} = require(docxPath);

// ──────────────────────────────────────────────────────────────────────────────
// COLOUR PALETTE
// ──────────────────────────────────────────────────────────────────────────────
const MAROON   = '800000';
const WHITE    = 'FFFFFF';
const LIGHT_BG = 'FFF8F8';
const BORDER   = 'CCCCCC';
const AMBER_BG = 'FFF8E1';
const AMBER_BD = 'F57C00';
const GRAY_BG  = 'F5F5F5';
const DARK_TXT = '1A1A1A';
const MED_TXT  = '444444';

// ──────────────────────────────────────────────────────────────────────────────
// TYPOGRAPHY HELPERS
// ──────────────────────────────────────────────────────────────────────────────
const pt = (n) => n * 2; // half-points to points

const run = (text, opts = {}) => new TextRun({
  text,
  font:  opts.font  || 'Georgia',
  size:  opts.size  || pt(11),
  bold:  opts.bold  || false,
  color: opts.color || DARK_TXT,
  italics: opts.italic || false,
  underline: opts.underline ? { type: UnderlineType.SINGLE } : undefined,
});

const monoRun = (text, opts = {}) => new TextRun({
  text,
  font:  'Courier New',
  size:  opts.size  || pt(9),
  bold:  opts.bold  || false,
  color: opts.color || '2B2B2B',
});

// ──────────────────────────────────────────────────────────────────────────────
// PARAGRAPH HELPERS
// ──────────────────────────────────────────────────────────────────────────────
const spacingAfter = (after = 120, before = 0) => ({ before, after });

const para = (text, opts = {}) => new Paragraph({
  children: [run(text, opts)],
  alignment: opts.align || AlignmentType.LEFT,
  spacing: opts.spacing || spacingAfter(opts.after || 120, opts.before || 0),
  indent: opts.indent ? { left: convertInchesToTwip(opts.indent) } : undefined,
});

const heading1 = (text) => new Paragraph({
  children: [
    new TextRun({
      text: '  ' + text + '  ',
      font: 'Arial',
      size: pt(15),
      bold: true,
      color: WHITE,
    }),
  ],
  shading: { type: ShadingType.SOLID, color: MAROON, fill: MAROON },
  spacing: spacingAfter(200, 360),
  heading: HeadingLevel.HEADING_1,
});

const heading2 = (text) => new Paragraph({
  children: [
    new TextRun({ text, font: 'Arial', size: pt(12), bold: true, color: MAROON }),
  ],
  spacing: spacingAfter(100, 240),
  border: {
    bottom: { style: BorderStyle.SINGLE, size: 4, color: MAROON },
  },
  heading: HeadingLevel.HEADING_2,
});

const heading3 = (text) => new Paragraph({
  children: [
    new TextRun({ text, font: 'Arial', size: pt(11), bold: true, color: '5C0000' }),
  ],
  spacing: spacingAfter(80, 160),
  heading: HeadingLevel.HEADING_3,
});

const bullet = (text, level = 0, bold = false) => new Paragraph({
  children: [run(text, { bold })],
  bullet: { level },
  spacing: spacingAfter(60, 0),
  indent: { left: convertInchesToTwip(0.25 * (level + 1)), hanging: convertInchesToTwip(0.2) },
});

const subBullet = (text) => bullet(text, 1);

const labeledPara = (label, text) => new Paragraph({
  children: [
    run(label + ': ', { bold: true, color: MAROON }),
    run(text),
  ],
  spacing: spacingAfter(80),
});

const codePara = (text) => new Paragraph({
  children: [monoRun(text)],
  spacing: spacingAfter(40, 0),
  shading: { type: ShadingType.SOLID, color: GRAY_BG, fill: GRAY_BG },
  indent: { left: convertInchesToTwip(0.3) },
  border: {
    left: { style: BorderStyle.THICK, size: 8, color: MAROON },
  },
});

const hr = () => new Paragraph({
  children: [run('')],
  spacing: spacingAfter(40, 40),
  border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: BORDER } },
});

const blank = (n = 1) => Array.from({ length: n }, () => new Paragraph({ children: [run('')], spacing: spacingAfter(60) }));

// ──────────────────────────────────────────────────────────────────────────────
// TABLE HELPERS
// ──────────────────────────────────────────────────────────────────────────────
const cell = (text, opts = {}) => new TableCell({
  children: [new Paragraph({
    children: [new TextRun({
      text,
      font: opts.font || 'Arial',
      size: opts.size || pt(10),
      bold: opts.bold || false,
      color: opts.color || DARK_TXT,
    })],
    alignment: opts.align || AlignmentType.LEFT,
    spacing: spacingAfter(60, 60),
  })],
  shading: opts.bg ? { type: ShadingType.SOLID, color: opts.bg, fill: opts.bg } : undefined,
  verticalAlign: VerticalAlign.CENTER,
  borders: {
    top:    { style: BorderStyle.SINGLE, size: 4, color: BORDER },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
    left:   { style: BorderStyle.SINGLE, size: 4, color: BORDER },
    right:  { style: BorderStyle.SINGLE, size: 4, color: BORDER },
  },
  margins: { top: 80, bottom: 80, left: 120, right: 120 },
  columnSpan: opts.span || 1,
});

const headerCell = (text, opts = {}) => cell(text, { bold: true, bg: MAROON, color: WHITE, ...opts });

const buildTable = (headers, rows, colWidths) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({
      children: headers.map((h, i) => headerCell(h, { size: pt(10) })),
      tableHeader: true,
    }),
    ...rows.map(row => new TableRow({
      children: row.map((v, i) => cell(v)),
    })),
  ],
  margins: { top: 0, bottom: 0 },
});

// ──────────────────────────────────────────────────────────────────────────────
// AMBER ADVISORY BOX (simulated via shaded paragraphs)
// ──────────────────────────────────────────────────────────────────────────────
const amberBox = (title, lines) => [
  new Paragraph({
    children: [new TextRun({ text: '  ⚠  ' + title, font: 'Arial', size: pt(10), bold: true, color: '7B4600' })],
    shading: { type: ShadingType.SOLID, color: AMBER_BG, fill: AMBER_BG },
    spacing: spacingAfter(0, 160),
    border: {
      top:   { style: BorderStyle.SINGLE, size: 8, color: AMBER_BD },
      left:  { style: BorderStyle.THICK, size: 16, color: AMBER_BD },
      right: { style: BorderStyle.SINGLE, size: 8, color: AMBER_BD },
    },
    indent: { left: 120 },
  }),
  ...lines.map(l => new Paragraph({
    children: [new TextRun({ text: l, font: 'Georgia', size: pt(10), color: '5D3B00' })],
    shading: { type: ShadingType.SOLID, color: AMBER_BG, fill: AMBER_BG },
    spacing: spacingAfter(0),
    indent: { left: 240 },
    border: {
      left:   { style: BorderStyle.THICK, size: 16, color: AMBER_BD },
      right:  { style: BorderStyle.SINGLE, size: 8, color: AMBER_BD },
      bottom: { style: BorderStyle.NONE },
    },
  })),
  new Paragraph({
    children: [new TextRun({ text: '', size: pt(10) })],
    shading: { type: ShadingType.SOLID, color: AMBER_BG, fill: AMBER_BG },
    spacing: spacingAfter(200),
    border: {
      left:   { style: BorderStyle.THICK, size: 16, color: AMBER_BD },
      right:  { style: BorderStyle.SINGLE, size: 8, color: AMBER_BD },
      bottom: { style: BorderStyle.SINGLE, size: 8, color: AMBER_BD },
    },
  }),
];

// ──────────────────────────────────────────────────────────────────────────────
// Q&A PANEL BOX
// ──────────────────────────────────────────────────────────────────────────────
const qaBlock = (question, answer) => [
  new Paragraph({
    children: [new TextRun({ text: '  Q:  ' + question, font: 'Arial', size: pt(10), bold: true, color: WHITE })],
    shading: { type: ShadingType.SOLID, color: '5C1A1A', fill: '5C1A1A' },
    spacing: spacingAfter(0, 240),
    border: { left: { style: BorderStyle.THICK, size: 16, color: MAROON } },
    indent: { left: 120 },
  }),
  new Paragraph({
    children: [new TextRun({ text: '  A:  ' + answer, font: 'Georgia', size: pt(10), color: MED_TXT })],
    shading: { type: ShadingType.SOLID, color: 'FBF4F4', fill: 'FBF4F4' },
    spacing: spacingAfter(200),
    border: { left: { style: BorderStyle.THICK, size: 16, color: MAROON } },
    indent: { left: 120 },
  }),
];

// ──────────────────────────────────────────────────────────────────────────────
// COVER / TITLE PAGE
// ──────────────────────────────────────────────────────────────────────────────
const coverPage = [
  new Paragraph({ children: [run('')], spacing: spacingAfter(800) }),

  new Paragraph({
    children: [new TextRun({ text: 'SIYASAT', font: 'Arial', size: pt(38), bold: true, color: MAROON })],
    alignment: AlignmentType.CENTER,
    spacing: spacingAfter(80),
  }),
  new Paragraph({
    children: [new TextRun({
      text: 'Agricultural and Biosystems Engineering Research Repository',
      font: 'Georgia', size: pt(16), bold: false, color: '5C0000', italics: true,
    })],
    alignment: AlignmentType.CENTER,
    spacing: spacingAfter(80),
  }),

  hr(),

  new Paragraph({
    children: [new TextRun({
      text: 'System Architecture, Technical Specifications & Defense Panel Briefing',
      font: 'Arial', size: pt(13), bold: true, color: MED_TXT,
    })],
    alignment: AlignmentType.CENTER,
    spacing: spacingAfter(400),
  }),

  buildTable(
    [],
    [
      ['Institution',  'Central Luzon State University (CLSU)'],
      ['Department',   'Agricultural and Biosystems Engineering (DABE)'],
      ['Target Branch','prototype-3'],
      ['Release',      'v1.0-ReleaseCandidate'],
      ['Document Date','September 2026'],
      ['Classification','Academic Research / Defense Panel Briefing'],
    ],
    []
  ),

  new Paragraph({ children: [new PageBreak()] }),
];

// ──────────────────────────────────────────────────────────────────────────────
// SECTION 1 – EXECUTIVE OVERVIEW & PROBLEM DOMAIN
// ──────────────────────────────────────────────────────────────────────────────
const section1 = [
  heading1('Section 1  —  Executive Overview & Problem Domain'),

  heading2('1.1  Institutional Context'),
  para(
    'The Department of Agricultural and Biosystems Engineering (DABE) at Central Luzon State University (CLSU) ' +
    'produces a significant volume of undergraduate and graduate research annually. Historically, these manuscripts ' +
    'were stored in physical binders, fragmented institutional drives, or spreadsheet-based catalogs, creating ' +
    'three acute operational problems:'
  ),
  bullet('Manual cataloging: Faculty advisers and department secretaries invested disproportionate effort tagging, ' +
         'filing, and cross-referencing physical and digital paper copies without a unified metadata standard.'),
  bullet('Thematic silos: Related research spanning land and water resources, post-harvest processing, and ' +
         'agri-informatics existed in disconnected repositories, making thematic overlap invisible to incoming researchers.'),
  bullet('Fragmented gap discovery: Students were expected to independently survey literature from scratch, ' +
         'missing existing internal departmental work that could directly inform or extend their research.'),

  heading2('1.2  Core Solution — SIYASAT'),
  para(
    'SIYASAT (Sistema ng Impormasyon para sa Yaman at Agham ng Agrikultura at Teknolohiya) is a full-stack, ' +
    'institutionally deployed academic research repository built specifically for CLSU-DABE. It delivers:'
  ),
  bullet('Automated thematic clustering — local overlap-coefficient math groups related manuscripts into thematic ' +
         'folder clusters without requiring any cloud-based vector embedding service.', 0, false),
  bullet('Curated engineering specialization tracks — standardized dropdowns map submissions to CLSU DABE ' +
         'academic branches, ensuring consistent institutional taxonomy.', 0, false),
  bullet('On-demand AI research gap extraction — Groq LLM inference surfaces structured research gaps from ' +
         'individual paper abstracts, enriched with OpenAlex academic reference linking.', 0, false),
  bullet('Role-stratified access control — granular RBAC ensures public browsing, controlled faculty ingestion, ' +
         'and administrator-only data mutation without requiring a dedicated IAM service.', 0, false),

  heading2('1.3  System Topology (High-Level)'),
  buildTable(
    ['Layer', 'Technology', 'Primary Role'],
    [
      ['Frontend',    'React 18 + Tailwind CSS',                'SPA — all repository views, auth modals, and AI result panels'],
      ['Backend API', 'Node.js 18 + Express 4',                 '1,124-line monolith handling auth, upload, clustering, and AI routes'],
      ['Database',    'PostgreSQL 16',                          'Persistent storage: users, theses, cluster metadata'],
      ['Auth Layer',  'JWT (jsonwebtoken) + bcryptjs',           '8-hour access tokens, bcrypt-hashed credentials'],
      ['AI Inference','Groq API (openai/gpt-oss-120b)',          'Structured JSON gap extraction at temperature 0.2'],
      ['Reference API','OpenAlex REST API',                     'Post-processing: live DOI-linked scholarly literature matching'],
      ['File Storage', 'Multer + local disk (/uploads/)',        'PDF ingestion, 25 MB cap, per-thesis file serve'],
    ],
    []
  ),

  ...blank(),
  new Paragraph({ children: [new PageBreak()] }),
];

// ──────────────────────────────────────────────────────────────────────────────
// SECTION 2 – MATHEMATICAL CLUSTERING ENGINE
// ──────────────────────────────────────────────────────────────────────────────
const section2 = [
  heading1('Section 2  —  Mathematical Clustering & Indexing Engine (Panel Defense Focus)'),

  heading2('2.1  Algorithm: Szymkiewicz-Simpson Weighted Overlap Coefficient'),
  para(
    'The clustering engine does NOT use cosine similarity, TF-IDF, or external vector databases. Instead, ' +
    'SIYASAT implements the Szymkiewicz-Simpson overlap coefficient — a containment-aware set metric — applied ' +
    'over morphologically stemmed, stopword-filtered token sets extracted from curated metadata fields.'
  ),

  heading3('2.1.1  Formal Definition'),
  para('Let A and B be weighted token sets derived from two thesis records. The weighted overlap score is:'),
  codePara('  overlap(A, B) = Σ w(t) for t ∈ (A ∩ B)  /  min( Σ w(A), Σ w(B) )'),
  para('Where w(t) is the field-specific weight assigned to token t.'),

  heading3('2.1.2  Metadata Field Token Weights'),
  buildTable(
    ['Metadata Field', 'Token Weight', 'Rationale'],
    [
      ['Title',    '1.5×', 'High discriminating power — captures the research subject concisely'],
      ['Keywords', '1.5×', 'Curated by authors — directly encodes domain and methodology tags'],
      ['Abstract', '1.0×', 'Contextual detail — broader vocabulary reduces precision, hence lower weight'],
    ],
    []
  ),

  heading3('2.1.3  Morphological Suffix Stemmer'),
  para(
    'Tokens pass through a lightweight suffix-removal stemmer before set construction. This improves recall ' +
    'across inflected academic vocabulary (e.g., "irrigated" → "irrig", "systems" → "system"):'
  ),
  codePara("  suffix_strip = /(ing|ed|ion|s|es|or|ator|ated|ation|er|ive|al|e)$/"),
  codePara("  stem(w) = w.replace(suffix_strip, '') if result.length >= 3 else w"),

  heading3('2.1.4  Clustering Threshold & Folder Assignment Logic'),
  para('The decision boundary is defined as:'),
  bullet('overlap_score ≥ 0.50 (≥ 50%):  New paper is assigned to the cluster_group of its highest-scoring match.'),
  bullet('overlap_score < 0.50:           Paper is treated as a new thematic anchor; its first keyword becomes the folder name.'),
  bullet('No keywords present:             Three title tokens are title-cased and concatenated as "X Y Z Domain".'),
  bullet('Fallback default:                "Independent Studies" folder for keyword-absent papers with no title tokens.'),

  heading3('2.1.5  Academic Stopword Filter'),
  para('26 domain-generic stopwords are removed before tokenization to prevent noise clustering on common academic filler terms:'),
  codePara("  STOPWORDS = { 'the','and','of','in','to','a','is','for','with','on','by','an',"),
  codePara("                'study','research','analysis','effect','using','based','from','as',"),
  codePara("                'at','this','that','which','evaluation','development','performance','design' }"),

  heading2('2.2  Architectural Defense Rationale'),
  para('The panel may challenge the choice of Szymkiewicz-Simpson over industry-standard alternatives. The technical justification is comprehensive:'),
  buildTable(
    ['Criterion', 'Szymkiewicz-Simpson (SIYASAT)', 'Cosine Similarity (TF-IDF)', 'External Vector Embeddings'],
    [
      ['Execution Speed',     'Sub-millisecond per pair (set operations)', 'Milliseconds (sparse matrix product)', 'Seconds per API call (GPU inference)'],
      ['Infrastructure Req.', 'Zero — pure JavaScript Set operations',    'Requires numpy / math libraries',      'Requires embedding model or paid API'],
      ['Determinism',         'Fully deterministic, identical inputs → identical cluster', 'Deterministic but corpus-dependent', 'Model version drift can change clusters'],
      ['Offline Reliability', 'Fully offline — no external calls needed', 'Offline after corpus build',           'Fails without internet / API quota'],
      ['API Quota Risk',      'None',                                      'None',                                 'Billing exposure on every upload'],
      ['Asymmetric Coverage', 'Explicitly models subset containment',      'Treats both docs symmetrically',       'Embeds semantic meaning — over-broad for exact metadata'],
      ['ABE Suitability',     'High — small curated metadata sets benefit from containment logic', 'Medium — requires larger corpus', 'Low — overkill for institutional metadata'],
    ],
    []
  ),

  heading2('2.3  Noise Prevention via Metadata-Only Indexing'),
  para(
    'The clustering engine deliberately indexes only structured metadata fields (title, keywords, abstract) ' +
    'rather than parsing raw PDF manuscript content. This architectural decision is intentional and defensible:'
  ),
  bullet('PDF full-text extraction introduces significant noise: page headers, running footers, figure captions, ' +
         'table labels, reference lists, and OCR artifacts corrupt the token set.'),
  bullet('Academic abstracts are author-distilled summaries — they represent the intended semantic scope of the paper ' +
         'with higher signal-to-noise ratio than unprocessed manuscript body text.'),
  bullet('Keywords are explicitly curated by the submitting author to encode domain classification, making them ' +
         'the most precise available signal for thematic clustering.'),
  bullet('Multer enforces a 25 MB PDF-only file gate; PDFs are stored for download but never parsed for clustering.'),

  heading2('2.4  Duplicate Detection Sub-System'),
  para(
    'A separate Jaccard-based duplicate detection layer operates before every thesis ingestion ' +
    '(POST /api/theses). It uses a 65%/35% weighted title-to-abstract ratio with a 30% alert threshold:'
  ),
  codePara('  dupScore = round((titleJaccard × 0.65 + abstractJaccard × 0.35) × 100)'),
  codePara('  if dupScore >= 30: HTTP 409 Conflict → adviser sees "Possible Duplicate Detected!" banner'),
  codePara('  if adviser clicks "Proceed Anyway": ignoreDuplicate=true bypasses gate'),

  ...blank(),
  new Paragraph({ children: [new PageBreak()] }),
];

// ──────────────────────────────────────────────────────────────────────────────
// SECTION 3 – AUTHENTICATION, RBAC & ROUTE SECURITY
// ──────────────────────────────────────────────────────────────────────────────
const section3 = [
  heading1('Section 3  —  Authentication, RBAC & Route Security'),

  heading2('3.1  JWT-Based Session Architecture'),
  para('All authenticated sessions use JSON Web Tokens (RFC 7519) signed with HS256:'),
  buildTable(
    ['JWT Property', 'Value / Implementation'],
    [
      ['Algorithm',   'HS256 (HMAC-SHA256)'],
      ['Secret Key',  'Environment variable JWT_SECRET (backend/.env)'],
      ['Token Expiry','8 hours from issuance'],
      ['Payload',     '{ id, email, role, full_name }'],
      ['Storage',     'Client localStorage (key: siyasat_token)'],
      ['Validation',  'authenticateToken middleware on every protected route'],
    ],
    []
  ),

  heading2('3.2  Role-Based Access Control (RBAC) Matrix'),
  buildTable(
    ['Capability', 'Public / Guest', 'Faculty Adviser', 'System Administrator'],
    [
      ['Browse Repository (list/search papers)',      '✅ Full Access',  '✅ Full Access',   '✅ Full Access'],
      ['View Individual Paper Details',              '✅ Full Access',  '✅ Full Access',   '✅ Full Access'],
      ['Download Paper PDF',                         '✅ Full Access',  '✅ Full Access',   '✅ Full Access'],
      ['Run AI Gap Analysis on a Paper',             '✅ Allowed',      '✅ Allowed',       '🚫 Restricted — quota conservation'],
      ['Upload / Ingest New Thesis',                 '🚫 Denied',       '✅ Allowed',        '✅ Allowed'],
      ['Edit / Update Existing Thesis Metadata',     '🚫 Denied',       '✅ Own uploads',   '✅ All records'],
      ['Delete Thesis Record',                       '🚫 Denied',       '🚫 Disabled',       '✅ Sole authority'],
      ['Trigger Recluster-All Engine',               '🚫 Denied',       '🚫 Denied',         '✅ Admin-only route'],
      ['View / Manage User Accounts',                '🚫 Denied',       '🚫 Denied',         '✅ Admin-only route'],
      ['Change User Roles / Block Accounts',         '🚫 Denied',       '🚫 Denied',         '✅ Admin-only route'],
    ],
    []
  ),

  heading2('3.3  Role-Specific Architectural Decisions'),

  heading3('3.3.1  Public / Guest Access'),
  para(
    'SIYASAT enforces open public access to all read-only repository operations without requiring registration. ' +
    'This is a deliberate institutional policy: incoming students and visiting researchers should be able to ' +
    'discover CLSU-DABE research without bureaucratic gatekeeping. All write-path routes are protected by ' +
    'authenticateToken middleware that returns HTTP 401 for unauthenticated requests.'
  ),
  bullet('Registration endpoint (POST /api/auth/register) is intentionally disabled in production.', 0, true),
  bullet('Accounts are provisioned exclusively by the System Administrator through the Accounts Management panel.'),

  heading3('3.3.2  Faculty Adviser — Ingestion Gateway'),
  para(
    'Advisers authenticate through the login modal and are presented with the "WORKS" tab — a filtered view ' +
    'of theses they personally uploaded (uploaded_by = req.user.id). The 2-second visual loading gateway ' +
    'on the dashboard prevents flash-of-unauthorized-content on token hydration.'
  ),
  bullet('Thesis deletion is strictly disabled for ADVISER roles at the API level (HTTP 403 response).'),
  bullet('Branch dropdown forces selection from CLSU DABE standardized tracks, preventing free-text category pollution.'),
  bullet('Duplicate detection fires automatically; adviser must consciously click "Proceed Anyway" to override.'),

  heading3('3.3.3  System Administrator'),
  para(
    'Administrators hold the maximum privilege tier. The sole-authority deletion pattern with relational cleanup ' +
    '(file_path unlink + DB record removal) is enforced at the API handler level:'
  ),
  codePara("  DELETE /api/theses/:id → authenticateToken → role check (ADMIN only)"),
  codePara("                        → pool.query('DELETE FROM theses WHERE id = $1')"),
  codePara("                        → fs.unlinkSync(file_path) if file exists on disk"),
  para('AI Gap Analysis (POST /api/theses/:id/analyze-gap and POST /api/analyze-single-gap) returns HTTP 403 for ADMIN tokens to conserve the institutional Groq API quota budget.'),

  heading2('3.4  Route Guards & Browser Navigation Hardening'),
  para(
    'The React SPA implements a multi-layer route hardening strategy to prevent empty screens or zombie ' +
    'state on browser back/forward navigation:'
  ),
  bullet('JWT expiry check on startup: The getValidSessionUser() helper decodes the stored JWT payload, reads ' +
         'exp, and clears localStorage if the token is expired before any state hydration.'),
  bullet('popstate listener: window.addEventListener("popstate", handlePopState) intercepts browser back-button ' +
         'events and re-resolves the application route from window.location.pathname, preventing blank screen rendering.'),
  bullet('ProtectedRoute component: Wraps restricted pages; triggers onDenied() callback immediately when ' +
         'isAllowed is false, redirecting to home or the auth modal.'),
  bullet('URL state sync: handleNavigate() calls window.history.pushState() on every SPA navigation, keeping ' +
         'browser URL in sync with internal page state for bookmark and direct-link correctness.'),

  heading2('3.5  Login Security — 5-Attempt Lockout Protocol'),
  buildTable(
    ['Attempt Count', 'System Response'],
    [
      ['1 – 4 failed attempts', 'Decrement counter stored; response: "X attempt(s) remaining before lockout"'],
      ['5th failed attempt',    '15-minute lockout applied: lockout_until = NOW() + 15 min; counter reset to 0'],
      ['During lockout',        'HTTP 403 with remaining minutes countdown message'],
      ['Successful login',      'failed_login_attempts reset to 0, lockout_until set to NULL'],
      ['BLOCKED status',        'Permanent block (set by admin); HTTP 403 regardless of password correctness'],
    ],
    []
  ),

  ...blank(),
  new Paragraph({ children: [new PageBreak()] }),
];

// ──────────────────────────────────────────────────────────────────────────────
// SECTION 4 – DATA INGESTION, SEARCH & INTEGRITY
// ──────────────────────────────────────────────────────────────────────────────
const section4 = [
  heading1('Section 4  —  Data Ingestion, Search & Integrity'),

  heading2('4.1  Engineering Specialization Tracks (CLSU DABE Taxonomy)'),
  para(
    'The upload form enforces selection from a standardized dropdown that maps directly to officially ' +
    'recognized CLSU DABE academic tracks, preventing free-text category pollution in the database:'
  ),
  buildTable(
    ['Dropdown Label', 'Database department Value', 'Research Domain'],
    [
      ['AB Land and Water Resources Engineering', 'AB Land and Water Resources Engineering', 'Irrigation, watershed, drainage, hydrology'],
      ['AB Farm Power & Machinery',               'AB Farm Power & Machinery',               'Mechanization, tractors, harvesting equipment'],
      ['AB Structures & Environmental Control',   'AB Structures & Environmental Control',   'Greenhouse design, animal housing, ventilation systems'],
      ['AB Post-Harvest Technology',              'AB Post-Harvest Technology',              'Grain drying, storage, milling, postharvest losses'],
      ['AB Agricultural and Biosystems Informatics', 'AB Agricultural and Biosystems Informatics', 'IoT, sensors, software tools for precision agriculture'],
    ],
    []
  ),

  heading2('4.2  Safe SQL Execution — Parameterized Queries'),
  para(
    'All database write operations use PostgreSQL parameterized queries via the node-postgres (pg) Pool driver, ' +
    'preventing SQL injection and eliminating runtime 500 errors caused by special characters in thesis metadata ' +
    '(apostrophes, quotation marks, percent signs, backslashes):'
  ),
  codePara("  // SAFE: PUT /api/theses/:id update handler"),
  codePara("  const values = [title, author, year, keywords, abstract, dept,"),
  codePara("                  cluster, simScore, matchedId, thesisId];"),
  codePara("  pool.query('UPDATE theses SET title=$1, author=$2, year=$3,"),
  codePara("    keywords=$4, abstract=$5, department=$6,"),
  codePara("    cluster_group=$7, similarity_score=$8,"),
  codePara("    matched_thesis_id=$9 WHERE id=$10', values)"),
  para(
    'Parameters are passed as a separate array — never string-interpolated into the SQL text. ' +
    'The pg driver handles all escaping at the protocol level, preventing both injection attacks and ' +
    'statement parse failures on complex academic abstracts containing single quotes (e.g., "farmer\'s field").'
  ),

  heading2('4.3  Repository Search & Sort Engine'),
  para('The GET /api/theses endpoint supports multi-criteria case-insensitive search with dynamic sort:'),
  buildTable(
    ['Query Parameter', 'Behavior', 'SQL Implementation'],
    [
      ['q (search text)',    'ILIKE match across title, author, keywords, abstract', 'WHERE title ILIKE $1 OR author ILIKE $1 OR keywords ILIKE $1 OR abstract ILIKE $1'],
      ['year',               'Exact integer year filter',                            'AND year = $N'],
      ['uploaded_by',        'Filter to specific adviser\'s submissions',            'AND uploaded_by = $N'],
      ['sort=year_desc',     'Newest year first, then newest upload',                'ORDER BY year DESC, created_at DESC'],
      ['sort=title_asc',     'Alphabetical title sort A→Z',                         'ORDER BY title ASC'],
      ['(default)',          'Most recently uploaded first',                          'ORDER BY created_at DESC'],
    ],
    []
  ),
  para('Frontend client-side filtering provides an additional token-matching layer for instant search feedback without API roundtrips:'),
  codePara("  // Case-insensitive multi-token match across title + abstract + keywords"),
  codePara("  const tokens = query.split(/\\s+/).filter(t => t.length > 1);"),
  codePara("  return tokens.every(t => combinedText.includes(t));"),

  heading2('4.4  File Management & Schema Migration'),
  para('SIYASAT performs live, additive schema migrations on startup using ALTER TABLE IF NOT EXISTS:'),
  codePara("  ALTER TABLE theses ADD COLUMN IF NOT EXISTS cluster_group VARCHAR(120) DEFAULT 'Independent Studies';"),
  codePara("  ALTER TABLE theses ADD COLUMN IF NOT EXISTS similarity_score INT DEFAULT 0;"),
  codePara("  ALTER TABLE theses ADD COLUMN IF NOT EXISTS matched_thesis_id INT DEFAULT NULL;"),
  codePara("  ALTER TABLE theses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;"),
  codePara("  ALTER TABLE users  ADD COLUMN IF NOT EXISTS profile_image TEXT;"),
  para(
    'This approach guarantees backward compatibility with existing deployments — a pre-clustering database ' +
    'schema is automatically upgraded on first server start without data loss or manual migrations.'
  ),

  ...blank(),
  new Paragraph({ children: [new PageBreak()] }),
];

// ──────────────────────────────────────────────────────────────────────────────
// SECTION 5 – AI GAP ANALYSIS & COMPLIANCE GOVERNANCE
// ──────────────────────────────────────────────────────────────────────────────
const section5 = [
  heading1('Section 5  —  AI Gap Analysis & Compliance Governance'),

  heading2('5.1  Groq API Integration & Inference Configuration'),
  para('AI Research Gap Analysis is powered by Groq\'s low-latency inference API, called from the backend (never directly from the browser) to protect the API key:'),
  buildTable(
    ['Configuration Property', 'Value'],
    [
      ['Model',              'openai/gpt-oss-120b (env: GROQ_MODEL)'],
      ['Temperature',        '0.2 — low for deterministic, structured academic output'],
      ['Response Format',    'json_object — forces strict JSON schema compliance'],
      ['System Prompt Role', 'Senior academic research advisor in ABE domain'],
      ['Output Schema',      '{ gaps: [ { gap_title, description, search_query, local_citations[] } ] }'],
      ['Local Context Injection', '5 most recent theses from same department fed into prompt (RAG)'],
      ['Online Reference Enrichment', 'OpenAlex REST API — DOI-linked peer-reviewed references per gap'],
      ['OpenAlex Timeout',   '5 seconds per fetch (AbortController guard)'],
    ],
    []
  ),

  heading2('5.2  PostgreSQL Response Caching'),
  para(
    'The system implements PostgreSQL-level caching for gap analysis results to prevent duplicate billable ' +
    'Groq API calls for the same paper. When a gap analysis has been previously generated for a thesis, ' +
    'the cached identified_gaps and future_recommendations are returned from the theses table without ' +
    'incurring a new API call. This is critical for quota conservation at an institutional deployment scale.'
  ),
  bullet('Cache key: thesis.id (PostgreSQL integer primary key)'),
  bullet('Cache store: theses table columns (identified_gaps TEXT, future_recommendations TEXT)'),
  bullet('Cache invalidation: Manual re-analysis triggers a new Groq API call and overwrites the stored result'),
  bullet('Admin restriction: ADMIN-role JWT tokens are explicitly blocked from gap analysis to prevent wasteful institutional quota consumption'),

  heading2('5.3  Global Research Gap Synthesis'),
  para(
    'An administrator-accessible POST /api/analyze-global-gaps endpoint performs a departmental-level ' +
    'synthesis across the 30 most recent theses, enforcing a minimum citation coverage rule of 20 unique ' +
    'papers across all identified gaps. The prompt instructs the model to operate in an air-gapped RAG mode:'
  ),
  codePara('  "Restrict your analysis strictly to the provided internal records (air-gapped RAG).'),
  codePara('   Do not use external internet browsing or prior knowledge."'),

  heading2('5.4  Academic AI Advisory — Compliance Callout'),
  ...amberBox(
    'Academic AI Advisory — Displayed to All Users on Gap Analysis Results',
    [
      'The AI-generated research gaps displayed below are produced by a large language model (Groq API)',
      'and are intended as a starting point for literature exploration only.',
      '',
      '• Verify all identified gaps against peer-reviewed journal articles and conference proceedings.',
      '• Cross-reference with institutional thesis archives and adviser recommendations.',
      '• Do not cite AI-generated output as a primary source in academic manuscripts.',
      '',
      'SIYASAT\'s gap analysis is a research discovery tool, not a peer-reviewed academic instrument.',
    ]
  ),

  para(
    'This high-visibility amber callout container is rendered prominently in both the PaperDetailsPage and ' +
    'RepositoryPage AI analysis result panels. It ensures institutional compliance with academic integrity ' +
    'standards and protects the institution from liability arising from uncritical AI output citation.'
  ),

  heading2('5.5  API Endpoint Inventory — AI & Gap Services'),
  buildTable(
    ['Method', 'Endpoint', 'Auth Required', 'Description'],
    [
      ['POST', '/api/analyze-gaps',              'No  (public)',  'General-purpose gap analysis — accepts any title/abstract payload'],
      ['POST', '/api/analyze-single-gap',        'Optional',      'Per-paper gap analysis; explicitly blocks ADMIN tokens (HTTP 403)'],
      ['POST', '/api/theses/:id/analyze-gap',    'Yes (token)',   'Authenticated per-thesis gap analysis; ADMIN blocked; caches to DB'],
      ['POST', '/api/analyze-global-gaps',       'No (open)',     'Full-repository synthesis across 30 most recent theses'],
    ],
    []
  ),

  ...blank(),
  new Paragraph({ children: [new PageBreak()] }),
];

// ──────────────────────────────────────────────────────────────────────────────
// SECTION 6 – ANTICIPATED PANEL DEFENSE QUESTIONS
// ──────────────────────────────────────────────────────────────────────────────
const section6 = [
  heading1('Section 6  —  Anticipated Panel Defense Questions & Formulated Answers'),

  para(
    'The following questions represent the most probable lines of inquiry from an academic defense panel ' +
    'reviewing SIYASAT\'s technical architecture. Each answer is formulated to be precise, defensible, ' +
    'and grounded in the actual implementation evidence from the prototype-3 codebase.',
    { after: 200 }
  ),

  heading2('Q1: "Why did you choose Szymkiewicz-Simpson over the more widely known Cosine Similarity or Jaccard Similarity for your clustering engine?"'),
  ...qaBlock(
    'Why Szymkiewicz-Simpson instead of Cosine or Jaccard Similarity?',
    'The Szymkiewicz-Simpson overlap coefficient is specifically designed for asymmetric containment scenarios — ' +
    'exactly what arises in an academic repository where a short, highly specific paper (few tokens) may be ' +
    'fully contained within the conceptual domain of a longer, broader paper. Cosine similarity would severely ' +
    'penalize this relationship because it divides by both vector norms, making a 5-keyword paper appear ' +
    'dissimilar to a 30-keyword paper even when 4 of those 5 keywords are shared. Jaccard similarity divides ' +
    'by the union — again penalizing smaller sets. Simpson divides by the MINIMUM of the two set sizes, ' +
    'meaning a small paper that is 100% a conceptual subset of a larger paper will correctly receive a score ' +
    'of 1.0, allowing it to join the larger paper\'s cluster. For CLSU-DABE thesis metadata — which is ' +
    'sparse, author-curated, and intentionally concise — this containment-aware property produces more ' +
    'semantically accurate cluster assignments than union-normalized alternatives. Additionally, Simpson ' +
    'operates on pure JavaScript Set operations, runs in sub-millisecond time per comparison pair, requires ' +
    'zero external libraries or API calls, and produces fully deterministic outputs — making it ideal for an ' +
    'offline-capable institutional system.'
  ),

  heading2('Q2: "Why does the clustering engine not parse the full text of the uploaded PDF manuscripts?"'),
  ...qaBlock(
    'Why avoid full-text PDF manuscript parsing for the clustering engine?',
    'Full-text PDF parsing introduces four categories of noise that would corrupt the clustering signal. ' +
    'First, structural artifacts: page numbers, running headers, footers, section labels, and figure/table ' +
    'captions are extracted verbatim and pollute the token set with non-thematic vocabulary. Second, ' +
    'reference list contamination: a standard ABE thesis contains 30-80 bibliographic references — parsing ' +
    'these injects author names, journal names, and cited-paper keywords completely unrelated to the paper\'s ' +
    'own theme. Third, OCR noise: scanned PDFs produce character substitution errors (e.g., "rn" parsed as ' +
    '"m") that generate phantom tokens. Fourth, formatting bias: thesis chapters have vastly different token ' +
    'densities — the methodology chapter of an engineering paper is dense with equipment names while the ' +
    'introduction is dense with generic academic vocabulary. Author-curated abstract and keyword metadata ' +
    'avoids all of these problems. It is the distilled, intentional semantic fingerprint of the paper. ' +
    'Our metadata-only approach produces higher-precision clusters while consuming dramatically fewer ' +
    'computational resources — aligning with the system\'s offline, low-infrastructure deployment target.'
  ),

  heading2('Q3: "How does the system prevent unauthenticated public users from mutating the PostgreSQL database?"'),
  ...qaBlock(
    'How does the system ensure public users cannot mutate the database?',
    'The Express backend implements a layered defense: every database-mutating route (POST /api/theses, ' +
    'PUT /api/theses/:id, DELETE /api/theses/:id, POST /api/theses/recluster-all, PUT /api/admin/users/:id/status, ' +
    'PUT /api/admin/users/:id/role) requires a valid JWT token via the authenticateToken middleware, which is ' +
    'declared as the second route handler argument before any business logic executes. The middleware ' +
    'reads the Authorization: Bearer <token> header, calls jwt.verify() against the JWT_SECRET, and returns ' +
    'HTTP 401 Access Denied if the token is absent, or HTTP 403 Invalid or expired token if verification fails. ' +
    'No unauthenticated request ever reaches the database query layer. Read-only routes (GET /api/theses, ' +
    'GET /api/theses/:id/download) are intentionally public by design — they execute only SELECT statements ' +
    'with parameterized inputs, making them safe to expose without authentication. The POST /api/analyze-gaps ' +
    'and /api/analyze-single-gap endpoints are public but write nothing to the database — they call the ' +
    'Groq API and return a JSON response without any INSERT, UPDATE, or DELETE execution.'
  ),

  heading2('Q4: "What specific measures prevent SQL injection and server crashes during thesis editing, particularly for abstracts containing apostrophes or special characters?"'),
  ...qaBlock(
    'What prevents SQL injection and server crashes during thesis editing?',
    'SIYASAT exclusively uses PostgreSQL parameterized queries through the node-postgres (pg) Pool driver ' +
    'for all database write operations. The PUT /api/theses/:id handler constructs the SQL string with ' +
    'positional placeholders ($1, $2, ... $10) and passes all user-submitted values — including the full ' +
    'abstract text — as a separate array to pool.query(). The pg driver transmits these values to PostgreSQL ' +
    'using the binary protocol\'s bind message, which handles all escaping at the wire protocol level. ' +
    'This means a thesis abstract containing "farmer\'s field", "O\'Brien irrigation study", or any number ' +
    'of embedded quotation marks, backslashes, or SQL metacharacters is transmitted as a typed string ' +
    'parameter — never interpolated into the SQL text. The PostgreSQL server treats it as a string literal ' +
    'argument, not executable SQL. This approach categorically prevents both classic SQL injection attacks ' +
    '(e.g., "title\'; DROP TABLE theses;--") and the runtime 500 errors that previously occurred when ' +
    'single-quoted abstracts were naively concatenated into query strings. The Express body parser is ' +
    'configured with a 50 MB JSON limit to accommodate large abstract payloads without truncation.'
  ),

  ...blank(),
  new Paragraph({ children: [new PageBreak()] }),
];

// ──────────────────────────────────────────────────────────────────────────────
// APPENDIX — COMPLETE API REFERENCE
// ──────────────────────────────────────────────────────────────────────────────
const appendix = [
  heading1('Appendix A  —  Complete API Endpoint Reference'),

  buildTable(
    ['Method', 'Endpoint', 'Auth', 'Role Required', 'Description'],
    [
      ['GET',  '/api/health',                       'No',   'Public',   'Server health check'],
      ['POST', '/api/auth/login',                   'No',   'Public',   'Login with email + password; returns JWT + user object'],
      ['POST', '/api/users/profile-picture',        'Yes',  'Any',      'Upload user profile picture (5 MB max, images only)'],
      ['GET',  '/api/theses',                       'No',   'Public',   'List/search theses with q, year, sort, uploaded_by params'],
      ['POST', '/api/theses/check-duplicate',       'No',   'Public',   'Pre-upload duplicate check (Jaccard, 30% threshold)'],
      ['POST', '/api/theses',                       'Yes',  'ADMIN/ADVISER', 'Upload new thesis PDF (25 MB max) + run clustering'],
      ['PUT',  '/api/theses/:id',                   'Yes',  'ADMIN/ADVISER', 'Update thesis metadata + re-run clustering engine'],
      ['DELETE','/api/theses/:id',                  'Yes',  'ADMIN',    'Delete thesis record + unlink associated PDF file'],
      ['POST', '/api/theses/recluster-all',         'Yes',  'ADMIN',    'Re-run clustering engine across entire repository'],
      ['GET',  '/api/theses/:id/download',          'No',   'Public',   'Download thesis PDF (or generate synthetic fallback)'],
      ['POST', '/api/theses/generate-pdf',          'No',   'Public',   'Generate synthetic PDF from metadata payload'],
      ['POST', '/api/theses/:id/analyze-gap',       'Yes',  'Non-ADMIN','Per-thesis AI gap analysis; caches to DB'],
      ['POST', '/api/analyze-gaps',                 'No',   'Public',   'General-purpose gap analysis (any payload)'],
      ['POST', '/api/analyze-single-gap',           'Optional','Non-ADMIN','Alias gap analysis; blocks ADMIN tokens (403)'],
      ['POST', '/api/analyze-global-gaps',          'No',   'Open',     'Repository-wide gap synthesis (top 30 theses)'],
      ['GET',  '/api/admin/users',                  'Yes',  'ADMIN',    'List all registered user accounts'],
      ['PUT',  '/api/admin/users/:id/status',       'Yes',  'ADMIN',    'Set user status: ACTIVE or BLOCKED'],
      ['PUT',  '/api/admin/users/:id/role',         'Yes',  'ADMIN',    'Change user role: STUDENT / ADVISER / ADMIN'],
    ],
    []
  ),

  ...blank(),
  heading1('Appendix B  —  Database Schema Reference'),

  heading2('B.1  users Table'),
  buildTable(
    ['Column', 'Type', 'Default', 'Description'],
    [
      ['id',                     'SERIAL PRIMARY KEY', '—',               'Auto-incremented user identifier'],
      ['full_name',              'VARCHAR(255)',        'NOT NULL',        'Full legal name of the user'],
      ['email',                  'VARCHAR(255)',        'UNIQUE NOT NULL', 'Login email — enforced unique at DB level'],
      ['password_hash',          'VARCHAR(255)',        'NOT NULL',        'bcrypt hash (salt rounds: 10)'],
      ['role',                   'VARCHAR(20)',         'STUDENT',         'STUDENT | ADVISER | ADMIN'],
      ['status',                 'VARCHAR(20)',         'ACTIVE',          'ACTIVE | BLOCKED'],
      ['failed_login_attempts',  'INTEGER',             '0',               'Increments on wrong password; resets on success'],
      ['lockout_until',          'TIMESTAMP',           'NULL',            'Populated on 5th failed attempt; clears on success'],
      ['profile_image',          'TEXT',                'NULL',            'Relative path to uploaded profile picture'],
      ['created_at',             'TIMESTAMP',           'CURRENT_TIMESTAMP','Account creation timestamp'],
    ],
    []
  ),

  heading2('B.2  theses Table'),
  buildTable(
    ['Column', 'Type', 'Default', 'Description'],
    [
      ['id',                'SERIAL PRIMARY KEY', '—',                          'Auto-incremented thesis identifier'],
      ['title',             'TEXT',               'NOT NULL',                   'Full thesis title'],
      ['abstract',          'TEXT',               'NULL',                       'Full abstract text'],
      ['author',            'TEXT',               'NULL',                       'Author name(s), multi-line string'],
      ['year',              'INTEGER',            'NULL',                       'Submission/publication year'],
      ['keywords',          'TEXT',               'NULL',                       'Comma-separated keyword list'],
      ['department',        'TEXT',               'Department of ABE',          'CLSU DABE specialization track'],
      ['file_path',         'TEXT',               'NULL',                       'Relative path to uploaded PDF in /uploads/'],
      ['uploaded_by',       'INTEGER',            'REFERENCES users(id)',       'Foreign key to uploading adviser/admin'],
      ['cluster_group',     'VARCHAR(120)',        'Independent Studies',        'Thematic cluster folder assignment'],
      ['similarity_score',  'INTEGER',            '0',                          'Highest overlap score at upload time (0-100)'],
      ['matched_thesis_id', 'INTEGER',            'NULL',                       'ID of the thesis this one clustered with'],
      ['created_at',        'TIMESTAMP',          'CURRENT_TIMESTAMP',          'Upload timestamp — drives default sort order'],
    ],
    []
  ),

  ...blank(),
  heading1('Appendix C  —  Technology Dependencies'),
  buildTable(
    ['Package', 'Version', 'Layer', 'Purpose'],
    [
      ['express',       '^4.19.2', 'Backend',  'HTTP server and routing framework'],
      ['pg',            '^8.12.0', 'Backend',  'PostgreSQL client with connection pooling'],
      ['jsonwebtoken',  '^9.0.2',  'Backend',  'JWT signing and verification (HS256)'],
      ['bcryptjs',      '^2.4.3',  'Backend',  'Password hashing (bcrypt, 10 salt rounds)'],
      ['multer',        '^1.4.5',  'Backend',  'Multipart form-data: PDF and image upload'],
      ['cors',          '^2.8.5',  'Backend',  'Cross-Origin Resource Sharing middleware'],
      ['dotenv',        '^16.4.5', 'Backend',  'Environment variable loading from .env'],
      ['react',         '^18',     'Frontend', 'UI component framework (SPA)'],
      ['tailwindcss',   '^3',      'Frontend', 'Utility-first CSS framework'],
      ['lucide-react',  'latest',  'Frontend', 'Iconography (Search, Trash2, Sparkles, etc.)'],
      ['docx',          '^9.7.1',  'Tooling',  'Word document generation (devDependency)'],
      ['nodemon',       '^3.1.14', 'Dev',      'Auto-restart server on file changes'],
    ],
    []
  ),

  ...blank(2),
  hr(),
  new Paragraph({
    children: [
      new TextRun({ text: 'SIYASAT System Architecture & Defense Summary  |  Branch: prototype-3  |  v1.0-RC  |  CLSU-DABE  |  September 2026', font: 'Arial', size: pt(8), color: '888888', italics: true }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: spacingAfter(80, 80),
  }),
  new Paragraph({
    children: [
      new TextRun({ text: 'Generated programmatically from codebase inspection of e:/Projects/siyasat-system (branch: prototype-3). ', font: 'Arial', size: pt(8), color: 'AAAAAA' }),
      new TextRun({ text: 'Document intended for academic panel review only.', font: 'Arial', size: pt(8), color: 'AAAAAA', italics: true }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: spacingAfter(80),
  }),
];

// ──────────────────────────────────────────────────────────────────────────────
// ASSEMBLE DOCUMENT
// ──────────────────────────────────────────────────────────────────────────────
const doc = new Document({
  creator: 'SIYASAT Defense Doc Generator — prototype-3',
  title: 'SIYASAT: System Architecture, Technical Specifications & Defense Panel Briefing',
  description: 'Formal defense document for CLSU-DABE SIYASAT academic repository — prototype-3 branch.',
  styles: {
    default: {
      document: {
        run: { font: 'Georgia', size: pt(11), color: DARK_TXT },
        paragraph: { spacing: { line: 276, lineRule: 'auto' } },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top:    convertInchesToTwip(1.0),
            bottom: convertInchesToTwip(1.0),
            left:   convertInchesToTwip(1.25),
            right:  convertInchesToTwip(1.25),
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: 'SIYASAT — CLSU DABE', font: 'Arial', size: pt(9), color: MAROON, bold: true }),
                new TextRun({ text: '   |   System Architecture & Defense Panel Briefing   |   prototype-3   |   v1.0-RC', font: 'Arial', size: pt(9), color: '888888' }),
              ],
              alignment: AlignmentType.LEFT,
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER } },
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: 'Central Luzon State University — Department of Agricultural and Biosystems Engineering   |   September 2026   |   Page ', font: 'Arial', size: pt(9), color: '888888' }),
                new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: pt(9), color: MAROON, bold: true }),
              ],
              alignment: AlignmentType.CENTER,
              border: { top: { style: BorderStyle.SINGLE, size: 4, color: BORDER } },
            }),
          ],
        }),
      },
      children: [
        ...coverPage,
        ...section1,
        ...section2,
        ...section3,
        ...section4,
        ...section5,
        ...section6,
        ...appendix,
      ],
    },
  ],
});

// ──────────────────────────────────────────────────────────────────────────────
// WRITE FILE
// ──────────────────────────────────────────────────────────────────────────────
const OUTPUT_PATH = path.join(__dirname, 'SIYASAT_System_Summary_Defense.docx');

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(OUTPUT_PATH, buffer);
  const stats = fs.statSync(OUTPUT_PATH);
  const sizeKB = (stats.size / 1024).toFixed(2);
  console.log('');
  console.log('✅  Document generated successfully!');
  console.log('📄  File Path : ' + OUTPUT_PATH);
  console.log('📦  File Size : ' + sizeKB + ' KB (' + stats.size + ' bytes)');
  console.log('');
}).catch(err => {
  console.error('❌  Document generation failed:', err);
  process.exit(1);
});
