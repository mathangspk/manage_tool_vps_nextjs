# Tài liệu Bàn giao Hệ thống (System Handoff Document)

Tài liệu này tổng hợp toàn bộ các thay đổi cấu hình, kết quả triển khai thực tế trên môi trường cục bộ và VPS sản xuất mới (`vps-prod`), cùng quy trình di trú hệ thống sao lưu cơ sở dữ liệu MongoDB tự động lên Google Drive.

---

## 1. Trạng thái hoạt động hiện tại (Current Status)

### 1.1. Môi trường VPS Sản xuất (`vps-prod` - 113.161.220.166)
Hệ thống đã được đóng gói Docker Compose và chạy ổn định song song với các dịch vụ cũ, sử dụng kiến trúc cổng tối giản:
-   **Giao diện Web:** **`http://113.161.220.166:3000`** (Lắng nghe cổng `3000` trên tất cả card mạng `0.0.0.0:3000`).
-   **Express Backend API:** **`http://113.161.220.166:4001`** (Lắng nghe cổng `4001` trên tất cả card mạng `0.0.0.0:4001`).
-   **MongoDB Database:** Container `mongo:4.4` phục hồi thành công **18.428 tài liệu** (100% dữ liệu) và được lưu trữ lâu dài trong Docker Volume.

### 1.2. Hệ thống Sao lưu Tự động lên Google Drive (Google Drive Backup)
-   **Trạng thái:** **Hoạt động 100% ổn định.**
-   **Script điều hướng:** `/home/tma_agi/manage_tool_deploy/backup_and_upload.sh`
-   **Ứng dụng Node.js Drive API:** `/home/tma_agi/manage_tool_deploy/apiGoogle/`
-   **Cron Job:** Đã thiết lập thành công chạy tự động mỗi 12 giờ (`0 */12 * * *`).
-   **Retention Policy (Lưu trữ xoay vòng):** Lưu 7 ngày gần nhất trên cả local VPS host và Google Drive. Thông tin thư mục được đồng bộ hoàn toàn với file tracking `data.json` từ VPS cũ, đảm bảo việc tự động dọn dẹp không bị gián đoạn.
-   **Thư mục lưu trữ chính trên Google Drive:** Thư mục `backupMongoMangeTool` (ID: `1fDaYNjc9_p20Iot7yThUsLmNBS2iOpCp`).

### 1.3. Môi trường Cục bộ (Local - Windows WSL)
Hệ thống chạy local trong Docker tích hợp trên WSL Ubuntu của Windows:
-   **Giao diện Web:** **`http://localhost:3001`** (Chuyển sang cổng `3001` để tránh xung đột với WSL port relay cổng `3000`).
-   **API Backend:** **`http://localhost:4001`** (MongoDB tại port `27017`).

---

## 2. Danh sách các thay đổi & Cấu hình chi tiết (List of Changes)

### 2.1. Di trú và Cấu hình Google Drive Backup
-   **Đồng bộ mã nguồn Node.js:** Tải và giải nén thành công mã nguồn Node.js Google Drive API (`apiGoogle`) từ VPS cũ sang VPS mới tại đường dẫn `/home/tma_agi/manage_tool_deploy/apiGoogle`.
-   **Đồng bộ lịch sử lưu trữ (`data.json`):** Đồng bộ hoàn toàn tệp tin tracking `data.json` (chứa danh sách 7 thư mục backup gần nhất cùng ID thư mục Drive tương ứng) để tính năng tự động xóa bản sao lưu cũ hoạt động liên tục.
-   **Tối ưu hóa nén và upload:**
    -   Thay thế nén `.zip` bằng tệp `.tar.gz` (do VPS host mới không có sẵn lệnh `zip` và không có quyền `sudo` để cài đặt thêm).
    -   Sửa đổi đường dẫn tệp nguồn trong `apiGoogle/app.js` hướng về `/home/tma_agi/manage_tool_deploy/database_dump/lastest` phù hợp với cấu trúc thư mục mới.
