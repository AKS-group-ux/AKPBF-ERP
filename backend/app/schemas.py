from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from decimal import Decimal
import datetime
from uuid import UUID

# ==========================================
# 1. SECURITY & AUTHENTICATION SCHEMAS
# ==========================================
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ==========================================
# 2. USER PROFILE SCHEMA
# ==========================================
class UserBase(BaseModel):
    email: EmailStr
    phone: str
    full_name: str
    role: str

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: UUID
    is_active: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# ==========================================
# 3. CRM LEADS
# ==========================================
class CRMLeadCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    company_name: Optional[str] = None
    neighborhood: str
    message: Optional[str] = None

class CRMLeadRead(CRMLeadCreate):
    id: UUID
    status: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# ==========================================
# 4. SUBSCRIPTION PLANS
# ==========================================
class SubscriptionPlanBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: Decimal
    duration_days: int = 30
    pickup_quota: int = 8
    frequency_weekly: int = 2

class SubscriptionPlanCreate(SubscriptionPlanBase):
    pass

class SubscriptionPlanRead(SubscriptionPlanBase):
    id: UUID
    is_active: bool

    class Config:
        from_attributes = True


# ==========================================
# 5. SUBSCRIBER (CUSTOMER) SCHEMAS
# ==========================================
class SubscriberBase(BaseModel):
    customer_type: str = "Particulier" # Particulier, Entreprise etc.
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_name: Optional[str] = None
    phone: str
    email: EmailStr
    address_street: str
    neighborhood: str
    sector: Optional[str] = None
    city: str = "Abidjan"
    latitude: Decimal
    longitude: Decimal
    bin_rfid_uid: str

class SubscriberCreate(SubscriberBase):
    plan_id: UUID

class SubscriberRead(SubscriberBase):
    id: UUID
    customer_code: str
    plan_id: UUID
    bin_status: str
    bin_fill_level: int
    status: str
    unpaid_streak_months: int
    created_at: datetime.datetime
    observations: Optional[str] = None

    class Config:
        from_attributes = True


# ==========================================
# 6. INVOICING SCHEMAS
# ==========================================
class InvoiceBase(BaseModel):
    billing_period: str # "2026-05"
    amount_due: Decimal
    due_date: datetime.date

class InvoiceCreate(InvoiceBase):
    subscriber_id: UUID

class InvoiceRead(InvoiceBase):
    id: UUID
    invoice_code: str
    subscriber_id: UUID
    issue_date: datetime.date
    status: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# ==========================================
# 7. PAYMENTS SCHEMAS
# ==========================================
class PaymentCreate(BaseModel):
    invoice_id: UUID
    amount_paid: Decimal
    payment_method: str
    transaction_reference: str

class PaymentRead(BaseModel):
    id: UUID
    invoice_id: UUID
    amount_paid: Decimal
    payment_method: str
    transaction_reference: str
    payment_date: datetime.datetime

    class Config:
        from_attributes = True


# ==========================================
# 8. ACCOUNTING JOURNALING (ODOO-STYLE)
# ==========================================
class ChartOfAccountRead(BaseModel):
    code: str
    name: str
    account_type: str
    balance: Decimal

    class Config:
        from_attributes = True

class JournalEntryLineSchema(BaseModel):
    account_code: str
    debit: Decimal = Decimal("0.0")
    credit: Decimal = Decimal("0.0")

class JournalEntryCreate(BaseModel):
    journal_code: str
    label: str
    ref: Optional[str] = None
    lines: List[JournalEntryLineSchema]


# ==========================================
# 9. EXPENSES SCHEMAS
# ==========================================
class ExpenseCreate(BaseModel):
    item_name: str
    category: str
    amount: Decimal

class ExpenseRead(ExpenseCreate):
    id: UUID
    expense_date: datetime.date
    is_validated_comptable: bool

    class Config:
        from_attributes = True


# ==========================================
# 10. FLEET VEHICLE SCHEMAS
# ==========================================
class TruckCreate(BaseModel):
    license_plate: str
    brand: str
    model: str
    capacity_kg: Decimal

class TruckRead(TruckCreate):
    id: UUID
    mileage_km: Decimal
    current_status: str
    insurance_expiry: Optional[datetime.date] = None
    next_maintenance_date: Optional[datetime.date] = None

    class Config:
        from_attributes = True
