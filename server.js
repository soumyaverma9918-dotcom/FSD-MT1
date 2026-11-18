/**
 * ==============================================================================
 * SET B - STUDENT COURSE ENROLLMENT API
 * ==============================================================================
 * Student Name   : Soumya Verma
 * Section        : CSE 36
 * Technology     : Node.js & Express.js
 * In-Memory Data : JavaScript Array
 * ==============================================================================
 */

const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON payloads
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ==============================================================================
// INITIAL IN-MEMORY DATA STORE
// ==============================================================================
let enrollments = [
  {
    id: 601,
    studentName: "Aarav Gupta",
    courseCode: "CS301",
    courseName: "Data Structures",
    semester: 3,
    attendance: 82
  },
  {
    id: 602,
    studentName: "Meera Joshi",
    courseCode: "CS305",
    courseName: "Database Systems",
    semester: 3,
    attendance: 74
  },
  {
    id: 603,
    studentName: "Kabir Khan",
    courseCode: "CS310",
    courseName: "Computer Networks",
    semester: 3,
    attendance: 91
  }
];

// Helper to generate a unique numeric ID
function generateUniqueId() {
  if (enrollments.length === 0) return 601;
  const maxId = Math.max(...enrollments.map(e => e.id));
  return maxId + 1;
}

// Validation helper for POST and PUT requests
function validateEnrollmentPayload(body) {
  const { studentName, courseCode, courseName, semester, attendance } = body;

  // Validate required string fields
  if (!studentName || typeof studentName !== 'string' || studentName.trim() === '') {
    return 'studentName is required and must be a non-empty string.';
  }
  if (!courseCode || typeof courseCode !== 'string' || courseCode.trim() === '') {
    return 'courseCode is required and must be a non-empty string.';
  }
  if (!courseName || typeof courseName !== 'string' || courseName.trim() === '') {
    return 'courseName is required and must be a non-empty string.';
  }

  // Validate semester: must be a positive integer
  const semNum = Number(semester);
  if (
    semester === undefined ||
    semester === null ||
    semester === '' ||
    isNaN(semNum) ||
    !Number.isInteger(semNum) ||
    semNum <= 0
  ) {
    return 'semester is required and must be a positive integer (greater than 0).';
  }

  // Validate attendance: numeric value between 0 and 100
  const attNum = Number(attendance);
  if (
    attendance === undefined ||
    attendance === null ||
    attendance === '' ||
    isNaN(attNum) ||
    attNum < 0 ||
    attNum > 100
  ) {
    return 'attendance is required and must be a numeric value between 0 and 100.';
  }

  return null; // Valid
}

// ==============================================================================
// ROOT / WELCOME ROUTE
// ==============================================================================
app.get('/', (req, res) => {
  res.status(200).json({
    message: "Welcome to Student Course Enrollment API (SET B)",
    student: {
      name: "Soumya Verma",
      section: "CSE 36"
    },
    endpoints: {
      getAllEnrollments: "GET /api/enrollments",
      getLowAttendance: "GET /api/enrollments/low-attendance",
      filterBySemester: "GET /api/enrollments/filter?semester=3",
      getEnrollmentById: "GET /api/enrollments/:id",
      createEnrollment: "POST /api/enrollments",
      updateEnrollment: "PUT /api/enrollments/:id",
      deleteEnrollment: "DELETE /api/enrollments/:id"
    }
  });
});

// ==============================================================================
// 1. GET ALL ENROLLMENT RECORDS
// GET /api/enrollments
// Return all records in JSON format with HTTP 200.
// ==============================================================================
app.get('/api/enrollments', (req, res) => {
  return res.status(200).json(enrollments);
});

// ==============================================================================
// 7. GET LOW-ATTENDANCE ENROLLMENTS
// GET /api/enrollments/low-attendance
// Return only records where attendance is below 75 (< 75). Return HTTP 200.
// NOTE: Declared BEFORE dynamic `/:id` route to avoid being matched as ID.
// ==============================================================================
app.get('/api/enrollments/low-attendance', (req, res) => {
  const lowAttendanceRecords = enrollments.filter(e => Number(e.attendance) < 75);
  return res.status(200).json(lowAttendanceRecords);
});

