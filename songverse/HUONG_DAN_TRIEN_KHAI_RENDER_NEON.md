# SóngVerse 3D V5 — triển khai Render Free + Neon Free

**Lưu ý: chưa triển khai công khai cho lớp; thiếu kết nối Neon DATABASE_URL và một GitHub repository chứa code.**

## Kiến trúc
- Render Free chạy một instance Node.js phục vụ trang game và WebSocket (người chơi nhìn thấy nhau theo mã phòng).
- Neon Postgres lưu tài khoản, mật khẩu băm (scrypt), avatar và XP. Không dùng file JSON trên Render Free.
- SESSION_SECRET được đặt trong env của Render, không đưa lên GitHub. Token đăng nhập còn hiệu lực 30 ngày; sau đó học sinh có thể đăng nhập lại bằng mật khẩu.

## Cấu hình Render
- Runtime: Node; plan: Free; region: Singapore; build `npm install --omit=dev`; start `npm start`.
- Environment: `DATABASE_URL` từ Neon, `SESSION_SECRET` chuỗi ngẫu nhiên 32+ ký tự, `NODE_ENV=production`, `CHAT_ENABLED=true`.
- Nếu thiếu DATABASE_URL/SESSION_SECRET, server cố tình không khởi động để tránh mất tài khoản.
- `GET /api/health` trả `storage:postgres` khi sẵn sàng, `chatEnabled` tùy cấu hình.
- Tên repository riêng là tốt nhất. File `render.yaml` là bản mẫu khai báo, không chứa mật khẩu.

## Giới hạn gói miễn phí
- Render Free có thể ngủ sau 15 phút không có truy cập và mất ~1 phút khởi động.
- Neon Free giới hạn tài nguyên, có thể sleep DB và chậm lại khi mở game. Không bảo đảm 24/7 kết nối tức thời.
- Để đảm bảo an toàn cho học sinh: dùng biệt danh, không nhập dữ liệu cá nhân vào chat; giới hạn và giám sát người dùng trong lớp.
- Chat không lưu lịch sử. Nhật ký khoa học hiện lưu cục bộ trên thiết bị.

## Lưu tài khoản hiện có trên MacBook
- File `data/users.json` trong máy Mac chưa tự đồng bộ lên Neon. Cần chuyển đổi / nhập một lần; *không* tải `secret.key` hay file này lên GitHub.
- Không bật 2 backend đồng thời trước khi chuyển dữ liệu, tránh xung đột tài khoản.

## Thử trước khi gửi học sinh
1. Đăng ký A trên điện thoại và B trên máy tính; cùng mã phòng.
2. Kiểm tra nhắn tin, thấy người, di chuyển.
3. Đăng xuất rồi đăng nhập lại; avatar/XP phải giữ nguyên.
4. Redeploy và kiểm tra tài khoản vẫn tồn tại.
5. Không công bố link trước khi kiểm tra quy trình hỗ trợ và điều phối chat.
