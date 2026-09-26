# Hệ thống Nhắn tin & Gọi điện Trực tuyến

Đây là dự án xây dựng nền tảng giao tiếp trực tuyến tương tự Zalo Web, Discord hoặc Slack. Hệ thống hỗ trợ nhắn tin thời gian thực, gửi hình ảnh/tệp tin, tạo nhóm chat, quản lý bạn bè và gọi audio/video 1-1 bằng WebRTC.

## 1. Công nghệ sử dụng

| Thành phần | Công nghệ |
| Frontend | React, Vite, Zustand, Socket.IO Client |
| Backend | Node.js, Express.js, Socket.IO |
| Database | MongoDB, Mongoose |
| Cache/Pub/Sub | Redis, Socket.IO Redis Adapter |
| Gọi điện | WebRTC, simple-peer, webrtc-adapter |
| Upload file | Multer, Docker shared volume |
| Cân bằng tải | Nginx |
| Triển khai | Docker, Docker Compose |
| Monitoring | Prometheus metrics |

## 2. Cấu trúc thư mục

```text
real-time-messenger/
  backend/              Mã nguồn backend Express + Socket.IO
  frontend/             Mã nguồn frontend React
  nginx/                Cấu hình Nginx reverse proxy/load balancing
  monitoring/           Cấu hình Prometheus
  docs/                 Báo cáo, sơ đồ công nghệ
  tests/                Unit test, API test, socket test
  docker-compose.yml    Cấu hình chạy toàn bộ hệ thống
  start.bat             Script chạy nhanh trên Windows
  start.ps1             Script Docker Compose + tạo tài khoản demo
  readme.txt            Bản hướng dẫn ngắn để nộp kèm
```

## 3. Cách chạy dự án

### 3.1 Yêu cầu

- Docker Desktop đã được cài đặt và đang chạy.
- Docker Compose plugin có sẵn.

### 3.2 Chạy nhanh trên Windows

Chạy file:
start.bat

`start.bat` sẽ gọi `start.ps1`. Script này thực hiện:

1. Dừng stack Docker cũ nếu có.
2. Build và chạy toàn bộ hệ thống bằng Docker Compose.
3. Gọi API đăng ký các tài khoản demo.
4. Hiển thị địa chỉ truy cập hệ thống.

### 3.3 Chạy thủ công bằng Docker Compose

Nếu không dùng `start.bat`, có thể chạy trực tiếp:

```bash
docker compose up --build -d
```

Kiểm tra container:

```bash
docker compose ps
```

Xem log:

```bash
docker compose logs -f nginx backend1 backend2 backend3
```

Dừng hệ thống:

```bash
docker compose down --remove-orphans
```

## 4. Truy cập hệ thống

Sau khi chạy thành công, mở trình duyệt tại:
http://localhost

Các endpoint đáng chú ý:

| Đường dẫn | Mô tả |
| `http://localhost` | Giao diện chính |
| `http://localhost/status` | Trang kiểm tra tình trạng hệ thống |
| `http://localhost/api/status` | API trạng thái backend, MongoDB, Redis |
| `http://localhost/metrics` | Prometheus metrics |

## 5. Tài khoản demo

Có thể tạo tài khoản trực tiếp trên giao diện đăng ký. Nếu chạy bằng `start.bat` hoặc `start.ps1`, hệ thống sẽ thử tạo các tài khoản demo sau:

| Người dùng | Email | Mật khẩu |
| Test User 1 | `testuser1@example.com` | `password123` |
| Test User 2 | `testuser2@example.com` | `password123` |
| Test User 3 | `testuser3@example.com` | `password123` |

Lưu ý: Nếu database đã có các email này, API có thể báo email đã tồn tại. Khi đó có thể dùng tài khoản cũ hoặc đăng ký tài khoản mới trên giao diện.

## 6. Phạm vi chức năng

### 6.1 Xác thực và quan hệ người dùng

- Đăng ký và đăng nhập bằng JWT.
- Tìm kiếm người dùng theo email hoặc tên.
- Gửi lời mời kết bạn.
- Chấp nhận lời mời kết bạn.
- Hủy kết bạn.

