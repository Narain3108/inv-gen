import gspread
from google.oauth2.service_account import Credentials

class GoogleSheetsService:
    def __init__(self, credentials_path: str, spreadsheet_id: str, worksheet_name: str):
        self.scopes = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive"
        ]
        self.credentials = Credentials.from_service_account_file(credentials_path, scopes=self.scopes)
        self.client = gspread.authorize(self.credentials)
        self.spreadsheet = self.client.open_by_key(spreadsheet_id)
        self.worksheet = self.spreadsheet.worksheet(worksheet_name)

    def fetch_unprocessed_tasks(self) -> list[dict]:
        """
        Returns a list of dicts for rows where the 'number' column is empty
        (meaning it hasn't been provisioned in GitHub yet).
        Also includes the original row index (1-based) to update it later.
        """
        records = self.worksheet.get_all_records()
        unprocessed = []
        for i, raw_row in enumerate(records, start=2): # 1 is header, so row 2 is index 0 of records
            # Strip whitespace from keys to prevent errors with hidden spaces in sheet headers
            row = {str(k).strip(): v for k, v in raw_row.items()}
            
            # Assume 'Issue id' column stores the GitHub issue ID. If it's empty, it's unprocessed.
            if not row.get('Issue id'):
                row['_row_index'] = i
                # Check if the row actually has any content to avoid processing totally blank rows
                if any(str(v).strip() for k, v in row.items() if k != '_row_index'):
                    unprocessed.append(row)
        return unprocessed

    def mark_provisioned(self, row_index: int, number_col_index: int, issue_number: int, status_col_index: int = None):
        """
        Updates the row to record the created GitHub issue number and optionally updates status to 'In Progress'.
        """
        # Update the 'number' cell
        self.worksheet.update_cell(row_index, number_col_index, str(issue_number))
        
        # Optionally update the status cell if a status column exists
        if status_col_index:
            self.worksheet.update_cell(row_index, status_col_index, 'In Progress')

    def find_row_by_issue_number(self, issue_number: str) -> dict:
        """
        Finds the row corresponding to the given issue number.
        Returns the row data with its index, or None if not found.
        """
        records = self.worksheet.get_all_records()
        for i, raw_row in enumerate(records, start=2):
            row = {str(k).strip(): v for k, v in raw_row.items()}
            # Check if the cell value matches the issue number (as string or int)
            if str(row.get('Issue id', '')) == str(issue_number):
                row['_row_index'] = i
                return row
        return None

    def mark_completed(self, row_index: int, status_col_index: int):
        """
        Updates the status column of the row to 'Completed'.
        """
        self.worksheet.update_cell(row_index, status_col_index, 'Completed')
        
    def get_column_indices(self) -> dict:
        """
        Returns a dictionary mapping header names to their 1-based column index.
        Useful for update_cell() which requires exact column numbers.
        """
        headers = self.worksheet.row_values(1)
        return {str(header).strip(): i for i, header in enumerate(headers, start=1)}
