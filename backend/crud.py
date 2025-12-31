from sqlalchemy.orm import Session
import models, schemas, auth

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_users_by_role(db: Session, role: str):
    return db.query(models.User).filter(models.User.role == role).all()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        name=user.name, 
        email=user.email, 
        role=user.role, 
        hashed_password=hashed_password,
        status=models.RiderStatus.AVAILABLE if user.role == 'rider' else models.RiderStatus.OFFLINE
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_orders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Order).offset(skip).limit(limit).all()

def create_order(db: Session, order: schemas.OrderCreate):
    db_order = models.Order(**order.dict())
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

def update_order_status(db: Session, order_id: int, status: str):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if db_order:
        db_order.status = status
        db.commit()
        db.refresh(db_order)
    return db_order

def assign_order_to_rider(db: Session, order_id: int, rider_id: int):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if db_order:
        db_order.rider_id = rider_id
        db_order.status = models.OrderStatus.ASSIGNED
        db.commit()
        db.refresh(db_order)
    return db_order

def get_rider_orders(db: Session, rider_id: int):
    return db.query(models.Order).filter(models.Order.rider_id == rider_id).all()

def update_rider_location(db: Session, rider_id: int, lat: float, lng: float):
    db_rider = db.query(models.User).filter(models.User.id == rider_id).first()
    if db_rider:
        db_rider.current_lat = lat
        db_rider.current_lng = lng
        db.commit()
        db.refresh(db_rider)
    return db_rider
