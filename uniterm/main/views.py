import json
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.shortcuts import render, get_object_or_404, redirect
from .models import Products, Reviews, Service, Cart, CartItem
from django.db.models import Count, Min, Max, Q
from django.contrib.auth.models import User
from django.contrib.sessions.models import Session
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import ensure_csrf_cookie
from datetime import datetime
from main.tgbot.notifications import send_telegram_message
from django.contrib.sitemaps import Sitemap
from django.contrib.sitemaps.views import sitemap
from django.urls import reverse

@require_POST
def create_quiz_request(request):
    try:
        print("=== CREATE_QUIZ_REQUEST CALLED ===")
        data = json.loads(request.body)
        
        phone = data.get('phone')
        answers = data.get('answers', {})
        
        print(f"Phone: {phone}, Answers: {answers}")
        
        message = f"🎯 *НОВАЯ ЗАЯВКА ИЗ КВИЗА!*\n\n"
        message += f"📞 *Телефон:* `{phone}`\n"
        message += f"📅 *Дата:* {datetime.now().strftime('%d.%m.%Y %H:%M')}\n\n"
        
        if answers:
            message += f"*Ответы из квиза:*\n"
            if answers.get('area'):
                message += f"• Площадь: до {answers['area']} м²\n"
            if answers.get('location'):
                message += f"• Место установки: {answers['location']}\n"
            if answers.get('noise'):
                message += f"• Уровень шума: до {answers['noise']} дБ\n"
            if answers.get('features'):
                features = ", ".join(answers['features'])
                message += f"• Функции: {features}\n"
            if answers.get('budget'):
                message += f"• Бюджет: до {answers['budget']} BYN\n"
        
        print(f"Sending to Telegram: {message}")
        result = send_telegram_message(message)
        print(f"Telegram result: {result}")
        
        if result and result.get('success'):
            return JsonResponse({'success': True})
        else:
            return JsonResponse({'success': False, 'error': 'Ошибка отправки в Telegram'})
        
    except Exception as e:
        print(f"Error creating quiz request: {e}")
        return JsonResponse({'success': False, 'error': str(e)})


@require_POST
def create_order(request):
    print("=== CREATE_ORDER CALLED ===")
    try:
        print("Request body:", request.body)
        data = json.loads(request.body)
        phone = data.get('phone')
        comment = data.get('comment', '')
        
        print(f"Phone: {phone}, Comment: {comment}")
        
        cart = get_or_create_cart(request)
        cart_items = cart.items.select_related('product', 'service')
        
        if not cart_items:
            return JsonResponse({'success': False, 'error': 'Корзина пуста'})

        order_text = f"🛒 *НОВЫЙ ЗАКАЗ!*\n\n"
        order_text += f"📞 *Телефон:* `{phone}`\n"
        order_text += f"📅 *Дата:* {datetime.now().strftime('%d.%m.%Y %H:%M')}\n\n"
        order_text += f"*Состав заказа:*\n"
        
        total_amount = 0
        for item in cart_items:
            if item.product:
                order_text += f"• {item.product.name} - {item.quantity} шт. × {item.product.price} BYN\n"
                total_amount += item.total_price()
            elif item.service:
                order_text += f"• {item.service.name} - {item.service.price} BYN\n"
                total_amount += item.service.price
        
        order_text += f"\n💵 *Итого:* {total_amount} BYN\n"
        
        if comment:
            order_text += f"\n💬 *Комментарий:* {comment}\n"
        
        print(f"Sending to Telegram: {order_text}")
        result = send_telegram_message(order_text)
        print(f"Telegram result: {result}")

        if result and result.get('success'):
            cart.items.all().delete()
            return JsonResponse({'success': True, 'message': 'Заказ успешно создан'})
        else:
            print(f"Telegram error: {result}")
            return JsonResponse({'success': False, 'error': 'Ошибка отправки в Telegram'})
        
    except Exception as e:
        print(f"Error creating order: {e}")
        return JsonResponse({'success': False, 'error': str(e)})
    
