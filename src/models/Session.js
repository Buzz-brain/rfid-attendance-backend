const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Course is required']
    },
    lecturer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Lecturer is required']
    },
    sessionDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for active sessions
sessionSchema.index({ isActive: 1, course: 1 });
// Ensure only one active session per course
sessionSchema.index({ course: 1, isActive: 1 }, { 
    unique: true, 
    partialFilterExpression: { isActive: true } 
});

const Session = mongoose.model('Session', sessionSchema);
module.exports = Session;