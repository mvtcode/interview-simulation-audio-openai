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

- Node.js >= 18
- npm hoặc yarn
- OpenAI API Key

## Cài đặt

1. Clone repository:
```bash
git clone git@github.com:mvtcode/interview-simulation-audio-openai.git
cd interview-simulation-audio-openai
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
  │   ├── interview.ts # Xử lý logic phỏng vấn
  │   ├── job.ts       # Xử lý logic JD
  │   └── candidate.ts # Xử lý logic CV
  ├── models/          # Định nghĩa data models
  │   ├── interview.ts # Model phỏng vấn
  │   ├── job.ts       # Model JD
  │   └── candidate.ts # Model CV
  ├── routes/          # Định nghĩa API routes
  │   ├── interview.ts # Routes phỏng vấn
  │   ├── job.ts       # Routes JD
  │   └── candidate.ts # Routes CV
  ├── services/        # Business logic
  │   ├── openai.ts    # Xử lý OpenAI API
  │   ├── pdf.ts       # Xử lý tạo PDF
  │   └── audio.ts     # Xử lý tạo audio
  ├── utils/           # Utility functions
  ├── config/          # Configuration files
  ├── types/           # TypeScript type definitions
  └── index.ts         # Entry point
public/
  ├── css/            # CSS files
  ├── js/             # JavaScript files
  ├── audio/          # Audio files
  └── index.html      # Main HTML file
```

## Flow của ứng dụng

1. **Tạo JD**
   - Người dùng nhập thông tin vị trí tuyển dụng
   - Hệ thống gọi OpenAI API để tạo JD
   - Lưu JD vào database
   - Xuất PDF JD

2. **Tạo CV**
   - Người dùng nhập thông tin ứng viên
   - Hệ thống gọi OpenAI API để tạo CV
   - Lưu CV vào database
   - Xuất PDF CV

3. **Tạo cuộc phỏng vấn**
   - Người dùng chọn JD và CV
   - Hệ thống gọi OpenAI API để tạo kịch bản phỏng vấn
   - Tạo audio cho cuộc hội thoại
   - Lưu thông tin phỏng vấn vào database

4. **Quản lý phỏng vấn**
   - Xem danh sách phỏng vấn
   - Xem chi tiết phỏng vấn
   - Tải PDF và audio
   - Lọc và tìm kiếm phỏng vấn

## API Endpoints

### JD
- POST /api/jobs - Tạo JD mới
- GET /api/jobs - Lấy danh sách JD
- GET /api/jobs/:id - Lấy chi tiết JD
- GET /api/jobs/:id/pdf - Tải PDF JD

### CV
- POST /api/candidates - Tạo CV mới
- GET /api/candidates - Lấy danh sách CV
- GET /api/candidates/:id - Lấy chi tiết CV
- GET /api/candidates/:id/pdf - Tải PDF CV

### Phỏng vấn
- POST /api/interviews - Tạo mô phỏng phỏng vấn mới
- GET /api/interviews - Lấy danh sách mô phỏng
- GET /api/interviews/:id - Lấy chi tiết mô phỏng
- GET /api/interviews/:id/pdf - Tải PDF của mô phỏng
- GET /api/interviews/:id/audio - Tải audio của mô phỏng

## License

MIT 

## Tác giả

- **Fullname**: Mạc Văn Tân
- **Skype**: trai_12a1
- **Telegram**: tanmac
- **Email**: macvantan@gmail.com 
