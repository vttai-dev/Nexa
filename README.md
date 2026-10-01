# Nexa.Platform

Backend nền tảng tri thức kỹ thuật, xây bằng .NET 10, Clean Architecture, ASP.NET Core Identity, EF Core và PostgreSQL 18.

## Đã có

- 5 project backend: Domain, Application, Identity, Infrastructure, Api.
- User, Profile, Role, Article, Category, Tag, ArticleTag, Comment, Like, Bookmark, Follow.
- API tài khoản/hồ sơ, bài viết, danh mục/tag, bình luận, thích/lưu bài và theo dõi.
- Cookie bảo mật + CSRF; phân quyền tác giả, Member, Moderator, Admin; kiểm tra version khi sửa nội dung.
- Migration InitialCreate, seed role idempotent, Docker Compose, health checks, OpenAPI và kiểm thử với PostgreSQL thật.

Nexa.Web chưa triển khai theo kiến trúc đã duyệt. Đây là backend giai đoạn đầu, chưa có giao diện website hoặc thanh toán.

## Chạy nhanh trên Windows

Cần .NET SDK 10.0.301 và Docker Desktop đang chạy Linux containers. Chạy PowerShell tại thư mục dự án:

```powershell
cd W:\Nexa
.\scripts\Initialize-Development.ps1
dotnet run --project src/Nexa.Api --launch-profile https
```

Script tự tạo mật khẩu database ngẫu nhiên trong .env (được gitignore), khởi động PostgreSQL tại localhost:54329, lưu connection string vào .NET user-secrets, áp migration và seed ba role. Script giữ nguyên .env đã có. Không dùng database đang chứa dữ liệu của ứng dụng khác.

API: https://localhost:7210. Mô tả API: https://localhost:7210/openapi/v1.json. Health: /health/live và /health/ready.

Nếu trình duyệt chưa tin chứng chỉ phát triển, chạy `dotnet dev-certs https --trust` và duyệt hộp thoại của Windows. HTTP localhost:5210 chỉ chuyển hướng sang HTTPS; cookie đăng nhập yêu cầu HTTPS.

Các lần sau chỉ cần `docker compose up -d --wait` và `dotnet run --project src/Nexa.Api`. Có thể dùng `.\scripts\Initialize-Development.ps1 -StartApi` cho lần chạy đầu.

## Kiểm thử

```powershell
dotnet test Nexa.Platform.slnx
```

Có 4 project test: Domain, Application, Architecture và Integration. Integration dùng PostgreSQL 18.6 trong các container tạm và tự dọn container khi xong; không dùng database nexa_dev. Docker phải sẵn sàng trước khi chạy integration tests.

## Tài liệu

- [Kiến trúc đã duyệt](docs/Nexa.Platform-architecture.md)
- [Hướng dẫn phát triển và tài khoản quản trị](docs/development.md)
- [Database và migration](docs/database.md)
- [Hợp đồng API và luồng đăng nhập](docs/api.md)
- [Request mẫu](src/Nexa.Api/Nexa.Api.http)

Mật khẩu, connection string thật và Data Protection keys không thuộc source control. Trước khi mở public cần hoàn thiện xác minh email/số điện thoại, quên mật khẩu, đăng nhập GitHub, nơi lưu Data Protection keys bền vững và cấu hình triển khai.
