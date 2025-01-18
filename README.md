# User Authentication API

This project is a backend implementation of user authentication with features including user signup, JWT-based authentication, and protected routes. It uses Node.js, Express, and MongoDB.

## Features

1. **User Signup**

   - Validates user input fields (name, email, phone number, password).
   - Checks for existing users by email or phone number.
   - Hashes passwords before saving to the database.
   - Generates a JWT token upon successful signup.

2. **Captain Signup**

   - Validates captain-specific fields like driving license details and vehicle information.
   - Ensures unique email, phone number, and license details.
   - Hashes passwords before saving to the database.
   - Generates a JWT token upon successful signup.

3. **JWT Authentication**

   - Protects sensitive routes by verifying JWT tokens.
   - Decodes tokens to fetch user information for authorization.

4. **Validation Middleware**
   - Validates user and captain inputs using `express-validator`.
   - Provides detailed error messages for invalid inputs.

---

## Technologies Used

- **Node.js**: Runtime environment for building server-side applications.
- **Express.js**: Web framework for creating RESTful APIs.
- **MongoDB**: NoSQL database for storing user and captain data.
- **Mongoose**: ODM for MongoDB, used for schema modeling and data validation.
- **JSON Web Tokens (JWT)**: Securely authenticates users by issuing and verifying tokens.
- **express-validator**: Middleware for validating and sanitizing request data.

---

## Installation

1. Clone the repository:

   ```bash
   git clone <repository_url>
   ```

2. Navigate to the project directory:

   ```bash
   cd user-authentication-api
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a `.env` file in the root directory and configure the following environment variables:

   ```env
   MONGO_URI=<your_mongodb_connection_string>
   JWT_SECRET=<your_jwt_secret>
   PORT=5000
   ```

5. Start the server:
   ```bash
   npm start
   ```

---

## Endpoints

### 1. **User Signup**

**POST** `/api/users/signup`

Registers a new user. Validates inputs and generates a JWT token upon success.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "johndoe@example.com",
  "phoneNumber": "1234567890",
  "password": "password123"
}
```

**Response:**

```json
{
  "_id": "67892ba437902adc7e3d260c",
  "name": "John Doe",
  "email": "johndoe@example.com",
  "phoneNumber": "1234567890",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ODkyYmE0Mzc5MDJhZGM3ZTNkMjYwYyIsImlhdCI6MTczNzA0Mjg1MywiZXhwIjoxNzM5NjM0ODUzfQ.f_Molirs_KFle2HpJrWC2r9hpm4Z-VpzaFxUmRfkJiE"
}
```

**Errors:**

- `400`: Validation errors or existing user.
- `500`: Server error.

### 2. **Captain Signup**

**POST** `/api/captains/signup`

Registers a new captain. Validates inputs, including driving license and vehicle details, and generates a JWT token upon success.

**Request Body:**

```json
{
  "name": "Alice Navigator",
  "email": "alice.navigator@example.com",
  "phoneNumber": "+198765432109",
  "password": "securepassword123",
  "drivingLicense": {
    "number": "DL9876543210",
    "expiryDate": "2035-07-15T00:00:00.000Z"
  },
  "vehicle": {
    "make": "Ford",
    "model": "Mustang",
    "year": 2023,
    "color": "Rapid Red",
    "licensePlate": "FORD999"
  }
}
```

**Response:**

```json
{
  "_id": "67893ce91511e6aef3d0386d",
  "name": "Alice Navigator",
  "email": "alice.navigator@example.com",
  "phoneNumber": "+198765432109",
  "drivingLicense": {
    "number": "DL9876543210",
    "expiryDate": "2035-07-15T00:00:00.000Z"
  },
  "vehicle": {
    "make": "Ford",
    "model": "Mustang",
    "year": 2023,
    "color": "Rapid Red",
    "licensePlate": "FORD999"
  },
  "isVerified": false,
  "isActive": false,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ODkzY2U5MTUxMWU2YWVmM2QwMzg2ZCIsImlhdCI6MTczNzA0NzI3MywiZXhwIjoxNzM5NjM5MjczfQ.KNrHj4vsJFWD9Ebw10YHD-yRidMhwoF5gBiRrOolnUs"
}
```

**Errors:**

- `400`: Validation errors or existing captain.
- `500`: Server error.

---

## Validation Rules

1. **Name**: Required, minimum 3 characters.
2. **Email**: Required, must be a valid email format.
3. **Phone Number**: Required, must be a valid phone number.
4. **Password**: Required, minimum 8 characters.
5. **Driving License Number**: Required, unique.
6. **Driving License Expiry Date**: Required, valid date.
7. **Vehicle Details**: Make, model, year, color, and license plate are all required.

---

<!-- ## Project Structure

```
.
├── controllers
│   ├── user.controller.js       # Handles user-related logic (e.g., signup)
│   └── captain.controller.js    # Handles captain-related logic (e.g., signup)
├── middleware
│   └── auth.middleware.js       # JWT protection middleware
├── models
│   ├── user.model.js            # Mongoose schema for User
│   └── captain.model.js         # Mongoose schema for Captain
├── routes
│   ├── user.routes.js           # User-related routes
│   └── captain.routes.js        # Captain-related routes
├── services
│   └── hashPassword.js          # Password hashing service
├── .env                         # Environment variables
├── package.json                 # Dependencies and scripts
└── server.js                    # Entry point of the application
``` -->

---

## How It Works

1. A user sends a signup request to the `/api/users/signup` endpoint.
2. The request is validated by `express-validator` middleware.
3. The server checks for existing users in the database.
4. If validation passes, a new user or captain is created, and a JWT token is issued.
5. The `protect` middleware ensures only authenticated users access protected routes.

