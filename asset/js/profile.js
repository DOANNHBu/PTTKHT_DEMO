const userProducts = [
  {
    title: "Laptop Dell XPS 13",
    categoryName: "Điện tử",
    location: "Quận 1, TP. Hồ Chí Minh",
    price: 18000000,
    date: "05/05/2025",
    images: ["laptop.jpg"],
  },
  {
    title: "Áo khoác thể thao Adidas",
    categoryName: "Thời trang",
    location: "Quận 3, TP. Hồ Chí Minh",
    price: 650000,
    date: "04/05/2025",
    images: ["adidas-jacket.jpg"],
  },
];

document.addEventListener("DOMContentLoaded", async function () {
  const username = localStorage.getItem("loggedInUser");
  if (!username) {
    window.location.href = "/page/login.html";
    return;
  }
  const res = await fetch("/asset/json/users.json");
  const users = await res.json();
  const user = users.find((u) => u.username === username);
  if (!user) {
    document.getElementById("profile-info").textContent =
      "Không tìm thấy thông tin người dùng!";
    return;
  }
  document.getElementById("profile-info").innerHTML = `
    <div class="profile-card-horizontal">
      <div class="profile-avatar-large-wrap">
        <img src="/asset/images/${
          user.avatar || "default-avatar.png"
        }" class="profile-avatar-large" />
      </div>
      <div class="profile-info-box">
        <div class="profile-details">
          <div><b>Họ tên:</b> ${user.fullname || ""}</div>
          <div><b>Tên đăng nhập:</b> ${user.username}</div>
          <div><b>ID học sinh:</b> ${user.studentId || ""}</div>
          <div><b>Trường:</b> ${user.school || ""}</div>
          <div><b>Số điện thoại:</b> ${user.phone || ""}</div>
        </div>
      </div>
    </div>
  `;

  // Hiển thị sản phẩm mẫu tĩnh
  const userProductsDiv = document.getElementById("user-products");
  if (userProducts.length === 0) {
    userProductsDiv.innerHTML = "<div>Chưa có sản phẩm nào.</div>";
  } else {
    userProductsDiv.innerHTML = `
      <div class="profile-products-list">
        ${userProducts
          .map(
            (p) => `
          <div class="profile-product-card">
            <div class="profile-product-img">
              <img src="/asset/images/${p.images?.[0] || "default.png"}" alt="${
              p.title
            }" />
            </div>
            <div class="profile-product-info">
              <div class="profile-product-title">${p.title}</div>
              <div class="profile-product-meta">
                <span>${p.categoryName || ""}</span> | 
                <span>${p.location || ""}</span>
              </div>
              <div class="profile-product-price">${
                p.price === 0
                  ? "Thỏa thuận"
                  : p.price.toLocaleString("vi-VN") + " đ"
              }</div>
              <div class="profile-product-date">${p.date || ""}</div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }
});

// nút đăng xuất
document.addEventListener("DOMContentLoaded", function () {
  const logoutBtn = document.getElementById("logout-button");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      localStorage.removeItem("loggedInUser");
      sessionStorage.removeItem("loggedInUser");
      window.location.href = "/page/login.html";
    });
  }
});
