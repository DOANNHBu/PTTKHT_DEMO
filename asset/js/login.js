let users = [];

fetch("http://localhost:3000/users")
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
    loginForm.addEventListener("submit", handleLogin);
  } else {
    console.error("Không tìm thấy phần tử #login-form trong DOM.");
  }
});

async function handleLogin(event) {
  event.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch(
      `http://localhost:3000/users?username=${username}`
    );
    const users = await response.json();
    const user = users[0];

    if (user && user.password === password) {
      // Lưu thông tin user vào sessionStorage thay vì localStorage
      sessionStorage.setItem("currentUser", JSON.stringify(user));

      // Chuyển hướng dựa vào role
      if (user.role_id === 1) {
        window.location.href = "/page/admin.html";
      } else {
        window.location.href = "/page/index.html";
      }
    } else {
      alert("Tên đăng nhập hoặc mật khẩu không đúng!");
    }
  } catch (error) {
    console.error("Login error:", error);
    alert("Có lỗi xảy ra khi đăng nhập!");
  }
}

console.log("Users data loaded:", users); // Kiểm tra xem dữ liệu users có load được hay không