@require_POST
def create_price_request(request):
    try:
        print("=== CREATE_PRICE_REQUEST CALLED ===")
        data = json.loads(request.body)
        
        name = data.get('name', '')
        phone = data.get('phone')
        product = data.get('product', '')
        price = data.get('price', '')
        
        print(f"Name: {name}, Phone: {phone}, Product: {product}, Price: {price}")
        
        message = f"💰 *ЗАПРОС ЛУЧШЕЙ ЦЕНЫ!*\n\n"
        message += f"👤 *Имя:* {name}\n"
        message += f"📞 *Телефон:* `{phone}`\n"
        message += f"🛒 *Товар:* {product}\n"
        message += f"💵 *Найденная цена:* {price} BYN\n"
        message += f"📅 *Дата:* {datetime.now().strftime('%d.%m.%Y %H:%M')}\n"
        
        print(f"Sending to Telegram: {message}")
        result = send_telegram_message(message)
        print(f"Telegram result: {result}")
        
        if result and result.get('success'):
            return JsonResponse({'success': True})
        else:
            return JsonResponse({'success': False, 'error': 'Ошибка отправки в Telegram'})
        
    except Exception as e:
        print(f"Error creating price request: {e}")
        return JsonResponse({'success': False, 'error': str(e)})
    
def get_or_create_cart(request):
    if request.user.is_authenticated:
        cart, created = Cart.objects.get_or_create(user=request.user)
    else:
        session_key = request.session.session_key
        if not session_key:
            request.session.create()
            session_key = request.session.session_key
        
        cart, created = Cart.objects.get_or_create(session_key=session_key, user=None)
    
    return cart


def index(request):
    hit_products = Products.objects.filter(is_hit=True)[:3]
    reviews = Reviews.objects.all().order_by('-created_at')
    return render(request, 'main/index.html', {
        'hit_products': hit_products,
        'reviews': reviews
    })

def profile(request):

    return render(request, 'main/profile.html')

from django.db.models import Q

def catalog(request):
    products_list = Products.objects.filter(is_active=True)
    
    search_query = request.GET.get('search')
    if search_query:
        products_list = products_list.filter(
            Q(name__icontains=search_query) |
            Q(brand__icontains=search_query) |
            Q(description__icontains=search_query) |
            Q(article__icontains=search_query)
        )

    brand_filter = request.GET.getlist('brand')
    country_filter = request.GET.getlist('country')
    color_filter = request.GET.getlist('color')
    compressor_filter = request.GET.getlist('compressor')
    warranty_filter = request.GET.getlist('warranty')
    min_price = request.GET.get('min_price')
    max_price = request.GET.get('max_price')
    sort_option = request.GET.get('sort', 'popular')

    if brand_filter:
        products_list = products_list.filter(brand__in=brand_filter)
    
    if country_filter:
        products_list = products_list.filter(brand_country__in=country_filter)
    
    if color_filter:
        products_list = products_list.filter(color__in=color_filter)
    
    if compressor_filter:
        products_list = products_list.filter(compressor_type__in=compressor_filter)
    
    if warranty_filter:
        products_list = products_list.filter(warranty__in=warranty_filter)
    
    if min_price:
        try:
            products_list = products_list.filter(price__gte=float(min_price))
        except ValueError:
            pass
    
    if max_price:
        try:
            products_list = products_list.filter(price__lte=float(max_price))
        except ValueError:
            pass
    
    if sort_option == 'price-asc':
        products_list = products_list.order_by('price')
    elif sort_option == 'price-desc':
        products_list = products_list.order_by('-price')
    elif sort_option == 'new':
        products_list = products_list.order_by('-created_at')
    else:
        products_list = products_list.order_by('-created_at')

    page = request.GET.get('page', 1)
    paginator = Paginator(products_list, 12)
    
    try:
        products = paginator.page(page)
    except PageNotAnInteger:
        products = paginator.page(1)
    except EmptyPage:
        products = paginator.page(paginator.num_pages)

    brands = Products.objects.filter(is_active=True).values('brand').annotate(
        count=Count('id')).order_by('-count')
    
    countries = Products.objects.filter(is_active=True).values('brand_country').annotate(
        count=Count('id')).order_by('-count')
    
    colors = Products.objects.filter(is_active=True).values('color').annotate(
        count=Count('id')).order_by('-count')
    
    compressor_types = Products.objects.filter(is_active=True).values('compressor_type').annotate(
        count=Count('id')).order_by('-count')
    
    warranties = Products.objects.filter(is_active=True).values('warranty').annotate(
        count=Count('id')).order_by('-count')
    
    price_range = Products.objects.filter(is_active=True).aggregate(
        min_price=Min('price'),
        max_price=Max('price')
    )
    
    min_price_val = price_range['min_price'] or 0
    max_price_val = price_range['max_price'] or 0
    
    context = {
        'products': products,
        'brands': brands,
        'countries': countries,
        'colors': colors,
        'compressor_types': compressor_types,
        'warranties': warranties,
        'min_price_val': min_price_val,
        'max_price_val': max_price_val,
        'current_filters': {
            'search': search_query,
            'brand': brand_filter,
            'country': country_filter,
            'color': color_filter,
            'compressor': compressor_filter,
            'warranty': warranty_filter,
            'min_price': min_price,
            'max_price': max_price,
            'sort': sort_option,
        }
    }
    
    return render(request, 'main/catalog.html', context)

