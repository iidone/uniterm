document.addEventListener('DOMContentLoaded', function() {
    initPhoneMasks();
    
    const basePrice = 32000;
    let currentPrice = basePrice;
    const powerSelect = document.getElementById('power');
    const systemTypeSelect = document.getElementById('system-type');
    const brandSelect = document.getElementById('brand');
    const trackLengthSlider = document.getElementById('track-length');
    const lengthValue = document.getElementById('length-value');
    const checkboxes = document.querySelectorAll('.option-checkbox');
    const totalAmount = document.getElementById('total-amount');
    const trackPricePerMeter = 1500;

    function updatePrice() {
        currentPrice = basePrice;

        const trackLength = parseInt(trackLengthSlider.value);
        if (trackLength > 3) {
            currentPrice += (trackLength - 3) * trackPricePerMeter;
        }

        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                currentPrice += parseInt(checkbox.value);
            }
        });

        totalAmount.textContent = currentPrice.toLocaleString('ru-RU');
    }

    trackLengthSlider.addEventListener('input', function() {
        lengthValue.textContent = this.value;
        updatePrice();
    });
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updatePrice);
    });
    
    powerSelect.addEventListener('change', updatePrice);
    systemTypeSelect.addEventListener('change', updatePrice);
    brandSelect.addEventListener('change', updatePrice);

    updatePrice();
});

function initPhoneMasks() {
    const phoneInputs = document.querySelectorAll('input[type="tel"], #returnPhone, #phoneNumber');
    
    phoneInputs.forEach(input => {
        if (typeof IMask !== 'undefined') {
            const mask = IMask(input, {
                mask: '+{375} (00) 000-00-00',
                lazy: false,
                overwrite: true,
                autofix: true
            });

            input.addEventListener('input', function() {
                validatePhone(input, mask);
            });

            validatePhone(input, mask);
        } else {
            console.warn('IMask not loaded');
            input.addEventListener('input', function() {
                validatePhoneFallback(input);
            });
        }
    });
}

function validatePhone(input, mask) {
    if (!mask) return;
    
    const unmasked = mask.unmaskedValue;
    if (unmasked.length === 12) {
        input.setCustomValidity('');
        input.classList.remove('invalid');
        input.classList.add('valid');
    } else {
        input.setCustomValidity('Введите корректный номер телефона');
        input.classList.remove('valid');
        input.classList.add('invalid');
    }
}

function validatePhoneFallback(input) {
    const phoneDigits = input.value.replace(/\D/g, '');
    if (phoneDigits.length === 12) {
        input.setCustomValidity('');
        input.classList.remove('invalid');
        input.classList.add('valid');
    } else {
        input.setCustomValidity('Введите корректный номер телефона');
        input.classList.remove('valid');
        input.classList.add('invalid');
    }
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

document.addEventListener('DOMContentLoaded', function() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });
            
            item.classList.toggle('active');
        });
    });
});

//scroll
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                history.pushState(null, null, targetId);
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const scrollElements = document.querySelectorAll('.animate-on-scroll');
    const acImages = document.querySelectorAll('.ac-image');
    
    const elementInView = (el, dividend = 1) => {
        const elementTop = el.getBoundingClientRect().top;
        return (
            elementTop <= (window.innerHeight || document.documentElement.clientHeight) / dividend
        );
    };
    
    const handleScrollAnimation = () => {
        scrollElements.forEach(el => {
            if (elementInView(el, 1.2)) {
                el.classList.add('animated');
            }
        });

        const scrollY = window.pageYOffset;
        acImages.forEach((img, index) => {
            const speed = index === 0 ? 0.2 : 0.3;
            const yPos = -(scrollY * speed);
            img.style.transform = `translateY(${yPos}px) rotate(var(--rotation))`;
        });
    };
    
    window.addEventListener('scroll', handleScrollAnimation);
    handleScrollAnimation();

    setTimeout(() => {
        scrollElements.forEach(el => {
            if (elementInView(el, 2)) {
                el.classList.add('animated');
            }
        });
    }, 100);

    acImages.forEach(img => {
        img.style.opacity = '0.9';
        img.style.transition = 'opacity 0.5s ease';
    });
});


