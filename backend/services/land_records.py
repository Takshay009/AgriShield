from typing import Optional, Dict, Any, List

# ---------------------------------------------------------------------------
# Standardised response schema
# ---------------------------------------------------------------------------
# {
#   "ownerName": str,
#   "surveyNumber": str,
#   "landArea": str,        # in acres
#   "village": str,
#   "taluka": str,
#   "district": str,
#   "state": str,
#   "coordinates": [lat, lng],   # centre of the parcel
#   "polygon": [[lat,lng], ...], # boundary vertices (WGS-84)
#   "cropType": str
# }
# ---------------------------------------------------------------------------


class LandRecordAdapter:
    """
    Common interface for all State Land Record Adapters.
    Returns a standardised dictionary or raises ValueError.
    """
    # Each subclass overrides DEMO_RECORDS with { survey_number: {...} }
    DEMO_RECORDS: Dict[str, Dict[str, Any]] = {}

    def lookup(self, survey_number: Optional[str] = None, ulpin: Optional[str] = None) -> Dict[str, Any]:
        """
        1. Try matching a survey_number or ulpin in local DEMO_RECORDS.
        2. If not found, raise ValueError explaining how to get real access.
        """
        s_clean = (survey_number or "").strip().upper()
        u_clean = (ulpin or "").strip().upper()

        # Direct key lookup
        if s_clean and s_clean in self.DEMO_RECORDS:
            return self.DEMO_RECORDS[s_clean]
        if u_clean and u_clean in self.DEMO_RECORDS:
            return self.DEMO_RECORDS[u_clean]

        # Scan values for matching surveyNumber or ulpin
        for rec in self.DEMO_RECORDS.values():
            if s_clean and rec.get("surveyNumber", "").strip().upper() == s_clean:
                return rec
            if u_clean and rec.get("ulpin", "").strip().upper() == u_clean:
                return rec

        raise ValueError(self._unavailable_message())

    def _unavailable_message(self) -> str:
        return (
            "Official government API requires authorised credentials and/or CAPTCHA. "
            "Please use Manual Entry."
        )


# ==========================================================================
# STATE ADAPTERS  – 10 states with demo records
# ==========================================================================

class MaharashtraAdapter(LandRecordAdapter):
    """Maharashtra – Mahabhulekh / Bhu-naksha"""

    DEMO_RECORDS = {
        # Survey Nos as returned by Mahabhulekh
        "12/4A": {
            "ownerName": "Ramesh Vishnu Patil",
            "surveyNumber": "12/4A",
            "ulpin": "MH-PN-ML-00012-4A",
            "landArea": "1.82",
            "village": "Pirangut",
            "taluka": "Mulshi",
            "district": "Pune",
            "state": "Maharashtra",
            "coordinates": [18.5135, 73.6823],
            "polygon": [
                [18.5145, 73.6812],
                [18.5148, 73.6835],
                [18.5128, 73.6838],
                [18.5122, 73.6815],
            ],
            "cropType": "Sugarcane",
            "source": "Mahabhulekh Demo Record",
        },
        "27/1B": {
            "ownerName": "Sunita Mahadev Jadhav",
            "surveyNumber": "27/1B",
            "ulpin": "MH-NS-SS-00027-1B",
            "landArea": "3.10",
            "village": "Shirdi",
            "taluka": "Rahata",
            "district": "Ahmednagar",
            "state": "Maharashtra",
            "coordinates": [19.7636, 74.4764],
            "polygon": [
                [19.7646, 74.4752],
                [19.7649, 74.4778],
                [19.7624, 74.4779],
                [19.7621, 74.4754],
            ],
            "cropType": "Onion",
            "source": "Mahabhulekh Demo Record",
        },
    }

    def _unavailable_message(self):
        return (
            "Maharashtra Mahabhulekh integration requires Mahabhumi API Gateway access. "
            "Try survey numbers: 12/4A or 27/1B for the demo. "
            "Otherwise, switch to Manual Entry."
        )


