import { google } from 'googleapis'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function getSheetsClient() {
  const credentialsPath = join(process.cwd(), 'googleSheets', 'credentials.json')
  const credentials = JSON.parse(readFileSync(credentialsPath, 'utf-8'))

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })

  const sheets = google.sheets({ auth })
  return sheets
}

export async function getSheetData(spreadsheetId: string, range: string) {
  const sheets = await getSheetsClient()
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  })

  return response.data.values
}