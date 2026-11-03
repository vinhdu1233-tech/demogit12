# SongVerse 3D V5 — Render + Neon Free

Xem `HUONG_DAN_TRIEN_KHAI_RENDER_NEON.md` để triển khai. Trên Render bắt buộc có `DATABASE_URL` (Neon) và `SESSION_SECRET` để tài khoản không mất khi Render ngủ. Bản local vẫn dùng `data` như trước.

# SóngVerse 3D V5 – Sửa điều khiển + Sóng âm

Bản game học Vật lý 11 có 11 trạm, 22 câu hỏi (2 câu mỗi trạm), tài khoản, chibi tùy biến, phòng multiplayer và nhạc nền tự tạo.

## Chạy trên máy

1. Cài Node.js 20+, giải nén và mở Terminal trong thư mục `SongVerse_3D_V5`.
2. Chạy `node server.mjs`. Nếu cổng 3000 bận, chạy `PORT=3001 node server.mjs`.
3. Trên Mac/Windows mở `http://localhost:3000` hoặc `http://localhost:3001` tương ứng.
4. Tạo tài khoản mới hoặc dùng tài khoản cũ nếu đã sao chép thư mục `data` từ phiên bản trước.
5. Dùng `npm test` để chạy kiểm thử máy chủ, đồng bộ và camera.

## Điều khiển camera đã sửa

- **W / ↑**: đi về phía xa camera (hướng lên màn hình). **S / ↓**: về phía camera. **A/D**: ngang theo góc camera. **WASD luôn theo hướng camera hiện tại**, không theo trục thế giới. Khi camera quay 180°, hướng di chuyển ngoài đời đảo chiều là đúng vì **màn hình** vẫn là chuẩn.
- **Kéo chuột trực tiếp trên khu vực 3D** hoặc kéo vùng `↔ XOAY ↕`.
- **Thanh “Xoay 360°”** đặt camera chính xác một góc 0–360°. **Thanh “Ngẩng/cúi”** kiểm soát góc nhìn; có nút xoay và nút zoom riêng; **📷/R** đưa camera về mặc định.
- **I/K và J/L** hỗ trợ nâng/hạ và xoay camera bằng bàn phím. Trên điện thoại dùng joystick trái và vùng camera ở bên phải.
- **Tóc, mái, tai, mắt, phụ kiện** đều được dựng cùng phép quay với đầu. Thêm kẹp tóc và lọn tóc bất đối xứng để dễ quan sát khi quay 180°.

## 5 trạm Sóng âm mới (bám tài liệu trang 32–35)

1. **Nguồn âm & truyền âm**: vật dao động, nén/giãn khí, không truyền trong chân không.
2. **Hạ âm – âm nghe được – siêu âm**: theo tài liệu mốc 16–20.000 Hz; phân loại và độ cao.
3. **Độ cao & âm sắc**: mô hình sóng âm và họa âm; có âm mẫu Web Audio tự tạo ngắn và nhỏ.
4. **Cường độ & khoảng cách**: I=P/(4πR²), quan hệ cường độ – biên độ.
5. **Mức cường độ âm (dB)**: L=10 log10(I/I₀) và tỉ số I/I₀.

Các trạm sóng cơ cũ và tiến độ tài khoản giữ nguyên nếu di chuyển **toàn bộ thư mục `data`** sang V5 trước lần chạy đầu tiên. Không chép đè `data` nếu đã tạo tài khoản trong V5.

### Kiểm tra trước khi gửi học sinh

- 2 trình duyệt đăng nhập hai tài khoản, cùng mã phòng, thấy nhân vật và chat/di chuyển.
- Xoay thanh camera 0° → 180° → 360° và quan sát chibi/kẹp tóc: tóc phải đi theo đầu.
- Ở các góc camera khác nhau, giữ W để đi lên màn hình, S đi xuống; thử A/D và joystick trên điện thoại.
- Mở trạm Sóng âm, thay thanh, kiểm tra số và hình minh họa. Nghe âm ở âm lượng vừa phải.

**Lưu ý:** Đây là web game dạy học, thí nghiệm trực quan không thay cho thiết bị đo âm học. Âm thanh phát mẫu không dùng để kiểm tra thính lực. Để chơi ngoài mạng Wi-Fi/24/7 cần triển khai máy chủ Node+WebSocket, lưu trữ lâu dài, HTTPS và quản lý quyền truy cập. Học sinh dùng biệt danh, không nhập thông tin cá nhân vào chat; nên tắt chat khi không có giám sát: `CHAT_ENABLED=false node server.mjs`.

**Không nên dùng bản này như dịch vụ công khai không giám sát**; chưa qua kiểm thử bảo mật chuyên sâu.

## Triển khai online 24/7 (bản ONLINE)
- Xem `TRIEN_KHAI_ONLINE.md` hoặc dùng `DEPLOY_RAILWAY_MAC.command` trên Mac (cần Railway CLI).
- Gắn Railway Volume tại `/app/data` **trước** khi triển khai. Khi chạy trong Railway mà không có Volume, máy chủ chủ động từ chối khởi động để tránh làm mất tài khoản do filesystem tạm.
- Trước khi mời học sinh: chạy `npm test`, kiểm tra tài khoản trên hai thiết bị và khởi động lại server để chắc dữ liệu còn nguyên.