class GujaratAdapter(LandRecordAdapter):
    """Gujarat – AnyRoR / e-Dhara"""

    DEMO_RECORDS = {
        "45/2": {
            "ownerName": "Bhavesh Kantilal Patel",
            "surveyNumber": "45/2",
            "ulpin": "GJ-AN-SA-00045-2",
            "landArea": "2.40",
            "village": "Sasan Gir",
            "taluka": "Talala",
            "district": "Gir Somnath",
            "state": "Gujarat",
            "coordinates": [21.1240, 70.6058],
            "polygon": [
                [21.1250, 70.6045],
                [21.1253, 70.6070],
                [21.1228, 70.6074],
                [21.1225, 70.6049],
            ],
            "cropType": "Groundnut",
            "source": "AnyRoR Demo Record",
        },
        "88/A": {
            "ownerName": "Rekha Haribhai Shah",
            "surveyNumber": "88/A",
            "ulpin": "GJ-AN-AH-00088-A",
            "landArea": "1.65",
            "village": "Anand",
            "taluka": "Anand",
            "district": "Anand",
            "state": "Gujarat",
            "coordinates": [22.5545, 72.9570],
            "polygon": [
                [22.5555, 72.9558],
                [22.5558, 72.9582],
                [22.5533, 72.9583],
                [22.5530, 72.9559],
            ],
            "cropType": "Tobacco",
            "source": "AnyRoR Demo Record",
        },
    }

    def _unavailable_message(self):
        return (
            "Gujarat AnyRoR integration requires enterprise API credentials and CAPTCHA validation. "
            "Try survey numbers: 45/2 or 88/A for the demo. "
            "Otherwise, switch to Manual Entry."
        )


class KarnatakaAdapter(LandRecordAdapter):
    """Karnataka – Bhoomi / Kaveri-GIS"""

    DEMO_RECORDS = {
        "136/2": {
            "ownerName": "Shivakumar Nagaraj Reddy",
            "surveyNumber": "136/2",
            "ulpin": "KA-TU-HA-00136-2",
            "landArea": "4.00",
            "village": "Hassan",
            "taluka": "Hassan",
            "district": "Hassan",
            "state": "Karnataka",
            "coordinates": [13.0068, 76.1004],
            "polygon": [
                [13.0078, 76.0990],
                [13.0080, 76.1018],
                [13.0056, 76.1020],
                [13.0054, 76.0992],
            ],
            "cropType": "Coffee",
            "source": "Bhoomi Demo Record",
        },
        "54/3A": {
            "ownerName": "Anitha Ravi Kumar",
            "surveyNumber": "54/3A",
            "ulpin": "KA-MY-MY-00054-3A",
            "landArea": "2.75",
            "village": "Mysuru",
            "taluka": "Mysuru",
            "district": "Mysuru",
            "state": "Karnataka",
            "coordinates": [12.2958, 76.6394],
            "polygon": [
                [12.2968, 76.6381],
                [12.2970, 76.6406],
                [12.2946, 76.6408],
                [12.2944, 76.6383],
            ],
            "cropType": "Ragi",
            "source": "Bhoomi Demo Record",
        },
    }

    def _unavailable_message(self):
        return (
            "Karnataka Bhoomi integration requires state XML-RPC credentials. "
            "Try survey numbers: 136/2 or 54/3A for the demo. "
            "Otherwise, switch to Manual Entry."
        )


