from database import SessionLocal
from models import User, Order
from auth import get_password_hash
from datetime import datetime, timedelta

def seed_db():
    db = SessionLocal()
    
    # Check if admin exists
    admin = db.query(User).filter(User.email == "admin@example.com").first()
    if not admin:
        print("Creating admin user...")
        admin_user = User(
            name="Admin User",
            email="admin@example.com",
            hashed_password=get_password_hash("admin123"),
            role="admin"
        )
        db.add(admin_user)
    
    # Create multiple riders in different locations
    riders_data = [
        {
            "name": "Rider 1 - Bangalore",
            "email": "rider1@example.com",
            "lat": 12.9716,
            "lng": 77.5946,
            "capacity": 15.0
        },
        {
            "name": "Rider 2 - Koramangala",
            "email": "rider2@example.com",
            "lat": 12.9352,
            "lng": 77.6245,
            "capacity": 12.0
        },
        {
            "name": "Rider 3 - Indiranagar",
            "email": "rider3@example.com",
            "lat": 12.9784,
            "lng": 77.6408,
            "capacity": 10.0
        },
        {
            "name": "Rider 4 - Whitefield",
            "email": "rider4@example.com",
            "lat": 12.9698,
            "lng": 77.7500,
            "capacity": 20.0
        }
    ]
    
    for rider_data in riders_data:
        rider = db.query(User).filter(User.email == rider_data["email"]).first()
        if not rider:
            print(f"Creating {rider_data['name']}...")
            rider_user = User(
                name=rider_data["name"],
                email=rider_data["email"],
                hashed_password=get_password_hash("rider123"),
                role="rider",
                status="available",
                current_lat=rider_data["lat"],
                current_lng=rider_data["lng"],
                capacity=rider_data["capacity"]
            )
            db.add(rider_user)
    
    db.commit()
    
    # Create test orders in different clusters
    orders_data = [
        # Cluster 1: Near Bangalore center (12.97°N, 77.59°E)
        {
            "customer_name": "Customer 1 - MG Road",
            "delivery_address": "Brigade Road, Bangalore",
            "lat": 12.9722,
            "lng": 77.6102,
            "priority": 1,  # High priority
            "weight": 2.5,
            "time_start": datetime.now() + timedelta(hours=1),
            "time_end": datetime.now() + timedelta(hours=3)
        },
        {
            "customer_name": "Customer 2 - Cubbon Park",
            "delivery_address": "Ulsoor, Bangalore",
            "lat": 12.9810,
            "lng": 77.6186,
            "priority": 2,  # Medium priority
            "weight": 1.5,
            "time_start": datetime.now() + timedelta(hours=1),
            "time_end": datetime.now() + timedelta(hours=4)
        },
        {
            "customer_name": "Customer 3 - Richmond Circle",
            "delivery_address": "Commercial Street, Bangalore",
            "lat": 12.9820,
            "lng": 77.6094,
            "priority": 1,  # High priority
            "weight": 3.0,
            "time_start": datetime.now() + timedelta(hours=1),
            "time_end": datetime.now() + timedelta(hours=2)
        },
        
        # Cluster 2: Near Koramangala (12.93°N, 77.62°E)
        {
            "customer_name": "Customer 4 - Koramangala 5th",
            "delivery_address": "Koramangala 6th Block",
            "lat": 12.9330,
            "lng": 77.6187,
            "priority": 2,  # Medium priority
            "weight": 2.0,
            "time_start": datetime.now() + timedelta(hours=2),
            "time_end": datetime.now() + timedelta(hours=5)
        },
        {
            "customer_name": "Customer 5 - Koramangala 1st",
            "delivery_address": "Koramangala 7th Block",
            "lat": 12.9388,
            "lng": 77.6160,
            "priority": 3,  # Low priority
            "weight": 1.0,
            "time_start": datetime.now() + timedelta(hours=3),
            "time_end": datetime.now() + timedelta(hours=6)
        },
        
        # Cluster 3: Near Indiranagar (12.97°N, 77.64°E)
        {
            "customer_name": "Customer 6 - Indiranagar",
            "delivery_address": "Indiranagar CMH Road",
            "lat": 12.9716,
            "lng": 77.6412,
            "priority": 1,  # High priority
            "weight": 4.0,
            "time_start": datetime.now() + timedelta(hours=1),
            "time_end": datetime.now() + timedelta(hours=3)
        },
        {
            "customer_name": "Customer 7 - Indiranagar Metro",
            "delivery_address": "HAL 2nd Stage",
            "lat": 12.9700,
            "lng": 77.6450,
            "priority": 2,  # Medium priority
            "weight": 2.5,
            "time_start": datetime.now() + timedelta(hours=2),
            "time_end": datetime.now() + timedelta(hours=4)
        },
        
        # Cluster 4: Near Whitefield (12.96°N, 77.75°E) - Far from others
        {
            "customer_name": "Customer 8 - Whitefield",
            "delivery_address": "ITPL, Whitefield",
            "lat": 12.9850,
            "lng": 77.7270,
            "priority": 1,  # High priority
            "weight": 5.0,
            "time_start": datetime.now() + timedelta(hours=1),
            "time_end": datetime.now() + timedelta(hours=3)
        },
        {
            "customer_name": "Customer 9 - Whitefield Forum",
            "delivery_address": "Marathahalli",
            "lat": 12.9592,
            "lng": 77.6974,
            "priority": 3,  # Low priority
            "weight": 1.5,
            "time_start": datetime.now() + timedelta(hours=3),
            "time_end": datetime.now() + timedelta(hours=6)
        },
        
        # Additional orders for testing
        {
            "customer_name": "Customer 10 - Jayanagar",
            "delivery_address": "Jayanagar 9th Block",
            "lat": 12.9100,
            "lng": 77.5750,
            "priority": 2,  # Medium priority
            "weight": 3.5,
            "time_start": datetime.now() + timedelta(hours=2),
            "time_end": datetime.now() + timedelta(hours=5)
        }
    ]
    
    for order_data in orders_data:
        # Check if order already exists
        existing_order = db.query(Order).filter(
            Order.customer_name == order_data["customer_name"]
        ).first()
        
        if not existing_order:
            print(f"Creating order for {order_data['customer_name']}...")
            order = Order(
                customer_name=order_data["customer_name"],
                delivery_address=order_data["delivery_address"],
                lat=order_data["lat"],
                lng=order_data["lng"],
                status="pending",
                priority=order_data["priority"],
                weight=order_data["weight"],
                delivery_time_start=order_data["time_start"],
                delivery_time_end=order_data["time_end"]
            )
            db.add(order)
    
    db.commit()
    db.close()
    print("\n✅ Database seeded successfully!")
    print(f"   - Created 4 riders with different capacities")
    print(f"   - Created 10 test orders in 4 geographic clusters")
    print(f"   - Orders have priorities (1=high, 2=medium, 3=low)")
    print(f"   - Orders have weights (1.0kg - 5.0kg)")
    print(f"   - Orders have time windows")
    print("\nYou can now test the auto-assign functionality!")

if __name__ == "__main__":
    seed_db()
