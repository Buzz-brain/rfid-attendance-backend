const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: [true, 'Student is required']
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Course is required']
    },
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: [true, 'Session is required']
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    timeIn: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Present', 'Absent'],
        default: 'Present'
    },
    rfidTag: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Compound indices for common queries
attendanceSchema.index({ course: 1, date: 1 });
attendanceSchema.index({ student: 1, session: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;