let activities = [];

// Thay đổi hàm tải dữ liệu hoạt động
async function loadActivities() {
  try {
    const response = await fetch("/api/public/activities");

    if (!response.ok) {
      throw new Error("Không thể tải dữ liệu hoạt động.");
    }

    activities = await response.json();
    renderActivitiesList();
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu hoạt động:", error);
  }
}

// Cập nhật hàm renderActivitiesList
function renderActivitiesList() {
  const activitiesList = document.getElementById("activities-list");
  const activityDetail = document.getElementById("activity-detail");
  activitiesList.innerHTML = "";

  activities.forEach((activity) => {
    const startDate = new Date(activity.start_date);
    const endDate = new Date(activity.end_date);

    const activityElement = document.createElement("div");
    activityElement.className = "event-item";
    activityElement.innerHTML = `
            <div class="event-content">
                <div class="event-text">
                    <h3>${activity.title}</h3>
                    <p><strong>Thời gian:</strong> ${formatDateRange(
                      startDate,
                      endDate
                    )}</p>
                    <p><strong>Địa điểm:</strong> ${activity.location}</p>
                    <p><strong>Đơn vị tổ chức:</strong> ${
                      activity.name_organizer
                    }</p>
                    <button onclick="showActivityDetail(${
                      activity.id
                    })">Xem chi tiết</button>
                </div>
            </div>
        `;
    activitiesList.appendChild(activityElement);
  });

  if (activityDetail) {
    activityDetail.style.display = "none";
  }
  activitiesList.style.display = "block";
}

// Cập nhật hàm showActivityDetail
async function showActivityDetail(activityId) {
  try {
    const response = await fetch(`/api/public/activities/${activityId}`);

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const activity = await response.json();
    const activityDetail = document.getElementById("activity-detail");
    const activitiesList = document.getElementById("activities-list");

    const startDate = new Date(activity.start_date);
    const endDate = new Date(activity.end_date);

    activityDetail.innerHTML = `
            <h2>${activity.title}</h2>
            <div class="activity-info">
                <p><strong>Thời gian:</strong> ${formatDateRange(
                  startDate,
                  endDate
                )}</p>
                <p><strong>Địa điểm:</strong> ${activity.location}</p>
                <p><strong>Đơn vị tổ chức:</strong> ${
                  activity.name_organizer
                }</p>
                <p><strong>Mô tả:</strong> ${activity.description}</p>
                ${
                  activity.guidelines
                    ? `<p><strong>Hướng dẫn:</strong> ${activity.guidelines}</p>`
                    : ""
                }
            </div>

            <div class="donation-items">
                <h3>Danh sách vật phẩm cần quyên góp</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Tên vật phẩm</th>
                            <th>Mô tả</th>
                            <th>Số lượng cần</th>
                            <th>Đã nhận</th>
                            <th>Còn thiếu</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${activity.items
                          .map(
                            (item) => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.description || ""}</td>
                                <td>${item.quantity_needed}</td>
                                <td>${item.quantity_received}</td>
                                <td>${
                                  item.quantity_needed - item.quantity_received
                                }</td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
            </div>
            <button onclick="renderActivitiesList()">Quay lại</button>
        `;

    activityDetail.style.display = "block";
    activitiesList.style.display = "none";
  } catch (error) {
    console.error("Error viewing activity:", error);
    alert("Không thể tải thông tin hoạt động");
  }
}

// Hàm hỗ trợ format ngày tháng
function formatDateRange(startDate, endDate) {
  const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  };

  return `${startDate.toLocaleString(
    "vi-VN",
    options
  )} - ${endDate.toLocaleString("vi-VN", options)}`;
}

// Khởi tạo trang
document.addEventListener("DOMContentLoaded", function () {
  loadActivities();
});
