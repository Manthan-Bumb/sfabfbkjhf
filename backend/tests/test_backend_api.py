"""Backend API tests for B2B Logistics Marketplace."""
import os, uuid, requests, pytest

BASE = os.environ.get("REACT_APP_BACKEND_URL") or open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split("\n")[0].strip()
BASE = BASE.rstrip("/")

ADMIN = ("admin@logscanner.in", "admin@123")
COURIER = ("bluedartexpress@partner.in", "partner@123")

session = requests.Session()


def _login(email, pwd):
    r = session.post(f"{BASE}/api/auth/login", json={"email": email, "password": pwd}, timeout=15)
    return r


# --- Auth ---
def test_admin_login():
    r = _login(*ADMIN)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["user"]["role"] == "admin"
    assert j["token"]


def test_courier_login():
    r = _login(*COURIER)
    assert r.status_code == 200, r.text
    assert r.json()["user"]["role"] == "courier"


def test_send_otp_returns_dev_otp():
    r = session.post(f"{BASE}/api/auth/send-otp", json={"mobile": "9876543210"}, timeout=10)
    assert r.status_code == 200
    assert r.json().get("dev_otp") == "123456"


def test_send_otp_invalid_mobile():
    r = session.post(f"{BASE}/api/auth/send-otp", json={"mobile": "12345"}, timeout=10)
    assert r.status_code == 400


def test_register_business_valid_and_invalid_gst():
    # send otp
    mobile = "98" + str(uuid.uuid4().int)[:8]
    mobile = "9" + mobile[1:10]
    session.post(f"{BASE}/api/auth/send-otp", json={"mobile": mobile})
    email = f"TEST_biz_{uuid.uuid4().hex[:6]}@example.com"
    payload = {
        "company_name": "TEST Co", "gst_number": "27ABCDE1234A1Z5",
        "contact_person": "Tester", "mobile": mobile, "email": email,
        "password": "Test@1234", "otp": "123456"
    }
    r = session.post(f"{BASE}/api/auth/register-business", json=payload, timeout=15)
    assert r.status_code == 200, r.text
    assert r.json()["user"]["role"] == "business"
    assert r.json()["token"]
    # invalid gst
    mobile2 = "9" + str(uuid.uuid4().int)[:9]
    session.post(f"{BASE}/api/auth/send-otp", json={"mobile": mobile2})
    bad = dict(payload, gst_number="INVALID", email=f"TEST_x_{uuid.uuid4().hex[:6]}@e.com", mobile=mobile2)
    r2 = session.post(f"{BASE}/api/auth/register-business", json=bad)
    assert r2.status_code == 400


