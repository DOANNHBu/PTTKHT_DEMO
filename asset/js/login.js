function checkLogin(username, password) {
  return fetch("http://localhost:3000/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Lưu thông tin đăng nhập vào localStorage
        localStorage.setItem("loggedInUser", data.user.username);
        // Chuyển hướng đến trang index.html
        window.location.href = "index.html";
      } else {
        document.getElementById("login-error").textContent = data.message;
      }
    })
    .catch((error) => {
      console.error("Lỗi khi gọi API đăng nhập:", error);
    });
}

document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      checkLogin(username, password);
    });
  }
});
