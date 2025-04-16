# Mô phỏng phỏng vấn với OpenAI

Ứng dụng mô phỏng cuộc phỏng vấn sử dụng OpenAI API để tạo JD, CV, cuộc hội thoại và audio.

## Tính năng

- Tạo JD dựa trên thông tin vị trí tuyển dụng
- Tạo CV dựa trên thông tin ứng viên
- Tạo cuộc hội thoại phỏng vấn tự nhiên
- Tạo audio cho cuộc hội thoại với giọng nam/nữ
- Lưu trữ thông tin vào SQLite database
- Xuất PDF cho CV và JD
- Giao diện web thân thiện với người dùng

## Yêu cầu

- Node.js >= 16
- npm hoặc yarn
- OpenAI API Key

## Cài đặt

1. Clone repository:
```bash
git clone https://github.com/your-username/interview-simulation.git
cd interview-simulation
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file .env từ .env.example:
```bash
cp .env.example .env
```

4. Cập nhật OPENAI_API_KEY trong file .env

## Chạy ứng dụng

1. Chạy ở chế độ development:
```bash
npm run dev
```

2. Chạy ở chế độ production:
```bash
npm run build
npm start
```

3. Truy cập ứng dụng tại: http://localhost:3000

## Cấu trúc dự án

```
src/
  ├── controllers/     # Xử lý request từ client
  ├── models/          # Định nghĩa data models
  ├── routes/          # Định nghĩa API routes
  ├── services/        # Business logic
  └── index.ts         # Entry point
public/
  ├── css/            # CSS files
  ├── js/             # JavaScript files
  ├── audio/          # Audio files
  └── index.html      # Main HTML file
```

## API Endpoints

- POST /api/interviews - Tạo mô phỏng phỏng vấn mới
- GET /api/interviews - Lấy danh sách mô phỏng (có filter)
- GET /api/interviews/:id - Lấy chi tiết mô phỏng
- GET /api/interviews/:id/pdf - Tải PDF của mô phỏng
- GET /api/interviews/:id/audio - Tải audio của mô phỏng

## License

MIT 
