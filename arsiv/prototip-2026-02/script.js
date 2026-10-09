// EgebeyiGida - Script
document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    // Header scroll
    var header = document.getElementById('header');
    function handleScroll() {
        header.classList.toggle('scrolled', window.scrollY > 50);
        updateActiveNav();
    }
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Hamburger
    var hamburger = document.getElementById('hamburger');
    var nav = document.getElementById('nav');
    if (hamburger && nav) {
        hamburger.addEventListener('click', function () {
            var isOpen = nav.classList.toggle('open');
            hamburger.classList.toggle('active');
            hamburger.setAttribute('aria-expanded', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });
        nav.querySelectorAll('.nav__link').forEach(function (link) {
            link.addEventListener('click', function () {
                nav.classList.remove('open');
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            });
        });
    }

    // Active nav on scroll
    var sections = document.querySelectorAll('section[id]');
    function updateActiveNav() {
        var scrollPos = window.scrollY + 120;
        sections.forEach(function (section) {
            var top = section.offsetTop;
            var height = section.offsetHeight;
            var id = section.getAttribute('id');
            var link = document.querySelector('.nav__link[href="#' + id + '"]');
            if (link) {
                if (scrollPos >= top && scrollPos < top + height) {
                    document.querySelectorAll('.nav__link').forEach(function (l) { l.classList.remove('active'); });
                    link.classList.add('active');
                }
            }
        });
    }

    // Scroll animations
    var animEls = document.querySelectorAll('.service-card, .category-card, .product-card, .feature-card, .contact__item, .about__content, .about__image');
    var animObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                animObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

    animEls.forEach(function (el) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        animObserver.observe(el);
    });

    var style = document.createElement('style');
    style.textContent = '.animate-in{opacity:1!important;transform:translateY(0)!important}';
    document.head.appendChild(style);

    handleScroll();
});
