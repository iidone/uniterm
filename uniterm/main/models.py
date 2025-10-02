from django.db import models
import os
from django.contrib.auth.models import User
from django.forms import ValidationError

def product_image_path(instance, filename):
    return os.path.join('main', 'images', 'products', instance.article, filename)

class Products(models.Model):
    name = models.CharField(max_length=255, verbose_name="Название")
    article = models.CharField(max_length=100, verbose_name="Артикул")
    availability = models.BooleanField(default=True, verbose_name="В наличии")
    quantity = models.IntegerField(default=0, verbose_name="Количество")
    description = models.TextField(max_length=2000, blank=True, verbose_name="Описание")
    image = models.ImageField(upload_to=product_image_path, verbose_name="Изображение")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Цена")
    is_hit = models.BooleanField()

    brand = models.CharField(max_length=50, verbose_name="Бренд")
    manufacturer = models.CharField(max_length=50, verbose_name="Производитель")
    brand_country = models.CharField(max_length=50, verbose_name="Страна бренда")
    color = models.CharField(max_length=50, verbose_name="Цвет")
    compressor_type = models.CharField(max_length=50, verbose_name="Тип компрессора")
    warranty = models.CharField(max_length=50, verbose_name="Гарантия")
    original = models.BooleanField(default=True, verbose_name="Оригинал")
    square = models.IntegerField(verbose_name="Площадь, м²")

    heating_t_range = models.CharField(max_length=50, verbose_name="Диапазон t на обогрев, С")

    ionizer = models.BooleanField(default=False, verbose_name="Ионизатор воздуха")

    wifi = models.BooleanField(default=False, verbose_name="Wi-Fi")
    fresh_air_mix = models.BooleanField(default=False, verbose_name="Подмес свежего воздуха")

    height = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="Высота, см")
    width = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="Ширина, см")
    depth = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="Глубина, см")

    noise_level = models.IntegerField(verbose_name="Уровень шума, дБа")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")
    is_active = models.BooleanField(default=True, verbose_name="Активный")
    
    class Meta:
        verbose_name = "Товар"
        verbose_name_plural = "Товары"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.article})"

    def get_absolute_url(self):
        from django.urls import reverse
        return reverse('product_detail', args=[self.pk])

    def get_dimensions(self):
        if all([self.height, self.width, self.depth]):
            return f"{self.height}x{self.width}x{self.depth}"
        return "Не указаны"



class Service(models.Model):
    name = models.CharField(max_length=255, verbose_name="Название услуги")
    slug = models.SlugField(unique=True, verbose_name="URL")
    description = models.TextField(blank=True, verbose_name="Описание")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Цена")
    image = models.ImageField(upload_to='services/', blank=True, null=True, verbose_name="Изображение")
    category = models.CharField(max_length=100, verbose_name="Категория")
    duration = models.CharField(max_length=50, blank=True, verbose_name="Длительность")
    is_popular = models.BooleanField(default=False, verbose_name="Популярная услуга")
    is_active = models.BooleanField(default=True, verbose_name="Активная")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Услуга"
        verbose_name_plural = "Услуги"
        ordering = ['category', 'name']

    def __str__(self):
        return self.name

    def get_absolute_url(self):
        from django.urls import reverse
        return reverse('services') + f'#{self.slug}'
    


class Cart(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    session_key = models.CharField(max_length=40, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Корзина"
        verbose_name_plural = "Корзины"

    def __str__(self):
        if self.user:
            return f"Корзина пользователя {self.user.username}"
        else:
            return f"Анонимная корзина ({self.session_key})"

    def total_price(self):
        return sum(item.total_price() for item in self.items.all())

    def total_quantity(self):
        return sum(item.quantity for item in self.items.all())

class CartItem(models.Model):
    PRODUCT = 'product'
    SERVICE = 'service'
    ITEM_TYPE_CHOICES = [
        (PRODUCT, 'Товар'),
        (SERVICE, 'Услуга'),
    ]
    
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    item_type = models.CharField(max_length=10, choices=ITEM_TYPE_CHOICES, default=PRODUCT)
    product = models.ForeignKey(Products, on_delete=models.CASCADE, null=True, blank=True)
    service = models.ForeignKey(Service, on_delete=models.CASCADE, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Элемент корзины"
        verbose_name_plural = "Элементы корзины"

    def clean(self):
        if not self.product and not self.service:
            raise ValidationError('Должен быть указан товар или услуга')
        if self.product and self.service:
            raise ValidationError('Может быть указан только товар или только услуга')

    def __str__(self):
        if self.product:
            return f"{self.quantity} x {self.product.name}"
        elif self.service:
            return f"{self.quantity} x {self.service.name}"
        return "Неизвестный элемент"

    def total_price(self):
        if self.product:
            return self.product.price * self.quantity
        elif self.service:
            return self.service.price * self.quantity
        return 0

    def is_service(self):
        return self.item_type == self.SERVICE

    def is_product(self):
        return self.item_type == self.PRODUCT
    
    
    

        
class Reviews(models.Model):
    name = models.CharField(max_length=255, verbose_name="Имя")
    surname = models.CharField(max_length=255, verbose_name="Фамилия")
    description = models.TextField(max_length=2000, blank=True, verbose_name="Описание")
    created_at = models.DateTimeField(verbose_name="Дата создания")

    class Meta:
        verbose_name = "Отзыв"
        verbose_name_plural = "Отзывы"
        
    def __str__(self):
        return f"{self.name} {self.surname} - {self.created_at.strftime('%d.%m.%Y')}"