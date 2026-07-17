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

### 1.6. Admin lấy danh sách tài khoản

Chỉ tài khoản có role `admin` được sử dụng API này. Có thể lọc theo `role` và `account_status`.

```http
GET /api/users?role=tutor&account_status=pending
Authorization: Bearer <admin_access_token>
```

Response:

```json
[
	{
		"_id": "6870f8c90db5248718eb6e31",
		"full_name": "Tutor Example",
		"email": "tutor@example.com",
		"role": "tutor",
		"account_status": "pending",
		"createdAt": "2026-07-17T08:00:00.000Z",
		"updatedAt": "2026-07-17T08:00:00.000Z"
	}
]
```

Giá trị query hợp lệ:

```text
role: student | tutor | admin
account_status: pending | active | blocked
```

### 1.7. Admin duyệt hoặc khóa tài khoản tutor

```http
PATCH /api/users/{user_id}/status
Authorization: Bearer <admin_access_token>
```

Request duyệt tutor:

```json
{
	"account_status": "active"
}
```

Request khóa tutor:

```json
{
	"account_status": "blocked"
}
```

API này chỉ cập nhật tài khoản có role `tutor`. Không thể dùng để thay đổi trạng thái của student hoặc admin.

---

## 2. Course API

### 2.1. Lấy danh sách khóa học

API công khai, chỉ trả về các khóa học chưa bị xóa mềm.

```http
GET /api/courses
```

Response:

```json
[
	{
		"_id": "6870f8c90db5248718eb6e31",
		"title": "AWS Basic",
		"description": "Khóa học nhập môn AWS",
		"thumbnail_url": "https://s3.amazonaws.com/...",
		"enrollment_type": "approval_required",
		"created_by": {
			"_id": "6870f8c90db5248718eb6e32",
			"full_name": "Tutor Example",
			"role": "tutor"
		},
		"is_deleted": false
	}
]
```

### 2.2. Lấy chi tiết khóa học

API công khai. Khóa học đã bị xóa mềm sẽ trả về `404 Not Found`.

```http
GET /api/courses/{course_id}
```

### 2.3. Tạo khóa học

Dành cho `tutor` hoặc `admin`.

```http
POST /api/courses
Authorization: Bearer <access_token>
```

Request:

```json
{
	"title": "AWS Basic",
	"description": "Khóa học nhập môn AWS",
	"thumbnail_url": "https://s3.amazonaws.com/aws-basic.png",
	"enrollment_type": "approval_required"
}
```

`enrollment_type` nhận một trong hai giá trị:

```text
open              Student được active ngay sau khi đăng ký
approval_required Student ở trạng thái pending và chờ tutor/admin duyệt
```

Response:

```json
{
	"message": "Course created successfully",
	"course": {
		"_id": "6870f8c90db5248718eb6e31",
		"title": "AWS Basic",
		"description": "Khóa học nhập môn AWS",
		"thumbnail_url": "https://s3.amazonaws.com/aws-basic.png",
		"enrollment_type": "approval_required",
		"created_by": "6870f8c90db5248718eb6e32",
		"is_deleted": false
	}
}
```

### 2.4. Cập nhật khóa học

Dành cho tutor sở hữu khóa học hoặc admin.

```http
PUT /api/courses/{course_id}
Authorization: Bearer <access_token>
```

Request:

```json
{
	"title": "AWS Basic Updated",
	"description": "Cập nhật nội dung khóa học AWS",
	"thumbnail_url": "https://s3.amazonaws.com/aws-basic-new.png",
	"enrollment_type": "open"
}
```

Các trường đều có thể cập nhật độc lập.

### 2.5. Xóa mềm khóa học

Dành cho tutor sở hữu khóa học hoặc admin. Dữ liệu không bị xóa khỏi MongoDB mà được chuyển vào thùng rác.

```http
DELETE /api/courses/{course_id}
Authorization: Bearer <access_token>
```

Response:

```json
{
	"message": "Course moved to trash successfully"
}
```

