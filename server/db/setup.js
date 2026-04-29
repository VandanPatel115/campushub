require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function setup() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await pool.query(schema);
    console.log('Database schema created successfully');

    // Seed demo admin user
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, branch, year)
       VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email) DO NOTHING`,
      ['Admin User', 'admin@campushub.edu', hash, 'admin', 'Administration', null]
    );

    // Seed demo student
    const studentHash = await bcrypt.hash('student123', 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, branch, year, skills)
       VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (email) DO NOTHING`,
      ['Alex Johnson', 'alex@campushub.edu', studentHash, 'student', 'Computer Science', 3, ['JavaScript', 'React', 'Python']]
    );

    // Seed demo clubs
    await pool.query(`
      INSERT INTO clubs (name, description, category) VALUES
        ('Coding Club', 'Learn, build, and innovate with code', 'Technical'),
        ('Sports Club', 'Football, cricket, badminton and more', 'Sports'),
        ('Photography Club', 'Capture the world through your lens', 'Arts'),
        ('Debate Society', 'Sharpen your arguments and public speaking', 'Academic')
      ON CONFLICT (name) DO NOTHING
    `);

    // Seed demo notices
    const adminResult = await pool.query(`SELECT id FROM users WHERE email = 'admin@campushub.edu'`);
    if (adminResult.rows.length > 0) {
      const adminId = adminResult.rows[0].id;
      await pool.query(`
        INSERT INTO notices (title, content, category, is_pinned, author_id) VALUES
          ('Mid-Semester Exam Schedule Released', 'Mid-semester exams will begin on May 15th. Check your department notice board for subject-wise schedules.', 'exam', true, $1),
          ('Annual Tech Fest – TechCon 2026', 'Registration open for TechCon 2026! Events include hackathon, coding contest, and project expo.', 'event', false, $1),
          ('Internship Fair – Top 50 Companies', 'Campus internship fair on May 20th. Bring updated resume. Pre-register by May 10th.', 'internship', true, $1),
          ('Library Timings Extended', 'Library will remain open until 11 PM during exam season starting from May 1st.', 'general', false, $1)
      `, [adminId]);
    }

    console.log('Seed data inserted successfully');
    process.exit(0);
  } catch (err) {
    console.error('Setup failed:', err.message);
    process.exit(1);
  }
}

setup();
