const request = require("supertest");
const app = require("../app");
const {
  resetDatabase,
  seedApplicant,
  seedReport,
  seedUser,
  db
} = require("./testUtils");

describe("Student Submission (Work-Term Report Upload)", () => {
  let agent;

  beforeEach(async () => {
    resetDatabase();

    seedApplicant({
      name: "Eric Liu",
      studentID: "501111111",
      email: "eric@torontomu.ca"
    });

    seedReport({
      studentID: "501111111"
    });

    seedUser({
      username: "501111111",
      password: "pass123",
      role: "applicant"
    });

    agent = request.agent(app);

    await agent.post("/login").send({
      username: "501111111",
      password: "pass123"
    });
  });

  test("upload_pdf_valid", async () => {
    const res = await agent
      .post("/uploadReport")
      .attach("report", Buffer.from("%PDF-1.4 fake pdf"), "report.pdf");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Report uploaded successfully");
  });

  test("upload_non_pdf_rejected", async () => {
    const res = await agent
      .post("/uploadReport")
      .attach("report", Buffer.from("not a pdf"), "report.docx");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Only PDF files are allowed!");
  });

  test("upload_pdf_too_large", async () => {
    const bigBuffer = Buffer.alloc(10 * 1024 * 1024 + 1, "a");

    const res = await agent
      .post("/uploadReport")
      .attach("report", bigBuffer, "big.pdf");

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/File too large/i);
  });

  test("upload_no_file", async () => {
    const res = await agent.post("/uploadReport");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("No file uploaded");
  });

  test("upload_not_logged_in", async () => {
    const res = await request(app)
      .post("/uploadReport")
      .attach("report", Buffer.from("%PDF-1.4 fake pdf"), "report.pdf");

    expect(res.status).toBe(401);
  });

  test("report_link_correct_student", async () => {
    await agent
      .post("/uploadReport")
      .attach("report", Buffer.from("%PDF-1.4 fake pdf"), "report.pdf");

    const report = db.prepare(
      "SELECT * FROM reports WHERE studentID = ?"
    ).get("501111111");

    expect(report).toBeTruthy();
    expect(report.report_filename).toBe("501111111_report.pdf");
    expect(report.report_status).toBe("Submitted");
    expect(report.report_uploaded).toBe(1);
  });

  test("upload_pdf_edge_size", async () => {
    const limitBuffer = Buffer.alloc(10 * 1024 * 1024, "a");
    const pdfLikeBuffer = Buffer.concat([
      Buffer.from("%PDF-1.4\n"),
      limitBuffer.slice(0, limitBuffer.length - 9)
    ]);

    const res = await agent
      .post("/uploadReport")
      .attach("report", pdfLikeBuffer, "edge.pdf");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Report uploaded successfully");
  });
});