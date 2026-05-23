from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
import uvicorn

from app.core.config import settings
from app.database import engine, Base, SessionLocal
from app.models import ChartOfAccount, Journal, SubscriptionPlan, UserRole
from app.api.endpoints import router as api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="AKPBF ERP Waste Management API - Odoo Architecture Pattern"
)

# Global Cross-Origin Resource Sharing Middleware for React Frontend link
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach Modular Router 
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "version": "v1.0.0",
        "database_connected": True
    }

@app.on_event("startup")
def bootstrap_erp_tables():
    """
    On startup, builds initial tables if non-existent, and populates
    universal general accounting parameters (Plan Comptable COA & Sales Journals)
    so Odoo-style operations don't throw constraint faults.
    """
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Seed Plan Comptable (Chart of Accounts)
        standard_accounts = [
            ("512000", "Compte Banques (Wave/Orange/MTN/SGCI)", "Actif"),
            ("571000", "Compte de Caisse Municipale", "Actif"),
            ("411000", "Créances Clients", "Actif"),
            ("401000", "Dettes Fournisseurs", "Passif"),
            ("164000", "Dettes Financières", "Passif"),
            ("706000", "Ventes de Services d'Assainissement", "Produit"),
            ("708000", "Revenus Divers Accessoires", "Produit"),
            ("606100", "Dépenses Carburant / Énergie", "Charge"),
            ("615000", "Entretien Véhicules & Maintenance", "Charge"),
            ("641000", "Salaires & Rémunérations Personnel", "Charge"),
            ("606400", "Fournitures Administratives d'Assainissement", "Charge"),
        ]
        
        for code, name, acc_type in standard_accounts:
            existing = db.query(ChartOfAccount).filter(ChartOfAccount.code == code).first()
            if not existing:
                db.add(ChartOfAccount(code=code, name=name, account_type=acc_type, balance=0.00))

        # 2. Seed Books Journals
        standard_journals = [
            ("VT", "Journal des Ventes de Salubrité"),
            ("HA", "Journal d'Achat & Logistique"),
            ("BQ", "Journal Banques Opérateurs"),
            ("CA", "Journal de Caisse Centrale d'Abidjan"),
            ("OD", "Journal d'Opérations Diverses"),
        ]
        for c, n in standard_journals:
            exist_j = db.query(Journal).filter(Journal.code == c).first()
            if not exist_j:
                db.add(Journal(code=c, name=n))

        # 3. Seed Base Offers
        standard_plans = [
            ("Social Standard (240L)", "Plan mensuel de base réservé aux ménages d'Abidjan - 2 collectes par semaine", 3000, 30, 8, 2),
            ("Résidentiel Plus (360L)", "Plan intermédiaire recommandé pour grands foyers - 3 collectes par semaine", 5500, 30, 12, 3),
            ("Secteur Industriel (1100L)", "Plan d'assainissement d'urgence pour corporations et industries - Collectes quotidiennes", 15000, 30, 30, 7),
        ]
        for name, desc, price, dur, quota, freq in standard_plans:
            exist_p = db.query(SubscriptionPlan).filter(SubscriptionPlan.name == name).first()
            if not exist_p:
                db.add(SubscriptionPlan(name=name, description=desc, price=price, duration_days=dur, pickup_quota=quota, frequency_weekly=freq))

        db.commit()
    except Exception as e:
        print(f"Erreur de bootstrap des tables de l'ERP: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
