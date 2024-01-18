from django.db import models
from paxdeimaps.models.category import Category

class Resource(models.Model):
    name = models.CharField(max_length=30)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    rarity = models.CharField(max_length=30)
    iconUrl = models.CharField(max_length=30)