# API Design

Base URL:

```text
/api
```

Header cho các API cần đăng nhập:

```text
Authorization: Bearer <access_token>
```

---

## 1. Authentication API

### 1.1. Đăng ký

```http
POST /api/auth/register
```

Request:

```json
{
	"full_name": "Vo Hung Dung",
	"email": "dung@example.com",
	"password": "123456"
}
```

Response:

```json
{
	"message": "Register successfully",
	"access_token": "jwt_token_here",
	"token_type": "bearer",
	"user": {
		"id": "6870f8c90db5248718eb6e31",
		"full_name": "Vo Hung Dung",
		"email": "dung@example.com",
		"role": "student"
	}
}
```

### 1.2. Đăng nhập

```http
POST /api/auth/login
```

Request:

```json
{
	"email": "dung@example.com",
	"password": "123456"
}
```

Response:

```json
{
	"access_token": "jwt_token_here",
	"token_type": "bearer",
	"user": {
		"id": "6870f8c90db5248718eb6e31",
		"full_name": "Vo Hung Dung",
		"email": "dung@example.com",
		"role": "student"
	}
}
```

### 1.3. Lấy thông tin người dùng hiện tại

```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

Response:

```json
{
	"id": "6870f8c90db5248718eb6e31",
	"full_name": "Vo Hung Dung",
	"email": "dung@example.com",
	"role": "student",
	"created_at": "2026-07-13T08:00:00.000Z",
	"updated_at": "2026-07-13T08:00:00.000Z"
}
```

### 1.4. Yêu cầu đặt lại mật khẩu

API gửi liên kết đặt lại mật khẩu đến email nếu tài khoản tồn tại. Response luôn giống nhau để không tiết lộ email nào đã đăng ký trong hệ thống.

```http
POST /api/auth/forgot-password
```

Request:

```json
{
	"email": "dung@example.com"
}
```

Response:

```json
{
	"message": "If the email exists, a password reset link has been sent"
}
```

Liên kết đặt lại mật khẩu có hiệu lực trong 15 phút. Token gốc được gửi qua email; database chỉ lưu bản hash của token.

### 1.5. Đặt lại mật khẩu

```http
PATCH /api/auth/reset-password/{token}
```

Request:

```json
{
	"password": "newpassword123"
}
```

Response:

```json
{
	"message": "Password reset successfully"
}
```

Sau khi đặt lại mật khẩu thành công, reset token bị xóa và không thể sử dụng lại.

### Error response thường gặp

```json
{
	"message": "Invalid email or password"
}
```

```text
400 Bad Request
401 Unauthorized
409 Conflict
500 Internal Server Error
```

| Status | Trường hợp |
|---|---|
| `400 Bad Request` | Thiếu dữ liệu, email sai định dạng, mật khẩu quá ngắn hoặc reset token không hợp lệ/hết hạn |
| `401 Unauthorized` | Sai email/mật khẩu, thiếu access token hoặc access token không hợp lệ/hết hạn |
| `409 Conflict` | Email đăng ký đã tồn tại |
| `500 Internal Server Error` | Lỗi database, gửi email hoặc lỗi hệ thống ngoài dự kiến |

---

## 2. Course API

### 2.1. Lấy danh sách khóa học

```http
GET /api/courses
```

Response:

```json
[
	{
		"title": "AWS Basic",
		"description": "Khóa học nhập môn AWS",
		"thumbnail_url": "https://s3.amazonaws.com/..."
	}
]
```

### 2.2. Lấy chi tiết khóa học

```http
GET /api/courses/{course_id}
```

### 2.3. Tạo khóa học

Dành cho `admin`.

```http
POST /api/courses
```

Request:

```json
{
	"title": "AWS Basic",
	"description": "Khóa học nhập môn AWS",
	"thumbnail_url": "https://s3.amazonaws.com/aws-basic.png"
}
```

### 2.4. Cập nhật khóa học

```http
PUT /api/courses/{course_id}
```

Request:

```json
{
	"title": "AWS Basic Updated",
	"description": "Cập nhật nội dung khóa học AWS",
	"thumbnail_url": "https://s3.amazonaws.com/aws-basic-new.png"
}
```

### 2.5. Xóa khóa học

```http
DELETE /api/courses/{course_id}
```

Response:

```json
{
	"message": "Course deleted successfully"
}
```

### 2.6. Đăng ký học khóa học

```http
POST /api/courses/{course_id}/enroll
```

Response:

```json
{
	"message": "Enroll course successfully"
}
```

### 2.7. Xem các khóa học đã đăng ký của tôi

```http
GET /api/users/me/courses
```

Response:

```json
[
	{
		"id": 1,
		"title": "AWS Basic",
		"description": "Khóa học nhập môn AWS",
		"thumbnail_url": "https://s3.amazonaws.com/..."
	}
]
```

### 2.8. Hủy đăng ký khóa học

```http
DELETE /api/courses/{course_id}/enroll
```

Response:

```json
{
	"message": "Unenroll course successfully"
}
```

### Error response thường gặp

```json
{
	"detail": "Course not found"
}
```

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
```

