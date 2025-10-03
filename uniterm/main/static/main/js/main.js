function fixIOSFooter() {
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        document.body.style.minHeight = window.innerHeight + 'px';
        
        window.addEventListener('resize', function() {
            document.body.style.minHeight = window.innerHeight + 'px';
        });
    }
}
document.addEventListener('DOMContentLoaded', fixIOSFooter);

document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-list li a');

    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (currentPath === '/' && linkPath === '/') {
            link.classList.add('active');
        }
        else if (currentPath.startsWith(linkPath) && linkPath !== '/') {
            link.classList.add('active');
        }
    });

    const searchInput = document.getElementById('search-input');
    const searchForm = document.getElementById('search-form');
    
    if (searchInput && searchForm) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const searchValue = this.value.trim();
                if (searchValue) {
                    searchForm.submit();
                } else {
                    window.location.href = "/catalog/";
                }
            }
        });
    }

    initReturnModal();
});

function initReturnModal() {
    const returnModal = document.getElementById('returnModal');
    const closeReturnModal = document.getElementById('closeReturnModal');
    const sendReturnRequest = document.getElementById('sendReturnRequest');

    if (localStorage.getItem('returnModalClosed') === 'true') {
        console.log('Modal was previously closed by user');
        return;
    }

    if (!returnModal || !closeReturnModal || !sendReturnRequest) {
        console.log('Modal elements not found');
        return;
    }

    let tabHiddenTime = null;
    let lastShowTime = 0;
    const MIN_INTERVAL = 10000;

    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            tabHiddenTime = Date.now();
        } else {
            if (tabHiddenTime) {
                const timeAway = Date.now() - tabHiddenTime;
                const timeSinceLastShow = Date.now() - lastShowTime;

                if (timeAway > 10000 && timeSinceLastShow > MIN_INTERVAL) {
                    setTimeout(() => {
                        showReturnModal();
                    }, 1000);
                }
            }
        }
    });

    function showReturnModal() {
        const timeSinceLastShow = Date.now() - lastShowTime;
        if (timeSinceLastShow < MIN_INTERVAL) {
            return;
        }
        
        returnModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        lastShowTime = Date.now();
    }

    function closeReturnModalFunc() {
        returnModal.classList.remove('active');
        document.body.style.overflow = 'auto';

        localStorage.setItem('returnModalClosed', 'true');
    }

    closeReturnModal.addEventListener('click', closeReturnModalFunc);
    
    returnModal.addEventListener('click', function(e) {
        if (e.target === returnModal) {
            closeReturnModalFunc();
        }
    });

    const phoneElement = document.getElementById('returnPhone');
    if (phoneElement && typeof IMask !== 'undefined') {
        const mask = IMask(phoneElement, {
            mask: '+{375} (00) 000-00-00',
            lazy: false
        });
    }

    sendReturnRequest.addEventListener('click', function(event) {
        event.preventDefault();

        const name = document.getElementById('returnName').value.trim();
        const phone = document.getElementById('returnPhone').value.trim();
        const product = document.getElementById('returnProduct').value.trim();
        const price = document.getElementById('returnPrice').value.trim();
        const phoneDigits = phone.replace(/\D/g, '');

        if (!phone) {
            showNotification('Пожалуйста, введите номер телефона', 'error');
            return;
        }

        if (phoneDigits.length !== 12) {
            showNotification('Пожалуйста, введите корректный номер телефона', 'error');
            return;
        }

        const originalText = sendReturnRequest.innerHTML;
        sendReturnRequest.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправляем...';
        sendReturnRequest.disabled = true;

        fetch('/create-price-request/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({
                name: name,
                phone: phone,
                product: product,
                price: price
            })
        })
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Full response data:', data);

            if (data.success) {
                showNotification('Спасибо! Мы свяжемся с вами с лучшим предложением!', 'success');

                localStorage.setItem('returnModalClosed', 'true');
                
                setTimeout(() => {
                    closeReturnModalFunc();
                    document.getElementById('returnName').value = '';
                    document.getElementById('returnPhone').value = '';
                    document.getElementById('returnProduct').value = '';
                    document.getElementById('returnPrice').value = '';
                }, 2000);
            } else {
                throw new Error(data.error || 'Неизвестная ошибка сервера');
            }
        })
        .catch(error => {
            console.error('Full error details:', error);
            showNotification('Ошибка при отправке заявки: ' + error.message, 'error');
        })
        .finally(() => {
            sendReturnRequest.innerHTML = originalText;
            sendReturnRequest.disabled = false;
        });
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

function showNotification(message, type = 'success') {
    document.querySelectorAll('.global-notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `global-notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;

    document.body.appendChild(notification);

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#25D366' : '#ff4757'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s ease;
    `;

    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);

    notification.querySelector('.notification-close').addEventListener('click', () => {
        closeNotification(notification);
    });

    setTimeout(() => {
        closeNotification(notification);
    }, 5000);
}

function closeNotification(notification) {
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

function showSimpleNotification(message, type = 'success') {
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