# Backend RBAC & Organization Implementation

This document details the backend implementation of the Organization-Based Role-Based Access Control (RBAC) system.

## 1. Data Models

### Organization (`organizations` collection)
- `id`: UUID string
- `name`: String
- `orgCode`: String (Unique)
- `password`: Hashed Password
- `createdAt`: ISO Date
- `updatedAt`: ISO Date

### User (`users` collection)
- `id`: UUID string
- `email`: String
- `password`: Hashed Password
- `name`: String
- `role`: Enum (`super_admin`, `admin`, `employee`)
- `organizationId`: String (Link to Organization)
- `allottedCompanyIds`: List[String] (For Admin/Employee)
- `createdAt`: ISO Date
- `updatedAt`: ISO Date

## 2. API Endpoints

### Authentication (`/api/v1/auth`)

#### Organization Signup
- **POST** `/auth/org/signup`
- **Body**: `OrgSignupRequest` (orgName, orgCode, password, adminEmail, adminName, adminPassword)
- **Action**: Creates Organization and Super Admin User.
- **Returns**: `OrgLoginResponse` (organization, token)

#### Organization Login
- **POST** `/auth/org/login`
- **Body**: `OrgLoginRequest` (orgCode, password)
- **Action**: Verifies Org credentials.
- **Returns**: `OrgLoginResponse` (organization, token)

#### User Login
- **POST** `/auth/user/login`
- **Body**: `UserLoginRequest` (email, password, orgId)
- **Action**: Verifies User credentials within the Organization.
- **Returns**: `UserLoginResponse` (user, token)

### User Management (`/api/v1/auth`)

#### Get Organization Users
- **GET** `/auth/org/{orgId}/users`
- **Action**: Lists all users in the organization.
- **Returns**: `List[UserOut]`

#### Create Sub-User
- **POST** `/auth/users`
- **Body**: `UserCreate` (email, password, name, role, organizationId, allottedCompanyIds)
- **Action**: Creates a new user linked to the organization.
- **Returns**: `UserOut`

#### Update User
- **PUT** `/auth/users/{userId}`
- **Body**: `UserUpdate`
- **Action**: Updates user details (role, allotted companies, etc.).
- **Returns**: `UserOut`

#### Delete User
- **DELETE** `/auth/users/{userId}`
- **Action**: Deletes the user.

## 3. Security

- Passwords are hashed using `bcrypt`.
- JWT tokens are issued for sessions.
- `organizationId` is used to scope user queries.

## 4. Files Modified/Created

- `Backend/app/schemas/organization.py` (Created)
- `Backend/app/schemas/user.py` (Updated)
- `Backend/app/schemas/auth.py` (Updated)
- `Backend/app/api/v1/auth_firestore.py` (Updated)
- `Backend/app/api/v1/users_firestore.py` (Updated)
