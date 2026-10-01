# Phát triển Nexa.Platform

## Phụ thuộc và cấu trúc

Target net10.0; SDK pin ở global.json, package pin ở Directory.Packages.props, dotnet-ef là local tool. Application và Domain không tham chiếu EF/ASP.NET. Identity chứa User/Role và adapter tài khoản; Infrastructure chứa DbContext, EF stores, mapping, repository và migration. API là composition root, endpoint gọi handler.

Một số file được nhóm theo tính năng (AccountContracts.cs, ArticleContracts.cs, TaxonomyHandler.cs) để tránh tạo quá nhiều lớp một dòng. Thứ tự phụ thuộc giữ nguyên bản thiết kế; architecture tests kiểm tra trực tiếp project references.

User/Role kế thừa kiểu chuẩn ASP.NET Core Identity với Guid. Profile chia sẻ UserId. Đăng ký chạy trong một transaction dùng chung scoped DbContext cho Identity stores và profile.

## Cấu hình

- ConnectionStrings:NexaDb: user-secrets cho local, biến môi trường ConnectionStrings__NexaDb khi triển khai.
- Cors:AllowedOrigins: mặc định rỗng, cùng origin. Chỉ thêm origin chính xác khi thật sự có frontend khác origin.
- RateLimits:AuthPermitLimit: mặc định 10 đăng ký/đăng nhập mỗi phút cho một địa chỉ IP.
- RateLimits:SearchPermitLimit: mặc định 60 truy vấn tìm kiếm mỗi phút cho một địa chỉ IP.
- BootstrapAdmin:Email, BootstrapAdmin:UserName, BootstrapAdmin:Password: chỉ dùng bởi lệnh quản trị.
Skeleton hiện chưa bắt xác minh email, số điện thoại hoặc đăng nhập GitHub. Các luồng gửi mail/SMS, xác minh số điện thoại, reset password và OAuth sẽ hoàn thiện sau khi API nền tảng ổn định.

Cookie bảo mật dùng prefix __Host-, chỉ gửi qua HTTPS. Giữ Data Protection keys khi restart/deploy production để tránh vô hiệu hóa các phiên ngoài ý muốn. Nếu chạy sau reverse proxy, cần cấu hình trusted forwarded headers, AllowedHosts và TLS phù hợp trước khi đưa public.

## Tạo tài khoản Admin local

Không có mật khẩu Admin mặc định. Người dùng đăng ký qua API chỉ nhận Member. Lệnh bootstrap là thao tác quản trị local, không có endpoint nâng quyền.

```powershell
dotnet user-secrets set "BootstrapAdmin:Email" "admin@example.test" --project src/Nexa.Api
dotnet user-secrets set "BootstrapAdmin:UserName" "nexa_admin" --project src/Nexa.Api
dotnet user-secrets set "BootstrapAdmin:Password" "<mat-khau-rieng-it-nhat-12-ky-tu>" --project src/Nexa.Api
dotnet run --project src/Nexa.Api -- --bootstrap-admin
dotnet user-secrets remove "BootstrapAdmin:Password" --project src/Nexa.Api
```

Nếu email đã có, lệnh cấp Admin cho đúng tài khoản đó; không đổi mật khẩu. Kiểm tra email trước khi chạy. Sau khi đổi role hoặc khóa tài khoản, phiên đăng nhập cũ bị vô hiệu hóa ngay; người dùng cần đăng nhập lại.

## Phân quyền

- Khách: xem bài đã xuất bản, hồ sơ công khai, danh mục và thẻ.
- Member: quyền của khách; quản lý bài viết, bình luận, báo cáo, tương tác và hồ sơ của chính mình.
- Moderator: quyền của Member; đọc hàng chờ duyệt bài/báo cáo, xem mọi bài để kiểm duyệt, xử lý báo cáo, xóa bình luận vi phạm, lưu trữ và ghim bài. Không quản lý tài khoản, danh mục, thẻ, thống kê tổng hoặc nhật ký hệ thống.
- Admin: quyền của Moderator và quyền quản trị tài khoản, danh mục, thẻ, thống kê tổng, nhật ký hệ thống.

Các tuyến kiểm duyệt yêu cầu role Moderator hoặc Admin ngay tại API; kiểm tra tác giả/chủ sở hữu vẫn thực hiện trong Application. Giao diện chỉ hiển thị chức năng phù hợp, không thay thế bảo vệ ở API.

## Vòng phát triển

```powershell
dotnet build Nexa.Platform.slnx
dotnet test tests/Nexa.Domain.Tests
dotnet test tests/Nexa.Application.Tests
dotnet test tests/Nexa.ArchitectureTests
dotnet test tests/Nexa.IntegrationTests
dotnet format Nexa.Platform.slnx --verify-no-changes --no-restore
```

Entity giữ quy tắc bất biến; Application kiểm tra quyền và điều phối; Infrastructure xử lý truy vấn. Thêm test cho hành vi, quyền và constraint cần bảo vệ. Không dùng EF InMemory để thay thế PostgreSQL trong integration tests.

Bình luận được xóa mềm. Bài viết dùng trạng thái Archived thay cho xóa cứng. Chưa có xóa User, upload file, tìm kiếm toàn văn, VIP, marketplace hoặc frontend.

## Tắt môi trường

```powershell
docker compose stop
```

Lệnh này giữ dữ liệu. Không xóa volume nếu còn dữ liệu cần giữ. Integration tests dùng container riêng và không cần lệnh cleanup thủ công.