---

### User Login Route and Controller

The user login route and controller handle requests related to user authentication.

#### User Login Route

The user login route is defined in `server/routes/user.route.js`. It uses the `login` controller to authenticate users. For example, a POST request to `http://localhost:8000/api/users/login` with a JSON body containing the user's email and password will return a JSON response with the user's details and a JWT token.

#### User Login Controller

The user login controller is defined in `server/controllers/user.controller.js`. It exports the `login` function, which handles POST requests to the `/api/users/login` endpoint. This function checks the user's email and password, and if valid, returns a JSON response with the user's details and a JWT token.

**Request:**

```json
{
  "email": "alice.smith@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**

```json
{
  "_id": "678a59ce816da4cee492e4c7",
  "message": "User logged in successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3OGE1OWNlODE2ZGE0Y2VlNDkyZTRjNyIsImlhdCI6MTczNzIxMDg1MCwiZXhwIjoxNzM5ODAyODUwfQ.RoCBl2jdNuyRrr6cBvrqhh87N6mazItuIuRE1WgAvbk"
}
```

### Captain Login Route and Controller

The captain login route and controller handle requests related to captain authentication.

#### Captain Login Route

The captain login route is defined in `server/routes/captain.route.js`. It uses the `loginCaptain` controller to authenticate captains. For example, a POST request to `http://localhost:8000/api/captains/login` with a JSON body containing the captain's email and password will return a JSON response with the captain's details and a JWT token.

#### Captain Login Controller

The captain login controller is defined in `server/controllers/captain.controller.js`. It exports the `loginCaptain` function, which handles POST requests to the `/api/captains/login` endpoint. This function checks the captain's email and password, and if valid, returns a JSON response with the captain's details and a JWT token.

**Request:**

```json
{
  "email": "michael.johnson@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**

```json
{
  "message": "Captain logged in successfully",
  "captain": {
    "_id": "678bbff1053a1151ca72add5",
    "name": "Michael Johnson",
    "email": "michael.johnson@example.com",
    "phoneNumber": "+12345678901",
    "role": "captain"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3OGJiZmYxMDUzYTExNTFjYTcyYWRkNSIsImlhdCI6MTczNzIxMTk3OSwiZXhwIjoxNzM5ODAzOTc5fQ.eNvy_LTyUZWIli5t2aM-MV1iQuxOlrfp9wo0cQWW8B8"
}
```

### User Profile Route and Controller

The user profile route and controller handle requests related to retrieving user account information.

#### User Profile Route

The user profile route is defined in `server/routes/user.route.js`. It uses the `getUserProfile` controller to fetch the user's account details. For example, a GET request to `http://localhost:8000/api/users/account` with a valid JWT token in the Authorization header will return a JSON response with the user's profile information.

#### User Profile Controller

The user profile controller is defined in `server/controllers/user.controller.js`. It exports the `getUserProfile` function, which handles GET requests to the `/api/users/account` endpoint. This function retrieves the user's account details from the database and returns them in the response.

**Request:**

Headers:

```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**

```json
{
    "_id": "678a930536748191acff0891",
    "name": "Alice Smith",
    "email": "alice.smith@example.com",
    "phoneNumber": "+12345678901"
}
```



## Location Route and Controller

The location route and controller handle requests related to location suggestions.

### Location Route

The location route is defined in `server/routes/location.route.js`. It uses the `getSuggestions` controller to fetch location suggestions from the Nominatim OpenStreetMap API. For example, a GET request to `http://localhost:8000/api/locations/suggestions?query=alipurduar%20` will return a list of location suggestions, including details such as place ID, latitude, longitude, address, and bounding box coordinates.

### Location Controller

The location controller is defined in `server/controllers/location.controller.js`. It exports the `getSuggestions` function, which handles GET requests to the `/api/locations/suggestions` endpoint. This function queries the Nominatim OpenStreetMap API with the provided query parameter and returns a list of location suggestions in JSON format.

**Response:**

```json
[
  {
    "place_id": 222689300,
    "licence": "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright",
    "osm_type": "node",
    "osm_id": 568606431,
    "lat": "26.4851573",
    "lon": "89.5246926",
    "class": "place",
    "type": "city",
    "place_rank": 16,
    "importance": 0.4282188878241305,
    "addresstype": "city",
    "name": "Alipurduar",
    "display_name": "Alipurduar, Alipurduar - I, Alipurduar, West Bengal, 736121, India",
    "address": {
      "city": "Alipurduar",
      "county": "Alipurduar - I",
      "state_district": "Alipurduar",
      "state": "West Bengal",
      "ISO3166-2-lvl4": "IN-WB",
      "postcode": "736121",
      "country": "India",
      "country_code": "in"
    },
    "boundingbox": ["26.3251573", "26.6451573", "89.3646926", "89.6846926"]
  },
  {
    "place_id": 223524299,
    "licence": "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright",
    "osm_type": "relation",
    "osm_id": 9540776,
    "lat": "26.62881685",
    "lon": "89.45378238052393",
    "class": "boundary",
    "type": "administrative",
    "place_rank": 10,
    "importance": 0.3969391226125017,
    "addresstype": "state_district",
    "name": "Alipurduar",
    "display_name": "Alipurduar, West Bengal, India",
    "address": {
      "state_district": "Alipurduar",
      "state": "West Bengal",
      "ISO3166-2-lvl4": "IN-WB",
      "country": "India",
      "country_code": "in"
    },
    "boundingbox": ["26.3953344", "26.8622805", "89.0449223", "89.8826022"]
  }
]
```

## License

This project is licensed under the MIT License. Feel free to use, modify, and distribute as needed.
