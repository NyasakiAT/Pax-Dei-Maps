from django.contrib import admin
from paxdeimaps.models.category import Category
from paxdeimaps.models.location import Location
from paxdeimaps.models.resource import Resource


class ResourceAdmin(admin.ModelAdmin):
    pass

class CategoryAdmin(admin.ModelAdmin):
    pass

class LocationAdmin(admin.ModelAdmin):
    pass


admin.site.register(Resource, ResourceAdmin)
admin.site.register(Category, CategoryAdmin)
admin.site.register(Location, LocationAdmin)