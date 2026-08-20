const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'siyasat_super_secret_key_2026';

// -----------------------------------------------------------------------------
// Middleware & Body Parsers
// -----------------------------------------------------------------------------
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

// -----------------------------------------------------------------------------
// PostgreSQL Pool Connection
// -----------------------------------------------------------------------------
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'siyasat_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database Connection Error:', err.stack);
  } else {
    console.log('✅ Connected to PostgreSQL Database: siyasat_db');
    release();
  }
});

// -----------------------------------------------------------------------------
// Multer File Upload Setup (PDF only, 25MB max)
// -----------------------------------------------------------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB Limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

// -----------------------------------------------------------------------------
// JWT Middleware
// -----------------------------------------------------------------------------
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
};

// -----------------------------------------------------------------------------
// API Endpoints
// -----------------------------------------------------------------------------

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SIYASAT API Server is running.' });
});

// 1. User Registration Endpoint
app.post('/api/auth/register', async (req, res) => {
  const { full_name, email, password, role } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({ message: 'Full name, email, and password are required.' });
  }

  try {
    // Check if user already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Default role validation
    const userRole = ['STUDENT', 'ADVISER', 'ADMIN'].includes(role) ? role : 'STUDENT';

    // Insert new user into PostgreSQL
    const query = `
      INSERT INTO users (full_name, email, password_hash, role, status)
      VALUES ($1, $2, $3, $4, 'ACTIVE')
      RETURNING id, full_name, email, role, status;
    `;
    const result = await pool.query(query, [full_name, email, passwordHash, userRole]);

    res.status(201).json({
      message: 'Account registered successfully.',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ message: 'Server error during registration: ' + err.message });
  }
});

// 2. User Login with 5-Attempt Lockout
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const user = userRes.rows[0];

    // Check account status
    if (user.status === 'BLOCKED') {
      return res.status(403).json({ message: 'Account is blocked. Contact administrator.' });
    }

    // Check temporary lockout
    if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
      const remainingTime = Math.ceil((new Date(user.lockout_until) - new Date()) / 1000 / 60);
      return res.status(403).json({
        message: `Account is temporarily locked due to failed attempts. Try again in ${remainingTime} minutes.`
      });
    }

    // Verify Password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      let lockoutUntil = null;

      if (attempts >= 5) {
        // Lock for 15 minutes after 5 failed attempts
        lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
        await pool.query(
          'UPDATE users SET failed_login_attempts = $1, lockout_until = $2 WHERE id = $3',
          [0, lockoutUntil, user.id]
        );
        return res.status(403).json({
          message: 'Account locked due to 5 failed login attempts. Try again in 15 minutes.'
        });
      }

      await pool.query('UPDATE users SET failed_login_attempts = $1 WHERE id = $2', [attempts, user.id]);
      return res.status(400).json({
        message: `Invalid credentials. ${5 - attempts} attempt(s) remaining before lockout.`
      });
    }

    // Reset failed attempts on success
    await pool.query(
      'UPDATE users SET failed_login_attempts = 0, lockout_until = NULL WHERE id = $1',
      [user.id]
    );

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Internal server error during authentication.' });
  }
});

// 3. Fetch Theses with Multi-Criteria Search & Filters (Publicly Accessible)
app.get('/api/theses', async (req, res) => {
  const { q, year, sort } = req.query;

  try {
    let queryStr = 'SELECT * FROM theses WHERE 1=1';
    const params = [];

    if (q) {
      params.push(`%${q}%`);
      queryStr += ` AND (title ILIKE $${params.length} OR author ILIKE $${params.length} OR keywords ILIKE $${params.length} OR abstract ILIKE $${params.length})`;
    }

    if (year) {
      params.push(parseInt(year, 10));
      queryStr += ` AND year = $${params.length}`;
    }

    if (sort === 'year_desc') {
      queryStr += ' ORDER BY year DESC, created_at DESC';
    } else if (sort === 'title_asc') {
      queryStr += ' ORDER BY title ASC';
    } else {
      queryStr += ' ORDER BY created_at DESC';
    }

    const result = await pool.query(queryStr, params);
    res.json({ theses: result.rows });
  } catch (err) {
    console.error('Search Error:', err);
    res.status(500).json({ message: 'Failed to retrieve theses.' });
  }
});