-   **Script tích hợp `backup_and_upload.sh`**:
    -   Tự động chạy `docker exec manage-tool-db mongodump ...` xuất dữ liệu ra thư mục ánh xạ host.
    -   Nén thư mục dump thành `mongoManageTool.tar.gz`.
    -   Sao chép tệp nén vào thư mục `lastest/` cho Node.js script.
    -   Gọi Node.js upload tệp nén lên Google Drive theo ngày `YYYY-MM-DD`.
    -   Quét và dọn dẹp các tệp tin backup cục bộ cũ hơn 7 ngày trên VPS host.

### 2.2. Cấu hình Docker & Bảo mật Git
-   **`docker-compose.yml`**: Thiết lập mạng lưới 3 container cô lập, chuyển đổi cổng ESP32 cũ sang `3005` để nhường cổng `3000` toàn cục cho web giao diện mới.
-   **Làm sạch bảo mật Git:** Sử dụng `git filter-branch` quét sạch 100% mật mã, khóa và IP nhạy cảm trong lịch sử commit trên GitHub của cả hai dự án Backend (`apimanagetoolLocalServer`) và Frontend (`clientManageTool2`).

### 2.3. Tài liệu vận hành hệ thống dành cho AI Agent
-   **Tạo mới và cập nhật `agent.md`**: Soạn thảo tài liệu vận hành chi tiết bao gồm các câu lệnh đăng nhập VPS SSH, quản lý các container Docker Compose, truy cập DB MongoDB, giám sát Backup Google Drive. Bổ sung hướng dẫn chi tiết cách chạy và build dự án Next.js mới cục bộ.
-   **Quy trình cập nhật mã nguồn an toàn**: Thiết lập quy trình phát triển và kiểm thử 4 bước: Code -> Chạy thử nghiệm Local -> Phê duyệt cá nhân -> Deploy cập nhật lên VPS. Làm rõ quyết định vận hành chạy song song local/VPS qua IP tĩnh `http://113.161.220.166:3000` thay vì tích hợp Vercel để tránh lỗi chặn kết nối Mixed Content (HTTPS sang HTTP).

### 2.4. Khởi tạo dự án Frontend mới (Next.js & TailwindCSS)
-   **Khởi tạo thành công `frontend-nextjs`**: Tạo dự án Next.js (App Router, JS, TailwindCSS v4) tại thư mục gốc để tiến hành viết lại toàn diện Frontend cũ.
-   **Bộ quy tắc thiết kế công nghiệp (Power Plant UI/UX)**:
    -   Tông màu Navy Blue tin cậy, nghiêm túc thích hợp cho môi trường công sở nhà nước.
    -   Quy ước màu an toàn/trạng thái chuẩn công nghiệp: Green (Hoàn thành/Đạt), Orange (Đang chạy/Cảnh báo), Red (Hỏng/Nguy hiểm).
    -   Responsive ưu tiên hiển thị Mobile Card View thay cho Table phức tạp để hỗ trợ kỹ sư bảo trì kiểm tra phiếu công tác (PCT) trực tiếp ngoài hiện trường.

