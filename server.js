import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import axios from 'axios';
import { google } from 'googleapis';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
console.log("envvv", process.env.NODE_ENV,)
// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === "production" ? process.env.PRO_URL : process.env.DEV_URL,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Load service account credentials
const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
});
console.log(auth)
// Spreadsheet config
const spreadsheetId = process.env.SPREADSHEET_ID;
const sheetName = 'data';
const range = `${sheetName}!A:F`;

// Check for missing spreadsheet ID
if (!spreadsheetId) {
    console.error("Error: 'spreadsheet_ID' is missing in environment variables.");
    process.exit(1);
}

// API endpoint to submit form data
app.post('/submit-form', async (req, res) => {

    try {
        const { name, email, phone, checkIn, checkOut } = req.body;
        console.log("form data", req.body)

        if (!name || !email || !phone || !checkIn || !checkOut) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const formattedCheckIn = new Date(checkIn).toISOString().split('T')[0];

        const formattedCheckOut = new Date(checkOut).toISOString().split('T')[0];
        console.log("formattedCheckIn", formattedCheckIn)
        console.log("formattedCheckOut", formattedCheckOut)
        const timestamp = new Date().toLocaleString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZoneName: 'short'
        });

        console.log("timestamp", timestamp)
        const client = await auth.getClient();
        console.log("client", client)
        const googleSheets = google.sheets({ version: 'v4', auth: client });

        // const response = await googleSheets.spreadsheets.values.append({
        //     auth,
        //     spreadsheetId,
        //     range,
        //     valueInputOption: 'USER_ENTERED',
        //     resource: {
        //         values: [[name, email, phone, formattedCheckIn, formattedCheckOut, timestamp]],
        //     },
        // });


        console.log("response", response)
        console.log('Data submitted successfully:', response.data);
        res.status(200).json({
            message: 'Form submitted successfully',
            formData: {
                name,
                email,
                phone,
                checkIn: formattedCheckIn,
                checkOut: formattedCheckOut,
                timestamp,
            },
        });
    } catch (error) {
        console.error('Error submitting form:', error);
        res.status(500).json({ error: 'Failed to submit form' });
    }
});

// Root route
app.get('/', (req, res) => {
    res.send("Welcome to Dreamcation Backend");
});

// Keep-alive ping to prevent Render sleep
const keepAlive = () => {
    const url = "https://dreamcationHolidayHomesBackend.onrender.com";
    setInterval(async () => {
        try {
            const res = await axios.get(url);
            console.log("🔁 Keep-alive ping sent, status:", res.status);
        } catch (error) {
            console.error("⚠️ Keep-alive ping failed:", error.message);
        }
    }, 840000); // every 14 minutes
};

keepAlive();

app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});
