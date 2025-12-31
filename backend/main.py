from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
import models, schemas, crud, routing, auth
from database import SessionLocal, engine
import json

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

@app.post("/signup", response_model=schemas.Token)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = crud.create_user(db=db, user=user)
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role, "user_id": user.id, "name": user.name}

@app.post("/login", response_model=schemas.Token)
def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=user_credentials.email)
    if not user or not auth.verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role, "user_id": user.id, "name": user.name}

@app.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.get("/users/", response_model=List[schemas.User])
def read_users(role: str = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if role:
        return crud.get_users_by_role(db, role)
    return db.query(models.User).all()

@app.post("/orders/", response_model=schemas.Order)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_order(db=db, order=order)

@app.get("/orders/", response_model=List[schemas.Order])
def read_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_orders(db, skip=skip, limit=limit)

@app.put("/orders/{order_id}/status", response_model=schemas.Order)
def update_order_status(order_id: int, status: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.update_order_status(db, order_id, status)

@app.post("/orders/{order_id}/assign/{rider_id}", response_model=schemas.Order)
def assign_order(order_id: int, rider_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.assign_order_to_rider(db, order_id, rider_id)

@app.get("/riders/{rider_id}/orders", response_model=List[schemas.Order])
def read_rider_orders(rider_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_rider_orders(db, rider_id)

@app.put("/riders/{rider_id}/location", response_model=schemas.User)
def update_location(rider_id: int, location: schemas.LocationUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.update_rider_location(db, rider_id, location.lat, location.lng)

# In-memory storage for traffic points (for demo purposes)
TRAFFIC_POINTS = []

@app.post("/traffic")
def report_traffic(location: schemas.LocationUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    TRAFFIC_POINTS.append((location.lat, location.lng))
    return {"message": "Traffic reported", "location": location}

@app.post("/optimize/{rider_id}")
def optimize_route(rider_id: int, avoid_traffic: bool = False, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    rider = crud.get_user(db, rider_id)
    if not rider:
        raise HTTPException(status_code=404, detail="Rider not found")
    
    orders = crud.get_rider_orders(db, rider_id)
    if not orders:
        return {"message": "No orders assigned"}

    points = []
    if rider.current_lat and rider.current_lng:
        points.append((rider.current_lat, rider.current_lng))
    
    # Prepare order data with constraints
    orders_data = []
    for order in orders:
        points.append((order.lat, order.lng))
        orders_data.append({
            'lat': order.lat,
            'lng': order.lng,
            'priority': order.priority if hasattr(order, 'priority') else 1,
            'weight': order.weight if hasattr(order, 'weight') else 1.0,
            'delivery_time_start': order.delivery_time_start if hasattr(order, 'delivery_time_start') else None,
            'delivery_time_end': order.delivery_time_end if hasattr(order, 'delivery_time_end') else None,
        })
        
    if len(points) < 2:
        return {"message": "Not enough points for routing"}

    # Get rider capacity
    rider_capacity = rider.capacity if hasattr(rider, 'capacity') else 10.0
    
    avoid_points = TRAFFIC_POINTS if avoid_traffic else None
    
    route_data = routing.get_optimized_route(points, orders_data, rider_capacity, avoid_points=avoid_points)
    
    if route_data:
        return route_data
    else:
        raise HTTPException(status_code=500, detail="Routing failed")

@app.post("/orders/auto-assign")
def auto_assign_orders(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Intelligent order grouping and assignment based on:
    - Proximity clustering
    - Rider availability and location
    - Rider capacity constraints
    """
    # Get all pending orders
    pending_orders = db.query(models.Order).filter(models.Order.status == models.OrderStatus.PENDING).all()
    
    if not pending_orders:
        return {"message": "No pending orders", "assigned": 0}
    
    # Get available riders
    available_riders = db.query(models.User).filter(
        models.User.role == 'rider',
        models.User.status == models.RiderStatus.AVAILABLE
    ).all()
    
    if not available_riders:
        return {"message": "No available riders", "assigned": 0}
    
    # Convert orders to dict format for clustering
    orders_list = [
        {
            'id': o.id,
            'lat': o.lat,
            'lng': o.lng,
            'weight': o.weight if hasattr(o, 'weight') else 1.0,
            'priority': o.priority if hasattr(o, 'priority') else 1,
        }
        for o in pending_orders
    ]
    
    # Cluster orders by proximity
    clusters = routing.cluster_orders_by_proximity(orders_list, max_distance_km=5.0)
    
    assigned_count = 0
    
    # Assign each cluster to nearest available rider
    for cluster in clusters:
        if not available_riders:
            break
            
        # Calculate cluster center
        cluster_lat = sum(o['lat'] for o in cluster) / len(cluster)
        cluster_lng = sum(o['lng'] for o in cluster) / len(cluster)
        
        # Find nearest rider with capacity
        cluster_weight = sum(o['weight'] for o in cluster)
        suitable_riders = [
            r for r in available_riders 
            if (hasattr(r, 'capacity') and r.capacity >= cluster_weight) or not hasattr(r, 'capacity')
        ]
        
        if not suitable_riders:
            continue
        
        nearest_rider = min(
            suitable_riders,
            key=lambda r: routing.calculate_distance(
                (r.current_lat or cluster_lat, r.current_lng or cluster_lng),
                (cluster_lat, cluster_lng)
            ) if r.current_lat and r.current_lng else float('inf')
        )
        
        # Assign all orders in cluster to this rider
        for order_data in cluster:
            order = db.query(models.Order).filter(models.Order.id == order_data['id']).first()
            if order:
                order.rider_id = nearest_rider.id
                order.status = models.OrderStatus.ASSIGNED
                assigned_count += 1
        
        # Mark rider as busy
        nearest_rider.status = models.RiderStatus.BUSY
        available_riders.remove(nearest_rider)
    
    db.commit()
    
    return {
        "message": "Orders assigned successfully",
        "assigned": assigned_count,
        "clusters": len(clusters),
        "riders_used": len([r for r in db.query(models.User).filter(models.User.role == 'rider', models.User.status == models.RiderStatus.BUSY).all()])
    }

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = None):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Keep connection alive
            await websocket.send_json({"type": "ping", "data": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/orders/{order_id}/cancel")
async def cancel_order(order_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Cancel an order and trigger re-routing for affected rider
    """
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.status == models.OrderStatus.DELIVERED:
        raise HTTPException(status_code=400, detail="Cannot cancel delivered order")
    
    affected_rider_id = order.rider_id
    old_status = order.status
    
    # Cancel the order
    order.status = models.OrderStatus.CANCELLED
    order.rider_id = None
    db.commit()
    
    # Broadcast order cancellation to all connected clients
    await manager.broadcast({
        "type": "order_cancelled",
        "data": {
            "order_id": order_id,
            "rider_id": affected_rider_id,
            "old_status": old_status
        }
    })
    
    # If order was assigned to a rider, re-optimize their remaining orders
    if affected_rider_id:
        remaining_orders = db.query(models.Order).filter(
            models.Order.rider_id == affected_rider_id,
            models.Order.status != models.OrderStatus.CANCELLED,
            models.Order.status != models.OrderStatus.DELIVERED
        ).all()
        
        if remaining_orders:
            # Re-optimize route for this rider
            try:
                points = [(o.lat, o.lng) for o in remaining_orders]
                orders_data = [
                    {
                        'id': o.id,
                        'priority': o.priority,
                        'weight': o.weight,
                        'delivery_time_start': o.delivery_time_start,
                        'delivery_time_end': o.delivery_time_end
                    }
                    for o in remaining_orders
                ]
                
                rider = db.query(models.User).filter(models.User.id == affected_rider_id).first()
                rider_capacity = rider.capacity if hasattr(rider, 'capacity') else 10.0
                
                route_data = routing.get_optimized_route(points, orders_data, rider_capacity)
                
                # Broadcast route update
                await manager.broadcast({
                    "type": "route_updated",
                    "data": {
                        "rider_id": affected_rider_id,
                        "route": route_data
                    }
                })
            except Exception as e:
                print(f"Error re-optimizing route: {e}")
    
    return {
        "message": "Order cancelled successfully",
        "order_id": order_id,
        "affected_rider": affected_rider_id,
        "re_optimized": affected_rider_id is not None
    }

@app.get("/orders/{order_id}")
async def get_order(order_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Get a specific order by ID
    """
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