### 2.5. Hoàn thành viết lại toàn bộ giao diện quản trị (Phase 3 & Phase 4)
Chúng tôi đã hoàn thành việc di trú tất cả các phân hệ quản lý sang Next.js (App Router) với trải nghiệm mượt mờ, responsive cho cả Desktop và Mobile:
1.  **Quản lý dụng cụ (`/admin/tool`)**: Tìm kiếm, thêm, sửa, xóa trực tiếp (inline CRUD) công cụ, vật tư bảo trì.
2.  **Quản lý Work Order (`/admin/order`)**: Danh sách phiếu công tác (PCT) bảo trì, lọc theo PX thực hiện, trạng thái, người tạo, ngày tháng và loại hình công việc (PM/CM/Tiểu tu/Đại tu).
3.  **Chi tiết Work Order (`/admin/order/[id]`)**: Quản lý danh sách nhân sự tham gia, trạng thái kiểm soát, và cấp phát/hoàn trả dụng cụ trực tiếp của phiếu.
4.  **Báo cáo nhanh kỹ thuật (`/admin/fastReport`)**: Quản lý phiếu báo cáo sự cố thiết bị nhanh, cách khắc phục, kỹ sư tham gia.
5.  **Chi tiết Báo cáo nhanh (`/admin/fastReport/[id]`)**: Tích hợp danh sách tệp đính kèm và thư viện hình ảnh sự cố trực tiếp đồng bộ với Google Drive.
6.  **Biên bản Đánh giá Kỹ thuật (`/admin/bbdgkt`) & Chi tiết (`/admin/bbdgkt/[id]`)**: Quản lý biên bản sau bảo trì, đính kèm tệp tin liên quan (Google Drive).
7.  **Biện pháp Thi công & JSA (`/admin/bptc`) & Chi tiết (`/admin/bptc/[id]`)**: Đăng ký và tra cứu số hiệu biện pháp thi công, phân tích an toàn lao động cùng tệp đính kèm.
8.  **Dashboard Thống kê (`/admin/thongke`)**: Biểu đồ thống kê số lượng phiếu công tác thực tế của từng tổ (Kiểm Nhiệt, Tự Động, Máy Tĩnh, Máy Động, Turbine,...) theo các trạng thái (START, READY, IN PROGRESS, COMPLETE, CLOSE).
9.  **Quản lý người dùng (`/admin/customer`)**: Quản lý danh sách danh mục cán bộ, phân quyền Admin/Phòng Kỹ Thuật (Pkt) và hỗ trợ Reset mật khẩu về mặc định.

### 2.6. Khắc phục lỗi & Khôi phục nghiệp vụ từ mã nguồn React cũ
Chúng tôi đã thực hiện một loạt nâng cấp và sửa lỗi lớn để đảm bảo Frontend Next.js hoạt động khớp 100% với logic cơ sở cũ:
-   **Sửa lỗi sập trang Dashboard Thống kê:** Bổ sung import biểu tượng `FileText` từ `lucide-react`. Tiến hành chuẩn hóa dữ liệu trạng thái tự động (`IN_PROGRESS` thành `IN PROGRESS`) nhận từ API Backend để hiển thị đầy đủ, chính xác biểu đồ thống kê các phân xưởng.
-   **Tích hợp Modal "Lấy số mới" cho CHTT (`/admin/cchtt`) & GSAT (`/admin/cgsat`):** Xây dựng các Modal Dialog tạo phiếu mới và chỉnh sửa trực tiếp. Số hiệu phiếu thay đổi (PCCHTT và PCGSAT) được tự sinh tuần tự từ Backend trên máy chủ. Giao diện được kiểm soát chặt chẽ theo phân quyền của người dùng (chỉ Admin hoặc chính chủ tài khoản tạo phiếu mới được quyền Sửa/Xóa).
-   **Tích hợp Drive Photo Uploader cho Fast Report (`/admin/fastReport`):** Bổ sung khu vực kéo thả / chọn ảnh sự cố thiết bị trực quan ngay trên Modal Thêm/Sửa Báo cáo nhanh. Ảnh được tải lên Google Drive của hệ thống qua API `filesApi.uploadPhotos` và gán mã `idImage` tương ứng vào báo cáo khi lưu. Hỗ trợ hiển thị ảnh thu nhỏ (preview) trực tiếp từ Drive và cho phép người dùng nhấn (X) để gỡ ảnh.
-   **Tự động sinh số PCT trong Work Order (`/admin/order`):** Sửa đổi input trường `PCT` thành dạng vô hiệu hóa (disabled / Read-only) để hệ thống tự động sinh số tuần tự trên máy chủ khi tạo mới (`pctT + "/" + month + "/" + year`), loại bỏ việc bắt buộc người dùng tự nhập số PCT ở Frontend.
-   **Sửa lỗi không tạo được mới Work Order:** Bổ sung đầy đủ các trường dữ liệu bắt buộc Mongoose Schema yêu cầu (`userId`, `toolId`, `NV`, `fastReport`) vào payload tạo mới nhằm chấm dứt lỗi xác thực và tạo phiếu mới thành công.
-   **Đảm bảo sắp xếp PCT từ mới nhất đến cũ nhất:** Thiết lập bộ sắp xếp (sort) cưỡng chế phía Frontend trên trường `date` và `timeStart` để đảm bảo danh sách luôn luôn hiển thị phiếu công tác mới nhất lên trên cùng.
-   **Tối ưu hóa tốc độ tải trang Quản lý dụng cụ (`/admin/tool`):** 
    -   *Phía Backend:* Nâng cấp tuyến API tìm kiếm `/api/tools/search` hỗ trợ nhận tham số phân trang `skip` và `limit` để tính toán lượng dữ liệu trả về theo nhu cầu, thay vì kết xuất toàn bộ kho dữ liệu.
    -   *Phía Frontend:* Áp dụng bộ lọc **Debounce (450ms)** giúp triệt tiêu việc spam request liên tục khi gõ phím. Đồng thời xây dựng thanh phân trang **Pagination Controls Footer** trực quan, tự động điều chỉnh trang hiện tại khi tìm kiếm thay đổi, giúp trang quản lý tải cực kỳ tức thời và mượt mà.

