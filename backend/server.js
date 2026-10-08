require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const pdfParse = require('pdf-parse');
const cloudinary = require('cloudinary').v2;

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'pjnv3ry1', 
  api_key: process.env.CLOUDINARY_API_KEY || '568462394371771', 
  api_secret: process.env.CLOUDINARY_API_SECRET || '9BXUK5YEmni6ytlnBl7eGQB0qxA'
});

const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'siyasat_super_secret_key_2026';
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const OPENALEX_API_KEY = process.env.OPENALEX_API_KEY || 'upPzlnpgpo59ZgCVh351FG';

const supabaseUrl = process.env.SUPABASE_URL || 'https://lgvmnemfuietnoeqgnro.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || 'dummy_key';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log("Groq Key Loaded:", process.env.GROQ_API_KEY ? "YES (starts with " + process.env.GROQ_API_KEY.substring(0, 8) + ")" : "NO - KEY MISSING");

// -----------------------------------------------------------------------------
// Middleware & Body Parsers
// -----------------------------------------------------------------------------
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://siyasat.site',
  'https://www.siyasat.site'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || /\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
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
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'db.lgvmnemfuietnoeqgnro.supabase.co',
      database: process.env.DB_NAME || 'postgres',
      password: process.env.DB_PASSWORD || 'Clientsidesolutions@05',
      port: process.env.DB_PORT || 5432,
      ssl: { rejectUnauthorized: false },
    };

const pool = new Pool(poolConfig);

pool.connect(async (err, client, release) => {
  if (err) {
    console.error('❌ Database Connection Error:', err.stack);
  } else {
    console.log('✅ Connected to PostgreSQL Database: siyasat_db');
    try {
      await client.query(`ALTER TABLE theses ADD COLUMN IF NOT EXISTS cluster_group VARCHAR(120) DEFAULT 'Independent Studies';`);
      await client.query(`ALTER TABLE theses ADD COLUMN IF NOT EXISTS similarity_score INT DEFAULT 0;`);
      await client.query(`ALTER TABLE theses ADD COLUMN IF NOT EXISTS matched_thesis_id INT DEFAULT NULL;`);
      await client.query(`ALTER TABLE theses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
      await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;`);
      console.log('✅ Verified/Updated DB schema for clustering and timestamp columns.');
    } catch (dbErr) {
      console.error('❌ Error updating schema for clustering/timestamp columns:', dbErr);
    }
    release();
  }
});

// -----------------------------------------------------------------------------
// Multer File Upload Setup (PDF only, 25MB max)
// -----------------------------------------------------------------------------
const storage = multer.memoryStorage();

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

const imageUpload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB Limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
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

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user && req.user.role ? req.user.role.toUpperCase() : '';
    const upperRoles = roles.map(r => r.toUpperCase());
    if (!userRole || !upperRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

// -----------------------------------------------------------------------------
// API Endpoints
// -----------------------------------------------------------------------------

// Admin Route: Create User
// 👨‍🏫 What this does: Allows an Admin to securely create a new account for a faculty member.
// It bypasses public signups and directly registers the user in Supabase and our database.
app.post('/api/admin/create-user', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  const { email, password, full_name, role } = req.body;

  // Step 1: Security Check - Ensure the email strictly belongs to our institution (CLSU).
  // If someone tries to use a @gmail.com or @yahoo.com address, we block them immediately.
  if (!email || (!email.endsWith('@clsu.edu.ph') && !email.endsWith('@clsu2.edu.ph'))) {
    return res.status(403).json({ message: 'Access Denied: Only @clsu.edu.ph or @clsu2.edu.ph institutional emails are allowed.' });
  }

  try {
    // Step 2: Check our database to see if this email is already registered.
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email.' });
    }

    // Step 3: Create the user in our Supabase Authentication system.
    // We use the 'Admin API' here so that the current Admin doing the creation isn't accidentally logged out.
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role }
    });

    if (authError) {
      return res.status(400).json({ message: authError.message });
    }

    // Step 4: Encrypt (hash) the user's password for secure storage in our own database.
    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = role ? role.toUpperCase() : 'ADVISER';

    // Step 5: Insert the new user's details into our local 'users' table.
    let result;
    try {
        result = await pool.query(
          'INSERT INTO users (id, email, password_hash, full_name, role, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [authData.user.id, email, passwordHash, full_name, assignedRole, 'ACTIVE']
        );
    } catch (dbErr) {
        // Fallback in case our table uses auto-incrementing numbers instead of Supabase's unique IDs.
        result = await pool.query(
          'INSERT INTO users (email, password_hash, full_name, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [email, passwordHash, full_name, assignedRole, 'ACTIVE']
        );
    }

    // Done! Tell the frontend the account was successfully created.
    res.status(201).json({ message: 'User created successfully.', user: result.rows[0] });

  } catch (err) {
    console.error('Create User Error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Admin Route: Delete User
app.delete('/api/admin/delete-user/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  const { id } = req.params;

  try {
    // Delete from Postgres first to get the email/user
    const userRes = await pool.query('DELETE FROM users WHERE id = $1 RETURNING email', [id]);
    
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found in DB.' });
    }

    const userEmail = userRes.rows[0].email;

    // We should also delete from Supabase Auth by finding their UUID via email
    try {
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      if (!listError && users) {
        const authUser = users.find(u => u.email === userEmail);
        if (authUser) {
          await supabase.auth.admin.deleteUser(authUser.id);
        }
      }
    } catch (authCatchErr) {
      console.error('Supabase Delete User Error:', authCatchErr);
    }

    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error('Delete User Error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SIYASAT API Server is running.' });
});

