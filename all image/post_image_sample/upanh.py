import mysql.connector
import os

# Kết nối đến cơ sở dữ liệu
conn = mysql.connector.connect(
    host="127.0.0.1",
    user="root",
    password="root",
    database="school_exchange"
)

cursor = conn.cursor()

# Đường dẫn đến folder chứa ảnh
folder_path = "d:\\Project\\UI_PTTKHT\\PTTKHT_DEMO\\ảnh"

# Lặp qua các file trong folder
for file_name in os.listdir(folder_path):
    file_path = os.path.join(folder_path, file_name)
    if os.path.isfile(file_path):  # Kiểm tra nếu là file
        try:
            # Trích xuất post_id và số thứ tự từ tên file (ví dụ: 9_1.jpg -> post_id = 9, thứ tự = 1)
            parts = file_name.split('_')
            post_id = int(parts[0])
            order = int(parts[1].split('.')[0])  # Lấy số thứ tự (1, 2, ...)

            # Xác định image_role dựa trên số thứ tự
            image_role = 'thumbnail' if order == 1 else 'image'

            with open(file_path, "rb") as file:
                binary_data = file.read()

            # Lấy loại file từ phần mở rộng
            file_type = f"image/{file_name.split('.')[-1]}"

            # Chèn dữ liệu ảnh vào bảng
            query = """
                INSERT INTO post_images (post_id, image_data, image_type, image_role) 
                VALUES (%s, %s, %s, %s)
            """
            cursor.execute(query, (post_id, binary_data, file_type, image_role))
        except (ValueError, IndexError):
            print(f"Bỏ qua file không hợp lệ: {file_name}")

# Lưu thay đổi và đóng kết nối
conn.commit()
cursor.close()
conn.close()