from django.urls import path
from .views import SignalView, ClearRoomSignalsView

urlpatterns = [
    path('signal/', SignalView.as_view(), name='signal'),
    path('signal/<str:room_id>/', SignalView.as_view(), name='get_room_signals'),
    path('clear/<str:room_id>/', ClearRoomSignalsView.as_view(), name='clear_signals')
]
