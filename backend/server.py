from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, date
import json
import shutil

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Create uploads directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Models
class NotationFile(BaseModel):
    name: str
    url: str
    type: str  # 'pdf' or 'image'

class Keerthana(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    raga: str
    tala: str
    composer: str
    deity: str
    date_taught: str
    lyrics: Optional[str] = ""
    meaning: Optional[str] = ""
    notation_files: Optional[List[NotationFile]] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class KeerthanaCreate(BaseModel):
    name: str
    raga: str
    tala: str
    composer: str
    deity: str
    date_taught: str
    lyrics: Optional[str] = ""
    meaning: Optional[str] = ""

class KeerthanaUpdate(BaseModel):
    name: Optional[str] = None
    raga: Optional[str] = None
    tala: Optional[str] = None
    composer: Optional[str] = None
    deity: Optional[str] = None
    date_taught: Optional[str] = None
    lyrics: Optional[str] = None
    meaning: Optional[str] = None

# Sample data
SAMPLE_KEERTHANAS = [
    {
        "name": "Vatapi Ganapatim",
        "raga": "Hanumatodi",
        "tala": "Adi",
        "composer": "Muthuswami Dikshitar",
        "deity": "Lord Ganesha",
        "date_taught": "2024-01-15",
        "lyrics": "Vatapi ganapatim bhaje ham\nVividha vigna vinashakaram",
        "meaning": "I worship Ganesha of Vatapi, who destroys various obstacles"
    },
    {
        "name": "Jagadananda Karaka",
        "raga": "Natabhairavi",
        "tala": "Adi",
        "composer": "Tyagaraja",
        "deity": "Lord Rama",
        "date_taught": "2024-01-20",
        "lyrics": "Jagadananda karaka jaya janaardana\nNagatraya viloola nartana",
        "meaning": "Victory to Janardana (Krishna), the creator of universal bliss"
    },
    {
        "name": "Bhavayami Gopalabalam",
        "raga": "Yamuna Kalyani",
        "tala": "Misra Chapu",
        "composer": "Muthuswami Dikshitar",
        "deity": "Lord Krishna",
        "date_taught": "2024-02-05",
        "lyrics": "Bhavayami gopalabalam\nManasa smarame nitya kalam",
        "meaning": "I meditate upon the child Gopala, remembering him always in my mind"
    },
    {
        "name": "Banturiti Kolu",
        "raga": "Hanumatodi",
        "tala": "Adi",
        "composer": "Tyagaraja",
        "deity": "Lord Rama",
        "date_taught": "2024-02-12",
        "lyrics": "Banturiti kolu vaccitiva\nRama nannu brovara",
        "meaning": "Will you come to save me, oh Rama?"
    },
    {
        "name": "Kshirasagara Shayana",
        "raga": "Devagandhari",
        "tala": "Adi",
        "composer": "Muthuswami Dikshitar",
        "deity": "Lord Vishnu",
        "date_taught": "2024-02-18",
        "lyrics": "Kshirasagara shayana he krishna\nKeshava madhava govinda",
        "meaning": "Oh Krishna who reclines on the ocean of milk, Keshava, Madhava, Govinda"
    },
    {
        "name": "Melukovayya",
        "raga": "Bowli",
        "tala": "Adi",
        "composer": "Tyagaraja",
        "deity": "Lord Rama",
        "date_taught": "2024-03-01",
        "lyrics": "Melukovayya rama melukovayya\nMelu konte nannu brovudura",
        "meaning": "Please wake up, Rama, wake up! If you wake up, will you protect me?"
    }
]

# API Endpoints

@api_router.get("/")
async def root():
    return {"message": "Keerthana Management API"}

@api_router.post("/keerthanas", response_model=Keerthana)
async def create_keerthana(keerthana: KeerthanaCreate):
    keerthana_dict = keerthana.dict()
    keerthana_obj = Keerthana(**keerthana_dict)
    result = await db.keerthanas.insert_one(keerthana_obj.dict())
    return keerthana_obj

@api_router.get("/keerthanas", response_model=List[Keerthana])
async def get_keerthanas():
    keerthanas = await db.keerthanas.find().to_list(1000)
    return [Keerthana(**keerthana) for keerthana in keerthanas]

@api_router.get("/keerthanas/{keerthana_id}", response_model=Keerthana)
async def get_keerthana(keerthana_id: str):
    keerthana = await db.keerthanas.find_one({"id": keerthana_id})
    if not keerthana:
        raise HTTPException(status_code=404, detail="Keerthana not found")
    return Keerthana(**keerthana)

@api_router.put("/keerthanas/{keerthana_id}", response_model=Keerthana)
async def update_keerthana(keerthana_id: str, keerthana_update: KeerthanaUpdate):
    update_data = {k: v for k, v in keerthana_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    result = await db.keerthanas.update_one(
        {"id": keerthana_id}, 
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Keerthana not found")
    
    updated_keerthana = await db.keerthanas.find_one({"id": keerthana_id})
    return Keerthana(**updated_keerthana)

@api_router.delete("/keerthanas/{keerthana_id}")
async def delete_keerthana(keerthana_id: str):
    result = await db.keerthanas.delete_one({"id": keerthana_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Keerthana not found")
    return {"message": "Keerthana deleted successfully"}

@api_router.get("/keerthanas/by-raga/{raga}")
async def get_keerthanas_by_raga(raga: str):
    keerthanas = await db.keerthanas.find({"raga": raga}).to_list(1000)
    return [Keerthana(**keerthana) for keerthana in keerthanas]

@api_router.get("/keerthanas/by-tala/{tala}")
async def get_keerthanas_by_tala(tala: str):
    keerthanas = await db.keerthanas.find({"tala": tala}).to_list(1000)
    return [Keerthana(**keerthana) for keerthana in keerthanas]

@api_router.get("/keerthanas/by-composer/{composer}")
async def get_keerthanas_by_composer(composer: str):
    keerthanas = await db.keerthanas.find({"composer": composer}).to_list(1000)
    return [Keerthana(**keerthana) for keerthana in keerthanas]

@api_router.get("/keerthanas/by-deity/{deity}")
async def get_keerthanas_by_deity(deity: str):
    keerthanas = await db.keerthanas.find({"deity": deity}).to_list(1000)
    return [Keerthana(**keerthana) for keerthana in keerthanas]

@api_router.get("/classifications")
async def get_classifications():
    pipeline = [
        {
            "$group": {
                "_id": None,
                "ragas": {"$addToSet": "$raga"},
                "talas": {"$addToSet": "$tala"},
                "composers": {"$addToSet": "$composer"},
                "deities": {"$addToSet": "$deity"}
            }
        }
    ]
    
    result = await db.keerthanas.aggregate(pipeline).to_list(1)
    if result:
        classifications = result[0]
        return {
            "ragas": sorted(classifications.get("ragas", [])),
            "talas": sorted(classifications.get("talas", [])),
            "composers": sorted(classifications.get("composers", [])),
            "deities": sorted(classifications.get("deities", []))
        }
    return {"ragas": [], "talas": [], "composers": [], "deities": []}

@api_router.post("/upload-notation/{keerthana_id}")
async def upload_notation_file(keerthana_id: str, file: UploadFile = File(...)):
    if not file.content_type or not (file.content_type.startswith('image/') or file.content_type == 'application/pdf'):
        raise HTTPException(status_code=400, detail="Only PDF and image files are allowed")
    
    # Create unique filename
    file_extension = file.filename.split('.')[-1].lower()
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Determine file type
    file_type = "pdf" if file.content_type == "application/pdf" else "image"
    
    # Create notation file object
    notation_file = NotationFile(
        name=file.filename,
        url=f"/uploads/{unique_filename}",
        type=file_type
    )
    
    # Update keerthana with new notation file
    result = await db.keerthanas.update_one(
        {"id": keerthana_id},
        {"$push": {"notation_files": notation_file.dict()}}
    )
    
    if result.matched_count == 0:
        # Clean up uploaded file if keerthana not found
        file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=404, detail="Keerthana not found")
    
    return {"message": "File uploaded successfully", "file": notation_file}

@api_router.post("/seed-data")
async def seed_sample_data():
    # Clear existing data
    await db.keerthanas.delete_many({})
    
    # Insert sample data
    keerthanas_to_insert = []
    for sample in SAMPLE_KEERTHANAS:
        keerthana = Keerthana(**sample)
        keerthanas_to_insert.append(keerthana.dict())
    
    result = await db.keerthanas.insert_many(keerthanas_to_insert)
    return {"message": f"Seeded {len(result.inserted_ids)} keerthanas successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()