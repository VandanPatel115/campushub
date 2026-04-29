const router = require('express').Router();
const pool = require('../db/pool');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const { upcoming, category } = req.query;
  let query = `
    SELECT e.*, u.name as organizer_name, c.name as club_name,
      (SELECT COUNT(*) FROM event_rsvps WHERE event_id = e.id AND status = 'going') as going_count,
      (SELECT COUNT(*) FROM event_rsvps WHERE event_id = e.id AND status = 'interested') as interested_count,
      (SELECT status FROM event_rsvps WHERE event_id = e.id AND user_id = $1) as my_rsvp
    FROM events e
    LEFT JOIN users u ON u.id = e.organizer_id
    LEFT JOIN clubs c ON c.id = e.club_id
    WHERE 1=1
  `;
  const params = [req.user.id];
  let idx = 2;

  if (upcoming === 'true') { query += ` AND e.event_date >= NOW()`; }
  if (category) { query += ` AND e.category = $${idx++}`; params.push(category); }

  query += ' ORDER BY e.event_date ASC';
  const result = await pool.query(query, params);
  res.json(result.rows);
});

router.post('/', auth, requireRole('admin', 'faculty'), async (req, res) => {
  const { title, description, event_date, venue, club_id, category, max_attendees } = req.body;
  if (!title || !event_date) return res.status(400).json({ error: 'Title and date required' });

  const result = await pool.query(
    `INSERT INTO events (title, description, event_date, venue, organizer_id, club_id, category, max_attendees)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [title, description, event_date, venue, req.user.id, club_id, category || 'general', max_attendees]
  );
  res.status(201).json(result.rows[0]);
});

router.post('/:id/rsvp', auth, async (req, res) => {
  const { status } = req.body;
  if (!['going', 'interested'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  await pool.query(
    `INSERT INTO event_rsvps (event_id, user_id, status) VALUES ($1,$2,$3)
     ON CONFLICT (event_id, user_id) DO UPDATE SET status = $3`,
    [req.params.id, req.user.id, status]
  );
  res.json({ success: true, status });
});

router.delete('/:id/rsvp', auth, async (req, res) => {
  await pool.query('DELETE FROM event_rsvps WHERE event_id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.json({ success: true });
});

router.delete('/:id', auth, requireRole('admin', 'faculty'), async (req, res) => {
  await pool.query('DELETE FROM events WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
