"""Google Fit API integration for health data sync."""

import logging
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

# Google Fit data source types
GOOGLE_FIT_DATA_TYPES = {
    'com.google.heart_rate.bpm': {'metric': 'heart_rate', 'unit': 'bpm'},
    'com.google.blood_pressure': {'metric': 'bp_systolic', 'unit': 'mmHg'},
    'com.google.oxygen_saturation': {'metric': 'spo2', 'unit': '%'},
    'com.google.step_count.delta': {'metric': 'steps', 'unit': 'steps'},
    'com.google.sleep.segment': {'metric': 'sleep_duration', 'unit': 'min'},
    'com.google.calories.expended': {'metric': 'calories', 'unit': 'kcal'},
    'com.google.body.temperature': {'metric': 'body_temp', 'unit': '°C'},
    'com.google.active_minutes': {'metric': 'activity_minutes', 'unit': 'min'},
    'com.google.weight': {'metric': 'weight', 'unit': 'kg'},
}

SCOPES = [
    'https://www.googleapis.com/auth/fitness.heart_rate.read',
    'https://www.googleapis.com/auth/fitness.blood_pressure.read',
    'https://www.googleapis.com/auth/fitness.oxygen_saturation.read',
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.sleep.read',
    'https://www.googleapis.com/auth/fitness.body.read',
    'https://www.googleapis.com/auth/fitness.body_temperature.read',
]


def get_oauth_url():
    """Generate Google OAuth2 authorization URL for Fit API."""
    from google_auth_oauthlib.flow import Flow

    flow = Flow.from_client_config(
        {
            'web': {
                'client_id': settings.GOOGLE_FIT_CLIENT_ID,
                'client_secret': settings.GOOGLE_FIT_CLIENT_SECRET,
                'redirect_uris': [settings.GOOGLE_FIT_REDIRECT_URI],
                'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
                'token_uri': 'https://oauth2.googleapis.com/token',
            }
        },
        scopes=SCOPES,
    )
    flow.redirect_uri = settings.GOOGLE_FIT_REDIRECT_URI

    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent',
    )
    return authorization_url, state


def exchange_code(code):
    """Exchange authorization code for tokens."""
    from google_auth_oauthlib.flow import Flow

    flow = Flow.from_client_config(
        {
            'web': {
                'client_id': settings.GOOGLE_FIT_CLIENT_ID,
                'client_secret': settings.GOOGLE_FIT_CLIENT_SECRET,
                'redirect_uris': [settings.GOOGLE_FIT_REDIRECT_URI],
                'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
                'token_uri': 'https://oauth2.googleapis.com/token',
            }
        },
        scopes=SCOPES,
    )
    flow.redirect_uri = settings.GOOGLE_FIT_REDIRECT_URI
    flow.fetch_token(code=code)
    return flow.credentials


def fetch_fit_data(credentials, data_type, start_time=None, end_time=None):
    """Fetch data from Google Fit REST API."""
    from googleapiclient.discovery import build
    from google.oauth2.credentials import Credentials

    if start_time is None:
        start_time = timezone.now() - timedelta(days=1)
    if end_time is None:
        end_time = timezone.now()

    creds = Credentials(
        token=credentials.get('access_token'),
        refresh_token=credentials.get('refresh_token'),
        token_uri='https://oauth2.googleapis.com/token',
        client_id=settings.GOOGLE_FIT_CLIENT_ID,
        client_secret=settings.GOOGLE_FIT_CLIENT_SECRET,
    )

    service = build('fitness', 'v1', credentials=creds)

    start_ns = int(start_time.timestamp() * 1e9)
    end_ns = int(end_time.timestamp() * 1e9)

    dataset_id = f"{start_ns}-{end_ns}"

    try:
        response = service.users().dataSources().datasets().get(
            userId='me',
            dataSourceId=f"derived:{data_type}:com.google.android.gms:merge_{data_type.split('.')[-1]}",
            datasetId=dataset_id,
        ).execute()

        return _parse_fit_response(response, data_type)
    except Exception as e:
        logger.error(f"Google Fit API error: {e}")
        return []


def _parse_fit_response(response, data_type):
    """Parse Google Fit API response into vitals format."""
    vitals = []
    mapping = GOOGLE_FIT_DATA_TYPES.get(data_type)

    if not mapping or 'point' not in response:
        return vitals

    for point in response.get('point', []):
        start_ns = int(point.get('startTimeNanos', 0))
        recorded_at = datetime.fromtimestamp(start_ns / 1e9, tz=timezone.utc)

        for value in point.get('value', []):
            val = value.get('fpVal', value.get('intVal', 0))
            vitals.append({
                'metric_type': mapping['metric'],
                'value': float(val),
                'unit': mapping['unit'],
                'recorded_at': recorded_at.isoformat(),
                'data_source': 'google_fit',
                'metadata': {'raw_data_type': data_type},
            })

    return vitals


def generate_mock_data(patient_id, hours=24):
    """Generate realistic mock vitals data for demo purposes."""
    import random
    from .models import Vital

    now = timezone.now()
    vitals = []

    for i in range(hours * 4):  # Every 15 minutes
        timestamp = now - timedelta(minutes=15 * i)
        hour = timestamp.hour

        # Heart rate: varies by time of day
        base_hr = 65 if 0 <= hour < 6 else (75 if 6 <= hour < 12 else (80 if 12 <= hour < 18 else 70))
        hr_value = base_hr + random.gauss(0, 8)

        vitals.append(Vital(
            patient_id=patient_id,
            metric_type='heart_rate',
            value=round(max(45, min(140, hr_value)), 1),
            unit='bpm',
            recorded_at=timestamp,
            data_source='google_fit',
        ))

        # SpO2: every hour
        if i % 4 == 0:
            spo2_value = 97 + random.gauss(0, 1.2)
            vitals.append(Vital(
                patient_id=patient_id,
                metric_type='spo2',
                value=round(max(88, min(100, spo2_value)), 1),
                unit='%',
                recorded_at=timestamp,
                data_source='google_fit',
            ))

        # Steps: every hour during waking hours
        if i % 4 == 0 and 6 <= hour <= 22:
            steps = max(0, random.gauss(400, 200))
            vitals.append(Vital(
                patient_id=patient_id,
                metric_type='steps',
                value=round(steps),
                unit='steps',
                recorded_at=timestamp,
                data_source='google_fit',
            ))

        # Body temperature: every 2 hours
        if i % 8 == 0:
            temp = 36.6 + random.gauss(0, 0.3)
            vitals.append(Vital(
                patient_id=patient_id,
                metric_type='body_temp',
                value=round(max(35.5, min(38.5, temp)), 1),
                unit='°C',
                recorded_at=timestamp,
                data_source='device',
            ))

        # Blood pressure: every 4 hours
        if i % 16 == 0:
            sys_bp = 120 + random.gauss(0, 12)
            dia_bp = 80 + random.gauss(0, 8)
            vitals.append(Vital(
                patient_id=patient_id,
                metric_type='bp_systolic',
                value=round(max(90, min(160, sys_bp))),
                unit='mmHg',
                recorded_at=timestamp,
                data_source='device',
            ))
            vitals.append(Vital(
                patient_id=patient_id,
                metric_type='bp_diastolic',
                value=round(max(55, min(100, dia_bp))),
                unit='mmHg',
                recorded_at=timestamp,
                data_source='device',
            ))

    created = Vital.objects.bulk_create(vitals)
    return len(created)
