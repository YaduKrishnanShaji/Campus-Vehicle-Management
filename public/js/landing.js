// Intersection Observer for fade-in animations
const fadeInElements = document.querySelectorAll('.benefit-card, .feature-card, .stat-card');

const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, {
    threshold: 0.1
});

fadeInElements.forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    fadeInObserver.observe(element);
});

// Animated number counter for stats
function animateNumber(element, target) {
    let current = 0;
    const increment = target / 100;
    const duration = 2000; // 2 seconds
    const stepTime = duration / 100;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target + '+';
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current) + '+';
        }
    }, stepTime);
}

// Initialize all animations and interactions
document.addEventListener('DOMContentLoaded', () => {
    // Start animation when stats section is in view
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                document.querySelectorAll('.stat-number').forEach(stat => {
                    const target = parseInt(stat.textContent);
                    animateNumber(stat, target);
                });
                statsObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.5
    });

    const statsSection = document.querySelector('.stats');
    if (statsSection) {
        statsObserver.observe(statsSection);
    }

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Parallax effect for hero section
    const hero = document.querySelector('.hero');
    window.addEventListener('scroll', () => {
        if (hero) {
            const scrolled = window.pageYOffset;
            hero.style.backgroundPosition = `center ${scrolled * 0.5}px`;
        }
    });

    // Mobile menu setup
    const mobileMenuButton = document.createElement('button');
    mobileMenuButton.className = 'mobile-menu-button';
    mobileMenuButton.innerHTML = '<i class="fas fa-bars"></i>';
    document.querySelector('.navbar').appendChild(mobileMenuButton);

    const navLinks = document.querySelector('.nav-links');
    mobileMenuButton.addEventListener('click', () => {
        navLinks.classList.toggle('show');
        mobileMenuButton.classList.toggle('active');
    });

    // Add mobile menu styles
    const mobileStyles = document.createElement('style');
    mobileStyles.textContent = `
        .mobile-menu-button {
            display: none;
            background: none;
            border: none;
            color: var(--primary-color);
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0.5rem;
        }

        @media (max-width: 768px) {
            .mobile-menu-button {
                display: block;
            }

            .nav-links {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: var(--white);
                padding: 1rem;
                flex-direction: column;
                align-items: center;
                transform: translateY(-100%);
                opacity: 0;
                transition: all 0.3s ease;
                pointer-events: none;
            }

            .nav-links.show {
                transform: translateY(0);
                opacity: 1;
                pointer-events: all;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
        }
    `;
    document.head.appendChild(mobileStyles);

    // Add hover effect for benefit cards
    document.querySelectorAll('.benefit-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });

    // Add gradient text animation
    const gradientTexts = document.querySelectorAll('.gradient-text');
    gradientTexts.forEach(text => {
        text.style.backgroundSize = '200% auto';
        text.style.animation = 'gradient 3s linear infinite';
    });
}); 