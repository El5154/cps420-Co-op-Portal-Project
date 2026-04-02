const request = require("supertest");
const app = require("../app");
const {
  resetDatabase,
  seedApplicant,
  seedReport,
  seedUser,
  db
} = require("./testUtils");

describe("Upload Report", () => {
  let agent;

  beforeEach(async () => {
    resetDatabase();

    seedUser({
      username: "123456789",
      password: "password",
      role: "applicant"
    });

    seedApplicant({
      name: "Test Student",
      studentID: "123456789",
      email: "student@torontomu.ca"
    });

    db.prepare(`
      UPDATE applicants
      SET final_status = ?
      WHERE studentID = ?
    `).run("Accepted", "123456789");

    seedReport({
      studentID: "123456789",
      report_status: "Not Submitted",
      evaluation_status: "Not Evaluated",
      deadline: "2099-12-31T23:59:00"
    });

    agent = request.agent(app);

    await agent.post("/login").send({
      username: "123456789",
      password: "password"
    });
  });

  test("upload_success_when_final_status_accepted", async () => {
    const pdfLikeBuffer = Buffer.from("%PDF-1.4 test pdf content");

    const res = await agent
      .patch("/uploadReport")
      .attach("report", pdfLikeBuffer, "report.pdf");

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Report uploaded successfully");

    const report = db.prepare(`
      SELECT report_status, report_filename, report_uploaded, report_uploaded_at
      FROM reports
      WHERE studentID = ?
    `).get("123456789");

    expect(report.report_status).toBe("Submitted");
    expect(report.report_filename).toBe("123456789_report.pdf");
    expect(report.report_uploaded).toBe(1);
    expect(report.report_uploaded_at).toBeTruthy();
  });

  test("upload_reject_if_not_logged_in", async () => {
    const pdfLikeBuffer = Buffer.from("%PDF-1.4 test pdf content");

    const res = await request(app)
      .patch("/uploadReport")
      .attach("report", pdfLikeBuffer, "report.pdf");

    expect(res.statusCode).toBe(401);
  });

  test("upload_reject_if_final_status_not_accepted", async () => {
    db.prepare(`
      UPDATE applicants
      SET final_status = ?
      WHERE studentID = ?
    `).run("Pending", "123456789");

    const pdfLikeBuffer = Buffer.from("%PDF-1.4 test pdf content");

    const res = await agent
      .patch("/uploadReport")
      .attach("report", pdfLikeBuffer, "report.pdf");

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe(
      "You cannot upload a report until your final status is Accepted"
    );
  });

  test("upload_reject_if_reports_row_missing", async () => {
    db.prepare(`
      DELETE FROM reports
      WHERE studentID = ?
    `).run("123456789");

    const pdfLikeBuffer = Buffer.from("%PDF-1.4 test pdf content");

    const res = await agent
      .patch("/uploadReport")
      .attach("report", pdfLikeBuffer, "report.pdf");

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  test("upload_reject_if_no_file_uploaded", async () => {
    const res = await agent.patch("/uploadReport");

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("No file uploaded");
  });

  test("upload_reject_if_file_empty", async () => {
    const emptyBuffer = Buffer.from("");

    const res = await agent
      .patch("/uploadReport")
      .attach("report", emptyBuffer, "empty.pdf");

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Uploaded file is empty");
  });

  test("upload_reject_if_not_pdf", async () => {
    const txtBuffer = Buffer.from("not a pdf");

    const res = await agent
      .patch("/uploadReport")
      .attach("report", txtBuffer, "note.txt");

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Only PDF files are allowed!");
  });

  test("upload_reject_if_file_too_large", async () => {
    const tooLargeBuffer = Buffer.alloc(10 * 1024 * 1024 + 2, "a");

    const res = await agent
      .patch("/uploadReport")
      .attach("report", tooLargeBuffer, "large.pdf");

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/File too large/i);
  });
});