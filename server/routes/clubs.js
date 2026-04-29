const router = require('express').Router();
const pool = require('../db/pool');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const result = await pool.query(`
    SELECT c.*, u.name as president_name,
      (SELECT COUNT(*) FROM club_memberships WHERE club_id = c.id) as member_count,
      EXISTS(SELECT 1 FROM club_memberships WHERE club_id = c.id AND user_id = $1) as is_member
    FROM clubs c
    LEFT JOIN users u ON u.id = c.president_id
    ORDER BY member_count DESC
  `, [req.user.id]);
  res.json(result.rows);
});

router.post('/', auth, requireRole('admin'), async (req, res) => {
  const { name, description, category } = req.body;
  if (!name) return res.status(400).json({ error: 'Club name required' });

  const result = await pool.query(
    `INSERT INTO clubs (name, description, category, president_id) VALUES ($1,$2,$3,$4) RETURNING *`,
    [name, description, category, req.user.id]
  );
  res.status(201).json(result.rows[0]);
});

router.post('/:id/join', auth, async (req, res) => {
  await pool.query(
    `INSERT INTO club_memberships (club_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
    [req.params.id, req.user.id]
  );
  await pool.query(`UPDATE users SET contribution_score = contribution_score + 2 WHERE id = $1`, [req.user.id]);
  res.json({ success: true });
});

router.delete('/:id/leave', auth, async (req, res) => {
  await pool.query('DELETE FROM club_memberships WHERE club_id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.json({ success: true });
});

router.get('/:id/members', auth, async (req, res) => {
  const result = await pool.query(`
    SELECT u.id, u.name, u.branch, u.year, cm.role, cm.joined_at
    FROM club_memberships cm
    JOIN users u ON u.id = cm.user_id
    WHERE cm.club_id = $1
    ORDER BY cm.joined_at ASC
  `, [req.params.id]);
  res.json(result.rows);
});

module.exports = router;
