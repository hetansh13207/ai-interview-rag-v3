(() => {
    const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!hasFinePointer || prefersReducedMotion) {
        return;
    }

    const trailLength = 8;
    const pixelSpacing = 7;
    const trailLifetime = 420;
    const fadeInDuration = 45;
    const trailLayer = document.createElement("div");
    trailLayer.className = "background-pixel-trail";
    trailLayer.setAttribute("aria-hidden", "true");

    const pixels = Array.from({ length: trailLength }, () => {
        const pixel = document.createElement("span");
        pixel.className = "background-pixel";
        trailLayer.appendChild(pixel);
        return pixel;
    });

    document.body.appendChild(trailLayer);

    const samples = [];
    let previousPoint = null;
    let distanceRemainder = 0;
    let animationFrame = 0;

    function renderTrail(now) {
        animationFrame = 0;

        while (samples.length && now - samples[0].createdAt >= trailLifetime) {
            samples.shift();
        }

        pixels.forEach((pixel, index) => {
            const sample = samples[index];
            if (!sample) {
                pixel.style.opacity = "0";
                pixel.classList.remove("is-newest");
                return;
            }

            const age = now - sample.createdAt;
            const fadeIn = Math.min(1, age / fadeInDuration);
            const fadeOut = Math.pow(Math.max(0, 1 - age / trailLifetime), 1.35);
            const recency = (index + 1) / samples.length;
            const brightness = 0.18 + recency * 0.72;

            pixel.style.transform = `translate3d(${sample.x - 3.5}px, ${sample.y - 3.5}px, 0)`;
            pixel.style.opacity = (brightness * fadeIn * fadeOut).toFixed(3);
            pixel.classList.toggle("is-newest", index === samples.length - 1);
        });

        if (samples.length) {
            animationFrame = window.requestAnimationFrame(renderTrail);
        }
    }

    function scheduleTrailFrame() {
        if (!animationFrame) {
            animationFrame = window.requestAnimationFrame(renderTrail);
        }
    }

    function addSample(x, y, createdAt) {
        const gridX = Math.round(x / pixelSpacing) * pixelSpacing;
        const gridY = Math.round(y / pixelSpacing) * pixelSpacing;
        const lastSample = samples[samples.length - 1];

        if (lastSample && lastSample.x === gridX && lastSample.y === gridY) {
            return;
        }

        samples.push({ x: gridX, y: gridY, createdAt });
        if (samples.length > trailLength) {
            samples.shift();
        }

        scheduleTrailFrame();
    }

    window.addEventListener("pointermove", event => {
        if (event.pointerType === "touch") {
            return;
        }

        const currentPoint = { x: event.clientX, y: event.clientY };
        if (!previousPoint) {
            previousPoint = currentPoint;
            distanceRemainder = 0;
            return;
        }

        const deltaX = currentPoint.x - previousPoint.x;
        const deltaY = currentPoint.y - previousPoint.y;
        const segmentLength = Math.hypot(deltaX, deltaY);

        if (segmentLength === 0) {
            return;
        }

        let distanceAlongSegment = pixelSpacing - distanceRemainder;
        while (distanceAlongSegment <= segmentLength) {
            const progress = distanceAlongSegment / segmentLength;
            addSample(
                previousPoint.x + deltaX * progress,
                previousPoint.y + deltaY * progress,
                performance.now()
            );
            distanceAlongSegment += pixelSpacing;
        }

        distanceRemainder = (distanceRemainder + segmentLength) % pixelSpacing;
        previousPoint = currentPoint;
    }, { passive: true });

    function resetPointerPath() {
        previousPoint = null;
        distanceRemainder = 0;
    }

    window.addEventListener("blur", resetPointerPath);
    document.documentElement.addEventListener("pointerleave", resetPointerPath);
})();