// Registration disabled - open public access, login reserved for advisers/admins.

// 2. User Login with 5-Attempt Lockout
// 🔐 What this does: Verifies user credentials and temporarily blocks them if they fail 5 times.
// This prevents hackers from using "brute force" to guess passwords.
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Step 1: Look up the user in the database by their email.
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const user = userRes.rows[0];

    // Step 2: Check if the Admin has permanently blocked this account.
    if (user.status === 'BLOCKED') {
      return res.status(403).json({ message: 'Account is blocked. Contact administrator.' });
    }

    // Step 3: Check if the user is currently serving a temporary 15-minute lockout penalty.
    if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
      const remainingTime = Math.ceil((new Date(user.lockout_until) - new Date()) / 1000 / 60);
      return res.status(403).json({
        message: `Account is temporarily locked due to failed attempts. Try again in ${remainingTime} minutes.`
      });
    }

    // Step 4: Compare the typed password with the encrypted password in our database.
    const isMatch = await bcrypt.compare(password, user.password_hash);

    // Step 5: What happens if they typed the WRONG password?
    if (!isMatch) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      let lockoutUntil = null;

      // If they failed 5 times, calculate a lockout time 15 minutes into the future.
      if (attempts >= 5) {
        lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // Current time + 15 mins
        await pool.query(
          'UPDATE users SET failed_login_attempts = $1, lockout_until = $2 WHERE id = $3',
          [0, lockoutUntil, user.id]
        );
        return res.status(403).json({
          message: 'Account locked due to 5 failed login attempts. Try again in 15 minutes.'
        });
      }

      // If they haven't hit 5 yet, just update their failure count.
      await pool.query('UPDATE users SET failed_login_attempts = $1 WHERE id = $2', [attempts, user.id]);
      return res.status(400).json({
        message: `Invalid credentials. ${5 - attempts} attempt(s) remaining before lockout.`
      });
    }

    // Step 6: Success! They typed the correct password. Reset their failure count back to 0.
    await pool.query(
      'UPDATE users SET failed_login_attempts = 0, lockout_until = NULL WHERE id = $1',
      [user.id]
    );

    // Step 7: Create a digital "VIP pass" (JWT Token) that proves who they are for the next 8 hours.
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Send the pass and user info back to the frontend.
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status,
        profile_image: user.profile_image
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Internal server error during authentication.' });
  }
});

