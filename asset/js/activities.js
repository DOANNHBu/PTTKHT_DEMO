let events = [];

// Tải dữ liệu sự kiện từ file JSON
async function loadEvents() {
  try {
    const response = await fetch("/asset/json/events.json");
    if (!response.ok) {
      throw new Error("Không thể tải dữ liệu sự kiện.");
    }
    events = await response.json();
    renderEventsList(); // Hiển thị danh sách sự kiện sau khi tải xong
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu sự kiện:", error);
  }
}

// Hiển thị danh sách sự kiện
function renderEventsList() {
  const eventsList = document.getElementById("events-list");
  const eventDetail = document.getElementById("event-detail");
  eventsList.innerHTML = ""; // Xóa nội dung cũ

  events.forEach((event) => {
    const eventElement = document.createElement("div");
    eventElement.className = "event-item";
    eventElement.innerHTML = `
        <div class="event-content">
          <div class="event-text">
            <h3>${event.title}</h3>
            <p><strong>Ngày:</strong> ${event.date}</p>
            <p><strong>Địa điểm:</strong> ${event.location}</p>
            <button onclick="showEventDetail(${event.id})">Xem chi tiết</button>
          </div>
          <div class="event-image">
            <img src="/asset/images/${event.bannerImage}" alt="${event.title}" />
          </div>
        </div>
      `;
    eventsList.appendChild(eventElement);
  });

  // Ẩn chi tiết sự kiện khi hiển thị danh sách
  eventDetail.style.display = "none";
  eventsList.style.display = "block";
}

// Hiển thị chi tiết sự kiện
function showEventDetail(eventId) {
  const event = events.find((e) => e.id === eventId);
  if (!event) return;

  const eventDetail = document.getElementById("event-detail");
  const eventsList = document.getElementById("events-list");

  const detailImagesHTML = event.detailImages
    .map(
      (image) =>
        `<img src="/asset/images/${image}" alt="${event.title}" class="detail-image" />`
    )
    .join("");

  eventDetail.innerHTML = `
        <h2>${event.title}</h2>
        <img src="/asset/images/${event.bannerImage}" alt="${event.title}" class="event-banner" />
        <p><strong>Ngày:</strong> ${event.date}</p>
        <p><strong>Địa điểm:</strong> ${event.location}</p>
        <p>${event.description}</p>
        <div class="detail-images">${detailImagesHTML}</div>
        <button id="back-button" onclick="renderEventsList()">Quay lại</button>
      `;

  // Hiển thị chi tiết sự kiện và ẩn danh sách
  eventDetail.style.display = "block";
  eventsList.style.display = "none";
}

// Khởi tạo trang
document.addEventListener("DOMContentLoaded", function () {
  loadEvents(); // Tải dữ liệu sự kiện khi trang được tải
});
