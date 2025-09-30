document.addEventListener('DOMContentLoaded', function() {
    const priceInputs = document.querySelectorAll('.price-min, .price-max');
    priceInputs.forEach(input => {
        input.addEventListener('change', function() {
        });
    });

    const viewButtons = document.querySelectorAll('.view-btn');
    const productsGrid = document.querySelector('.products-grid');
    
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            viewButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            productsGrid.className = 'products-grid';
            productsGrid.classList.add(this.dataset.view + '-view');
        });
    });
});

    function updateSort(value) {
        document.getElementById('sort-input').value = value;
        document.getElementById('filter-submit').click();
    }
    
    document.querySelectorAll('#filter-form input[type="checkbox"], #filter-form input[type="number"]').forEach(input => {
        input.addEventListener('change', () => {
            document.getElementById('filter-submit').click();
        });
    });
    
    document.getElementById('sort-select').addEventListener('change', function() {
        updateSort(this.value);
    });

    
document.addEventListener('DOMContentLoaded', function() {
    const mobileFiltersToggle = document.getElementById('mobileFiltersToggle');
    const filtersSidebar = document.getElementById('filtersSidebar');
    const closeFilters = document.getElementById('closeFilters');
    const toggleIcon = document.getElementById('toggleIcon');
    const applyFiltersBtn = document.querySelector('.apply-filters-btn');

    const filtersOverlay = document.createElement('div');
    filtersOverlay.className = 'filters-overlay';
    document.body.appendChild(filtersOverlay);

    mobileFiltersToggle.addEventListener('click', function() {
        filtersSidebar.classList.add('active');
        filtersOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        mobileFiltersToggle.classList.add('active');
    });

    function closeFiltersSidebar() {
        filtersSidebar.classList.remove('active');
        filtersOverlay.classList.remove('active');
        document.body.style.overflow = '';
        mobileFiltersToggle.classList.remove('active');
    }
    
    closeFilters.addEventListener('click', closeFiltersSidebar);
    filtersOverlay.addEventListener('click', closeFiltersSidebar);

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('filter-form').submit();
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && filtersSidebar.classList.contains('active')) {
            closeFiltersSidebar();
        }
    });

    const filterInputs = document.querySelectorAll('#filter-form input, #filter-form select');
    filterInputs.forEach(input => {
        input.addEventListener('change', function() {
            if (window.innerWidth > 1024) {
                document.getElementById('filter-form').submit();
            }
        });
    });
});