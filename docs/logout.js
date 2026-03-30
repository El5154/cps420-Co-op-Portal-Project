async function handleLogout() {
  const message = document.getElementById("message");

  try {
    const response = await fetch(`${BASE_URL}/logout`, {
      method: "POST",
      credentials: "include"
    });

    if (response.ok) {
      window.location.href = "login.html";
    } else if (message) {
      message.textContent = "Logout failed.";
      message.className = "message error";
    }
  } catch (error) {
    if (message) {
      message.textContent = "Could not connect to the server.";
      message.className = "message error";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }
});