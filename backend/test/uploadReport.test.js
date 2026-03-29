const request = require("supertest");
const fs = require("fs");
const path = require("path");
const app = require("../app");
const {
  db,
  resetDatabase,
  seedUser,
  seedApplicant,
  seedReport
} = require("./testUtils");

describe("Upload Report", () => {
  let agent;
  const uploadDir = path.join(__dirname, "../uploads/reports");

  beforeEach(async () => {
    resetDatabase();

    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      for (const file of files) {
        fs.unlinkSync(path.join(uploadDir, file));
      }
    }

    agent = request.agent(app);
  });

  test("upload_success_when_final_status_accepted", async () => {
    seedApplicant({
      name: "Applicant User",
      studentID: "501234567",
      email: "applicant@torontomu.ca",
      final_status: "Accepted"
    });

    seedReport({
      studentID: "501234567",
      deadline: "2099-12-31T23:59:59"
    });

    seedUser({
      username: "501234567",
      password: "pass123",
      role: "applicant"
    });

    await agent.post("/login").send({
      username: "501234567",
      password: "pass123"
    });

    const pdfLikeBuffer = Buffer.from("%PDF-1.4 test pdf content");

    const res = await agent
      .post("/uploadReport")
      .attach("report", pdfLikeBuffer, "report.pdf");

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Report uploaded successfully");

    const report = db.prepare(
      "SELECT * FROM reports WHERE studentID = ?"
    ).get("501234567");

    expect(report).toBeTruthy();
    expect(report.report_status).toBe("Submitted");
    expect(report.report_filename).toBe("501234567_report.pdf");
    expect(report.report_uploaded).toBe(1);
    expect(report.report_uploaded_at).toBeTruthy();
    expect(report.report_path).toContain("501234567_report.pdf");
  });

  test("upload_reject_if_not_logged_in", async () => {
    const pdfLikeBuffer = Buffer.from("%PDF-1.4 test pdf content");

    const res = await request(app)
      .post("/uploadReport")
      .attach("report", pdfLikeBuffer, "report.pdf");

    expect(res.statusCode).not.toBe(200);
  });

  test("upload_reject_if_not_applicant", async () => {
    seedUser({
      username: "coord1",
      password: "pass123",
      role: "coordinator"
    });

    await agent.post("/login").send({
      username: "coord1",
      password: "pass123"
    });

    const pdfLikeBuffer = Buffer.from("%PDF-1.4 test pdf content");

    const res = await agent
      .post("/uploadReport")
      .attach("report", pdfLikeBuffer, "report.pdf");

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });

  test("upload_reject_if_studentID_missing_in_session", async () => {
    seedUser({
      username: "501234567",
      password: "pass123",
      role: "applicant"
    });

    await agent.post("/login").send({
      username: "501234567",
      password: "pass123"
    });

    const pdfLikeBuffer = Buffer.from("%PDF-1.4 test pdf content");

    const res = await agent
      .post("/uploadReport")
      .attach("report", pdfLikeBuffer, "report.pdf");

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Applicant student ID missing from session");
  });

  test("upload_reject_if_final_status_not_accepted", async () => {
    seedApplicant({
      name: "Applicant User",
      studentID: "501234567",
      email: "applicant@torontomu.ca",
      final_status: "Pending"
    });

    seedReport({
      studentID: "501234567",
      deadline: "2099-12-31T23:59:59"
    });

    seedUser({
      username: "501234567",
      password: "pass123",
      role: "applicant"
    });

    await agent.post("/login").send({
      username: "501234567",
      password: "pass123"
    });

    const pdfLikeBuffer = Buffer.from("%PDF-1.4 test pdf content");

    const res = await agent
      .post("/uploadReport")
      .attach("report", pdfLikeBuffer, "report.pdf");

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe(
      "You cannot upload a report until your final status is Accepted"
    );
  });

  test("upload_reject_if_reports_row_missing", async () => {
    seedApplicant({
      name: "Applicant User",
      studentID: "501234567",
      email: "applicant@torontomu.ca",
      final_status: "Accepted"
    });

    seedUser({
      username: "501234567",
      password: "pass123",
      role: "applicant"
    });

    await agent.post("/login").send({
      username: "501234567",
      password: "pass123"
    });

    const pdfLikeBuffer = Buffer.from("%PDF-1.4 test pdf content");

    const res = await agent
      .post("/uploadReport")
      .attach("report", pdfLikeBuffer, "report.pdf");

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("Report record not found");
  });

  test("upload_reject_if_no_deadline_set", async () => {
    seedApplicant({
      name: "Applicant User",
      studentID: "501234567",
      email: "applicant@torontomu.ca",
      final_status: "Accepted"
    });

    seedReport({
      studentID: "501234567",
      deadline: null
    });

    seedUser({
      username: "501234567",
      password: "pass123",
      role: "applicant"
    });

    await agent.post("/login").send({
      username: "501234567",
      password: "pass123"
    });

    const pdfLikeBuffer = Buffer.from("%PDF-1.4 test pdf content");

    const res = await agent
      .post("/uploadReport")
      .attach("report", pdfLikeBuffer, "report.pdf");

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("No deadline has been set for this applicant");
  });

  test("upload_reject_non_pdf", async () => {
    seedApplicant({
      name: "Applicant User",
      studentID: "501234567",
      email: "applicant@torontomu.ca",
      final_status: "Accepted"
    });

    seedReport({
      studentID: "501234567",
      deadline: "2099-12-31T23:59:59"
    });

    seedUser({
      username: "501234567",
      password: "pass123",
      role: "applicant"
    });

    await agent.post("/login").send({
      username: "501234567",
      password: "pass123"
    });

    const res = await agent
      .post("/uploadReport")
      .attach("report", Buffer.from("not a pdf"), "report.docx");

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Only PDF files are allowed!");
  });

  test("upload_reject_no_file", async () => {
    seedApplicant({
      name: "Applicant User",
      studentID: "501234567",
      email: "applicant@torontomu.ca",
      final_status: "Accepted"
    });

    seedReport({
      studentID: "501234567",
      deadline: "2099-12-31T23:59:59"
    });

    seedUser({
      username: "501234567",
      password: "pass123",
      role: "applicant"
    });

    await agent.post("/login").send({
      username: "501234567",
      password: "pass123"
    });

    const res = await agent.post("/uploadReport");

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("No file uploaded");
  });

  test("upload_reject_empty_file", async () => {
    seedApplicant({
      name: "Applicant User",
      studentID: "501234567",
      email: "applicant@torontomu.ca",
      final_status: "Accepted"
    });

    seedReport({
      studentID: "501234567",
      deadline: "2099-12-31T23:59:59"
    });

    seedUser({
      username: "501234567",
      password: "pass123",
      role: "applicant"
    });

    await agent.post("/login").send({
      username: "501234567",
      password: "pass123"
    });

    const emptyPdfBuffer = Buffer.alloc(0);

    const res = await agent
      .post("/uploadReport")
      .attach("report", emptyPdfBuffer, "empty.pdf");

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Uploaded file is empty");
  });

  test("upload_reject_file_too_large", async () => {
    seedApplicant({
      name: "Applicant User",
      studentID: "501234567",
      email: "applicant@torontomu.ca",
      final_status: "Accepted"
    });

    seedReport({
      studentID: "501234567",
      deadline: "2099-12-31T23:59:59"
    });

    seedUser({
      username: "501234567",
      password: "pass123",
      role: "applicant"
    });

    await agent.post("/login").send({
      username: "501234567",
      password: "pass123"
    });

    const bigBuffer = Buffer.alloc(10 * 1024 * 1024 + 2, "a");
    bigBuffer.write("%PDF-1.4");

    const res = await agent
      .post("/uploadReport")
      .attach("report", bigBuffer, "large.pdf");

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/File too large/i);
  });

  test("upload_edge_size_success", async () => {
    seedApplicant({
      name: "Applicant User",
      studentID: "501234567",
      email: "applicant@torontomu.ca",
      final_status: "Accepted"
    });

    seedReport({
      studentID: "501234567",
      deadline: "2099-12-31T23:59:59"
    });

    seedUser({
      username: "501234567",
      password: "pass123",
      role: "applicant"
    });

    await agent.post("/login").send({
      username: "501234567",
      password: "pass123"
    });

    const edgeBuffer = Buffer.alloc(10 * 1024 * 1024, "a");
    edgeBuffer.write("%PDF-1.4");

    const res = await agent
      .post("/uploadReport")
      .attach("report", edgeBuffer, "edge.pdf");

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Report uploaded successfully");
  });
});