class PunjabAdapter(LandRecordAdapter):
    """Punjab – PLRS"""

    DEMO_RECORDS = {
        "22/6": {
            "ownerName": "Gurpreet Singh Dhaliwal",
            "surveyNumber": "22/6",
            "ulpin": "PB-LU-LU-00022-6",
            "landArea": "5.00",
            "village": "Ludhiana",
            "taluka": "Ludhiana West",
            "district": "Ludhiana",
            "state": "Punjab",
            "coordinates": [30.9010, 75.8573],
            "polygon": [
                [30.9022, 75.8558],
                [30.9025, 75.8588],
                [30.8998, 75.8590],
                [30.8995, 75.8560],
            ],
            "cropType": "Wheat",
            "source": "PLRS Demo Record",
        },
        "9/1": {
            "ownerName": "Harjinder Kaur Brar",
            "surveyNumber": "9/1",
            "ulpin": "PB-AM-SR-00009-1",
            "landArea": "6.20",
            "village": "Sultanpur Lodhi",
            "taluka": "Sultanpur Lodhi",
            "district": "Kapurthala",
            "state": "Punjab",
            "coordinates": [31.2153, 75.1953],
            "polygon": [
                [31.2163, 75.1939],
                [31.2166, 75.1968],
                [31.2141, 75.1969],
                [31.2138, 75.1941],
            ],
            "cropType": "Rice",
            "source": "PLRS Demo Record",
        },
    }

    def _unavailable_message(self):
        return (
            "Punjab PLRS integration requires official portal API authorization. "
            "Try survey numbers: 22/6 or 9/1 for the demo. "
            "Otherwise, switch to Manual Entry."
        )


class RajasthanAdapter(LandRecordAdapter):
    """Rajasthan – Apna Khata"""

    DEMO_RECORDS = {
        "301/A": {
            "ownerName": "Pradeep Kumar Sharma",
            "surveyNumber": "301/A",
            "ulpin": "RJ-JP-JA-00301-A",
            "landArea": "8.50",
            "village": "Jaipur Rural",
            "taluka": "Sanganer",
            "district": "Jaipur",
            "state": "Rajasthan",
            "coordinates": [26.7922, 75.8068],
            "polygon": [
                [26.7935, 75.8052],
                [26.7938, 75.8084],
                [26.7908, 75.8086],
                [26.7905, 75.8054],
            ],
            "cropType": "Bajra",
            "source": "Apna Khata Demo Record",
        },
        "67/2B": {
            "ownerName": "Meena Devi Gupta",
            "surveyNumber": "67/2B",
            "ulpin": "RJ-JP-JO-00067-2B",
            "landArea": "3.80",
            "village": "Jodhpur",
            "taluka": "Jodhpur",
            "district": "Jodhpur",
            "state": "Rajasthan",
            "coordinates": [26.2389, 73.0243],
            "polygon": [
                [26.2400, 73.0228],
                [26.2403, 73.0257],
                [26.2376, 73.0259],
                [26.2373, 73.0230],
            ],
            "cropType": "Mustard",
            "source": "Apna Khata Demo Record",
        },
    }

    def _unavailable_message(self):
        return (
            "Rajasthan Apna Khata integration requires secure department credentials. "
            "Try survey numbers: 301/A or 67/2B for the demo. "
            "Otherwise, switch to Manual Entry."
        )


class UttarPradeshAdapter(LandRecordAdapter):
    """Uttar Pradesh – Bhulekh UP"""

    DEMO_RECORDS = {
        "512/1": {
            "ownerName": "Ramakant Tripathi",
            "surveyNumber": "512/1",
            "ulpin": "UP-LK-LK-00512-1",
            "landArea": "2.60",
            "village": "Bakshi Ka Talab",
            "taluka": "Bakshi Ka Talab",
            "district": "Lucknow",
            "state": "Uttar Pradesh",
            "coordinates": [26.9500, 80.9897],
            "polygon": [
                [26.9512, 80.9882],
                [26.9514, 80.9912],
                [26.9488, 80.9914],
                [26.9486, 80.9884],
            ],
            "cropType": "Sugarcane",
            "source": "Bhulekh UP Demo Record",
        },
    }

    def _unavailable_message(self):
        return (
            "Uttar Pradesh Bhulekh UP integration requires NIC API gateway permissions. "
            "Try survey number: 512/1 for the demo. "
            "Otherwise, switch to Manual Entry."
        )


