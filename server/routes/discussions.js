const router = require('express').Router();
const pool = require('../db/pool');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const { tag, search, sort } = req.query;
  let query = `
    SELECT d.*, u.name as author_name, u.branch as author_branch,
      (SELECT vote_count FROM votes WHERE entity_type='discussion' AND entity_id=d.id AND user_id=$1) as my_vote
    FROM discussions d
    LEFT JOIN users u ON u.id = d.author_id
    WHERE 1=1
  `;
  const params = [req.user.id];
  let idx = 2;

  if (tag) { query += ` AND $${idx++} = ANY(d.tags)`; params.push(tag); }
  if (search) { query += ` AND (d.title ILIKE $${idx++} OR d.content ILIKE $${idx})`; params.push(`%${search}%`); params.push(`%${search}%`); idx += 2; }

  const order = sort === 'votes' ? 'd.vote_count DESC' : sort === 'answers' ? 'd.answer_count DESC' : 'd.created_at DESC';
  query += ` ORDER BY ${order}`;

  const result = await pool.query(query, params);
  res.json(result.rows);
});

router.post('/', auth, async (req, res) => {
  const { title, content, tags } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });

  const result = await pool.query(
    `INSERT INTO discussions (title, content, author_id, tags) VALUES ($1,$2,$3,$4) RETURNING *`,
    [title, content, req.user.id, tags || []]
  );
  await pool.query(`UPDATE users SET contribution_score = contribution_score + 3 WHERE id = $1`, [req.user.id]);
  res.status(201).json(result.rows[0]);
});

router.get('/:id', auth, async (req, res) => {
  await pool.query('UPDATE discussions SET view_count = view_count + 1 WHERE id = $1', [req.params.id]);

  const discussion = await pool.query(`
    SELECT d.*, u.name as author_name, u.branch as author_branch
    FROM discussions d LEFT JOIN users u ON u.id = d.author_id
    WHERE d.id = $1
  `, [req.params.id]);

  const comments = await pool.query(`
    SELECT dc.*, u.name as author_name, u.branch as author_branch,
      (SELECT value FROM votes WHERE entity_type='comment' AND entity_id=dc.id AND user_id=$2) as my_vote
    FROM discussion_comments dc
    LEFT JOIN users u ON u.id = dc.author_id
    WHERE dc.discussion_id = $1
    ORDER BY dc.is_accepted DESC, dc.vote_count DESC, dc.created_at ASC
  `, [req.params.id, req.user.id]);

  if (!discussion.rows.length) return res.status(404).json({ error: 'Discussion not found' });
  res.json({ ...discussion.rows[0], comments: comments.rows });
});

router.post('/:id/comments', auth, async (req, res) => {
  const { content, parent_id } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });

  const result = await pool.query(
    `INSERT INTO discussion_comments (discussion_id, parent_id, author_id, content) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.params.id, parent_id || null, req.user.id, content]
  );
  await pool.query(`UPDATE discussions SET answer_count = answer_count + 1 WHERE id = $1`, [req.params.id]);
  await pool.query(`UPDATE users SET contribution_score = contribution_score + 2 WHERE id = $1`, [req.user.id]);
  res.status(201).json(result.rows[0]);
});

router.post('/:id/vote', auth, async (req, res) => {
  const { value } = req.body;
  if (![1, -1].includes(value)) return res.status(400).json({ error: 'Vote must be 1 or -1' });

  const existing = await pool.query(
    `SELECT value FROM votes WHERE user_id=$1 AND entity_type='discussion' AND entity_id=$2`,
    [req.user.id, req.params.id]
  );

  if (existing.rows.length) {
    if (existing.rows[0].value === value) {
      await pool.query(`DELETE FROM votes WHERE user_id=$1 AND entity_type='discussion' AND entity_id=$2`, [req.user.id, req.params.id]);
      await pool.query(`UPDATE discussions SET vote_count = vote_count - $1 WHERE id = $2`, [value, req.params.id]);
      return res.json({ removed: true });
    }
    await pool.query(`UPDATE votes SET value=$1 WHERE user_id=$2 AND entity_type='discussion' AND entity_id=$3`, [value, req.user.id, req.params.id]);
    await pool.query(`UPDATE discussions SET vote_count = vote_count + $1 WHERE id = $2`, [value * 2, req.params.id]);
  } else {
    await pool.query(`INSERT INTO votes (user_id, entity_type, entity_id, value) VALUES ($1,'discussion',$2,$3)`, [req.user.id, req.params.id, value]);
    await pool.query(`UPDATE discussions SET vote_count = vote_count + $1 WHERE id = $2`, [value, req.params.id]);
  }
  res.json({ voted: true, value });
});

router.post('/comments/:id/vote', auth, async (req, res) => {
  const { value } = req.body;
  if (![1, -1].includes(value)) return res.status(400).json({ error: 'Vote must be 1 or -1' });

  const existing = await pool.query(
    `SELECT value FROM votes WHERE user_id=$1 AND entity_type='comment' AND entity_id=$2`,
    [req.user.id, req.params.id]
  );

  if (existing.rows.length) {
    if (existing.rows[0].value === value) {
      await pool.query(`DELETE FROM votes WHERE user_id=$1 AND entity_type='comment' AND entity_id=$2`, [req.user.id, req.params.id]);
      await pool.query(`UPDATE discussion_comments SET vote_count = vote_count - $1 WHERE id = $2`, [value, req.params.id]);
      return res.json({ removed: true });
    }
    await pool.query(`UPDATE votes SET value=$1 WHERE user_id=$2 AND entity_type='comment' AND entity_id=$3`, [value, req.user.id, req.params.id]);
    await pool.query(`UPDATE discussion_comments SET vote_count = vote_count + $1 WHERE id = $2`, [value * 2, req.params.id]);
  } else {
    await pool.query(`INSERT INTO votes (user_id, entity_type, entity_id, value) VALUES ($1,'comment',$2,$3)`, [req.user.id, req.params.id, value]);
    await pool.query(`UPDATE discussion_comments SET vote_count = vote_count + $1 WHERE id = $2`, [value, req.params.id]);
  }
  res.json({ voted: true, value });
});

router.patch('/comments/:id/accept', auth, async (req, res) => {
  const comment = await pool.query(`
    SELECT dc.*, d.author_id as discussion_author
    FROM discussion_comments dc
    JOIN discussions d ON d.id = dc.discussion_id
    WHERE dc.id = $1
  `, [req.params.id]);

  if (!comment.rows.length) return res.status(404).json({ error: 'Comment not found' });
  if (comment.rows[0].discussion_author !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

  await pool.query(`UPDATE discussion_comments SET is_accepted = NOT is_accepted WHERE id = $1`, [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
