const message = document.getElementById("message");
const submitMessage = document.getElementById("submitMessage");
const logoutBtn = document.getElementById("logoutBtn");
const uploadBtn = document.getElementById("uploadBtn");
const submitBtn = document.getElementById("submitBtn");

const studentNameSpan = document.getElementById("studentName");
const studentIdSpan = document.getElementById("studentID");
const studentEmailSpan = document.getElementById("studentEmail");
const evaluationStatusSpan = document.getElementById("evaluationStatus");
const supervisorNameSpan = document.getElementById("supervisorName");
const supervisorEmailSpan = document.getElementById("supervisorEmail");
const performanceSpan = document.getElementById("overallPerformance");
const evaluationFileSpan = document.getElementById("evaluationFile");

function showMessage(text, type) {
  message.textContent = text;
  message.className = "message";
  if (type) {
    message.classList.add(type);
  }
}

async function loadEvaluation() {
    showMessage("", "");

    try {
        const response = await fetch(`${BASE_URL}/supervisor/students`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {
            if (response.status === 401) {
                return showMessage("You must be logged in", "error");
            }

            if (response.status === 403) {
                return showMessage("Access denied. Supervisor only.", "error");
            }

            return showMessage("Failed to load evaluation.", "error");
        }

        const evaluation = await response.json();

        renderEvaluation(evaluation[0]);
    } catch (error) {
        showMessage(error, "error");
    }
}

function renderEvaluation(evaluation) {
    studentNameSpan.textContent = evaluation.name ?? "-";
    studentIdSpan.textContent = evaluation.studentID ?? "-";
    studentEmailSpan.textContent = evaluation.email ?? "-";
    evaluationStatusSpan.textContent = 
        evaluation.evaluation_status === "Not Evaluated"
            ? "Not Evaluated"
            : "Evaluated";
}

submitBtn.addEventListener("click", async () => {
  const performance = performanceSpan.value;
  const studentID = studentIdSpan.textContent.trim();

  if (!performance) {
    showMessage("Please select an overall performance rating before uploading.", "error");
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/uploadEvaluation`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ studentID: studentID, overallPerformance: performance })
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.error || "Failed to submit evaluation.", "error");
      return;
    }

    showMessage(data.message || "Evaluation submitted successfully.", "success");
  } catch (error) {
    showMessage("Could not connect to the server.", "error");
  }
});

uploadBtn.addEventListener("click", async () => {
    const file = evaluationFileSpan.files[0];
    const studentID = studentIdSpan.textContent.trim();

    if (!file) {
        return showMessage("Please select a file to upload.", "error");
    }

    if (file.size === 0) {
        return showMessage("Cannot upload an empty file.", "error");
    }

    if (file.type !== "application/pdf") {
        return showMessage("Only PDF files are allowed.", "error");
    }

    const formData = new FormData();
    formData.append("evaluationFile", file);

    try {
        const response = await fetch(`${BASE_URL}/uploadEvaluationFile/${studentID}`, {
            method: "PATCH",
            credentials: "include",
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            return showMessage(data.error || "Failed to upload evaluation file.", "error");
        }

        showMessage(data.message || "Evaluation file uploaded successfully.", "success");
    } catch (error) {
        showMessage(error, "error");
    }
});

backBtn.addEventListener("click", async () => {
    window.location.href = "supervisor.html";
});

loadEvaluation();