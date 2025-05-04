// Biến lưu trạng thái danh mục hiện tại
let currentCategory = "all";
let productsData = [];

async function loadProductsData() {
  try {
    const response = await fetch("/asset/json/products.json"); // Sửa đường dẫn
    if (!response.ok) {
      throw new Error("Không thể tải file products.json");
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

    productElement.innerHTML = `
        <div class="product-image">[Hình ảnh sản phẩm]</div>
        <div class="product-info">
            <div class="product-title">${product.title}</div>
            <div class="product-price">${formatPrice(product.price)}</div>
            <div class="product-meta">
                <div>${product.location}</div>
                <div>${product.date}</div>
            </div>
        </div>
      `;

    productsList.appendChild(productElement);
  });
}

// Format giá tiền
function formatPrice(price) {
  if (price === 0) return "Thỏa thuận";
  return price.toLocaleString("vi-VN") + " đ";
}

// Lấy tên danh mục từ id
function getCategoryName(id) {
  const map = {
    electronics: "Điện tử",
    vehicle: "Xe cộ",
    property: "Bất động sản",
    job: "Việc làm",
    service: "Dịch vụ",
    fashion: "Thời trang",
    furniture: "Nội thất",
    pet: "Thú cưng",
    sport: "Thể thao",
    book: "Sách",
  };
  return map[id];
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
    if (categoryName === getCategoryName(category)) {
      el.classList.add("active");
    } else {
      el.classList.remove("active");
    }
  });

  // Lọc và hiển thị sản phẩm
  const filteredProducts = productsData.filter(
    (product) => product.category === category
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
  document.getElementById("detail-condition").textContent = product.condition;
  document.getElementById("detail-location").textContent = product.location;
  document.getElementById("detail-date").textContent = product.date;
  document.getElementById(
    "detail-seller"
  ).textContent = `Người bán: ${product.seller}`;
  document.getElementById("detail-description").textContent =
    product.description;

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

// Gắn sự kiện cho nút đăng xuất
function setupLogoutButton() {
  const logoutButton = document.getElementById("logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", function () {
      // Xóa thông tin đăng nhập
      localStorage.removeItem("loggedInUser");
      sessionStorage.removeItem("loggedInUser");

      // Chuyển hướng về trang login.html
      window.location.href = "/page/login.html";
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

    // Gọi hàm renderProducts sau khi tải xong products.html
    renderProducts(productsData);
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
  loadProductsData();
});

// Khởi tạo trang
window.onload = function () {
  renderProducts(productsData); // Hiển thị tất cả sản phẩm khi vào trang chính
};
