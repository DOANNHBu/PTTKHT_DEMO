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
          // Thêm flag vào sessionStorage để đánh dấu đã đăng nhập admin
          sessionStorage.setItem('isAdminAuthenticated', 'true');
          window.location.replace("/page/admin.html");
        } else if (data.user.role_id === 2) {
          window.location.replace("/page/index.html");
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
  // Kiểm tra nếu đang ở trang login và đã có phiên đăng nhập admin
  if (window.location.pathname.includes("login.html") && sessionStorage.getItem('isAdminAuthenticated')) {
    window.location.replace("/page/admin.html");
    return;
  }

  fetch("http://localhost:3000/api/auth/status", {
    credentials: "include",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.authenticated) {
        // Nếu đã đăng nhập và là admin
        if (data.user.role_id === 1) {
          sessionStorage.setItem('isAdminAuthenticated', 'true');
          if (window.location.pathname.includes("login.html")) {
            window.location.replace("/page/admin.html");
          }
        } else if (window.location.pathname.includes("login.html")) {
          // Nếu là user thường
          window.location.replace("/page/index.html");
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
