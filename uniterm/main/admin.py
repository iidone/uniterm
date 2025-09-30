from django.contrib import admin
from .models import Products, Service, Cart, Reviews

admin.site.register(Products)
admin.site.register(Service)
admin.site.register(Cart)
admin.site.register(Reviews)