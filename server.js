import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import axios from 'axios';
import bodyParser from 'body-parser';

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Import the helper functions and sheet functions
import { processNames, processBirthdays, processEmailAddresses, processPhoneNumbers } from './helper.js';
import { appendUserToOAuthSheet, appendFormDataToSheet, appendToGeolocationDataSheet } from './googlesheet.js';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
console.log("env:", process.env.NODE_ENV,)

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === "production" ? process.env.PRO_URL : process.env.DEV_URL,
    credentials: true
}));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const REDIRECT_URI = process.env.REDIRECT_URI

const oAuth2Client = new OAuth2Client(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

// API endpoint to gather google-oauth credentials and decode them
app.post('/api/google-auth', async (req, res) => {
    const { code } = req.body;
    console.log("Auth-code:", code);

    try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        console.log("Tokens Response:", tokens);

        const people = google.people({ version: 'v1', auth: oAuth2Client });

        const profile = await people.people.get({
            resourceName: 'people/me',
            personFields: 'names,emailAddresses,locations,birthdays,phoneNumbers'
        });

        console.log("Profile Data:", profile.data);

        const names = (profile.data.names) || [];
        const birthdays = (profile.data.birthdays) || [];
        const emailAddresses = (profile.data.emailAddresses) || [];
        const phoneNumbers = (profile.data.phoneNumbers) || [];

        const userName = processNames(names);
        const userBirthday = processBirthdays(birthdays);
        const userEmailAddress = processEmailAddresses(emailAddresses);
        const userPhoneNumber = processPhoneNumbers(phoneNumbers);

        // Append to OAuth-specific sheet
        const result = await appendUserToOAuthSheet({
            name: userName,
            birthdate: userBirthday,
            email: userEmailAddress,
            phone: userPhoneNumber
        });

        console.log("OAuth data appended to spreadsheet successfully!!");

        res.status(200).json({
            status: "success",
            data: profile.data,
            sheetInfo: result
        });

    } catch (error) {
        console.error('Error during Google Auth process:', error);
        res.status(500).json({
            status: "error",
            message: "Failed to process Google authentication.",
            error: error.message
        });
    }
});

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

        // Append to form-specific sheet
        const result = await appendFormDataToSheet({
            name,
            email,
            phone,
            checkIn: formattedCheckIn,
            checkOut: formattedCheckOut,
            timestamp
        });

        console.log("Form data appended to spreadsheet successfully!!");

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
            sheetInfo: result
        });
    } catch (error) {
        console.error('Error submitting form:', error);
        res.status(500).json({ error: 'Failed to submit form' });
    }
});

app.get('/', async (req, res) => {
  try {
    console.log("received ping request");
    // Get client IP address (supports proxies)
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress;

    // Use public IP for localhost
    const ipToLookup = (ip === '::1' || ip === '127.0.0.1') ? '8.8.8.8' : ip;

    // Fetch geolocation data
    const geoResp = await axios.get(`https://ipapi.co/${ipToLookup}/json/`);
    const geoData = geoResp.data;

    // Append to Google Sheet
    try {
      await appendToGeolocationDataSheet({
        ip: ipToLookup,
        city: geoData.city || '',
        region: geoData.region || '',
        country: geoData.country_name || '',
        latitude: geoData.latitude || '',
        longitude: geoData.longitude || '',
      });
    } catch (sheetError) {
      console.error("Failed to log geolocation data to sheet:", sheetError.message);
    }

    // Send response
    res.json({
      message: "Welcome to Dreamcation Backend",
      ip: ipToLookup,
      location: {
        city: geoData.city,
        region: geoData.region,
        country: geoData.country_name,
        latitude: geoData.latitude,
        longitude: geoData.longitude,
      },
    });

  } catch (error) {
    console.error("Geolocation lookup failed:", error.message);
    res.status(500).json({
      message: "Welcome to Dreamcation Backend",
      error: "Failed to fetch geolocation",
    });
  }
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