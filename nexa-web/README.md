This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Nexa API must also be running at `https://localhost:7210`. In local development, open the web app as `http://localhost:3000` on the same computer as the API. The default `NEXT_PUBLIC_API_URL` points to `localhost`, so opening the web app via a LAN address from another device will send API requests to that device instead. Cross-site cookie restrictions can also prevent the session from persisting when using a LAN address. Use a same-site HTTPS setup before enabling remote/LAN admin access.

After signing in, the web app verifies `GET /api/v1/me` before showing success. Accounts with the `Admin` role go to `/admin`; `Moderator` accounts go to `/admin/article-reviews`. A successful password check alone does not confirm that the browser retained the session.

## Bài viết dạng sổ tay

Trang tạo và sửa bài cho thêm, xóa và đổi thứ tự các khối văn bản Markdown, mã nguồn và hình ảnh. Ảnh có thể tải lên API hoặc chèn bằng URL. Nội dung vẫn được lưu trong trường `bodyMarkdown` hiện có; bài cũ tiếp tục hiển thị mà không cần migration. Khối mã chỉ để đọc và sao chép, không thực thi trên website. Định dạng này lấy cảm hứng từ notebook, chưa hỗ trợ nhập/xuất tệp `.ipynb`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
