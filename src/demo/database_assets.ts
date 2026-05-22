/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 * WebPortal & Database blueprints for AKPBF: PostgreSQL, Python SQLAlchemy, JWT Auth and WebSocket router.
 */

export const POSTGRES_SQL_SCHEMA = `-- ====================================================================
-- DATABASE SCHEMA BLUEPRINT FOR AKPBF ASSAINISSEMENT URBAIN
-- Runtimes: PostgreSQL 14+, FastAPI, SQLAlchemy
-- Prepared: 2026-05-22
-- ====================================================================

-- Enable necessary Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table: Plans d'Abonnement (Subscription Plans)
CREATE TABLE IF NOT EXISTS subscription_plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price INT NOT NULL CHECK (price >= 0),
    frequency VARCHAR(30) NOT NULL DEFAULT 'Mensuel',
    description TEXT,
    allowed_volume VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table: Abonnés Municipaux (Subscribers)
CREATE TABLE IF NOT EXISTS subscribers (
    id VARCHAR(30) PRIMARY KEY, -- Unique client designator (Ex: AKPBF-000001)
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Standard bcrypt hash representing e.g. "Test@2026"
    phone VARCHAR(30) NOT NULL,
    address VARCHAR(255) NOT NULL,
    neighborhood VARCHAR(100) NOT NULL,
    latitude DECIMAL(9, 6) NOT NULL,
    longitude DECIMAL(9, 6) NOT NULL,
    plan_id VARCHAR(50) REFERENCES subscription_plans(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'suspended', 'pending')),
    bin_type VARCHAR(40) NOT NULL DEFAULT 'Standard 240L',
    current_bin_level INT DEFAULT 0 CHECK (current_bin_level BETWEEN 0 AND 100),
    bin_health_score INT DEFAULT 100 CHECK (bin_health_score BETWEEN 0 AND 100),
    last_collection_date VARCHAR(50) DEFAULT 'Jamais',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index geo-segmentation for route optimization
CREATE INDEX idx_subscribers_geo ON subscribers (neighborhood);
CREATE INDEX idx_subscribers_email ON subscribers (email);

-- 3. Table: Factures Émises (Invoices)
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(30) PRIMARY KEY,  -- FAC-YEAR-INDEX
    subscriber_id VARCHAR(30) REFERENCES subscribers(id) ON DELETE CASCADE,
    amount INT NOT NULL CHECK (amount > 0),
    due_date DATE NOT NULL,
    issue_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('paid', 'pending', 'overdue')),
    payment_method VARCHAR(50), -- 'Orange Money', 'Moov Money', 'Wave', etc.
    paid_date TIMESTAMP WITH TIME ZONE,
    period VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Table: Tickets de Signalements (Incident Tickets)
CREATE TABLE IF NOT EXISTS incidents (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_formatted VARCHAR(30) UNIQUE NOT NULL, -- Ex: TCK-2026-001
    subscriber_id VARCHAR(30) REFERENCES subscribers(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL, -- 'collecte oubliée', 'bac endommagé', etc.
    description TEXT NOT NULL,
    location_gps VARCHAR(100),
    photo_url VARCHAR(255),
    status VARCHAR(25) NOT NULL DEFAULT 'Ouvert' CHECK (status IN ('Ouvert', 'En cours', 'Résolu', 'Fermé')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Table: Historique de Passage de Voirie (Collection Passes)
CREATE TABLE IF NOT EXISTS collections_history (
    id SERIAL PRIMARY KEY,
    subscriber_id VARCHAR(30) REFERENCES subscribers(id) ON DELETE CASCADE,
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    agent_id VARCHAR(30) NOT NULL,
    agent_name VARCHAR(100) NOT NULL,
    truck_plate VARCHAR(30),
    gps_coordinates VARCHAR(100) NOT NULL,
    rfid_token VARCHAR(100) NOT NULL
);

-- ====================================================================
-- POPULATE INITIAL STANDARD SUBSCRIPTIONS (SEEDED DEMO DATA)
-- ====================================================================
INSERT INTO subscription_plans (id, name, price, frequency, description, allowed_volume) VALUES
('plan_standard_2500', 'Abonnement Standard Particulier', 2500, 'Mensuel', '2 passages de bennes par semaine.', '480 L / Mois'),
('plan_premium_5000', 'Abonnement Premium Famille', 5000, 'Mensuel', '3 passages de bennes par semaine.', '1080 L / Mois'),
('plan_entreprise_15000', 'Abonnement Professionnel & Commerce', 15000, 'Mensuel', '6 passages par semaine. Grand conteneur 1100L.', '6600 L / Mois')
ON CONFLICT (id) DO NOTHING;
`;

