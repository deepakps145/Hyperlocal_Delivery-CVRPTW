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
async def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_order = crud.create_order(db=db, order=order)
    return new_order

@app.get("/orders/", response_model=List[schemas.Order])
def read_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_orders(db, skip=skip, limit=limit)

@app.get("/orders/available", response_model=List[schemas.Order])
def read_available_orders(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_available_orders(db)

@app.post("/orders/{order_id}/pick", response_model=schemas.Order)
async def pick_order(order_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != 'rider':
        raise HTTPException(status_code=403, detail="Only riders can pick orders")
    
    # Update status to IN_TRANSIT
    order = crud.update_order_status(db, order_id, models.OrderStatus.IN_TRANSIT)
    
    # Trigger route optimization for the rider
    try:
        rider = current_user
        orders = crud.get_rider_orders(db, rider.id)
        
        points = []
        if rider.current_lat and rider.current_lng:
            points.append((rider.current_lat, rider.current_lng))
        
        orders_data = []
        for o in orders:
            # Only include IN_TRANSIT orders in route optimization
            if o.status == models.OrderStatus.IN_TRANSIT:
                points.append((o.lat, o.lng))
                orders_data.append({
                    'lat': o.lat,
                    'lng': o.lng,
                    'priority': o.priority if hasattr(o, 'priority') else 1,
                    'weight': o.weight if hasattr(o, 'weight') else 1.0,
                    'delivery_time_start': o.delivery_time_start if hasattr(o, 'delivery_time_start') else None,
                    'delivery_time_end': o.delivery_time_end if hasattr(o, 'delivery_time_end') else None,
                })
        
        if len(points) >= 2:
            rider_capacity = rider.capacity if hasattr(rider, 'capacity') else 10.0
            from fastapi.concurrency import run_in_threadpool
            route_data = await run_in_threadpool(routing.get_optimized_route, points, orders_data, rider_capacity)
            
            # Broadcast route update
            await manager.broadcast({
                "type": "route_updated",
                "data": {
                    "rider_id": rider.id,
                    "route": route_data
                }
            })
            
        # Broadcast order assignment/update
        await manager.broadcast({
            "type": "order_assigned",
            "data": {
                "order_id": order.id,
                "rider_id": rider.id,
                "status": order.status
            }
        })
            
    except Exception as e:
        print(f"Error optimizing route: {e}")
        
    return order

@app.put("/orders/{order_id}/status", response_model=schemas.Order)
def update_order_status(order_id: int, status: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.update_order_status(db, order_id, status)

@app.post("/orders/{order_id}/assign/{rider_id}", response_model=schemas.Order)
async def assign_order(order_id: int, rider_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    order = crud.assign_order_to_rider(db, order_id, rider_id)
    
    # Trigger route optimization for the rider
    try:
        rider = db.query(models.User).filter(models.User.id == rider_id).first()
        orders = crud.get_rider_orders(db, rider_id)
        
        points = []
        if rider.current_lat and rider.current_lng:
            points.append((rider.current_lat, rider.current_lng))
        
        orders_data = []
        for o in orders:
            points.append((o.lat, o.lng))
            orders_data.append({
                'lat': o.lat,
                'lng': o.lng,
                'priority': o.priority if hasattr(o, 'priority') else 1,
                'weight': o.weight if hasattr(o, 'weight') else 1.0,
                'delivery_time_start': o.delivery_time_start if hasattr(o, 'delivery_time_start') else None,
                'delivery_time_end': o.delivery_time_end if hasattr(o, 'delivery_time_end') else None,
            })
        
        if len(points) >= 2:
            rider_capacity = rider.capacity if hasattr(rider, 'capacity') else 10.0
            # Run routing in threadpool to avoid blocking event loop
            from fastapi.concurrency import run_in_threadpool
            route_data = await run_in_threadpool(routing.get_optimized_route, points, orders_data, rider_capacity)
            
            # Broadcast route update
            await manager.broadcast({
                "type": "route_updated",
                "data": {
                    "rider_id": rider_id,
                    "route": route_data
                }
            })
            
        # Broadcast order assignment
        await manager.broadcast({
            "type": "order_assigned",
            "data": {
                "order_id": order.id,
                "rider_id": rider.id
            }
        })
            
    except Exception as e:
        print(f"Error optimizing route: {e}")
        
    return order

@app.get("/riders/{rider_id}/orders", response_model=List[schemas.Order])
def read_rider_orders(rider_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_rider_orders(db, rider_id)

@app.put("/riders/{rider_id}/location", response_model=schemas.User)
async def update_location(rider_id: int, location: schemas.LocationUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    updated_rider = crud.update_rider_location(db, rider_id, location.lat, location.lng)
    
    # Broadcast location update
    await manager.broadcast({
        "type": "rider_update",
        "data": {
            "rider_id": rider_id,
            "lat": location.lat,
            "lng": location.lng,
            "name": updated_rider.name
        }
    })
    
    return updated_rider

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
        # Only include IN_TRANSIT orders in route optimization
        if order.status == models.OrderStatus.IN_TRANSIT:
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
        # If no orders are picked up, return empty route or just rider location
        return {"points": points, "paths": [], "distance": 0, "time": 0}

    # Get rider capacity
    rider_capacity = rider.capacity if hasattr(rider, 'capacity') else 10.0
    
    avoid_points = TRAFFIC_POINTS if avoid_traffic else None
    
    route_data = routing.get_optimized_route(points, orders_data, rider_capacity, avoid_points=avoid_points)
    
    if route_data:
        return route_data
    else:
        raise HTTPException(status_code=500, detail="Routing failed")

@app.post("/orders/auto-assign")
async def auto_assign_orders(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Force assign ALL pending orders to available riders irrespective of capacity.
    """
    # Get all pending orders
    pending_orders = db.query(models.Order).filter(models.Order.status == models.OrderStatus.PENDING).all()
    
    if not pending_orders:
        return {"message": "No pending orders", "assigned": 0}
    
    # Get ALL riders (case insensitive)
    riders = db.query(models.User).filter(models.User.role.ilike('rider')).all()

    if not riders:
        return {"message": "No riders found", "assigned": 0}
    
    assigned_count = 0
    affected_riders = set()
    
    # Assign each order
    for order in pending_orders:
        # If only one rider, assign to them directly
        if len(riders) == 1:
            nearest_rider = riders[0]
        else:
            # Find nearest rider (ignoring capacity)
            nearest_rider = min(
                riders,
                key=lambda r: routing.calculate_distance(
                    (r.current_lat, r.current_lng),
                    (order.lat, order.lng)
                ) if r.current_lat and r.current_lng else float('inf')
            )
        
        # Assign order
        order.rider_id = nearest_rider.id
        order.status = models.OrderStatus.ASSIGNED
        assigned_count += 1
        
        # Mark rider as busy if not already
        if nearest_rider.status == models.RiderStatus.AVAILABLE:
            nearest_rider.status = models.RiderStatus.BUSY
            
        affected_riders.add(nearest_rider.id)
    
    db.commit()

    # Trigger route optimization for affected riders
    for rider_id in affected_riders:
        try:
            rider = db.query(models.User).filter(models.User.id == rider_id).first()
            orders = crud.get_rider_orders(db, rider_id)
            
            points = []
            if rider.current_lat and rider.current_lng:
                points.append((rider.current_lat, rider.current_lng))
            
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
            
            if len(points) >= 2:
                rider_capacity = rider.capacity if hasattr(rider, 'capacity') else 10.0
                from fastapi.concurrency import run_in_threadpool
                route_data = await run_in_threadpool(routing.get_optimized_route, points, orders_data, rider_capacity)
                
                # Broadcast route update
                await manager.broadcast({
                    "type": "route_updated",
                    "data": {
                        "rider_id": rider_id,
                        "route": route_data
                    }
                })
        except Exception as e:
            print(f"Error optimizing route for rider {rider_id}: {e}")
    
    # Broadcast general update
    await manager.broadcast({
        "type": "orders_assigned",
        "count": assigned_count
    })
    
    return {
        "message": "Orders assigned successfully",
        "assigned": assigned_count,
        "riders_used": len(affected_riders)
    }

@app.post("/riders/{rider_id}/pick-all")
def pick_all_orders(rider_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Get all assigned orders for rider
    orders = db.query(models.Order).filter(models.Order.rider_id == rider_id, models.Order.status == models.OrderStatus.ASSIGNED).all()
    for order in orders:
        order.status = models.OrderStatus.IN_TRANSIT # or PICKED_UP
    db.commit()
    return {"message": f"Picked up {len(orders)} orders"}

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

@app.delete("/orders/{order_id}")
async def delete_order(order_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Permanently delete an order from the database
    """
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    affected_rider_id = order.rider_id
    
    # Delete the order
    db.delete(order)
    db.commit()
    
    # Broadcast order deletion
    await manager.broadcast({
        "type": "order_deleted",
        "data": {
            "order_id": order_id,
            "rider_id": affected_rider_id
        }
    })
    
    return {
        "message": "Order deleted successfully",
        "order_id": order_id
    }

@app.get("/orders/stats")
async def get_order_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Get order statistics
    """
    total = db.query(models.Order).count()
    pending = db.query(models.Order).filter(models.Order.status == models.OrderStatus.PENDING).count()
    assigned = db.query(models.Order).filter(models.Order.status == models.OrderStatus.ASSIGNED).count()
    in_transit = db.query(models.Order).filter(models.Order.status == models.OrderStatus.IN_TRANSIT).count()
    delivered = db.query(models.Order).filter(models.Order.status == models.OrderStatus.DELIVERED).count()
    cancelled = db.query(models.Order).filter(models.Order.status == models.OrderStatus.CANCELLED).count()
    
    return {
        "total": total,
        "pending": pending,
        "assigned": assigned,
        "in_transit": in_transit,
        "delivered": delivered,
        "cancelled": cancelled
    }

@app.get("/riders/{rider_id}/stats")
async def get_rider_stats(rider_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Get rider statistics
    """
    rider = db.query(models.User).filter(models.User.id == rider_id).first()
    if not rider:
        raise HTTPException(status_code=404, detail="Rider not found")
    
    total_orders = db.query(models.Order).filter(models.Order.rider_id == rider_id).count()
    active_orders = db.query(models.Order).filter(
        models.Order.rider_id == rider_id,
        models.Order.status.in_([models.OrderStatus.ASSIGNED, models.OrderStatus.IN_TRANSIT])
    ).count()
    
    return {
        "rider_id": rider_id,
        "name": rider.name,
        "status": rider.status,
        "total_orders": total_orders,
        "active_orders": active_orders,
        "current_location": {
            "lat": rider.current_lat,
            "lng": rider.current_lng
        }
    }
