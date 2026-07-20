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

Sau khi đặt lại mật khẩu thành công, reset token bị xóa và không thể sử dụng lại. Hệ thống đồng thời tăng `token_version`, vì vậy tất cả access token được cấp trước thời điểm reset mật khẩu đều bị thu hồi và nhận `401 Unauthorized` ở request tiếp theo.

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

Không thể xóa course khi còn quiz attempt `in_progress` chưa hết hạn trong course đó.

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
| `409 Conflict` | Đã đăng ký, yêu cầu đang pending, enrollment đã active, cố từ chối enrollment active hoặc xóa course khi student đang làm quiz |
| `500 Internal Server Error` | Lỗi database hoặc lỗi hệ thống ngoài dự kiến |

---

## 3. Lesson API

Tất cả Lesson API đều yêu cầu đăng nhập.

Quy tắc truy cập:

- Student chỉ được xem lesson, hoàn thành lesson và xem tiến độ khi enrollment của course có trạng thái `active`.
- Tutor chỉ được xem và quản lý lesson thuộc course do mình sở hữu.
- Admin được xem và quản lý lesson của mọi course.
- Course đã bị xóa mềm không thể truy cập hoặc quản lý lesson.

### 3.1. Lấy danh sách bài học theo khóa học

```http
GET /api/courses/{course_id}/lessons
Authorization: Bearer <access_token>
```

Danh sách được sắp xếp tăng dần theo `order_index`.

Response:

```json
[
	{
		"_id": "6870f8c90db5248718eb6f01",
		"course_id": "6870f8c90db5248718eb6e31",
		"title": "Introduction to Cloud Computing",
		"content": "Cloud computing is...",
		"video_url": "https://s3.amazonaws.com/video.mp4",
		"document_url": "https://s3.amazonaws.com/document.pdf",
		"order_index": 1,
		"createdAt": "2026-07-18T08:00:00.000Z",
		"updatedAt": "2026-07-18T08:00:00.000Z"
	}
]
```

### 3.2. Lấy chi tiết bài học

```http
GET /api/lessons/{lesson_id}
Authorization: Bearer <access_token>
```

Response:

```json
{
	"_id": "6870f8c90db5248718eb6f01",
	"course_id": "6870f8c90db5248718eb6e31",
	"title": "Introduction to Cloud Computing",
	"content": "Cloud computing is...",
	"video_url": "https://s3.amazonaws.com/video.mp4",
	"document_url": "https://s3.amazonaws.com/document.pdf",
	"order_index": 1,
	"createdAt": "2026-07-18T08:00:00.000Z",
	"updatedAt": "2026-07-18T08:00:00.000Z"
}
```

### 3.3. Tạo bài học

Dành cho tutor sở hữu course hoặc admin.

```http
POST /api/courses/{course_id}/lessons
Authorization: Bearer <access_token>
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

Ràng buộc:

- `title` là chuỗi bắt buộc và không được rỗng.
- `order_index` là số nguyên dương bắt buộc.
- Mỗi `order_index` chỉ xuất hiện một lần trong cùng một course.
- `content`, `video_url`, `document_url` là chuỗi không bắt buộc.

Response:

```json
{
	"message": "Lesson created successfully",
	"lesson": {
		"_id": "6870f8c90db5248718eb6f01",
		"course_id": "6870f8c90db5248718eb6e31",
		"title": "Introduction to Cloud Computing",
		"content": "Cloud computing is...",
		"video_url": "https://s3.amazonaws.com/video.mp4",
		"document_url": "https://s3.amazonaws.com/document.pdf",
		"order_index": 1
	}
}
```

### 3.4. Đánh dấu đã hoàn thành bài học

Chỉ dành cho student có enrollment `active` trong course chứa lesson.

```http
POST /api/lessons/{lesson_id}/complete
Authorization: Bearer <student_access_token>
```

Response:

```json
{
	"message": "Lesson marked as completed successfully",
	"progress": {
		"_id": "6870f8c90db5248718eb6f10",
		"user_id": "6870f8c90db5248718eb6e33",
		"course_id": "6870f8c90db5248718eb6e31",
		"lesson_id": "6870f8c90db5248718eb6f01",
		"is_completed": true,
		"completed_at": "2026-07-18T08:30:00.000Z"
	}
}
```

API sử dụng upsert nên một student chỉ có một progress document cho mỗi lesson.

### 3.5. Lấy tiến độ học tập của khóa học

Chỉ dành cho student có enrollment `active`.

```http
GET /api/courses/{course_id}/progress
Authorization: Bearer <student_access_token>
```

Response:

```json
{
	"course_id": "6870f8c90db5248718eb6e31",
	"progress_percent": 30,
	"completed_lessons": 3,
	"total_lessons": 10
}
```

Nếu course chưa có lesson, `progress_percent`, `completed_lessons` và `total_lessons` đều bằng `0`.

### 3.6. Cập nhật bài học

Dành cho tutor sở hữu course hoặc admin. Có thể cập nhật từng trường độc lập, nhưng body phải chứa ít nhất một trường hợp lệ.

```http
PUT /api/lessons/{lesson_id}
Authorization: Bearer <access_token>
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

