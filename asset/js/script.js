// Biến lưu trạng thái danh mục hiện tại
let currentCategory = "all";
let productsData = [];

// Format giá tiền
function formatPrice(price) {
  if (!price || price === 0) return "Thỏa thuận";
  return parseFloat(price).toLocaleString("vi-VN") + " đ";
}

async function loadProductsData() {
  try {
    // Thay đổi: Sử dụng API endpoint từ server thay vì file JSON
    const response = await fetch("/api/posts");
    if (!response.ok) {
      throw new Error("Không thể tải dữ liệu sản phẩm từ server");
    }
    productsData = await response.json();
    renderProducts(productsData); // Hiển thị sản phẩm sau khi tải xong
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu sản phẩm:", error);
  }
}

// Hiển thị sản phẩm
function renderProducts(products) {
  const productsList = document.getElementById("products-list");
  productsList.innerHTML = "";

  products.forEach((product) => {
    const productElement = document.createElement("div");
    productElement.className = "product";
    productElement.onclick = () => showProductDetail(product.id);

    // Tạo ngày định dạng
    const createdDate = new Date(product.created_at);
    const formattedDate = `${createdDate
      .getDate()
      .toString()
      .padStart(2, "0")}/${(createdDate.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${createdDate.getFullYear()}`;

    productElement.innerHTML = `
        <div class="product-image">
          <img src="${
            product.main_image || "/asset/images/default.jpg"
          }" alt="${product.title}" />
        </div>
        <div class="product-info">
            <div class="product-title">${product.title}</div>
            <div class="product-price">${formatPrice(product.price)}</div>
            <div class="product-meta">
                <div>${product.location}</div>
                <div>${formattedDate}</div>
            </div>
        </div>
      `;

    productsList.appendChild(productElement);
  });
}

//! catagory
// Lấy tên danh mục từ tiếng Việt sang id
function getCategoryId(vietnameseName) {
  const map = {
    Sách: "Books",
    "Điện tử": "Electronics",
    "Quần áo": "Clothing",
    "Dụng cụ thể thao": "Sports Equipment",
    "Dụng cụ học tập": "School Supplies",
    "Nhạc cụ": "Musical Instruments",
    Khác: "Other",
  };
  return map[vietnameseName];
}

// Lọc sản phẩm theo danh mục
function filterByCategory(category) {
  const allCategories = document.querySelectorAll(".category");

  if (currentCategory === category) {
    // Bấm lại -> bỏ chọn
    currentCategory = "all";
    renderProducts(productsData);

    allCategories.forEach((el) => el.classList.remove("active")); // Xóa tất cả .active
    return;
  }

  // Cập nhật danh mục hiện tại
  currentCategory = category;

  // Đổi trạng thái active
  allCategories.forEach((el) => {
    const categoryName = el.querySelector(".category-name").textContent;
    if (categoryName === category) {
      el.classList.add("active");
    } else {
      el.classList.remove("active");
    }
  });

  // Lọc và hiển thị sản phẩm theo categoryName (tiếng Việt)
  const filteredProducts = productsData.filter(
    (product) => product.categoryName === category
  );
  renderProducts(filteredProducts);
}

// Hiển thị chi tiết sản phẩm
function showProductDetail(productId) {
  const product = productsData.find((p) => p.id === productId);
  if (!product) return;

  document.getElementById("detail-title").textContent = product.title;
  document.getElementById("detail-price").textContent = formatPrice(
    product.price
  );
  document.getElementById("detail-category").textContent = product.categoryName;

  // Hiển thị ảnh chính và ảnh phụ
  const mainImage = document.getElementById("product-main-image");
  const thumbnails = document.querySelector(".product-thumbnails");

  if (product.images && product.images.length > 0) {
    mainImage.innerHTML = `<img src="${product.images[0]}" alt="${product.title}" />`;
    thumbnails.innerHTML = product.images
      .map(
        (img) =>
          `<div class="product-thumbnail" onclick="document.getElementById('product-main-image').innerHTML='<img src="${img}" alt="${product.title}" />'">
            <img src="${img}" alt="${product.title}" />
          </div>`
      )
      .join("");
  } else {
    mainImage.innerHTML = "[Hình ảnh sản phẩm]";
    thumbnails.innerHTML = "";
  }

  document.getElementById("products-list").style.display = "none";
  document.getElementById("product-detail").style.display = "block";
  document.querySelector(".section-title").style.display = "none";
  document.querySelector(".categories").style.display = "none";
}

