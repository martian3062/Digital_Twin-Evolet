import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer

from channels.db import database_sync_to_async
from django.apps import apps

logger = logging.getLogger(__name__)

class SignalingConsumer(AsyncWebsocketConsumer):
    # Class-level room storage for managing participants in memory
    rooms = {}

    @database_sync_to_async
    def is_authorized_participant(self, room_id, user):
        """Verify if the user is the doctor or patient for the consultation room."""
        try:
            Consultation = apps.get_model('records', 'Consultation')
            consultation = Consultation.objects.get(id=room_id)
            return user.id == consultation.patient_id or user.id == consultation.doctor_id
        except Exception:
            return False

    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'signaling_{self.room_id}'
        self.user = self.scope.get('user')

        # 1. Authentication Check
        if not self.user or self.user.is_anonymous:
            logger.warning(f"Rejecting unauthenticated connection to room {self.room_id}")
            await self.close(code=4003)
            return

        # 2. Authorization Check
        is_authorized = await self.is_authorized_participant(self.room_id, self.user)
        if not is_authorized:
            logger.warning(f"User {self.user} NOT authorized for consultation {self.room_id}")
            await self.close(code=4003)
            return
        
        # 3. Capacity Check (max 2 participants)
        if self.room_id not in self.rooms:
            self.rooms[self.room_id] = []
        
        if len(self.rooms[self.room_id]) >= 2:
            logger.warning(f"Room {self.room_id} full. Connection rejected.")
            await self.close(code=4003) 
            return

        self.rooms[self.room_id].append(self.channel_name)
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        logger.info(f"WebSocket signaling connected: User={self.user}, Room={self.room_id}")

    async def disconnect(self, close_code):
        # Leave room group
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
        
        # Remove from room storage
        if hasattr(self, 'room_id') and self.room_id in self.rooms:
            if self.channel_name in self.rooms[self.room_id]:
                self.rooms[self.room_id].remove(self.channel_name)
            if not self.rooms[self.room_id]:
                del self.rooms[self.room_id]
        
        logger.info(f"WebSocket disconnected from room {self.room_id} (Code: {close_code})")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'signaling_message',
                    'sender_channel_name': self.channel_name,
                    'signal_data': data
                }
            )
        except json.JSONDecodeError:
            logger.error("Invalid JSON received")

    async def signaling_message(self, event):
        # Send message to WebSocket (if not the sender)
        if self.channel_name != event['sender_channel_name']:
            await self.send(text_data=json.dumps(event['signal_data']))
