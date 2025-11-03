const express = require('express');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const moment = require('moment');

const router = express.Router();

// @route   POST /api/scan
// @desc    Mark attendance by RFID scan and return student info
// @access  Lecturer
router.post('/', async (req, res) => {
    try {
        const { rfidTag, courseId } = req.body;
        if (!rfidTag || !courseId) {
            return res.status(400).json({ success: false, message: 'rfidTag and courseId are required' });
        }
        const student = await Student.findOne({ rfidTag });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        const today = moment().startOf('day');
        const alreadyMarked = await Attendance.findOne({
            student: student._id,
            course: course._id,
            date: { $gte: today.toDate(), $lt: moment(today).endOf('day').toDate() }
        });
        if (alreadyMarked) {
            return res.status(400).json({ success: false, message: 'Attendance already marked for today' });
        }
        const timeIn = moment().format('HH:mm:ss');
        const attendance = new Attendance({
            student: student._id,
            course: course._id,
            date: new Date(),
            timeIn,
            status: 'Present',
            rfidTag
        });
        await attendance.save();
        res.status(201).json({
            status: 'success',
            message: 'Attendance recorded',
            student: {
                name: student.name,
                photo: student.photo
            },
            timeIn
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;