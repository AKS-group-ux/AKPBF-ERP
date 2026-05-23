import datetime
import uuid
from sqlalchemy import (
    Column, 
    String, 
    Integer, 
    Numeric, 
    Boolean, 
    DateTime, 
    Date, 
    ForeignKey, 
    Text, 
    Enum, 
    CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database import Base

# ==========================================
# 1. ENUMS & CONSTANTS
# ==========================================
import enum

class UserRole(str, enum.Enum):
    ADMIN = "ADMINISTRATEUR"
    DIRECTOR = "DIRECTEUR"
    ACCOUNTANT = "COMPTABLE"
    SUPERVISOR = "SUPERVISEUR"
    DRIVER = "CHAUFFEUR"
    AGENT = "AGENT"
    CLIENT = "CLIENT"

class InvoiceStatus(str, enum.Enum):
    DRAFT = "Brouillon"
    CONFIRMED = "Confirmée"
    SENT = "Envoyée"
    PAID = "Payée"
    PARTIALLY_PAID = "Partiellement payée"
    OVERDUE = "En retard"
    CANCELLED = "Annulée"

class PaymentMethod(str, enum.Enum):
    CASH = "Espèces"
    MOBILE_MONEY = "Mobile Money"
    CARD = "Carte bancaire"
    TRANSFER = "Virement bancaire"

class RouteStatus(str, enum.Enum):
    PLANNED = "Planifiée"
    ON_GOING = "En cours"
    COMPLETED = "Terminée"
    CANCELLED = "Annulée"

class AccountType(str, enum.Enum):
    ACTIVE = "Actif"
    PASSIVE = "Passif"
    REVENUE = "Produit"
    EXPENSE = "Charge"

# ==========================================
# 2. CORE USER & SECURITY MODEL
# ==========================================
class User(Base):
    __tablename__ = "tb_users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(150), unique=True, nullable=False, index=True)
    phone = Column(String(20), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    role = Column(String(50), default=UserRole.CLIENT, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    subscriber_profile = relationship("Subscriber", back_populates="user", uselist=False)
    agent_profile = relationship("Agent", back_populates="user", uselist=False)


# ==========================================
# 3. CRM LEADS MODULE
# ==========================================
class CRMLead(Base):
    __tablename__ = "tb_crm_leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(150), nullable=False)
    email = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=False)
    company_name = Column(String(150), nullable=True)
    neighborhood = Column(String(100), nullable=False)
    message = Column(Text, nullable=True)
    status = Column(String(50), default="PROSPECT_NOUVEAU")  # NOUVEAU, EN_COURS, CONVERTI, PERDU
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# ==========================================
# 4. SUBSCRIPTION PLANS
# ==========================================
class SubscriptionPlan(Base):
    __tablename__ = "tb_subscription_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(255), nullable=True)
    price = Column(Numeric(12, 2), nullable=False)       # Price in FCFA
    duration_days = Column(Integer, default=30)          # monthly, quarterly etc
    pickup_quota = Column(Integer, default=8)            # Max scheduled pickups
    frequency_weekly = Column(Integer, default=2)        # Foyer pickups frequency
    is_active = Column(Boolean, default=True)

    subscribers = relationship("Subscriber", back_populates="plan")


# ==========================================
# 5. CUSTOMERS & SUBSCRIBERS
# ==========================================
class Subscriber(Base):
    __tablename__ = "tb_subscribers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_code = Column(String(50), unique=True, nullable=False, index=True) # AKPBF-000001
    user_id = Column(UUID(as_uuid=True), ForeignKey("tb_users.id"), nullable=True)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("tb_subscription_plans.id"), nullable=False)
    
    # Customer Categorization Info
    customer_type = Column(String(50), default="Particulier") # Particulier, Entreprise, Association, Administration
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    company_name = Column(String(150), nullable=True)
    
    phone = Column(String(20), nullable=False)
    email = Column(String(150), nullable=False)
    address_street = Column(String(255), nullable=False)
    neighborhood = Column(String(100), nullable=False)   # Cocody, Yopougon, Marcory
    sector = Column(String(100), nullable=True)
    city = Column(String(100), default="Abidjan")
    
    # Spatial Positioning (Stored as raw latitude/longitude for ease of calculation)
    latitude = Column(Numeric(10, 7), nullable=False)
    longitude = Column(Numeric(10, 7), nullable=False)
    
    bin_rfid_uid = Column(String(100), unique=True, nullable=False, index=True)
    bin_status = Column(String(30), default="NORMAL") # NORMAL, WEAK, FULL, DAMAGE
    bin_fill_level = Column(Integer, default=0) # 0-100% capacity
    
    status = Column(String(35), default="active") # active, suspended, cancelled
    unpaid_streak_months = Column(Integer, default=0) # Counter for legal automation
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    observations = Column(Text, nullable=True)

    user = relationship("User", back_populates="subscriber_profile")
    plan = relationship("SubscriptionPlan", back_populates="subscribers")
    invoices = relationship("Invoice", back_populates="subscriber")


# ==========================================
# 6. BILLING & INVOICING MODULE
# ==========================================
class Invoice(Base):
    __tablename__ = "tb_invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_code = Column(String(50), unique=True, nullable=False, index=True) # FAC-2026-000001
    subscriber_id = Column(UUID(as_uuid=True), ForeignKey("tb_subscribers.id"), nullable=False)
    billing_period = Column(String(7), nullable=False) # e.g. "2026-05"
    amount_due = Column(Numeric(12, 2), nullable=False)
    issue_date = Column(Date, default=datetime.date.today)
    due_date = Column(Date, nullable=False)
    status = Column(String(30), default=InvoiceStatus.DRAFT, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    subscriber = relationship("Subscriber", back_populates="invoices")
    payments = relationship("Payment", back_populates="invoice")
    journal_entries = relationship("JournalEntry", back_populates="invoice")


# ==========================================
# 7. PAYMENTS GATEWAY MODULE
# ==========================================
class Payment(Base):
    __tablename__ = "tb_payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("tb_invoices.id"), nullable=False)
    amount_paid = Column(Numeric(12, 2), nullable=False)
    payment_method = Column(String(50), default=PaymentMethod.MOBILE_MONEY, nullable=False)
    transaction_reference = Column(String(100), unique=True, nullable=False, index=True)
    payment_date = Column(DateTime, default=datetime.datetime.utcnow)
    is_advance = Column(Boolean, default=False) # true if client credit
    
    invoice = relationship("Invoice", back_populates="payments")


# ==========================================
# 8. ODOO-STYLE COMPTABILITÉ MODULE
# ==========================================
class ChartOfAccount(Base):
    """
    Odo style general accounting mapping plans (Plan Comptable).
    Holds primary municipal accounts for billing, fuel, salaries, operations.
    """
    __tablename__ = "tb_chart_of_accounts"

    code = Column(String(20), primary_key=True, index=True) # Account numeric id e.g. "512000" (Banque)
    name = Column(String(150), nullable=False)
    account_type = Column(String(50), default=AccountType.ACTIVE, nullable=False) # Actif, Passif, Produit, Charge
    balance = Column(Numeric(15, 2), default=0.00)

    entries = relationship("JournalEntryLine", back_populates="account")


class Journal(Base):
    """
    Accounting Journals for grouping transaction trails (Sales, Purchases, Cash, Bank)
    """
    __tablename__ = "tb_journals"

    code = Column(String(10), primary_key=True) # e.g. "VT" (Ventes), "HA" (Achats), "BQ" (Banque), "CA" (Caisse)
    name = Column(String(100), nullable=False)

    entries = relationship("JournalEntry", back_populates="journal")


class JournalEntry(Base):
    """
    A single general double-entry transaction record.
    Must always have debits and credits balanced in subordinate lines.
    """
    __tablename__ = "tb_journal_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    journal_code = Column(String(10), ForeignKey("tb_journals.code"), nullable=False)
    ref = Column(String(100), nullable=True) # Associated document code e.g. "FAC-2026-000001" or Expense slip
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("tb_invoices.id"), nullable=True)
    date = Column(Date, default=datetime.date.today, nullable=False)
    label = Column(String(200), nullable=False)
    is_posted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    journal = relationship("Journal", back_populates="entries")
    invoice = relationship("Invoice", back_populates="journal_entries")
    lines = relationship("JournalEntryLine", back_populates="entry", cascade="all, delete-orphan")


class JournalEntryLine(Base):
    """
    Subordinate double-entry audit row containing exact debits and credits.
    """
    __tablename__ = "tb_journal_entry_lines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entry_id = Column(UUID(as_uuid=True), ForeignKey("tb_journal_entries.id", ondelete="CASCADE"), nullable=False)
    account_code = Column(String(20), ForeignKey("tb_chart_of_accounts.code"), nullable=False)
    
    debit = Column(Numeric(15, 2), default=0.00, nullable=False)
    credit = Column(Numeric(15, 2), default=0.00, nullable=False)
    
    entry = relationship("JournalEntry", back_populates="lines")
    account = relationship("ChartOfAccount", back_populates="entries")


# ==========================================
# 9. EXPENSE MANAGEMENT MODULE
# ==========================================
class Expense(Base):
    __tablename__ = "tb_expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_name = Column(String(150), nullable=False) # e.g. "Achat Gazole", "Entretien Benne"
    category = Column(String(50), nullable=False) # Carburant, Réparation, Salaires, Fournitures, Téléphone
    amount = Column(Numeric(12, 2), nullable=False)
    expense_date = Column(Date, default=datetime.date.today)
    approved_by = Column(String(100), nullable=True)
    is_validated_comptable = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# ==========================================
# 10. VEHICLES (FLEET MANAGEMENT) MODULE
# ==========================================
class Truck(Base):
    __tablename__ = "tb_trucks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    license_plate = Column(String(30), unique=True, nullable=False, index=True)
    brand = Column(String(100), nullable=False)
    model = Column(String(100), nullable=False)
    capacity_kg = Column(Numeric(10, 2), nullable=False)
    mileage_km = Column(Numeric(10, 2), default=0.0)
    current_status = Column(String(30), default="ACTIVE") # ACTIVE, MAINTENANCE, OUT_OF_SERVICE
    insurance_expiry = Column(Date, nullable=True)
    next_maintenance_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    routes = relationship("CollectorRoute", back_populates="truck")


# ==========================================
# 11. OPERATIONS & PERSONNEL (HR) MODULE
# ==========================================
class Agent(Base):
    __tablename__ = "tb_agents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("tb_users.id"), unique=True, nullable=False)
    job_title = Column(String(100), nullable=False) # DRIVER, COLLECTOR
    driving_license_num = Column(String(50), unique=True, nullable=True)
    is_available = Column(Boolean, default=True)
    hired_date = Column(Date, default=datetime.date.today)

    user = relationship("User", back_populates="agent_profile")
    routes = relationship("CollectorRoute", back_populates="driver")


# ==========================================
# 12. LOGISTICS ROUTES & WORK PLANNING
# ==========================================
class CollectorRoute(Base):
    __tablename__ = "tb_collector_routes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    zone_name = Column(String(100), nullable=False) # Cocody, Riviera 3, Yopougon, Marcory
    truck_id = Column(UUID(as_uuid=True), ForeignKey("tb_trucks.id"), nullable=False)
    primary_driver_id = Column(UUID(as_uuid=True), ForeignKey("tb_agents.id"), nullable=False)
    
    scheduled_start_time = Column(DateTime, nullable=False)
    actual_start_time = Column(DateTime, nullable=True)
    actual_end_time = Column(DateTime, nullable=True)
    
    total_tonnage_collected = Column(Numeric(10, 3), default=0.0) # Tons weighed in garbage dump
    status = Column(String(30), default=RouteStatus.PLANNED, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    truck = relationship("Truck", back_populates="routes")
    driver = relationship("Agent", back_populates="routes")
    collection_logs = relationship("CollectionLog", back_populates="route", cascade="all, delete-orphan")


# ==========================================
# 13. COLLECT RECOGNITION (RFID TRACKING LOGS)
# ==========================================
class CollectionLog(Base):
    __tablename__ = "tb_collection_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    route_id = Column(UUID(as_uuid=True), ForeignKey("tb_collector_routes.id", ondelete="CASCADE"), nullable=False)
    subscriber_id = Column(UUID(as_uuid=True), ForeignKey("tb_subscribers.id"), nullable=False)
    scanned_rfid = Column(String(100), nullable=False)
    collection_time = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    estimated_volume_liters = Column(Integer, nullable=True)
    agent_notes = Column(Text, nullable=True)

    route = relationship("CollectorRoute", back_populates="collection_logs")
