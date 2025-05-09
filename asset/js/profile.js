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

  console.log('userProfile from API:', userProfile);

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
          <div><b>ID học sinh:</b> ${userProfile.student_id || ""}</div>
          <div><b>Trường:</b> ${userProfile.school || ""}</div>
          <div><b>Địa chỉ:</b> ${userProfile.address || ""}</div>
          <div><b>Email:</b> ${userProfile.email || ""}</div>
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
      <div class="products">
        ${userProducts
          .map(
            (p) => `
            <div class="product" data-post-id="${p.id}">
              <div class="product-image">
                <img src="${p.thumbnail}" alt="${p.title}" />
              </div>
              <div class="product-info">
                <div class="product-title">${p.title}</div>
                <div class="product-price">${p.price === 0
                  ? "Thỏa thuận"
                  : p.price.toLocaleString("vi-VN") + " đ"
                }</div>
                <div class="product-meta">
                  <div>${p.categoryName || ""}</div>
                  <div>${p.location || ""}</div>
                </div>
                <div class="product-meta">
                  <div>${p.date ? new Date(p.date).toLocaleDateString('vi-VN') : ''}</div>
                </div>
                <div class="product-status">
                  <span style="color: ${p.status === "approved" ? "green" : "orange"}">
                    ${p.status === "approved" ? "Đã duyệt" : "Đang chờ duyệt"}
                  </span>
                </div>
              </div>
            </div>
          `
          )
          .join("")}
      </div>
    `;

    // Gắn lại sự kiện click cho các thẻ .product sau khi render
    const productCards = userProductsDiv.querySelectorAll('.product');
    productCards.forEach(card => {
      card.addEventListener('click', function() {
        const postId = this.dataset.postId;
        if (postId) {
          showPostDetailModal(postId);
        }
      });
    });
  }

  // Xử lý chỉnh sửa thông tin cá nhân
  const editProfileBtn = document.querySelector('.profile-edit-btn');
  const editProfileModal = document.getElementById('edit-profile-modal');
  const closeEditModal = editProfileModal.querySelector('.close-button');
  const editProfileForm = document.getElementById('edit-profile-form');

  // Điền thông tin hiện tại vào form
  document.getElementById('edit-username').value = userProfile.username || '';
  document.getElementById('edit-email').value = userProfile.email || '';
  document.getElementById('edit-phone').value = userProfile.phone || '';
  document.getElementById('edit-address').value = userProfile.address || '';

  // Hiển thị thông tin chỉ đọc
  document.getElementById('display-fullname').textContent = userProfile.fullname || '';
  document.getElementById('display-school').textContent = userProfile.school || '';

  // Mở modal chỉnh sửa
  editProfileBtn.addEventListener('click', () => {
    editProfileModal.style.display = 'block';
  });

  // Đóng modal
  closeEditModal.addEventListener('click', () => {
    editProfileModal.style.display = 'none';
  });

  // Đóng modal khi click bên ngoài
  window.addEventListener('click', (e) => {
    if (e.target === editProfileModal) {
      editProfileModal.style.display = 'none';
    }
  });

  // Xử lý submit form chỉnh sửa
  editProfileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(editProfileForm);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Lỗi khi cập nhật thông tin');
      }

      const result = await response.json();
      alert('Cập nhật thông tin thành công!');
      editProfileModal.style.display = 'none';

      // Reload trang để hiển thị thông tin mới
      window.location.reload();
    } catch (error) {
      console.error('Lỗi:', error);
      alert(error.message || 'Có lỗi xảy ra khi cập nhật thông tin');
    }
  });
});

// xử lý đăng bài
document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("add-post-modal");
  const openModalButton = document.querySelector(".profile-post-btn");
  const closeModalButton = modal.querySelector(".close-button");
  const cancelButton = modal.querySelector("button[type='button']");
  const addPostForm = document.getElementById("add-post-form");

  // Mở modal
  openModalButton.addEventListener("click", function () {
    modal.style.display = "block";
  });

  // Đóng modal khi nhấn nút close
  closeModalButton.addEventListener("click", function () {
    modal.style.display = "none";
    addPostForm.reset(); // Reset form khi đóng
  });

  // Đóng modal khi nhấn nút Hủy
  cancelButton.addEventListener("click", function () {
    modal.style.display = "none";
    addPostForm.reset(); // Reset form khi hủy
  });

  // Đóng modal khi nhấn ra ngoài
  window.addEventListener("click", function (event) {
    if (event.target === modal) {
      modal.style.display = "none";
      addPostForm.reset(); // Reset form khi đóng
    }
  });

  // Xử lý gửi form thêm bài đăng
  addPostForm.addEventListener("submit", async function (e) {
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
        modal.style.display = "none";
        addPostForm.reset(); // Reset form sau khi đăng thành công
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

// Hàm tải danh sách bài đăng
async function loadPosts() {
  try {
    const response = await fetch('/api/user/products');
    const posts = await response.json();
    
    const postsList = document.getElementById('posts-list');
    postsList.innerHTML = '';

    posts.forEach(post => {
      const postCard = document.createElement('div');
      postCard.className = 'post-card';
      postCard.innerHTML = `
        <img src="${post.thumbnail || '/asset/images/default-thumbnail.png'}" alt="${post.title}">
        <div class="post-card-content">
          <h3>${post.title}</h3>
          <div class="price">${formatPrice(post.price)}đ</div>
          <div class="meta">
            <span>${post.categoryName}</span>
            <span>${post.location}</span>
          </div>
        </div>
      `;

      postCard.addEventListener('click', () => showPostDetail(post.id));
      postsList.appendChild(postCard);
    });
  } catch (error) {
    console.error('Lỗi khi tải danh sách bài đăng:', error);
  }
}

// Hàm hiển thị chi tiết bài đăng
async function showPostDetail(postId) {
  try {
    const response = await fetch(`/api/posts/${postId}`);
    const post = await response.json();

    // Cập nhật thông tin trong modal
    document.getElementById('post-title').textContent = post.title;
    document.getElementById('post-price').textContent = `Giá: ${formatPrice(post.price)}đ`;
    document.getElementById('post-category').textContent = `Danh mục: ${post.categoryName}`;
    document.getElementById('post-location').textContent = `Vị trí: ${post.location}`;
    document.getElementById('post-description').textContent = post.description;
    
    // Cập nhật trạng thái
    const statusElement = document.getElementById('post-status');
    statusElement.textContent = getStatusText(post.status);
    statusElement.className = `post-status ${post.status}`;

    // Cập nhật hình ảnh
    const mainImage = document.getElementById('main-post-image');
    const thumbnailContainer = document.getElementById('thumbnail-images');
    thumbnailContainer.innerHTML = '';

    if (post.images && post.images.length > 0) {
      mainImage.src = post.images[0].data;
      
      post.images.forEach((image, index) => {
        const thumbnail = document.createElement('img');
        thumbnail.src = image.data;
        thumbnail.alt = `Ảnh ${index + 1}`;
        thumbnail.addEventListener('click', () => {
          mainImage.src = image.data;
        });
        thumbnailContainer.appendChild(thumbnail);
      });
    } else {
      mainImage.src = '/asset/images/default-thumbnail.png';
    }

    // Hiển thị modal
    const modal = document.getElementById('post-detail-modal');
    modal.style.display = 'block';

    // Gắn sự kiện cho nút Chỉnh sửa và Xóa
    const editBtn = document.getElementById('edit-post-btn');
    const deleteBtn = document.getElementById('delete-post-btn');
    editBtn.onclick = function() {
      alert('Chức năng chỉnh sửa sẽ được phát triển!');
      // TODO: Hiển thị modal chỉnh sửa bài đăng
    };
    deleteBtn.onclick = async function() {
      if (confirm('Bạn có chắc chắn muốn xóa bài đăng này?')) {
        try {
          const res = await fetch(`/api/posts/${postId}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          if (res.ok) {
            alert('Đã xóa bài đăng thành công!');
            modal.style.display = 'none';
            window.location.reload();
          } else {
            alert('Xóa bài đăng thất bại!');
          }
        } catch (err) {
          alert('Có lỗi xảy ra khi xóa bài đăng!');
        }
      }
    };
    // Gắn sự kiện cho nút X để đóng modal
    const closeBtn = modal.querySelector('.close-button');
    if (closeBtn) {
      closeBtn.onclick = function() {
        modal.style.display = 'none';
      };
    }
  } catch (error) {
    console.error('Lỗi khi tải chi tiết bài đăng:', error);
  }
}

