import * as XLSX from 'xlsx'

const workbook = XLSX.readFile('/Users/rafaelcardoso/VENDAS 2025.xlsx')

console.log("Sheet names:", workbook.SheetNames)

for (const sheetName of workbook.SheetNames) {
  console.log(`\n=== ${sheetName} ===`)
  const sheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 })

  // Show first 40 rows
  for (let i = 0; i < Math.min(40, data.length); i++) {
    const row = data[i] as unknown[]
    if (row && row.some(cell => cell !== undefined && cell !== null && cell !== '')) {
      console.log(`Row ${i}: ${JSON.stringify(row)}`)
    }
  }
}
