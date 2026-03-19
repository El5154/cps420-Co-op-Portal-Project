// routes/review.js - Routes for reviewing and managing co-op applications
const express = require("express");
const router = express.Router();
const db = require("../config/applicants");

const requireAuth = require("../middleware/requireAuth");
const requireCoordinator = require("../middleware/requireCoordinator");

// GET /applicants - Get all co-op applicants (coordinator only)
router.get("/applicants", requireAuth, requireCoordinator, (req, res) => {
    const applicants = db.prepare("Select * FROM applicants").all();
    res.status(200).json(applicants);
});

// PATCH /applicants/:id/status - Update the status of a co-op application (coordinator only)
router.patch("/applicants/:id/status", requireAuth, requireCoordinator, (req, res) => {
    const { id } = req.params;
    const { provisional_status } = req.body;

    if (!provisional_status) {
        return res.status(400).json({ error: "Status is required" });
    }

    if (!["Accepted", "Rejected"].includes(provisional_status)) {
        return res.status(400).json({ error: "Invalid status value" });
    }

    const result = db.prepare(
        "UPDATE applicants SET provisional_status = ? WHERE id = ?"
    ).run(provisional_status, id);

    if (result.changes === 0) {
        return res.status(404).json({ error: "Applicant not found" });
    }

    res.status(200).send("Applicant status updated successfully" );
});

module.exports = router;