// 2.1 Profile Picture Upload
app.post('/api/users/profile-picture', authenticateToken, imageUpload.single('profile_image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }
    
    let publicUrl = '';
    const fileName = `profiles/${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;
    try {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'siyasat-repository/profiles',
        public_id: fileName,
        resource_type: 'image'
      });
      publicUrl = result.secure_url;
    } catch (error) {
      console.error('Cloudinary profile picture upload error:', error);
      return res.status(500).json({ message: 'Failed to upload profile picture to storage.' });
    }

    const updateRes = await pool.query(
      'UPDATE users SET profile_image = $1 WHERE id = $2 RETURNING id, full_name, email, role, profile_image',
      [publicUrl, req.user.id]
    );
    if (updateRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ message: 'Profile picture updated', user: updateRes.rows[0] });
  } catch (err) {
    console.error('Profile Picture Upload Error:', err);
    res.status(500).json({ message: 'Failed to upload profile picture' });
  }
});

// 2.1b Remove Profile Picture
app.delete('/api/users/profile-picture', authenticateToken, async (req, res) => {
  try {
    const updateRes = await pool.query(
      'UPDATE users SET profile_image = NULL WHERE id = $1 RETURNING id, full_name, email, role, profile_image, status',
      [req.user.id]
    );
    if (updateRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ message: 'Profile picture removed', user: updateRes.rows[0] });
  } catch (err) {
    console.error('Profile Picture Remove Error:', err);
    res.status(500).json({ message: 'Failed to remove profile picture' });
  }
});

// 2.2 Get Current User
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const userRes = await pool.query(
      'SELECT id, full_name, email, role, profile_image, status FROM users WHERE id = $1',
      [req.user.id]
    );
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ user: userRes.rows[0] });
  } catch (err) {
    console.error('Fetch User Error:', err);
    res.status(500).json({ message: 'Failed to retrieve user.' });
  }
});

// 3. Fetch Theses with Multi-Criteria Search & Filters (Publicly Accessible)
app.get('/api/theses', async (req, res) => {
  const { q, year, sort, uploaded_by } = req.query;

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

    if (uploaded_by) {
      params.push(parseInt(uploaded_by, 10));
      queryStr += ` AND uploaded_by = $${params.length}`;
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

// -----------------------------------------------------------------------------
// Autonomous Similarity Decision Engine
// -----------------------------------------------------------------------------
const ACADEMIC_STOPWORDS = new Set([
  'the', 'and', 'of', 'in', 'to', 'a', 'is', 'for', 'with', 'on', 'by', 'an', 
  'study', 'research', 'analysis', 'effect', 'using', 'based', 'from', 'as', 
  'at', 'this', 'that', 'which', 'evaluation', 'development', 'performance',
  'design'
]);

function getCleanTokens(text) {
  const tokens = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !ACADEMIC_STOPWORDS.has(w))
    .map(w => {
      const stemmed = w.replace(/(ing|ed|ion|s|es|or|ator|ated|ation|er|ive|al|e)$/, '');
      return stemmed.length >= 3 ? stemmed : w;
    });
  return new Set(tokens);
}

function computeSimilarityAndCluster(targetThesis, allTheses) {
  const targetTitle = getCleanTokens(targetThesis.title);
  const targetAbstract = getCleanTokens(targetThesis.abstract);
  const targetKeywords = getCleanTokens(targetThesis.keywords);
  
  let highestSim = 0;
  let matchedThesis = null;

  for (const thesis of allTheses) {
    if (targetThesis.id && String(thesis.id) === String(targetThesis.id)) continue;
    
    const compTitle = getCleanTokens(thesis.title);
    const compAbstract = getCleanTokens(thesis.abstract);
    const compKeywords = getCleanTokens(thesis.keywords);
    
    const calcWeightedOverlap = (set1, set2, weight) => {
      let inter = 0;
      for (const w of set1) if (set2.has(w)) inter += weight;
      return inter;
    };
    
    const titleInter = calcWeightedOverlap(targetTitle, compTitle, 1.5);
    const abstractInter = calcWeightedOverlap(targetAbstract, compAbstract, 1.0);
    const keywordInter = calcWeightedOverlap(targetKeywords, compKeywords, 1.5);
    
    const intersectionScore = titleInter + abstractInter + keywordInter;
    
    const targetWeight = (targetTitle.size * 1.5) + (targetAbstract.size * 1.0) + (targetKeywords.size * 1.5);
    const compWeight = (compTitle.size * 1.5) + (compAbstract.size * 1.0) + (compKeywords.size * 1.5);
    const minWeight = Math.min(targetWeight, compWeight);
    
    let similarity_percentage = 0;
    if (minWeight > 0) {
      similarity_percentage = Math.min(100, Math.round((intersectionScore / minWeight) * 100));
    }
    
    if (similarity_percentage > highestSim) {
      highestSim = similarity_percentage;
      matchedThesis = thesis;
    }
  }

  if (highestSim >= 50 && matchedThesis && matchedThesis.cluster_group) {
    return {
      cluster_group: matchedThesis.cluster_group,
      similarity_score: highestSim,
      matched_thesis_id: matchedThesis.id
    };
  } else {
    let newFolderName = "Independent Studies";
    if (targetThesis.keywords) {
      const keywordsList = targetThesis.keywords.split(',').map(k => k.trim()).filter(k => k);
      if (keywordsList.length > 0) {
        newFolderName = keywordsList[0];
        newFolderName = newFolderName.replace(/\b\w/g, c => c.toUpperCase());
        if (!newFolderName.toLowerCase().includes("studies") && !newFolderName.toLowerCase().includes("domain")) {
          newFolderName += " Domain";
        }
      }
    } else {
      const titleTokens = Array.from(targetTitle).slice(0, 3);
      if (titleTokens.length > 0) {
        newFolderName = titleTokens.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + " Domain";
      }
    }
    
    return {
      cluster_group: newFolderName,
      similarity_score: 100,
      matched_thesis_id: null
    };
  }
}


// Fetch Single Thesis by ID
app.get('/api/theses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM theses WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Thesis not found' });
    }
    res.json({ success: true, thesis: result.rows[0] });
  } catch (err) {
    console.error('Fetch Single Thesis Error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve thesis details.' });
  }
});

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
// 📁 What this does: Handles uploading a PDF thesis, checks for duplicates, saves it to the cloud, and categorizes it.
app.post('/api/theses', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { title, author, year, keywords, abstract, department, ignoreDuplicate } = req.body;

    // Step 1: Ensure a PDF file was actually attached to the request.
    if (!req.file) {
      return res.status(400).json({ message: 'Please attach a valid PDF file under 25 MB.' });
    }

    // Step 2: Anti-Plagiarism / Duplicate Check.
    // We scan existing papers to see if something with a similar title/abstract is already in the system.
    // The user can override this if they clicked "Proceed Anyway" (ignoreDuplicate).
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

    // Step 3: Cloud Storage Upload.
    // We send the PDF to Cloudinary (our online file storage) so it doesn't slow down our own server.
    let publicUrl = '';
    const fileName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;
    try {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'siyasat-repository',
        public_id: fileName,
        resource_type: 'auto' // automatically detect that it's a PDF
      });
      publicUrl = result.secure_url; // This is the link we will use to download/view the file later.
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return res.status(500).json({ message: 'Failed to upload file to storage.' });
    }

    // Step 4: AI Clustering.
    // We compare this new paper's abstract/keywords against existing papers to automatically group it (e.g. "Irrigation", "Machinery").
    const existingRes = await pool.query('SELECT * FROM theses');
    const clusterResult = computeSimilarityAndCluster({ title, abstract, keywords }, existingRes.rows);

    // Step 5: Save everything into our Database.
    const query = `
      INSERT INTO theses (title, abstract, author, year, keywords, department, file_path, uploaded_by, cluster_group, similarity_score, matched_thesis_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;
    const values = [
      title,
      abstract,
      author,
      parseInt(year, 10) || new Date().getFullYear(),
      keywords || '',
      department || 'Department of Agricultural and Biosystems Engineering',
      publicUrl,
      req.user.id,
      clusterResult.cluster_group,
      clusterResult.similarity_score,
      clusterResult.matched_thesis_id
    ];

    const result = await pool.query(query, values);
    
    // Done! Return the newly saved paper info back to the frontend.
    res.status(201).json({ message: 'Thesis successfully uploaded to repository.', thesis: result.rows[0] });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ message: 'Internal server error during upload: ' + err.message });
  }
});

