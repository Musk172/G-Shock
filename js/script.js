import { inject } from '@vercel/analytics';
import ScrollSequence from './ScrollSequence.js';

inject();

document.addEventListener('DOMContentLoaded', async () => {
    // --- Loading Screen Logic ---
    const loadingScreen = document.getElementById('loading-screen');
    const percentDisplay = document.getElementById('loader-percent');
    const circle = document.querySelector('.progress-ring-circle');

    // Prevent scrolling during load
    document.body.style.overflow = 'hidden';

    if (loadingScreen && circle && percentDisplay) {
        const circumference = 339.292; // 2 * PI * 54
        let progress = 0;

        // Initialize with 0
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        circle.style.strokeDashoffset = circumference;

        let currentProgress = 0;
        let targetProgress = 0;
        let animationFrameId;

        // 1. Simulator: Adds chunks to target at random intervals
        const simulateLoading = () => {
            if (targetProgress >= 100) return;

            // Random jump size
            let jump = Math.random() * 15 + 5;

            // Slow down heavily near 90%
            if (targetProgress > 80) jump = Math.random() * 5 + 1;

            targetProgress += jump;
            if (targetProgress > 100) targetProgress = 100;

            // Random delay for next chunk
            const delay = Math.random() * 200 + 100;
            setTimeout(simulateLoading, delay);
        };

        // 2. Animator: Smoothly interpolates current -> target
        const updateVisuals = () => {
            // Lerp factor (higher = faster catchup, lower = smoother/slower)
            const ease = 0.05;

            // Standard Lerp
            currentProgress += (targetProgress - currentProgress) * ease;

            // Snap if very close
            if (Math.abs(targetProgress - currentProgress) < 0.1) {
                currentProgress = targetProgress;
            }

            // Update DOM
            percentDisplay.textContent = Math.floor(currentProgress);
            const offset = circumference - (currentProgress / 100) * circumference;
            circle.style.strokeDashoffset = offset;

            if (currentProgress < 99.9) {
                animationFrameId = requestAnimationFrame(updateVisuals);
            } else {
                // Done
                percentDisplay.textContent = "100";
                circle.style.strokeDashoffset = 0;

                setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                    document.body.style.overflow = '';
                }, 500);
            }
        };

        // Start
        setTimeout(() => {
            simulateLoading();
            requestAnimationFrame(updateVisuals);
        }, 300);


    }


    // 0. Fetch Frame List (Static Public Assets)
    let frames = [];
    try {
        const response = await fetch('/frames.json');
        if (!response.ok) throw new Error('Failed to load frames list');
        const filenames = await response.json();
        // Construct full paths relative to web root
        frames = filenames.map(filename => `/frames/${filename}`);
        console.log(`Loaded ${frames.length} frames.`);
    } catch (error) {
        console.error('Error loading frames:', error);
    }

    // Scrollytelling Initialization
    const scrollSequenceContainer = document.querySelector('.scroll-sequence-container');
    if (scrollSequenceContainer && frames.length > 0) {
        new ScrollSequence({
            container: '.scroll-sequence-container',
            frames: frames
        });
    }

    // 0. Hero Slideshow Scroll Logic
    const heroWrapper = document.querySelector('.hero-scroll-wrapper');
    const heroBgs = document.querySelectorAll('.hero-bg');
    const indicators = document.querySelectorAll('.indicator');

    if (heroWrapper && heroBgs.length > 0) {
        window.addEventListener('scroll', () => {
            const wrapperRect = heroWrapper.getBoundingClientRect();
            const wrapperHeight = heroWrapper.offsetHeight - window.innerHeight; // Scrollable distance

            // Calculate progress 0 to 1 based on how far we've scrolled past the top
            // wrapperRect.top is negative as we scroll down
            let progress = -wrapperRect.top / wrapperHeight;

            // Clamp progress between 0 and 1
            progress = Math.max(0, Math.min(1, progress));

            // Determine active index (0 to 3)
            const totalSlides = heroBgs.length;
            let activeIndex = Math.floor(progress * totalSlides);

            // Ensure we don't go out of bounds
            if (activeIndex >= totalSlides) activeIndex = totalSlides - 1;

            // Theme Colors for each slide [Navbar BG, Button BG, Text Color]
            const themeColors = [
                // Slide 1 (Dark): White Text
                { nav: 'rgba(255, 255, 255, 0.05)', btn: 'rgba(255, 255, 255, 0.95)', text: '#ffffff' },
                // Slide 2 (Olive): Dark Text
                { nav: 'rgba(200, 220, 200, 0.15)', btn: 'rgba(60, 70, 50, 1)', text: '#1a1a1a' },
                // Slide 3 (Yellow): Dark Text
                { nav: 'rgba(255, 240, 200, 0.15)', btn: 'rgba(80, 70, 20, 1)', text: '#1a1a1a' },
                // Slide 4 (Blue): Dark Text
                { nav: 'rgba(200, 225, 255, 0.15)', btn: 'rgba(40, 60, 80, 1)', text: '#1a1a1a' }
            ];

            // Update Backgrounds
            heroBgs.forEach((bg, index) => {
                if (index === activeIndex) {
                    bg.classList.add('active');
                } else {
                    bg.classList.remove('active');
                }
            });

            // Update Indicators
            indicators.forEach((ind, index) => {
                if (index === activeIndex) {
                    ind.classList.add('active');
                } else {
                    ind.classList.remove('active');
                }
            });

            // Update Navbar Theme
            const navbar = document.querySelector('.navbar');
            const navBtn = document.querySelector('.navbar .btn-primary-small');
            const logo = document.querySelector('.logo');
            const navLinks = document.querySelectorAll('.nav-links a');

            if (navbar && navBtn && themeColors[activeIndex]) {
                const theme = themeColors[activeIndex];

                // Navbar & Button BG
                navbar.style.backgroundColor = progress >= 0.99 ? 'rgba(0, 0, 0, 0.8)' : theme.nav; // Darker nav BG for content sections
                navbar.style.borderColor = (activeIndex === 0 || progress >= 0.99) ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
                navBtn.style.backgroundColor = theme.btn;

                // Text Colors (Logo & Links)
                // User Request: White text for all sections except Hero. 
                // Hero logic applies for progress < 1. Once past hero (progress ~ 1), force white.
                // Also, last slide might be dark text, so we override it if we are at the end.
                const forceWhite = progress >= 0.95;
                const finalTextColor = forceWhite ? '#ffffff' : theme.text;

                if (logo) logo.style.color = finalTextColor;
                navLinks.forEach(link => link.style.color = finalTextColor);

                // Button Text matches the theme text contrast (inverted or specific)
                // For Slide 1 (White btn): Black text. For others (Darker btns): White text.
                navBtn.style.color = activeIndex === 0 ? '#000000' : '#ffffff';
            }
        });

        // Click indicators to scroll to that section
        indicators.forEach((ind, index) => {
            ind.addEventListener('click', () => {
                const wrapperTop = heroWrapper.offsetTop;
                const wrapperHeight = heroWrapper.offsetHeight - window.innerHeight;
                const sectionHeight = wrapperHeight / heroBgs.length;

                // Scroll to the start of that segment + a little buffer
                const targetScroll = wrapperTop + (sectionHeight * index) + 10;

                window.scrollTo({
                    top: targetScroll,
                    behavior: 'smooth'
                });
            });
        });
    }

    // 1. Scroll Animations using Intersection Observer (Enhanced)
    const observerOptions = {
        threshold: 0.15, // Trigger when 15% is visible
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                // Optional: Unobserve if we only want it to happen once
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all elements with the reveal class
    document.querySelectorAll('.reveal-on-scroll, .stagger-children').forEach(target => {
        observer.observe(target);
    });


    // 2. Colorways Carousel Logic
    const track = document.querySelector('.carousel-track');
    const slides = Array.from(track.children);
    const nextButton = document.querySelector('#nextBtn');
    const prevButton = document.querySelector('#prevBtn');

    let currentSlideIndex = 0;

    const updateSlides = (index) => {
        slides.forEach((slide, i) => {
            slide.classList.remove('current-slide');
            if (i === index) {
                slide.classList.add('current-slide');
            }
        });
    }

    nextButton.addEventListener('click', () => {
        currentSlideIndex = (currentSlideIndex + 1) % slides.length;
        updateSlides(currentSlideIndex);
    });

    prevButton.addEventListener('click', () => {
        currentSlideIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
        updateSlides(currentSlideIndex);
    });

    // 3. Navbar background on scroll (REMOVED - Conflicted with Theme Logic)

});
