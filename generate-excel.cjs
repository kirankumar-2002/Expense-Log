const XLSX = require('xlsx');

// Create a new workbook
const wb = XLSX.utils.book_new();

// 1. Architecture Overview (Databases, MCPs, Integrations)
const overviewData = [
  ["Category", "Name/Service", "Description", "Integration Type"],
  ["Database (Primary)", "Google Sheets", "Main source of truth for all records", "Google Apps Script API"],
  ["Database (Secondary)", "Supabase", "Relational Postgres database for backend scaling", "REST API (Client side)"],
  ["Database (Tertiary)", "Firebase Firestore", "Realtime NoSQL database for rapid sync", "Firebase Web SDK"],
  ["MCP Server", "firebase-mcp-server", "Local Model Context Protocol for Firebase management", "Local MCP connection"],
  ["MCP Server", "supabase", "Local Model Context Protocol for Supabase database management", "Local MCP connection"],
  ["Integration", "GitHub", "Version control and source code repository", "Git"],
  ["Integration", "Google Analytics", "Tracking web traffic and user engagement", "Firebase Analytics module"]
];
const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
XLSX.utils.book_append_sheet(wb, wsOverview, "Project Overview");

// 2. Triple Write System
const architectureData = [
  ["System Component", "Role", "Wait Time (Blocking)", "Format Saved"],
  ["UI Application (Frontend)", "Initiates Save", "None", "N/A"],
  ["Google Sheets", "Primary Database", "Yes (UI waits for this)", "Raw App Data (PascalCase)"],
  ["Supabase", "Secondary Database", "No (Fire-and-Forget)", "Mapped Data (snake_case)"],
  ["Firebase Firestore", "Tertiary Database", "No (Fire-and-Forget)", "Raw App Data (PascalCase)"]
];
const wsArchitecture = XLSX.utils.aoa_to_sheet(architectureData);
XLSX.utils.book_append_sheet(wb, wsArchitecture, "Triple Write System");

// 3. Keys & Identifiers (MCP, APIs, Sessions)
const keysData = [
  ["Service", "Key Type", "Value / Identifier"],
  ["Google Sheets", "Apps Script ID", "AKfycbx7WQ5WRW8TeBwGgcTbW-R0GUYyxo-koUSIP_LB1fjpTw9RS4FIJlKXnNxWfE-pVjZ_KA"],
  ["Supabase", "Project URL", "https://udpbbkcrvebyghgaqqgo.supabase.co"],
  ["Supabase", "Anon/Public Key", "sb_publishable_DUSdBZceaN1fyHYcKztjPg_Db5CYNPm"],
  ["Firebase", "Project ID", "expense-log-kiran"],
  ["Firebase", "App ID", "1:608676627450:web:a11d1685110a2188169a43"],
  ["Google Analytics", "Measurement ID", "G-TFFDN7CVFD"],
  ["MCP", "Supabase MCP", "Active via local connection"],
  ["MCP", "Firebase MCP", "Active via local connection"]
];
const wsKeys = XLSX.utils.aoa_to_sheet(keysData);
XLSX.utils.book_append_sheet(wb, wsKeys, "Keys & Identifiers");

// 4. Transactions & Outstanding Data Dictionary
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
XLSX.utils.book_append_sheet(wb, wsTx, "Transactions & Outstanding");

// 5. Accounts Data Dictionary
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
const wscols = [{wch: 25}, {wch: 35}, {wch: 45}, {wch: 30}, {wch: 20}];
wsOverview['!cols'] = wscols;
wsArchitecture['!cols'] = wscols;
wsKeys['!cols'] = wscols;
wsTx['!cols'] = wscols;
wsAccount['!cols'] = wscols;

// Write to file
XLSX.writeFile(wb, 'Expense-Log-Architecture-v2.xlsx');
console.log('Successfully updated Expense-Log-Architecture-v2.xlsx');
