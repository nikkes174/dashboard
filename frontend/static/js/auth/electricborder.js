// electricborder.js — HTML версия ElectricBorder без React

function initElectricBorder(root, options = {}) {
    if (!root) return;

    const {
        color = "#5227FF",
        speed = 1,
        chaos = 1,
        thickness = 2
    } = options;

    root.style.setProperty("--electric-border-color", color);
    root.style.setProperty("--eb-border-width", `${thickness}px`);

    // Создаём SVG фильтр
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("eb-svg");
    svg.setAttribute("aria-hidden", "true");

    const filterId = "eb-filter-" + Math.random().toString(36).slice(2);

    svg.innerHTML = `
        <defs>
            <filter id="${filterId}" color-interpolation-filters="sRGB" x="-200%" y="-200%" width="500%" height="500%">
                <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="1"></feTurbulence>
                <feOffset in="noise1" dx="0" dy="0" result="offsetNoise1">
                    <animate attributeName="dy" values="700; 0" dur="6s" repeatCount="indefinite" />
                </feOffset>

                <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="1"></feTurbulence>
                <feOffset in="noise2" dx="0" dy="0" result="offsetNoise2">
                    <animate attributeName="dy" values="0; -700" dur="6s" repeatCount="indefinite" />
                </feOffset>

                <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise3" seed="2"></feTurbulence>
                <feOffset in="noise3" dx="0" dy="0" result="offsetNoise3">
                    <animate attributeName="dx" values="490; 0" dur="6s" repeatCount="indefinite" />
                </feOffset>

                <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise4" seed="2"></feTurbulence>
                <feOffset in="noise4" dx="0" dy="0" result="offsetNoise4">
                    <animate attributeName="dx" values="0; -490" dur="6s" repeatCount="indefinite" />
                </feOffset>

                <feComposite in="offsetNoise1" in2="offsetNoise2" result="part1"></feComposite>
                <feComposite in="offsetNoise3" in2="offsetNoise4" result="part2"></feComposite>

                <feBlend in="part1" in2="part2" mode="color-dodge" result="combinedNoise"></feBlend>

                <feDisplacementMap
                    in="SourceGraphic"
                    in2="combinedNoise"
                    scale="${30 * chaos}"
                    xChannelSelector="R"
                    yChannelSelector="B">
                </feDisplacementMap>
            </filter>
        </defs>
    `;

    root.appendChild(svg);

    // Create LAYERS
    const layers = document.createElement("div");
    layers.className = "eb-layers";
    layers.innerHTML = `
        <div class="eb-stroke"></div>
        <div class="eb-glow-1"></div>
        <div class="eb-glow-2"></div>
        <div class="eb-background-glow"></div>
    `;
    root.appendChild(layers);

    // Apply filter
    layers.querySelector(".eb-stroke").style.filter = `url(#${filterId})`;

    // Resize animation for offsets
    function updateAnim() {
        const w = root.clientWidth;
        const h = root.clientHeight;

        const dyAnims = svg.querySelectorAll('animate[attributeName="dy"]');
        const dxAnims = svg.querySelectorAll('animate[attributeName="dx"]');

        if (dyAnims.length >= 2) {
            dyAnims[0].setAttribute("values", `${h}; 0`);
            dyAnims[1].setAttribute("values", `0; -${h}`);
        }
        if (dxAnims.length >= 2) {
            dxAnims[0].setAttribute("values", `${w}; 0`);
            dxAnims[1].setAttribute("values", `0; -${w}`);
        }

        const duration = 6 / speed;
        [...dyAnims, ...dxAnims].forEach(a => a.setAttribute("dur", `${duration}s`));
    }

    updateAnim();
    new ResizeObserver(updateAnim).observe(root);
}
