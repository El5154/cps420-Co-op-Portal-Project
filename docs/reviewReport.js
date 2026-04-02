const nameSpan = document.getElementById("name");
const studentIDSpan = document.getElementById("studentID");
const message = document.getElementById("message");
const backBtn = document.getElementById("backBtn");
const reportDetailsTableBody = document.getElementById("reportDetailsTableBody");
const deadlineInput = document.getElementById("deadline");
const setDeadlineBtn = document.getElementById("setDeadline");
const supervisorInput = document.getElementById("supervisor");
const setSupervisorBtn = document.getElementById("setSupervisor");
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

function renderReportRow({
  reportStatus,
  reportFilename,
  formattedSubmittedAt,
  formattedDeadline,
  evaluationStatus,
  evaluationFile,
  supervisorCell
}) {
  const row = document.createElement("tr");

  const filenameCell =
    reportStatus !== "Not Submitted" && reportFilename
      ? `<a href="${BASE_URL}/reports/${reportFilename}" target="_blank" rel="noopener">${reportFilename}</a>`
      : "-";

  const evaluationnameCell =
    evaluationStatus !== "Not Evaluated" && evaluationFile
      ? `<a href="${BASE_URL}/evaluations/${evaluationFile}" target="_blank" rel="noopener">${evaluationFile}</a>`
      : evaluationStatus !== "Not Evaluated"
        ? evaluationStatus
        : "-";

  const submittedAtCell =
    reportStatus !== "Not Submitted" && reportFilename
      ? formattedSubmittedAt
      : "-";

  row.innerHTML = `
    <td>${reportStatus}</td>
    <td>${filenameCell}</td>
    <td>${submittedAtCell}</td>
    <td>${formattedDeadline}</td>
    <td>${evaluationnameCell}</td>
    <td>${supervisorCell}</td>
  `;

  reportDetailsTableBody.appendChild(row);
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
      const reportFilename = data.report_filename || null;
      const evaluationFile = data.evaluation_filename || null;
      const supervisorCell = data.supervisor || "-";

      renderReportRow({
        reportStatus,
        reportFilename,
        formattedSubmittedAt,
        formattedDeadline,
        evaluationStatus,
        evaluationFile,
        supervisorCell
      });

    } else {
      showMessage(data.error || "Failed to load report review.", "error");
    }
  } catch (error) {
    showMessage("Could not connect to the server.", "error");
  }
}

backBtn.addEventListener("click", async () => {
    window.location.href = "coordinator.html";
});

setDeadlineBtn.addEventListener("click", async () => {
  const selectedDate = deadlineInput.value;

  if (!selectedDate) {
    showMessage("Please input a deadline", "error");
    return;
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
      showMessage(data.error || "Failed to set deadline", "error");
      return;
    }

    showMessage("Deadline set successfully", "success");
    deadlineInput.value = "";
    await loadReviewReport();
  } catch (err) {
    showMessage("Deadline failed to set", "error");
  }
});

setSupervisorBtn.addEventListener("click", async () => {
  const supervisorInput = supervisor.value.trim();

  if (!supervisorInput) {
    return showMessage("Please input a supervisor name", "error");
  }

  try {
    const res = await fetch(`${BASE_URL}/applicants/${applicantId}/supervisor`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ supervisor: supervisorInput })
    });

    const data = await res.json();

    if (!res.ok) {
      return showMessage(data.error || "Failed to set supervisor", "error");
    }

    showMessage("Supervisor set successfully", "success");
    supervisor.value = "";
    loadReviewReport();
  } catch (error) {
    showMessage("Could not connect to the server.", "error");
  }
})

loadReviewReport();