class MadhyaPradeshAdapter(LandRecordAdapter):
    """Madhya Pradesh – MP Bhulekh"""

    DEMO_RECORDS = {
        "43/3": {
            "ownerName": "Vijay Kumar Mishra",
            "surveyNumber": "43/3",
            "ulpin": "MP-BH-BH-00043-3",
            "landArea": "5.30",
            "village": "Bhopal",
            "taluka": "Huzur",
            "district": "Bhopal",
            "state": "Madhya Pradesh",
            "coordinates": [23.2599, 77.4126],
            "polygon": [
                [23.2610, 77.4111],
                [23.2613, 77.4141],
                [23.2587, 77.4143],
                [23.2584, 77.4113],
            ],
            "cropType": "Soybean",
            "source": "MP Bhulekh Demo Record",
        },
    }

    def _unavailable_message(self):
        return (
            "Madhya Pradesh MP Bhulekh integration requires department logins. "
            "Try survey number: 43/3 for the demo. "
            "Otherwise, switch to Manual Entry."
        )


class TamilNaduAdapter(LandRecordAdapter):
    """Tamil Nadu – Tamil Nilam"""

    DEMO_RECORDS = {
        "78/1A": {
            "ownerName": "Murugan Selvaraj",
            "surveyNumber": "78/1A",
            "ulpin": "TN-CB-CO-00078-1A",
            "landArea": "2.10",
            "village": "Coimbatore North",
            "taluka": "Coimbatore North",
            "district": "Coimbatore",
            "state": "Tamil Nadu",
            "coordinates": [11.0168, 76.9558],
            "polygon": [
                [11.0180, 76.9543],
                [11.0182, 76.9572],
                [11.0155, 76.9574],
                [11.0153, 76.9545],
            ],
            "cropType": "Coconut",
            "source": "Tamil Nilam Demo Record",
        },
    }

    def _unavailable_message(self):
        return (
            "Tamil Nadu Tamil Nilam integration requires secure API tokens from NIC Tamil Nadu. "
            "Try survey number: 78/1A for the demo. "
            "Otherwise, switch to Manual Entry."
        )


class WestBengalAdapter(LandRecordAdapter):
    """West Bengal – BanglarBhumi"""

    DEMO_RECORDS = {
        "110/4": {
            "ownerName": "Arnab Chatterjee",
            "surveyNumber": "110/4",
            "ulpin": "WB-NA-BA-00110-4",
            "landArea": "1.90",
            "village": "Barasat",
            "taluka": "Barasat",
            "district": "North 24 Parganas",
            "state": "West Bengal",
            "coordinates": [22.7197, 88.4792],
            "polygon": [
                [22.7208, 88.4778],
                [22.7210, 88.4806],
                [22.7185, 88.4808],
                [22.7183, 88.4780],
            ],
            "cropType": "Jute",
            "source": "BanglarBhumi Demo Record",
        },
    }

    def _unavailable_message(self):
        return (
            "West Bengal BanglarBhumi integration requires secure Web GIS API access. "
            "Try survey number: 110/4 for the demo. "
            "Otherwise, switch to Manual Entry."
        )


class HaryanaAdapter(LandRecordAdapter):
    """Haryana – Jamabandi"""

    DEMO_RECORDS = {
        "56/7": {
            "ownerName": "Suresh Pal Malik",
            "surveyNumber": "56/7",
            "ulpin": "HR-GU-GU-00056-7",
            "landArea": "7.00",
            "village": "Gurugram",
            "taluka": "Gurgaon",
            "district": "Gurugram",
            "state": "Haryana",
            "coordinates": [28.4595, 77.0266],
            "polygon": [
                [28.4607, 77.0250],
                [28.4610, 77.0282],
                [28.4582, 77.0284],
                [28.4579, 77.0252],
            ],
            "cropType": "Paddy",
            "source": "Jamabandi Demo Record",
        },
    }

    def _unavailable_message(self):
        return (
            "Haryana Jamabandi integration requires NIC Haryana API gateway setup. "
            "Try survey number: 56/7 for the demo. "
            "Otherwise, switch to Manual Entry."
        )


