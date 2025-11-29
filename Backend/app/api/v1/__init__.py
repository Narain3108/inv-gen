"""API v1 router aggregation - Using Firestore"""

from fastapi import APIRouter
from app.api.v1 import (
    auth_firestore,
    users_firestore,
    companies_firestore,
    clients_firestore,
    products_firestore,
    invoices_firestore,
    quotations_firestore,
    customizations_firestore,
    product_categories_firestore
)

api_router = APIRouter()

# AUTH
api_router.include_router(auth_firestore.router, prefix="/auth", tags=["Auth"])

# GLOBAL COLLECTIONS
api_router.include_router(users_firestore.router, prefix="/users", tags=["Users (Global)"])
api_router.include_router(companies_firestore.router, prefix="/companies", tags=["Companies (Global)"])
api_router.include_router(clients_firestore.router, prefix="/clients", tags=["Clients (Global)"])
api_router.include_router(products_firestore.router, prefix="/products", tags=["Products (Global)"])

# COMPANY SUBCOLLECTIONS (nested under companies/{company_id})
api_router.include_router(invoices_firestore.router, prefix="/invoices", tags=["Invoices (Company Subcollection)"])
api_router.include_router(quotations_firestore.router, prefix="/quotations", tags=["Quotations (Company Subcollection)"])
api_router.include_router(customizations_firestore.router, tags=["Customizations (Company Subcollection)"])
api_router.include_router(product_categories_firestore.router, prefix="/categories", tags=["Product Categories (Global)"])
api_router.include_router(product_categories_firestore.router, prefix="/product-categories", tags=["Product Categories (Global)"])
