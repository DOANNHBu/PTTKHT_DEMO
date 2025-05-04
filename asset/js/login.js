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

document.getElementById("login-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (checkLogin(username, password)) {
    // Lưu thông tin đăng nhập vào localStorage
    localStorage.setItem("loggedInUser", username);

    // Chuyển hướng đến trang index.html
    window.location.href = "/page/index.html";
  } else {
    document.getElementById("login-error").textContent =
      "Tên đăng nhập hoặc mật khẩu không đúng!";
  }
});

console.log("Users data loaded:", users); // Kiểm tra xem dữ liệu users có load được hay không