// -----------------------------------------------------------------------------
// Duplication Checker Helper Functions (Jaccard + Substring Match)
// -----------------------------------------------------------------------------
function getWordTokens(text = '') {
  return new Set(
    String(text)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2)
  );
}

function calculateJaccardSimilarity(textA, textB) {
  const setA = getWordTokens(textA);
  const setB = getWordTokens(textB);

  if (setA.size === 0 || setB.size === 0) return 0;

  let intersectionSize = 0;
  for (const word of setA) {
    if (setB.has(word)) {
      intersectionSize++;
    }
  }

  const unionSize = new Set([...setA, ...setB]).size;
  return unionSize > 0 ? intersectionSize / unionSize : 0;
}

async function checkForDuplicateThesis(title = '', abstract = '') {
  try {
    const cleanNewTitle = String(title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanNewAbstract = String(abstract || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    console.log(`🔍 [Duplication Checker] Scanning incoming paper: "${title.trim()}"`);

    const existing = await pool.query('SELECT id, title, abstract FROM theses');

    if (existing.rows.length === 0) {
      // Nothing in the repository yet — nothing to compare against
      return { isDuplicate: false, score: 0 };
    }

    const papersToCheck = existing.rows;

    let highestScore = 0;
    let matchedThesis = null;

    for (const paper of papersToCheck) {
      if (!paper || !paper.title) continue;

      const cleanExistingTitle = String(paper.title).toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanExistingAbstract = String(paper.abstract || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      let score = 0;

      // 1. EXACT OR NEAR EXACT TITLE MATCH
      if (cleanNewTitle && cleanExistingTitle) {
        if (cleanNewTitle === cleanExistingTitle) {
          score = 100;
        } else if (cleanNewTitle.includes(cleanExistingTitle) || cleanExistingTitle.includes(cleanNewTitle)) {
          score = 90;
        }
      }

      // 2. TOKEN JACCARD SIMILARITY MATCH
      if (score < 90) {
        const titleSim = calculateJaccardSimilarity(title, paper.title);
        const abstractSim = calculateJaccardSimilarity(abstract, paper.abstract);
        const tokenScore = Math.round((titleSim * 0.65 + abstractSim * 0.35) * 100);
        score = Math.max(score, tokenScore);
      }

      if (score > highestScore) {
        highestScore = score;
        matchedThesis = paper;
      }
    }

    console.log(`📊 [Duplication Result] Highest Score: ${highestScore}% | Matched: "${matchedThesis?.title || 'None'}"`);

    if (highestScore >= 30 && matchedThesis) {
      return {
        isDuplicate: true,
        score: highestScore,
        matchedThesis
      };
    }

    return { isDuplicate: false, score: 0 };
  } catch (err) {
    console.error('❌ Duplicate check error:', err);
    return { isDuplicate: false, score: 0 };
  }
}

// Duplication Check API Endpoint
app.post('/api/theses/check-duplicate', async (req, res) => {
  try {
    const { title, abstract } = req.body;
    const dupResult = await checkForDuplicateThesis(title, abstract);
    if (dupResult.isDuplicate) {
      return res.json({
        isDuplicate: true,
        similarityScore: dupResult.score,
        matchedThesis: dupResult.matchedThesis,
        message: `A similar paper ("${dupResult.matchedThesis.title}") was found in the repository with a ${dupResult.score}% similarity score.`
      });
    }
    res.json({ isDuplicate: false, similarityScore: 0, message: 'No duplicate found.' });
  } catch (err) {
    console.error('Duplicate Check Error:', err);
    res.status(500).json({ message: 'Failed to run duplicate checker.' });
  }
});

// 4. Upload New Thesis Route (Authenticated Admins & Advisers)
app.post('/api/theses', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { title, author, year, keywords, abstract, department, ignoreDuplicate } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Please attach a valid PDF file under 25 MB.' });
    }

    // Run Duplication Checker unless user clicked "Proceed Anyway" (ignoreDuplicate === 'true')
    if (ignoreDuplicate !== 'true' && ignoreDuplicate !== true) {
      const dupResult = await checkForDuplicateThesis(title, abstract);
      if (dupResult.isDuplicate) {
        return res.status(409).json({
          message: `Possible Duplicate Detected! A similar paper ("${dupResult.matchedThesis.title}") already exists in the repository with a ${dupResult.score}% similarity match.`,
          similarityScore: dupResult.score,
          existingPaper: dupResult.matchedThesis
        });
      }
    }

    const normalizedPath = req.file.path.replace(/\\/g, '/');

    const query = `
      INSERT INTO theses (title, abstract, author, year, keywords, department, file_path, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [
      title,
      abstract,
      author,
      parseInt(year, 10) || new Date().getFullYear(),
      keywords || '',
      department || 'Department of Agricultural and Biosystems Engineering',
      normalizedPath,
      req.user.id
    ];

    const result = await pool.query(query, values);
    res.status(201).json({ message: 'Thesis successfully uploaded to repository.', thesis: result.rows[0] });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ message: 'Internal server error during upload: ' + err.message });
  }
});

// PDF Buffer Helper for dynamic PDF downloads
function generatePdfBuffer(paper = {}) {
  const title = (paper.title || 'Thesis Document').replace(/[()\\]/g, '\\$&');
  const author = (paper.author || paper.authors || 'Unknown Author').replace(/[()\\]/g, '\\$&');
  const dept = (paper.department || paper.branch || 'Department of Agricultural and Biosystems Engineering').replace(/[()\\]/g, '\\$&');
  const year = String(paper.year || new Date().getFullYear());
  const keywords = (paper.keywords || 'N/A').replace(/[()\\]/g, '\\$&');
  const abstract = (paper.abstract || 'No abstract provided.').replace(/[()\\]/g, '\\$&');

  const wrapText = (text, maxLength = 75) => {
    const words = text.split(/\s+/);
    const lines = [];
    let currentLine = '';
    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length <= maxLength) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  const abstractLines = wrapText(abstract, 70);

  let streamContent = 'BT\n/F1 16 Tf\n50 740 Td\n(' + title.slice(0, 60) + ') Tj\n0 -25 Td\n/F1 11 Tf\n(Author/s: ' + author.replace(/\n/g, ', ').slice(0, 70) + ') Tj\n0 -18 Td\n(Department: ' + dept.slice(0, 70) + ') Tj\n0 -18 Td\n(Year: ' + year + ') Tj\n0 -18 Td\n(Keywords: ' + keywords.slice(0, 70) + ') Tj\n0 -30 Td\n/F1 13 Tf\n(ABSTRACT) Tj\n0 -20 Td\n/F1 10 Tf\n';

  for (const line of abstractLines.slice(0, 35)) {
    streamContent += '(' + line + ') Tj\n0 -14 Td\n';
  }
  streamContent += 'ET';

  const streamLength = Buffer.byteLength(streamContent);

  const header = '%PDF-1.4\n';
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n';
  const obj4 = '4 0 obj\n<< /Length ' + streamLength + ' >>\nstream\n' + streamContent + '\nendstream\nendobj\n';
  const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';

  const offsets = [0];
  offsets.push(header.length);
  offsets.push(offsets[1] + obj1.length);
  offsets.push(offsets[2] + obj2.length);
  offsets.push(offsets[3] + obj3.length);
  offsets.push(offsets[4] + obj4.length);

  const xrefOffset = offsets[5] + obj5.length;

  const xref = 'xref\n0 6\n0000000000 65535 f \n' +
    offsets.slice(1).map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('') +
    'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF';

  const fullPdf = header + obj1 + obj2 + obj3 + obj4 + obj5 + xref;
  return Buffer.from(fullPdf);
}

// 5. Delete Thesis (Admin Only)
app.delete('/api/theses/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
  }

  try {
    await pool.query('DELETE FROM theses WHERE id = $1', [req.params.id]);
    res.json({ message: 'Thesis deleted successfully.' });
  } catch (err) {
    console.error('Delete Error:', err);
    res.status(500).json({ message: 'Failed to delete thesis record.' });
  }
});

// 5.1 Download Thesis PDF Route
app.get('/api/theses/:id/download', async (req, res) => {
  try {
    const thesisId = req.params.id;
    let thesis = null;

    if (!isNaN(thesisId)) {
      const result = await pool.query('SELECT * FROM theses WHERE id = $1', [thesisId]);
      if (result.rows.length > 0) {
        thesis = result.rows[0];
      }
    }

    if (thesis && thesis.file_path) {
      const absolutePath = path.resolve(__dirname, thesis.file_path);
      if (fs.existsSync(absolutePath)) {
        const downloadName = (thesis.title || 'Thesis')
          .replace(/[^a-zA-Z0-9\s-_]/g, '')
          .trim()
          .replace(/\s+/g, '_') + '.pdf';
        return res.download(absolutePath, downloadName);
      }
    }

    // Fallback: Generate PDF dynamically if file on disk is missing or mock thesis ID
    const fallbackPaper = thesis || {
      id: thesisId,
      title: req.query.title || 'Development and Performance Evaluation of a Solar-Powered Grain Dryer',
      author: req.query.author || 'Dela Cruz, Juan A.; Downie, Hailie Nichole; Japson, Althea Myr',
      department: req.query.department || 'Department of Agricultural and Biosystems Engineering',
      year: req.query.year || 2026,
      abstract: req.query.abstract || 'Postharvest losses in rice production remain a significant challenge in the Philippines...'
    };

    const pdfBuffer = generatePdfBuffer(fallbackPaper);
    const cleanTitle = (fallbackPaper.title || 'Research_Paper')
      .replace(/[^a-zA-Z0-9\s-_]/g, '')
      .trim()
      .replace(/\s+/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${cleanTitle}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('Download Error:', err);
    res.status(500).json({ message: 'Failed to download thesis PDF file.' });
  }
});

app.post('/api/theses/generate-pdf', (req, res) => {
  try {
    const paperData = req.body || {};
    const pdfBuffer = generatePdfBuffer(paperData);
    const cleanTitle = (paperData.title || 'Research_Paper')
      .replace(/[^a-zA-Z0-9\s-_]/g, '')
      .trim()
      .replace(/\s+/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${cleanTitle}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('Generate PDF Error:', err);
    res.status(500).json({ message: 'Failed to generate PDF.' });
  }
});

// 6. AI Research Gap Analysis Tool Routes
async function generateAiGaps({ title, abstract, department, keywords }) {
  const deptName = department || 'Agricultural and Biosystems Engineering';
  const paperTitle = title || 'Research Study';
  const paperAbstract = abstract || '';

  const apiKey = process.env.GROQ_API_KEY;
  if (apiKey && apiKey.startsWith('gsk_')) {
    try {
      const prompt = `You are an expert AI academic research reviewer in ${deptName}.
Analyze the following thesis proposal/paper details:
Title: ${paperTitle}
Abstract: ${paperAbstract}
Keywords: ${keywords || 'None'}

Identify 4 specific, high-quality research gaps or unaddressed opportunities related to this work.
Return strictly a valid JSON object with the key "gaps" containing an array of exactly 4 objects. Each object must have:
"id": (number 1 to 4)
"title": (string, concise title of the research gap)
"desc": (string, detailed 2-3 sentence explanation of the gap and why further research is needed)

Output JSON only, with no markdown code blocks or additional conversational text.`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5,
          max_tokens: 1000
        })
      });

      if (response.ok) {
        const result = await response.json();
        const content = result.choices?.[0]?.message?.content?.trim();
        if (content) {
          const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const parsed = JSON.parse(jsonStr);
          if (parsed && Array.isArray(parsed.gaps) && parsed.gaps.length > 0) {
            return parsed.gaps.map((g, idx) => ({
              id: idx + 1,
              title: g.title || `Research Gap ${idx + 1}`,
              desc: g.desc || g.description || ''
            }));
          }
        }
      }
    } catch (err) {
      console.warn('Groq API call failed, falling back to dynamic gap generation:', err.message);
    }
  }

  const keywordsList = typeof keywords === 'string' ? keywords.split(',').map(k => k.trim()).filter(Boolean) : [];
  const primaryTopic = keywordsList[0] || paperTitle.split(' ')[0] || 'the studied topic';

  return [
    {
      id: 1,
      title: `Limited long-term field validation for ${primaryTopic} under regional microclimates`,
      desc: `While ${paperTitle} demonstrates short-term viability in ${deptName}, there is insufficient empirical data regarding multi-season stability and environmental degradation in diverse local field environments.`
    },
    {
      id: 2,
      title: `Lack of cost-benefit analysis and adoption metrics for smallholders`,
      desc: `Existing research focuses primarily on technical parameters. Future studies should quantify capital expenditure, ROI timeline, and socio-economic adoption barriers for small-scale operations in ${deptName}.`
    },
    {
      id: 3,
      title: `Integration constraints with automated monitoring and IoT telemetry`,
      desc: `The methodology described in "${paperTitle}" lacks real-time sensor integration and low-power telemetry protocols, limiting remote operational control and predictive maintenance.`
    },
    {
      id: 4,
      title: `Insufficient lifecycle assessment and scalable manufacturing benchmarks`,
      desc: `Further investigation is required into the carbon footprint, raw material recycling options, and scalable fabrication methods suitable for local industrial production.`
    }
  ];
}

app.post('/api/analyze-gaps', async (req, res) => {
  try {
    const { title, abstract, department, keywords } = req.body;
    const gaps = await generateAiGaps({ title, abstract, department, keywords });
    res.json({ success: true, message: 'AI Analysis complete', gaps });
  } catch (err) {
    console.error('AI Analysis Error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate AI Research Gap Report.' });
  }
});

app.post('/api/theses/:id/analyze-gap', authenticateToken, async (req, res) => {
  try {
    const thesisRes = await pool.query('SELECT * FROM theses WHERE id = $1', [req.params.id]);
    if (thesisRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Thesis record not found.' });
    }

    const thesis = thesisRes.rows[0];
    const gaps = await generateAiGaps({
      title: thesis.title,
      abstract: thesis.abstract,
      department: thesis.department,
      keywords: thesis.keywords
    });

    const identifiedGaps = gaps.map((g, i) => `${i + 1}. ${g.title}: ${g.desc}`).join('\n');
    const futureRecommendations = `1. Integrate IoT sensor telemetry with low-power LoRaWAN networks.\n2. Develop solar-powered edge hardware modules.\n3. Conduct multi-seasonal field trials across regional agro-climatic zones.`;

    const report = {
      thesis_id: thesis.id,
      identified_gaps: identifiedGaps,
      future_recommendations: futureRecommendations
    };

    res.json({ success: true, message: 'AI Analysis complete', gaps, report });
  } catch (err) {
    console.error('AI Analysis Error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate AI Research Gap Report.' });
  }
});

// 7. Admin User Management Routes
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Administrator access required.' });
  }

  try {
    const users = await pool.query('SELECT id, full_name, email, role, status, created_at FROM users ORDER BY id ASC');
    res.json({ users: users.rows });
  } catch (err) {
    console.error('Fetch Users Error:', err);
    res.status(500).json({ message: 'Failed to retrieve registered users.' });
  }
});

app.put('/api/admin/users/:id/status', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Administrator access required.' });
  }

  const { status } = req.body;
  try {
    await pool.query('UPDATE users SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ message: `User status updated to ${status}.` });
  } catch (err) {
    console.error('Update Status Error:', err);
    res.status(500).json({ message: 'Failed to update user status.' });
  }
});

app.put('/api/admin/users/:id/role', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Administrator access required.' });
  }

  const { role } = req.body;
  try {
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id]);
    res.json({ message: `User role updated to ${role}.` });
  } catch (err) {
    console.error('Update Role Error:', err);
    res.status(500).json({ message: 'Failed to update user role.' });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 SIYASAT Backend Server running on http://localhost:${PORT}`);
});