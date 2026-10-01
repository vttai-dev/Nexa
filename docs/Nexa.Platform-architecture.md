# Nexa.Platform — bản thiết kế giai đoạn 1

Trạng thái: **Đã được người dùng duyệt ngày 26/09/2026; backend giai đoạn 1 đã được triển khai.**

Thư mục triển khai: `W:\Nexa`. Solution đặt trực tiếp tại thư mục này, không lồng thêm một thư mục Nexa.Platform.

## 1. Phạm vi và môi trường

Xây nền tảng tri thức kỹ thuật theo hướng blog, cộng đồng, tài liệu và các sản phẩm trả phí trong tương lai. Giai đoạn 1 hoàn thành nền tảng tài khoản, bài viết và tương tác, có migration và API kiểm thử được.

Ghi nhận trước triển khai ngày 26/09/2026 (mốc lập kế hoạch):

- `W:\Nexa` đang trống trước khi lưu bản thiết kế này; không có AGENTS.md tại `W:\` hoặc `W:\Nexa`.
- Máy có .NET SDK 10.0.301 và ASP.NET Core runtime 10.0.9.
- Có Docker CLI và Git; chưa kiểm tra Docker Engine đang chạy hay PostgreSQL đang sẵn sàng. Không tìm thấy psql trong PATH.
- Chưa tạo solution, mã nguồn, database hoặc migration; chưa cài thêm công cụ.

## 2. Kiến trúc đề xuất

Một ứng dụng backend triển khai chung, phân lớp theo Clean Architecture và nhóm tính năng theo Accounts, Articles, Taxonomy, Comments, Engagement. Chỉ có một tiến trình API và một PostgreSQL database ở giai đoạn này.

| Project | Trách nhiệm | Tham chiếu project trực tiếp |
| --- | --- | --- |
| Nexa.Domain | Entity nghiệp vụ, trạng thái, quy tắc bất biến | Không có |
| Nexa.Application | Use case, DTO, validation, interface lưu trữ và tài khoản | Domain |
| Nexa.Identity | ASP.NET Core Identity, User, Role, dịch vụ đăng nhập | Application |
| Nexa.Infrastructure | EF Core, PostgreSQL, repository, migration, Identity EF stores | Application, Domain, Identity |
| Nexa.Api | HTTP endpoints, xác thực request, ánh xạ lỗi, cấu hình DI | Application, Infrastructure, Identity |
| Nexa.Web | Dự kiến giao diện public có server-side rendering để hỗ trợ SEO | Chưa tạo trong giai đoạn 1 |

Luồng chính: HTTP endpoint → application handler → interface → infrastructure/identity implementation → PostgreSQL. Api tham chiếu các adapter để đăng ký DI, nhưng endpoint nghiệp vụ không gọi DbContext trực tiếp.

Application và Domain không tham chiếu EF Core hoặc ASP.NET Core Identity. Nexa.Identity là thư viện chạy trong API, không phải một dịch vụ triển khai riêng. Infrastructure có thể tham chiếu Identity để cấu hình EF stores; Identity không tham chiếu ngược Infrastructure nên không tạo vòng phụ thuộc.

Dùng ASP.NET Core Minimal APIs theo nhóm endpoint; handler được đăng ký DI trực tiếp. Chưa cần MediatR, AutoMapper, generic repository, event bus, Redis hoặc Elasticsearch. Repository chuyên biệt và query service trả DTO; không đưa IQueryable ra khỏi Infrastructure. Dùng async và CancellationToken xuyên suốt các thao tác I/O.

Nền tảng phiên bản: net10.0, EF Core 10.x, Npgsql EF provider 10.x, PostgreSQL 18. EF Core 10 yêu cầu .NET 10; Npgsql đã phát hành provider 10. [Tài liệu EF Core](https://learn.microsoft.com/en-us/ef/core/what-is-new/ef-core-10.0/whatsnew), [Npgsql 10](https://www.npgsql.org/efcore/release-notes/10.0.html).

Khi dựng skeleton, pin SDK 10.0.301 với latestPatch và chọn bản package ổn định tương thích, ghi phiên bản cụ thể trong Directory.Packages.props. PostgreSQL dùng bản vá được hỗ trợ của major 18, pin image cụ thể khi tạo compose. [Chính sách phiên bản PostgreSQL](https://www.postgresql.org/support/versioning/).

## 3. Kế hoạch file và folder

Cây dưới đây là kế hoạch sẽ tạo sau khi duyệt. Các folder Features và Configurations sẽ được bổ sung file theo đúng use case/entity tương ứng; không tạo sẵn các module chưa triển khai.

```text
W:\Nexa\
├── Nexa.Platform.slnx
├── global.json
├── Directory.Build.props
├── Directory.Packages.props
├── .editorconfig
├── .gitignore
├── .env.example
├── .config/
│   └── dotnet-tools.json
├── compose.yaml
├── README.md
├── docs/
│   ├── Nexa.Platform-architecture.md
│   ├── database.md
│   └── development.md
├── src/
│   ├── Nexa.Domain/
│   │   ├── Nexa.Domain.csproj
│   │   ├── Common/Entity.cs
│   │   ├── Common/DomainException.cs
│   │   ├── Accounts/Profile.cs
│   │   ├── Articles/Article.cs
│   │   ├── Articles/ArticleStatus.cs
│   │   ├── Articles/ArticleTag.cs
│   │   ├── Taxonomy/Category.cs
│   │   ├── Taxonomy/Tag.cs
│   │   ├── Comments/Comment.cs
│   │   ├── Engagement/Like.cs
│   │   ├── Engagement/Bookmark.cs
│   │   └── Engagement/Follow.cs
│   ├── Nexa.Application/
│   │   ├── Nexa.Application.csproj
│   │   ├── DependencyInjection.cs
│   │   ├── Common/Result.cs
│   │   ├── Common/Error.cs
│   │   ├── Common/PagedResult.cs
│   │   ├── Abstractions/Identity/IIdentityService.cs
│   │   ├── Abstractions/Identity/ICurrentUser.cs
│   │   ├── Abstractions/Persistence/IUnitOfWork.cs
│   │   ├── Abstractions/Persistence/IArticleRepository.cs
│   │   ├── Abstractions/Persistence/IArticleQueries.cs
│   │   ├── Abstractions/Persistence/IProfileRepository.cs
│   │   └── Features/
│   │       ├── Accounts/Register/{RegisterRequest,RegisterHandler}.cs
│   │       ├── Accounts/{Login,Logout,GetMe,UpdateProfile}/
│   │       ├── Articles/CreateArticle/{CreateArticleRequest,CreateArticleHandler}.cs
│   │       ├── Articles/{GetArticle,ListArticles,UpdateArticle,PublishArticle,ArchiveArticle}/
│   │       ├── Taxonomy/{Categories,Tags}/
│   │       ├── Comments/{CreateComment,ListComments,UpdateComment,DeleteComment}/
│   │       └── Engagement/{Likes,Bookmarks,Follows}/
│   ├── Nexa.Identity/
│   │   ├── Nexa.Identity.csproj
│   │   ├── DependencyInjection.cs
│   │   ├── Entities/User.cs
│   │   ├── Entities/Role.cs
│   │   ├── Services/IdentityService.cs
│   │   └── Authorization/RoleNames.cs
│   ├── Nexa.Infrastructure/
│   │   ├── Nexa.Infrastructure.csproj
│   │   ├── DependencyInjection.cs
│   │   ├── Persistence/NexaDbContext.cs
│   │   ├── Persistence/NexaDbContextFactory.cs
│   │   ├── Persistence/UnitOfWork.cs
│   │   ├── Persistence/Configurations/
│   │   │   ├── Identity/{User,Role}Configuration.cs
│   │   │   ├── Accounts/ProfileConfiguration.cs
│   │   │   ├── Articles/{Article,ArticleTag}Configuration.cs
│   │   │   ├── Taxonomy/{Category,Tag}Configuration.cs
│   │   │   ├── Comments/CommentConfiguration.cs
│   │   │   └── Engagement/{Like,Bookmark,Follow}Configuration.cs
│   │   ├── Persistence/Repositories/
│   │   ├── Persistence/Queries/
│   │   ├── Persistence/Migrations/
│   │   └── Persistence/Seeding/RoleSeeder.cs
│   └── Nexa.Api/
│       ├── Nexa.Api.csproj
│       ├── Program.cs
│       ├── appsettings.json
│       ├── appsettings.Development.json
│       ├── Nexa.Api.http
│       ├── Endpoints/{Auth,Profile,Article,Category,Tag,Comment,Engagement}Endpoints.cs
│       ├── Security/CurrentUser.cs
│       ├── Security/AuthorizationPolicies.cs
│       └── Errors/GlobalExceptionHandler.cs
└── tests/
    ├── Nexa.Domain.Tests/
    ├── Nexa.Application.Tests/
    ├── Nexa.IntegrationTests/
    └── Nexa.ArchitectureTests/
