from django.db import models
from paxdeimaps.models.resource import Resource

class Location(models.Model):
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE)
    lat = models.CharField(max_length=30)
    lng = models.CharField(max_length=30)
    confirmations = models.IntegerField()