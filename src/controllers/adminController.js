const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const User = require('../models/User');
const Session = require('../models/Session');
const moment = require('moment');
const { Parser } = require('json2csv');

// @route   GET /api/admin/dashboard/overview
// @desc    Get overview statistics
// @access  Admin
exports.getOverview = async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments();
        const totalCourses = await Course.countDocuments();
        const totalLecturers = await User.countDocuments({ role: 'lecturer' });
        // Today range
        const todayStart = moment().startOf('day');
        const todayEnd = moment().endOf('day');

        // Present/absent counts for today
        const presentToday = await Attendance.countDocuments({
            date: { $gte: todayStart.toDate(), $lt: todayEnd.toDate() },
            status: 'Present'
        });
        const absentToday = Math.max(0, totalStudents - presentToday);

        // Sessions today
        const sessionsToday = await Session.countDocuments({
            sessionDate: { $gte: todayStart.toDate(), $lt: todayEnd.toDate() }
        });

        // Average attendance: if there are sessions today, compute as (presentToday) / (sessionsToday * totalStudents)
        let avgAttendance = 0;
        if (sessionsToday > 0 && totalStudents > 0) {
            avgAttendance = (presentToday / (sessionsToday * totalStudents)) * 100;
            avgAttendance = Math.round(avgAttendance * 100) / 100; // two decimals
        }

        // Attendance by course (today)
        const attendanceByCourseAgg = await Attendance.aggregate([
            { $match: { date: { $gte: todayStart.toDate(), $lt: todayEnd.toDate() }, status: 'Present' } },
            { $group: { _id: '$course', count: { $sum: 1 } } },
            { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
            { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
            { $project: { _id: 0, courseId: '$course._id', courseCode: '$course.courseCode', courseTitle: '$course.courseTitle', count: 1 } },
            { $sort: { count: -1 } }
        ]);

        // Students by department
        const studentsByDepartment = await Student.aggregate([
            { $group: { _id: '$department', count: { $sum: 1 } } },
            { $project: { department: '$_id', count: 1, _id: 0 } },
            { $sort: { count: -1 } }
        ]);

        // Current active sessions (populate course and lecturer and include attendeesCount for the session date)
        const activeSessions = await Session.find({ isActive: true }).populate('course').populate('lecturer').lean();
        const currentActiveSessions = await Promise.all(activeSessions.map(async (s) => {
            const sStart = moment(s.sessionDate).startOf('day');
            const sEnd = moment(s.sessionDate).endOf('day');
            let attendeesCount = 0;
            let courseInfo = null;
            if (s.course && s.course._id) {
                attendeesCount = await Attendance.countDocuments({ course: s.course._id, date: { $gte: sStart.toDate(), $lt: sEnd.toDate() }, status: 'Present' });
                courseInfo = { _id: s.course._id, courseCode: s.course.courseCode, courseTitle: s.course.courseTitle };
            }
            return {
                _id: s._id,
                course: courseInfo,
                lecturer: s.lecturer ? { _id: s.lecturer._id, name: s.lecturer.name } : null,
                sessionDate: s.sessionDate,
                attendeesCount
            };
        }));

        // Recent sessions (last 5)
        const recentSessionsRaw = await Session.find().sort({ sessionDate: -1 }).limit(5).populate('course').populate('lecturer').lean();
        const recentSessions = await Promise.all(recentSessionsRaw.map(async (s) => {
            const sStart = moment(s.sessionDate).startOf('day');
            const sEnd = moment(s.sessionDate).endOf('day');
            let attendeesCount = 0;
            let courseInfo = null;
            if (s.course && s.course._id) {
                attendeesCount = await Attendance.countDocuments({ course: s.course._id, date: { $gte: sStart.toDate(), $lt: sEnd.toDate() }, status: 'Present' });
                courseInfo = { _id: s.course._id, courseCode: s.course.courseCode, courseTitle: s.course.courseTitle };
            }
            return {
                _id: s._id,
                course: courseInfo,
                lecturer: s.lecturer ? { _id: s.lecturer._id, name: s.lecturer.name } : null,
                sessionDate: s.sessionDate,
                attendeesCount
            };
        }));

        res.json({
            success: true,
            message: 'Overview statistics fetched',
            data: {
                totalStudents,
                totalCourses,
                totalLecturers,
                presentToday,
                absentToday,
                sessionsToday,
                avgAttendance,
                attendanceByCourse: attendanceByCourseAgg,
                studentsByDepartment,
                currentActiveSessions,
                recentSessions
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @route   GET /api/admin/reports/export
// @desc    Generate/export attendance report (CSV)
// @access  Admin
exports.exportReport = async (req, res) => {
    try {
        // Support filtering by course and date via query params
        const { courseId, date } = req.query;
        const filter = {};
        if (courseId) filter.course = courseId;
        if (date) {
            const mDate = moment(date, 'YYYY-MM-DD');
            if (mDate.isValid()) {
                filter.date = {
                    $gte: mDate.startOf('day').toDate(),
                    $lt: mDate.endOf('day').toDate()
                };
            }
        }
        const records = await Attendance.find(filter)
            .populate('student', 'name regNo department level')
            .populate('course', 'courseCode courseTitle');
        const data = records.map(r => ({
            name: r.student?.name,
            regNo: r.student?.regNo,
            department: r.student?.department,
            level: r.student?.level,
            courseCode: r.course?.courseCode,
            courseTitle: r.course?.courseTitle,
            date: moment(r.date).format('YYYY-MM-DD'),
            timeIn: r.timeIn,
            status: r.status,
            rfidTag: r.rfidTag
        }));
        const parser = new Parser();
        const csv = parser.parse(data);
        res.header('Content-Type', 'text/csv');
        res.attachment('attendance_report.csv');
        return res.send(csv);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @route   GET /api/admin/activity
// @desc    System activity logs (placeholder)
// @access  Admin
exports.getActivityLogs = async (req, res) => {
    // Placeholder: In production, use a logging system or DB
    res.json({
        success: true,
        message: 'Activity logs fetched',
        data: [
            { action: 'User login', user: 'admin@example.com', time: moment().subtract(1, 'hour').toISOString() },
            { action: 'Attendance marked', user: 'lecturer@example.com', time: moment().subtract(2, 'hours').toISOString() }
        ]
    });
};

// @route   GET /api/admin/reports/export-pdf
// @desc    Generate/export attendance report (PDF)
// @access  Admin
exports.exportReportPDF = async (req, res) => {
    try {
        // Support filtering by course and date via query params
        const { courseId, date } = req.query;
        const filter = {};
        if (courseId) filter.course = courseId;
        if (date) {
            const mDate = moment(date, 'YYYY-MM-DD');
            if (mDate.isValid()) {
                filter.date = {
                    $gte: mDate.startOf('day').toDate(),
                    $lt: mDate.endOf('day').toDate()
                };
            }
        }
        // Professional PDF table export using pdfkit
    const PDFDocument = require('pdfkit');
    // Use landscape orientation for more horizontal space
    // Use standard A4 landscape, increase row height for visibility
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=attendance_report.pdf');
        doc.pipe(res);

        // Title
        doc.font('Helvetica-Bold').fontSize(22).fillColor('#222').text('Attendance Report', { align: 'center' });
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(12).fillColor('#444').text(`Exported: ${moment().format('YYYY-MM-DD HH:mm')}`, { align: 'center' });
        doc.moveDown(1.5);

        // Table headers
        const headers = [
            'Student', 'Reg No', 'Department', 'Level', 'Course', 'Date', 'Status', 'RFID'
        ];
        // Increased column widths for landscape orientation
    // Use balanced column widths
    const colWidths = [140, 90, 60, 80, 120, 100, 80, 120]; // Course column reduced
    const rowHeight = 50; // Increased row height for more vertical space
        const startX = doc.page.margins.left;
        let y = doc.y;

        // Draw header row
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#fff');
        doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill('#2563eb');
        let x = startX;
        headers.forEach((header, i) => {
            doc.fillColor('#fff').text(header, x + 6, y + 10, { width: colWidths[i] - 12, align: 'center' });
            x += colWidths[i];
        });
        y += rowHeight;

        // Fetch records
        const records = await Attendance.find(filter)
            .populate('student', 'name regNo department level')
            .populate('course', 'courseCode courseTitle');

        // Table rows
        let rowIndex = 0;
        records.forEach(r => {
            x = startX;
            // Alternating row color
            const rowColor = rowIndex % 2 === 0 ? '#f3f4f6' : '#e0e7ef';
            doc.rect(x, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill(rowColor);
            doc.font('Helvetica').fontSize(11).fillColor('#222');
            // Show only department abbreviation (e.g., IFT)
            let deptAbbr = '-';
            if (r.student?.department) {
                // If department contains 'Information Technology', show 'IFT'
                if (/information technology/i.test(r.student.department)) {
                    deptAbbr = 'IFT';
                } else {
                    // Otherwise, use first word's initials (e.g., Computer Science -> CS)
                    deptAbbr = r.student.department.split(' ').map(w => w[0]).join('').toUpperCase();
                }
            }
            const row = [
                r.student?.name || '-',
                r.student?.regNo || '-',
                deptAbbr,
                r.student?.level || '-',
                `${r.course?.courseCode || '-'} ${r.course?.courseTitle || ''}`,
                moment(r.date).format('YYYY-MM-DD'),
                r.status || '-',
                r.rfidTag || '-'
            ];
            row.forEach((cell, i) => {
                // Add extra vertical padding for the Course column
                const verticalPad = i === 4 ? 25 : 10;
                doc.text(cell, x + 6, y + verticalPad, { width: colWidths[i] - 12, align: 'center', ellipsis: true });
                x += colWidths[i];
            });
            y += rowHeight;
            rowIndex++;
            // Page break if needed
            if (y > doc.page.height - doc.page.margins.bottom - 40) {
                doc.addPage();
                y = doc.page.margins.top;
            }
        });

        // Footer summary
        doc.moveDown(2);
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#2563eb').text(`Total Records: ${records.length}`, { align: 'right' });
        doc.end();
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
// @route   GET /api/admin/users
// @desc    Get all users (admin/lecturer)
// @access  Admin
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({ success: true, data: users });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @route   POST /api/admin/users
// @desc    Create a new user (admin/lecturer)
// @access  Admin
exports.createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        user = new User({ name, email, password, role });
        await user.save();
        await require('../models/AuditLog').create({
            user: req.user._id,
            action: 'create_user',
            details: `Created user ${user.email} (${user.role})`
        });
        res.status(201).json({ success: true, data: { _id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @route   PUT /api/admin/users/:id
// @desc    Update user (admin/lecturer)
// @access  Admin
exports.updateUser = async (req, res) => {
    try {
        const { name, email, role, password } = req.body;
        const updates = { name, email, role };
        if (password) updates.password = password;
        const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        await require('../models/AuditLog').create({
            user: req.user._id,
            action: 'update_user',
            details: `Updated user ${user.email} (${user.role})`
        });
        res.json({ success: true, data: { _id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @route   DELETE /api/admin/users/:id
// @desc    Delete user (admin/lecturer)
// @access  Admin
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        await require('../models/AuditLog').create({
            user: req.user._id,
            action: 'delete_user',
            details: `Deleted user ${user.email} (${user.role})`
        });
        res.json({ success: true, message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @route   GET /api/admin/audit-logs
// @desc    Get audit logs
// @access  Admin
exports.getAuditLogs = async (req, res) => {
    try {
        const logs = await require('../models/AuditLog').find().populate('user', 'email name role').sort({ timestamp: -1 }).limit(100);
        res.json({ success: true, data: logs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};