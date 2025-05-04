// Biến lưu trạng thái danh mục hiện tại
let currentCategory = "all";

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
document.querySelector(".search-form").addEventListener("submit", function (e) {
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

// Khởi tạo trang
window.onload = function () {
  renderProducts(productsData); // Hiển thị tất cả sản phẩm khi vào trang chính
};
