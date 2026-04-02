import os
import django
import json
import asyncio
from channels.testing import WebsocketCommunicator
from django.test import TransactionTestCase
from django.apps import apps
from django.contrib.auth import get_user_model

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medgenie.settings')
django.setup()

from communication.consumers import SignalingConsumer

User = get_user_model()
Consultation = apps.get_model('records', 'Consultation')

async def test_signaling_security():
    print("--- Starting Signaling Security Test ---")
    
    # 1. Create mock users and consultation
    doctor = await database_sync_to_async(User.objects.create_user)(username='doc_test', password='password123', role='doctor')
    patient = await database_sync_to_async(User.objects.create_user)(username='pat_test', password='password123', role='patient')
    stranger = await database_sync_to_async(User.objects.create_user)(username='stranger', password='password123', role='patient')
    
    consultation = await database_sync_to_async(Consultation.objects.create)(
        doctor=doctor,
        patient=patient,
        status='active'
    )
    room_id = str(consultation.id)
    
    print(f"Created Consultation ID: {room_id}")

    # 2. Test Unauthenticated Access
    communicator = WebsocketCommunicator(SignalingConsumer.as_asgi(), f"ws/communication/{room_id}/")
    # Wrap in scope manually since we are testing the consumer directly
    communicator.scope['user'] = type('AnonymousUser', (), {'is_anonymous': True})()
    communicator.scope['url_route'] = {'kwargs': {'room_id': room_id}}
    
    connected, subprotocol = await communicator.connect()
    print(f"Unauthenticated Connection: {'Success' if connected else 'Failed (Correct)'}")
    if not connected:
        await communicator.disconnect()

    # 3. Test Unauthorized Access (Stranger)
    communicator = WebsocketCommunicator(SignalingConsumer.as_asgi(), f"ws/communication/{room_id}/")
    communicator.scope['user'] = stranger
    communicator.scope['url_route'] = {'kwargs': {'room_id': room_id}}
    
    connected, subprotocol = await communicator.connect()
    print(f"Unauthorized Connection (Stranger): {'Success' if connected else 'Failed (Correct)'}")
    if not connected:
        await communicator.disconnect()

    # 4. Test Authorized Access (Doctor)
    communicator = WebsocketCommunicator(SignalingConsumer.as_asgi(), f"ws/communication/{room_id}/")
    communicator.scope['user'] = doctor
    communicator.scope['url_route'] = {'kwargs': {'room_id': room_id}}
    
    connected, subprotocol = await communicator.connect()
    print(f"Authorized Connection (Doctor): {'Success' if connected else 'Failed'}")
    
    if connected:
        # Test signaling message
        test_msg = {'type': 'offer', 'sdp': 'v=0...'}
        await communicator.send_json_to(test_msg)
        # In a real test we'd have a second communicator to receive it, but here we just check if it stays connected
        print("Signaling message sent successfully.")
        await communicator.disconnect()

    # Cleanup
    await database_sync_to_async(doctor.delete)()
    await database_sync_to_async(patient.delete)()
    await database_sync_to_async(stranger.delete)()
    await database_sync_to_async(consultation.delete)()
    print("--- Test Completed ---")

from channels.db import database_sync_to_async

if __name__ == "__main__":
    asyncio.run(test_signaling_security())