---

## 3. Lesson API

### 3.1. Lấy danh sách bài học theo khóa học

```http
GET /api/courses/{course_id}/lessons
```

Response:

```json
[
	{
		"id": 1,
		"title": "Introduction to Cloud Computing",
		"video_url": "https://s3.amazonaws.com/video.mp4",
		"document_url": "https://s3.amazonaws.com/document.pdf",
		"order_index": 1
	}
]
```

### 3.2. Lấy chi tiết bài học

```http
GET /api/lessons/{lesson_id}
```

### 3.3. Tạo bài học

Dành cho `admin`.

```http
POST /api/courses/{course_id}/lessons
```

Request:

```json
{
	"title": "Introduction to Cloud Computing",
	"content": "Cloud computing is...",
	"video_url": "https://s3.amazonaws.com/video.mp4",
	"document_url": "https://s3.amazonaws.com/document.pdf",
	"order_index": 1
}
```

### 3.4. Đánh dấu đã hoàn thành bài học

```http
POST /api/lessons/{lesson_id}/complete
```

Response:

```json
{
	"message": "Lesson completed"
}
```

### 3.5. Lấy tiến độ học tập của khóa học

```http
GET /api/courses/{course_id}/progress
```

Response:

```json
{
	"course_id": 1,
	"completed_lessons": 3,
	"total_lessons": 10,
	"progress_percent": 30
}
```

### 3.6. Cập nhật bài học

```http
PUT /api/lessons/{lesson_id}
```

Request:

```json
{
	"title": "Introduction to AWS Cloud",
	"content": "Updated lesson content...",
	"video_url": "https://s3.amazonaws.com/video-new.mp4",
	"document_url": "https://s3.amazonaws.com/document-new.pdf",
	"order_index": 2
}
```

### 3.7. Xóa bài học

```http
DELETE /api/lessons/{lesson_id}
```

Response:

```json
{
	"message": "Lesson deleted successfully"
}
```

### Error response thường gặp

```json
{
	"detail": "Lesson not found"
}
```

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
```

---

## 4. Quiz API

### 4.1. Lấy danh sách quiz của khóa học

```http
GET /api/courses/{course_id}/quizzes
```

### 4.2. Tạo quiz

Dành cho `admin`.

```http
POST /api/courses/{course_id}/quizzes
```

Request:

```json
{
	"title": "AWS Quiz 1",
	"description": "Kiểm tra kiến thức cơ bản về AWS",
	"time_limit": 15
}
```

### 4.3. Thêm câu hỏi vào quiz

Dành cho `admin`.

```http
POST /api/quizzes/{quiz_id}/questions
```

Request:

```json
{
	"content": "Amazon EC2 dùng để làm gì?",
	"question_type": "single_choice",
	"point": 1,
	"answers": [
		{
			"content": "Lưu trữ object",
			"is_correct": false
		},
		{
			"content": "Tạo máy chủ ảo",
			"is_correct": true
		},
		{
			"content": "Quản lý DNS",
			"is_correct": false
		},
		{
			"content": "Theo dõi log",
			"is_correct": false
		}
	]
}
```

### 4.4. Lấy câu hỏi quiz

Khi trả về cho học viên, không trả `is_correct`.

```http
GET /api/quizzes/{quiz_id}/questions
```

Response:

```json
[
	{
		"id": 1,
		"content": "Amazon EC2 dùng để làm gì?",
		"question_type": "single_choice",
		"point": 1,
		"answers": [
			{
				"id": 1,
				"content": "Lưu trữ object"
			},
			{
				"id": 2,
				"content": "Tạo máy chủ ảo"
			}
		]
	}
]
```

### 4.5. Nộp bài quiz

```http
POST /api/quizzes/{quiz_id}/submit
```

Request:

```json
{
	"answers": [
		{
			"question_id": 1,
			"answer_id": 2
		},
		{
			"question_id": 2,
			"answer_id": 5
		}
	]
}
```

Response:

```json
{
	"attempt_id": 10,
	"score": 8,
	"total_score": 10,
	"correct_answers": 8,
	"total_questions": 10,
	"submitted_at": "2026-07-03T09:00:00"
}
```

### 4.6. Xem lịch sử làm quiz

```http
GET /api/quizzes/{quiz_id}/attempts
```

Response:

```json
[
	{
		"attempt_id": 10,
		"score": 8,
		"total_score": 10,
		"submitted_at": "2026-07-03T09:00:00"
	}
]
```

### 4.7. Cập nhật quiz

```http
PUT /api/quizzes/{quiz_id}
```

Request:

```json
{
	"title": "AWS Quiz Updated",
	"description": "Updated quiz description",
	"time_limit": 20
}
```

### 4.8. Xóa quiz

```http
DELETE /api/quizzes/{quiz_id}
```

Response:

```json
{
	"message": "Quiz deleted successfully"
}
```

### 4.9. Cập nhật câu hỏi

```http
PUT /api/questions/{question_id}
```

Request:

```json
{
	"content": "Amazon EC2 là dịch vụ gì?",
	"question_type": "single_choice",
	"point": 1,
	"answers": [
		{
			"id": 1,
			"content": "Dịch vụ máy chủ ảo",
			"is_correct": true
		},
		{
			"id": 2,
			"content": "Dịch vụ lưu trữ object",
			"is_correct": false
		}
	]
}
```

### 4.10. Xóa câu hỏi

```http
DELETE /api/questions/{question_id}
```

Response:

```json
{
	"message": "Question deleted successfully"
}
```

### 4.11. Xem chi tiết một lần làm bài

```http
GET /api/quiz-attempts/{attempt_id}
```

Response:

```json
{
	"attempt_id": 10,
	"quiz_id": 1,
	"score": 8,
	"total_score": 10,
	"submitted_at": "2026-07-03T09:00:00",
	"answers": [
		{
			"question_id": 1,
			"question_content": "Amazon EC2 dùng để làm gì?",
			"selected_answer_id": 2,
			"selected_answer": "Tạo máy chủ ảo",
			"is_correct": true
		}
	]
}
```

### Error response thường gặp

```json
{
	"detail": "Quiz not found"
}
```

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
```