def services(request):
    services_list = Service.objects.filter(is_active=True)
    
    category_filter = request.GET.getlist('category')
    min_price = request.GET.get('min_price')
    max_price = request.GET.get('max_price')
    
    if category_filter:
        services_list = services_list.filter(category__in=category_filter)
    
    if min_price:
        try:
            services_list = services_list.filter(price__gte=float(min_price))
        except ValueError:
            pass
    
    if max_price:
        try:
            services_list = services_list.filter(price__lte=float(max_price))
        except ValueError:
            pass

    sort_option = request.GET.get('sort', 'name')
    if sort_option == 'price-asc':
        services_list = services_list.order_by('price')
    elif sort_option == 'price-desc':
        services_list = services_list.order_by('-price')
    elif sort_option == 'popular':
        services_list = services_list.order_by('-is_popular', 'name')
    else:
        services_list = services_list.order_by('name')

    categories_with_count = Service.objects.filter(is_active=True).values(
        'category'
    ).annotate(
        count=Count('id')
    ).order_by('category')

    page = request.GET.get('page', 1)
    paginator = Paginator(services_list, 12)
    
    try:
        services = paginator.page(page)
    except PageNotAnInteger:
        services = paginator.page(1)
    except EmptyPage:
        services = paginator.page(paginator.num_pages)
    
    context = {
        'services': services,
        'categories': categories_with_count,
        'current_filters': {
            'category': category_filter,
            'min_price': min_price,
            'max_price': max_price,
            'sort': sort_option,
        }
    }
    
    return render(request, 'main/services.html', context)

def add_to_cart(request, product_id):
    print(f"DEBUG: Add to cart called for product {product_id}")
    
    if request.method == 'POST':
        try:
            product = get_object_or_404(Products, id=product_id, is_active=True)
            quantity = int(request.POST.get('quantity', 1))
            
            print(f"DEBUG: Product: {product.name}, Quantity: {quantity}")
            
            cart = get_or_create_cart(request)
            print(f"DEBUG: Cart ID: {cart.id}")

            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                defaults={
                    'quantity': quantity,
                    'item_type': CartItem.PRODUCT
                }
            )
            
            if not created:
                cart_item.quantity += quantity
                cart_item.save()
                print(f"DEBUG: Quantity updated to: {cart_item.quantity}")
            
            total_quantity = cart.total_quantity()
            print(f"DEBUG: Total quantity in cart: {total_quantity}")
            
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True,
                    'message': 'Товар добавлен в корзину',
                    'total_quantity': total_quantity
                })
            
            return redirect('cart_view')
            
        except Exception as e:
            print(f"DEBUG: Error: {str(e)}")
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'message': f'Ошибка: {str(e)}'
                })
    
    return redirect('product_detail', product_id=product_id)

