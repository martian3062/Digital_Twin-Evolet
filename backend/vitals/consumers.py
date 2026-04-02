import json
from channels.generic.websocket import AsyncWebsocketConsumer


class VitalsConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time vitals streaming."""

    async def connect(self):
        self.patient_id = self.scope['url_route']['kwargs']['patient_id']
        self.room_group_name = f'vitals_{self.patient_id}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': f'Connected to vitals stream for patient {self.patient_id}'
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get('type', '')

        if msg_type == 'ping':
            await self.send(text_data=json.dumps({'type': 'pong'}))

    async def vital_update(self, event):
        """Handle vital update broadcast."""
        await self.send(text_data=json.dumps({
            'type': 'vital_update',
            'data': event['data']
        }))

    async def anomaly_detected(self, event):
        """Handle anomaly detection broadcast."""
        await self.send(text_data=json.dumps({
            'type': 'anomaly_detected',
            'data': event['data']
        }))

    async def risk_update(self, event):
        """Handle risk score update broadcast."""
        await self.send(text_data=json.dumps({
            'type': 'risk_update',
            'data': event['data']
        }))