Response:

```json
{
	"message": "Lesson updated successfully",
	"lesson": {
		"_id": "6870f8c90db5248718eb6f01",
		"course_id": "6870f8c90db5248718eb6e31",
		"title": "Introduction to AWS Cloud",
		"content": "Updated lesson content...",
		"video_url": "https://s3.amazonaws.com/video-new.mp4",
		"document_url": "https://s3.amazonaws.com/document-new.pdf",
		"order_index": 2
	}
}
```

### 3.7. Xóa bài học

Dành cho tutor sở hữu course hoặc admin. Lesson bị xóa cứng và tất cả progress liên quan cũng bị xóa.

```http
DELETE /api/lessons/{lesson_id}
Authorization: Bearer <access_token>
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
	"message": "Resource not found"
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
| `400 Bad Request` | Course/Lesson ObjectId không hợp lệ; title, content, URL hoặc order index không hợp lệ; update body rỗng |
| `401 Unauthorized` | Thiếu access token hoặc token không hợp lệ/hết hạn |
| `403 Forbidden` | Sai role, tutor không sở hữu course hoặc student chưa có enrollment active |
| `404 Not Found` | Không tìm thấy course/lesson hoặc course đã bị xóa mềm |
| `409 Conflict` | `order_index` đã tồn tại trong cùng course |
| `500 Internal Server Error` | Lỗi database hoặc lỗi hệ thống ngoài dự kiến |

---

## 4. Quiz API

Tất cả Quiz API đều yêu cầu đăng nhập.

Quy tắc truy cập:

- Student chỉ được xem danh sách quiz, bắt đầu quiz, nộp bài và xem attempt khi có enrollment `active` trong course.
- Tutor chỉ được xem và quản lý quiz thuộc course do mình sở hữu.
- Admin được xem và quản lý quiz của mọi course.
- Student chỉ nhận câu hỏi từ API bắt đầu quiz; response không chứa trường `is_correct`.
- Backend dùng thời gian server để tạo `started_at` và `expires_at`, đồng thời từ chối bài nộp sau khi hết thời gian.
- Khi còn attempt `in_progress` chưa hết hạn, tutor/admin không được sửa hoặc xóa quiz, câu hỏi và đáp án.

### 4.1. Lấy danh sách quiz của khóa học

```http
GET /api/courses/{course_id}/quizzes
Authorization: Bearer <access_token>
```

Response không chứa mảng `questions`:

```json
[
	{
		"_id": "6870f8c90db5248718eb7101",
		"course_id": "6870f8c90db5248718eb6e31",
		"title": "AWS Quiz 1",
		"description": "Kiểm tra kiến thức cơ bản về AWS",
		"time_limit": 15,
		"createdAt": "2026-07-19T08:00:00.000Z",
		"updatedAt": "2026-07-19T08:00:00.000Z"
	}
]
```

### 4.2. Tạo quiz

Dành cho tutor sở hữu course hoặc admin.

```http
POST /api/courses/{course_id}/quizzes
Authorization: Bearer <access_token>
```

Request:

```json
{
	"title": "AWS Quiz 1",
	"description": "Kiểm tra kiến thức cơ bản về AWS",
	"time_limit": 15
}
```

Ràng buộc:

- `title` là chuỗi bắt buộc và không được rỗng.
- `description` là chuỗi không bắt buộc.
- `time_limit` là số nguyên dương bắt buộc, tính bằng phút.

Response:

```json
{
	"message": "Quiz created successfully",
	"quiz": {
		"_id": "6870f8c90db5248718eb7101",
		"course_id": "6870f8c90db5248718eb6e31",
		"title": "AWS Quiz 1",
		"description": "Kiểm tra kiến thức cơ bản về AWS",
		"time_limit": 15,
		"questions": []
	}
}
```

### 4.3. Thêm câu hỏi vào quiz

Dành cho tutor sở hữu course hoặc admin.

Không thể thêm câu hỏi khi quiz đang có attempt `in_progress` chưa hết hạn.

```http
POST /api/quizzes/{quiz_id}/questions
Authorization: Bearer <access_token>
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