// 4.1 Update Thesis Route
app.put('/api/theses/:id', authenticateToken, authorizeRoles('ADMIN', 'ADVISER'), upload.single('file'), async (req, res) => {
  try {
    const checkRes = await pool.query('SELECT uploaded_by FROM theses WHERE id = $1', [req.params.id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Thesis not found.' });
    }
    const thesis = checkRes.rows[0];

    // Ownership check for Adviser
    if (req.user.role === 'ADVISER' && thesis.uploaded_by !== req.user.id) {
      return res.status(403).json({ message: 'Access Denied: You can only edit papers you have uploaded.' });
    }

    const { title, author, year, keywords, abstract, department } = req.body;
    
    // Auto re-run evaluation if title or abstract changes
    const existingRes = await pool.query('SELECT * FROM theses');
    const clusterResult = computeSimilarityAndCluster({ 
      id: req.params.id, 
      title: title || '', 
      abstract: abstract || '', 
      keywords: keywords || '' 
    }, existingRes.rows);

    let query = `
      UPDATE theses
      SET title = $1, author = $2, year = $3, keywords = $4, abstract = $5, department = $6, 
          cluster_group = $7, similarity_score = $8, matched_thesis_id = $9
    `;
    
    const values = [
      title, author, parseInt(year, 10), keywords || '', abstract, department,
      clusterResult.cluster_group, clusterResult.similarity_score, clusterResult.matched_thesis_id
    ];

    if (req.file) {
      const fileName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;
      let publicUrl = '';
      try {
        const result = await uploadToCloudinary(req.file.buffer, {
          folder: 'siyasat-repository',
          public_id: fileName,
          resource_type: 'auto'
        });
        publicUrl = result.secure_url;
      } catch (error) {
        console.error('Cloudinary update upload error:', error);
        return res.status(500).json({ message: 'Failed to update file in storage.' });
      }
      
      query += `, file_path = $10 WHERE id = $11 RETURNING *;`;
      values.push(publicUrl, req.params.id);
    } else {
      query += ` WHERE id = $10 RETURNING *;`;
      values.push(req.params.id);
    }

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Thesis not found.' });
    }
    res.json({ message: 'Thesis updated successfully.', thesis: result.rows[0] });
  } catch (err) {
    console.error('Update Error:', err);
    res.status(500).json({ message: 'Internal server error during update.' });
  }
});

// 4.1.5 Delete Thesis Route
app.delete('/api/theses/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
    }
    const result = await pool.query('DELETE FROM theses WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Thesis not found.' });
    }
    
    // Attempt to delete associated file
    if (result.rows[0].file_path) {
      const filePath = result.rows[0].file_path;
      if (filePath.startsWith('http')) {
        try {
          const url = new URL(filePath);
          const pathParts = url.pathname.split('/siyasat-repository/');
          if (pathParts.length > 1) {
            await supabase.storage.from('siyasat-repository').remove([pathParts[1]]);
          }
        } catch (err) {
          console.error('Failed to delete associated file from Supabase:', err);
        }
      } else {
        const fs = require('fs');
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (fileErr) {
            console.error('Failed to delete associated PDF file locally:', fileErr);
          }
        }
      }
    }

    res.json({ message: 'Thesis deleted successfully.' });
  } catch (err) {
    console.error('Delete Error:', err);
    res.status(500).json({ message: 'Internal server error during deletion.' });
  }
});

