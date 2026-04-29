const router = require('express').Router();
const pool = require('../db/pool');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const result = await pool.query(
    `SELECT id, name, email, role, branch, year, skills, bio, avatar_url, contribution_score, created_at
     FROM users WHERE id = $1`,
    [req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Profile not found' });

  const badges = await pool.query(`
    SELECT b.*, ub.awarded_at, ub.tx_hash
    FROM user_badges ub JOIN badges b ON b.id = ub.badge_id
    WHERE ub.user_id = $1
  `, [req.user.id]);

  const stats = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM study_materials WHERE uploader_id = $1) as uploads,
      (SELECT COUNT(*) FROM discussions WHERE author_id = $1) as discussions,
      (SELECT COUNT(*) FROM discussion_comments WHERE author_id = $1) as answers,
      (SELECT COUNT(*) FROM club_memberships WHERE user_id = $1) as clubs,
      (SELECT COUNT(*) FROM event_rsvps WHERE user_id = $1) as events_attended
  `, [req.user.id]);

  res.json({ ...result.rows[0], badges: badges.rows, stats: stats.rows[0] });
});

router.put('/', auth, async (req, res) => {
  const { name, branch, year, skills, bio } = req.body;
  const result = await pool.query(
    `UPDATE users SET name=$1, branch=$2, year=$3, skills=$4, bio=$5, updated_at=NOW()
     WHERE id=$6 RETURNING id, name, email, role, branch, year, skills, bio`,
    [name, branch, year, skills, bio, req.user.id]
  );
  res.json(result.rows[0]);
});

router.get('/leaderboard', auth, async (req, res) => {
  const result = await pool.query(`
    SELECT id, name, branch, year, contribution_score, avatar_url,
      (SELECT COUNT(*) FROM user_badges WHERE user_id = u.id) as badge_count
    FROM users u
    WHERE role = 'student'
    ORDER BY contribution_score DESC
    LIMIT 20
  `);
  res.json(result.rows);
});

router.get('/:id', auth, async (req, res) => {
  const result = await pool.query(
    `SELECT id, name, branch, year, skills, bio, avatar_url, contribution_score, created_at FROM users WHERE id = $1`,
    [req.params.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'User not found' });

  const badges = await pool.query(`
    SELECT b.* FROM user_badges ub JOIN badges b ON b.id = ub.badge_id WHERE ub.user_id = $1
  `, [req.params.id]);

  res.json({ ...result.rows[0], badges: badges.rows });
});

module.exports = router;
