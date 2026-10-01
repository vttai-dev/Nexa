# API Nexa v1

Base URL local: https://localhost:7210/api/v1. OpenAPI JSON ở /openapi/v1.json trong Development. Cookie first-party, chưa có JWT, refresh token, OAuth GitHub hoặc luồng xác minh email/số điện thoại.

## Luồng cookie và CSRF

1. GET /auth/csrf. Client phải giữ cookie __Host-Nexa.Csrf và đọc requestToken.
2. POST /auth/register với userName, email, password, displayName; gửi header X-CSRF-TOKEN.
3. POST /auth/login với email, password; tiếp tục gửi CSRF và cookie cũ. Đăng nhập trả 204 và Set-Cookie phiên.
4. GET /auth/csrf một lần nữa sau đăng nhập vì token gắn với danh tính hiện tại.
5. Mọi POST/PUT/PATCH/DELETE gửi cookie phiên + cookie CSRF + header X-CSRF-TOKEN mới.
6. POST /auth/logout rồi lấy lại token anonymous nếu cần đăng nhập tài khoản khác.

Ví dụ dùng PowerShell với certificate localhost đã được tin cậy:

```powershell
$base = "https://localhost:7210/api/v1"
$csrf = Invoke-RestMethod "$base/auth/csrf" -SessionVariable nexaSession
$headers = @{ "X-CSRF-TOKEN" = $csrf.requestToken }
$body = @{ email = "your-email@example.test"; password = "<mat-khau-cua-ban>" } | ConvertTo-Json
Invoke-RestMethod "$base/auth/login" -Method Post -WebSession $nexaSession -Headers $headers -ContentType "application/json" -Body $body
$csrf = Invoke-RestMethod "$base/auth/csrf" -WebSession $nexaSession
$headers["X-CSRF-TOKEN"] = $csrf.requestToken
Invoke-RestMethod "$base/me" -WebSession $nexaSession
```

Không tự đặt UserId/AuthorId khi ghi nội dung; server lấy từ phiên. Profile public không có email. Username dài 3–30 ký tự ASCII chữ/số/gạch dưới, email là unique không phân biệt hoa thường, mật khẩu ít nhất 12 ký tự và thỏa chính sách Identity.

## Endpoint

