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
// Hiển thị sản phẩm
function renderProducts(products) {
  const productsList = document.getElementById("products-list");
  productsList.innerHTML = "";

  products.forEach((product) => {
    const productElement = document.createElement("div");
    productElement.className = "product";
    productElement.onclick = () => showProductDetail(product.id);

    const createdDate = new Date(product.created_at);
    const formattedDate = `${createdDate
      .getDate()
      .toString()
      .padStart(2, "0")}/${(createdDate.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${createdDate.getFullYear()}`;

    const productImage =
      product.thumbnail || "/asset/images/default-thumbnail.png"; // Ảnh mặc định

    // Thêm lớp `sold-out` nếu sản phẩm đã hết hàng
    const productInfoClass =
      product.availability === "sold"
        ? "product-info sold-out"
        : "product-info";

    productElement.innerHTML = `
        <div class="product-image">
          <img src="${productImage}" alt="Thumbnail" />
        </div>
        <div class="${productInfoClass}">
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
    // Bấm lại -> bỏ chọn danh mục
    currentCategory = "all";

    // Lấy từ khóa tìm kiếm hiện tại
    const searchTerm = document
      .querySelector(".search-input")
      .value.toLowerCase();

    // Lọc sản phẩm chỉ dựa trên từ khóa tìm kiếm
    const filteredProducts = productsData.filter((product) => {
      const title = product.title ? product.title.toLowerCase() : "";
      const description = product.description
        ? product.description.toLowerCase()
        : "";
      const categoryName = product.categoryName
        ? product.categoryName.toLowerCase()
        : "";
      const location = product.location ? product.location.toLowerCase() : "";

      // Điều kiện tìm kiếm
      return (
        title.includes(searchTerm) ||
        description.includes(searchTerm) ||
        categoryName.includes(searchTerm) ||
        location.includes(searchTerm)
      );
    });

    // Sắp xếp sản phẩm: Còn hàng trước, hết hàng sau
    const sortedProducts = filteredProducts.sort((a, b) => {
      if (a.availability === b.availability) return 0;
      return a.availability === "available" ? -1 : 1;
    });

    renderProducts(sortedProducts);

    // Xóa trạng thái active của danh mục
    allCategories.forEach((el) => el.classList.remove("active"));
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

  // Lấy từ khóa tìm kiếm hiện tại
  const searchTerm = document
    .querySelector(".search-input")
    .value.toLowerCase();

  // Lọc sản phẩm dựa trên tìm kiếm và danh mục
  const filteredProducts = productsData.filter((product) => {
    const title = product.title ? product.title.toLowerCase() : "";
    const description = product.description
      ? product.description.toLowerCase()
      : "";
    const categoryName = product.categoryName
      ? product.categoryName.toLowerCase()
      : "";
    const location = product.location ? product.location.toLowerCase() : "";

    // Điều kiện tìm kiếm
    const matchesSearch =
      title.includes(searchTerm) ||
      description.includes(searchTerm) ||
      categoryName.includes(searchTerm) ||
      location.includes(searchTerm);

    // Điều kiện danh mục
    const matchesCategory =
      currentCategory === "all" || product.categoryName === currentCategory;

    return matchesSearch && matchesCategory;
  });

  // Sắp xếp sản phẩm: Còn hàng trước, hết hàng sau
  const sortedProducts = filteredProducts.sort((a, b) => {
    if (a.availability === b.availability) return 0;
    return a.availability === "available" ? -1 : 1;
  });

  renderProducts(sortedProducts);
}

// Hiển thị chi tiết sản phẩm
// Thay đổi ảnh chính khi click vào thumbnail
function changeMainImage(imageUrl) {
  const mainImageElement = document.getElementById("product-main-image");
  mainImageElement.innerHTML = `<img src="${imageUrl}" alt="Main Image" />`;
}

// Hiển thị chi tiết sản phẩm (cập nhật để thêm ảnh chính vào thumbnails)
// Hiển thị chi tiết sản phẩm (cập nhật để thêm ảnh chính vào thumbnails)
function showProductDetail(productId) {
  fetch(`/api/posts/${productId}`, { credentials: "include" })
    .then((response) => response.json())
    .then((product) => {
      if (!product) return;

      document.getElementById("detail-title").textContent = product.title;
      document.getElementById("detail-price").textContent = formatPrice(
        product.price
      );
      document.getElementById("detail-category").textContent =
        product.categoryName;
      document.getElementById("detail-location").textContent = product.location;

      const createdDate = new Date(product.created_at);
      const formattedDate = `${createdDate
        .getDate()
        .toString()
        .padStart(2, "0")}/${(createdDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${createdDate.getFullYear()}`;
      document.getElementById("detail-date").textContent = formattedDate;

      document.getElementById("detail-seller").textContent = `Người bán: ${
        product.seller || "Không xác định"
      }`;
      document.getElementById("detail-description").textContent =
        product.description;

      // Hiển thị tình trạng (Còn hàng hoặc Hết hàng)
      const conditionElement = document.getElementById("detail-condition");
      conditionElement.textContent =
        product.availability === "available" ? "Còn hàng" : "Hết hàng";

      // Hiển thị ảnh
      const mainImage = document.getElementById("product-main-image");
      const thumbnailsContainer = document.querySelector(".product-thumbnails");

      // Lấy tất cả ảnh (bao gồm cả ảnh chính)
      const allImages = product.images.length
        ? product.images.map((img) => img.data)
        : ["/asset/images/default-thumbnail.png"]; // Ảnh mặc định

      // Hiển thị ảnh chính
      mainImage.innerHTML = `<img src="${allImages[0]}" alt="Main Image" />`;

      // Hiển thị thumbnails (bao gồm cả ảnh chính)
      thumbnailsContainer.innerHTML = allImages
        .map(
          (img) =>
            `<div class="product-thumbnail" onclick="changeMainImage('${img}')">
              <img src="${img}" alt="Thumbnail" />
            </div>`
        )
        .join("");

      document.getElementById("products-list").style.display = "none";
      document.getElementById("product-detail").style.display = "block";
      document.querySelector(".section-title").style.display = "none";
      document.querySelector(".categories").style.display = "none";
    })
    .catch((error) => console.error("Lỗi khi tải chi tiết sản phẩm:", error));
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

      // Lọc sản phẩm dựa trên tìm kiếm và danh mục
      const filteredProducts = productsData.filter((product) => {
        const title = product.title ? product.title.toLowerCase() : "";
        const description = product.description
          ? product.description.toLowerCase()
          : "";
        const categoryName = product.categoryName
          ? product.categoryName.toLowerCase()
          : "";
        const location = product.location ? product.location.toLowerCase() : "";

        // Điều kiện tìm kiếm
        const matchesSearch =
          title.includes(searchTerm) ||
          description.includes(searchTerm) ||
          categoryName.includes(searchTerm) ||
          location.includes(searchTerm);

        // Điều kiện danh mục
        const matchesCategory =
          currentCategory === "all" || product.categoryName === currentCategory;

        return matchesSearch && matchesCategory;
      });

      // Sắp xếp sản phẩm: Còn hàng trước, hết hàng sau
      const sortedResults = filteredProducts.sort((a, b) => {
        if (a.availability === b.availability) return 0;
        return a.availability === "available" ? -1 : 1;
      });

      renderProducts(sortedResults);
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
  const userRole = localStorage.getItem("userRole");

  // Kiểm tra trạng thái đăng nhập và role
  if (!loggedInUser || userRole !== "2") {
    // Nếu chưa đăng nhập hoặc không phải user role, chuyển về trang login
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

function clearAllFilters() {
  // Xóa từ khóa tìm kiếm
  const searchInput = document.querySelector(".search-input");
  if (searchInput) {
    searchInput.value = "";
  }

  // Đặt danh mục hiện tại về "all"
  currentCategory = "all";

  // Xóa trạng thái active của tất cả danh mục
  const allCategories = document.querySelectorAll(".category");
  allCategories.forEach((el) => el.classList.remove("active"));

  // Hiển thị lại toàn bộ sản phẩm
  renderProducts(productsData);
}
