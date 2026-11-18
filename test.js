/**
 * Automated Test Suite for Student Course Enrollment API (SET B)
 * Tests all required endpoints, validations, and status codes.
 */

const http = require('http');
const app = require('./server');

const TEST_PORT = 3002;
let server;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: TEST_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(dataString ? { 'Content-Length': Buffer.byteLength(dataString) } : {})
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(responseBody);
        } catch (e) {
          json = responseBody;
        }
        resolve({ status: res.statusCode, body: json });
      });
    });

    req.on('error', reject);
    if (dataString) {
      req.write(dataString);
    }
    req.end();
  });
}

async function runTests() {
  server = app.listen(TEST_PORT, async () => {
    console.log(`\n====================================================`);
    console.log(`RUNNING SET B ENROLLMENT API TESTS ON PORT ${TEST_PORT}`);
    console.log(`====================================================\n`);

    let passed = 0;
    let failed = 0;

    function assert(name, condition, details = '') {
      if (condition) {
        console.log(`✅ PASS: ${name}`);
        passed++;
      } else {
        console.error(`❌ FAIL: ${name} -> ${details}`);
        failed++;
      }
    }

    try {
      // 1. Root route
      const rootRes = await request('GET', '/');
      assert('GET / (Welcome route)', rootRes.status === 200 && rootRes.body.student.name === 'Soumya Verma');

      // 2. GET all enrollments
      const getAllRes = await request('GET', '/api/enrollments');
      assert('GET /api/enrollments returns HTTP 200', getAllRes.status === 200);
      assert('Initial enrollments count is 3', Array.isArray(getAllRes.body) && getAllRes.body.length === 3);

      // 3. GET low-attendance enrollments (attendance < 75)
      const lowAttRes = await request('GET', '/api/enrollments/low-attendance');
      assert('GET /api/enrollments/low-attendance returns HTTP 200', lowAttRes.status === 200);
      assert('Low attendance returns only records < 75', lowAttRes.body.every(e => e.attendance < 75));
      assert('Meera Joshi (id 602, attendance 74) is included', lowAttRes.body.length === 1 && lowAttRes.body[0].id === 602);

      // 4. GET filter by semester
      const filterRes = await request('GET', '/api/enrollments/filter?semester=3');
      assert('GET /api/enrollments/filter?semester=3 returns HTTP 200', filterRes.status === 200);
      assert('Filter matches semester 3 enrollments', filterRes.body.length === 3);

      const filterEmptyRes = await request('GET', '/api/enrollments/filter?semester=8');
      assert('Filter for non-matching semester returns empty array with HTTP 200', filterEmptyRes.status === 200 && filterEmptyRes.body.length === 0);

      // 5. GET enrollment by ID
      const getByIdRes = await request('GET', '/api/enrollments/601');
      assert('GET /api/enrollments/601 returns HTTP 200', getByIdRes.status === 200 && getByIdRes.body.studentName === 'Aarav Gupta');

      const getByIdNotFound = await request('GET', '/api/enrollments/999');
      assert('GET /api/enrollments/999 returns HTTP 404', getByIdNotFound.status === 404);

      // 6. POST a new enrollment (Valid)
      const newEnrollmentPayload = {
        studentName: "Ishita Rao",
        courseCode: "CS315",
        courseName: "Operating Systems",
        semester: 3,
        attendance: 88
      };
      const postRes = await request('POST', '/api/enrollments', newEnrollmentPayload);
      assert('POST /api/enrollments returns HTTP 201', postRes.status === 201);
      assert('POST generated unique numeric ID (604)', postRes.body.id === 604);
      assert('POST returned created record matches input', postRes.body.studentName === "Ishita Rao");

      // 7. POST validation tests (HTTP 400)
      const invalidPost1 = await request('POST', '/api/enrollments', {
        ...newEnrollmentPayload,
        attendance: 105 // Over 100
      });
      assert('POST with attendance > 100 returns HTTP 400', invalidPost1.status === 400);

      const invalidPost2 = await request('POST', '/api/enrollments', {
        ...newEnrollmentPayload,
        attendance: -5 // Below 0
      });
      assert('POST with negative attendance returns HTTP 400', invalidPost2.status === 400);

      const invalidPost3 = await request('POST', '/api/enrollments', {
        ...newEnrollmentPayload,
        semester: -1 // Invalid semester
      });
      assert('POST with negative semester returns HTTP 400', invalidPost3.status === 400);

      const invalidPost4 = await request('POST', '/api/enrollments', {
        studentName: "Ishita Rao"
      });
      assert('POST with missing required fields returns HTTP 400', invalidPost4.status === 400);

      // 8. PUT / update record
      const updatePayload = {
        studentName: "Aarav Gupta",
        courseCode: "CS301",
        courseName: "Data Structures",
        semester: 4,
        attendance: 85
      };
      const putRes = await request('PUT', '/api/enrollments/601', updatePayload);
      assert('PUT /api/enrollments/601 returns HTTP 200', putRes.status === 200);
      assert('PUT updated semester to 4 and attendance to 85', putRes.body.semester === 4 && putRes.body.attendance === 85);

      // PUT validation tests
      const invalidPut = await request('PUT', '/api/enrollments/601', {
        ...updatePayload,
        attendance: "invalid"
      });
      assert('PUT with non-numeric attendance returns HTTP 400', invalidPut.status === 400);

      const notFoundPut = await request('PUT', '/api/enrollments/999', updatePayload);
      assert('PUT with non-existent ID returns HTTP 404', notFoundPut.status === 404);

      // 9. DELETE a record
      const deleteRes = await request('DELETE', '/api/enrollments/603');
      assert('DELETE /api/enrollments/603 returns HTTP 200', deleteRes.status === 200);

      const deleteNotFound = await request('DELETE', '/api/enrollments/603');
      assert('DELETE for already deleted record returns HTTP 404', deleteNotFound.status === 404);

      // Verify deletion in GET all
      const afterDeleteRes = await request('GET', '/api/enrollments');
      assert('Record 603 is removed from array', afterDeleteRes.body.every(e => e.id !== 603));

    } catch (err) {
      console.error('Test execution error:', err);
      failed++;
    } finally {
      server.close(() => {
        console.log(`\n====================================================`);
        console.log(`SET B TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
        console.log(`====================================================\n`);
        process.exit(failed > 0 ? 1 : 0);
      });
    }
  });
}

runTests();
