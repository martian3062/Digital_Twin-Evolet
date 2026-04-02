import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    PORT = int(os.getenv('AI_ENGINE_PORT', '8100'))
    DEBUG = os.getenv('AI_DEBUG', 'True').lower() == 'true'
    PINECONE_API_KEY = os.getenv('PINECONE_API_KEY', '')
    PINECONE_ENVIRONMENT = os.getenv('PINECONE_ENVIRONMENT', '')
    MODEL_CACHE_DIR = os.getenv('MODEL_CACHE_DIR', './model_cache')


settings = Settings()