---

## 5. AI API

Project có phần AI hỗ trợ học tập và OpenAI API.

### 5.1. Chat với AI

```http
POST /api/ai/chat
```

Request:

```json
{
	"course_id": 1,
	"lesson_id": 2,
	"message": "Giải thích giúp tôi EC2 là gì?"
}
```

Response:

```json
{
	"reply": "EC2 là dịch vụ máy chủ ảo của AWS..."
}
```

### 5.2. AI tóm tắt bài học

```http
POST /api/ai/summarize-lesson/{lesson_id}
```

Response:

```json
{
	"lesson_id": 2,
	"summary": "Bài học này giới thiệu về EC2, cách tạo instance và cấu hình Security Group..."
}
```

### 5.3. AI tạo câu hỏi quiz

Dành cho `admin`.

```http
POST /api/ai/generate-quiz
```

Request:

```json
{
	"lesson_id": 2,
	"number_of_questions": 5
}
```

Response:

```json
{
	"questions": [
		{
			"content": "EC2 là gì?",
			"answers": [
				{
					"content": "Dịch vụ máy chủ ảo",
					"is_correct": true
				},
				{
					"content": "Dịch vụ lưu trữ object",
					"is_correct": false
				}
			]
		}
	]
}
```

### Error response thường gặp

```json
{
	"detail": "AI service unavailable"
}
```

```text
400 Bad Request
401 Unauthorized
500 Internal Server Error
```

---

## 6. File Upload API cho S3

có để lưu tài liệu/video.

### 6.1. Upload file bài học

```http
POST /api/files/upload
```

Request:

```text
multipart/form-data
file: video.mp4 / document.pdf
```

Response:

```json
{
	"file_url": "https://s3.amazonaws.com/bucket/video.mp4"
}
```

Sau đó lấy `file_url` này lưu vào bảng `lessons.video_url` hoặc `lessons.document_url`.

### Error response thường gặp

```json
{
	"detail": "Unsupported file type"
}
```

```text
400 Bad Request
401 Unauthorized
413 Payload Too Large
500 Internal Server Error
```

### 7. Phân quyền API

Role Quyền
student Xem khóa học, đăng ký/hủy đăng ký học, xem bài học, làm quiz, xem khóa học đã đăng ký, chat AI
admin Tạo/sửa/xóa course, lesson, quiz, question, upload tài liệu, sinh quiz AI

Các API cần role admin:

POST /api/courses
PUT /api/courses/{id}
DELETE /api/courses/{id}
POST /api/courses/{id}/lessons
POST /api/courses/{id}/quizzes
POST /api/quizzes/{id}/questions
PUT /api/lessons/{lesson_id}
DELETE /api/lessons/{lesson_id}
PUT /api/quizzes/{quiz_id}
DELETE /api/quizzes/{quiz_id}
PUT /api/questions/{question_id}
DELETE /api/questions/{question_id}
POST /api/ai/generate-quiz
POST /api/files/upload
