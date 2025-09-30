from .models import Cart

def cart_context(request):
    cart_total_quantity = 0
    cart_total_price = 0
    
    try:
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
            cart_total_price = cart.total_price()
            
    except Exception as e:
        print(f"Error in cart context processor: {e}")
        cart_total_quantity = 0
        cart_total_price = 0
    
    return {
        'cart_total_quantity': cart_total_quantity,
        'cart_total_price': cart_total_price
    }