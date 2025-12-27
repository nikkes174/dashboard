// laserflow.js
// Теперь корректный ES-модуль. Требует shader.js (VERT, FRAG)

import { VERT, FRAG } from "/static/js/auth/shader.js";

export function initLaserFlow(container, options = {}) {
    const {
        wispDensity = 1,
        dpr = window.devicePixelRatio || 1,
        mouseSmoothTime = 0.0,
        mouseTiltStrength = 0.01,
        horizontalBeamOffset = 0.01,
        verticalBeamOffset = -0.13,
        flowSpeed = 4,
        verticalSizing = 2.0,
        horizontalSizing = 0.5,
        fogIntensity = 0.45,
        fogScale = 0.3,
        wispSpeed = 15.0,
        wispIntensity = 5.0,
        flowStrength = 0.25,
        decay = 1.1,
        falloffStart = 1.2,
        fogFallSpeed = 0.6,
        color = "#FF79C6"
    } = options;

    // WebGL renderer
    let renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: false,
        depth: false,
        stencil: false,
        powerPreference: "high-performance",
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        logarithmicDepthBuffer: false
    });

    container.appendChild(renderer.domElement);
    renderer.setClearColor(0x000000, 1);

    let baseDpr = Math.min(dpr, 2);
    let currentDpr = baseDpr;

    renderer.setPixelRatio(currentDpr);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3)
    );

    function hexToRGB(hex) {
        let c = hex.trim().replace("#", "");
        if (c.length === 3) c = c.split("").map(x => x + x).join("");
        const n = parseInt(c, 16) || 0xffffff;
        return {
            r: ((n >> 16) & 255) / 255,
            g: ((n >> 8) & 255) / 255,
            b: (n & 255) / 255
        };
    }

    const uniforms = {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector3(1, 1, 1) },
        iMouse: { value: new THREE.Vector4(0, 0, 0, 0) },

        uWispDensity: { value: wispDensity },
        uTiltScale: { value: mouseTiltStrength },
        uFlowTime: { value: 0 },
        uFogTime: { value: 0 },
        uBeamXFrac: { value: horizontalBeamOffset },
        uBeamYFrac: { value: verticalBeamOffset },

        uFlowSpeed: { value: flowSpeed },
        uVLenFactor: { value: verticalSizing },
        uHLenFactor: { value: horizontalSizing },

        uFogIntensity: { value: fogIntensity },
        uFogScale: { value: fogScale },

        uWSpeed: { value: wispSpeed },
        uWIntensity: { value: wispIntensity },
        uFlowStrength: { value: flowStrength },

        uDecay: { value: decay },
        uFalloffStart: { value: falloffStart },
        uFogFallSpeed: { value: fogFallSpeed },

        uColor: { value: new THREE.Vector3(1, 1, 1) },
        uFade: { value: 0 }
    };

    const rgb = hexToRGB(color);
    uniforms.uColor.value.set(rgb.r, rgb.g, rgb.b);

    const material = new THREE.RawShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms,
        transparent: false,
        depthTest: false,
        depthWrite: false
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    scene.add(mesh);

    const canvas = renderer.domElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";

    let rect = null;

    const setSize = () => {
        const w = container.clientWidth || 1;
        const h = container.clientHeight || 1;

        renderer.setPixelRatio(currentDpr);
        renderer.setSize(w, h, false);

        uniforms.iResolution.value.set(w * currentDpr, h * currentDpr, currentDpr);
        rect = canvas.getBoundingClientRect();
    };

    setSize();
    new ResizeObserver(setSize).observe(container);

    const clock = new THREE.Clock();
    let paused = false;
    let inView = true;

    const io = new IntersectionObserver(
        (entries) => (inView = entries[0].isIntersecting),
        { threshold: 0 }
    );
    io.observe(container);

    document.addEventListener("visibilitychange", () => {
        paused = document.hidden;
    });

    // Mouse tracking
    const mouseTarget = new THREE.Vector2(0, 0);
    const mouseSmooth = new THREE.Vector2(0, 0);

    function updateMouse(ev) {
        if (!rect) return;
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;
        mouseTarget.set(x * currentDpr, rect.height * currentDpr - y * currentDpr);
    }

    canvas.addEventListener("pointermove", updateMouse);
    canvas.addEventListener("pointerdown", updateMouse);
    canvas.addEventListener("pointerenter", updateMouse);
    canvas.addEventListener("pointerleave", () => mouseTarget.set(0, 0));

    let fade = 0;

    function animate() {
        requestAnimationFrame(animate);

        if (paused || !inView) return;

        const t = clock.getElapsedTime();
        uniforms.iTime.value = t;

        const cdt = Math.min(0.033, Math.max(0.001, clock.getDelta()));

        uniforms.uFlowTime.value += cdt;
        uniforms.uFogTime.value += cdt;

        fade = Math.min(1, fade + cdt * 7.0);
        uniforms.uFade.value = fade;

        const tau = Math.max(0.0001, mouseSmoothTime);
        const alpha = 1 - Math.exp(-cdt / tau);
        mouseSmooth.lerp(mouseTarget, alpha);
        uniforms.iMouse.value.set(mouseSmooth.x, mouseSmooth.y, 0, 0);

        renderer.render(scene, camera);
    }

    animate();

    return {
        destroy() {
            renderer.dispose();
            geometry.dispose();
            material.dispose();
            container.removeChild(canvas);
        }
    };
}
