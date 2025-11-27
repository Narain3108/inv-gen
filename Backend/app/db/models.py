"""
Database Models
SQLAlchemy ORM models for all entities
"""

from datetime import datetime, date
from decimal import Decimal
from typing import List, Optional
from uuid import uuid4

from sqlalchemy import (
    Boolean, CheckConstraint, Date, DateTime, ForeignKey, 
    Integer, Numeric, String, Text, UniqueConstraint, text
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


# ==================== Users ====================

class User(Base, TimestampMixin):
    """User accounts"""
    __tablename__ = "users"
    
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    photo_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Legacy Firestore ID for migration tracking
    legacy_firebase_uid: Mapped[Optional[str]] = mapped_column(String(128), unique=True, nullable=True, index=True)
    
    # Relationships
    companies: Mapped[List["Company"]] = relationship("Company", back_populates="owner", cascade="all, delete-orphan")


# ==================== Companies ====================

class Company(Base, TimestampMixin):
    """Company/Business entities"""
    __tablename__ = "companies"
    
    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    gstin: Mapped[Optional[str]] = mapped_column(String(15), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    pan: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # JSON fields for structured data
    address: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    contact: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    bank_details: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    invoice_numbering: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    quotation_numbering: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    
    # Media URLs
    logo_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    signature_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Default terms and conditions
    terms_and_conditions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    additional_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Legacy ID
    legacy_id: Mapped[Optional[str]] = mapped_column(String(128), unique=True, nullable=True, index=True)
    
    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="companies")
    products: Mapped[List["Product"]] = relationship("Product", back_populates="company", cascade="all, delete-orphan")
    invoices: Mapped[List["Invoice"]] = relationship("Invoice", back_populates="company", cascade="all, delete-orphan")
    quotations: Mapped[List["Quotation"]] = relationship("Quotation", back_populates="company", cascade="all, delete-orphan")


# ==================== Clients ====================

class Client(Base, TimestampMixin):
    """Client/Customer entities"""
    __tablename__ = "clients"
    
    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    
    # Optional company scoping (null = global client)
    company_id: Mapped[Optional[UUID]] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("companies.id", ondelete="SET NULL"), 
        nullable=True, 
        index=True
    )
    
    client_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    gstin: Mapped[Optional[str]] = mapped_column(String(15), nullable=True)
    pan: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    auto_fetched: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # JSON fields
    address: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    contact: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    bank_details: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    billing_address: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    shipping_address: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    
    # Legacy ID
    legacy_id: Mapped[Optional[str]] = mapped_column(String(128), unique=True, nullable=True, index=True)
    
    # Relationships
    company: Mapped[Optional["Company"]] = relationship("Company")
    invoices: Mapped[List["Invoice"]] = relationship("Invoice", back_populates="client")
    quotations: Mapped[List["Quotation"]] = relationship("Quotation", back_populates="client")


# ==================== Product Categories ====================

class ProductCategory(Base, TimestampMixin):
    """Global product categories"""
    __tablename__ = "product_categories"
    
    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    category_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    default_gst_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    
    # Store products as JSONB array
    products: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    
    # Legacy ID
    legacy_id: Mapped[Optional[str]] = mapped_column(String(128), unique=True, nullable=True)
    
    # Relationships
    product_items: Mapped[List["Product"]] = relationship("Product", back_populates="category")


# ==================== Products ====================

class Product(Base, TimestampMixin):
    """Products and Services"""
    __tablename__ = "products"
    
    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    company_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("companies.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True
    )
    category_id: Mapped[Optional[UUID]] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("product_categories.id", ondelete="SET NULL"), 
        nullable=True
    )
    
    product_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    item_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    hsn: Mapped[str] = mapped_column(String(20), nullable=False)
    unit: Mapped[str] = mapped_column(String(50), nullable=False)
    
    price: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    gst_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    cess_rate: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True)
    stock: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    type: Mapped[str] = mapped_column(String(10), nullable=False)
    has_serial_number: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Legacy ID
    legacy_id: Mapped[Optional[str]] = mapped_column(String(128), unique=True, nullable=True, index=True)
    
    # Constraints
    __table_args__ = (
        CheckConstraint("type IN ('product', 'service')", name="product_type_check"),
    )
    
    # Relationships
    company: Mapped["Company"] = relationship("Company", back_populates="products")
    category: Mapped[Optional["ProductCategory"]] = relationship("ProductCategory", back_populates="product_items")
    invoice_items: Mapped[List["InvoiceItem"]] = relationship("InvoiceItem", back_populates="product")
    quotation_items: Mapped[List["QuotationItem"]] = relationship("QuotationItem", back_populates="product")


# ==================== Invoices ====================