// 4.2 Recluster All Route
app.post('/api/theses/recluster-all', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
  }
  try {
    const existingRes = await pool.query('SELECT * FROM theses ORDER BY created_at ASC');
    let thesesList = existingRes.rows;
    let updatedCount = 0;
    const currentClustered = [];

    for (const thesis of thesesList) {
      const clusterResult = computeSimilarityAndCluster(thesis, currentClustered);
      const newThesisData = { ...thesis, ...clusterResult };
      currentClustered.push(newThesisData);

      await pool.query(
        'UPDATE theses SET cluster_group = $1, similarity_score = $2, matched_thesis_id = $3 WHERE id = $4',
        [clusterResult.cluster_group, clusterResult.similarity_score, clusterResult.matched_thesis_id, thesis.id]
      );
      updatedCount++;
    }

    res.json({ message: `Successfully reclustered ${updatedCount} theses.` });
  } catch (err) {
    console.error('Recluster Error:', err);
    res.status(500).json({ message: 'Internal server error during reclustering.' });
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
      if (thesis.file_path.startsWith('http')) {
        return res.redirect(thesis.file_path + '?download=');
      }

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
async function generateAiGaps({ id, title, abstract, department, keywords, pdf_text }) {
  const deptName = department || 'Agricultural and Biosystems Engineering';
  const paperTitle = title || 'Research Study';
  const paperAbstract = abstract || '';
  const pdfText = pdf_text || '';

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured.');
  }

  // Query PostgreSQL for 3-5 existing departmental theses to provide local context (if available)
  let relatedDataset = [];
  try {
    const relatedRes = await pool.query(
      'SELECT id, title, year, abstract, keywords FROM theses WHERE id != $1 ORDER BY created_at DESC LIMIT 5',
      [id || -1]
    );
    relatedDataset = relatedRes.rows.map(t => ({
      id: t.id,
      title: t.title,
      year: t.year,
      abstract: t.abstract ? t.abstract.substring(0, 500) : '',
      keywords: t.keywords
    }));
  } catch (err) {
    console.error('Error fetching related theses:', err);
  }

  const prompt = `Act as a senior academic research advisor in ${deptName}.
Analyze the given thesis abstract and full text (if available) against department context to identify 2 to 3 substantive, high-impact research gaps.

CRITICAL INSTRUCTION: If the provided abstract is a diagnostic test, random text, or non-scientific text (e.g., "test", "testing only"), explicitly state this and do not hallucinate gaps based on the title.

Additionally, you MUST return a JSON object containing exactly two keys: "gaps" (array of objects) and "references" (array of strings). Do not omit the references key. Find the references section at the end of the provided text and return them as an array of strings.
For each gap, output:
- gap_title: Concise, technical gap heading.
- description: Explicit breakdown of the unaddressed variable, methodological limitation, or parameter boundary.
- search_query: A targeted 3-5 word academic search string tailored for scholarly literature indexes (e.g., "passive cooling root zone hydroponics").
- local_citations: An array of 1-2 matching internal thesis objects { id, title, note } if relevant from the local set, or empty array if none closely apply.

Current Paper:
Title: ${paperTitle}
Abstract: ${paperAbstract}
Keywords: ${keywords || 'None'}
Full Text: ${pdfText.slice(-10000)} // Providing a large chunk including the end for references.

Local Department Context (Recent Theses):
${JSON.stringify(relatedDataset)}

Return strictly a valid JSON object matching exactly this schema:
{
  "gaps": [
    {
      "gap_title": "String",
      "description": "String",
      "search_query": "String",
      "local_citations": [
        {
          "id": 0,
          "title": "String",
          "note": "String"
        }
      ]
    }
  ],
  "references": [
    "String (Full reference text)"
  ]
}
Output JSON only, with no markdown code blocks or additional conversational text.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [{ role: 'system', content: prompt }]
    })
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Groq API Error: ${errBody}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('Groq API returned empty content.');
  }

  const parsed = JSON.parse(content);
  if (parsed && Array.isArray(parsed.gaps) && parsed.gaps.length > 0) {
    const enrichedGaps = await Promise.all(parsed.gaps.map(async (gap, i) => {
      let online_references = [];
      if (gap.search_query) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        try {
          const searchUrl = `https://api.openalex.org/works?search=${encodeURIComponent(gap.search_query)}&filter=type:article,is_retracted:false&per_page=3&sort=relevance_score:desc`;
          const searchRes = await fetch(searchUrl, {
            headers: {
              'Authorization': `Bearer ${OPENALEX_API_KEY}`
            },
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (searchRes.ok) {
            const searchData = await searchRes.json();
            const items = searchData?.results || [];
            if (items.length === 0) {
              online_references = [{
                title: "No related external references found...",
                authors: "N/A",
                year: "",
                journal: "",
                doi_url: null
              }];
            } else {
              online_references = items.map(item => ({
                title: item.display_name || item.title || "Scholarly Publication",
                authors: item.authorships?.slice(0, 3).map(a => a.author?.display_name).filter(Boolean).join(", ") || "Academic Researchers",
                year: item.publication_year || "Recent",
                journal: item.primary_location?.source?.display_name || "Peer-Reviewed Journal",
                doi_url: item.doi || item.primary_location?.landing_page_url || item.open_access?.oa_url || null
              })).filter(ref => ref.doi_url && ref.doi_url.startsWith('http'));
              
              if (online_references.length === 0) {
                online_references = [{
                  title: "No related external references found...",
                  authors: "N/A",
                  year: "",
                  journal: "",
                  doi_url: null
                }];
              }
            }
          }
        } catch (err) {
          if (err.name === 'AbortError') {
            console.error('OpenAlex Fetch timeout for query:', gap.search_query);
          } else {
            console.error('OpenAlex Fetch Error:', err);
          }
        }
      }
      
      return {
        id: gap.id || i + 1,
        title: gap.gap_title || gap.title || `Research Gap ${i + 1}`,
        desc: gap.description || gap.desc || '',
        search_query: gap.search_query || '',
        cited_papers: gap.local_citations || gap.cited_papers || gap.supporting_papers || [],
        online_references
      };
    }));
    return {
      gaps: enrichedGaps,
      extracted_references: parsed.references || parsed.extracted_references || []
    };
  }

  throw new Error('Groq API returned an invalid JSON schema.');
}

