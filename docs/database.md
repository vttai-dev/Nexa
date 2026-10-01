# Database và migrations

Database local: nexa_dev. PostgreSQL 18.6-alpine, cổng mặc định 54329 chỉ bind loopback. Volume nexa_postgres gắn /var/lib/postgresql theo layout của image PostgreSQL 18. .env chỉ là cấu hình local, không commit.

## Mô hình

| Schema | Bảng |
| --- | --- |
| identity | users, roles, user_roles, user_claims, role_claims, user_logins, user_tokens |
| community | profiles |
| content | articles, article_tags, categories, tags, comments |
| social | likes, bookmarks, follows |

Một NexaDbContext quản lý 16 bảng ứng dụng và migration history mặc định __EFMigrationsHistory. Mapping dùng snake_case cho bảng/cột; tên constraint/index do EF đặt trừ các constraint có tên cụ thể.

- ID đơn là UUIDv7 tạo ở ứng dụng. Profile dùng PK/FK UserId; ArticleTag, Like, Bookmark, Follow có khóa ghép.
- UserName và Email được Identity chuẩn hóa; unique NormalizedEmail được enforced trong PostgreSQL.
- Article/Category/Tag có slug unique; Tag còn unique NormalizedName.
- Article và Comment có Version dạng uuid, optimistic concurrency; không phải cột tự tăng.
- CHECK chặn self-follow, trạng thái Article không hợp lệ, Published thiếu PublishedAtUtc.
- FK đến User và taxonomy dùng Restrict; các record con theo Article dùng Cascade cho purge tương lai.
- Comment có query filter DeletedAtUtc; public article query luôn kiểm tra Published.
- Like/Bookmark/Follow dùng INSERT ... ON CONFLICT DO NOTHING để request đồng thời vẫn idempotent.

## Áp migration hiện có

Sau khi cấu hình connection string trong user-secrets:

```powershell
dotnet run --project src/Nexa.Api -- --migrate --seed
```

Đây là lệnh explicit rồi thoát, không phải tự migrate mỗi khi API chạy. Migration InitialCreate có cả Identity và dữ liệu nghiệp vụ. Seed role chạy qua RoleManager sau khi schema đã tồn tại, không hard-code mật khẩu vào migration.

## Tạo migration tiếp theo

Design-time factory đọc biến môi trường ConnectionStrings__NexaDb. Đặt giá trị cho một database phát triển được phép sử dụng, không đưa mật khẩu vào file code:

```powershell
$env:ConnectionStrings__NexaDb = "<connection-string-local>"
dotnet tool restore
dotnet ef migrations add TenThayDoi --project src/Nexa.Infrastructure --startup-project src/Nexa.Api --output-dir Persistence/Migrations
dotnet ef migrations script --idempotent --project src/Nexa.Infrastructure --startup-project src/Nexa.Api --output artifacts/migrations.sql
dotnet ef migrations has-pending-model-changes --project src/Nexa.Infrastructure --startup-project src/Nexa.Api
Remove-Item Env:ConnectionStrings__NexaDb
```

Tạo folder artifacts nếu chưa có trước khi xuất SQL. Review migration trước khi áp lên database có dữ liệu. Không dùng EnsureCreated cùng migrations. Integration tests áp migration lên PostgreSQL mới, kiểm tra idempotent SQL, role seed và model snapshot khớp.
