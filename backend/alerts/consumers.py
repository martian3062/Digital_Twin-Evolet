import json
from channels.generic.websocket import AsyncWebsocketConsumer


class AlertConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time alert notifications."""

    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.room_group_name = f'alerts_{self.user_id}'

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def new_alert(self, event):
        await self.send(text_data=json.dumps({
            'type': 'new_alert',
            'data': event['data']
        }))

    async def alert_resolved(self, event):
        await self.send(text_data=json.dumps({
            'type': 'alert_resolved',
            'data': event['data']
        }))
