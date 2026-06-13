// Major Indian cities by population — used for auto-suggest in courier coverage
export const INDIAN_CITIES = [
  "Mumbai","Delhi","Bangalore","Hyderabad","Ahmedabad","Chennai","Kolkata","Pune","Jaipur","Surat",
  "Lucknow","Kanpur","Nagpur","Indore","Thane","Bhopal","Visakhapatnam","Patna","Vadodara","Ghaziabad",
  "Ludhiana","Agra","Nashik","Faridabad","Meerut","Rajkot","Varanasi","Srinagar","Aurangabad","Dhanbad",
  "Amritsar","Navi Mumbai","Allahabad","Ranchi","Howrah","Coimbatore","Jabalpur","Gwalior","Vijayawada","Jodhpur",
  "Madurai","Raipur","Kota","Chandigarh","Guwahati","Solapur","Hubli","Bareilly","Moradabad","Mysore",
  "Gurgaon","Aligarh","Jalandhar","Tiruchirappalli","Bhubaneswar","Salem","Mira-Bhayandar","Warangal","Thiruvananthapuram","Guntur",
  "Bhiwandi","Saharanpur","Gorakhpur","Bikaner","Amravati","Noida","Jamshedpur","Bhilai","Cuttack","Firozabad",
  "Kochi","Nellore","Bhavnagar","Dehradun","Durgapur","Asansol","Rourkela","Nanded","Kolhapur","Ajmer",
  "Akola","Gulbarga","Jamnagar","Ujjain","Loni","Siliguri","Jhansi","Ulhasnagar","Jammu","Sangli-Miraj",
  "Mangalore","Erode","Belgaum","Ambattur","Tirunelveli","Malegaon","Gaya","Jalgaon","Udaipur","Maheshtala",
  "Davanagere","Kozhikode","Akron","Akola","Tirupati","Kurnool","Tirupur","Rajahmundry","Bokaro","South Dumdum",
  "Bellary","Patiala","Gopalpur","Agartala","Bhagalpur","Muzaffarnagar","Bhatpara","Panihati","Latur","Dhule",
  "Rohtak","Korba","Bhilwara","Berhampur","Muzaffarpur","Ahmednagar","Mathura","Kollam","Avadi","Kadapa",
  "Anantapur","Kamarhati","Bilaspur","Sambalpur","Shahjahanpur","Satara","Bijapur","Rampur","Shivamogga","Chandrapur",
  "Junagadh","Thrissur","Alwar","Bardhaman","Kulti","Kakinada","Nizamabad","Parbhani","Tumkur","Khammam",
  "Ozhukarai","Bihar Sharif","Panipat","Darbhanga","Bally","Aizawl","Dewas","Ichalkaranji","Karnal","Bathinda",
  "Jalna","Eluru","Barasat","Kirari","Purnia","Satna","Mau","Sonipat","Farrukhabad","Sagar",
  "Rourkela","Durg","Imphal","Ratlam","Hapur","Arrah","Karimnagar","Anantapuram","Etawah","Ambernath",
  "North Dumdum","Bharatpur","Begusarai","New Delhi","Gandhinagar","Baranagar","Tiruvottiyur","Puducherry","Sikar","Thoothukudi",
  "Rewa","Mirzapur","Raichur","Pali","Ramagundam","Vizianagaram","Katni","Haridwar","Sri Ganganagar","Karawal Nagar"
];

// Title-case a city: "new delhi" → "New Delhi", "MUMBAI " → "Mumbai"
export function normalizeCity(s) {
  if (!s) return "";
  return s.trim()
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.split("-").map(p => p ? p[0].toUpperCase() + p.slice(1) : p).join("-"))
    .join(" ");
}