### 6.2 Nhắn tin trực tuyến

- Chat 1-1 theo thời gian thực.
- Lưu lịch sử tin nhắn vào MongoDB.
- Load lại lịch sử khi mở cuộc trò chuyện.
- Hiển thị trạng thái tin nhắn `Sent` và `Seen`.
- Hiển thị tên người gửi, thông báo tin nhắn mới và hỗ trợ nhắc đến bằng `@`.
- Hiển thị nội dung Markdown trong tin nhắn, bao gồm in đậm, danh sách và code block.

### 6.3 Nhóm và đa phương tiện

- Tạo nhóm chat.
- Thêm thành viên vào nhóm.
- Xóa thành viên khỏi nhóm.
- Rời nhóm.
- Giải tán nhóm với quyền trưởng nhóm.
- Đổi tên nhóm và ảnh nhóm.
- Gửi hình ảnh.
- Gửi tệp đính kèm.
- Preview hình ảnh trước khi gửi.
- Tải tệp đã gửi/nhận.

### 6.4 Presence và thông báo

- Hiển thị online/offline realtime.
- Hiển thị trạng thái người dùng đang nhập tin nhắn.
- Đồng bộ lời mời kết bạn, tin nhắn mới và thay đổi avatar theo thời gian thực.
- Phát âm thanh thông báo khi có tin nhắn hoặc sự kiện liên quan.

### 6.5 Audio/video call

- Signaling server bằng Socket.IO.
- Gọi audio/video 1-1 bằng WebRTC.
- Hiển thị popup khi có cuộc gọi đến.
- Gọi trực tiếp trong khung chat, không mở tab mới.
- Bật/tắt microphone.
- Bật/tắt camera.
- Kết thúc cuộc gọi.

### 6.6 Hạ tầng và khả năng mở rộng

- Chạy nhiều backend instance: `backend1`, `backend2`, `backend3`.
- Nginx reverse proxy và load balancing.
- Redis Adapter để đồng bộ Socket.IO event giữa các backend instance.
- Redis cache cho dữ liệu truy xuất thường xuyên.
- Shared upload volume để các backend cùng đọc được file đã upload.
- Endpoint `/metrics` phục vụ Prometheus.

## 7. Đối chiếu yêu cầu kỹ thuật

| Tiêu chí | Giải pháp được triển khai |
|---|---|
| Frontend | React, Vite, Zustand và Socket.IO Client |
| Backend realtime | Node.js, Express.js và Socket.IO |
| Lưu trữ tin nhắn | MongoDB và Mongoose |
| Cache và Pub/Sub | Redis và Socket.IO Redis Adapter |
| Gọi điện | WebRTC với signaling qua Socket.IO |
| Upload | Multer và Docker shared volume |
| Reverse proxy | Nginx |
| Đóng gói | Docker Compose với frontend, nhiều backend, MongoDB, Redis, Prometheus và Nginx |
| Kiểm thử | Jest, API test và Socket.IO test |
| Giám sát | Prometheus metrics và trang `/status` |

## 8. Hướng dẫn demo nhanh

1. Chạy hệ thống bằng `start.bat`.
2. Mở `http://localhost` trên hai trình duyệt hoặc hai profile khác nhau.
3. Đăng nhập bằng hai tài khoản khác nhau.
4. Từ tài khoản thứ nhất, tìm email của tài khoản thứ hai và gửi lời mời kết bạn.
5. Tài khoản thứ hai chấp nhận lời mời.
6. Mở Direct Messages và gửi tin nhắn văn bản.
7. Kiểm tra typing indicator và trạng thái `Sent/Seen`.
8. Gửi ảnh và tệp đính kèm.
9. Tạo nhóm, thêm thành viên, gửi tin nhắn trong nhóm.
10. Đổi tên hoặc ảnh nhóm bằng Group settings.
11. Thực hiện audio/video call 1-1.
12. Mở `/status` để xem trạng thái API, MongoDB, Redis và Socket.IO.

## 9. Lệnh kiểm thử

Chạy test backend:

```bash
cd backend
npm test -- --runInBand
```

Build frontend:

```bash
cd frontend
npm run build
```