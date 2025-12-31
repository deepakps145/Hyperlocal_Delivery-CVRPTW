from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from database import Base
import datetime
import enum

class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    PICKED_UP = "picked-up"
    IN_TRANSIT = "in-transit"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class RiderStatus(str, enum.Enum):
    AVAILABLE = "available"
    BUSY = "busy"
    OFFLINE = "offline"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String) # "admin" or "rider"
    
    # For riders
    current_lat = Column(Float, nullable=True)
    current_lng = Column(Float, nullable=True)
    status = Column(String, default=RiderStatus.OFFLINE)
    capacity = Column(Float, default=10.0)  # Max weight capacity

    orders = relationship("Order", back_populates="rider")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String)
    delivery_address = Column(String)
    lat = Column(Float)
    lng = Column(Float)
    status = Column(String, default=OrderStatus.PENDING)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Order grouping and optimization fields
    delivery_time_start = Column(DateTime, nullable=True)  # Time window start
    delivery_time_end = Column(DateTime, nullable=True)    # Time window end
    priority = Column(Integer, default=1)  # 1=low, 2=medium, 3=high
    weight = Column(Float, default=1.0)    # Package weight for capacity
    
    rider_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    rider = relationship("User", back_populates="orders")

class Route(Base):
    __tablename__ = "routes"
    
    id = Column(Integer, primary_key=True, index=True)
    rider_id = Column(Integer, ForeignKey("users.id"))
    # Store route geometry or waypoints as JSON string or similar if needed
    # For simplicity, we might just link orders to riders and calculate route on fly or store encoded polyline
    encoded_polyline = Column(String, nullable=True) 
    total_distance = Column(Float, nullable=True)
    total_time = Column(Float, nullable=True)
