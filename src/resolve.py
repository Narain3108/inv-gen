import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.config import Config
from src.services.google_sheets import GoogleSheetsService

def main():
    if len(sys.argv) < 2:
        print("Usage: python resolve.py <ISSUE_NUMBER>")
        sys.exit(1)

    issue_number = sys.argv[1]

    try:
        Config.validate()
    except ValueError as e:
        print(f"Configuration Error: {e}")
        sys.exit(1)

    print(f"Connecting to Google Sheets to resolve Issue #{issue_number}...")
    sheets = GoogleSheetsService(
        credentials_path=Config.GOOGLE_CREDENTIALS_FILE,
        spreadsheet_id=Config.SPREADSHEET_ID,
        worksheet_name=Config.WORKSHEET_NAME
    )

    row = sheets.find_row_by_issue_number(issue_number)
    
    if not row:
        print(f"Warning: Could not find a row with number '{issue_number}' in the spreadsheet.")
        sys.exit(0) # Exit cleanly so GitHub Action doesn't fail if they deleted the row

    col_indices = sheets.get_column_indices()
    status_col = col_indices.get('Status')

    if not status_col:
        print("Warning: Could not find 'Status' column in the spreadsheet. Cannot update status.")
        sys.exit(0)

    try:
        sheets.mark_completed(row['_row_index'], status_col)
        print(f"Successfully marked Issue #{issue_number} (Row {row['_row_index']}) as 'Completed'.")
    except Exception as e:
        print(f"Failed to update spreadsheet: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
