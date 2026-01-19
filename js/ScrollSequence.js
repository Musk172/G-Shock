class ScrollSequence {
    constructor(options) {
        this.container = document.querySelector(options.container);
        this.canvas = this.container.querySelector('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.framePaths = options.frames; // Array of image paths
        this.frameCount = this.framePaths.length;
        this.images = [];
        this.loadedCount = 0;
        this.currentFrameIndex = 0;

        // Sticky scroll physics
        this.scrollContainer = this.container.closest('.scroll-sequence-container');

        this.init();

        // Smooth scroll state
        this.frameIndexFloat = 0;
        this.lastRenderedIndex = -1;
        this.targetFrameIndex = 0;
        this.renderLoop();
    }

    renderLoop() {
        if (!this.images || this.images.length === 0) {
            window.requestAnimationFrame(() => this.renderLoop());
            return;
        }

        const diff = this.targetFrameIndex - this.frameIndexFloat;

        // Linear interpolation (lerp)
        if (Math.abs(diff) > 0.05) {
            this.frameIndexFloat += diff * 0.08; // Adjust "0.08" for speed/smoothness
            const indexToRender = Math.round(this.frameIndexFloat);

            if (indexToRender !== this.lastRenderedIndex) {
                // Ensure bounds
                const safeIndex = Math.max(0, Math.min(this.frameCount - 1, indexToRender));
                this.render(safeIndex);
                this.lastRenderedIndex = safeIndex;
            }
        }

        window.requestAnimationFrame(() => this.renderLoop());
    }

    async init() {
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('scroll', () => this.handleScroll());

        // Initial render (placeholder or first frame if available)
        // Ensure high DPI rendering
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.canvas.clientWidth * dpr;
        this.canvas.height = this.canvas.clientHeight * dpr;
        this.ctx.scale(dpr, dpr);

        console.log('Preloading frames...');
        await this.preloadImages();
        console.log('All frames loaded.');

        this.handleScroll(); // Initial draw based on current scroll

        // Add loaded class to fade in if desired
        this.canvas.classList.add('loaded');
    }

    preloadImages() {
        return new Promise((resolve) => {
            if (this.frameCount === 0) resolve();

            this.framePaths.forEach((path, index) => {
                const img = new Image();
                img.src = path;
                img.onload = () => {
                    this.loadedCount++;
                    if (this.loadedCount === this.frameCount) {
                        resolve();
                    }
                };
                img.onerror = () => {
                    console.error(`Failed to load frame: ${path}`);
                    this.loadedCount++; // Count error as loaded to avoid hanging
                    if (this.loadedCount === this.frameCount) {
                        resolve();
                    }
                };
                this.images[index] = img;
            });
        });
    }

    handleResize() {
        // Use the parent container's dimensions instead of window
        const parent = this.canvas.parentElement;
        this.width = parent.clientWidth;
        this.height = parent.clientHeight;

        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);

        this.render(this.currentFrameIndex);
    }

    handleScroll() {
        // Calculate scroll progress within the sticky container
        const rect = this.scrollContainer.getBoundingClientRect();
        const containerHeight = rect.height;
        const windowHeight = window.innerHeight;

        // The animation should play while the container is in view
        // effectively: when top of container hits top of viewport (0) -> start
        // until bottom of container hits bottom of viewport -> end?
        // Usually sticky scroll works by: sticky element stays fixed for (containerHeight - windowHeight) pixels.

        // Let's assume the canvas is sticky inside scrollContainer.
        // Progress = (distance scrolled past start) / (total scrollable distance)

        const start = rect.top; // Distance of container top from viewport top
        // Since it's sticky, we care about how far we've scrolled *into* the container.

        // We need the offset relative to the document, but rect.top is relative to viewport.
        // The container enters the viewport. As we scroll, rect.top becomes negative.
        // We want 0% when rect.top = 0 (top of container hits top of viewport)
        // We want 100% when rect.bottom = windowHeight (bottom of container hits bottom of viewport)

        // Scrollable distance = containerHeight - windowHeight (the distance the sticky element travels relative to parent)

        const totalScrollDistance = containerHeight - windowHeight;
        const scrolled = -rect.top;

        let progress = scrolled / totalScrollDistance;
        progress = Math.max(0, Math.min(1, progress));

        // Update Target Index
        this.targetFrameIndex = Math.floor(progress * (this.frameCount - 1));

        // Update UI Progress Bar Immediately
        const progressBar = document.getElementById('scroll-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress * 100}%`;
        }
    }

    render(index) {
        if (!this.images[index] || !this.images[index].complete) return;

        const img = this.images[index];

        // Object-fit: cover logic
        const canvasRatio = this.width / this.height;
        const imgRatio = img.width / img.height;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (canvasRatio > imgRatio) {
            // Canvas is wider than image -> fit width
            drawWidth = this.width;
            drawHeight = this.width / imgRatio;
            offsetX = 0;
            offsetY = (this.height - drawHeight) / 2;
        } else {
            // Canvas is taller than image -> fit height
            drawHeight = this.height;
            drawWidth = this.height * imgRatio;
            offsetX = (this.width - drawWidth) / 2;
            offsetY = 0;
        }

        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    }
}

export default ScrollSequence;
