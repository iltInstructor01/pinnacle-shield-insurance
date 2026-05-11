/* ============================================
   Pinnacle Shield Insurance - Main JavaScript
   Shared across all pages
   ============================================ */

// Active navigation highlighting
(function () {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    var navLinks = document.querySelectorAll('.navbar-nav .nav-link');

    navLinks.forEach(function (link) {
        link.classList.remove('active');
        link.removeAttribute('aria-current');

        var href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });
})();

// Smooth scrolling for same-page anchor links
document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
        var targetId = this.getAttribute('href');
        if (targetId === '#') return;

        var target = document.querySelector(targetId);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// FAQ search/filter functionality
(function () {
    var searchInput = document.getElementById('faq-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', function () {
        var searchTerm = this.value.toLowerCase().trim();
        var items = document.querySelectorAll('.accordion-item');
        var noResults = document.getElementById('faq-no-results');
        var visibleCount = 0;

        items.forEach(function (item) {
            var text = item.textContent.toLowerCase();
            if (searchTerm === '' || text.indexOf(searchTerm) !== -1) {
                item.style.display = '';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });

        if (noResults) {
            if (visibleCount === 0 && searchTerm !== '') {
                noResults.classList.remove('hidden');
            } else {
                noResults.classList.add('hidden');
            }
        }
    });
})();