def cart_view(request):
    cart = get_or_create_cart(request)
    cart_items = cart.items.select_related('product', 'service')
    
    context = {
        'cart': cart,
        'cart_items': cart_items,
    }
    
    return render(request, 'main/cart.html', context)


@require_POST
@ensure_csrf_cookie
def update_cart_item(request, item_id):
    if request.method == 'POST':
        cart = get_or_create_cart(request)
        cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)
        action = request.POST.get('action')
        
        if action == 'increase':
            cart_item.quantity += 1
        elif action == 'decrease' and cart_item.quantity > 1:
            cart_item.quantity -= 1
        elif action == 'remove':
            cart_item.delete()
            return JsonResponse({'success': True})
        
        cart_item.save()
        
        return JsonResponse({
            'success': True,
            'quantity': cart_item.quantity,
            'item_total': str(cart_item.total_price()),
            'cart_total': str(cart.total_price()),
            'total_quantity': cart.total_quantity()
        })
    
    return JsonResponse({'success': False})

def remove_from_cart(request, item_id):
    if request.method == 'POST':
        cart = get_or_create_cart(request)
        cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)
        cart_item.delete()
        
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'success': True,
                'cart_total': cart.total_price(),
                'total_quantity': cart.total_quantity()
            })
        
        return redirect('cart_view')
    
    return JsonResponse({'success': False})

def product_detail(request, product_id):
    product = get_object_or_404(Products, id=product_id, is_active=True)
    
    similar_products = Products.objects.filter(
        is_active=True,
        brand=product.brand
    ).exclude(id=product.id)[:4]

    in_cart = False
    cart_quantity = 0
    if request.user.is_authenticated:
        cart_item = CartItem.objects.filter(
            cart__user=request.user,
            product=product
        ).first()
        if cart_item:
            in_cart = True
            cart_quantity = cart_item.quantity
    
    context = {
        'product': product,
        'similar_products': similar_products,
        'in_cart': in_cart,
        'cart_quantity': cart_quantity,
    }
    
    return render(request, 'main/product_detail.html', context)



def cart_context(request):
    cart_total_quantity = 0
    
    if request.user.is_authenticated:
        cart = Cart.objects.filter(user=request.user).first()
    else:
        session_key = request.session.session_key
        if session_key:
            cart = Cart.objects.filter(session_key=session_key, user=None).first()
        else:
            cart = None
    
    if cart:
        cart_total_quantity = cart.total_quantity()
    
    return {
        'cart_total_quantity': cart_total_quantity
    }


def add_service_to_cart(request, service_id):
    print(f"DEBUG: Add service to cart called for service {service_id}")
    
    if request.method == 'POST':
        try:
            service = get_object_or_404(Service, id=service_id, is_active=True)
            
            print(f"DEBUG: Service: {service.name}")
            
            cart = get_or_create_cart(request)
            print(f"DEBUG: Cart ID: {cart.id}")

            existing_service = CartItem.objects.filter(
                cart=cart,
                service=service
            ).first()
            
            if existing_service:
                print(f"DEBUG: Service already in cart")
                
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({
                        'success': False,
                        'message': 'Эта услуга уже добавлена в корзину'
                    })
                
                return redirect('cart_view')

            cart_item = CartItem.objects.create(
                cart=cart,
                item_type=CartItem.SERVICE,
                service=service,
                quantity=1
            )
            
            print(f"DEBUG: Service added to cart, ID: {cart_item.id}")
            
            total_quantity = cart.total_quantity()
            print(f"DEBUG: Total quantity in cart: {total_quantity}")
            
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True,
                    'message': 'Услуга добавлена в корзину',
                    'total_quantity': total_quantity
                })
            
            return redirect('cart_view')
            
        except Exception as e:
            print(f"DEBUG: Error: {str(e)}")
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'message': f'Ошибка: {str(e)}'
                })
    
    return redirect('services')