// Quay lại danh sách sản phẩm
function showProductList() {
  document.getElementById("products-list").style.display = "grid";
  document.getElementById("product-detail").style.display = "none";
  document.querySelector(".section-title").style.display = "block";
  document.querySelector(".categories").style.display = "flex";
}

// Tìm kiếm sản phẩm
// Gắn sự kiện cho form tìm kiếm
function setupSearchForm() {
  const searchForm = document.querySelector(".search-form");
  if (searchForm) {
    searchForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const searchTerm = document
        .querySelector(".search-input")
        .value.toLowerCase();
      if (!searchTerm) {
        renderProducts(productsData);
        return;
      }

      const searchResults = productsData.filter(
        (product) =>
          product.title.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm) ||
          product.categoryName.toLowerCase().includes(searchTerm) ||
          product.location.toLowerCase().includes(searchTerm)
      );

      renderProducts(searchResults);
    });
  }
}

//! logout
// Gắn sự kiện cho nút đăng xuất
function setupLogoutButton() {
  const logoutButton = document.getElementById("logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", function () {
      fetch("http://localhost:3000/api/logout", {
        credentials: "include",
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            // Xóa thông tin đăng nhập
            localStorage.removeItem("loggedInUser");
            sessionStorage.removeItem("loggedInUser");

            // Chuyển hướng về trang login.html
            window.location.href = "/page/login.html";
          } else {
            console.error("Lỗi khi đăng xuất:", data.message);
          }
        })
        .catch((error) => console.error("Lỗi khi đăng xuất:", error));
    });
  }
}

// Hàm async để tải nội dung HTML
async function loadHTML() {
  try {
    // Tải header
    const headerContainer = document.getElementById("header-container");
    if (headerContainer) {
      headerContainer.innerHTML = await fetch("header.html").then((res) =>
        res.text()
      );
      // Gắn sự kiện cho nút đăng xuất ngay sau khi header được tải
      setupLogoutButton();
    }
    if (headerContainer) {
      headerContainer.innerHTML = await fetch("header.html").then((res) =>
        res.text()
      );
      setupLogoutButton();
      await setHeaderAvatar(); // Thêm dòng này
    }
    // Tải các phần khác
    const categoriesContainer = document.getElementById("categories-container");
    if (categoriesContainer) {
      categoriesContainer.innerHTML = await fetch("categories.html").then(
        (res) => res.text()
      );
    }

    const productsContainer = document.getElementById("products-container");
    if (productsContainer) {
      productsContainer.innerHTML = await fetch("products.html").then((res) =>
        res.text()
      );
    }

    const productDetailContainer = document.getElementById(
      "product-detail-container"
    );
    if (productDetailContainer) {
      productDetailContainer.innerHTML = await fetch(
        "product-detail.html"
      ).then((res) => res.text());
    }

    // Thiết lập các event listener sau khi tải xong HTML
    setupSearchForm();

    // Tải dữ liệu sản phẩm từ API
    await loadProductsData();
  } catch (error) {
    console.error("Error loading HTML files:", error);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const loggedInUser = localStorage.getItem("loggedInUser");

  // Kiểm tra trạng thái đăng nhập
  if (!loggedInUser) {
    // Nếu chưa đăng nhập, chuyển hướng về trang login.html
    window.location.href = "/page/login.html";
    return;
  }

  // Tải HTML components và khởi tạo dữ liệu
  loadHTML();
});

async function setHeaderAvatar() {
  const username = localStorage.getItem("loggedInUser");
  if (!username) return;
  try {
    const res = await fetch("/api/users");
    const users = await res.json();
    const user = users.find((u) => u.username === username);
    if (user && user.avatar_url) {
      const avatarImg = document.getElementById("avatar-img");
      if (avatarImg) avatarImg.src = "/asset/images/" + user.avatar_url;
    }
  } catch (error) {
    console.error("Error loading user avatar:", error);
  }
}
