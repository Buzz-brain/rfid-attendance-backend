const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const moment = require('moment');

// @route   POST /api/sessions/start
// @desc    Start a new session (lecturer only)
// @access  Lecturer
exports.startSession = async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId) return res.status(400).json({ success: false, message: 'Course ID required' });
    // Ensure only one active session per course
    const existing = await Session.findOne({ course: courseId, isActive: true });
    if (existing) return res.status(400).json({ success: false, message: 'Session already active for this course' });
    const session = await Session.create({
      course: courseId,
      lecturer: req.user._id,
      sessionDate: new Date(),
      isActive: true
    });
    const populatedSession = await Session.findById(session._id).populate('course').populate('lecturer');
    res.status(201).json({ success: true, data: populatedSession });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route   PATCH /api/sessions/:id/end
// @desc    End a session (lecturer only)
// @access  Lecturer
exports.endSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (!session.isActive) return res.status(400).json({ success: false, message: 'Session already ended' });
    session.isActive = false;
    await session.save();
    res.json({ success: true, message: 'Session ended', data: session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route   GET /api/sessions/active
// @desc    Get all active sessions
// @access  Lecturer/Admin
exports.getActiveSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ isActive: true }).populate('course').populate('lecturer');
    res.json({ success: true, data: sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route   GET /api/sessions/recent
// @desc    Get recent sessions (last 10)
// @access  Lecturer/Admin
exports.getRecentSessions = async (req, res) => {
  try {
    // Get recent sessions
    const sessions = await Session.find().sort({ sessionDate: -1 }).limit(10).populate('course').populate('lecturer');
    // For each session, count unique students who marked attendance
    const sessionIds = sessions.map(s => s._id);
    // Aggregate attendance by session, counting unique students
    const attendanceCounts = await Attendance.aggregate([
      { $match: { session: { $in: sessionIds } } },
      { $group: { _id: "$session", uniqueStudents: { $addToSet: "$student" } } },
      { $project: { session: "$_id", attendeesCount: { $size: "$uniqueStudents" } } }
    ]);
    // Map sessionId to attendeesCount
    const countMap = {};
    attendanceCounts.forEach(a => { countMap[a.session.toString()] = a.attendeesCount; });
    // Attach attendeesCount to each session
    const sessionsWithCounts = sessions.map(s => {
      const obj = s.toObject();
      obj.attendeesCount = countMap[s._id.toString()] || 0;
      return obj;
    });
    res.json({ success: true, data: sessionsWithCounts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
