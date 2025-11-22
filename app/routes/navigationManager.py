from fastapi import APIRouter

router = APIRouter(prefix="/nav", tags=["Navigation"])

@router.get("/sidebar")
def get_sidebar_menu():
    return [
        {"label": "Dashboard", "icon": "dashboard", "path": "/dashboard"},

        {"label": "Products", "icon": "inventory", "children": [
            {"label": "All Products", "path": "/products"},
            {"label": "Stock Availability", "path": "/products/stock"},
            {"label": "Categories", "path": "/products/categories"},
            {"label": "Reordering Rules", "path": "/products/reorder-rules"},
        ]},

        {"label": "Operations", "icon": "swap_horiz", "children": [
            {"label": "Receipts", "path": "/operations/receipts"},
            {"label": "Delivery Orders", "path": "/operations/deliveries"},
            {"label": "Internal Transfers", "path": "/operations/internal"},
            {"label": "Stock Adjustments", "path": "/operations/adjustments"},
        ]},

        {"label": "Move History", "icon": "history", "path": "/moves"},
        {"label": "Settings", "icon": "settings", "path": "/settings"},

        {"label": "Profile", "icon": "person", "children": [
            {"label": "My Profile", "path": "/profile"},
            {"label": "Logout", "path": "/logout"},
        ]},
    ]
