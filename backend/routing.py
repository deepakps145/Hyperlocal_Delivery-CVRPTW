import requests
import json
import math
from datetime import datetime, timedelta
from typing import List, Tuple, Optional

GRAPHHOPPER_URL = "http://localhost:8989/route"

def calculate_distance(p1, p2):
    """Haversine distance in km"""
    lat1, lon1 = p1
    lat2, lon2 = p2
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c

def cluster_orders_by_proximity(orders: list, max_distance_km: float = 5.0) -> List[List]:
    """
    Group orders within max_distance_km radius using simple clustering.
    Returns list of order clusters.
    """
    if not orders:
        return []
    
    clusters = []
    unclustered = orders.copy()
    
    while unclustered:
        # Start new cluster with first unclustered order
        seed = unclustered.pop(0)
        cluster = [seed]
        
        # Find nearby orders
        i = 0
        while i < len(unclustered):
            order = unclustered[i]
            # Check distance to any order in current cluster
            if any(calculate_distance((seed['lat'], seed['lng']), (order['lat'], order['lng'])) <= max_distance_km 
                   for seed in cluster):
                cluster.append(unclustered.pop(i))
            else:
                i += 1
        
        clusters.append(cluster)
    
    return clusters

def check_time_window_feasible(order, estimated_arrival_time):
    """Check if arrival time fits within order's delivery window"""
    if not order.get('delivery_time_start') or not order.get('delivery_time_end'):
        return True  # No time constraint
    
    start = order['delivery_time_start']
    end = order['delivery_time_end']
    
    if isinstance(start, str):
        start = datetime.fromisoformat(start)
    if isinstance(end, str):
        end = datetime.fromisoformat(end)
    if isinstance(estimated_arrival_time, str):
        estimated_arrival_time = datetime.fromisoformat(estimated_arrival_time)
    
    return start <= estimated_arrival_time <= end

def calculate_total_weight(orders: list) -> float:
    """Calculate total weight of orders"""
    return sum(o.get('weight', 1.0) for o in orders)

def solve_tsp_with_constraints(points: list, orders_data: list = None, rider_capacity: float = 10.0):
    """
    TSP with time windows and capacity constraints.
    points: list of (lat, lng). Assumes points[0] is the start (rider).
    orders_data: list of order dicts with priority, weight, time windows
    Returns: reordered list of points respecting constraints
    """
    if not points or len(points) <= 2:
        return points
    
    # If no order data provided, fallback to simple nearest neighbor
    if not orders_data or len(orders_data) != len(points) - 1:
        return solve_tsp_nearest_neighbor(points)
    
    # Check capacity constraint
    total_weight = calculate_total_weight(orders_data)
    if total_weight > rider_capacity:
        # Split into multiple trips (simplified: take first batch that fits)
        cumulative_weight = 0
        feasible_orders = []
        for order in sorted(orders_data, key=lambda x: x.get('priority', 1), reverse=True):
            if cumulative_weight + order.get('weight', 1.0) <= rider_capacity:
                feasible_orders.append(order)
                cumulative_weight += order.get('weight', 1.0)
        
        # Reconstruct points for feasible orders only
        points = [points[0]] + [points[orders_data.index(o) + 1] for o in feasible_orders]
        orders_data = feasible_orders
    
    # Sort by priority first, then apply nearest neighbor
    start = points[0]
    remaining_indices = list(range(1, len(points)))
    
    # Group by priority
    priority_groups = {}
    for i, order in enumerate(orders_data):
        priority = order.get('priority', 1)
        if priority not in priority_groups:
            priority_groups[priority] = []
        priority_groups[priority].append(i + 1)  # +1 because points[0] is rider
    
    # Process high priority first, then apply greedy nearest neighbor within each group
    path = [start]
    current = start
    
    for priority in sorted(priority_groups.keys(), reverse=True):
        group_indices = priority_groups[priority]
        while group_indices:
            nearest_idx = min(group_indices, key=lambda idx: calculate_distance(current, points[idx]))
            path.append(points[nearest_idx])
            current = points[nearest_idx]
            group_indices.remove(nearest_idx)
    
    return path

def solve_tsp_nearest_neighbor(points):
    """
    Simple nearest neighbor TSP.
    points: list of (lat, lng). Assumes points[0] is the start (rider).
    Returns: reordered list of points.
    """
    if not points or len(points) <= 2:
        return points
    
    start = points[0]
    to_visit = points[1:]
    path = [start]
    current = start
    
    while to_visit:
        nearest = min(to_visit, key=lambda p: calculate_distance(current, p))
        path.append(nearest)
        to_visit.remove(nearest)
        current = nearest
        
    return path

def get_optimized_route(points: list, orders_data: list = None, rider_capacity: float = 10.0, avoid_points: list = None):
    """
    points: list of [lat, lng]
    orders_data: optional list of order dicts with constraints
    avoid_points: optional list of (lat, lng) to avoid
    """
    # First, reorder points using TSP heuristic with constraints
    ordered_points = solve_tsp_with_constraints(points, orders_data, rider_capacity)

    # GraphHopper expects point=lat,lng&point=lat,lng...
    
    # Construct query parameters
    params = {
        "vehicle": "car", # or bike
        "points_encoded": "false",
        "profile": "car"
    }
    
    # Add avoid points if any
    if avoid_points:
        params["ch.disable"] = "true"
        # Format: lat,lon,radius (radius in meters)
        # We'll use a default radius of 200m for traffic avoidance
        block_areas = [f"{p[0]},{p[1]},200" for p in avoid_points]
        # GraphHopper might expect multiple block_area params or a specific format
        # Standard GH uses 'block_area' parameter multiple times
        # We'll handle this in the query construction below
    
    # Add points to params. requests handles multiple keys with same name if passed as list of tuples
    query_points = [("point", f"{p[0]},{p[1]}") for p in ordered_points]
    
    # Add block_area params
    if avoid_points:
        for p in avoid_points:
            query_points.append(("block_area", f"{p[0]},{p[1]},200"))

    try:
        response = requests.get(GRAPHHOPPER_URL, params=query_points + list(params.items()))
        if response.status_code == 200:
            data = response.json()
            if "paths" in data and len(data["paths"]) > 0:
                path = data["paths"][0]
                return {
                    "distance": path["distance"],
                    "time": path["time"],
                    "points": path["points"], # GeoJSON
                    "ordered_points": ordered_points # Return the order for UI if needed
                }
    except Exception as e:
        print(f"Error connecting to GraphHopper: {e}")
        # Fallback to straight lines
        return {
            "distance": 0,
            "time": 0,
            "points": {
                "type": "LineString",
                "coordinates": [[p[1], p[0]] for p in ordered_points]
            },
            "ordered_points": ordered_points
        }
    return None

def solve_vrp(orders, vehicles):
    # This would connect to GraphHopper Route Optimization API (if available locally or via cloud)
    # Since we are using the open source routing engine, we might just do simple TSP for single rider
    # or use jsprit if integrated.
    # For this MVP, we will assume a simple TSP for the assigned rider.
    pass
