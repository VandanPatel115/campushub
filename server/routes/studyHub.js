const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const pool = require('../db/pool');
const { auth } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`),
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

router.get('/', auth, async (req, res) => {
  const { subject, semester, branch, search, sort } = req.query;
  let query = `
    SELECT sm.*, u.name as uploader_name,
      EXISTS(SELECT 1 FROM study_likes WHERE material_id = sm.id AND user_id = $1) as liked
    FROM study_materials sm
    LEFT JOIN users u ON u.id = sm.uploader_id
    WHERE 1=1
  `;
  const params = [req.user.id];
  let idx = 2;

  if (subject) { query += ` AND sm.subject ILIKE $${idx++}`; params.push(`%${subject}%`); }
  if (semester) { query += ` AND sm.semester = $${idx++}`; params.push(semester); }
  if (branch) { query += ` AND sm.branch = $${idx++}`; params.push(branch); }
  if (search) { query += ` AND (sm.title ILIKE $${idx++} OR sm.description ILIKE $${idx})`; params.push(`%${search}%`); params.push(`%${search}%`); idx += 2; }

  const order = sort === 'popular' ? 'sm.like_count DESC' : sort === 'downloaded' ? 'sm.download_count DESC' : 'sm.created_at DESC';
  query += ` ORDER BY ${order}`;

  const result = await pool.query(query, params);
  res.json(result.rows);
});

router.post('/', auth, upload.single('file'), async (req, res) => {
  const { title, description, subject, semester, branch } = req.body;
  if (!title || !subject || !req.file) return res.status(400).json({ error: 'Title, subject, and file required' });

  const fileUrl = `/uploads/${req.file.filename}`;
  const result = await pool.query(
    `INSERT INTO study_materials (title, description, subject, semester, branch, file_url, file_type, file_size, uploader_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [title, description, subject, semester, branch, fileUrl, req.file.mimetype, req.file.size, req.user.id]
  );

  await pool.query(`UPDATE users SET contribution_score = contribution_score + 5 WHERE id = $1`, [req.user.id]);
  await checkAndAwardBadges(req.user.id, pool);

  res.status(201).json(result.rows[0]);
});

router.post('/:id/like', auth, async (req, res) => {
  const { id } = req.params;
  const existing = await pool.query('SELECT 1 FROM study_likes WHERE material_id = $1 AND user_id = $2', [id, req.user.id]);

  if (existing.rows.length) {
    await pool.query('DELETE FROM study_likes WHERE material_id = $1 AND user_id = $2', [id, req.user.id]);
    await pool.query('UPDATE study_materials SET like_count = like_count - 1 WHERE id = $1', [id]);
    return res.json({ liked: false });
  }

  await pool.query('INSERT INTO study_likes (material_id, user_id) VALUES ($1, $2)', [id, req.user.id]);
  await pool.query('UPDATE study_materials SET like_count = like_count + 1 WHERE id = $1', [id]);
  res.json({ liked: true });
});

router.get('/:id/download', auth, async (req, res) => {
  await pool.query('UPDATE study_materials SET download_count = download_count + 1 WHERE id = $1', [req.params.id]);
  const result = await pool.query('SELECT file_url FROM study_materials WHERE id = $1', [req.params.id]);
  if (!result.rows.length) return res.status(404).json({ error: 'File not found' });
  res.json({ url: result.rows[0].file_url });
});

router.delete('/:id', auth, async (req, res) => {
  const result = await pool.query('SELECT uploader_id FROM study_materials WHERE id = $1', [req.params.id]);
  if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
  if (result.rows[0].uploader_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }
  await pool.query('DELETE FROM study_materials WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

async function checkAndAwardBadges(userId, pool) {
  const uploads = await pool.query('SELECT COUNT(*) FROM study_materials WHERE uploader_id = $1', [userId]);
  if (parseInt(uploads.rows[0].count) >= 10) {
    const badge = await pool.query(`SELECT id FROM badges WHERE name = 'Top Contributor'`);
    if (badge.rows.length) {
      await pool.query(`INSERT INTO user_badges (user_id, badge_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [userId, badge.rows[0].id]);
    }
  }
}

module.exports = router;
