from pymongo import MongoClient
import os
from dotenv import load_dotenv
import json
from bson import json_util

load_dotenv()

try:
    print("\n=== MongoDB Bağlantı Detayları ===")
    connection_string = os.getenv('MONGO_URI')
    print(f"Bağlantı string'i: {connection_string}")
    
    client = MongoClient(connection_string)
    
    # Bağlantıyı test et
    client.admin.command('ping')
    print("✅ Bağlantı başarılı!")
    
    # Tüm veritabanlarını listele
    dbs = client.list_database_names()
    print(f"\nMevcut veritabanları: {dbs}")
    
    # Veritabanını seç
    db = client['yoklama_sitemi']
    print(f"\nSeçili veritabanı: yoklama_sitemi")
    
    # Koleksiyonları listele
    collections = db.list_collection_names()
    print(f"Mevcut koleksiyonlar: {collections}")
    
    # Users koleksiyonunu kontrol et
    if 'users' in collections:
        users = list(db.users.find())
        print(f"\nUsers koleksiyonunda {len(users)} döküman var")
        print("\nKullanıcılar:")
        for user in users:
            print(json.loads(json_util.dumps(user)))
    else:
        print("\n❌ Users koleksiyonu bulunamadı!")

except Exception as e:
    print(f"\n❌ MongoDB hatası: {e}")
    raise e

# dosyanın en sonuna şunu ekle
__all__ = ["db"]