# Remaining states – no demo records, direct graceful fallback

class BiharAdapter(LandRecordAdapter):
    def _unavailable_message(self):
        return "Bihar Bihar Bhumi integration requires official registry credentials. Please use Manual Entry."

class OdishaAdapter(LandRecordAdapter):
    def _unavailable_message(self):
        return "Odisha Bhulekh integration requires Department of Revenue authorization. Please use Manual Entry."

class TelanganaAdapter(LandRecordAdapter):
    def _unavailable_message(self):
        return "Telangana Dharani integration requires state API keys. Please use Manual Entry."

class AndhraPradeshAdapter(LandRecordAdapter):
    def _unavailable_message(self):
        return "Andhra Pradesh Mee Bhoomi integration requires state gateway authentication. Please use Manual Entry."

class KeralaAdapter(LandRecordAdapter):
    def _unavailable_message(self):
        return "Kerala e-Rekha integration requires authentication credentials. Please use Manual Entry."

class ChhattisgarhAdapter(LandRecordAdapter):
    def _unavailable_message(self):
        return "Chhattisgarh Bhuiyan integration requires NIC CG API keys. Please use Manual Entry."

class JharkhandAdapter(LandRecordAdapter):
    def _unavailable_message(self):
        return "Jharkhand Jharbhoomi integration requires NIC JH state credentials. Please use Manual Entry."

class UttarakhandAdapter(LandRecordAdapter):
    def _unavailable_message(self):
        return "Uttarakhand Bhulekh integration requires NIC UK API permissions. Please use Manual Entry."

class HimachalPradeshAdapter(LandRecordAdapter):
    def _unavailable_message(self):
        return "Himachal Pradesh HimBhoomi integration requires revenue department access. Please use Manual Entry."

class AssamAdapter(LandRecordAdapter):
    def _unavailable_message(self):
        return "Assam Dharitree integration requires NIC Assam API gateway credentials. Please use Manual Entry."


# ==========================================================================
# ADAPTER REGISTRY
# ==========================================================================

ADAPTER_REGISTRY: Dict[str, Any] = {
    "gujarat": GujaratAdapter,
    "maharashtra": MaharashtraAdapter,
    "karnataka": KarnatakaAdapter,
    "rajasthan": RajasthanAdapter,
    "uttar pradesh": UttarPradeshAdapter,
    "madhya pradesh": MadhyaPradeshAdapter,
    "bihar": BiharAdapter,
    "odisha": OdishaAdapter,
    "telangana": TelanganaAdapter,
    "andhra pradesh": AndhraPradeshAdapter,
    "tamil nadu": TamilNaduAdapter,
    "kerala": KeralaAdapter,
    "punjab": PunjabAdapter,
    "haryana": HaryanaAdapter,
    "west bengal": WestBengalAdapter,
    "chhattisgarh": ChhattisgarhAdapter,
    "jharkhand": JharkhandAdapter,
    "uttarakhand": UttarakhandAdapter,
    "himachal pradesh": HimachalPradeshAdapter,
    "assam": AssamAdapter,
}


class LandRecordService:
    @staticmethod
    def get_adapter(state: str) -> LandRecordAdapter:
        state_key = state.lower().strip()
        adapter_cls = ADAPTER_REGISTRY.get(state_key)
        if not adapter_cls:
            raise ValueError(f"No land record adapter configured for state: '{state}'")
        return adapter_cls()

    @staticmethod
    def lookup(state: str, survey_number: Optional[str] = None, ulpin: Optional[str] = None) -> Dict[str, Any]:
        adapter = LandRecordService.get_adapter(state)
        return adapter.lookup(survey_number=survey_number, ulpin=ulpin)
