const router = require('express').Router();
const pool = require('../db/pool');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM timetable_slots WHERE user_id = $1 ORDER BY
      CASE day_of_week WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
        WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 END,
      start_time`,
    [req.user.id]
  );
  res.json(result.rows);
});

router.post('/', auth, async (req, res) => {
  const { day_of_week, start_time, end_time, subject, room, instructor, color } = req.body;
  if (!day_of_week || !start_time || !end_time || !subject) {
    return res.status(400).json({ error: 'Day, times, and subject required' });
  }

  const conflict = await pool.query(
    `SELECT 1 FROM timetable_slots WHERE user_id = $1 AND day_of_week = $2
     AND NOT (end_time <= $3 OR start_time >= $4)`,
    [req.user.id, day_of_week, start_time, end_time]
  );
  if (conflict.rows.length) return res.status(409).json({ error: 'Time slot conflicts with existing class' });

  const result = await pool.query(
    `INSERT INTO timetable_slots (user_id, day_of_week, start_time, end_time, subject, room, instructor, color)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [req.user.id, day_of_week, start_time, end_time, subject, room, instructor, color || '#4f46e5']
  );
  res.status(201).json(result.rows[0]);
});

router.put('/:id', auth, async (req, res) => {
  const { day_of_week, start_time, end_time, subject, room, instructor, color } = req.body;
  const result = await pool.query(
    `UPDATE timetable_slots SET day_of_week=$1, start_time=$2, end_time=$3, subject=$4, room=$5, instructor=$6, color=$7
     WHERE id=$8 AND user_id=$9 RETURNING *`,
    [day_of_week, start_time, end_time, subject, room, instructor, color, req.params.id, req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Slot not found' });
  res.json(result.rows[0]);
});

router.delete('/:id', auth, async (req, res) => {
  await pool.query('DELETE FROM timetable_slots WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.json({ success: true });
});

module.exports = router;
