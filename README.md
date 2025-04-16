# Interview Simulation Audio Generator

Một ứng dụng Node.js sử dụng OpenAI API để tạo audio từ cuộc phỏng vấn được viết dưới dạng markdown.

## Tính năng

- Đọc và phân tích file markdown chứa nội dung cuộc phỏng vấn
- Tạo audio cho từng phần hội thoại sử dụng OpenAI Text-to-Speech API
- Sử dụng giọng nói khác nhau cho người phỏng vấn và ứng viên
- Tự động ghép các file audio thành một file hoàn chỉnh
- Hỗ trợ TypeScript với cấu trúc code rõ ràng
- Tích hợp ESLint và Prettier để đảm bảo code chất lượng

## Yêu cầu hệ thống

- Node.js >= 16.x
- npm >= 7.x
- FFmpeg (đã được cài đặt sẵn trong project)

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

3. Tạo file `.env` từ `.env.example` và thêm API key của OpenAI:
```bash
cp .env.example .env
# Mở file .env và thêm OPENAI_API_KEY của bạn
```

## Sử dụng

1. Chuẩn bị file markdown:
- Tạo file `conversation.md` trong thư mục gốc
- Viết nội dung phỏng vấn theo định dạng:
```markdown
**Người phỏng vấn:** [Nội dung câu hỏi]

**Ứng viên:** [Nội dung trả lời]
```

2. Chạy ứng dụng:
```bash
# Chế độ development (tự động reload khi code thay đổi)
npm run dev

# Chế độ production
npm start
```

3. Kết quả:
- Audio sẽ được tạo trong thư mục `output/`
- File cuối cùng sẽ có tên `final_conversation.mp3`

## Cấu trúc thư mục

```
src/
  ├── interfaces/    # Định nghĩa interfaces
  ├── enums/         # Định nghĩa enums
  ├── constants/     # Các hằng số
  ├── services/      # Các service xử lý logic
  ├── utils/         # Các utility functions
  └── index.ts       # File chính
```

## Scripts

- `npm start`: Chạy ứng dụng
- `npm run dev`: Chạy ứng dụng ở chế độ development
- `npm run build`: Build TypeScript sang JavaScript
- `npm run lint`: Kiểm tra lỗi code
- `npm run lint:fix`: Tự động sửa lỗi code
- `npm run format`: Format code theo chuẩn Prettier
- `npm run check`: Kiểm tra cả lint và format

## Thông tin tác giả

- **Tên:** Mạc Văn Tân
- **Email:** macvantan@gmail.com
- **Telegram:** tanmac
- **Skype:** trai_12a1

## Giấy phép

ISC 