// ==============================================================================
// 6. FILTER ENROLLMENT RECORDS BY SEMESTER
// GET /api/enrollments/filter?semester=value
// Filter enrollments by semester using a query parameter. Return HTTP 200.
// NOTE: Declared BEFORE dynamic `/:id` route to avoid being matched as ID.
// ==============================================================================
app.get('/api/enrollments/filter', (req, res) => {
  const { semester } = req.query;

  if (semester === undefined || semester === null || semester === '') {
    // If no semester query parameter is passed, return all records
    return res.status(200).json(enrollments);
  }

  const semNum = Number(semester);
  if (isNaN(semNum)) {
    return res.status(200).json([]);
  }

  const filteredRecords = enrollments.filter(e => Number(e.semester) === semNum);
  return res.status(200).json(filteredRecords);
});

// ==============================================================================
// 3. GET ENROLLMENT BY ID
// GET /api/enrollments/:id
// Return matching record. If the ID does not exist, return HTTP 404.
// ==============================================================================
app.get('/api/enrollments/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(404).json({ error: `Enrollment with ID '${req.params.id}' not found.` });
  }

  const record = enrollments.find(e => e.id === id);

  if (!record) {
    return res.status(404).json({ error: `Enrollment with ID ${id} not found.` });
  }

  return res.status(200).json(record);
});

// ==============================================================================
// 2. POST A NEW ENROLLMENT RECORD
// POST /api/enrollments
// Accept JSON object, validate all required fields, generate unique numeric id,
// add record to array, and return created record with HTTP 201.
// Invalid input must return HTTP 400.
// ==============================================================================
app.post('/api/enrollments', (req, res) => {
  const validationError = validateEnrollmentPayload(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const { studentName, courseCode, courseName, semester, attendance } = req.body;

  const newRecord = {
    id: generateUniqueId(),
    studentName: studentName.trim(),
    courseCode: courseCode.trim(),
    courseName: courseName.trim(),
    semester: Number(semester),
    attendance: Number(attendance)
  };

  enrollments.push(newRecord);
  return res.status(201).json(newRecord);
});

// ==============================================================================
// 4. PUT / UPDATE AN ENROLLMENT RECORD
// PUT /api/enrollments/:id
// Update requested record using JSON body. Return updated record with HTTP 200.
// If not found, return HTTP 404. Invalid input returns HTTP 400.
// ==============================================================================
app.put('/api/enrollments/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(404).json({ error: `Enrollment with ID '${req.params.id}' not found.` });
  }

  const index = enrollments.findIndex(e => e.id === id);
  if (index === -1) {
    return res.status(404).json({ error: `Enrollment with ID ${id} not found.` });
  }

  const validationError = validateEnrollmentPayload(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const { studentName, courseCode, courseName, semester, attendance } = req.body;

  const updatedRecord = {
    id: id,
    studentName: studentName.trim(),
    courseCode: courseCode.trim(),
    courseName: courseName.trim(),
    semester: Number(semester),
    attendance: Number(attendance)
  };

  enrollments[index] = updatedRecord;
  return res.status(200).json(updatedRecord);
});

// ==============================================================================
// 5. DELETE AN ENROLLMENT RECORD
// DELETE /api/enrollments/:id
// Delete requested record and return suitable success message with HTTP 200.
// If not found, return HTTP 404.
// ==============================================================================
app.delete('/api/enrollments/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(404).json({ error: `Enrollment with ID '${req.params.id}' not found.` });
  }

  const index = enrollments.findIndex(e => e.id === id);
  if (index === -1) {
    return res.status(404).json({ error: `Enrollment with ID ${id} not found.` });
  }

  const deletedRecord = enrollments.splice(index, 1)[0];
  return res.status(200).json({
    message: `Enrollment with ID ${id} deleted successfully.`,
    deletedRecord: deletedRecord
  });
});

// ==============================================================================
// GLOBAL ERROR HANDLER (e.g. for Malformed JSON in request bodies)
// ==============================================================================
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON payload.' });
  }
  console.error('Unhandled Server Error:', err);
  return res.status(500).json({ error: 'Internal Server Error.' });
});

// ==============================================================================
// SERVER START
// ==============================================================================
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`Student Course Enrollment API (SET B) is running`);
    console.log(`Student : Soumya Verma | Section : CSE 36`);
    console.log(`Server  : http://localhost:${PORT}`);
    console.log(`====================================================`);
  });
}

module.exports = app;
