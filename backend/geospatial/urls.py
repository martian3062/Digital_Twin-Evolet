from django.urls import path
from . import views

urlpatterns = [
    path('geospatial/', views.GeospatialAnalysisView.as_view(), name='geospatial'),
    path('behavioral/', views.BehavioralAnalysisView.as_view(), name='behavioral'),
    path('similarity/', views.PatientSimilarityView.as_view(), name='similarity'),
    path('federated/status/', views.FederatedStatusView.as_view(), name='federated-status'),
]
