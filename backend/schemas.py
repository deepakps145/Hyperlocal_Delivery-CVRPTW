from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from models import OrderStatus, RiderStatus

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    name: str

class TokenData(BaseModel):
    email: Optional[str] = None

class OrderBase(BaseModel):
    customer_name: str
    delivery_address: str
    lat: float
    lng: float

class OrderCreate(OrderBase):
    priority: Optional[int] = 1
    weight: Optional[float] = 1.0
    delivery_time_start: Optional[datetime] = None
    delivery_time_end: Optional[datetime] = None

class Order(OrderBase):
    id: int
    status: OrderStatus
    created_at: datetime
    rider_id: Optional[int] = None
    priority: Optional[int] = 1
    weight: Optional[float] = 1.0
    delivery_time_start: Optional[datetime] = None
    delivery_time_end: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    name: str
    email: str
    role: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class User(UserBase):
    id: int
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    status: RiderStatus
    capacity: Optional[float] = 10.0

    class Config:
        from_attributes = True

class LocationUpdate(BaseModel):
    lat: float
    lng: float

    class Config:
        from_attributes = True

class RouteRequest(BaseModel):
    rider_id: int
    order_ids: List[int]

class OptimizationResult(BaseModel):
    rider_id: int
    route_polyline: str
    distance: float
    time: float
    waypoints: List[dict]