```

Ký hiệu `{A,B}.cs` biểu thị các file A.cs và B.cs, không phải tên file thực. Các project test đều có csproj riêng. Chưa khởi tạo Git repository hoặc tạo commit/branch trong bước thiết kế.

## 4. Entity và quan hệ dữ liệu

Chọn **User và Role thuộc Nexa.Identity**, kế thừa IdentityUser<Guid> và IdentityRole<Guid>. Domain giữ Profile và các nghiệp vụ cộng đồng; các entity lưu UserId dạng Guid, không có navigation đến lớp Identity. Infrastructure cấu hình khóa ngoại sang User. Thiết kế này tránh hai bảng User trùng vai trò và giữ Domain độc lập framework.

| Entity | Vị trí / bảng | Thuộc tính chính và quan hệ |
| --- | --- | --- |
| User | Identity / identity.users | Id, UserName, NormalizedUserName, Email, NormalizedEmail và trường bảo mật chuẩn Identity; CreatedAtUtc |
| Role | Identity / identity.roles | Id, Name, NormalizedName; vai trò Member, Moderator, Admin |
| Profile | Domain / community.profiles | UserId vừa là PK vừa FK đến User; DisplayName, Bio, AvatarUrl, WebsiteUrl, UpdatedAtUtc |
| Article | Domain / content.articles | Id, AuthorId → User, CategoryId nullable → Category; Title, Slug, Summary, BodyMarkdown, Status, CreatedAtUtc, UpdatedAtUtc, PublishedAtUtc nullable, Version |
| Category | Domain / content.categories | Id, Name, Slug, Description; danh mục phẳng giai đoạn đầu |
| Tag | Domain / content.tags | Id, Name, NormalizedName, Slug |
| ArticleTag | Domain / content.article_tags | PK ghép (ArticleId, TagId); nối Article–Tag nhiều-nhiều |
| Comment | Domain / content.comments | Id, ArticleId, AuthorId → User, Body, CreatedAtUtc, UpdatedAtUtc, DeletedAtUtc nullable, Version; bình luận phẳng |
| Like | Domain / social.likes | PK ghép (UserId, ArticleId), CreatedAtUtc; chỉ thích bài viết |
| Bookmark | Domain / social.bookmarks | PK ghép (UserId, ArticleId), CreatedAtUtc; danh sách riêng của người dùng |
| Follow | Domain / social.follows | PK ghép (FollowerId, FolloweeId), CreatedAtUtc; cả hai FK đến User |

Identity sinh thêm user_roles, user_claims, role_claims, user_logins, user_tokens theo mô hình chuẩn. Bảng user_roles là quan hệ User–Role, không cần một hệ phân quyền song song.

Quy ước cần triển khai:

- ID đơn dùng Guid UUIDv7 tạo ở ứng dụng; Profile và bảng nối dùng khóa nêu trên. Ngày giờ dùng UTC, lưu timestamptz; text dài dùng text, các trường ngắn có giới hạn rõ.
- UserName được chuẩn hóa, duy nhất và chưa cho đổi trong MVP. Email bắt buộc, unique trên NormalizedEmail ở database, ngoài kiểm tra của Identity. API public không trả email hay dữ liệu xác thực.
- Slug lowercase duy nhất trong mỗi loại Article/Category/Tag; NormalizedName của Tag cũng duy nhất. Slug bài đã xuất bản giữ nguyên để ổn định URL. Xử lý tranh chấp bằng unique constraint và lỗi 409 có ý nghĩa.
- Profile tạo cùng User và role Member trong một transaction. IUnitOfWork của Infrastructure bao trùm thao tác Identity và Profile; mọi Identity EF store dùng cùng scoped NexaDbContext. Lỗi ở bất kỳ bước nào rollback toàn bộ, không để tài khoản thiếu profile.
- Article có Draft → Published → Archived. Chỉ xuất bản khi đủ title, slug và nội dung; chỉ tác giả được chỉnh sửa/xuất bản. Moderator/Admin được archive nội dung. Bản Archived không xuất hiện public; MVP không có lịch xuất bản hoặc version history.
- API public chỉ đọc Published. Đọc draft/archived dùng endpoint riêng của tác giả. Like, Bookmark và Comment chỉ tạo trên bài Published; truy vấn bookmark cũng lọc nội dung đã bị ẩn.
- Like, Bookmark, Follow có khóa ghép chống trùng cả khi request chạy đồng thời. PUT tạo quan hệ và DELETE bỏ quan hệ là idempotent; follow bản thân bị chặn bằng domain rule và CHECK constraint.
- Article và Comment dùng optimistic concurrency: Version do ứng dụng cập nhật và EF kiểm tra. Request sửa phải gửi version; xung đột trả 409, tránh ghi đè âm thầm.
- Comment xóa mềm và luôn lọc bản đã xóa khi đọc public. Article dùng trạng thái Archived. User chưa có API xóa ở giai đoạn này; FK đến User dùng Restrict để tránh xóa dây chuyền nội dung.
- Category/Tag đang được sử dụng không được xóa; trả 409. Bảng nối và tương tác có thể cascade theo Article khi thực hiện purge trong tương lai; purge chưa có endpoint.
- Index phục vụ feed Published: (Status, PublishedAtUtc, Id); bài của tác giả: (AuthorId, CreatedAtUtc, Id); bình luận: (ArticleId, CreatedAtUtc, Id). Bổ sung index phía ArticleId của Like/Bookmark và FolloweeId của Follow để đọc chiều ngược.
- Chưa lưu bộ đếm LikeCount/CommentCount như nguồn dữ liệu độc lập; truy vấn tổng hợp trước, tối ưu theo đo đạc sau.

## 5. Đăng nhập và phân quyền

Đề xuất mặc định: ASP.NET Core Identity với cookie HttpOnly, Secure, SameSite=Lax cho website first-party. Microsoft khuyến nghị cookie cho ứng dụng trình duyệt. [Tài liệu Identity](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity-api-authorization?view=aspnetcore-10.0).

API đăng ký/đăng nhập riêng gọi UserManager và SignInManager qua adapter Nexa.Identity; không tự viết thuật toán hash mật khẩu. Cookie chứa phiên đăng nhập, frontend không lưu token trong localStorage. Phiên bản này chưa cần JWT hoặc refresh token. Nếu phát sinh mobile/public API, xem xét OIDC/OAuth như một quyết định riêng.

- GET /api/v1/auth/csrf cấp request token; mọi POST/PUT/PATCH/DELETE của luồng cookie phải xác thực antiforgery header, kể cả login, register và logout.
- Chạy local HTTPS; chỉ bật CORS cho origin cấu hình cụ thể khi frontend khác origin. Khi triển khai web, ưu tiên một origin qua reverse proxy.
- Bật Identity lockout và rate limit đăng nhập/đăng ký. API trả 401/403 bằng JSON, không redirect sang trang login.
- Member thao tác nội dung của mình; Moderator ẩn bài và xóa bình luận vi phạm; Admin quản lý Category/Tag. Không nhận AuthorId/UserId/Role từ client cho thao tác tự phục vụ.
- Seed ba role idempotent bằng RoleManager. Tài khoản đầu tiên không tự trở thành Admin; bootstrap admin bằng lệnh quản trị với thông tin từ cấu hình bí mật.
- Đọc tài nguyên riêng tư vẫn kiểm tra quyền trong use case/query, kể cả khi endpoint đã RequireAuthorization. Người không có quyền đọc bài riêng nhận 404 để không lộ sự tồn tại.
- Giai đoạn skeleton chỉ chạy local/dev với tài khoản thử nghiệm. Trước public launch bổ sung email confirmation, password reset và nơi lưu Data Protection keys bền vững; không giả báo đã gửi email khi chưa có provider.

## 6. Hợp đồng API nền tảng

Prefix: /api/v1. Trả DTO, không trả entity EF/Identity. Request validation ở ranh giới API và use case; Domain bảo vệ invariant. Lỗi dùng ProblemDetails, có traceId; 400 cho input sai, 401 chưa đăng nhập, 403 không đủ quyền, 404 không tìm thấy/không được đọc, 409 xung đột và 429 vượt hạn mức.

| Nhóm | Endpoint dự kiến | Quyền / hành vi |
| --- | --- | --- |
| Health | GET /health/live, GET /health/ready | Live kiểm tra tiến trình; ready kiểm tra PostgreSQL, không lộ connection string |
| API docs | GET /openapi/v1.json | Bật trong Development |
| Auth | GET /auth/csrf; POST /auth/register, /auth/login, /auth/logout | Anonymous cho csrf/register/login; logout cần phiên; CSRF trên thao tác ghi |
| Tài khoản | GET /me; PUT /me/profile | Đăng nhập; chỉ hồ sơ của mình |
| Hồ sơ public | GET /users/{userName} | Public profile và thông tin tác giả được cho phép |
| Bài public | GET /articles; GET /articles/{slug} | Chỉ Published; lọc category, tag, author; phân trang |
| Bài của tôi | GET /me/articles; GET /me/articles/{id:guid} | Tác giả đọc các trạng thái bài của mình |
| Soạn bài | POST /articles; PUT /articles/{id:guid}; POST /articles/{id:guid}/publish | Tác giả; create trả 201 và Location trỏ tới /me/articles/{id} vì bài mới là Draft |
| Ẩn bài | POST /articles/{id:guid}/archive | Tác giả, Moderator hoặc Admin; kiểm tra version |
| Category/Tag | GET /categories, /tags; POST /categories, /tags; PUT/DELETE /categories/{id:guid}, /tags/{id:guid} | Đọc public; ghi Admin; chặn xóa khi đang dùng |
| Comment | GET/POST /articles/{id:guid}/comments; PUT/DELETE /comments/{id:guid} | Đọc public trên Published; tạo khi đăng nhập; sửa của mình; xóa của mình hoặc Moderator/Admin |
| Like | PUT/DELETE /articles/{id:guid}/like | Đăng nhập; idempotent |
| Bookmark | PUT/DELETE /articles/{id:guid}/bookmark; GET /me/bookmarks | Đăng nhập; bookmark riêng tư |
| Follow | PUT/DELETE /users/{id:guid}/follow | Đăng nhập; idempotent; không tự follow |

Các route trong bảng trừ Health và API docs đều có prefix /api/v1. PUT trả 204 hoặc DTO theo hợp đồng từng endpoint; DELETE idempotent trả 204 khi quan hệ đã vắng mặt. Nếu đối tượng đích không tồn tại hoặc không được đọc thì trả 404. List dùng page/pageSize, mặc định 20, tối đa 100; luôn có thứ tự ổn định kèm Id làm khóa phụ. Chưa triển khai tìm kiếm toàn văn trong giai đoạn 1.

Nội dung bài lưu Markdown nguyên bản, bình luận lưu plain text. API không render HTML; khi làm Nexa.Web sẽ encode/sanitize nội dung hiển thị và vô hiệu hóa raw HTML không an toàn. Chưa xây upload ảnh/tài liệu.

## 7. EF Core và migration

Một NexaDbContext trong Infrastructure kế thừa IdentityDbContext<User, Role, Guid>, chứa cả identity và domain mappings. Gọi base.OnModelCreating trước rồi áp dụng Fluent API configurations. Mọi bảng và cột đặt snake_case qua mapping; schema chia identity, community, content, social; một migration history duy nhất do Infrastructure sở hữu.

Migrations nằm tại src/Nexa.Infrastructure/Persistence/Migrations. NexaDbContextFactory dùng cấu hình PostgreSQL/mapping giống runtime, đọc ConnectionStrings__NexaDb từ môi trường; không hard-code mật khẩu hoặc âm thầm chọn connection string mặc định.

Database phát triển dự kiến tên nexa_dev; integration test dùng database/container riêng. Compose khởi động PostgreSQL với volume bền vững và healthcheck; .env.example chỉ chứa giá trị mẫu. Bí mật thực nằm trong user-secrets hoặc môi trường, không đưa vào source control. Kiểm tra quy ước volume của image PostgreSQL 18 trước khi viết compose.

Sau khi duyệt và hoàn thành mapping, thực hiện theo thứ tự:

1. Restore local dotnet-ef tool cùng major 10 và build solution.
2. Generate migration InitialCreate bằng Infrastructure làm target, Api làm startup.
3. Đọc migration để rà khóa ngoại, unique/index, CHECK và delete behavior.
4. Áp migration lên PostgreSQL phát triển mới hoặc database test cô lập đã xác nhận; chạy seed role riêng sau đó.
5. Sinh idempotent SQL script để review/deploy, chạy integration tests và kiểm tra không còn model change chưa có migration.

Không dùng EnsureCreated cùng migrations. Không tự migrate database ở mỗi lần API production khởi động. Tạo migration không đồng nghĩa đã áp migration; báo riêng kết quả generate, apply và kiểm thử. Nếu Docker Engine chưa chạy, cần PostgreSQL local hoặc kết nối đến database phát triển được chỉ định.

## 8. Thứ tự triển khai sau khi xác nhận

| Bước | Nội dung | Điều kiện hoàn thành |
| --- | --- | --- |
| 1 | Solution, 5 project chính, 4 project test, tham chiếu, cấu hình chung | Restore/build thành công, architecture test kiểm tra đúng chiều phụ thuộc |
| 2 | Domain entity, User/Role và quy tắc nghiệp vụ | Unit tests cho xuất bản, follow bản thân, trạng thái và validation |
| 3 | NexaDbContext, Fluent mappings, PostgreSQL compose, migration InitialCreate | Migration áp được lên PostgreSQL sạch; khóa/index/constraint có integration tests |
| 4 | Register/login/logout, profile, role seed, auth/CSRF | Đăng ký atomic; test trùng email, rollback, 401/403, CSRF và bảo vệ profile |
| 5 | Article, Category, Tag, Comment, Like, Bookmark, Follow endpoints | Luồng đăng ký → soạn → xuất bản → người khác đọc/tương tác hoạt động; draft không rò rỉ |
| 6 | Health, OpenAPI, .http requests, README và hướng dẫn migration | Một người khác có thể chạy từ hướng dẫn; build và các test liên quan đều đạt |

Tests dùng xUnit; integration tests dùng WebApplicationFactory với PostgreSQL thật, ưu tiên Testcontainers khi Docker Engine sẵn sàng. Không dùng EF InMemory để khẳng định hành vi riêng PostgreSQL. Test quan trọng gồm unique constraint dưới concurrent request, đăng ký rollback khi tạo Profile thất bại, quyền tác giả/Moderator/Admin, CSRF, draft visibility, bookmark privacy, idempotency, concurrency version và migration trên database trống.

## 9. Các quyết định cần duyệt

1. Triển khai trực tiếp tại W:\Nexa, theo cấu trúc 5 project backend và các project test ở trên.
2. User/Role thuộc Nexa.Identity; Profile và các entity nghiệp vụ thuộc Nexa.Domain; một DbContext và một PostgreSQL database.
3. Xác thực cookie cho website first-party ở giai đoạn đầu; Web chưa tạo, sẽ chọn cách render có SEO ở bước giao diện.
4. Phạm vi nội dung ban đầu: danh mục phẳng, bình luận phẳng, Like/Bookmark cho bài viết và Follow người dùng.

Người dùng đã xác nhận triển khai. Solution, entity, Identity, PostgreSQL mappings, migration, API và các project test hiện đã có trong W:\Nexa. Nexa.Web vẫn dành cho giai đoạn giao diện.

## 10. Ghi nhận triển khai

- Package Microsoft/EF Core 10.0.12, Npgsql EF provider 10.0.3, PostgreSQL image 18.6-alpine; phiên bản cụ thể nằm trong Directory.Packages.props và compose.yaml.
- Các DTO và handler nhỏ được nhóm theo tính năng, ví dụ AccountContracts.cs, ArticleContracts.cs và TaxonomyHandler.cs; chiều phụ thuộc giữ nguyên.
- RoleNames ở Identity chỉ được lớp ngoài dùng. Application nhận quyền qua ICurrentUser.IsAdmin/CanModerate nên không tham chiếu ngược Identity.
- Version của Article/Comment là Guid mới sau mỗi mutation, cấu hình EF concurrency token.
- Cấu hình, lệnh chạy và hợp đồng API thực tế nằm trong README.md, docs/development.md, docs/database.md và docs/api.md.
- scripts/Initialize-Development.ps1 tạo cấu hình bí mật local, khởi động PostgreSQL, áp migration và seed role. Integration tests dùng container riêng, không sửa nexa_dev.
