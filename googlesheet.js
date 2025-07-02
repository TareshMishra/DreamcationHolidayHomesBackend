import { google } from 'googleapis';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
// Setup Google Auth
const auth = new google.auth.GoogleAuth({
    credentials: credentials,
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
                auth: authClient,
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
                        emailAddress: 'dreamcationholidayhome@gmail.com' ,  // Replace with your email
                    }
                });
                console.log(`🔗 Sheet ${sheetName} shared with dreamcationholidayhome@gmail.com`);
            } catch (shareError) {
                console.warn(`⚠️ Could not share sheet ${sheetName}:`, shareError.message);
            }

            // Make the sheet publicly viewable (optional)
            // try {
            //     await drive.permissions.create({
            //         fileId: spreadsheetId,
            //         requestBody: {
            //             role: 'reader',
            //             type: 'anyone'
            //         }
            //     });
            //     console.log(`🌐 Sheet ${sheetName} made publicly viewable`);
            // } catch (publicError) {
            //     console.warn(`⚠️ Could not make sheet ${sheetName} public:`, publicError.message);
            // }
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
        const authClient = await auth.getClient();
        const sheetName = 'dreamcation-oauth-data';
        const headers = ['Name', 'Birthdate', 'Email Address', 'Phone Number', 'Timestamp'];
        
        const { spreadsheetId } = await createOrGetSpreadsheet(sheetName, headers);

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

        // Append the row
        const appendRes = await sheets.spreadsheets.values.append({
            auth: authClient,
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
        console.error('❌ Error in appendUserToOAuthSheet:', error);
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
        const authClient = await auth.getClient();
        const sheetName = 'dreamcation-form-submissions';
        const headers = ['Name', 'Email', 'Phone', 'Check In', 'Check Out', 'Submission Time'];
        
        const { spreadsheetId } = await createOrGetSpreadsheet(sheetName, headers);

        // Append the row
        const appendRes = await sheets.spreadsheets.values.append({
            auth: authClient,
            spreadsheetId,
            range: 'Sheet1!A:F',
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
        console.error('❌ Error in appendFormDataToSheet:', error);
        throw error;
    }
}

// Function to get sheet URLs for client access
// export async function getSheetUrls() {
//     try {
//         const authClient = await auth.getClient();
//         const drive = google.drive({ version: 'v3', auth: authClient });

//         const oAuthQuery = "mimeType='application/vnd.google-apps.spreadsheet' and name='dreamcation-oauth-data'";
//         const formQuery = "mimeType='application/vnd.google-apps.spreadsheet' and name='dreamcation-form-submissions'";

//         const [oAuthRes, formRes] = await Promise.all([
//             drive.files.list({ q: oAuthQuery, fields: 'files(id, name)' }),
//             drive.files.list({ q: formQuery, fields: 'files(id, name)' })
//         ]);

//         const result = {
//             oAuthSheet: null,
//             formSheet: null
//         };

//         if (oAuthRes.data.files.length > 0) {
//             const id = oAuthRes.data.files[0].id;
//             result.oAuthSheet = {
//                 id,
//                 name: 'dreamcation-oauth-data',
//                 url: `https://docs.google.com/spreadsheets/d/${id}/edit`
//             };
//         }

//         if (formRes.data.files.length > 0) {
//             const id = formRes.data.files[0].id;
//             result.formSheet = {
//                 id,
//                 name: 'dreamcation-form-submissions',
//                 url: `https://docs.google.com/spreadsheets/d/${id}/edit`
//             };
//         }

//         return result;
//     } catch (error) {
//         console.error('❌ Error getting sheet URLs:', error);
//         throw error;
//     }
// }