| Method | Path | Quyền / response |
| --- | --- | --- |
| GET | /auth/csrf | Public; token + cookie |
| POST | /auth/register | Public + CSRF; 201 userId |
| POST | /auth/login | Public + CSRF; 204 |
| POST | /auth/logout | Đăng nhập + CSRF; 204 |
| GET | /me | Account + Profile của phiên |
| PUT | /me/profile | displayName, bio, avatarUrl, websiteUrl; 204 |
| GET | /users/{userName} | Public profile |
| GET | /search | Public; query, page, pageSize; tìm bài viết/user/tag |
| GET | /search/articles | Public; tìm bài published theo title/summary/body |
| GET | /search/users | Public; tìm user theo username/displayName/bio |
| GET | /search/tags | Public; tìm tag theo name/slug |
| GET | /articles | Public; page, pageSize, categoryId, tagId, authorId |
| GET | /articles/{slug} | Chỉ Published |
| GET | /articles/{slug}/metadata | Chỉ Published; view/like/comment/bookmark/word/read-time |
| POST | /articles/{slug}/views | Public + CSRF; ghi nhận một lượt xem; 204 |
| GET | /me/articles | Bài của mình, tất cả trạng thái |
| GET | /me/articles/{id} | Chi tiết bài của mình |
| GET | /me/articles/{id}/revisions | Đăng nhập; lịch sử snapshot bài viết của mình |
| GET | /me/articles/{id}/revisions/{revisionId} | Đăng nhập; chi tiết một revision |
| POST | /articles | title, slug, summary, bodyMarkdown, categoryId, tagIds; 201 id/slug/version + Location |
| PUT | /articles/{id} | version và article chứa các trường soạn bài; 204 |
| POST | /articles/{id}/publish | version; tác giả; 204 |
| POST | /articles/{id}/archive | version; tác giả hoặc Moderator/Admin; 204 |
| GET | /categories, /tags | Public, có phân trang |
| GET | /tags/popular | Public; tag phổ biến theo số bài published |
| GET | /tags/{id}/stats | Public; thống kê tag |
| POST | /categories, /tags | Admin; category gồm name/slug/description, tag gồm name/slug; 201 id |
| PUT, DELETE | /categories/{id}, /tags/{id} | Admin; xóa khi không được sử dụng; 204 |
| GET | /articles/{id}/comments | Public trên Published, phân trang |
| POST | /articles/{id}/comments | body; đăng nhập; 201 id/version |
| PUT | /comments/{id} | version, body; tác giả; 204 |
| DELETE | /comments/{id}?version={version} | Tác giả hoặc Moderator/Admin; 204 |
| PUT, DELETE | /articles/{id}/like | Idempotent; 204 |
| PUT, DELETE | /articles/{id}/bookmark | Idempotent; 204 |
| GET | /me/bookmarks | Chỉ bookmark của mình và bài còn Published |
| PUT, DELETE | /users/{id}/follow | Idempotent; chặn tự follow; 204 |
| PUT, DELETE | /tags/{id}/follow | Idempotent; theo dõi/bỏ theo dõi tag; 204 |
| GET | /me/tags/following | Danh sách tag đang theo dõi |
| GET | /notifications | Đăng nhập; unreadOnly, page, pageSize; danh sách thông báo |
| GET | /notifications/unread-count | Đăng nhập; số thông báo chưa đọc |
| POST | /notifications/{id}/read | Đăng nhập + CSRF; đánh dấu một thông báo đã đọc; 204 |
| POST | /notifications/read-all | Đăng nhập + CSRF; đánh dấu tất cả đã đọc; 204 |
| POST | /reports | Đăng nhập; báo cáo Article/Comment/User; 201 id |
| GET | /moderation/reports | Moderator/Admin; status, page, pageSize |
| PUT | /moderation/reports/{id}/decision | Moderator/Admin; Accepted/Rejected; 204 |
| GET | /admin/users | Admin; page, pageSize, search; danh sách user |
| GET | /admin/users/{id} | Admin; chi tiết user |
| PUT | /admin/users/{id}/roles | Admin; roles: Member/Moderator/Admin; 204 |
| POST | /admin/users/{id}/lock | Admin; days; khóa tài khoản; 204 |
| POST | /admin/users/{id}/unlock | Admin; mở khóa tài khoản; 204 |
| GET | /admin/audit-logs | Admin; page, pageSize, action, targetType, actorId |

Health dùng /health/live và /health/ready, không có prefix /api/v1.

List trả items, page, pageSize, totalCount. Page mặc định 1, pageSize 20, tối đa 100; page tối đa 100000. Status bài trả chuỗi Draft/Published/Archived. Slug chỉ gồm a-z, 0-9 và dấu gạch nối đơn; giữ nguyên slug sau khi xuất bản.

Sau mỗi thao tác sửa/publish/archive, đọc lại để lấy Version mới. Version cũ trả 409. Không có endpoint xóa cứng bài; archive ẩn khỏi API public. Comment flat, body là plain text; article body là Markdown chưa render.

Article Revision giai đoạn 1 tự lưu snapshot khi tạo bài, sửa bài, publish và archive. API hiện có xem danh sách/chi tiết revision của chính tác giả; chưa có compare diff hoặc restore revision.

Search giai đoạn đầu dùng truy vấn PostgreSQL qua EF để tìm nội dung published, user public và tag. Giai đoạn sau có thể nâng lên PostgreSQL full-text index hoặc OpenSearch/Elasticsearch khi dữ liệu lớn.

Notification giai đoạn đầu tự tạo khi có người khác like bài viết, comment vào bài viết hoặc follow tài khoản. Chưa có mention, reply comment, thông báo bài mới từ tag/user đang theo dõi, email hoặc push notification.

## Mã lỗi

Lỗi dạng application/problem+json, có traceId và thường có code. 400: input/CSRF/domain không hợp lệ; 401: chưa đăng nhập hoặc login không thành công; 403: thiếu quyền; 404: không có hoặc không được đọc; 409: trùng unique, đang được tham chiếu, hoặc version cũ; 429: quá nhiều lần đăng nhập/đăng ký.

Tạo article có Location trỏ tới /me/articles/{id}, vì bài mới là Draft. Các endpoint create còn lại trả ID trong body. PUT và DELETE thành công trả 204. Không có một API nâng quyền public.