Ràng buộc:

- `question_type` nhận `single_choice` hoặc `multiple_choice`.
- `point` phải là số hữu hạn lớn hơn `0`.
- Mỗi question phải có ít nhất hai answer và nội dung answer không được trùng nhau.
- `single_choice` phải có đúng một answer mang `is_correct = true`.
- `multiple_choice` phải có ít nhất một answer mang `is_correct = true`.

Response:

```json
{
	"message": "Question added successfully",
	"question": {
		"_id": "6870f8c90db5248718eb7201",
		"content": "Amazon EC2 dùng để làm gì?",
		"question_type": "single_choice",
		"point": 1,
		"answers": [
			{
				"_id": "6870f8c90db5248718eb7211",
				"content": "Lưu trữ object",
				"is_correct": false
			},
			{
				"_id": "6870f8c90db5248718eb7212",
				"content": "Tạo máy chủ ảo",
				"is_correct": true
			}
		]
	}
}
```

### 4.4. Lấy câu hỏi quiz

Chỉ dành cho tutor sở hữu course hoặc admin để quản lý câu hỏi và đáp án. Student không được sử dụng endpoint này nhằm tránh xem đề trước khi thời gian làm bài bắt đầu.

```http
GET /api/quizzes/{quiz_id}/questions
Authorization: Bearer <access_token>
```

Response dành cho tutor/admin, có đầy đủ `is_correct`:

```json
[
	{
		"_id": "6870f8c90db5248718eb7201",
		"content": "Amazon EC2 dùng để làm gì?",
		"question_type": "single_choice",
		"point": 1,
		"answers": [
			{
				"_id": "6870f8c90db5248718eb7211",
				"content": "Lưu trữ object",
				"is_correct": false
			},
			{
				"_id": "6870f8c90db5248718eb7212",
				"content": "Tạo máy chủ ảo",
				"is_correct": true
			}
		]
	}
]
```

### 4.5. Bắt đầu quiz

Chỉ dành cho student có enrollment `active`. Quiz phải có ít nhất một câu hỏi.

```http
POST /api/quizzes/{quiz_id}/start
Authorization: Bearer <student_access_token>
```

Backend sử dụng thời gian server để tạo attempt với trạng thái `in_progress`:

```text
started_at = thời điểm bắt đầu
expires_at = started_at + time_limit
```

Nếu student gọi lại endpoint khi vẫn còn một attempt `in_progress` chưa hết hạn, backend trả lại attempt đang làm thay vì tạo attempt mới. Nếu attempt cũ đã hết hạn, backend chuyển trạng thái của attempt đó thành `expired` rồi tạo attempt mới. Unique partial index và xử lý duplicate key bảo đảm mỗi student chỉ có tối đa một attempt `in_progress` cho một quiz, kể cả khi nhiều request `/start` đến đồng thời.

