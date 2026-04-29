const router = require('express').Router();
const pool = require('../db/pool');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const { category, department, search } = req.query;
  let query = `
    SELECT n.*, u.name as author_name,
      EXISTS(SELECT 1 FROM notice_seen WHERE notice_id = n.id AND user_id = $1) as seen
    FROM notices n
    LEFT JOIN users u ON u.id = n.author_id
    WHERE 1=1
  `;
  const params = [req.user.id];
  let idx = 2;

  if (category) { query += ` AND n.category = $${idx++}`; params.push(category); }
  if (department) { query += ` AND (n.department = $${idx++} OR n.department IS NULL)`; params.push(department); }
  if (search) { query += ` AND (n.title ILIKE $${idx++} OR n.content ILIKE $${idx++})`; params.push(`%${search}%`); params.push(`%${search}%`); idx += 2; }

  query += ' ORDER BY n.is_pinned DESC, n.created_at DESC';
  const result = await pool.query(query, params);
  res.json(result.rows);
});

router.post('/', auth, requireRole('admin', 'faculty'), async (req, res) => {
  const { title, content, category, department, is_pinned } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });

  const result = await pool.query(
    `INSERT INTO notices (title, content, category, department, is_pinned, author_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [title, content, category || 'general', department, is_pinned || false, req.user.id]
  );
  res.status(201).json(result.rows[0]);
});

router.patch('/:id/seen', auth, async (req, res) => {
  await pool.query(
    `INSERT INTO notice_seen (notice_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [req.params.id, req.user.id]
  );
  res.json({ success: true });
});

router.patch('/:id/pin', auth, requireRole('admin'), async (req, res) => {
  const result = await pool.query(
    `UPDATE notices SET is_pinned = NOT is_pinned WHERE id = $1 RETURNING *`,
    [req.params.id]
  );
  res.json(result.rows[0]);
});

router.delete('/:id', auth, requireRole('admin', 'faculty'), async (req, res) => {
  await pool.query('DELETE FROM notices WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
