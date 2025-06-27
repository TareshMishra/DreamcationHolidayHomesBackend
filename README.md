# 🌴 Dreamcation Backend

This is the **Dreamcation backend**, a Node.js and Express.js server that accepts form submissions and stores them in a Google Sheet using the Google Sheets API. It also includes a keep-alive mechanism to prevent sleeping on platforms like Render.

---

## 🚀 Features

- Accepts user form submissions (`/submit-form`)
- Appends data to a Google Sheet
- Automatically formats check-in and check-out dates
- Adds submission timestamps
- Validates required fields
- Environment-aware CORS setup
- Keep-alive ping to keep backend active on Render

---

## 🏗️ Tech Stack

- Node.js
- Express.js
- Google Sheets API
- Axios
- dotenv
- cors
- cookie-parser

---

## 📁 Project Structure

.
├── credentials.json # Google Service Account credentials
├── .env # Environment variables
├── index.js # Main Express server
└── README.md # Project documentation

---

## ⚙️ Setup Instructions

### 1. Clone the repository
git clone https://github.com/your-username/dreamcation-backend.git
cd dreamcation-backend

2. Install dependencies
bash
Copy
Edit
npm install
3. Create .env file
Create a .env file in the root directory and add the following:

PORT=3000
NODE_ENV=development
DEV_URL=http://localhost:3000
PRO_URL=https://your-production-frontend-url.com
SPREADSHEET_ID=your_google_spreadsheet_id
4. Add credentials.json
Download your service account key file from Google Cloud Console and place it in the root directory as credentials.json.

🧪 Running the Server
npm start
Server will start on http://localhost:3000 by default or on the port specified in .env.

📬 API Endpoint
POST /submit-form
Request Body:

json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "checkIn": "2025-06-01",
  "checkOut": "2025-06-05"
}
Successful Response:

json
{
  "message": "Form submitted successfully",
  "formData": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "checkIn": "2025-06-01",
    "checkOut": "2025-06-05",
    "timestamp": "29 May 2025, 12:00:00 PM IST"
  }
}
Error Response (Missing Fields):
json
{
  "error": "Missing required fields"
}

🌐 CORS Setup
The server uses dynamic CORS configuration:

In development, allows requests from DEV_URL

In production, allows requests from PRO_URL

🔁 Keep-Alive Ping (for Render)
To prevent Render from putting the server to sleep, a keep-alive ping is sent every 14 minutes:

js
Copy
Edit
https://dreamcation-backend-1.onrender.com
This is handled automatically using axios.

🔐 Environment Variables
Key	Description
PORT	Port number to run the server
NODE_ENV	development or production
DEV_URL	Allowed CORS origin for dev
PRO_URL	Allowed CORS origin for production
SPREADSHEET_ID	Google Sheet ID where data is stored

✅ Dependencies
express
dotenv
cors
cookie-parser
axios
googleapis
