document.addEventListener("DOMContentLoaded", async function () {
  // Lấy thông tin người dùng
  const userProfile = await fetch("/api/user/profile", {
    credentials: "include",
  })
    .then((res) => res.json())
    .catch((err) => {
      console.error("Lỗi khi lấy thông tin người dùng:", err);
      return null;
    });

  if (!userProfile) {
    window.location.href = "/page/login.html";
    return;
  }

  // Hiển thị thông tin người dùng
  document.getElementById("profile-info").innerHTML = `
    <div class="profile-card-horizontal">
      <div class="profile-avatar-large-wrap">
        <img src="/asset/images/${userProfile.avatar || "default-avatar.png"}" 
             class="profile-avatar-large" />
      </div>
      <div class="profile-info-box">
        <div class="profile-details">
          <div><b>Họ tên:</b> ${userProfile.fullname || ""}</div>
          <div><b>Tên đăng nhập:</b> ${userProfile.username}</div>
          <div><b>ID học sinh:</b> ${userProfile.studentId || ""}</div>
          <div><b>Trường:</b> ${userProfile.school || ""}</div>
          <div><b>Số điện thoại:</b> ${userProfile.phone || ""}</div>
        </div>
      </div>
    </div>
  `;

  // Lấy danh sách sản phẩm đã đăng
  const userProducts = await fetch("/api/user/products", {
    credentials: "include",
  })
    .then((res) => res.json())
    .catch((err) => {
      console.error("Lỗi khi lấy danh sách sản phẩm:", err);
      return [];
    });

  // Hiển thị danh sách sản phẩm
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
              <img src="/asset/images/${p.bannerImage || "default.png"}" alt="${
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
              <div class="profile-product-date">${new Date(
                p.date
              ).toLocaleDateString("vi-VN")}</div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }
});

// // nút đăng xuất
// document.addEventListener("DOMContentLoaded", function () {
//   const logoutBtn = document.getElementById("logout-button");
//   if (logoutBtn) {
//     logoutBtn.addEventListener("click", function () {
//       localStorage.removeItem("loggedInUser");
//       sessionStorage.removeItem("loggedInUser");
//       window.location.href = "/page/login.html";
//     });
//   }
// });
