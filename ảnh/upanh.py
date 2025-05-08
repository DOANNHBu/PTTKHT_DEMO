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
            # Trích xuất post_id từ tên file (ví dụ: 9_1 -> post_id = 9)
            post_id = int(file_name.split('_')[0])
            
            with open(file_path, "rb") as file:
                binary_data = file.read()
            
            # Lấy loại file từ phần mở rộng
            file_type = f"image/{file_name.split('.')[-1]}"
            
            # Chèn dữ liệu ảnh vào bảng
            query = "INSERT INTO post_images (post_id, image_data, image_type) VALUES (%s, %s, %s)"
            cursor.execute(query, (post_id, binary_data, file_type))
        except (ValueError, IndexError):
            print(f"Bỏ qua file không hợp lệ: {file_name}")

# Lưu thay đổi và đóng kết nối
conn.commit()
cursor.close()
conn.close()