// Hàm format giá
function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price);
}

// Hàm lấy text trạng thái
function getStatusText(status) {
  const statusMap = {
    'pending': 'Đang chờ duyệt',
    'approved': 'Đã được duyệt',
    'rejected': 'Đã bị từ chối',
    'deleted': 'Đã bị xóa'
  };
  return statusMap[status] || status;
}

// Xử lý đóng modal
document.querySelector('#post-detail-modal .close-button').addEventListener('click', () => {
  document.getElementById('post-detail-modal').style.display = 'none';
});

// Đóng modal khi click bên ngoài
window.addEventListener('click', (event) => {
  const modal = document.getElementById('post-detail-modal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});

// Tải danh sách bài đăng khi trang được load
document.addEventListener('DOMContentLoaded', () => {
  loadPosts();
});

// Thêm sự kiện click cho các profile-product-card
document.addEventListener("DOMContentLoaded", function() {
  const userProductsDiv = document.getElementById("user-products");
  
  userProductsDiv.addEventListener("click", function(event) {
    const productCard = event.target.closest(".profile-product-card");
    if (productCard) {
      const postId = productCard.dataset.postId;
      if (postId) {
        showPostDetailModal(postId);
      }
    }
  });
});

// Xử lý hiển thị modal chi tiết bài đăng
function showPostDetailModal(postId) {
  fetch(`/api/posts/${postId}`, { credentials: "include" })
    .then((response) => response.json())
    .then((post) => {
      if (!post) return;

      // Hiển thị thông tin cơ bản
      document.getElementById("modal-title").textContent = post.title;
      document.getElementById("modal-price").textContent = post.price === 0 
        ? "Thỏa thuận" 
        : post.price.toLocaleString("vi-VN") + " đ";
      document.getElementById("modal-category").textContent = post.categoryName;
      document.getElementById("modal-location").textContent = post.location;
      document.getElementById("modal-description").textContent = post.description;

      // Format và hiển thị ngày đăng
      const createdDate = new Date(post.created_at);
      const formattedDate = `${createdDate.getDate().toString().padStart(2, "0")}/${(createdDate.getMonth() + 1).toString().padStart(2, "0")}/${createdDate.getFullYear()}`;
      document.getElementById("modal-date").textContent = formattedDate;

      // Hiển thị trạng thái
      const statusElement = document.getElementById("modal-status");
      statusElement.textContent = post.status === "approved" ? "Đã duyệt" : "Đang chờ duyệt";
      statusElement.style.color = post.status === "approved" ? "green" : "orange";

      // Hiển thị ảnh
      const mainImage = document.getElementById("modal-main-image").querySelector("img");
      const thumbnailsContainer = document.getElementById("modal-thumbnails");

      // Lấy tất cả ảnh
      const allImages = post.images && post.images.length > 0
        ? post.images
        : [{ data: "/asset/images/default-thumbnail.png" }];

      // Hiển thị ảnh chính
      mainImage.src = allImages[0].data;
      mainImage.alt = post.title;

      // Hiển thị thumbnails
      thumbnailsContainer.innerHTML = allImages
        .map((img, index) => `
          <img 
            src="${img.data}" 
            alt="Thumbnail ${index + 1}"
            onclick="changeMainImage('${img.data}')"
          />
        `)
        .join("");

      // Hiển thị modal
      const modal = document.getElementById("post-detail-modal");
      modal.style.display = "block";

      // Gắn sự kiện cho nút Chỉnh sửa và Xóa
      const editBtn = document.getElementById('edit-post-btn');
      const deleteBtn = document.getElementById('delete-post-btn');
      editBtn.onclick = function() {
        alert('Chức năng chỉnh sửa sẽ được phát triển!');
        // TODO: Hiển thị modal chỉnh sửa bài đăng
      };
      deleteBtn.onclick = async function() {
        if (confirm('Bạn có chắc chắn muốn xóa bài đăng này?')) {
          try {
            const res = await fetch(`/api/posts/${postId}`, {
              method: 'DELETE',
              credentials: 'include'
            });
            if (res.ok) {
              alert('Đã xóa bài đăng thành công!');
              modal.style.display = 'none';
              window.location.reload();
            } else {
              alert('Xóa bài đăng thất bại!');
            }
          } catch (err) {
            alert('Có lỗi xảy ra khi xóa bài đăng!');
          }
        }
      };
      // Gắn sự kiện cho nút X để đóng modal
      const closeBtn = modal.querySelector('.close-button');
      if (closeBtn) {
        closeBtn.onclick = function() {
          modal.style.display = 'none';
        };
      }
    })
    .catch((error) => console.error("Lỗi khi tải chi tiết bài đăng:", error));
}

// Hàm thay đổi ảnh chính khi click vào thumbnail
function changeMainImage(imgSrc) {
  const mainImage = document.getElementById("modal-main-image").querySelector("img");
  mainImage.src = imgSrc;
}

// Đóng modal khi click vào nút đóng hoặc bên ngoài modal
document.addEventListener("DOMContentLoaded", function() {
  const modal = document.getElementById("post-detail-modal");
  const closeButton = modal.querySelector(".close-button");

  closeButton.onclick = function() {
    modal.style.display = "none";
  }

  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }
});

// Preview images for add post modal
const imagesInput = document.getElementById('images');
const imagePreview = document.getElementById('image-preview');
if (imagesInput && imagePreview) {
  imagesInput.addEventListener('change', function() {
    imagePreview.innerHTML = '';
    const files = Array.from(this.files).slice(0, 5);
    files.forEach(file => {
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const img = document.createElement('img');
          img.src = e.target.result;
          imagePreview.appendChild(img);
        };
        reader.readAsDataURL(file);
      }
    });
  });
}
