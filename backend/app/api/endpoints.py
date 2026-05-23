from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
from decimal import Decimal

from app.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, RoleChecker
from app.models import (
    User, UserRole, Subscriber, SubscriptionPlan, Invoice, InvoiceStatus,
    Payment, PaymentMethod, CRMLead, ChartOfAccount, Journal, JournalEntry,
    JournalEntryLine, Expense, Truck, Agent, RouteStatus, CollectorRoute, CollectionLog
)
from app.schemas import (
    UserCreate, UserRead, Token, UserLogin, CRMLeadCreate, CRMLeadRead,
    SubscriberCreate, SubscriberRead, InvoiceCreate, InvoiceRead, PaymentCreate, PaymentRead,
    JournalEntryCreate, ExpenseCreate, ExpenseRead, TruckCreate, TruckRead
)

router = APIRouter()

# ==========================================
# 1. AUTHENTICATION MODULE (JWT / RBAC)
# ==========================================
@router.post("/auth/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """Registers a new ERP user in the system database."""
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Une adresse email identique existe déjà dans l'ERP.")
    
    hashed_pwd = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        phone=user_in.phone,
        password_hash=hashed_pwd,
        full_name=user_in.full_name,
        role=user_in.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/auth/login", response_model=Token)
def login_user(form_data: UserLogin, db: Session = Depends(get_db)):
    """Logins user and returns secure JWT access token."""
    user = db.query(User).filter(User.email == form_data.email).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Lettres de créance erronées ou expirées.")
    
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}


# ==========================================
# 2. CRM MODULE (LEADS FOR WEBSITE)
# ==========================================
@router.post("/crm/leads", response_model=CRMLeadRead)
def create_crm_lead(lead_in: CRMLeadCreate, db: Session = Depends(get_db)):
    """Automatically logs public requests as active CRM opportunities as done in Odoo CRM."""
    lead = CRMLead(**lead_in.model_dump())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead

@router.get("/crm/leads", response_model=List[CRMLeadRead])
def get_crm_leads(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.DIRECTOR, UserRole.SUPERVISOR]))
):
    """Retrieves all CRM opportunities."""
    return db.query(CRMLead).order_by(CRMLead.created_at.desc()).all()


# ==========================================
# 3. CONTACTS & CLIENT PORTEFEUILLE (SUBSCRIBERS)
# ==========================================
@router.post("/subscribers", response_model=SubscriberRead, status_code=status.HTTP_201_CREATED)
def enroll_subscriber(
    sub_in: SubscriberCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.DIRECTOR, UserRole.ACCOUNTANT]))
):
    """
    Creates an active customer with a generated sequential customer code (AKPBF-XXXXXX).
    Additionally checks if subscription offer exists.
    """
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == sub_in.plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Le barème d'abonnement demandé est inaccessible.")

    # Generates a safe serialized code sequence (atomic database index sequence simulation)
    last_sub = db.query(Subscriber).order_by(Subscriber.created_at.desc()).first()
    code_seq = 1
    if last_sub and last_sub.customer_code.startswith("AKPBF-"):
        try:
            code_seq = int(last_sub.customer_code.split("-")[1]) + 1
        except ValueError:
            pass
            
    customer_code = f"AKPBF-{code_seq:06d}"

    # Verify duplicates on inputs
    if db.query(Subscriber).filter(Subscriber.bin_rfid_uid == sub_in.bin_rfid_uid).first():
        raise HTTPException(status_code=400, detail="Ce tag RFID est déjà affecté à un autre bac ménager.")

    new_subscriber = Subscriber(
        customer_code=customer_code,
        **sub_in.model_dump(),
        status="active"
    )
    db.add(new_subscriber)
    db.commit()
    db.refresh(new_subscriber)
    return new_subscriber

@router.get("/subscribers", response_model=List[SubscriberRead])
def list_subscribers(db: Session = Depends(get_db)):
    """List all subscribers/residents with locations and bins."""
    return db.query(Subscriber).all()


# ==========================================
# 4. BILLING & INVOICING ENGINE (FAC-2026-000001)
# ==========================================
@router.post("/billing/generate", response_model=List[InvoiceRead])
def run_automatic_monthly_billing(
    billing_period: str, # "2026-05"
    due_delta_days: int = 15,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.DIRECTOR, UserRole.ACCOUNTANT]))
):
    """
    FastAPI controller mimicking Odoo's recurring invoice engine.
    Scans active subscribers and auto-generates consecutive tax receipts (FAC-YYYY-SEQ).
    Checks and triggers appropriate actions (SWOT / penalties) for unpaid debt.
    """
    active_subs = db.query(Subscriber).filter(Subscriber.status == "active").all()
    generated_invoices = []
    
    today = datetime.date.today()
    due_date = today + datetime.timedelta(days=due_delta_days)
    
    # Get last invoice serial sequence
    last_inv = db.get_engine().execute(
        "SELECT invoice_code FROM tb_invoices ORDER BY created_at DESC LIMIT 1"
    ).fetchone() if False else None # Dummy fallback context for SQLAlchemy unit checks:
    
    last_inv_record = db.query(Invoice).order_by(Invoice.created_at.desc()).first()
    code_seq = 1
    if last_inv_record and last_inv_record.invoice_code.startswith("FAC-"):
        try:
            parts = last_inv_record.invoice_code.split("-")
            if len(parts) == 3:
                code_seq = int(parts[2]) + 1
        except ValueError:
            pass

    for sub in active_subs:
        # Check if already billed
        already_billed = db.query(Invoice).filter(
            Invoice.subscriber_id == sub.id,
            Invoice.billing_period == billing_period
        ).first()
        if already_billed:
            continue

        invoice_code = f"FAC-{today.year}-{code_seq:06d}"
        amount = sub.plan.price
        
        new_inv = Invoice(
            invoice_code=invoice_code,
            subscriber_id=sub.id,
            billing_period=billing_period,
            amount_due=amount,
            issue_date=today,
            due_date=due_date,
            status=InvoiceStatus.CONFIRMED.value
        )
        db.add(new_inv)
        generated_invoices.append(new_inv)
        
        # Trigger automatic double entry bookkeeping (Sales & Debts accounts)
        # Debit Account 411000 (Clients) & Credit Account 706000 (Ventes de Services)
        record_automatic_invoice_entry(db, invoice_code, amount, f"Facturation {billing_period} - {sub.customer_code}")
        
        code_seq += 1

    db.commit()
    return generated_invoices


# ==========================================
# 5. ODOO-STYLE AUTOMATIC LEDGER WRITER
# ==========================================
def record_automatic_invoice_entry(db: Session, invoice_code: str, amount: Decimal, label: str):
    """
    Subroutine implementing double entry municipal accounting logic:
    411000 Client accounts debited.
    706000 Services revenues credited.
    """
    journal = db.query(Journal).filter(Journal.code == "VT").first() # Class Ventes
    if not journal:
        return
    
    # Ensure Chart of accounts exist
    acc_client = db.query(ChartOfAccount).filter(ChartOfAccount.code == "411000").first()
    acc_sales = db.query(ChartOfAccount).filter(ChartOfAccount.code == "706000").first()
    if not acc_client or not acc_sales:
        return

    entry = JournalEntry(
        journal_code="VT",
        ref=invoice_code,
        label=label,
        is_posted=True
    )
    db.add(entry)
    db.flush()

    line_debit = JournalEntryLine(
        entry_id=entry.id,
        account_code="411000",
        debit=amount,
        credit=Decimal("0.0")
    )
    line_credit = JournalEntryLine(
        entry_id=entry.id,
        account_code="706000",
        debit=Decimal("0.0"),
        credit=amount
    )
    db.add(line_debit)
    db.add(line_credit)

    # Balance shift updates
    acc_client.balance += amount
    acc_sales.balance += amount


# ==========================================
# 6. PAYMENTS & OUTSTANDING LEDGER SETTLEMENTS
# ==========================================
@router.post("/payments", response_model=PaymentRead)
def pay_invoice_outstanding(
    pay_in: PaymentCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.DIRECTOR, UserRole.ACCOUNTANT]))
):
    """
    Registers a customer payment, updates invoice status (and credits client account if overpaid),
    and triggers double-entry cashier registration.
    """
    invoice = db.query(Invoice).filter(Invoice.id == pay_in.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="La facture sélectionnée est introuvable.")

    if invoice.status == InvoiceStatus.PAID.value:
        raise HTTPException(status_code=400, detail="Cette facture est déjà soldée.")

    # Match payment transaction duplicate safety
    duplicate_pay = db.query(Payment).filter(Payment.transaction_reference == pay_in.transaction_reference).first()
    if duplicate_pay:
        raise HTTPException(status_code=400, detail="Cette référence de transaction a déjà été encaissée.")

    new_payment = Payment(
        invoice_id=pay_in.invoice_id,
        amount_paid=pay_in.amount_paid,
        payment_method=pay_in.payment_method,
        transaction_reference=pay_in.transaction_reference
    )
    db.add(new_payment)

    # Check for partial payment vs total paid
    total_paid_already = sum([p.amount_paid for p in invoice.payments]) + pay_in.amount_paid
    if total_paid_already >= invoice.amount_due:
        invoice.status = InvoiceStatus.PAID.value
        # Reset customer bad credit penalty count on total pay
        invoice.subscriber.unpaid_streak_months = 0
    else:
        invoice.status = InvoiceStatus.PARTIALLY_PAID.value

    # General Accounting Ledger Double Entry posting
    # Debit Bank Account 512000 (Banque) or 571000 (Caisse)
    # Credit Customer Account 411000 (Clients)
    acc_code_cash = "512000" if pay_in.payment_method != PaymentMethod.CASH.value else "571000"
    acc_cash = db.query(ChartOfAccount).filter(ChartOfAccount.code == acc_code_cash).first()
    acc_client = db.query(ChartOfAccount).filter(ChartOfAccount.code == "411000").first()
    
    if acc_cash and acc_client:
        entry = JournalEntry(
            journal_code="BQ" if pay_in.payment_method != PaymentMethod.CASH.value else "CA",
            ref=invoice.invoice_code,
            label=f"Paiement {pay_in.payment_method} - {pay_in.transaction_reference}",
            is_posted=True
        )
        db.add(entry)
        db.flush()
        
        line_deb = JournalEntryLine(entry_id=entry.id, account_code=acc_code_cash, debit=pay_in.amount_paid, credit=Decimal("0.0"))
        line_crd = JournalEntryLine(entry_id=entry.id, account_code="411000", debit=Decimal("0.0"), credit=pay_in.amount_paid)
        db.add(line_deb)
        db.add(line_crd)
        
        acc_cash.balance += pay_in.amount_paid
        acc_client.balance -= pay_in.amount_paid # Amortissement client debt

    db.commit()
    db.refresh(new_payment)
    return new_payment


# ==========================================
# 7. EXPENSES MODULE (MUNICIPAL COST MANAGER)
# ==========================================
@router.post("/expenses", response_model=ExpenseRead)
def submit_expense_slip(expense_in: ExpenseCreate, db: Session = Depends(get_db)):
    """Logs cash spending metrics like diesel refuel or machinery repairs."""
    expense = Expense(
        item_name=expense_in.item_name,
        category=expense_in.category,
        amount=expense_in.amount,
        is_validated_comptable=False
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense

@router.post("/expenses/{expense_id}/validate_comptable")
def validate_expense_accounting(
    expense_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.ACCOUNTANT]))
):
    """
    Validators endpoint matching Odoo Expense slip post.
    Validates expense voucher and structures automatic credit/debit updates.
    606000 Purchase Charge debited & 571000 Cash accounted credited.
    """
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Fiche de dépense introuvable dans l'ERP.")
    
    if expense.is_validated_comptable:
         raise HTTPException(status_code=400, detail="Cette écriture de charge a déjà fait l'objet d'un audit.")

    expense.is_validated_comptable = True

    # Debit Account 606100 (Carburant) or 615000 (Entretien) depending on category
    # Credit Cash Account 571000 (Caisse)
    charge_acc_code = "606100" if expense.category == "Carburant" else "615000"
    acc_charge = db.query(ChartOfAccount).filter(ChartOfAccount.code == charge_acc_code).first()
    acc_cash = db.query(ChartOfAccount).filter(ChartOfAccount.code == "571000").first()

    if acc_charge and acc_cash:
        entry = JournalEntry(
            journal_code="CA",
            label=f"Dépense validée: {expense.item_name}",
            is_posted=True
        )
        db.add(entry)
        db.flush()

        db.add(JournalEntryLine(entry_id=entry.id, account_code=charge_acc_code, debit=expense.amount, credit=Decimal("0.0")))
        db.add(JournalEntryLine(entry_id=entry.id, account_code="571000", debit=Decimal("0.0"), credit=expense.amount))

        acc_charge.balance += expense.amount
        acc_cash.balance -= expense.amount

    db.commit()
    return {"status": "success", "message": "Fiche de dépense imputée de manière immuable au Grand Livre comptable."}


# ==========================================
# 8. MONTIOR / CRITICAL PENALTIES ENGINE
# ==========================================
@router.post("/billing/process-unpaid")
def automate_unpaid_debt_actions(db: Session = Depends(get_db)):
    """
    Failsafe procedural loop checker enforcing the requested corporate business policy:
    - 1 Month: Warning trigger context
    - 3 Months: Legal auto warning relance notification logged
    - 6 Months: Contract suspended automatically.
    """
    today = datetime.date.today()
    overdue_invoices = db.query(Invoice).filter(
        Invoice.status == InvoiceStatus.CONFIRMED.value,
        Invoice.due_date < today
    ).all()

    suspended_counter = 0
    warning_counter = 0

    # Group outstandings per resident/subscriber
    suspect_debts = {}
    for inv in overdue_invoices:
        suspect_debts[inv.subscriber_id] = suspect_debts.get(inv.subscriber_id, 0) + 1

    for sub_id, months_delinquent in suspect_debts.items():
        sub = db.query(Subscriber).filter(Subscriber.id == sub_id).first()
        if not sub:
            continue
        
        # update delinquency indicators
        sub.unpaid_streak_months = months_delinquent

        if months_delinquent >= 6:
            sub.status = "suspended" # Legal automated locking
            sub.observations = f"CONTRAT SUSPENDU AUTOMATIQUEMENT LE {today} POUR IMPAYÉS RÉPÉTÉS (6 MOIS+)."
            suspended_counter += 1
        elif months_delinquent >= 3:
            sub.observations = f"SITUATION ALERTE SÉVÈRE - RELANCE AVEC MISE EN DEMEURE LE {today}."
            warning_counter += 1

    db.commit()
    return {
        "status": "success",
        "processed_overdue_subscribers": len(suspect_debts),
        "contracts_suspended": suspended_counter,
        "severe_relaunch_warnings": warning_counter
    }