// quiz

document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('quizModal');
    const openButton = document.querySelector('.hero-button');
    const closeButton = document.getElementById('closeModal');
    const nextButton = document.getElementById('nextBtn');
    const prevButton = document.getElementById('prevBtn');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const sendButton = document.getElementById('sendResults');
    
    let currentPage = 1;
    const totalPages = 6;
    let quizCompleted = false;
    let quizAnswers = {};

    let quizPhoneMask;
    const quizPhoneInput = document.getElementById('phoneNumber');
    
    if (quizPhoneInput && typeof IMask !== 'undefined') {
        quizPhoneMask = IMask(quizPhoneInput, {
            mask: '+{375} (00) 000-00-00',
            lazy: false,
            overwrite: true,
            autofix: true
        });

        quizPhoneInput.addEventListener('input', function() {
            validateQuizPhone();
        });
    }

    function validateQuizPhone() {
        if (!quizPhoneMask) return;
        
        const unmasked = quizPhoneMask.unmaskedValue;
        const phoneDigits = '375' + unmasked;
        
        if (unmasked.length === 9) {
            quizPhoneInput.setCustomValidity('');
            quizPhoneInput.classList.remove('invalid');
            quizPhoneInput.classList.add('valid');
        } else {
            quizPhoneInput.setCustomValidity('Введите корректный номер телефона');
            quizPhoneInput.classList.remove('valid');
            quizPhoneInput.classList.add('invalid');
        }
    }

    openButton.addEventListener('click', function() {
        resetQuiz();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    closeButton.addEventListener('click', closeModal);
    
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    nextButton.addEventListener('click', function() {
        if (currentPage < totalPages) {
            if (validateCurrentPage()) {
                saveCurrentPageAnswers();
                
                if (currentPage === 5) {
                    loadRecommendedProducts(quizAnswers);
                }
                
                goToPage(currentPage + 1);
            }
        }
    });

    prevButton.addEventListener('click', function() {
        if (currentPage === totalPages) {
            goToPage(1);
        } else if (currentPage > 1) {
            goToPage(currentPage - 1);
        }
    });

    function saveCurrentPageAnswers() {
        const currentPageEl = document.querySelector(`.quiz-page[data-page="${currentPage}"]`);
        
        if (currentPage === 1) {
            const selectedArea = currentPageEl.querySelector('input[name="area"]:checked');
            if (selectedArea) quizAnswers.area = selectedArea.value;
        }
        else if (currentPage === 2) {
            const selectedLocation = currentPageEl.querySelector('input[name="location"]:checked');
            if (selectedLocation) quizAnswers.location = selectedLocation.value;
        }
        else if (currentPage === 3) {
            const selectedNoise = currentPageEl.querySelector('input[name="noise"]:checked');
            if (selectedNoise) quizAnswers.noise = selectedNoise.value;
        }
        else if (currentPage === 4) {
            const selectedFeatures = Array.from(currentPageEl.querySelectorAll('input[name="features"]:checked'))
                .map(cb => cb.value);
            quizAnswers.features = selectedFeatures;
        }
        else if (currentPage === 5) {
            const selectedBudget = currentPageEl.querySelector('input[name="budget"]:checked');
            if (selectedBudget) quizAnswers.budget = selectedBudget.value;
        }
    }

    function validateCurrentPage() {
        if (currentPage === totalPages) return true;
        
        const currentPageEl = document.querySelector(`.quiz-page[data-page="${currentPage}"]`);
        
        if (currentPage === 4) {
            const isChecked = currentPageEl.querySelectorAll('input[name="features"]:checked').length > 0;
            if (!isChecked) {
                showNotification('Пожалуйста, выберите хотя бы одну функцию');
                return false;
            }
        } else {
            const isChecked = currentPageEl.querySelector('input[type="radio"]:checked');
            if (!isChecked) {
                showNotification('Пожалуйста, выберите вариант ответа');
                return false;
            }
        }
        
        return true;
    }

    function goToPage(page) {
        document.querySelectorAll('.quiz-page').forEach(page => {
            page.classList.remove('active');
        });
        
        document.querySelector(`.quiz-page[data-page="${page}"]`).classList.add('active');
        
        currentPage = page;
        updateProgress();
        updateNavigation();

        const modalContent = document.querySelector('.quiz-content');
        modalContent.scrollTop = 0;
    }

    function updateProgress() {
        const progress = ((currentPage - 1) / (totalPages - 1)) * 100;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${currentPage}/${totalPages}`;
    }

    function updateNavigation() {
        prevButton.style.display = currentPage > 1 ? 'block' : 'none';
        
        if (currentPage === totalPages) {
            nextButton.style.display = 'none';
            quizCompleted = true;
        } else {
            nextButton.style.display = 'block';
            nextButton.textContent = currentPage === totalPages - 1 ? 'Завершить' : 'Далее';
        }
    }

    function loadRecommendedProducts(answers) {
        const resultsContainer = document.getElementById('productsResults');
        resultsContainer.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Подбираем лучшие варианты...</p>
            </div>
        `;

        fetch('/api/recommend-products/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify(answers)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network error');
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.products && data.products.length > 0) {
                displayProducts(data.products, resultsContainer);
            } else {
                resultsContainer.innerHTML = `
                    <div class="no-products">
                        <p>К сожалению, по вашим критериям не найдено подходящих товаров.</p>
                        <p>Наш специалист поможет подобрать оптимальный вариант.</p>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            resultsContainer.innerHTML = `
                <div class="error-message">
                    <p>Произошла ошибка при подборе товаров.</p>
                    <p>Пожалуйста, попробуйте позже или свяжитесь с нами.</p>
                </div>
            `;
        });
    }

    function displayProducts(products, container) {
        let html = '<div class="recommended-products">';
        
        products.forEach(product => {
            html += `
                <div class="recommended-product">
                    <div class="product-image">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
                    <div class="product-info">
                        <h4>${product.name}</h4>
                        <p class="product-brand">${product.brand}</p>
                        <p class="product-square">Площадь: до ${product.square} м²</p>
                        <p class="product-noise">Уровень шума: ${product.noise_level} дБ</p>
                        <p class="product-price">${product.price} BYN</p>
                    </div>
                    <a href="/product/${product.id}/" class="product-link">Подробнее</a>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    sendButton.addEventListener('click', function() {
    const phoneInput = document.getElementById('phoneNumber');
    const phoneNumber = phoneInput.value.trim();
    
    console.log('Phone input value:', phoneNumber);
    
    if (!phoneNumber) {
        showNotification('Пожалуйста, введите номер телефона', 'error');
        return;
    }

    const phoneDigits = phoneNumber.replace(/\D/g, '');
    console.log('Phone digits length:', phoneDigits.length);

    if (phoneDigits.length !== 12 && phoneDigits.length !== 9) {
        showNotification('Пожалуйста, введите корректный номер телефона', 'error');
        return;
    }

    let formattedPhone;
    if (phoneDigits.length === 9) {
        formattedPhone = '+375' + phoneDigits;
    } else {
        formattedPhone = '+' + phoneDigits;
    }
    
    console.log('Formatted phone:', formattedPhone);

    sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправляем...';
    sendButton.disabled = true;

    fetch('/create-quiz-request/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({
            phone: formattedPhone,
            answers: quizAnswers
        })
    })
    .then(response => {
        console.log('Response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Server response:', data);

        if (data.success) {
            showNotification('Спасибо! Мы свяжемся с вами в ближайшее время!', 'success');
            setTimeout(() => {
                closeModal();
                phoneInput.value = '';
                sendButton.innerHTML = 'Получить консультацию';
                sendButton.disabled = false;
            }, 2000);
        } else {
            throw new Error(data.error || 'Ошибка отправки заявки');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Ошибка при отправке данных: ' + error.message, 'error');
        sendButton.innerHTML = 'Получить консультацию';
        sendButton.disabled = false;
    });
});

    function resetQuiz() {
        currentPage = 1;
        quizCompleted = false;
        quizAnswers = {};
        
        document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
            input.checked = false;
        });
        
        document.getElementById('phoneNumber').value = '';
        
        sendButton.innerHTML = 'Получить консультацию';
        sendButton.disabled = false;

        goToPage(1);
    }

    function showNotification(message, type = 'error') {
        const oldNotification = document.querySelector('.quiz-notification');
        if (oldNotification) {
            oldNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `quiz-notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        const modalRect = modal.getBoundingClientRect();
        notification.style.position = 'fixed';
        notification.style.top = `${modalRect.top + (modalRect.height / 2) - (notification.offsetHeight / 2)}px`;
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%) translateY(-50px)';
        notification.style.opacity = '0';

        setTimeout(() => {
            notification.style.transform = 'translateX(-50%) translateY(0)';
            notification.style.opacity = '1';
        }, 10);

        setTimeout(() => {
            notification.style.transform = 'translateX(-50%) translateY(-50px)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 100);
        }, 3000);
    }

    const notificationStyles = document.createElement('style');
    notificationStyles.textContent = `
        .quiz-notification {
            position: fixed;
            z-index: 10001;
            background: linear-gradient(135deg, #ff4757, #ff6b81);
            color: white;
            padding: 1.2rem 2rem;
            border-radius: 12px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.8rem;
            transition: all 0.3s ease;
            box-shadow: 0 8px 30px rgba(0,0,0,0.4);
            border: 2px solid rgba(255,255,255,0.2);
            min-width: 300px;
            text-align: center;
            pointer-events: none;
        }

        .quiz-notification.success {
            background: linear-gradient(135deg, #25D366, #128C7E);
        }

        .quiz-notification i {
            font-size: 1.3rem;
        }

        .quiz-notification span {
            flex: 1;
        }   
    `;
    document.head.appendChild(notificationStyles);
});

// reviews
document.addEventListener('DOMContentLoaded', function() {
    const reviewsGrid = document.getElementById('reviewsGrid');
    const showMoreBtn = document.getElementById('showMoreReviews');
    const hideAllBtn = document.getElementById('hideAllReviews');
    const allReviewsData = document.getElementById('allReviewsData');
    
    if (allReviewsData && showMoreBtn) {
        const reviewElements = Array.from(allReviewsData.querySelectorAll('.review-data'));
        let visibleCount = 3;
        const step = 3;

        function createReviewCard(reviewData) {
            const reviewCard = document.createElement('div');
            reviewCard.className = 'review-card';
            reviewCard.innerHTML = `
                <div class="review-stars">★★★★★</div>
                <p class="review-text">"${reviewData.getAttribute('data-description')}"</p>
                <div class="review-author">— ${reviewData.getAttribute('data-name')} ${reviewData.getAttribute('data-surname')}</div>
                <div class="review-tag">${reviewData.getAttribute('data-date')}</div>
            `;
            return reviewCard;
        }
        
        showMoreBtn.addEventListener('click', function() {
            const nextReviews = reviewElements.slice(visibleCount, visibleCount + step);
            
            nextReviews.forEach(reviewData => {
                const reviewCard = createReviewCard(reviewData);
                reviewsGrid.appendChild(reviewCard);
            });
            
            visibleCount += step;

            if (visibleCount >= reviewElements.length) {
                showMoreBtn.style.display = 'none';
            } else {
                showMoreBtn.textContent = `Показать ещё`;
            }

            hideAllBtn.style.display = 'inline-block';
        });
        
        hideAllBtn.addEventListener('click', function() {
            const allDisplayedReviews = reviewsGrid.querySelectorAll('.review-card');
            for (let i = 3; i < allDisplayedReviews.length; i++) {
                allDisplayedReviews[i].remove();
            }

            visibleCount = 3;

            showMoreBtn.style.display = 'inline-block';
            hideAllBtn.style.display = 'none';
            showMoreBtn.textContent = `Показать ещё`;
        });

        if (reviewElements.length <= 3) {
            showMoreBtn.style.display = 'none';
        }
    }
});

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

function isValidPhone(phone) {  
    const phoneDigits = phone.replace(/\D/g, '');
    return phoneDigits.length === 12;
}