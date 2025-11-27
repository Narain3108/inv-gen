"""Pydantic schemas for API requests and responses"""

from app.schemas.common import *
from app.schemas.user import *
from app.schemas.company import *
from app.schemas.client import *
from app.schemas.product import *
from app.schemas.invoice import *
from app.schemas.quotation import *
from app.schemas.customization import *

__all__ = [
    # Common
    "PaginationParams",
    "PaginatedResponse",
    # User
    "UserOut",
    "UserCreate",
    # Company
    "CompanyOut",
    "CompanyCreate",
    "CompanyUpdate",
    # Client
    "ClientOut",
    "ClientCreate",
    "ClientUpdate",
    # Product
    "ProductOut",
    "ProductCreate",
    "ProductUpdate",
    # Invoice
    "InvoiceOut",
    "InvoiceCreate",
    "InvoiceUpdate",
    "InvoiceItemOut",
    "InvoiceItemCreate",
    "PaymentOut",
    "PaymentCreate",
    # Quotation
    "QuotationOut",
    "QuotationCreate",
    "QuotationUpdate",
    # Customization
    "CustomizationOut",
    "CustomizationCreate",
]
