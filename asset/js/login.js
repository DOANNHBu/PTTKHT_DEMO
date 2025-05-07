let users = [];

fetch("/asset/json/users.json")
  .then((response) => response.json())
  .then((data) => {
    users = data;
    showLoginModal(); // chỉ hiển thị modal khi đã load xong dữ liệu
  })
  .catch((error) => {
    console.error("Lỗi khi tải users.json:", error);
  });

function checkLogin(username, password) {
  return users.some(
    (user) => user.username === username && user.password === password
  );
}

function showLoginModal() {
  document.getElementById("login-modal").style.display = "flex";
}

function hideLoginModal() {
  document.getElementById("login-modal").style.display = "none";
}

document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      if (checkLogin(username, password)) {
        // Lưu thông tin đăng nhập vào localStorage
        localStorage.setItem("loggedInUser", username);

        // Kiểm tra nếu là admin thì chuyển đến trang admin
        if (username === "admin") {
          window.location.href = "/page/admin.html";
        } else {
          // Người dùng thường chuyển đến trang index
          window.location.href = "/page/index.html";
        }
      } else {
        document.getElementById("login-error").textContent =
          "Tên đăng nhập hoặc mật khẩu không đúng!";
      }
    });
  } else {
    console.error("Không tìm thấy phần tử #login-form trong DOM.");
  }
});

console.log("Users data loaded:", users); // Kiểm tra xem dữ liệu users có load được hay không
