document.addEventListener('DOMContentLoaded', function() {
    console.log('Cart JS loaded');

    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const action = form.getAttribute('action');
            console.log('Form action:', action);
            
            if (action && action.includes('/cart/update/')) {
                updateCartItem(form);
            }
            else if (action && action.includes('/cart/remove/')) {
                removeFromCart(form);
            }
        });
    });
});

function updateCartItem(form) {
    const action = form.getAttribute('action');
    console.log('Updating cart item:', action);
    
    const formData = new FormData(form);
    const itemElement = form.closest('.cart-item');

    const button = form.querySelector('button');
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '...';

    fetch(action, {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCSRFToken()
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network error');
        }
        return response.json();
    })
    .then(data => {
        console.log('Response data:', data);
        
        if (data.success) {
            const quantityElement = itemElement.querySelector('.quantity');
            const totalElement = itemElement.querySelector('.item-total');
            
            if (quantityElement) quantityElement.textContent = data.quantity;
            if (totalElement) totalElement.textContent = `${data.item_total} BYN`;
            
            updateCartSummary(data.cart_total, data.total_quantity);
            showNotification('Корзина обновлена', 'success');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Ошибка обновления', 'error');
    })
    .finally(() => {
        button.disabled = false;
        button.innerHTML = originalText;
    });
}

function removeFromCart(form) {
    const action = form.getAttribute('action');
    console.log('Removing from cart:', action);
    
    const formData = new FormData(form);
    const itemElement = form.closest('.cart-item');

    const button = form.querySelector('button');
    const originalHtml = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    fetch(action, {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCSRFToken()
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Remove response:', data);
        
        if (data.success) {
            itemElement.style.opacity = '0';
            itemElement.style.transform = 'translateX(100px)';
            
            setTimeout(() => {
                itemElement.remove();
                updateCartSummary(data.cart_total, data.total_quantity);
                checkEmptyCart();
                showNotification('Товар удален', 'success');
            }, 300);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Ошибка при удалении', 'error');
        button.disabled = false;
        button.innerHTML = originalHtml;
    });
}

function getCSRFToken() {
    const formToken = document.querySelector('[name=csrfmiddlewaretoken]');
    if (formToken) return formToken.value;

    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
    
    return cookieValue || '';
}

function updateCartSummary(cartTotal, totalQuantity) {
    const cartTotalElement = document.querySelector('.summary-row.total span:last-child');
    if (cartTotalElement) {
        cartTotalElement.textContent = `${parseFloat(cartTotal).toFixed(2)} BYN`;
    }
    
    const quantityElement = document.querySelector('.summary-row:first-child span:first-child');
    if (quantityElement) {
        quantityElement.textContent = `Товары (${totalQuantity})`;
    }
    
    updateCartCounter(totalQuantity);
}

function checkEmptyCart() {
    const cartItems = document.querySelectorAll('.cart-item');
    const emptyCart = document.querySelector('.empty-cart');
    const cartContent = document.querySelector('.cart-content');
    
    if (cartItems.length === 0 && emptyCart && cartContent) {
        cartContent.style.display = 'none';
        emptyCart.style.display = 'block';
    }
}

function updateCartCounter(quantity) {
    let counter = document.querySelector('.cart-counter');
    
    if (!counter && quantity > 0) {
        const cartBtn = document.querySelector('.cart-button');
        if (cartBtn) {
            counter = document.createElement('span');
            counter.className = 'cart-counter';
            counter.style.cssText = `
                position: absolute;
                top: -5px;
                right: -5px;
                background: #ff4757;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
            `;
            cartBtn.appendChild(counter);
        }
    }
    
    if (counter) {
        counter.textContent = quantity;
        counter.style.display = quantity > 0 ? 'flex' : 'none';
    }
}

function showNotification(message, type = 'success') {
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#25D366' : '#ff4757'};
        color: white;
        border-radius: 5px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

//modal
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== CART JS LOADED ===');
    
    const checkoutBtn = document.getElementById('checkoutBtn');
    const orderModal = document.getElementById('orderModal');
    const closeOrderModal = document.getElementById('closeOrderModal');
    const orderForm = document.getElementById('orderForm');
    
    console.log('Modal elements:', { checkoutBtn, orderModal, closeOrderModal, orderForm });
    
    if (checkoutBtn && orderModal) {
        checkoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Opening order modal with classes');

            orderModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
        
        closeOrderModal.addEventListener('click', function() {
            console.log('Closing order modal');
            orderModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
        
        orderModal.addEventListener('click', function(e) {
            if (e.target === orderModal) {
                console.log('Closing modal via overlay');
                orderModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
        
        if (orderForm) {
            orderForm.addEventListener('submit', function(e) {
                e.preventDefault();
                submitOrder();
            });
        }
    }
    
    function submitOrder() {
        const phone = document.getElementById('orderPhone').value;
        const comment = document.getElementById('orderComment').value;
        const submitBtn = document.querySelector('#orderForm button[type="submit"]');
        
        const phoneDigits = phone.replace(/\D/g, '');
        if (phoneDigits.length !== 12) {
            showNotification('Пожалуйста, введите корректный номер телефона', 'error');
            return;
        }
        
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправляем...';
        submitBtn.disabled = true;
        
        const url = '/create-order/';
        
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({
                phone: phone,
                comment: comment
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Заказ успешно отправлен! Мы свяжемся с вами в ближайшее время.', 'success');
                setTimeout(() => {
                    orderModal.classList.remove('active');
                    document.body.style.overflow = 'auto';
                    window.location.href = '/catalog/';
                }, 1000);
            } else {
                throw new Error(data.error || 'Ошибка отправки заказа');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Ошибка при отправке заказа: ' + error.message, 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
    }
});

function getCSRFToken() {
    const formToken = document.querySelector('[name=csrfmiddlewaretoken]');
    if (formToken) return formToken.value;

    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
    
    return cookieValue || '';
}

function showNotification(message, type = 'success') {
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#25D366' : '#ff4757'};
        color: white;
        border-radius: 5px;
        z-index: 10001;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}