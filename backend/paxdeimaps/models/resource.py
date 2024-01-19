from django.db import models
from paxdeimaps.models.rarity import Rarity
from paxdeimaps.models.category import Category

class Resource(models.Model):
    name = models.CharField(max_length=30)
    rarity = models.ForeignKey(Rarity, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='resources')
    icon_url = models.CharField(max_length=30, blank=True, null=True)
    
    def __str__(self):
        return self.name