### 2.6. Lấy danh sách khóa học đã xóa

- Tutor chỉ xem các khóa học do mình tạo.
- Admin xem được tất cả khóa học đã xóa.

```http
GET /api/courses/mine/deleted
Authorization: Bearer <access_token>
```

Response:

```json
[
	{
		"_id": "6870f8c90db5248718eb6e31",
		"title": "AWS Basic",
		"is_deleted": true,
		"deleted_at": "2026-07-17T08:00:00.000Z",
		"deleted_by": "6870f8c90db5248718eb6e32"
	}
]
```

### 2.7. Khôi phục khóa học

Dành cho tutor sở hữu khóa học hoặc admin.

```http
PATCH /api/courses/{course_id}/restore
Authorization: Bearer <access_token>
```

Response:

```json
{
	"message": "Course restored successfully",
	"course": {
		"_id": "6870f8c90db5248718eb6e31",
		"title": "AWS Basic",
		"is_deleted": false,
		"deleted_at": null,
		"deleted_by": null
	}
}
```

### 2.8. Student đăng ký khóa học

Chỉ dành cho `student`.

```http
POST /api/courses/{course_id}/enroll
Authorization: Bearer <student_access_token>
```

Response khi course có `enrollment_type = open`:

```json
{
	"message": "Enrolled in course successfully",
	"enrollment": {
		"_id": "6870f8c90db5248718eb6e40",
		"user_id": "6870f8c90db5248718eb6e33",
		"course_id": "6870f8c90db5248718eb6e31",
		"status": "active",
		"approved_at": "2026-07-17T08:00:00.000Z"
	}
}
```

Response khi course có `enrollment_type = approval_required`:

```json
{
	"message": "Enrollment request submitted successfully",
	"enrollment": {
		"_id": "6870f8c90db5248718eb6e40",
		"status": "pending",
		"approved_at": null
	}
}
```

### 2.9. Student xem các khóa học đã đăng ký

Kết quả bao gồm cả enrollment `pending` và `active`, nhưng không bao gồm course đã bị xóa mềm.

```http
GET /api/users/me/courses
Authorization: Bearer <student_access_token>
```

Response:

```json
[
	{
		"_id": "6870f8c90db5248718eb6e40",
		"user_id": "6870f8c90db5248718eb6e33",
		"course_id": {
			"_id": "6870f8c90db5248718eb6e31",
			"title": "AWS Basic",
			"description": "Khóa học nhập môn AWS",
			"thumbnail_url": "https://s3.amazonaws.com/...",
			"created_by": {
				"_id": "6870f8c90db5248718eb6e32",
				"full_name": "Tutor Example",
				"role": "tutor"
			}
		},
		"status": "pending",
		"requested_at": "2026-07-17T08:00:00.000Z",
		"approved_at": null
	}
]
```

### 2.10. Student hủy đăng ký hoặc hủy yêu cầu đang chờ

```http
DELETE /api/courses/{course_id}/enroll
Authorization: Bearer <student_access_token>
```

Response:

```json
{
	"message": "Unenrolled from course successfully"
}
```

### 2.11. Tutor/admin xem danh sách enrollment của khóa học

- Tutor chỉ xem enrollment của khóa học mình sở hữu.
- Admin xem được enrollment của mọi khóa học.
- Nếu không truyền `status`, mặc định lấy `pending`.

```http
GET /api/courses/{course_id}/enrollments?status=pending
Authorization: Bearer <access_token>
```

Giá trị `status` hợp lệ:

```text
pending | active
```

Response:

```json
[
	{
		"_id": "6870f8c90db5248718eb6e40",
		"user_id": {
			"_id": "6870f8c90db5248718eb6e33",
			"full_name": "Student Example",
			"email": "student@example.com",
			"role": "student"
		},
		"course_id": "6870f8c90db5248718eb6e31",
		"status": "pending",
		"requested_at": "2026-07-17T08:00:00.000Z",
		"approved_at": null
	}
]
```