def recommend_products(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            print("=== RECOMMEND PRODUCTS CALLED ===")
            print("Received data:", data)
            
            products = Products.objects.filter(is_active=True)

            if data.get('area'):
                area = int(data['area'])
                products = products.filter(square__gte=area-5, square__lte=area+10)
                print(f"Filtered by area {area}: {products.count()} products")

            if data.get('noise'):
                max_noise = int(data['noise'])
                products = products.filter(noise_level__lte=max_noise)
                print(f"Filtered by noise {max_noise}: {products.count()} products")

            if data.get('features'):
                features = data['features']
                if 'wifi' in features:
                    products = products.filter(wifi=True)
                if 'ionizer' in features:
                    products = products.filter(ionizer=True)
                if 'fresh_air' in features:
                    products = products.filter(fresh_air_mix=True)
                print(f"Filtered by features {features}: {products.count()} products")

            if data.get('budget'):
                budget = int(data['budget'])
                print(f"Budget filter: {budget}")
                
                if budget == 2000:
                    products = products.filter(price__lte=2000)
                elif budget == 3000:
                    products = products.filter(price__lte=3000)
                elif budget == 4000:
                    products = products.filter(price__lte=4000)
                elif budget == 5000:
                    products = products.filter(price__gte=4000)
                
                print(f"Filtered by budget {budget}: {products.count()} products")

            if not products.exists():
                print("No products found with strict filters, relaxing filters...")
                products = Products.objects.filter(is_active=True)

                if data.get('budget'):
                    budget = int(data['budget'])
                    if budget <= 2000:
                        products = products.filter(price__lte=2500)
                    elif budget <= 3000:
                        products = products.filter(price__lte=3500)
                    elif budget <= 4000:
                        products = products.filter(price__lte=4500)
                    else:
                        products = products.filter(price__gte=3500)

            recommended_products = products.order_by('price')[:3]
            print(f"Final products count: {recommended_products.count()}")

            products_data = []
            for product in recommended_products:
                products_data.append({
                    'id': product.id,
                    'name': product.name,
                    'brand': product.brand,
                    'square': product.square,
                    'noise_level': product.noise_level,
                    'price': str(product.price),
                    'image': product.image.url if product.image else '',
                    'features': {
                        'wifi': product.wifi,
                        'ionizer': product.ionizer,
                        'fresh_air': product.fresh_air_mix
                    }
                })
            
            print("Sending products:", products_data)
            
            return JsonResponse({
                'success': True,
                'products': products_data
            })
            
        except Exception as e:
            print(f"Error in recommend_products: {e}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            })
    
    return JsonResponse({'success': False, 'error': 'Invalid method'})


class StaticSitemap(Sitemap):
    changefreq = 'weekly'
    priority = 0.8

    def items(self):
        return ['home', 'catalog', 'services', 'about', 'delivery', 'payment', 'contacts']

    def location(self, item):
        return reverse(item)


class ProductSitemap(Sitemap):
    changefreq = 'daily'
    priority = 0.9

    def items(self):
        return Products.objects.filter(is_active=True)

    def lastmod(self, obj):
        return obj.updated_at


class ServiceSitemap(Sitemap):
    changefreq = 'weekly'
    priority = 0.7

    def items(self):
        return Service.objects.filter(is_active=True)

    def lastmod(self, obj):
        return obj.updated_at
