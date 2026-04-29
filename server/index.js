require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const noticesRoutes = require('./routes/notices');
const studyHubRoutes = require('./routes/studyHub');
const timetableRoutes = require('./routes/timetable');
const eventsRoutes = require('./routes/events');
const clubsRoutes = require('./routes/clubs');
const discussionsRoutes = require('./routes/discussions');
const profileRoutes = require('./routes/profile');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/notices', noticesRoutes);
app.use('/api/study-hub', studyHubRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/clubs', clubsRoutes);
app.use('/api/discussions', discussionsRoutes);
app.use('/api/profile', profileRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`CampusHub server running on port ${PORT}`));
