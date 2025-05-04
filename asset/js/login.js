let users = [];

fetch("users.json")
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
    hideLoginModal();
    alert("Đăng nhập thành công!");
  } else {
    document.getElementById("login-error").textContent =
      "Tên đăng nhập hoặc mật khẩu không đúng!";
  }
});
