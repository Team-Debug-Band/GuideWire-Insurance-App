import enum
import datetime
import uuid
from sqlalchemy import Boolean, Column, Integer, String, Float, ForeignKey, DateTime, Enum as SAEnum, JSON, Numeric, Uuid
from sqlalchemy.orm import relationship
from core.db import Base

class PersonaType(str, enum.Enum):
    FOOD = "FOOD"
    GROCERY = "GROCERY"
    ECOMMERCE = "ECOMMERCE"

class PlatformType(str, enum.Enum):
    SWIGGY = "SWIGGY"
    ZOMATO = "ZOMATO"
    BLINKIT = "BLINKIT"
    ZEPTO = "ZEPTO"
    AMAZON = "AMAZON"
    OTHER = "OTHER"

class PolicyStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    LAPSED = "LAPSED"
    CANCELLED = "CANCELLED"

class CycleStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    
class EventType(str, enum.Enum):
    RAIN = "RAIN"
    CURFEW = "CURFEW"
    STRIKE = "STRIKE"
    AQI = "AQI"

class ClaimStatus(str, enum.Enum):
    CREATED = "CREATED"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    PAID = "PAID"

class PaymentStatus(str, enum.Enum):
    INITIATED = "INITIATED"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    
class FraudAlertStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    RESOLVED = "RESOLVED"
    FALSE_POSITIVE = "FALSE_POSITIVE"

class Worker(Base):
    __tablename__ = "workers"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="WORKER") 
    
    city = Column(String, nullable=True)
    primary_zone = Column(String, nullable=True)
    persona_type = Column(SAEnum(PersonaType), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    platforms = relationship("PlatformAccount", back_populates="worker", cascade="all, delete-orphan")
    policies = relationship("Policy", back_populates="worker")
    cycles = relationship("WeeklyCycle", back_populates="worker")
    claims = relationship("Claim", back_populates="worker")

class PlatformAccount(Base):
    __tablename__ = "platform_accounts"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    worker_id = Column(Uuid(as_uuid=True), ForeignKey("workers.id"))
    platform_type = Column(SAEnum(PlatformType), nullable=False)
    avg_weekly_hours = Column(Float, nullable=False, default=0.0)
    avg_weekly_earnings = Column(Numeric(10, 2), nullable=False, default=0.0)
    
    worker = relationship("Worker", back_populates="platforms")

class Policy(Base):
    __tablename__ = "policies"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    worker_id = Column(Uuid(as_uuid=True), ForeignKey("workers.id"))
    status = Column(SAEnum(PolicyStatus), default=PolicyStatus.ACTIVE)
    max_weekly_coverage = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    
    worker = relationship("Worker", back_populates="policies")
    weekly_cycles = relationship("WeeklyCycle", back_populates="policy")

class WeeklyCycle(Base):
    __tablename__ = "weekly_cycles"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    worker_id = Column(Uuid(as_uuid=True), ForeignKey("workers.id"))
    policy_id = Column(Uuid(as_uuid=True), ForeignKey("policies.id"))
    week_start = Column(DateTime(timezone=True), nullable=False)
    week_end = Column(DateTime(timezone=True), nullable=False)
    status = Column(SAEnum(CycleStatus), default=CycleStatus.PENDING)
    
    risk_score = Column(Float, nullable=True)
    weekly_premium = Column(Numeric(10, 2), nullable=True)
    risk_components = Column(JSON, nullable=True)
    
    expected_income = Column(Numeric(10, 2), nullable=False)
    actual_income = Column(Numeric(10, 2), default=0.0)
    total_payout = Column(Numeric(10, 2), default=0.0)
    
    worker = relationship("Worker", back_populates="cycles")
    policy = relationship("Policy", back_populates="weekly_cycles")

class PlatformActivity(Base):
    __tablename__ = "platform_activity"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    worker_id = Column(Uuid(as_uuid=True), ForeignKey("workers.id"))
    platform_type = Column(SAEnum(PlatformType), nullable=False)
    timestamp = Column(DateTime(timezone=True))
    orders = Column(Integer, default=0)
    earnings = Column(Numeric(10, 2), default=0.0)
    zone = Column(String, nullable=True)
    network_location_hash = Column(String, nullable=True)

class ExternalEvent(Base):
    __tablename__ = "external_events"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    city = Column(String, nullable=False)
    zone = Column(String, nullable=True)
    event_type = Column(SAEnum(EventType), nullable=False)
    severity = Column(Float, nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)

class DisruptionEvent(Base):
    __tablename__ = "disruption_events"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    worker_id = Column(Uuid(as_uuid=True), ForeignKey("workers.id"))
    cycle_id = Column(Uuid(as_uuid=True), ForeignKey("weekly_cycles.id"))
    event_type = Column(SAEnum(EventType), nullable=False)
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    estimated_loss = Column(Numeric(10, 2))

class Claim(Base):
    __tablename__ = "claims"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    worker_id = Column(Uuid(as_uuid=True), ForeignKey("workers.id"))
    policy_id = Column(Uuid(as_uuid=True), ForeignKey("policies.id"))
    cycle_id = Column(Uuid(as_uuid=True), ForeignKey("weekly_cycles.id"))
    disruption_id = Column(Uuid(as_uuid=True), ForeignKey("disruption_events.id"))
    
    status = Column(SAEnum(ClaimStatus), default=ClaimStatus.CREATED)
    claimed_amount = Column(Numeric(10, 2), default=0.0)
    approved_amount = Column(Numeric(10, 2), default=0.0)
    
    fraud_score = Column(Float, nullable=True)
    fraud_signal_log = Column(JSON, nullable=True)
    
    worker = relationship("Worker", back_populates="claims")

class Payout(Base):
    __tablename__ = "payouts"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    claim_id = Column(Uuid(as_uuid=True), ForeignKey("claims.id"))
    amount = Column(Numeric(10, 2), nullable=False)
    payment_provider = Column(String, nullable=True) # RAZORPAY_SANDBOX, etc.
    payment_ref = Column(String, nullable=True)
    status = Column(SAEnum(PaymentStatus), default=PaymentStatus.INITIATED)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)


class ZoneFraudAlert(Base):
    __tablename__ = "zone_fraud_alerts"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(Uuid(as_uuid=True), ForeignKey("external_events.id"))
    zone = Column(String, nullable=False)
    triggered_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    claim_count = Column(Integer, default=0)
    expected_claim_count = Column(Integer, default=0)
    deviation_score = Column(Float, nullable=False)
    status = Column(SAEnum(FraudAlertStatus), default=FraudAlertStatus.ACTIVE)