Response:

```json
{
	"attempt_id": "6870f8c90db5248718eb7301",
	"started_at": "2026-07-19T08:45:00.000Z",
	"expires_at": "2026-07-19T09:00:00.000Z",
	"time_limit": 15,
	"questions": [
		{
			"_id": "6870f8c90db5248718eb7201",
			"content": "Amazon EC2 dùng để làm gì?",
			"question_type": "single_choice",
			"point": 1,
			"answers": [
				{
					"_id": "6870f8c90db5248718eb7211",
					"content": "Lưu trữ object"
				},
				{
					"_id": "6870f8c90db5248718eb7212",
					"content": "Tạo máy chủ ảo"
				}
			]
		}
	]
}
```

Response dành cho student không chứa `is_correct`.

### 4.6. Nộp bài quiz

Chỉ dành cho student sở hữu attempt, còn enrollment `active`, attempt đang ở trạng thái `in_progress` và chưa quá `expires_at`.

```http
POST /api/quiz-attempts/{attempt_id}/submit
Authorization: Bearer <student_access_token>
```

Request:

```json
{
	"answers": [
		{
			"question_id": "6870f8c90db5248718eb7201",
			"selected_answer_ids": [
				"6870f8c90db5248718eb7212"
			]
		},
		{
			"question_id": "6870f8c90db5248718eb7202",
			"selected_answer_ids": [
				"6870f8c90db5248718eb7221",
				"6870f8c90db5248718eb7222"
			]
		}
	]
}
```

Với `single_choice`, `selected_answer_ids` được chọn tối đa một phần tử. Với `multiple_choice`, câu trả lời chỉ đúng khi tập ID được chọn trùng chính xác với tập đáp án đúng. Question không xuất hiện trong payload được tính là chưa trả lời và nhận `0` điểm.

API từ chối payload có question/answer ID không hợp lệ, question không thuộc quiz, answer không thuộc question, hoặc question ID/answer ID bị lặp. Backend cũng từ chối attempt của student khác, attempt đã `submitted` hoặc attempt đã `expired`.

Backend tự tính thời gian làm bài bằng thời gian server và lưu theo giây:

```text
duration_seconds = floor((submitted_at - started_at) / 1000)
```

Client không được gửi `started_at`, `submitted_at` hoặc `duration_seconds` trong request.

Response:

```json
{
	"attempt_id": "6870f8c90db5248718eb7301",
	"status": "submitted",
	"score": 8,
	"total_score": 10,
	"correct_answers": 8,
	"total_questions": 10,
	"duration_seconds": 523,
	"submitted_at": "2026-07-19T09:00:00.000Z"
}
```

### 4.7. Xem lịch sử làm quiz

- Student chỉ xem attempt của chính mình và phải còn enrollment `active`.
- Tutor sở hữu course và admin xem được attempt của các student.
- Trước khi trả kết quả, backend tự chuyển các attempt `in_progress` đã quá `expires_at` thành `expired`.

```http
GET /api/quizzes/{quiz_id}/attempts
Authorization: Bearer <access_token>
```

Response:

```json
[
	{
		"_id": "6870f8c90db5248718eb7301",
		"user_id": {
			"_id": "6870f8c90db5248718eb6e33",
			"full_name": "Student Example",
			"email": "student@example.com"
		},
		"course_id": "6870f8c90db5248718eb6e31",
		"quiz_id": "6870f8c90db5248718eb7101",
		"status": "submitted",
		"started_at": "2026-07-19T08:45:00.000Z",
		"expires_at": "2026-07-19T09:00:00.000Z",
		"score": 8,
		"total_score": 10,
		"correct_answers": 8,
		"total_questions": 10,
		"duration_seconds": 523,
		"submitted_at": "2026-07-19T09:00:00.000Z",
		"answers": []
	}
]
```

### 4.8. Cập nhật quiz

Dành cho tutor sở hữu course hoặc admin. Có thể cập nhật từng trường độc lập nhưng body phải có ít nhất một trường.

