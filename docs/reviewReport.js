const nameSpan = document.getElementById("name");
const studentIDSpan = document.getElementById("studentID");
const message = document.getElementById("message");
const backBtn = document.getElementById("backBtn");
const reportDetailsTableBody = document.getElementById("reportDetailsTableBody");
const deadlineInput = document.getElementById("deadline");
const setDeadlineBtn = document.getElementById("setDeadline");
const applicantId = new URLSearchParams(window.location.search).get("applicantId");

function showMessage(text, type) {
    message.textContent = text;
    message.className = "message";
    if (type) message.classList.add(type);
}

function formatDateTime(value) {
  if (!value) return "-";

  const normalized = value.replace(" ", "T");
  const [datePart, timePart] = normalized.split("T");

  if (!datePart || !timePart) return value;

  const [year, month, day] = datePart.split("-");
  const [hourStr, minute] = timePart.split(":");

  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";

  hour = hour % 12;
  if (hour === 0) hour = 12;

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return `${monthNames[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}, ${hour}:${minute} ${ampm}`;
}

async function loadReviewReport() {
    try {
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

            const formattedDeadline = formatDateTime(data.deadline);
            const formattedSubmittedAt = formatDateTime(data.report_uploaded_at);

            reportDetailsTableBody.innerHTML = "";
            const reportStatus = data.report_status || "Not Submitted";
            const evaluationStatus = data.evaluation_status || "Not Evaluated";
            const reportFilename = data.report_filename;

            if (reportStatus !== "Not Submitted" && reportFilename) {
                const row = document.createElement("tr");
                row.style.borderBottom = "1px solid #ddd";

                row.innerHTML = `
                    <td style="padding: 8px;">${reportStatus}</td>
                    <td style="padding: 8px;"><a href="${BASE_URL}/reports/${reportFilename}" target="_blank" rel="noopener">${reportFilename}</a></td>
                    <td style="padding: 8px;">${formattedSubmittedAt}</td>
                    <td style="padding: 8px;">${formattedDeadline}</td>
                    <td style="padding: 8px;">${evaluationStatus}</td>
                `;
                reportDetailsTableBody.appendChild(row);
            } else {
                reportDetailsTableBody.innerHTML = `
                    <tr style="border-bottom: 1px solid #ddd;">
                        <td style="padding: 8px;">${reportStatus}</td>
                        <td style="padding: 8px;">-</td>
                        <td style="padding: 8px;">-</td>
                        <td style="padding: 8px;">${formattedDeadline}</td>
                        <td style="padding: 8px;">${evaluationStatus}</td>
                    </tr>
                `;
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

setDeadlineBtn.addEventListener("click", async () => {
    const selectedDate = deadlineInput.value;

    if (!selectedDate) {
        return showMessage("Please Input a Deadline", "error");
    }

    const deadline = `${selectedDate}T23:59:00`;

    try {
        const res = await fetch(`${BASE_URL}/applicants/${applicantId}/deadline`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ deadline })
        });

        const data = await res.json();

        if (!res.ok) {
            return showMessage(data.error || "Failed to Set Deadline", "error");
        }

        showMessage("Deadline Set Successfully", "success");
        deadlineInput.value = "";
        await loadReviewReport();
    } catch (err) {
        showMessage("Deadline Failed to Set", "error");
    }
});

// Load report review info on page load
loadReviewReport();