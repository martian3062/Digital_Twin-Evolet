from django.urls import path
from . import views

urlpatterns = [
    path('alerts/', views.AlertListView.as_view(), name='alerts-list'),
    path('alerts/<uuid:id>/acknowledge/', views.AlertAcknowledgeView.as_view(), name='alert-acknowledge'),
    path('alerts/config/', views.AlertConfigView.as_view(), name='alert-config'),
    path('alerts/stats/', views.AlertStatsView.as_view(), name='alert-stats'),
]