app.post('/api/analyze-gaps', async (req, res) => {
  try {
    const { id, title, abstract, department, keywords } = req.body;
    const result = await generateAiGaps({ id, title, abstract, department, keywords });
    res.json({ success: true, message: 'Hybrid AI Research Gap Analysis complete', gaps: result.gaps, extracted_references: result.extracted_references });
  } catch (err) {
    console.error('AI Analysis Error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate AI Research Gap Report.' });
  }
});

app.post('/api/analyze-global-gaps', async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'GROQ_API_KEY is not configured.' });
    }

    const thesesRes = await pool.query('SELECT id, title, year, abstract, keywords FROM theses ORDER BY created_at DESC LIMIT 30');
    if (thesesRes.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Not enough data in the repository for analysis.' });
    }

    // Process and truncate abstracts to 650 chars max to fit token limits
    const dataset = thesesRes.rows.map(t => ({
      id: t.id,
      title: t.title,
      year: t.year,
      abstract: t.abstract ? t.abstract.substring(0, 650) : '',
      keywords: t.keywords
    }));

    const systemPrompt = `You are an expert academic research analyst. Synthesize 3 to 5 clear research gaps across the provided dataset. 
Enforce citation coverage: Across all identified gaps, you must cite a total of at least 20 unique papers from the provided set. 
Restrict your analysis strictly to the provided internal records (air-gapped RAG). Do not use external internet browsing or prior knowledge.

Return valid JSON exactly matching this schema:
{
  "analyzed_count": <number_of_papers_analyzed>,
  "domain_summary": "<High-level summary of analyzed research themes>",
  "gaps": [
    {
      "gap_title": "<Title of the identified gap>",
      "description": "<Comprehensive explanation of what is underexplored or missing>",
      "supporting_papers": [
        {
          "id": <paper_id>,
          "title": "<Exact Thesis Title>",
          "year": <paper_year>,
          "note": "<Brief explanation of how this study reveals or relates to the gap>"
        }
      ]
    }
  ]
}

Dataset:
${JSON.stringify(dataset)}
`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [{ role: 'system', content: systemPrompt }]
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Groq API Error:', errBody);
      throw new Error(`Groq API returned ${response.status}`);
    }

    const data = await response.json();
    const resultJson = JSON.parse(data.choices[0].message.content);

    res.json({ success: true, message: 'Global AI Analysis complete', result: resultJson });
  } catch (err) {
    console.error('Global AI Analysis Error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate global AI Research Gap Report.' });
  }
});

app.post('/api/analyze-single-gap', async (req, res) => {
  try {
    const { id, title, abstract, department, keywords } = req.body;
    let pdfText = '';

    const result = await generateAiGaps({ id, title, abstract, department, keywords, pdf_text: pdfText });
    res.json({ success: true, message: 'Hybrid AI Research Gap Analysis complete', gaps: result.gaps, extracted_references: result.extracted_references });
  } catch (err) {
    console.error('AI Analysis Error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate AI Research Gap Report.' });
  }
});

