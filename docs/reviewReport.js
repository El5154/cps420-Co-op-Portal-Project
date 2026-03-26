const nameSpan = document.getElementById("name");
const studentIDSpan = document.getElementById("studentID");
const message = document.getElementById("message");
const backBtn = document.getElementById("backBtn");
const reportDetailsTableBody = document.getElementById("reportDetailsTableBody");

function showMessage(text, type) {
    message.textContent = text;
    message.className = "message";
    if (type) message.classList.add(type);
}

async function loadReviewReport() {
    
    try {
        // coordinator page navigates as ?applicantId=123
        const applicantId = new URLSearchParams(window.location.search).get("applicantId");
        if (!applicantId) {
            showMessage("Missing applicant ID", "error");
            return;
        }
        const response = await fetch(`${BASE_URL}/applicants/${applicantId}/review`, {
            method: "GET",
            credentials: "include"
        });

        const data = await response.json();

        if (response.ok) {
            nameSpan.textContent = data.name || "-";
            studentIDSpan.textContent = data.studentID || "-";

            // Populate report details table
            reportDetailsTableBody.innerHTML = "";
            const reportStatus = data.report_status || "Not Submitted";
            const evaluationStatus = data.evaluation_status || "Not Evaluated";
            const reportFilename = data.report_filename;
            const submittedAt = data.report_uploaded_at || "-";
            const deadline = data.deadline || "-";

            if (reportStatus !== "Not Submitted" && reportFilename) {
              const row = document.createElement("tr");
              row.style.borderBottom = "1px solid #ddd";
              
              row.innerHTML = `
                <td style="padding: 8px;">${reportStatus}</td>
                <td style="padding: 8px;"><a href="${BASE_URL}/reports/${reportFilename}" target="_blank" rel="noopener">${reportFilename}</a></td>
                <td style="padding: 8px;">${submittedAt}</td>
                <td style="padding: 8px;">${deadline}</td>
                <td style="padding: 8px;">${evaluationStatus}</td>
              `;
              reportDetailsTableBody.appendChild(row);
            } else {
              reportDetailsTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 10px;">No report submitted</td></tr>`;
            }

        } else {
            showMessage(data.error || "Failed to load report review.", "error");
        }

    } catch (error) {
        showMessage("Could not connect to the server.", "error");
    }

}

backBtn.addEventListener("click", async () => {
    try {
        const response = await fetch(`${BASE_URL}/back`, {
            method: "POST",
            credentials: "include"
        });

        if (response.ok) {
            window.location.href = "coordinator.html";
        } else {
            const data = await response.json();
            showMessage(data.error || "Failed to log out.", "error");
        }
    } catch (error) {
        showMessage("Could not connect to the server.", "error");
    }  
});

// Load report review info on page load
loadReviewReport();