Không thể cập nhật quiz khi đang có attempt `in_progress` chưa hết hạn.

```http
PUT /api/quizzes/{quiz_id}
Authorization: Bearer <access_token>
```

Request:

```json
{
	"title": "AWS Quiz Updated",
	"description": "Updated quiz description",
	"time_limit": 20
}
```

Response:

```json
{
	"message": "Quiz updated successfully",
	"quiz": {
		"_id": "6870f8c90db5248718eb7101",
		"title": "AWS Quiz Updated",
		"description": "Updated quiz description",
		"time_limit": 20
	}
}
```

### 4.9. Xóa quiz

Dành cho tutor sở hữu course hoặc admin. Quiz bị xóa cứng cùng toàn bộ attempt của quiz.

Không thể xóa quiz khi đang có attempt `in_progress` chưa hết hạn.

```http
DELETE /api/quizzes/{quiz_id}
Authorization: Bearer <access_token>
```

Response:

```json
{
	"message": "Quiz and its attempts deleted successfully"
}
```

### 4.10. Cập nhật câu hỏi

Dành cho tutor sở hữu course hoặc admin. Question nằm trực tiếp trong document Quiz nên endpoint chứa cả `quiz_id` và `question_id`.

Không thể cập nhật câu hỏi khi quiz đang có attempt `in_progress` chưa hết hạn.

```http
PUT /api/quizzes/{quiz_id}/questions/{question_id}
Authorization: Bearer <access_token>
```

Request có thể chứa một hoặc nhiều trường:

```json
{
	"content": "Amazon EC2 là dịch vụ gì?",
	"question_type": "single_choice",
	"point": 1,
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
```

Khi cập nhật toàn bộ `answers`, MongoDB tạo `_id` mới cho các embedded answer. Quy tắc số đáp án đúng được kiểm tra lại theo trạng thái cuối cùng, kể cả khi chỉ thay đổi `question_type`.

Response:

```json
{
	"message": "Question updated successfully",
	"question": {
		"_id": "6870f8c90db5248718eb7201",
		"content": "Amazon EC2 là dịch vụ gì?",
		"question_type": "single_choice",
		"point": 1,
		"answers": []
	}
}
```

### 4.11. Xóa câu hỏi

Dành cho tutor sở hữu course hoặc admin.

Không thể xóa câu hỏi khi quiz đang có attempt `in_progress` chưa hết hạn.

```http
DELETE /api/quizzes/{quiz_id}/questions/{question_id}
Authorization: Bearer <access_token>
```

Response:

```json
{
	"message": "Question deleted successfully from quiz"
}
```

### 4.12. Xem chi tiết một lần làm bài

- Student chỉ xem attempt của chính mình, đồng thời phải còn enrollment `active`.
- Tutor chỉ xem attempt thuộc course mình sở hữu.
- Admin xem được mọi attempt.

```http
GET /api/quiz-attempts/{attempt_id}
Authorization: Bearer <access_token>
```

Response:

```json
{
	"_id": "6870f8c90db5248718eb7301",
	"user_id": {
		"_id": "6870f8c90db5248718eb6e33",
		"full_name": "Student Example",
		"email": "student@example.com"
	},
	"course_id": "6870f8c90db5248718eb6e31",
	"quiz_id": "6870f8c90db5248718eb7101",
	"status": "submitted",
	"started_at": "2026-07-19T08:45:00.000Z",
	"expires_at": "2026-07-19T09:00:00.000Z",
	"score": 8,
	"total_score": 10,
	"correct_answers": 8,
	"total_questions": 10,
	"duration_seconds": 523,
	"submitted_at": "2026-07-19T09:00:00.000Z",
	"answers": [
		{
			"question_id": "6870f8c90db5248718eb7201",
			"question_content": "Amazon EC2 dùng để làm gì?",
			"selected_answers": [
				{
					"answer_id": "6870f8c90db5248718eb7212",
					"content": "Tạo máy chủ ảo"
				}
			],
			"is_correct": true,
			"earned_point": 1,
			"max_point": 1
		}
	]
}
```

