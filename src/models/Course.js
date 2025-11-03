const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    courseCode: {
        type: String,
        required: [true, 'Course code is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    courseTitle: {
        type: String,
        required: [true, 'Course title is required'],
        trim: true
    },
    lecturer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Lecturer is required']
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        trim: true
    },
    level: {
        type: String,
        required: [true, 'Level is required'],
        trim: true
    }
}, {
    timestamps: true
});

// Compound index for department and level
courseSchema.index({ department: 1, level: 1 });

const Course = mongoose.model('Course', courseSchema);
module.exports = Course;