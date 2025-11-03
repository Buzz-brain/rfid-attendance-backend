const Student = require('../models/Student');
const { validationResult } = require('express-validator');

// @route   POST /api/students
// @desc    Create new student (assign RFID tag)
// @access  Admin
exports.createStudent = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    try {
        const { name, regNo, department, level, rfidTag, photo } = req.body;
        let student = await Student.findOne({ $or: [{ regNo }, { rfidTag }] });
        if (student) {
            return res.status(400).json({ success: false, message: 'Student with regNo or RFID tag already exists' });
        }
        student = new Student({ name, regNo, department, level, rfidTag, photo });
        await student.save();
        res.status(201).json({ success: true, message: 'Student created successfully', data: student });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @route   GET /api/students
// @desc    Get all students
// @access  Admin/Lecturer
exports.getAllStudents = async (req, res) => {
    try {
        const students = await Student.find();
        res.json({ success: true, message: 'Students fetched successfully', data: students });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @route   GET /api/students/:id
// @desc    Get student by ID
// @access  Admin/Lecturer
exports.getStudentById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        res.json({ success: true, message: 'Student fetched successfully', data: student });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @route   PUT /api/students/:id
// @desc    Update student info
// @access  Admin
exports.updateStudent = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    try {
        const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        res.json({ success: true, message: 'Student updated successfully', data: student });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @route   DELETE /api/students/:id
// @desc    Delete student
// @access  Admin
exports.deleteStudent = async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        res.json({ success: true, message: 'Student deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};