### Error response thường gặp

```json
{
	"message": "Resource not found"
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
| `400 Bad Request` | ObjectId, quiz/question fields hoặc submission payload không hợp lệ; update body rỗng; attempt đã hết thời gian |
| `401 Unauthorized` | Thiếu access token hoặc token không hợp lệ/hết hạn |
| `403 Forbidden` | Sai role, tutor không sở hữu course, student chưa active hoặc cố xem attempt của người khác |
| `404 Not Found` | Không tìm thấy course, quiz, question hoặc attempt |
| `409 Conflict` | Quiz chưa có câu hỏi; attempt đã được nộp; hoặc tutor/admin sửa, xóa quiz khi đang có attempt hoạt động |
| `500 Internal Server Error` | Lỗi database hoặc lỗi hệ thống ngoài dự kiến |

---

## 5. AI API

Project có phần AI hỗ trợ học tập và OpenAI API.

> Trạng thái: Dự kiến triển khai, các endpoint trong phần này chưa được mount trong backend hiện tại.

### 5.1. Chat với AI

```http
POST /api/ai/chat
```

Request:

```json
{
	"course_id": "6870f8c90db5248718eb6e31",
	"lesson_id": "6870f8c90db5248718eb6f41",
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
	"lesson_id": "6870f8c90db5248718eb6f41",
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
	"lesson_id": "6870f8c90db5248718eb6f41",
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

> Trạng thái: Dự kiến triển khai, endpoint trong phần này chưa được mount trong backend hiện tại.

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

Sau đó lấy `file_url` này lưu vào collection `lessons`, tại trường `video_url` hoặc `document_url`.

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

### 7.3. Phân quyền Lesson và Progress hiện tại

| Endpoint | Quyền |
|---|---|
| `GET /api/courses/{course_id}/lessons` | Student enrollment active, tutor sở hữu course hoặc `admin` |
| `GET /api/lessons/{lesson_id}` | Student enrollment active, tutor sở hữu course hoặc `admin` |
| `POST /api/courses/{course_id}/lessons` | Tutor sở hữu course hoặc `admin` |
| `PUT /api/lessons/{lesson_id}` | Tutor sở hữu course hoặc `admin` |
| `DELETE /api/lessons/{lesson_id}` | Tutor sở hữu course hoặc `admin` |
| `POST /api/lessons/{lesson_id}/complete` | Student enrollment active |
| `GET /api/courses/{course_id}/progress` | Student enrollment active |

### 7.4. Phân quyền Quiz và Attempt hiện tại

| Endpoint | Quyền |
|---|---|
| `GET /api/courses/{course_id}/quizzes` | Student enrollment active, tutor sở hữu course hoặc `admin` |
| `POST /api/courses/{course_id}/quizzes` | Tutor sở hữu course hoặc `admin` |
| `GET /api/quizzes/{quiz_id}/questions` | Tutor sở hữu course hoặc `admin` |
| `POST /api/quizzes/{quiz_id}/questions` | Tutor sở hữu course hoặc `admin` |
| `PUT /api/quizzes/{quiz_id}` | Tutor sở hữu course hoặc `admin` |
| `DELETE /api/quizzes/{quiz_id}` | Tutor sở hữu course hoặc `admin` |
| `PUT /api/quizzes/{quiz_id}/questions/{question_id}` | Tutor sở hữu course hoặc `admin` |
| `DELETE /api/quizzes/{quiz_id}/questions/{question_id}` | Tutor sở hữu course hoặc `admin` |
| `POST /api/quizzes/{quiz_id}/start` | Student enrollment active |
| `POST /api/quiz-attempts/{attempt_id}/submit` | Student sở hữu attempt, enrollment active và attempt chưa hết hạn |
| `GET /api/quizzes/{quiz_id}/attempts` | Student xem của mình; tutor sở hữu course hoặc `admin` xem toàn bộ |
| `GET /api/quiz-attempts/{attempt_id}` | Student sở hữu attempt và enrollment active; tutor sở hữu course hoặc `admin` |
