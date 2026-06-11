from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, re, uuid, jwt, bcrypt, logging, random
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ.get("JWT_SECRET", "logistics-marketplace-secret-key-2026")
JWT_ALGO = "HS256"

app = FastAPI(title="Logistics Marketplace API")
api = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============== Helpers ==============
def now_iso():
    return datetime.now(timezone.utc).isoformat()

def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()

def verify_password(p: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(p.encode(), h.encode())
    except Exception:
        return False

def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[Dict]:
    if not creds:
        return None
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password": 0})
        return user
    except Exception:
        return None

async def require_user(user=Depends(get_current_user)):
    if not user:
        raise HTTPException(401, "Authentication required")
    return user

async def require_role(*roles):
    async def _check(user=Depends(require_user)):
        if user.get("role") not in roles:
            raise HTTPException(403, "Forbidden")
        return user
    return _check

def valid_gst(gst: str) -> bool:
    # 15-char GSTIN format: 2 digits (state) + 10 chars PAN + 1 entity + Z + 1 check
    return bool(re.match(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$", gst or ""))

def valid_pan(pan: str) -> bool:
    return bool(re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$", pan or ""))


# ============== Pydantic Models ==============
class SendOtp(BaseModel):
    mobile: str

class VerifyOtp(BaseModel):
    mobile: str
    otp: str

class BusinessRegister(BaseModel):
    company_name: str
    gst_number: str
    contact_person: str
    mobile: str
    email: EmailStr
    password: str
    otp: str

class CourierRegister(BaseModel):
    company_name: str
    gst_number: str
    pan_number: str
    contact_person: str
    mobile: str
    email: EmailStr
    password: str
    years_experience: int
    otp: str

class LoginInput(BaseModel):
    email: EmailStr
    password: str

class RateCardIn(BaseModel):
    pickup_city: str
    delivery_city: str
    transport_mode: str
    weight_slab: str
    delivery_timeline: str
    pricing_type: str  # per_kg | fixed | minimum
    base_rate: float
    min_charge: float = 0
    fuel_pct: float = 8
    handling: float = 50
    insurance_pct: float = 0.5
    pickup_charge: float = 0
    delivery_charge: float = 0

class CoverageIn(BaseModel):
    states: List[str] = []
    cities: List[str] = []
    pincodes: List[str] = []

class FreightCalcIn(BaseModel):
    courier_id: str
    pickup_city: str
    delivery_city: str
    weight: float
    transport_mode: str

class LeadIn(BaseModel):
    courier_id: str
    pickup_city: str
    pickup_state: Optional[str] = ""
    pickup_pincode: Optional[str] = ""
    delivery_city: str
    delivery_state: Optional[str] = ""
    delivery_pincode: Optional[str] = ""
    weight: float
    parcel_type: str
    transport_mode: str
    dispatch_date: Optional[str] = ""
    notes: Optional[str] = ""
    action: str  # 'callback' or 'quote'


# ============== Constants ==============
WEIGHT_SLABS = ["1-100 KG", "101-500 KG", "501-1000 KG", "1001-5000 KG", "5001+ KG"]
TRANSPORT_MODES = ["Air Cargo", "Rail Cargo", "Road Transport", "Surface Cargo", "Express Delivery"]
PARCEL_TYPES = ["Documents", "Electronics", "Industrial Goods", "Machinery", "Fragile Items", "FMCG", "Pharmaceuticals", "General Cargo", "Heavy Cargo"]

def slab_for_weight(w: float) -> str:
    if w <= 100: return "1-100 KG"
    if w <= 500: return "101-500 KG"
    if w <= 1000: return "501-1000 KG"
    if w <= 5000: return "1001-5000 KG"
    return "5001+ KG"


# ============== Auth endpoints ==============
@api.post("/auth/send-otp")
async def send_otp(data: SendOtp):
    if not re.match(r"^[6-9]\d{9}$", data.mobile):
        raise HTTPException(400, "Invalid Indian mobile number")
    otp = "123456"  # MOCKED for dev
    await db.otps.update_one(
        {"mobile": data.mobile},
        {"$set": {"mobile": data.mobile, "otp": otp, "created_at": now_iso()}},
        upsert=True,
    )
    return {"success": True, "message": "OTP sent (mock)", "dev_otp": otp}

@api.post("/auth/verify-otp")
async def verify_otp(data: VerifyOtp):
    rec = await db.otps.find_one({"mobile": data.mobile})
    if not rec or rec.get("otp") != data.otp:
        raise HTTPException(400, "Invalid OTP")
    return {"success": True, "verified": True}

async def _check_otp(mobile: str, otp: str):
    rec = await db.otps.find_one({"mobile": mobile})
    if not rec or rec.get("otp") != otp:
        raise HTTPException(400, "Invalid or expired OTP")

@api.post("/auth/register-business")
async def register_business(data: BusinessRegister):
    await _check_otp(data.mobile, data.otp)
    if not valid_gst(data.gst_number):
        raise HTTPException(400, "Invalid GST format. Expected 15-char GSTIN")
    if await db.users.find_one({"email": data.email}):
        raise HTTPException(400, "Email already registered")
    uid = str(uuid.uuid4())
    user = {
        "id": uid,
        "role": "business",
        "company_name": data.company_name,
        "gst_number": data.gst_number,
        "contact_person": data.contact_person,
        "mobile": data.mobile,
        "email": data.email,
        "password": hash_password(data.password),
        "mobile_verified": True,
        "email_verified": True,
        "gst_verified": True,
        "status": "active",
        "created_at": now_iso(),
    }
    await db.users.insert_one(user)
    token = create_token(uid, "business")
    user.pop("_id", None); user.pop("password", None)
    return {"token": token, "user": user}

@api.post("/auth/register-courier")
async def register_courier(data: CourierRegister):
    await _check_otp(data.mobile, data.otp)
    if not valid_gst(data.gst_number):
        raise HTTPException(400, "Invalid GST format")
    if not valid_pan(data.pan_number):
        raise HTTPException(400, "Invalid PAN format")
    if await db.users.find_one({"email": data.email}):
        raise HTTPException(400, "Email already registered")
    uid = str(uuid.uuid4())
    user = {
        "id": uid,
        "role": "courier",
        "company_name": data.company_name,
        "gst_number": data.gst_number,
        "pan_number": data.pan_number,
        "contact_person": data.contact_person,
        "mobile": data.mobile,
        "email": data.email,
        "password": hash_password(data.password),
        "years_experience": data.years_experience,
        "mobile_verified": True,
        "email_verified": True,
        "gst_verified": True,
        "admin_approved": False,
        "status": "pending_approval",
        "rating": 4.5,
        "is_premium": False,
        "is_featured": False,
        "created_at": now_iso(),
    }
    await db.users.insert_one(user)
    # default empty coverage
    await db.coverage.insert_one({"id": str(uuid.uuid4()), "courier_id": uid, "states": [], "cities": [], "pincodes": []})
    token = create_token(uid, "courier")
    user.pop("_id", None); user.pop("password", None)
    return {"token": token, "user": user}

@api.post("/auth/login")
async def login(data: LoginInput):
    u = await db.users.find_one({"email": data.email})
    if not u or not verify_password(data.password, u.get("password", "")):
        raise HTTPException(401, "Invalid credentials")
    token = create_token(u["id"], u["role"])
    u.pop("_id", None); u.pop("password", None)
    return {"token": token, "user": u}

@api.get("/auth/me")
async def me(user=Depends(require_user)):
    return user


# ============== Public courier discovery ==============
async def _public_courier_view(c, logged_in: bool, role: Optional[str]):
    show = logged_in and role == "business"
    return {
        "id": c["id"],
        "company_name": c["company_name"],
        "rating": c.get("rating", 4.5),
        "years_experience": c.get("years_experience", 1),
        "is_premium": c.get("is_premium", False),
        "is_featured": c.get("is_featured", False),
        "transport_modes": c.get("transport_modes", []),
        "coverage_summary": c.get("coverage_summary", ""),
        "delivery_timeline": c.get("delivery_timeline", "2-4 days"),
        "estimated_rate": c.get("estimated_rate", 0) if show else None,
        "phone": c.get("mobile") if show else None,
        "email": c.get("email") if show else None,
        "contact_person": c.get("contact_person") if show else None,
        "locked": not show,
    }

@api.get("/couriers/featured")
async def featured_couriers(user=Depends(get_current_user)):
    cursor = db.users.find({"role": "courier", "status": "active"}, {"_id": 0, "password": 0}).limit(6)
    couriers = []
    async for c in cursor:
        couriers.append(await _public_courier_view(c, bool(user), user["role"] if user else None))
    return couriers

@api.get("/couriers/search")
async def search_couriers(
    pickup_city: str = "",
    delivery_city: str = "",
    pickup_pincode: str = "",
    delivery_pincode: str = "",
    pickup_state: str = "",
    delivery_state: str = "",
    weight: float = 0,
    parcel_type: str = "",
    transport_mode: str = "",
    sort: str = "rate",
    user=Depends(get_current_user),
):
    # Find matching couriers via coverage and rate cards
    query = {"role": "courier", "status": "active"}
    cursor = db.users.find(query, {"_id": 0, "password": 0})
    target_slab = slab_for_weight(weight) if weight else None
    results = []
    async for c in cursor:
        cov = await db.coverage.find_one({"courier_id": c["id"]}, {"_id": 0})
        if pickup_city and cov:
            if pickup_city.lower() not in [x.lower() for x in cov.get("cities", [])]:
                continue
        if delivery_city and cov:
            if delivery_city.lower() not in [x.lower() for x in cov.get("cities", [])]:
                continue
        if pickup_pincode and cov and cov.get("pincodes"):
            if pickup_pincode not in cov["pincodes"]:
                continue
        if delivery_pincode and cov and cov.get("pincodes"):
            if delivery_pincode not in cov["pincodes"]:
                continue
        if pickup_state and cov:
            if pickup_state.lower() not in [x.lower() for x in cov.get("states", [])]:
                continue
        if delivery_state and cov:
            if delivery_state.lower() not in [x.lower() for x in cov.get("states", [])]:
                continue
        # Find a matching rate card
        rc_query = {"courier_id": c["id"]}
        if transport_mode: rc_query["transport_mode"] = transport_mode
        if target_slab: rc_query["weight_slab"] = target_slab
        if pickup_city: rc_query["pickup_city"] = {"$regex": f"^{pickup_city}$", "$options": "i"}
        if delivery_city: rc_query["delivery_city"] = {"$regex": f"^{delivery_city}$", "$options": "i"}
        rc = await db.rate_cards.find_one(rc_query, {"_id": 0})
        if not rc:
            continue
        est = _calc_total(rc, weight if weight else 100)
        view = await _public_courier_view(c, bool(user), user["role"] if user else None)
        view["estimated_rate"] = round(est["total"], 2) if user and user.get("role") == "business" else None
        view["delivery_timeline"] = rc.get("delivery_timeline", "2-4 days")
        view["transport_mode"] = rc.get("transport_mode", transport_mode)
        view["weight_slab"] = rc.get("weight_slab", target_slab or "")
        view["rate_card_id"] = rc["id"]
        view["_sort_rate"] = est["total"]
        results.append(view)
    # sort
    if sort == "rating":
        results.sort(key=lambda x: -(x.get("rating") or 0))
    elif sort == "delivery":
        results.sort(key=lambda x: x.get("delivery_timeline", ""))
    else:
        results.sort(key=lambda x: x.get("_sort_rate") or 9e9)
    for r in results: r.pop("_sort_rate", None)
    return results


def _calc_total(rc: Dict, weight: float) -> Dict:
    pricing_type = rc.get("pricing_type", "per_kg")
    base = rc.get("base_rate", 0)
    sub = 0.0
    if pricing_type == "per_kg":
        sub = base * max(weight, 1)
    elif pricing_type == "fixed":
        sub = base
    else:  # minimum
        sub = max(base * weight, rc.get("min_charge", 0))
    fuel = sub * (rc.get("fuel_pct", 8) / 100)
    handling = rc.get("handling", 50)
    insurance = sub * (rc.get("insurance_pct", 0.5) / 100)
    pickup_c = rc.get("pickup_charge", 0)
    delivery_c = rc.get("delivery_charge", 0)
    pre_gst = sub + fuel + handling + insurance + pickup_c + delivery_c
    gst = pre_gst * 0.18
    total = pre_gst + gst
    return {
        "base": round(sub, 2),
        "fuel": round(fuel, 2),
        "handling": round(handling, 2),
        "insurance": round(insurance, 2),
        "pickup_charge": round(pickup_c, 2),
        "delivery_charge": round(delivery_c, 2),
        "gst": round(gst, 2),
        "total": round(total, 2),
    }

@api.post("/freight/calculate")
async def freight_calculate(data: FreightCalcIn, user=Depends(require_user)):
    rc = await db.rate_cards.find_one({
        "courier_id": data.courier_id,
        "transport_mode": data.transport_mode,
        "weight_slab": slab_for_weight(data.weight),
    }, {"_id": 0})
    if not rc:
        # fallback first rate card
        rc = await db.rate_cards.find_one({"courier_id": data.courier_id}, {"_id": 0})
    if not rc:
        raise HTTPException(404, "No rate card found")
    return _calc_total(rc, data.weight)


# ============== Leads ==============
@api.post("/leads")
async def create_lead(data: LeadIn, user=Depends(require_user)):
    if user["role"] != "business":
        raise HTTPException(403, "Only businesses can create leads")
    courier = await db.users.find_one({"id": data.courier_id, "role": "courier"}, {"_id": 0})
    if not courier:
        raise HTTPException(404, "Courier not found")
    lead_id = "LEAD-" + str(uuid.uuid4())[:8].upper()
    lead = {
        "id": lead_id,
        "business_id": user["id"],
        "business_name": user.get("company_name"),
        "business_gst": user.get("gst_number"),
        "business_contact": user.get("contact_person"),
        "business_mobile": user.get("mobile"),
        "business_email": user.get("email"),
        "courier_id": data.courier_id,
        "courier_name": courier.get("company_name"),
        "pickup_city": data.pickup_city,
        "pickup_state": data.pickup_state,
        "pickup_pincode": data.pickup_pincode,
        "delivery_city": data.delivery_city,
        "delivery_state": data.delivery_state,
        "delivery_pincode": data.delivery_pincode,
        "weight": data.weight,
        "parcel_type": data.parcel_type,
        "transport_mode": data.transport_mode,
        "dispatch_date": data.dispatch_date,
        "notes": data.notes,
        "action": data.action,
        "status": "new",
        "sla_deadline": (datetime.now(timezone.utc) + timedelta(minutes=60)).isoformat(),
        "created_at": now_iso(),
    }
    await db.leads.insert_one(lead)
    # Multi-channel notifications (in-app real, others API-ready/MOCKED)
    notif_base = {
        "user_id": data.courier_id,
        "type": "new_lead",
        "title": "New Logistics Lead Received",
        "body": f"Lead {lead_id} from {user.get('company_name')} — please contact within 1 hour.",
        "lead_id": lead_id,
        "read": False,
        "created_at": now_iso(),
    }
    # In-app (real)
    await db.notifications.insert_one({**notif_base, "id": str(uuid.uuid4()), "channel": "in_app", "status": "delivered"})
    # Email (MOCKED — logged only)
    await db.notification_logs.insert_one({**notif_base, "id": str(uuid.uuid4()), "channel": "email", "status": "mocked", "to": courier.get("email")})
    logger.info(f"[MOCK EMAIL] To {courier.get('email')} — Subject: New Logistics Lead Received — Lead {lead_id}")
    # WhatsApp (MOCKED — API-ready architecture)
    await db.notification_logs.insert_one({**notif_base, "id": str(uuid.uuid4()), "channel": "whatsapp", "status": "mocked", "to": courier.get("mobile")})
    logger.info(f"[MOCK WHATSAPP] To +91{courier.get('mobile')} — New Lead {lead_id}")
    # SMS (MOCKED)
    await db.notification_logs.insert_one({**notif_base, "id": str(uuid.uuid4()), "channel": "sms", "status": "mocked", "to": courier.get("mobile")})
    # Push (MOCKED)
    await db.notification_logs.insert_one({**notif_base, "id": str(uuid.uuid4()), "channel": "push", "status": "mocked", "to": data.courier_id})
    lead.pop("_id", None)
    return lead

@api.get("/leads/{lead_id}")
async def get_lead(lead_id: str, user=Depends(require_user)):
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(404, "Lead not found")
    if lead["business_id"] != user["id"] and lead["courier_id"] != user["id"] and user["role"] != "admin":
        raise HTTPException(403, "Forbidden")
    return lead

@api.patch("/leads/{lead_id}/status")
async def update_lead_status(lead_id: str, payload: Dict[str, Any], user=Depends(require_user)):
    new_status = payload.get("status")
    if new_status not in ["new", "callback_pending", "contacted", "quote_sent", "won", "lost", "expired"]:
        raise HTTPException(400, "Invalid status")
    lead = await db.leads.find_one({"id": lead_id})
    if not lead or (lead["courier_id"] != user["id"] and user["role"] != "admin"):
        raise HTTPException(403, "Forbidden")
    await db.leads.update_one({"id": lead_id}, {"$set": {"status": new_status, "updated_at": now_iso()}})
    return {"success": True}


# ============== Business Dashboard ==============
@api.get("/business/leads")
async def business_leads(user=Depends(require_user)):
    if user["role"] != "business": raise HTTPException(403, "Forbidden")
    leads = await db.leads.find({"business_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return leads


# ============== Courier Dashboard ==============
@api.get("/courier/dashboard")
async def courier_dashboard(user=Depends(require_user)):
    if user["role"] != "courier": raise HTTPException(403, "Forbidden")
    total_leads = await db.leads.count_documents({"courier_id": user["id"]})
    new_leads = await db.leads.count_documents({"courier_id": user["id"], "status": "new"})
    won = await db.leads.count_documents({"courier_id": user["id"], "status": "won"})
    rate_cards = await db.rate_cards.count_documents({"courier_id": user["id"]})
    cov = await db.coverage.find_one({"courier_id": user["id"]}, {"_id": 0}) or {"states": [], "cities": [], "pincodes": []}
    return {
        "total_leads": total_leads,
        "new_leads": new_leads,
        "won": won,
        "rate_cards": rate_cards,
        "cities_covered": len(cov.get("cities", [])),
        "verification_status": user.get("status", "pending_approval"),
        "admin_approved": user.get("admin_approved", False),
    }

@api.get("/courier/leads")
async def courier_leads(user=Depends(require_user)):
    if user["role"] != "courier": raise HTTPException(403, "Forbidden")
    leads = await db.leads.find({"courier_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return leads

@api.get("/courier/rate-cards")
async def get_rate_cards(user=Depends(require_user)):
    if user["role"] != "courier": raise HTTPException(403, "Forbidden")
    return await db.rate_cards.find({"courier_id": user["id"]}, {"_id": 0}).to_list(200)

@api.post("/courier/rate-cards")
async def add_rate_card(data: RateCardIn, user=Depends(require_user)):
    if user["role"] != "courier": raise HTTPException(403, "Forbidden")
    rc = data.model_dump()
    rc["id"] = str(uuid.uuid4())
    rc["courier_id"] = user["id"]
    rc["created_at"] = now_iso()
    await db.rate_cards.insert_one(rc)
    rc.pop("_id", None)
    return rc

@api.delete("/courier/rate-cards/{rc_id}")
async def delete_rate_card(rc_id: str, user=Depends(require_user)):
    await db.rate_cards.delete_one({"id": rc_id, "courier_id": user["id"]})
    return {"success": True}

@api.get("/courier/coverage")
async def get_coverage(user=Depends(require_user)):
    cov = await db.coverage.find_one({"courier_id": user["id"]}, {"_id": 0})
    return cov or {"states": [], "cities": [], "pincodes": []}

@api.put("/courier/coverage")
async def put_coverage(data: CoverageIn, user=Depends(require_user)):
    if user["role"] != "courier": raise HTTPException(403, "Forbidden")
    await db.coverage.update_one(
        {"courier_id": user["id"]},
        {"$set": {"courier_id": user["id"], "states": data.states, "cities": data.cities, "pincodes": data.pincodes}},
        upsert=True,
    )
    return {"success": True}

@api.get("/notifications")
async def get_notifications(user=Depends(require_user)):
    items = await db.notifications.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    unread = await db.notifications.count_documents({"user_id": user["id"], "read": False})
    return {"items": items, "unread": unread}

@api.post("/notifications/{nid}/read")
async def mark_notif_read(nid: str, user=Depends(require_user)):
    await db.notifications.update_one({"id": nid, "user_id": user["id"]}, {"$set": {"read": True}})
    return {"success": True}

@api.post("/notifications/read-all")
async def mark_all_read(user=Depends(require_user)):
    await db.notifications.update_many({"user_id": user["id"], "read": False}, {"$set": {"read": True}})
    return {"success": True}


# ============== Admin ==============
@api.get("/admin/stats")
async def admin_stats(user=Depends(require_user)):
    if user["role"] != "admin": raise HTTPException(403, "Forbidden")
    return {
        "total_businesses": await db.users.count_documents({"role": "business"}),
        "total_couriers": await db.users.count_documents({"role": "courier"}),
        "pending_couriers": await db.users.count_documents({"role": "courier", "admin_approved": False}),
        "total_leads": await db.leads.count_documents({}),
        "expired_leads": await db.leads.count_documents({"status": "expired"}),
    }

@api.get("/admin/overview")
async def admin_overview(user=Depends(require_user)):
    if user["role"] != "admin": raise HTTPException(403, "Forbidden")
    # Lead status breakdown
    statuses = ["new","callback_pending","contacted","quote_sent","won","lost","expired"]
    lead_by_status = []
    for s in statuses:
        lead_by_status.append({"name": s, "value": await db.leads.count_documents({"status": s})})

    # Leads by day (last 14 days)
    leads_by_day = []
    today = datetime.now(timezone.utc).date()
    for i in range(13, -1, -1):
        day = today - timedelta(days=i)
        start = datetime.combine(day, datetime.min.time(), tzinfo=timezone.utc).isoformat()
        end = datetime.combine(day, datetime.max.time(), tzinfo=timezone.utc).isoformat()
        count = await db.leads.count_documents({"created_at": {"$gte": start, "$lte": end}})
        leads_by_day.append({"date": day.strftime("%d %b"), "leads": count})

    # Top couriers by leads
    pipeline = [{"$group": {"_id": "$courier_name", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}, {"$limit": 5}]
    top_couriers = []
    async for d in db.leads.aggregate(pipeline):
        top_couriers.append({"name": d["_id"] or "Unknown", "leads": d["count"]})

    # Top routes
    rt_pipeline = [
        {"$group": {"_id": {"p": "$pickup_city", "d": "$delivery_city"}, "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}, {"$limit": 5}
    ]
    top_routes = []
    async for d in db.leads.aggregate(rt_pipeline):
        top_routes.append({"route": f"{d['_id']['p']} → {d['_id']['d']}", "leads": d["count"]})

    # Transport mode breakdown (from rate cards as proxy for marketplace inventory)
    tm_pipeline = [{"$group": {"_id": "$transport_mode", "count": {"$sum": 1}}}]
    transport_modes = []
    async for d in db.rate_cards.aggregate(tm_pipeline):
        transport_modes.append({"mode": d["_id"], "count": d["count"]})

    return {
        "kpi": {
            "businesses": await db.users.count_documents({"role": "business"}),
            "couriers_active": await db.users.count_documents({"role": "courier", "admin_approved": True}),
            "couriers_pending": await db.users.count_documents({"role": "courier", "admin_approved": False, "status": {"$ne": "rejected"}}),
            "leads_total": await db.leads.count_documents({}),
            "leads_won": await db.leads.count_documents({"status": "won"}),
            "leads_open": await db.leads.count_documents({"status": {"$in": ["new", "callback_pending", "contacted"]}}),
            "rate_cards": await db.rate_cards.count_documents({}),
        },
        "lead_by_status": lead_by_status,
        "leads_by_day": leads_by_day,
        "top_couriers": top_couriers,
        "top_routes": top_routes,
        "transport_modes": transport_modes,
    }

@api.get("/admin/businesses")
async def admin_businesses(user=Depends(require_user)):
    if user["role"] != "admin": raise HTTPException(403, "Forbidden")
    return await db.users.find({"role": "business"}, {"_id": 0, "password": 0}).sort("created_at", -1).to_list(500)

@api.get("/admin/rate-cards")
async def admin_rate_cards(user=Depends(require_user)):
    if user["role"] != "admin": raise HTTPException(403, "Forbidden")
    cards = await db.rate_cards.find({}, {"_id": 0}).limit(500).to_list(500)
    # join courier name
    courier_map = {}
    async for c in db.users.find({"role": "courier"}, {"_id": 0, "id": 1, "company_name": 1}):
        courier_map[c["id"]] = c["company_name"]
    for rc in cards: rc["courier_name"] = courier_map.get(rc.get("courier_id"), "Unknown")
    return cards

@api.get("/admin/sla-monitor")
async def admin_sla(user=Depends(require_user)):
    if user["role"] != "admin": raise HTTPException(403, "Forbidden")
    now = datetime.now(timezone.utc)
    leads = await db.leads.find({"status": {"$in": ["new", "callback_pending"]}}, {"_id": 0}).sort("sla_deadline", 1).to_list(200)
    enriched = []
    for l in leads:
        try:
            deadline = datetime.fromisoformat(l["sla_deadline"])
            mins_left = int((deadline - now).total_seconds() / 60)
        except Exception:
            mins_left = None
        enriched.append({**l, "mins_left": mins_left, "breached": mins_left is not None and mins_left < 0})
    return enriched

@api.get("/admin/couriers")
async def admin_couriers(user=Depends(require_user)):
    if user["role"] != "admin": raise HTTPException(403, "Forbidden")
    return await db.users.find({"role": "courier"}, {"_id": 0, "password": 0}).to_list(500)

@api.post("/admin/couriers/{cid}/approve")
async def approve_courier(cid: str, user=Depends(require_user)):
    if user["role"] != "admin": raise HTTPException(403, "Forbidden")
    await db.users.update_one({"id": cid}, {"$set": {"admin_approved": True, "status": "active"}})
    return {"success": True}

@api.post("/admin/couriers/{cid}/reject")
async def reject_courier(cid: str, user=Depends(require_user)):
    if user["role"] != "admin": raise HTTPException(403, "Forbidden")
    await db.users.update_one({"id": cid}, {"$set": {"admin_approved": False, "status": "rejected"}})
    return {"success": True}

@api.get("/admin/notification-logs")
async def admin_notification_logs(user=Depends(require_user)):
    if user["role"] != "admin": raise HTTPException(403, "Forbidden")
    return await db.notification_logs.find({}, {"_id": 0}).sort("created_at", -1).limit(200).to_list(200)

@api.get("/admin/leads")
async def admin_leads(user=Depends(require_user)):
    if user["role"] != "admin": raise HTTPException(403, "Forbidden")
    return await db.leads.find({}, {"_id": 0}).sort("created_at", -1).limit(200).to_list(200)


# ============== Meta endpoints ==============
@api.get("/meta")
async def meta():
    return {
        "weight_slabs": WEIGHT_SLABS,
        "transport_modes": TRANSPORT_MODES,
        "parcel_types": PARCEL_TYPES,
    }

@api.get("/")
async def root():
    return {"message": "Logistics Marketplace API"}


# ============== Seed ==============
@app.on_event("startup")
async def seed_db():
    # Admin email migration: rename old logimarket admin to logscanner
    await db.users.update_one(
        {"role": "admin", "email": "admin@logimarket.in"},
        {"$set": {"email": "admin@logscanner.in", "company_name": "LogScanner Admin"}}
    )
    # Admin
    if not await db.users.find_one({"role": "admin"}):
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "role": "admin",
            "company_name": "LogScanner Admin",
            "contact_person": "Admin",
            "email": "admin@logscanner.in",
            "mobile": "9999999999",
            "password": hash_password("admin@123"),
            "status": "active",
            "created_at": now_iso(),
        })

    # Seed courier partners if none
    if await db.users.count_documents({"role": "courier"}) == 0:
        seed_partners = [
            ("BlueDart Express", ["Mumbai","Delhi","Bangalore","Chennai","Pune","Hyderabad"], ["Maharashtra","Delhi","Karnataka","Tamil Nadu","Telangana"], True, 4.8, 12),
            ("DTDC Cargo", ["Mumbai","Pune","Ahmedabad","Surat","Indore","Bhopal"], ["Maharashtra","Gujarat","Madhya Pradesh"], True, 4.6, 18),
            ("Gati Logistics", ["Delhi","Jaipur","Chandigarh","Lucknow","Kanpur","Agra"], ["Delhi","Rajasthan","Punjab","Uttar Pradesh"], False, 4.5, 22),
            ("VRL Roadlines", ["Bangalore","Chennai","Coimbatore","Mysore","Mangalore","Kochi"], ["Karnataka","Tamil Nadu","Kerala"], False, 4.4, 30),
            ("TCI Express", ["Hyderabad","Vijayawada","Visakhapatnam","Nagpur","Raipur","Bhubaneswar"], ["Telangana","Andhra Pradesh","Maharashtra","Chhattisgarh","Odisha"], True, 4.7, 25),
            ("Safexpress", ["Delhi","Mumbai","Bangalore","Chennai","Kolkata","Pune","Hyderabad","Ahmedabad"], ["Delhi","Maharashtra","Karnataka","Tamil Nadu","West Bengal","Gujarat","Telangana"], False, 4.3, 15),
        ]
        for name, cities, states, premium, rating, exp in seed_partners:
            uid = str(uuid.uuid4())
            email = name.lower().replace(" ", "") + "@partner.in"
            await db.users.insert_one({
                "id": uid, "role": "courier",
                "company_name": name,
                "gst_number": f"27{name[:5].upper().ljust(5,'A')[:5]}1234A1Z5",
                "pan_number": f"{name[:5].upper().ljust(5,'A')[:5]}1234A",
                "contact_person": f"{name} Manager",
                "email": email, "mobile": f"98{random.randint(10000000,99999999)}",
                "password": hash_password("partner@123"),
                "years_experience": exp,
                "mobile_verified": True, "email_verified": True, "gst_verified": True,
                "admin_approved": True, "status": "active",
                "rating": rating, "is_premium": premium, "is_featured": premium,
                "transport_modes": ["Road Transport","Surface Cargo","Express Delivery"] + (["Air Cargo"] if premium else []),
                "created_at": now_iso(),
            })
            await db.coverage.insert_one({
                "id": str(uuid.uuid4()), "courier_id": uid,
                "states": states, "cities": cities, "pincodes": [],
            })
            # add a few rate cards
            for pc in cities[:3]:
                for dc in cities:
                    if pc == dc: continue
                    for mode in ["Road Transport", "Surface Cargo", "Express Delivery"]:
                        for slab in WEIGHT_SLABS[:3]:
                            base = {"1-100 KG": 35, "101-500 KG": 28, "501-1000 KG": 22}[slab]
                            base += random.randint(-5, 8) + (10 if mode == "Express Delivery" else 0)
                            await db.rate_cards.insert_one({
                                "id": str(uuid.uuid4()),
                                "courier_id": uid,
                                "pickup_city": pc, "delivery_city": dc,
                                "transport_mode": mode, "weight_slab": slab,
                                "delivery_timeline": "1-2 days" if mode == "Express Delivery" else "3-5 days",
                                "pricing_type": "per_kg",
                                "base_rate": base, "min_charge": 500,
                                "fuel_pct": 8, "handling": 50, "insurance_pct": 0.5,
                                "pickup_charge": 100, "delivery_charge": 100,
                                "created_at": now_iso(),
                            })
        logger.info("Seeded courier partners and rate cards")


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown():
    client.close()
