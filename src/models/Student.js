const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    regNo: {
        type: String,
        required: [true, 'Registration number is required'],
        unique: true,
        trim: true
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
    },
    rfidTag: {
        type: String,
        required: [true, 'RFID tag is required'],
        unique: true,
        trim: true
    },
    photo: {
        type: String,
        default: 'default.jpg'
    }
}, {
    timestamps: true
});

// ...existing code...

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;