### 2.7. Dockerization Next.js cho Production
-   **Nâng cấp `next.config.mjs`**: Bật `output: 'standalone'` để Next.js tự động tối ưu hóa và xuất ra gói chạy server tối giản.
-   **Cập nhật `Dockerfile.frontend`**: Viết lại tệp tin Dockerfile frontend ở root sử dụng phương thức build đa giai đoạn (multi-stage build) để biên dịch dự án Next.js và chạy file `server.js` standalone trên cổng `3000`. Cải tiến này giúp container chạy mượt mà mà không phụ thuộc vào Nginx serve tĩnh, giữ nguyên kiến trúc kết nối trong `docker-compose.yml`.

---

## 3. Nhật ký chuyển giao mã nguồn (Git Remotes)

Các kho lưu trữ mã nguồn mới đã được đồng bộ hóa và lưu trữ trên GitHub cá nhân của bạn:
-   **Backend (Mới):** `git@github.com:mathangspk/manage_tool_pvps_nextjs_backend.git`
-   **Frontend Next.js (Mới):** `git@github.com:mathangspk/manage_tool_vps_nextjs.git`

---

## 4. Kiểm thử và Xác minh (Verification & Testing)

-   **Biên dịch Next.js:** Đã chạy thử nghiệm lệnh `npm.cmd run build` thành công xuất sắc 100% chỉ trong **3.0 giây**, tạo ra gói standalone tối ưu hóa hoàn toàn sạch, không gặp bất cứ lỗi typescript hay bundle nào.
-   **Sao lưu MongoDB tự động:** Xác nhận cron job tự động kích hoạt và sao lưu thành công Mongo DB lên Google Drive của bạn.

---

## 5. Hướng dẫn vận hành đính kèm

1.  **[BACKUP_RESTORE.md](file:///C:/local/opencode/web/manage-tool-pvps/BACKUP_RESTORE.md)**: Hướng dẫn chi tiết cách sao lưu/phục hồi thủ công MongoDB, cấu hình hệ thống sao lưu tự động Google Drive, cách kiểm tra logs và chạy sao lưu bằng tay.
2.  **[agent.md](file:///c:/local/opencode/web/manage-tool-pvps/agent.md)**: Cẩm nang vận hành dành riêng cho AI Agent (hoặc quản trị viên) bao gồm lệnh đăng nhập VPS SSH, lệnh Docker, truy cập DB MongoDB, giám sát Backup Google Drive và quy trình Deploy code mới.
3.  **[walkthrough.md](file:///C:/Users/technician/.gemini/antigravity/brain/5d098fb1-e70b-4708-a308-c398cac12e54/walkthrough.md)**: Nhật ký logs hệ thống và hướng dẫn truy cập các cổng local/production đầy đủ.

---

## 6. Các bước tiếp theo đề xuất (Next Steps)

1.  **Đồng bộ Git mới:** Chạy các lệnh Git để đồng bộ toàn bộ các trang Next.js vừa được viết lại cùng cấu hình Docker mới lên GitHub Repo.
2.  **Triển khai thực tế trên VPS:** Kết nối VPS thông qua SSH, thực hiện pull code mới nhất và tái khởi động Docker Compose bằng lệnh:
    ```bash
    docker-compose down && docker-compose up -d --build
    ```
