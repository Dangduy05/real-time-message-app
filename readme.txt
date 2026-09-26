README - HE THONG NHAN TIN & GOI DIEN TRUC TUYEN
Real-time Chat & Video Call Platform

============================================================
1. THONG TIN DU AN
============================================================

Ten de tai:
He thong Nhan tin & Goi dien Truc tuyen

Mo ta ngan:
Day la ung dung web cho phep nguoi dung dang ky, dang nhap, ket ban, nhan tin 1-1, tao nhom chat, gui hinh anh/tap tin va goi audio/video 1-1 theo thoi gian thuc.

Cong nghe chinh:
- Frontend: React, Vite, Zustand, Socket.IO Client
- Backend: Node.js, Express.js, Socket.IO
- Database: MongoDB
- Cache/Pub/Sub: Redis
- Goi dien: WebRTC, simple-peer
- Reverse Proxy/Load Balancing: Nginx
- Trien khai: Docker, Docker Compose

Thu muc chinh:
- backend/: source code backend
- frontend/: source code frontend
- nginx/: cau hinh Nginx
- monitoring/: cau hinh Prometheus
- tests/: cac file test
- docs/: bao cao va so do neu co

============================================================
2. YEU CAU CAI DAT
============================================================

May cham bai can cai:
- Docker Desktop
- Docker Compose plugin
- Trinh duyet Chrome/Edge/Firefox moi

Khuyen nghi:
- Cho phep quyen camera va microphone khi demo goi audio/video.
- Neu test call, nen mo 2 trinh duyet khac nhau hoac 2 profile khac nhau.

============================================================
3. CACH CHAY DU AN
============================================================

Cach 1 - Chay nhanh tren Windows:

start.bat

File start.bat se goi start.ps1. Script nay se:
1. Dung Docker stack cu neu co.
2. Build va chay lai Docker Compose.
3. Tao tai khoan demo neu chua ton tai.
4. Hien thi dia chi truy cap.

Cach 2 - Chay thu cong bang Docker Compose:

docker compose up --build -d

Kiem tra container:

docker compose ps

Xem log:

docker compose logs -f nginx backend1 backend2 backend3

Dung he thong:

docker compose down --remove-orphans

============================================================
4. DIA CHI TRUY CAP
============================================================

Giao dien web:
http://localhost

Trang kiem tra tinh trang he thong:
http://localhost/status

Backend status API:
http://localhost/api/status

Prometheus metrics:
http://localhost/metrics

============================================================
5. TAI KHOAN DEMO
============================================================

Co the dang ky tai khoan moi truc tiep tren giao dien Register.

Neu chay bang start.bat/start.ps1, script se thu tao cac tai khoan demo:

Tai khoan 1:
Email: testuser1@example.com
Mat khau: password123

Tai khoan 2:
Email: testuser2@example.com
Mat khau: password123

Tai khoan 3:
Email: testuser3@example.com
Mat khau: password123

Luu y:
Neu database da co email demo, API co the bao email da ton tai. Khi do co the dang nhap bang tai khoan cu hoac dang ky tai khoan moi.

============================================================
6. HUONG DAN DEMO CHUC NANG
============================================================

6.1 Dang ky/Dang nhap
1. Mo http://localhost
2. Dang ky tai khoan moi hoac dang nhap tai khoan demo.
3. Neu token sai hoac user khong ton tai, he thong tu chuyen ve trang dang nhap.

6.2 Ket ban
1. Dang nhap bang 2 tai khoan tren 2 trinh duyet/profile khac nhau.
2. Tai khoan 1 tim email tai khoan 2.
3. Tai khoan 1 gui loi moi ket ban.
4. Tai khoan 2 chap nhan loi moi.
5. Danh sach ban be cap nhat theo thoi gian thuc.

6.3 Chat 1-1
1. Mo Direct Messages.
2. Gui tin nhan van ban.
3. Kiem tra tin nhan hien thi realtime.
4. Dong/mo lai cuoc tro chuyen de kiem tra lich su chat.
5. Kiem tra trang thai Sent/Seen.

6.4 Markdown trong tin nhan
Tin nhan ho tro mot so dinh dang Markdown:

In dam:
**noi dung**

In nghieng:
*noi dung*

Inline code:
`const a = 1`

Code block:
```js
console.log("Hello");
```

Danh sach:
- muc 1
- muc 2

Danh sach so:
1. buoc 1
2. buoc 2

Quote:
> noi dung trich dan

