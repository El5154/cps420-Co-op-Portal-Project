const tableBody = document.getElementById("studentTableBody");
const message = document.getElementById("message");
const logoutBtn = document.getElementById("logoutBtn");

function showMessage(text, type) {
  message.textContent = text;
  message.className = "message";
  if (type) {
    message.classList.add(type);
  }
}

async function loadSupervisedStudents() {
  showMessage("", "");

  try {
    const response = await fetch(`${BASE_URL}/supervisor/students`, {
      method: "GET",
      credentials: "include"
    });

    if (!response.ok) {
      if (response.status === 401) {
        showMessage("You must be logged in.", "error");
        return;
      }

      if (response.status === 403) {
        showMessage("Access denied. Supervisor only.", "error");
        return;
      }

      showMessage("Failed to load applicants.", "error");
      return;
    }

    const students = await response.json();

    students.forEach(student => {
      renderStudents(students);
    })
  } catch (error) {
    showMessage("Could not connect to the server.", "error");
  }
}

function renderStudents(students) {
  tableBody.innerHTML = "";

  students.forEach((student) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${student.name}</td>
      <td>${student.studentID}</td>
      <td>${student.evaluation_status}</td>
      <td>
        <div class="action">
          <button onclick="window.location.href='evaluation.html?studentID=${student.studentID}'" class="btn">
            View Details
          </button>
        </div>
      </td>
    `;

    tableBody.appendChild(row);
  });
}

loadSupervisedStudents();