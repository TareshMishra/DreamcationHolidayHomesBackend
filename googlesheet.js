import { google } from 'googleapis';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');

// Setup Google Auth
const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
});

const sheets = google.sheets({ version: 'v4', auth });

// Function to create or get a spreadsheet
async function createOrGetSpreadsheet(sheetName, headers) {
    try {
        const authClient = await auth.getClient();
        const drive = google.drive({ version: 'v3', auth: authClient });

        // Search for existing spreadsheet
        const query = `mimeType='application/vnd.google-apps.spreadsheet' and name='${sheetName}'`;
        const res = await drive.files.list({
            q: query,
            fields: 'files(id, name)',
            spaces: 'drive',
        });

        let spreadsheetId;

        if (res.data.files.length > 0) {
            spreadsheetId = res.data.files[0].id;
            console.log(`✅ Found existing sheet: ${sheetName} (${spreadsheetId})`);
        } else {
            // Create new spreadsheet
            const createRes = await sheets.spreadsheets.create({
                resource: {
                    properties: { title: sheetName },
                    sheets: [{
                        properties: { title: 'Sheet1' },
                        data: [{
                            startRow: 0,
                            startColumn: 0,
                            rowData: [{
                                values: headers.map(header => ({
                                    userEnteredValue: { stringValue: header }
                                })),
                            }],
                        }],
                    }],
                },
            });

            spreadsheetId = createRes.data.spreadsheetId;
            console.log(`📄 Created new sheet: ${sheetName} (${spreadsheetId})`);

            // Share the sheet with your personal Google account
            try {
                await drive.permissions.create({
                    fileId: spreadsheetId,
                    requestBody: {
                        role: 'writer',
                        type: 'user',
                        emailAddress: 'dreamcationholidayhome@gmail.com',
                    }
                });
                console.log(`🔗 Sheet ${sheetName} shared with dreamcationholidayhome@gmail.com`);
            } catch (shareError) {
                console.warn(`⚠️ Could not share sheet ${sheetName}:`, shareError.message);
            }
        }

        return { spreadsheetId, sheetName };
    } catch (error) {
        console.error(`❌ Error in createOrGetSpreadsheet for ${sheetName}:`, error);
        throw error;
    }
}

// Function to append OAuth user data
export async function appendUserToOAuthSheet({
    name,
    birthdate,
    email,
    phone,
}) {
    try {
        const authClient = await auth.getClient(); // ✅ Get the client here
        const sheetName = 'dreamcation-oauth-data-new';
        const headers = ['Name', 'Birthdate', 'Email Address', 'Phone Number', 'Timestamp'];

        const spreadsheetId = "1DOFx_BwHIJTb9O-SHT28namwgkbx_k5jD8z2rhR3Ex8"

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

        const appendRes = await sheets.spreadsheets.values.append({
            auth: authClient, // ✅ Pass the authenticated client
            spreadsheetId,
            range: 'Sheet1!A:E',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [[name, birthdate, email, phone, timestamp]],
            },
        });

        console.log(`🟢 Appended OAuth user: ${name}, ${birthdate}, ${email}, ${phone}`);
        console.log(`📊 Updated range: ${appendRes.data.updates.updatedRange}`);

        return {
            success: true,
            spreadsheetId,
            sheetName,
            updatedRange: appendRes.data.updates.updatedRange,
            sheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
        };

    } catch (error) {
        console.error('❌ Error in appendUserToOAuthSheet:', error.response?.data || error.message);
        throw error;
    }
}


// Function to append form submission data
export async function appendFormDataToSheet({
    name,
    email,
    phone,
    checkIn,
    checkOut,
    timestamp
}) {
    try {
        const authClient = await auth.getClient(); // ✅ Get client
        const sheetName = 'dreamcation-form-submissions-new';
        const headers = ['Name', 'Email', 'Phone', 'Check-in', 'Check-out', 'TimeStamps'];

        const spreadsheetId = "1y63Ih5EHrMQxKj_6lSTK1OhUQVWK84KMxT1jhmb8gA4"

        const appendRes = await sheets.spreadsheets.values.append({
            auth: authClient,
            spreadsheetId,
            range: 'data!A:F', // ✅ FIXED here
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [[name, email, phone, checkIn, checkOut, timestamp]],
            },
        });

        console.log(`🟢 Appended form data: ${name}, ${email}, ${phone}, ${checkIn}, ${checkOut}`);
        console.log(`📊 Updated range: ${appendRes.data.updates.updatedRange}`);

        return {
            success: true,
            spreadsheetId,
            sheetName,
            updatedRange: appendRes.data.updates.updatedRange,
            sheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
        };

    } catch (error) {
        console.error('❌ Error in appendFormDataToSheet:', error.response?.data || error.message);
        throw error;
    }
}