class Invoice(Base, TimestampMixin):
    """Invoice documents"""
    __tablename__ = "invoices"
    
    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    company_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("companies.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True
    )
    client_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("clients.id", ondelete="RESTRICT"), 
        nullable=False, 
        index=True
    )
    
    invoice_number: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    
    # Financial totals
    total_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    total_amount_in_words: Mapped[str] = mapped_column(Text, nullable=False)
    taxable_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    cgst: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    sgst: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    igst: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    
    # Tax breakdown as JSON
    tax_breakdown: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    
    # Payment tracking
    payment_status: Mapped[str] = mapped_column(
        String(20), 
        nullable=False, 
        default="pending",
        index=True
    )
    amount_paid: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    amount_pending: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    
    # Legacy ID
    legacy_id: Mapped[Optional[str]] = mapped_column(String(128), unique=True, nullable=True, index=True)
    
    # Constraints
    __table_args__ = (
        CheckConstraint(
            "payment_status IN ('pending', 'partially_paid', 'paid')", 
            name="invoice_payment_status_check"
        ),
    )
    
    # Relationships
    company: Mapped["Company"] = relationship("Company", back_populates="invoices")
    client: Mapped["Client"] = relationship("Client", back_populates="invoices")
    items: Mapped[List["InvoiceItem"]] = relationship(
        "InvoiceItem", 
        back_populates="invoice", 
        cascade="all, delete-orphan",
        order_by="InvoiceItem.id"
    )
    payments: Mapped[List["Payment"]] = relationship(
        "Payment", 
        back_populates="invoice", 
        cascade="all, delete-orphan"
    )


class InvoiceItem(Base, TimestampMixin):
    """Invoice line items"""
    __tablename__ = "invoice_items"
    
    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    invoice_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("invoices.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True
    )
    product_id: Mapped[Optional[UUID]] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("products.id", ondelete="SET NULL"), 
        nullable=True
    )
    
    item_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    hsn: Mapped[str] = mapped_column(String(20), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    unit: Mapped[str] = mapped_column(String(50), nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    discount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    
    gst_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    cess_rate: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True, default=0)
    
    cgst: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    sgst: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    igst: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    cess: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    
    line_total: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    
    # Serial numbers as array
    serial_numbers: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String), nullable=True)
    
    # Relationships
    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="items")
    product: Mapped[Optional["Product"]] = relationship("Product", back_populates="invoice_items")


class Payment(Base, TimestampMixin):
    """Payment records for invoices"""
    __tablename__ = "payments"
    
    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    invoice_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("invoices.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True
    )
    
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    payment_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    payment_mode: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    reference_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=text("now()"),
        nullable=False
    )
    
    # Relationships
    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="payments")


# ==================== Quotations ====================

class Quotation(Base, TimestampMixin):
    """Quotation/Estimate documents"""
    __tablename__ = "quotations"
    
    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    company_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("companies.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True
    )
    client_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("clients.id", ondelete="RESTRICT"), 
        nullable=False, 
        index=True
    )
    
    quotation_number: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    valid_until: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    status: Mapped[str] = mapped_column(
        String(20), 
        nullable=False, 
        default="pending",
        index=True
    )
    
    # Financial totals
    total_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    total_amount_in_words: Mapped[str] = mapped_column(Text, nullable=False)
    taxable_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    cgst: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    sgst: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    igst: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    
    tax_breakdown: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    
    # Conversion tracking
    converted_to_invoice_id: Mapped[Optional[UUID]] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("invoices.id", ondelete="SET NULL"), 
        nullable=True
    )
    
    # Legacy ID
    legacy_id: Mapped[Optional[str]] = mapped_column(String(128), unique=True, nullable=True, index=True)
    
    # Constraints
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'accepted', 'rejected', 'converted', 'expired')", 
            name="quotation_status_check"
        ),
    )
    
    # Relationships
    company: Mapped["Company"] = relationship("Company", back_populates="quotations")
    client: Mapped["Client"] = relationship("Client", back_populates="quotations")
    items: Mapped[List["QuotationItem"]] = relationship(
        "QuotationItem", 
        back_populates="quotation", 
        cascade="all, delete-orphan",
        order_by="QuotationItem.id"
    )
    converted_invoice: Mapped[Optional["Invoice"]] = relationship("Invoice", foreign_keys=[converted_to_invoice_id])


class QuotationItem(Base, TimestampMixin):
    """Quotation line items"""
    __tablename__ = "quotation_items"
    
    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    quotation_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("quotations.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True
    )
    product_id: Mapped[Optional[UUID]] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("products.id", ondelete="SET NULL"), 
        nullable=True
    )
    
    item_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    hsn: Mapped[str] = mapped_column(String(20), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    unit: Mapped[str] = mapped_column(String(50), nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    discount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    
    gst_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    cess_rate: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True, default=0)
    
    cgst: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    sgst: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    igst: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    cess: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    
    line_total: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    
    serial_numbers: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String), nullable=True)
    
    # Relationships
    quotation: Mapped["Quotation"] = relationship("Quotation", back_populates="items")
    product: Mapped[Optional["Product"]] = relationship("Product", back_populates="quotation_items")


# ==================== Customizations ====================

class Customization(Base, TimestampMixin):
    """Invoice/Quotation customizations per company"""
    __tablename__ = "customizations"
    
    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    company_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("companies.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True
    )
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    
    # Store full customization as JSONB
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    
    # Unique constraint: one customization per company per type
    __table_args__ = (
        UniqueConstraint("company_id", "type", name="uq_company_customization_type"),
        CheckConstraint("type IN ('invoice', 'quotation')", name="customization_type_check"),
    )
    
    # Relationships
    company: Mapped["Company"] = relationship("Company")