// AI Gap Analysis Route
// 🤖 What this does: Reads the PDF of a specific thesis, sends it to an AI (Groq/OpenAI), and generates a report on research gaps.
app.post('/api/theses/:id/analyze-gap', authenticateToken, async (req, res) => {
  try {
    // Step 1: Find the thesis in our database using the ID from the URL.
    const thesisRes = await pool.query('SELECT * FROM theses WHERE id = $1', [req.params.id]);
    if (thesisRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Thesis record not found.' });
    }

    const thesis = thesisRes.rows[0];
    let pdfText = '';
    
    // Step 2: Download the PDF from the cloud and extract its text.
    if (thesis.file_path && thesis.file_path.startsWith('http')) {
      try {
        const pdfResponse = await fetch(thesis.file_path);
        if (pdfResponse.ok) {
          const arrayBuffer = await pdfResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const pdfData = await pdfParse(buffer);
          pdfText = pdfData.text; // We pull out the raw text to feed the AI.
        }
      } catch (e) {
        console.error('Error parsing PDF from Supabase:', e);
      }
    }

    // Step 3: Give the AI strict instructions (the "System Prompt") on how to act.
    const systemPrompt = `You are a senior thesis panelist and peer reviewer in Agricultural and Biosystems Engineering (ABE).
Analyze this single thesis based strictly on its Title, Keywords, and Abstract. Identify the narrow constraints of the study and propose precise next-step extensions.

OUTPUT FORMAT (Strict Markdown):
### 🔬 Methodological Scope & Limitations
[Identify the specific hardware, software, sensors, or methods used and their constraints].

### 🌾 Boundary Constraints
[Highlight the geographic, environmental, crop-specific, or lab-scale limits of this test].

### 📚 Reference Scanned
* [Insert the exact Title of the thesis you just analyzed]`;

    // Step 4: Package the thesis details and the first 5000 characters of the PDF text.
    const userMessageContent = `Title: ${thesis.title || 'N/A'}\nKeywords: ${thesis.keywords || 'N/A'}\nAbstract: ${thesis.abstract || 'N/A'}\nFull Text: ${pdfText.substring(0, 5000)}`;

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return res.status(500).json({ success: false, message: 'AI processing key is missing.' });
    }

    // Step 5: Send everything to the Groq AI servers and wait for the "smart" analysis.
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessageContent }
        ],
        temperature: 0.3 // Low temperature means the AI will be more strict and less creative.
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq AI error response:', errText);
      return res.status(response.status).json({ success: false, message: 'AI processing request failed.' });
    }

    // Step 6: Parse the AI's response and send the Markdown report back to the frontend to display!
    const data = await response.json();
    const markdownResult = data.choices[0].message.content;

    // Package into the array format expected by the frontend without modifying frontend code
    const gaps = [
      {
        id: 1,
        title: "AI Analysis Report",
        desc: markdownResult
      }
    ];

    const identifiedGaps = gaps.map((g, i) => `${i + 1}. ${g.title}: ${g.desc}`).join('\n');
    const futureRecommendations = `1. Integrate IoT sensor telemetry with low-power LoRaWAN networks.\n2. Develop solar-powered edge hardware modules.\n3. Conduct multi-seasonal field trials across regional agro-climatic zones.`;

    const report = {
      thesis_id: thesis.id,
      identified_gaps: identifiedGaps,
      future_recommendations: futureRecommendations
    };

    res.json({ success: true, message: 'AI Analysis complete', gaps, extracted_references: [], report });
  } catch (err) {
    console.error('AI Analysis Error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate AI Research Gap Report.' });
  }
});