# --- Public discovery ---
def test_featured_logged_out_locked():
    r = session.get(f"{BASE}/api/couriers/featured", timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert len(data) > 0
    for c in data:
        assert c["locked"] is True
        assert c["estimated_rate"] is None
        assert c["phone"] is None


def test_search_blurred_then_unblurred_for_business():
    # logged out
    r = session.get(f"{BASE}/api/couriers/search",
                    params={"pickup_city": "Mumbai", "delivery_city": "Delhi",
                            "weight": 100, "transport_mode": "Road Transport"}, timeout=15)
    assert r.status_code == 200
    out = r.json()
    assert isinstance(out, list)
    # Now login as business via fresh registration
    mobile = "9" + str(uuid.uuid4().int)[:9]
    session.post(f"{BASE}/api/auth/send-otp", json={"mobile": mobile})
    email = f"TEST_biz2_{uuid.uuid4().hex[:6]}@e.com"
    reg = session.post(f"{BASE}/api/auth/register-business", json={
        "company_name": "TEST", "gst_number": "27ABCDE1234A1Z5",
        "contact_person": "T", "mobile": mobile, "email": email,
        "password": "Test@1234", "otp": "123456"
    })
    assert reg.status_code == 200, reg.text
    tok = reg.json()["token"]
    r2 = requests.get(f"{BASE}/api/couriers/search",
                      params={"pickup_city": "Mumbai", "delivery_city": "Delhi",
                              "weight": 100, "transport_mode": "Road Transport"},
                      headers={"Authorization": f"Bearer {tok}"}, timeout=15)
    assert r2.status_code == 200
    out2 = r2.json()
    assert len(out2) > 0, "Expected matching couriers"
    for c in out2:
        assert c["locked"] is False
        assert isinstance(c["estimated_rate"], (int, float))
    pytest.shared_business_token = tok
    pytest.shared_business_email = email
    pytest.shared_courier_id = out2[0]["id"]


# --- Leads ---
def test_create_lead_and_business_leads():
    tok = getattr(pytest, "shared_business_token", None)
    cid = getattr(pytest, "shared_courier_id", None)
    assert tok and cid, "Need business token + courier id from previous test"
    h = {"Authorization": f"Bearer {tok}"}
    r = requests.post(f"{BASE}/api/leads", headers=h, json={
        "courier_id": cid, "pickup_city": "Mumbai", "delivery_city": "Delhi",
        "weight": 100, "parcel_type": "General Cargo",
        "transport_mode": "Road Transport", "action": "callback"
    }, timeout=15)
    assert r.status_code == 200, r.text
    lead = r.json()
    assert lead["id"].startswith("LEAD-")
    # business leads
    r2 = requests.get(f"{BASE}/api/business/leads", headers=h, timeout=10)
    assert r2.status_code == 200
    assert any(l["id"] == lead["id"] for l in r2.json())
    pytest.shared_lead_id = lead["id"]


def test_courier_dashboard_and_leads_and_status_update():
    tok = _login(*COURIER).json()["token"]
    h = {"Authorization": f"Bearer {tok}"}
    r = requests.get(f"{BASE}/api/courier/dashboard", headers=h, timeout=10)
    assert r.status_code == 200
    stats = r.json()
    assert "total_leads" in stats and "rate_cards" in stats
    r2 = requests.get(f"{BASE}/api/courier/leads", headers=h, timeout=10)
    assert r2.status_code == 200
    leads = r2.json()
    if leads:
        lid = leads[0]["id"]
        r3 = requests.patch(f"{BASE}/api/leads/{lid}/status", headers=h,
                            json={"status": "contacted"}, timeout=10)
        assert r3.status_code == 200


def test_courier_rate_cards_crud_and_coverage():
    tok = _login(*COURIER).json()["token"]
    h = {"Authorization": f"Bearer {tok}"}
    payload = {"pickup_city": "TestCity", "delivery_city": "OtherCity",
               "transport_mode": "Road Transport", "weight_slab": "1-100 KG",
               "delivery_timeline": "3-5 days", "pricing_type": "per_kg",
               "base_rate": 40}
    r = requests.post(f"{BASE}/api/courier/rate-cards", headers=h, json=payload, timeout=10)
    assert r.status_code == 200, r.text
    rc_id = r.json()["id"]
    r2 = requests.get(f"{BASE}/api/courier/rate-cards", headers=h, timeout=10)
    assert any(x["id"] == rc_id for x in r2.json())
    r3 = requests.delete(f"{BASE}/api/courier/rate-cards/{rc_id}", headers=h, timeout=10)
    assert r3.status_code == 200
    # coverage
    cov = {"states": ["TestState"], "cities": ["TestCity"], "pincodes": ["110001"]}
    r4 = requests.put(f"{BASE}/api/courier/coverage", headers=h, json=cov, timeout=10)
    assert r4.status_code == 200
    r5 = requests.get(f"{BASE}/api/courier/coverage", headers=h, timeout=10)
    assert "TestCity" in r5.json()["cities"]


def test_freight_calculate():
    tok = _login(*COURIER).json()["token"]
    # Need a courier id; use featured
    cid = session.get(f"{BASE}/api/couriers/featured").json()[0]["id"]
    h = {"Authorization": f"Bearer {tok}"}
    r = requests.post(f"{BASE}/api/freight/calculate", headers=h, json={
        "courier_id": cid, "pickup_city": "Mumbai", "delivery_city": "Delhi",
        "weight": 100, "transport_mode": "Road Transport"
    }, timeout=10)
    assert r.status_code == 200, r.text
    j = r.json()
    for k in ["base", "fuel", "handling", "insurance", "gst", "total"]:
        assert k in j


# --- Admin ---
def test_admin_endpoints():
    tok = _login(*ADMIN).json()["token"]
    h = {"Authorization": f"Bearer {tok}"}
    r = requests.get(f"{BASE}/api/admin/stats", headers=h, timeout=10)
    assert r.status_code == 200
    assert "total_couriers" in r.json()
    r2 = requests.get(f"{BASE}/api/admin/couriers", headers=h, timeout=10)
    assert r2.status_code == 200
    couriers = r2.json()
    assert len(couriers) >= 6
    cid = couriers[0]["id"]
    r3 = requests.post(f"{BASE}/api/admin/couriers/{cid}/approve", headers=h, timeout=10)
    assert r3.status_code == 200
