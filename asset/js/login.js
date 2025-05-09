function checkLogin(username, password) {
  return fetch("http://localhost:3000/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
    credentials: "include",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Kiểm tra role_id và chuyển hướng
        if (data.user.role_id === 1) {
          window.location.href = "/page/admin.html";
        } else if (data.user.role_id === 2) {
          window.location.href = "/page/index.html";
        } else {
          document.getElementById("login-error").textContent =
            "Bạn không có quyền truy cập";
        }
        localStorage.setItem("loggedInUser", data.user.username);
        localStorage.setItem("userRole", data.user.role_id);
      } else {
        document.getElementById("login-error").textContent = data.message;
      }
    })
    .catch((error) => {
      console.error("Lỗi khi gọi API đăng nhập:", error);
      document.getElementById("login-error").textContent =
        "Lỗi kết nối đến máy chủ";
    });
}

document.addEventListener("DOMContentLoaded", function () {
  fetch("http://localhost:3000/api/auth/status", {
    credentials: "include",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.authenticated) {
        // Nếu đã đăng nhập, chuyển hướng về index.html
        if (window.location.href.includes("login.html")) {
          window.location.href = "/page/index.html";
        }
      }
    })
    .catch((error) =>
      console.error("Lỗi kiểm tra trạng thái đăng nhập:", error)
    );

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
