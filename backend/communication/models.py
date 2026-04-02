from django.db import models

class SignalMessage(models.Model):
    room_id = models.CharField(max_length=255, db_index=True)
    sender_type = models.CharField(max_length=50) # 'doctor' or 'patient'
    signal_data = models.JSONField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.sender_type} in {self.room_id} at {self.timestamp}"
