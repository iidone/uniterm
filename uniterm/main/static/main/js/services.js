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