document.addEventListener("DOMContentLoaded", function () {
  // Kiểm tra xác thực khi tải trang
  checkAuthentication();

  // Thêm nút đăng xuất vào thanh điều hướng nếu có
  addLogoutButton();
});

function checkAuthentication() {
  fetch("http://localhost:3000/api/auth/status", {
    credentials: "include",
  })
    .then((response) => response.json())
    .then((data) => {
      if (!data.authenticated) {
        // Nếu chưa đăng nhập, chuyển hướng về trang đăng nhập
        if (!window.location.href.includes("login.html")) {
          window.location.href = "/page/login.html";
        }
      }
    })
    .catch((error) => {
      console.error("Lỗi kiểm tra xác thực:", error);
      if (!window.location.href.includes("login.html")) {
        window.location.href = "/page/login.html";
      }
    });
}

function addLogoutButton() {
  // Tìm thanh điều hướng hoặc vị trí thích hợp
  const navElement =
    document.querySelector("nav") || document.querySelector("header");

  if (navElement) {
    // Tạo nút đăng xuất
    const logoutButton = document.createElement("button");
    logoutButton.textContent = "Đăng xuất";
    logoutButton.classList.add("logout-button");
    logoutButton.addEventListener("click", logout);

    // Thêm vào thanh điều hướng
    navElement.appendChild(logoutButton);
  }
}

function logout() {
  fetch("http://localhost:3000/api/logout", {
    credentials: "include",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Xóa thông tin trong localStorage
        localStorage.removeItem("loggedInUser");
        sessionStorage.removeItem("loggedInUser");
        // Chuyển hướng về trang đăng nhập
        window.location.href = "/page/login.html";
      } else {
        console.error("Lỗi khi đăng xuất:", data.message);
      }
    })
    .catch((error) => console.error("Lỗi khi đăng xuất:", error));
}

function checkAuthAndRole() {
  const loggedInUser = localStorage.getItem("loggedInUser");
  const userRole = localStorage.getItem("userRole");

  // Kiểm tra cả đăng nhập và role
  if (!loggedInUser || userRole !== "2") {
    window.location.href = "/page/login.html";
    return false;
  }
  return true;
}

// Kiểm tra khi tải trang và sau mỗi thao tác yêu cầu xác thực
document.addEventListener("DOMContentLoaded", checkAuthAndRole);

// Thêm event listener cho các yêu cầu API
document.addEventListener("fetchstart", checkAuthAndRole);
