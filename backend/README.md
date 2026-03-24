# School Management System - Backend API

Production-ready multi-tenant School Management System backend built with Node.js, Express, and PostgreSQL.

## 🏗️ Architecture

- **Modular Architecture**: Feature-based module organization
- **Multi-tenant**: School-based data isolation
- **JWT Authentication**: Secure token-based auth
- **Role-based Access Control**: Super Admin, Admin, Teacher roles
- **Custom Error Handling**: Standardized error codes and responses
- **Validation**: Request validation using express-validator
- **Winston Logging**: Comprehensive logging with file rotation
- **OpenAPI Documentation**: Interactive API documentation with Swagger UI

## 📁 Project Structure

```
src/
├── config/              # Configuration files
│   └── index.js         # Centralized config
├── constants/           # Application constants
│   └── index.js         # Roles, error codes, status codes
├── database/            # Database related files
│   ├── connection.js    # PostgreSQL connection pool
│   └── migrations/      # SQL migration files
├── middleware/          # Express middleware
│   ├── auth.js          # Authentication & authorization
│   ├── errorHandler.js  # Global error handler
│   └── validator.js     # Validation middleware
├── modules/             # Feature modules
│   ├── auth/            # Authentication module
│   ├── schools/         # School management module
│   └── teachers/        # Teacher management module
├── scripts/             # Utility scripts
│   ├── runMigrations.js # Database migration runner
│   └── seedSuperAdmin.js# Super admin seeder
├── utils/               # Utility functions
│   ├── AppError.js      # Custom error class
│   └── response.js      # Standardized API responses
├── app.js               # Express app setup
└── server.js            # Server entry point
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd school-management-system
```

2. **Install dependencies**

```bash
npm install
```

3. **Setup environment variables**

```bash
cp .env.example .env
```

Edit `.env` file with your configuration:

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=school_management
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=24h

SUPER_ADMIN_EMAIL=superadmin@system.com
SUPER_ADMIN_PASSWORD=SuperAdmin@123
SUPER_ADMIN_NAME=Super Administrator
```

4. **Create PostgreSQL database**

```bash
createdb school_management
```

5. **Run database migrations**

```bash
npm run db:migrate
```

6. **Seed Super Admin**

```bash
npm run seed:superadmin
```

7. **Start the server**

```bash
# Development
npm run dev

# Production
npm start
```

Server will start on `http://localhost:3000`

## 📚 API Documentation

Interactive API documentation is available at:

```
http://localhost:3000/api-docs
```

Features:

- Interactive Swagger UI
- Try API calls directly
- Request/response examples
- Authentication support
- Modular documentation structure

For detailed documentation guide, see [LOGGING_AND_DOCS.md](LOGGING_AND_DOCS.md)

## 📝 Logging

The application uses Winston for comprehensive logging:

- **Console Logs**: Development mode
- **File Logs**: `logs/combined.log` and `logs/error.log`
- **HTTP Logs**: All requests logged via Morgan
- **Structured Logging**: JSON format with metadata

View logs:

```bash
# Real-time
tail -f logs/combined.log

# Errors only
tail -f logs/error.log
```

For detailed logging guide, see [LOGGING_AND_DOCS.md](LOGGING_AND_DOCS.md)

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication

All authenticated endpoints require JWT token in header:

```
Authorization: Bearer <token>
```

---

### 1. Authentication Endpoints

#### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "admin",
      "schoolId": 1,
      "schoolName": "ABC School"
    }
  }
}
```

#### Get Profile

```http
GET /api/v1/auth/profile
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "admin",
    "phone": "+1234567890",
    "school_id": 1,
    "school_name": "ABC School"
  }
}
```

---

### 2. School Management (Super Admin Only)

#### Create School with Admin

```http
POST /api/v1/schools
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "school": {
    "name": "ABC International School",
    "code": "ABC001",
    "contactEmail": "contact@abcschool.com",
    "contactPhone": "+1234567890",
    "address": "123 Main Street, City",
    "subscriptionStatus": "active",
    "subscriptionEndDate": "2025-12-31"
  },
  "admin": {
    "email": "admin@abcschool.com",
    "password": "Admin@123",
    "fullName": "School Administrator",
    "phone": "+1234567890"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "School created successfully",
  "data": {
    "school": {
      "id": 1,
      "name": "ABC International School",
      "code": "ABC001",
      "subscription_status": "active",
      "is_active": true
    },
    "admin": {
      "id": 2,
      "email": "admin@abcschool.com",
      "full_name": "School Administrator",
      "role": "admin",
      "school_id": 1
    }
  }
}
```

#### Get All Schools

```http
GET /api/v1/schools
Authorization: Bearer <super_admin_token>
```

#### Get School by ID

```http
GET /api/v1/schools/:id
Authorization: Bearer <super_admin_token>
```

---

### 3. Teacher Management (Admin Only)

#### Create Teacher

```http
POST /api/v1/teachers
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "email": "teacher@abcschool.com",
  "password": "Teacher@123",
  "fullName": "Jane Smith",
  "phone": "+1234567890",
  "dateOfBirth": "1990-05-15",
  "gender": "Female",
  "address": "456 Oak Avenue, City"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Teacher created successfully",
  "data": {
    "id": 3,
    "email": "teacher@abcschool.com",
    "full_name": "Jane Smith",
    "role": "teacher",
    "phone": "+1234567890",
    "school_id": 1,
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Get All Teachers

```http
GET /api/v1/teachers
Authorization: Bearer <admin_token>
```

#### Get Teacher by ID

```http
GET /api/v1/teachers/:id
Authorization: Bearer <admin_token>
```

---

## 🔐 User Roles & Permissions

### Super Admin

- Create schools with admins
- View all schools
- Full system access

### Admin

- Create teachers for their school
- Manage school data
- View school statistics

### Teacher

- Login and access profile
- (Future: Manage classes, attendance, etc.)

## 🛡️ Error Codes

| Code       | Description           |
| ---------- | --------------------- |
| AUTH_001   | Invalid credentials   |
| AUTH_002   | Token missing         |
| AUTH_003   | Invalid token         |
| AUTH_004   | Token expired         |
| AUTH_005   | Unauthorized access   |
| USER_001   | User not found        |
| USER_002   | User already exists   |
| SCHOOL_001 | School not found      |
| SCHOOL_002 | School inactive       |
| VAL_001    | Validation error      |
| SYS_001    | Internal server error |

## 🧪 Testing

### Manual Testing Flow

1. **Login as Super Admin**

```bash
POST /api/v1/auth/login
{
  "email": "superadmin@system.com",
  "password": "SuperAdmin@123"
}
```

2. **Create a School**

```bash
POST /api/v1/schools
# Use super admin token
```

3. **Login as School Admin**

```bash
POST /api/v1/auth/login
# Use admin credentials from step 2
```

4. **Create Teachers**

```bash
POST /api/v1/teachers
# Use admin token
```

5. **Login as Teacher**

```bash
POST /api/v1/auth/login
# Use teacher credentials
```

## 📝 Development Guidelines

### Adding New Module

1. Create module directory in `src/modules/`
2. Create files:
   - `module.service.js` - Business logic
   - `module.controller.js` - Request handlers
   - `module.routes.js` - Route definitions
   - `module.validation.js` - Input validation
3. Register routes in `src/app.js`

### Code Standards

- Use async/await for asynchronous operations
- Always use try-catch in controllers
- Use custom AppError for operational errors
- Follow modular architecture
- Use constants for all static values
- Validate all inputs
- Use ApiResponse utility for responses

## 🔧 Environment Variables

| Variable       | Description       | Default           |
| -------------- | ----------------- | ----------------- |
| NODE_ENV       | Environment       | development       |
| PORT           | Server port       | 3000              |
| DB_HOST        | Database host     | localhost         |
| DB_PORT        | Database port     | 5432              |
| DB_NAME        | Database name     | school_management |
| DB_USER        | Database user     | postgres          |
| DB_PASSWORD    | Database password | -                 |
| JWT_SECRET     | JWT secret key    | -                 |
| JWT_EXPIRES_IN | Token expiry      | 24h               |

## 📄 License

MIT

## 👥 Support

For issues and questions, please create an issue in the repository.
