const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Course = require('../models/Course');
const { validationResult } = require('express-validator');
const moment = require('moment');

// @route   POST /api/attendance/mark
// @desc    Mark attendance by RFID scan
// @access  Lecturer
exports.markAttendance = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    try {
        const { rfidTag, courseId, sessionId } = req.body;
        const student = await Student.findOne({ rfidTag });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        if (!sessionId) {
            return res.status(400).json({ success: false, message: 'Session ID required' });
        }
        // Uniqueness per (student, session)
        const alreadyMarked = await Attendance.findOne({
            student: student._id,
            session: sessionId
        });
        if (alreadyMarked) {
            return res.status(400).json({ success: false, message: 'Attendance already marked for this session' });
        }
        const timeIn = moment().format('HH:mm:ss');
        const attendance = new Attendance({
            student: student._id,
            course: course._id,
            session: sessionId,
            date: new Date(),
            timeIn,
            status: 'Present',
            rfidTag
        });
        await attendance.save();
        // populate student fields for frontend convenience
        await attendance.populate('student', 'name regNo department level photo');
        await attendance.populate('course', 'courseCode courseTitle');
        await attendance.populate('session');

        res.status(201).json({
            success: true,
            message: 'Attendance recorded',
            data: attendance
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @route   GET /api/attendance/course/:courseId
// @desc    Get attendance records for a specific course
// @access  Lecturer/Admin
exports.getAttendanceByCourse = async (req, res) => {
    try {
        const records = await Attendance.find({ course: req.params.courseId })
            .populate('student', 'name regNo department level photo')
            .populate('course', 'courseCode courseTitle');
        res.json({ success: true, message: 'Attendance records fetched', data: records });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @route   GET /api/attendance/student/:studentId
// @desc    Get attendance history of a student
// @access  Lecturer/Admin
exports.getAttendanceByStudent = async (req, res) => {
    try {
        const records = await Attendance.find({ student: req.params.studentId })
            .populate('course', 'courseCode courseTitle')
            .populate('student', 'name regNo department level photo');
        res.json({ success: true, message: 'Attendance history fetched', data: records });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @route   GET /api/attendance/date/:date
// @desc    Get attendance records for a specific date
// @access  Admin/Lecturer
exports.getAttendanceByDate = async (req, res) => {
    try {
        const date = moment(req.params.date, 'YYYY-MM-DD');
        if (!date.isValid()) {
            return res.status(400).json({ success: false, message: 'Invalid date format' });
        }
        const records = await Attendance.find({
            date: {
                $gte: date.startOf('day').toDate(),
                $lt: date.endOf('day').toDate()
            }
        })
            .populate('student', 'name regNo department level photo')
            .populate('course', 'courseCode courseTitle');
        res.json({ success: true, message: 'Attendance records fetched', data: records });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @route   PUT /api/attendance/:id
// @desc    Update an attendance record
// @access  Admin
exports.updateAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!attendance) {
            return res.status(404).json({ success: false, message: 'Attendance record not found' });
        }
        res.json({ success: true, message: 'Attendance record updated', data: attendance });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @route   DELETE /api/attendance/:id
// @desc    Delete an attendance record
// @access  Admin
exports.deleteAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.findByIdAndDelete(req.params.id);
        if (!attendance) {
            return res.status(404).json({ success: false, message: 'Attendance record not found' });
        }
        res.json({ success: true, message: 'Attendance record deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};