app.post('/api/analysis/cluster-gap', async (req, res) => {
  try {
    const { clusterGroup } = req.body;
    if (!clusterGroup) {
      return res.status(400).json({ success: false, message: 'clusterGroup is required.' });
    }

    const { data: theses, error } = await supabase
      .from('theses')
      .select('title, keywords, abstract')
      .eq('cluster_group', clusterGroup)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ success: false, message: 'Database error fetching cluster theses.' });
    }

    if (!theses || theses.length < 2) {
      return res.status(400).json({ success: false, message: 'Not enough data in this cluster to perform a gap analysis (requires at least 2 papers).' });
    }

    const userMessageContent = theses.map((paper, index) => {
      return `Paper ${index + 1}: Title: ${paper.title || 'N/A'} | Keywords: ${paper.keywords || 'N/A'} | Abstract: ${paper.abstract || 'N/A'}`;
    }).join('\n\n');

    const systemPrompt = `You are a critical peer reviewer and expert panelist in Agricultural and Biosystems Engineering (ABE). 
Your objective is to analyze a provided cluster of recent academic theses (titles, keywords, and abstracts) and identify highly specific, actionable research gaps for upcoming undergraduate and master's students.

### DEPARTMENT CLASSIFICATION ###
Based on the title and abstract, you must determine the most appropriate academic department for this research. 

Choose EXACTLY ONE department from this strictly allowed list:
- AB Machinery and Power Engineering
- AB Land and Water Resources Engineering
- AB Structures and Environment Engineering
- AB Process Engineering

If none perfectly fit, choose the closest match. Do not invent or modify these department names.

### OUTPUT FORMATTING RULES ###
You must format your entire analysis strictly using Markdown bullet points. 
Follow these rules exactly:
1. Start your response with the chosen department formatted exactly like this: **Department:** [Chosen Department]
2. Use bold text (**Category Name:**) for the main cluster headings (e.g., **Missing Variables:**).
3. Use standard bullet points (* or -) for all underlying descriptions and gaps.
4. Keep descriptions concise and directly related to the heading.

Example Format:
**Department:** AB Machinery and Power Engineering
**Missing Variables:**
* Absence of alternative intercrop species (e.g., coffee, banana).
* Soil heterogeneity and micro-climatic gradients are ignored.

OUTPUT FORMAT TEMPLATE:
**Thematic Saturation:**
* [Bullet point summarizing repetitive trends]

**Missing Variables:**
* [Specific ignored crops, livestock, soil types, etc.]
* [Another missing variable]

**Methodological Blindspots:**
* [Outdated/overused tech and missing modern alternatives]
* [Another blindspot]

**Environmental & Scale Limitations:**
* [Missing field-scale or real-world parameters]
* [Another limitation]

**Theses Referenced:**
* [Paper 1 Title]
* [Paper 2 Title]

🔑 Global Search Query
[Provide exactly ONE line containing 2 to 3 BROAD keywords based on the gaps (e.g. smart irrigation machine learning). Keep it broad to ensure high search volume. No quotes or extra text.]`;

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return res.status(500).json({ success: false, message: 'AI processing key is missing.' });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessageContent }
        ],
        temperature: 0.3,
        max_tokens: 2500
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq AI error response:', errText);
      return res.status(response.status).json({ success: false, message: 'AI processing request failed.' });
    }

    const data = await response.json();
    let aiResponse = data.choices[0].message.content;

    // Extract the query
    // This regex allows for optional '###', optional spaces, and ANY type of line break
    const queryMatch = aiResponse.match(/🔑\s*Global Search Query\s*[\r\n]+([^\r\n]+)/i);
    let searchQuery = queryMatch ? queryMatch[1].trim() : null;

    // Fallback: Use the first 4 words of the first paper's title
    if (!searchQuery && theses && theses.length > 0 && theses[0].title) {
        searchQuery = theses[0].title.split(/\s+/).slice(0, 4).join(' ');
    }

    let globalReferences = [];

    if (searchQuery) {
        try {
            const openAlexUrl = `https://api.openalex.org/works?search=${encodeURIComponent(searchQuery)}&per_page=10&sort=publication_year:desc`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            
            const response = await fetch(openAlexUrl, {
                headers: {
                    'User-Agent': 'mailto:contact@siyasat.com',
                    'Authorization': `Bearer ${OPENALEX_API_KEY}`
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                globalReferences = data.results.map(work => ({
                    title: work.title || "Untitled Work",
                    year: work.publication_year || "N/A",
                    doi_url: work.doi || work.id || "#",
                    authors: work.authorships && work.authorships.length > 0 
                        ? work.authorships.map(a => a.author.display_name).join(', ')
                        : 'Unknown Authors',
                    journal: (work.primary_location && work.primary_location.source && work.primary_location.source.display_name) 
                        ? work.primary_location.source.display_name 
                        : 'Independent Publication'
                }));
            }
            
            if (aiResponse.includes('🔑')) {
                const rawQuerySection = aiResponse.substring(aiResponse.indexOf('🔑') - 4);
                aiResponse = aiResponse.replace(rawQuerySection, '');
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error("[OpenAlex] Fetch timed out after 4 seconds.");
            } else {
                console.error("OpenAlex Fetch Error:", error);
            }
            if (aiResponse.includes('🔑')) {
                const rawQuerySection = aiResponse.substring(aiResponse.indexOf('🔑') - 4);
                aiResponse = aiResponse.replace(rawQuerySection, '');
            }
        }
    }

    res.json({ success: true, markdown: aiResponse, globalReferences });
  } catch (err) {
    console.error('Cluster AI Analysis Error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate cluster gap analysis.' });
  }
});

// 7. Admin User Management Routes
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Administrator access required.' });
  }

  try {
    const users = await pool.query('SELECT id, full_name, email, role, status, created_at, lockout_until FROM users ORDER BY id ASC');
    res.json({ users: users.rows });
  } catch (err) {
    console.error('Fetch Users Error:', err);
    res.status(500).json({ message: 'Failed to retrieve registered users.' });
  }
});

app.put('/api/admin/users/:id/status', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  const { status } = req.body;
  const userId = req.params.id;

  try {
    await pool.query('UPDATE users SET status = $1 WHERE id = $2', [status, userId]);
    res.json({ message: 'User status updated successfully.' });
  } catch (err) {
    console.error('Update Status Error:', err);
    res.status(500).json({ message: 'Failed to update user status.' });
  }
});

app.patch('/api/admin/users/:id/lock', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  const userId = req.params.id;
  try {
    await pool.query('UPDATE users SET failed_login_attempts = 0, lockout_until = NULL WHERE id = $1', [userId]);
    res.json({ message: 'User account unlocked successfully.' });
  } catch (err) {
    console.error('Unlock User Error:', err);
    res.status(500).json({ message: 'Failed to unlock user account.' });
  }
});

app.put('/api/admin/users/:id/role', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {

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