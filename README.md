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
.
├── src/                    # Source code
│   ├── controllers/        # Xử lý request từ client
│   │   ├── interview.ts    # Xử lý logic phỏng vấn
│   │   ├── job.ts          # Xử lý logic JD
│   │   └── candidate.ts    # Xử lý logic CV
│   ├── models/             # Định nghĩa data models
│   │   ├── interview.ts    # Model phỏng vấn
│   │   ├── job.ts          # Model JD
│   │   └── candidate.ts    # Model CV
│   ├── routes/             # Định nghĩa API routes
│   │   ├── interview.ts    # Routes phỏng vấn
│   │   ├── job.ts          # Routes JD
│   │   └── candidate.ts    # Routes CV
│   ├── services/           # Business logic
│   │   ├── openai.ts       # Xử lý OpenAI API
│   │   ├── pdf.ts          # Xử lý tạo PDF
│   │   └── audio.ts        # Xử lý tạo audio
│   ├── utils/              # Utility functions
│   ├── constants/          # Các hằng số
│   ├── enums/              # Định nghĩa enums
│   ├── interfaces/         # Định nghĩa interfaces
│   └── index.ts            # Entry point
├── public/                 # Static files
│   ├── css/               # CSS files
│   ├── js/                # JavaScript files
│   ├── styles/            # SCSS/SASS files
│   ├── fonts/             # Font files
│   ├── files/             # Other static files
│   └── index.html         # Main HTML file
├── db/                     # Database files
├── dist/                   # Compiled files
├── temp/                   # Temporary files
├── node_modules/           # Dependencies
├── .env.example            # Environment variables example
├── .eslintrc.json         # ESLint configuration
├── .prettierrc            # Prettier configuration
├── .editorconfig          # Editor configuration
├── .gitignore             # Git ignore rules
├── .nvmrc                 # Node version
├── package.json           # Project configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # Project documentation
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

## Hướng dẫn sử dụng

### 1. Tạo JD (Job Description)

1. Truy cập trang chủ và chọn "Tạo JD mới"
2. Nhập thông tin vị trí tuyển dụng:
   - Tên vị trí
   - Mô tả công việc
   - Yêu cầu kỹ năng
   - Mức lương
   - Địa điểm làm việc
3. Nhấn "Tạo JD" để hệ thống tự động tạo JD dựa trên thông tin đã nhập
4. Xem và chỉnh sửa JD nếu cần
5. Lưu JD và tải file PDF

### 2. Tạo CV

1. Truy cập trang chủ và chọn "Tạo CV mới"
2. Nhập thông tin ứng viên:
   - Thông tin cá nhân
   - Kinh nghiệm làm việc
   - Kỹ năng
   - Học vấn
   - Mục tiêu nghề nghiệp
3. Nhấn "Tạo CV" để hệ thống tự động tạo CV dựa trên thông tin đã nhập
4. Xem và chỉnh sửa CV nếu cần
5. Lưu CV và tải file PDF

### 3. Tạo cuộc phỏng vấn

1. Truy cập trang chủ và chọn "Tạo phỏng vấn mới"
2. Chọn JD và CV đã tạo trước đó
3. Cấu hình cuộc phỏng vấn:
   - Thời lượng phỏng vấn
   - Mức độ khó
   - Số lượng câu hỏi
   - Giọng nói (nam/nữ)
4. Nhấn "Tạo phỏng vấn" để hệ thống tự động tạo kịch bản phỏng vấn
5. Xem và chỉnh sửa kịch bản nếu cần
6. Tạo audio cho cuộc phỏng vấn
7. Lưu và tải file PDF và audio

### 4. Quản lý phỏng vấn

1. Truy cập trang "Danh sách phỏng vấn"
2. Sử dụng các bộ lọc để tìm kiếm:
   - Theo ngày
   - Theo vị trí
   - Theo ứng viên
   - Theo mức độ khó
3. Xem chi tiết phỏng vấn:
   - Kịch bản phỏng vấn
   - Audio
   - JD và CV liên quan
4. Tải lại file PDF và audio nếu cần

### 5. Lưu ý khi sử dụng

1. **API Key**
   - Đảm bảo đã cập nhật OPENAI_API_KEY trong file .env
   - API Key phải có đủ quota để sử dụng

2. **Tài nguyên hệ thống**
   - Đảm bảo có đủ dung lượng ổ đĩa để lưu trữ file audio
   - Kết nối internet ổn định để gọi API

3. **Bảo mật**
   - Không chia sẻ file .env chứa API Key
   - Xóa file tạm thời sau khi sử dụng

4. **Xử lý lỗi**
   - Nếu gặp lỗi khi tạo audio, thử lại sau ít phút
   - Kiểm tra log để xác định nguyên nhân lỗi
   - Liên hệ admin nếu cần hỗ trợ

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
