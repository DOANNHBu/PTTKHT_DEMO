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
        <img src="${userProfile.avatar ?
      `data:image/jpeg;base64,${userProfile.avatar}` :
      '/asset/images/default-avatar.png'}" 
          class="profile-avatar-large" 
          alt="Avatar"
        />
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
              <img src="/asset/images/${p.bannerImage || "default.png"}" alt="${p.title
            }" />
            </div>
            <div class="profile-product-info">
              <div class="profile-product-title">${p.title}</div>
              <div class="profile-product-meta">
                <span>${p.categoryName || ""}</span> | 
                <span>${p.location || ""}</span>
              </div>
              <div class="profile-product-price">${p.price === 0
              ? "Thỏa thuận"
              : p.price.toLocaleString("vi-VN") + " đ"
            }</div>
              <div class="profile-product-date">${new Date(
              p.date
            ).toLocaleDateString("vi-VN")}</div>
              <div class="profile-product-status">
                <b>Trạng thái:</b> ${p.status === "approved"
              ? "<span style='color: green;'>Đã duyệt</span>"
              : "<span style='color: orange;'>Đang chờ duyệt</span>"
            }
              </div>
            </div>
          </div>
        `
        )
        .join("")}
      </div>
    `;
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("add-post-modal");
  const openModalButton = document.querySelector(".profile-post-btn");
  const closeModalButton = modal.querySelector(".close-button");

  // Mở modal
  openModalButton.addEventListener("click", function () {
    modal.style.display = "block";
  });

  // Đóng modal
  closeModalButton.addEventListener("click", function () {
    modal.style.display = "none";
  });

  // Đóng modal khi nhấn ra ngoài
  window.addEventListener("click", function (event) {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  // Xử lý gửi form thêm bài đăng
  document
    .getElementById("add-post-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const formData = new FormData(this);

      try {
        const response = await fetch("/api/posts", {
          method: "POST",
          body: formData,
          credentials: "include", // Đảm bảo gửi cookie session
        });

        const result = await response.json();

        if (response.ok) {
          alert("Bài đăng đã được thêm thành công và đang chờ duyệt!");
          document.getElementById("add-post-modal").style.display = "none";
          window.location.reload(); // Tải lại trang để cập nhật danh sách bài đăng
        } else {
          alert(result.message || "Đã xảy ra lỗi khi thêm bài đăng.");
        }
      } catch (error) {
        console.error("Lỗi khi gửi bài đăng:", error);
        alert("Đã xảy ra lỗi khi thêm bài đăng.");
      }
    });
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
