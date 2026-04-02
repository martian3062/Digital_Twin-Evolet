from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/alerts/(?P<user_id>[0-9a-f-]+)/$', consumers.AlertConsumer.as_asgi()),
]
