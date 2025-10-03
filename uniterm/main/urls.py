from django.contrib import admin
from django.urls import path, include
from . import views
from django.conf.urls.static import static
from django.conf import settings
from django.contrib.sitemaps.views import sitemap
from django.views.generic import TemplateView
from sitemaps import StaticSitemap, ProductSitemap

sitemaps = {
    'static': StaticSitemap,
    'products': ProductSitemap,
}

urlpatterns = [
    path("", views.index, name='home'),
    path("catalog/", views.catalog, name='catalog'),
    path("services/", views.services, name='services'),
    path("about/", views.index, name='about'),
    path("delivery/", views.index, name='delivery'),
    path("payment/", views.index, name='payment'),
    path("contacts/", views.index, name='contacts'),
    path('product/<int:product_id>/', views.product_detail, name='product_detail'),
    path('cart/', views.cart_view, name='cart_view'),
    path('cart/add/<int:product_id>/', views.add_to_cart, name='add_to_cart'),
    path('cart/update/<int:item_id>/', views.update_cart_item, name='update_cart_item'),
    path('cart/remove/<int:item_id>/', views.remove_from_cart, name='remove_from_cart'),
    path('cart/add-service/<int:service_id>/', views.add_service_to_cart, name='add_service_to_cart'),
    path('api/recommend-products/', views.recommend_products, name='recommend_products'),
    path('create-order/', views.create_order, name='create_order'),
    path('create-price-request/', views.create_price_request, name='create_price_request'),
    path('create-quiz-request/', views.create_quiz_request, name='create_quiz_request'),
    path('sitemap.xml', sitemap, {'sitemaps': {'static': StaticSitemap, 'products': ProductSitemap}}, name='sitemap'),
    path('robots.txt', TemplateView.as_view(template_name='robots.txt', content_type='text/plain'), name='robots'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