### 2.12. Tutor/admin duyệt enrollment

Tutor chỉ được duyệt yêu cầu của khóa học mình sở hữu. Sau khi duyệt, enrollment chuyển từ `pending` sang `active`.

```http
PATCH /api/courses/{course_id}/enrollments/{enrollment_id}/approve
Authorization: Bearer <access_token>
```

Response:

```json
{
	"message": "Enrollment approved successfully",
	"enrollment": {
		"_id": "6870f8c90db5248718eb6e40",
		"status": "active",
		"approved_at": "2026-07-17T08:05:00.000Z"
	}
}
```

### 2.13. Tutor/admin từ chối enrollment

Chỉ được từ chối enrollment có trạng thái `pending`. Enrollment bị từ chối sẽ được xóa để student có thể gửi lại yêu cầu sau này.

```http
DELETE /api/courses/{course_id}/enrollments/{enrollment_id}
Authorization: Bearer <access_token>
```

Response:

```json
{
	"message": "Enrollment request rejected successfully"
}
```

### Error response thường gặp

```json
{
	"message": "Course not found"
}
```

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
500 Internal Server Error
```

| Status | Trường hợp |
|---|---|
| `400 Bad Request` | ObjectId không hợp lệ, `enrollment_type` hoặc `status` không hợp lệ |
| `401 Unauthorized` | Thiếu access token hoặc token không hợp lệ/hết hạn |
| `403 Forbidden` | Sai role hoặc tutor thao tác trên khóa học không thuộc quyền sở hữu |
| `404 Not Found` | Không tìm thấy course hoặc enrollment |
| `409 Conflict` | Đã đăng ký, yêu cầu đang pending, enrollment đã active hoặc cố từ chối enrollment active |
| `500 Internal Server Error` | Lỗi database hoặc lỗi hệ thống ngoài dự kiến |

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

## 7. Phân quyền API

| Role | Quyền chính |
|---|---|
| `student` | Xem khóa học, đăng ký/hủy đăng ký, xem khóa học của mình, học lesson, làm quiz và chat AI |
| `tutor` | Tạo khóa học; quản lý course, lesson, quiz và enrollment thuộc khóa học mình sở hữu |
| `admin` | Quản lý tài khoản tutor và có quyền quản trị toàn bộ khóa học/hệ thống |

### 7.1. Phân quyền Course và Enrollment hiện tại

| Endpoint | Quyền |
|---|---|
| `GET /api/courses` | Public |
| `GET /api/courses/{course_id}` | Public |
| `POST /api/courses` | `tutor`, `admin` |
| `PUT /api/courses/{course_id}` | Tutor sở hữu course hoặc `admin` |
| `DELETE /api/courses/{course_id}` | Tutor sở hữu course hoặc `admin` |
| `GET /api/courses/mine/deleted` | `tutor`, `admin` |
| `PATCH /api/courses/{course_id}/restore` | Tutor sở hữu course hoặc `admin` |
| `POST /api/courses/{course_id}/enroll` | `student` |
| `DELETE /api/courses/{course_id}/enroll` | `student` |
| `GET /api/users/me/courses` | `student` |
| `GET /api/courses/{course_id}/enrollments` | Tutor sở hữu course hoặc `admin` |
| `PATCH /api/courses/{course_id}/enrollments/{enrollment_id}/approve` | Tutor sở hữu course hoặc `admin` |
| `DELETE /api/courses/{course_id}/enrollments/{enrollment_id}` | Tutor sở hữu course hoặc `admin` |

### 7.2. Phân quyền quản lý tài khoản

| Endpoint | Quyền |
|---|---|
| `GET /api/users` | `admin` |
| `PATCH /api/users/{user_id}/status` | `admin` |

Tài khoản tutor mới đăng ký có `account_status = pending`. Admin phải chuyển trạng thái sang `active` trước khi tutor có thể đăng nhập. Khi tutor bị chuyển sang `blocked`, các request sử dụng access token cũ cũng bị từ chối bởi middleware xác thực.