Link:
[Google](https://google.com)

6.5 Gui hinh anh/tap tin
1. Bam nut dinh kem trong khung chat.
2. Chon hinh anh de xem preview truoc khi gui.
3. Chon file bat ky de gui duoi dang attachment.
4. Sau khi nhan file, bam nut download de tai ve.

6.6 Group chat
1. Tao group moi.
2. Moi ban be vao group.
3. Gui tin nhan trong group.
4. Truong nhom co the mo Group settings de:
   - Doi ten group.
   - Doi anh group.
   - Xoa thanh vien.
   - Giai tan group.
5. Thanh vien co the roi group.

6.7 Presence va typing
1. Khi nguoi dung online, ban be se thay trang thai Online.
2. Khi nguoi dung dang go tin nhan, doi phuong thay "User is typing...".
3. Typing indicator tu tat sau 5 giay neu ngung nhap.

6.8 Audio/Video call
1. Mo chat 1-1 voi ban be.
2. Bam nut audio call hoac video call.
3. Doi phuong thay popup incoming call.
4. Chap nhan cuoc goi.
5. Thu bat/tat mic, bat/tat camera, ket thuc cuoc goi.

Luu y:
WebRTC phu thuoc quyen camera/microphone cua trinh duyet. Neu khong hien camera/mic, hay kiem tra quyen trinh duyet.

============================================================
7. CAC CHUC NANG DA HOAN THANH THEO CAP DO
============================================================

Cap do 1 - Nen tang chat co ban:
- Dang ky, dang nhap JWT.
- Tim kiem nguoi dung.
- Gui/chap nhan loi moi ket ban.
- Chat 1-1 realtime.
- Luu va load lich su chat tu MongoDB.
- Trang thai tin nhan Sent/Seen.

Cap do 2 - Nhom va da phuong tien:
- Tao group chat.
- Them/xoa thanh vien.
- Roi group.
- Giai tan group voi quyen truong nhom.
- Doi ten/anh group.
- Gui hinh anh.
- Gui file dinh kem.
- Preview anh truoc khi gui.
- Presence online/offline realtime.
- Typing indicator.

Cap do 3 - Audio/Video call:
- Signaling server bang Socket.IO.
- Goi audio/video 1-1 bang WebRTC.
- Popup khi co cuoc goi den.
- Bat/tat mic.
- Bat/tat camera.
- Ket thuc cuoc goi.

Cap do 4 - Hieu nang va kha nang mo rong:
- Docker Compose chay 3 backend instance: backend1, backend2, backend3.
- Nginx load balancing toi backend cluster.
- Redis Adapter dong bo Socket.IO event giua cac backend.
- Redis cache danh sach ban be/user.
- Shared upload volume de tranh loi file 404 khi load balancing.
- Prometheus metrics endpoint.

============================================================
8. GIAI THICH KY THUAT VA HIEU NANG
============================================================

8.1 Ly do dung Node.js + Socket.IO
Node.js co mo hinh non-blocking I/O, phu hop voi ung dung realtime co nhieu ket noi dong thoi. Socket.IO ho tro room, reconnect, websocket transport va co Redis Adapter de scale qua nhieu backend instance.

8.2 Ly do dung MongoDB
Tin nhan chat la du lieu ghi nhieu, doc theo conversation va co cau truc linh hoat. MongoDB phu hop de luu message logs, user, friend relation, chat va chat members.

8.3 Ly do dung Redis
Redis duoc dung cho 2 muc dich:
- Cache du lieu truy cap thuong xuyen nhu user/friend list.
- Pub/Sub cho Socket.IO Redis Adapter.

8.4 Van de khi scale WebSocket
Neu chay nhieu backend instance, User A co the ket noi backend1, User B co the ket noi backend2. Neu khong co Redis Adapter, event phat tu backend1 se khong den socket dang nam tren backend2.

Giai phap:
- Tat ca backend instance ket noi Redis.
- Socket.IO Redis Adapter publish/subscribe event qua Redis.
- Tin nhan realtime van den dung user du user dang ket noi instance nao.

8.5 Nginx load balancing
Nginx reverse proxy cac request:
- /api
- /socket.io
- /uploads
- /metrics

Nginx phan phoi request toi backend1, backend2, backend3 bang upstream backend_cluster.

8.6 Shared upload volume
File upload duoc luu vao volume chung backend_uploads. Nho do file upload tu backend1 van doc duoc neu request xem/tai file di vao backend2 hoac backend3.

8.7 WebRTC
Backend khong truyen truc tiep media stream. Backend chi lam signaling server de truyen offer/answer. Sau khi bat tay thanh cong, audio/video di truc tiep giua 2 trinh duyet theo mo hinh Peer-to-Peer.

8.8 Phan tich Prompt
Du an khong phu thuoc vao prompt AI trong runtime cua he thong. Neu co su dung AI trong qua trinh ho tro phat trien, prompt chi duoc dung de phan tich yeu cau, goi y code, viet bao cao va kiem tra loi. Source code van duoc kiem tra bang build/test va chay thuc te qua Docker.

============================================================
9. LENH KIEM THU
============================================================

Chay test backend:

cd backend
npm test -- --runInBand

Build frontend:

cd frontend
npm run build

Kiem tra Docker Compose:

docker compose config --services

Kiem tra trang status:

Mo trinh duyet tai:
http://localhost/status

Ket qua kiem tra gan nhat:
- Backend test: 43 passed.
- Frontend build: thanh cong.

============================================================
10. CAU HINH DOCKER COMPOSE
============================================================

File docker-compose.yml dinh nghia cac services:
- frontend
- backend1
- backend2
- backend3
- mongodb
- redis
- nginx
- prometheus

He thong co the chay bang mot lenh:

docker compose up --build -d

Hoac tren Windows:

start.bat

============================================================
11. VIDEO DEMO
============================================================

Video demo:
CHUA_CAP_NHAT_LINK
