const nameSpan = document.getElementById("name");
const studentIDSpan = document.getElementById("studentID");
const provisionalStatusSpan = document.getElementById("provisionalStatus");
const finalStatusSpan = document.getElementById("finalStatus");
const reportStatusSpan = document.getElementById("reportStatus");
const evaluationStatusSpan = document.getElementById("evaluationStatus");
const deadlineSpan = document.getElementById("deadline");
const message = document.getElementById("message");
const logoutBtn = document.getElementById("logoutBtn");

function showMessage(text, type) {
  message.textContent = text;
  message.className = "message";
  if (type) message.classList.add(type);
}

async function loadDashboard() {
  try {
    const response = await fetch(`${BASE_URL}/applicant/dashboard`, {
      method: "GET",
      credentials: "include"
    });

    const data = await response.json();

    if (response.ok) {
      nameSpan.textContent = data.name || "-";
      studentIDSpan.textContent = data.studentID || "-";
      provisionalStatusSpan.textContent = data.provisional_status || "-";
      finalStatusSpan.textContent = data.final_status || "-";
      reportStatusSpan.textContent = data.report_status || "-";
      evaluationStatusSpan.textContent = data.evaluation_status || "-";
      deadlineSpan.textContent = data.deadline || "-";
    } else {
      showMessage(data.error || "Failed to load dashboard.", "error");
    }
  } catch (error) {
    showMessage("Could not connect to the server.", "error");
  }
}

logoutBtn.addEventListener("click", async () => {
  try {
    const response = await fetch(`${BASE_URL}/logout`, {
      method: "POST",
      credentials: "include"
    });

    if (response.ok) {
      window.location.href = "login.html";
    } else {
      showMessage("Logout failed.", "error");
    }
  } catch (error) {
    showMessage("Could not connect to the server.", "error");
  }
});

loadDashboard();