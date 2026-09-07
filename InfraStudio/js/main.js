/* InfraStudio — interaction & animation layer (vanilla JS, no build step) */

(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------- Footer year ---------------------------------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------- Nav scroll state ---------------------------------- */
  const nav = document.getElementById("nav");
  const onScroll = () => {
    if (window.scrollY > 8) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------------------------------- Mobile nav ---------------------------------- */
  const navToggle = document.getElementById("navToggle");
  const navMobile = document.getElementById("navMobile");
  if (navToggle && navMobile) {
    navToggle.addEventListener("click", () => {
      const open = navMobile.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
    navMobile.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        navMobile.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  /* ---------------------------------- Reveal on scroll ---------------------------------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in-view"));
  }

  /* ---------------------------------- Architecture diagram — lit pipeline ---------------------------------- */
  const archNodes = document.querySelectorAll(".arch-node");
  if (archNodes.length && "IntersectionObserver" in window) {
    const archIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("lit");
        });
      },
      { threshold: 0.5 }
    );
    archNodes.forEach((n) => archIO.observe(n));
  } else {
    archNodes.forEach((n) => n.classList.add("lit"));
  }

  /* ---------------------------------- Demo log sequencer ---------------------------------- */
  const demoLogItems = document.querySelectorAll("#demoLog li");
  const demoSection = document.getElementById("how-it-works");
  let demoStarted = false;
  let demoBuildStep = 0;
  const demoBuildTarget = { step: 0 };

  function runDemoSequence() {
    if (demoStarted) return;
    demoStarted = true;
    let i = 0;
    const total = demoLogItems.length;
    const tick = () => {
      demoLogItems.forEach((li, idx) => {
        li.classList.toggle("active", idx === i);
        li.classList.toggle("done", idx < i);
      });
      demoBuildTarget.step = i;
      i++;
      if (i <= total) {
        setTimeout(tick, 950);
      } else {
        // loop the whole sequence softly after a pause
        setTimeout(() => {
          demoLogItems.forEach((li) => li.classList.remove("active", "done"));
          i = 0;
          demoBuildTarget.step = 0;
          tick();
        }, 2600);
      }
    };
    tick();
  }

  if (demoSection && "IntersectionObserver" in window) {
    const demoIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) runDemoSequence();
        });
      },
      { threshold: 0.4 }
    );
    demoIO.observe(demoSection);
  } else {
    runDemoSequence();
  }

  /* ---------------------------------- Waitlist modal ---------------------------------- */
  const overlay = document.getElementById("waitlistOverlay");
  const openTriggers = document.querySelectorAll("[data-open-waitlist]");
  const closeBtn = document.getElementById("modalClose");
  const doneBtn = document.getElementById("modalDone");
  const formWrap = document.getElementById("modalForm");
  const successWrap = document.getElementById("modalSuccess");
  const form = document.getElementById("waitlistForm");

  function openModal() {
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
    formWrap.hidden = false;
    successWrap.hidden = true;
    const firstInput = form.querySelector("input[name='name']");
    if (firstInput) setTimeout(() => firstInput.focus(), 300);
  }
  function closeModal() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  openTriggers.forEach((btn) => btn.addEventListener("click", openModal));
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (doneBtn) doneBtn.addEventListener("click", closeModal);
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) closeModal();
  });

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const entry = {
        name: (data.get("name") || "").toString().trim(),
        email: (data.get("email") || "").toString().trim(),
        profession: (data.get("profession") || "").toString().trim(),
        notes: (data.get("notes") || "").toString().trim(),
        submittedAt: new Date().toISOString(),
      };

      let valid = true;
      form.querySelectorAll("input[required]").forEach((input) => {
        input.classList.add("touched");
        if (!input.checkValidity()) valid = false;
      });
      if (!valid) return;

      // Persist locally (no backend wired up yet — this is a static prototype form).
      try {
        const key = "infrastudio_waitlist";
        const existing = JSON.parse(localStorage.getItem(key) || "[]");
        existing.push(entry);
        localStorage.setItem(key, JSON.stringify(existing));
      } catch (err) {
        /* localStorage unavailable — fail silently, still show success */
      }

      formWrap.hidden = true;
      successWrap.hidden = false;
      form.reset();
      form.querySelectorAll(".touched").forEach((el) => el.classList.remove("touched"));
    });
  }

  /* ==========================================================================
     3D scenes (Three.js). Loaded lazily & only if the library is available —
     the page degrades gracefully to a static SVG fallback otherwise.
     ========================================================================== */

  function buildWireframeHouse(THREE, group, opts = {}) {
    const accent = 0x2f6fed;
    const lineColor = opts.dark ? 0x3a3d45 : 0xbfbdb4;
    const solidColor = opts.dark ? 0x17181b : 0xf2f1ed;

    const floors = 2;
    const floorHeight = 1;
    const width = 2.6;
    const depth = 2;

    // Base slab
    const slabGeo = new THREE.BoxGeometry(width + 0.3, 0.06, depth + 0.3);
    const slabMat = new THREE.MeshBasicMaterial({ color: solidColor, transparent: true, opacity: 0.5 });
    const slab = new THREE.Mesh(slabGeo, slabMat);
    slab.position.y = -0.03;
    group.add(slab);

    const edgesMat = new THREE.LineBasicMaterial({ color: lineColor, transparent: true, opacity: 0.85 });
    const accentMat = new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.95 });

    for (let f = 0; f < floors; f++) {
      const y = f * floorHeight + floorHeight / 2;
      const boxGeo = new THREE.BoxGeometry(width, floorHeight * 0.92, depth);
      const solid = new THREE.Mesh(
        boxGeo,
        new THREE.MeshBasicMaterial({ color: solidColor, transparent: true, opacity: 0.06 })
      );
      solid.position.y = y;
      group.add(solid);

      const edges = new THREE.EdgesGeometry(boxGeo);
      const wire = new THREE.LineSegments(edges, f === floors - 1 ? accentMat : edgesMat);
      wire.position.y = y;
      group.add(wire);

      // window mullions on front face
      const winGeo = new THREE.PlaneGeometry(0.32, 0.4);
      const winEdges = new THREE.EdgesGeometry(winGeo);
      const cols = 3;
      for (let c = 0; c < cols; c++) {
        const winWire = new THREE.LineSegments(winEdges, edgesMat);
        winWire.position.set(-width / 2 + 0.5 + c * 0.85, y, depth / 2 + 0.001);
        group.add(winWire);
        const winWireBack = winWire.clone();
        winWireBack.position.z = -depth / 2 - 0.001;
        winWireBack.rotation.y = Math.PI;
        group.add(winWireBack);
      }
    }

    // Roof (simple pitched wire)
    const roofGeo = new THREE.ConeGeometry(Math.max(width, depth) * 0.78, 0.6, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roofEdges = new THREE.EdgesGeometry(roofGeo);
    const roof = new THREE.LineSegments(roofEdges, accentMat);
    roof.position.y = floors * floorHeight + 0.3;
    group.add(roof);

    // Central staircase hint — vertical accent line
    const stairGeo = new THREE.BoxGeometry(0.5, floors * floorHeight, 0.5);
    const stairEdges = new THREE.EdgesGeometry(stairGeo);
    const stair = new THREE.LineSegments(stairEdges, accentMat);
    stair.position.set(0, (floors * floorHeight) / 2, 0);
    group.add(stair);

    return group;
  }

  function initHeroScene(THREE) {
    const canvas = document.getElementById("heroCanvas");
    if (!canvas) return;
    const frame = canvas.parentElement;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(4.2, 3.1, 5.2);
    camera.lookAt(0, 0.9, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const group = new THREE.Group();
    buildWireframeHouse(THREE, group, { dark: false });
    group.position.y = -0.9;
    scene.add(group);

    function resize() {
      const w = frame.clientWidth;
      const h = frame.clientHeight - 41;
      renderer.setSize(w, Math.max(h, 10), false);
      camera.aspect = w / Math.max(h, 10);
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    let raf;
    function animate(t) {
      raf = requestAnimationFrame(animate);
      if (!prefersReducedMotion) {
        group.rotation.y = t * 0.00022;
        group.position.y = -0.9 + Math.sin(t * 0.0006) * 0.04;
      }
      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(animate);

    // Pause when off-screen to save cycles
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            cancelAnimationFrame(raf);
          } else if (!raf) {
            raf = requestAnimationFrame(animate);
          }
        });
      });
      io.observe(canvas);
    }
  }

  function initDemoScene(THREE) {
    const canvas = document.getElementById("demoCanvas");
    if (!canvas) return;
    const frame = canvas.parentElement;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(3.6, 2.6, 4.4);
    camera.lookAt(0, 0.7, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const group = new THREE.Group();
    buildWireframeHouse(THREE, group, { dark: false });
    group.position.y = -0.9;
    scene.add(group);

    // Track children so we can progressively reveal them in step with the log
    const parts = group.children.slice();
    parts.forEach((p) => (p.visible = false));

    function applyStepVisibility(step) {
      // Roughly map 6 log steps -> progressive reveal of the ~part count
      const total = parts.length;
      const ratio = Math.min((step + 1) / 6, 1);
      const visibleCount = Math.ceil(total * ratio);
      parts.forEach((p, idx) => (p.visible = idx < visibleCount));
    }

    function resize() {
      const w = frame.clientWidth;
      const h = frame.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(h, 10);
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    let raf;
    function animate(t) {
      raf = requestAnimationFrame(animate);
      if (!prefersReducedMotion) group.rotation.y = t * 0.00018;
      applyStepVisibility(demoBuildTarget.step);
      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(animate);

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) cancelAnimationFrame(raf);
          else if (!raf) raf = requestAnimationFrame(animate);
        });
      });
      io.observe(canvas);
    }
  }

  function loadThree(cb) {
    if (window.THREE) return cb(window.THREE);
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.async = true;
    script.onload = () => cb(window.THREE);
    script.onerror = () => {
      /* 3D is a progressive enhancement — the HUD + static frame still communicate the product */
    };
    document.head.appendChild(script);
  }

  // Only load the (moderately heavy) 3D library once the hero is near view,
  // keeping initial page load fast.
  const heroCanvas = document.getElementById("heroCanvas");
  if (heroCanvas) {
    loadThree((THREE) => {
      if (!THREE) return;
      initHeroScene(THREE);
      initDemoScene(THREE);
    });
  }
})();
