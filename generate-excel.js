const XLSX = require('xlsx');

// Create a new workbook
const wb = XLSX.utils.book_new();

// 1. Triple Write System Architecture
const architectureData = [
  ["System Component", "Role", "Wait Time (Blocking)", "Format Saved"],
  ["UI Application (Frontend)", "Initiates Save", "None", "N/A"],
  ["Google Sheets", "Primary Database", "Yes (UI waits for this)", "Raw App Data (PascalCase)"],
  ["Supabase", "Secondary Database", "No (Fire-and-Forget)", "Mapped Data (snake_case)"],
  ["Firebase Firestore", "Tertiary Database", "No (Fire-and-Forget)", "Raw App Data (PascalCase)"]
];
const wsArchitecture = XLSX.utils.aoa_to_sheet(architectureData);
XLSX.utils.book_append_sheet(wb, wsArchitecture, "Triple Write System");

// 2. Transactions & Outstanding Data Dictionary
const txData = [
  ["App Key (Frontend)", "Description", "Google Sheets Key", "Supabase Key", "Firebase Key"],
  ["ID", "Unique string identifier", "ID", "id", "ID"],
  ["Date", "Date of transaction (YYYY-MM-DD)", "Date", "date", "Date"],
  ["Amount", "Numerical value", "Amount", "amount", "Amount"],
  ["State", "Payable / Receivable", "State", "state", "State"],
  ["Category", "Main category", "Category", "category", "Category"],
  ["Sub-Category", "Sub category", "Sub-Category", "sub_category", "Sub-Category"],
  ["Status", "Pending / Cleared", "Status", "status", "Status"],
  ["Accounts", "Associated Account name", "Accounts", "accounts", "Accounts"],
  ["Desc", "Description of entry", "Desc", "description", "Desc"],
  ["Notes", "Additional notes", "Notes", "notes", "Notes"]
];
const wsTx = XLSX.utils.aoa_to_sheet(txData);
XLSX.utils.book_append_sheet(wb, wsTx, "Transactions & Outstanding Format");

// 3. Accounts Data Dictionary
const accountData = [
  ["App Key (Frontend)", "Description", "Google Sheets Key", "Supabase Key", "Firebase Key"],
  ["id", "Unique string identifier", "id", "id", "id"],
  ["name", "Account Name", "name", "name", "name"],
  ["bank", "Bank Name", "bank", "bank", "bank"],
  ["type", "Account Type", "type", "type", "type"],
  ["balance", "Current Balance", "balance", "balance", "balance"],
  ["standardBalance", "Initial/Standard Balance", "standardBalance", "standard_balance", "standardBalance"],
  ["Month", "Associated Month", "Month", "month", "Month"],
  ["lastUpdated", "Timestamp of last update", "lastUpdated", "last_updated", "lastUpdated"]
];
const wsAccount = XLSX.utils.aoa_to_sheet(accountData);
XLSX.utils.book_append_sheet(wb, wsAccount, "Accounts Format");

// Set column widths for better readability
const wscols = [{wch: 25}, {wch: 35}, {wch: 20}, {wch: 20}, {wch: 20}];
wsArchitecture['!cols'] = wscols;
wsTx['!cols'] = wscols;
wsAccount['!cols'] = wscols;

// Write to file
XLSX.writeFile(wb, 'Expense-Log-Architecture-Format.xlsx');
console.log('Successfully generated Expense-Log-Architecture-Format.xlsx');