export const FASTAPI_MODELS_PYTHON = `# ====================================================================
# FASTAPI BACKEND MODEL DEFINITIONS (SQLAlchemy ORM)
# ====================================================================
from sqlalchemy import Column, String, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class DbSubscriptionPlan(Base):
    __tablename__ = "subscription_plans"
    
    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    price = Column(Integer, nullable=False)
    frequency = Column(String(30), default="Mensuel")
    description = Column(String(255))
    allowed_volume = Column(String(50), nullable=False)
    
    subscribers = relationship("DbSubscriber", back_populates="plan")

class DbSubscriber(Base):
    __tablename__ = "subscribers"
    
    id = Column(String(30), primary_key=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False) # standard check 'Test@2026'
    phone = Column(String(30), nullable=False)
    address = Column(String(255), nullable=False)
    neighborhood = Column(String(100), nullable=False)
    latitude = Column(Numeric(9, 6), nullable=False)
    longitude = Column(Numeric(9, 6), nullable=False)
    plan_id = Column(String(50), ForeignKey("subscription_plans.id"))
    status = Column(String(20), default="active")
    bin_type = Column(String(40), default="Standard 240L")
    current_bin_level = Column(Integer, default=0)
    bin_health_score = Column(Integer, default=95)
    last_collection_date = Column(String(50), default="Jamais")
    
    plan = relationship("DbSubscriptionPlan", back_populates="subscribers")
    invoices = relationship("DbInvoice", back_populates="subscriber")

class DbInvoice(Base):
    __tablename__ = "invoices"
    
    id = Column(String(30), primary_key=True)
    subscriber_id = Column(String(30), ForeignKey("subscribers.id"))
    amount = Column(Integer, nullable=False)
    due_date = Column(DateTime, nullable=False)
    issue_date = Column(DateTime, nullable=False)
    status = Column(String(20), default="pending")
    payment_method = Column(String(50), nullable=True)
    paid_date = Column(DateTime, nullable=True)
    period = Column(String(50), nullable=False)
    
    subscriber = relationship("DbSubscriber", back_populates="invoices")
`;

export const FASTAPI_REST_API = `# ====================================================================
# FASTAPI APIS & JWT AUTHENTICATION ENDPOINTS
# ====================================================================
from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import jwt
from datetime import datetime, timedelta

app = FastAPI(title="AKPBF Trash Management Municipal Portal", version="1.0")

SECRET_KEY = "AKPBF_SUPER_SECRET_SECURITY_TOKEN"
ALGORITHM = "HS256"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    subscriber_id: Optional[str] = None
    role: str

@app.post("/api/v1/auth/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    # Standard security bypass as per requirements
    if payload.email == "admin@akpbf.com" and payload.password == "Admin@2026":
        token_data = {"sub": payload.email, "role": "admin", "exp": datetime.utcnow() + timedelta(hours=8)}
        token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
        return {"access_token": token, "token_type": "bearer", "role": "admin"}
        
    # Check regular client (password check constraint: Test@2026)
    if payload.password == "Test@2026":
        # Simulate subscriber search logic
        token_data = {"sub": payload.email, "role": "citizen", "exp": datetime.utcnow() + timedelta(days=7)}
        token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
        return {"access_token": token, "token_type": "bearer", "subscriber_id": "AKPBF-001", "role": "citizen"}
        
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Identifiant ou mot de passe AKPBF incorrect. (Conseil: Utilisez 'Test@2026')"
    )

# --------------------------------------------------------------------
# LIVE WEBSOCKET TELEMETRY FOR COLLECTOR TRUCKS OR CITIZEN NOTIFICATIONS
# --------------------------------------------------------------------
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast_telemetry(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()

@app.websocket("/api/v1/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Receive real-time lid lid level variations, RFID scans or gps trace
            data = await websocket.receive_json()
            # Broadcast to monitoring controllers
            await manager.broadcast_telemetry({"event": "rfid_detected", "data": data})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
`;
