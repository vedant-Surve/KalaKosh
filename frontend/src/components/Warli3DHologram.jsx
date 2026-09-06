import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * Warli3DHologram — Renders an interactive 3D spatial AR reconstruction
 * of the Warli Painting with depth, lighting, animated dancers, and floating 3D pins.
 */
export default function Warli3DHologram({
  hotspots = [],
  activeHotspotId,
  onSelectHotspot,
  mode = "hologram", // "hologram" | "relief" | "animated"
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const dancersGroupRef = useRef(null);
  const sunGroupRef = useRef(null);
  const treeGroupRef = useRef(null);
  const particlesRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // Mouse drag / touch state for 3D rotation
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0.15, y: -0.1 });
  const zoomRef = useRef(75);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, zoomRef.current);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xfff3e0, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff8e7, 2.5);
    dirLight.position.set(20, 30, 40);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xd4a017, 3, 100);
    pointLight.position.set(20, 15, 10);
    scene.add(pointLight);

    const rimLight = new THREE.DirectionalLight(0xc0522b, 1.8);
    rimLight.position.set(-30, -20, -10);
    scene.add(rimLight);

    // 5. 3D Earthen Base Canvas (Bas-Relief Mud Wall)
    const wallGeo = new THREE.BoxGeometry(60, 45, 1.5);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x732814,
      roughness: 0.85,
      metalness: 0.1,
      transparent: true,
      opacity: mode === "hologram" ? 0.45 : 0.95,
    });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.receiveShadow = true;
    scene.add(wall);

    // Outer decorative border
    const borderMat = new THREE.MeshStandardMaterial({
      color: 0xfdf6e3,
      roughness: 0.3,
      emissive: 0x3d1a08,
    });
    const borderGeo = new THREE.BoxGeometry(62, 47, 0.5);
    const borderWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(borderGeo),
      new THREE.LineBasicMaterial({ color: 0xfdf6e3, linewidth: 2 })
    );
    scene.add(borderWire);

    // Material for Warli Rice-Paste 3D Figures
    const riceMat = new THREE.MeshStandardMaterial({
      color: 0xfffaed,
      roughness: 0.25,
      metalness: 0.2,
      emissive: 0x221105,
    });

    const activeRiceMat = new THREE.MeshStandardMaterial({
      color: 0xffe082,
      roughness: 0.1,
      metalness: 0.4,
      emissive: 0x8d3b1b,
    });

    // ── 6. 3D MAHADEV TREE OF LIFE (Center) ──────────────────────
    const treeGroup = new THREE.Group();
    treeGroup.position.set(5, 5, 1);
    treeGroupRef.current = treeGroup;

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.6, 1.2, 22, 16);
    const trunk = new THREE.Mesh(trunkGeo, riceMat);
    trunk.position.set(0, 0, 0.8);
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Tiered Conical/Triangular Foliage Layers
    const layers = [
      { radius: 10, height: 7, y: 11 },
      { radius: 8, height: 6, y: 8 },
      { radius: 6, height: 5, y: 5 },
      { radius: 4, height: 4, y: 2 },
    ];
    layers.forEach((l) => {
      const coneGeo = new THREE.ConeGeometry(l.radius, l.height, 4);
      const cone = new THREE.Mesh(coneGeo, riceMat);
      cone.position.set(0, l.y, 1.5);
      cone.rotation.y = Math.PI / 4;
      cone.castShadow = true;
      treeGroup.add(cone);
    });

    // Sacred Hanging Leaves & Perched Birds
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const dist = 5 + (i % 3) * 2;
      const birdGeo = new THREE.TetrahedronGeometry(0.8);
      const bird = new THREE.Mesh(birdGeo, riceMat);
      bird.position.set(
        Math.cos(angle) * dist,
        4 + (i % 4) * 2,
        2.5 + Math.sin(angle) * 1.5
      );
      treeGroup.add(bird);
    }
    scene.add(treeGroup);

    // ── 7. 3D CELESTIAL SURYA SUN (Top Right) ────────────────────
    const sunGroup = new THREE.Group();
    sunGroup.position.set(20, 14, 2);
    sunGroupRef.current = sunGroup;

    const sunDiscGeo = new THREE.CylinderGeometry(3.5, 3.5, 1, 32);
    const sunMat = new THREE.MeshStandardMaterial({
      color: 0xffd54f,
      emissive: 0xff8f00,
      emissiveIntensity: 0.6,
      roughness: 0.2,
    });
    const sunDisc = new THREE.Mesh(sunDiscGeo, sunMat);
    sunDisc.rotation.x = Math.PI / 2;
    sunGroup.add(sunDisc);

    // Radiating 3D Sun Rays
    for (let r = 0; r < 16; r++) {
      const rayAngle = (r / 16) * Math.PI * 2;
      const rayGeo = new THREE.ConeGeometry(0.5, 3.2, 4);
      const ray = new THREE.Mesh(rayGeo, riceMat);
      ray.position.set(Math.cos(rayAngle) * 5.2, Math.sin(rayAngle) * 5.2, 0.5);
      ray.rotation.z = rayAngle - Math.PI / 2;
      sunGroup.add(ray);
    }
    scene.add(sunGroup);

    // ── 8. 3D TARPA DANCE CIRCLE & SPIRAL (Center-Left) ──────────
    const dancersGroup = new THREE.Group();
    dancersGroup.position.set(-14, -6, 2);
    dancersGroupRef.current = dancersGroup;

    // Center Tarpa Horn Player
    const playerGroup = new THREE.Group();
    playerGroup.position.set(0, 0, 0);

    // Body (Dual inverted 3D triangular pyramids)
    const upperBodyGeo = new THREE.ConeGeometry(1.2, 2.2, 3);
    const upperBody = new THREE.Mesh(upperBodyGeo, activeRiceMat);
    upperBody.rotation.x = Math.PI;
    upperBody.position.y = 1.1;

    const lowerBodyGeo = new THREE.ConeGeometry(1.2, 2.2, 3);
    const lowerBody = new THREE.Mesh(lowerBodyGeo, activeRiceMat);
    lowerBody.position.y = -1.1;

    const headGeo = new THREE.SphereGeometry(0.7, 16, 16);
    const head = new THREE.Mesh(headGeo, activeRiceMat);
    head.position.y = 2.8;

    // Tarpa horn instrument
    const hornGeo = new THREE.CylinderGeometry(0.2, 1.4, 6, 16);
    const horn = new THREE.Mesh(hornGeo, activeRiceMat);
    horn.rotation.z = -Math.PI / 3;
    horn.position.set(-2, 1.5, 1);

    playerGroup.add(upperBody);
    playerGroup.add(lowerBody);
    playerGroup.add(head);
    playerGroup.add(horn);
    dancersGroup.add(playerGroup);

    // Dual Concentric Rings of 3D Warli Dancers
    const createDancer = (x, y, angle) => {
      const d = new THREE.Group();
      d.position.set(x, y, 0);

      const uBody = new THREE.Mesh(upperBodyGeo, riceMat);
      uBody.rotation.x = Math.PI;
      uBody.position.y = 0.9;
      uBody.scale.set(0.8, 0.8, 0.8);

      const lBody = new THREE.Mesh(lowerBodyGeo, riceMat);
      lBody.position.y = -0.9;
      lBody.scale.set(0.8, 0.8, 0.8);

      const dHead = new THREE.Mesh(headGeo, riceMat);
      dHead.position.y = 2.2;
      dHead.scale.set(0.8, 0.8, 0.8);

      d.add(uBody);
      d.add(lBody);
      d.add(dHead);
      d.rotation.z = angle + Math.PI / 2;
      return d;
    };

    // Inner Ring (radius 6.5, 10 dancers)
    const ring1 = new THREE.Group();
    for (let i = 0; i < 10; i++) {
      const theta = (i / 10) * Math.PI * 2;
      ring1.add(createDancer(Math.cos(theta) * 6.5, Math.sin(theta) * 6.5, theta));
    }
    dancersGroup.add(ring1);

    // Outer Ring (radius 11.5, 18 dancers)
    const ring2 = new THREE.Group();
    for (let j = 0; j < 18; j++) {
      const theta = (j / 18) * Math.PI * 2;
      ring2.add(createDancer(Math.cos(theta) * 11.5, Math.sin(theta) * 11.5, theta));
    }
    dancersGroup.add(ring2);
    scene.add(dancersGroup);

    // ── 9. FLOATING 3D AR HOTSPOT PINS ───────────────────────────
    const hotspotPins = [];
    const pinGeo = new THREE.SphereGeometry(1.2, 24, 24);
    const ringPinGeo = new THREE.TorusGeometry(1.8, 0.2, 16, 32);

    // Approximate mapping of 2D coordinates (0-100%) to 3D Scene space
    hotspots.forEach((h) => {
      const posX = (h.x_coordinate / 100 - 0.5) * 56;
      const posY = -(h.y_coordinate / 100 - 0.5) * 40;
      const posZ = 5;

      const pinGroup = new THREE.Group();
      pinGroup.position.set(posX, posY, posZ);
      pinGroup.userData = { hotspot: h };

      const isActive = h.id === activeHotspotId;
      const pinMat = new THREE.MeshStandardMaterial({
        color: isActive ? 0xff5722 : 0xd4a017,
        emissive: isActive ? 0xff5722 : 0xd4a017,
        emissiveIntensity: 0.8,
        metalness: 0.5,
      });

      const sphere = new THREE.Mesh(pinGeo, pinMat);
      const ring = new THREE.Mesh(ringPinGeo, pinMat);
      ring.rotation.x = Math.PI / 3;

      pinGroup.add(sphere);
      pinGroup.add(ring);
      scene.add(pinGroup);
      hotspotPins.push(pinGroup);
    });

    // ── 10. CELESTIAL SHIMMER PARTICLES ──────────────────────────
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let p = 0; p < particleCount * 3; p += 3) {
      particlePos[p] = (Math.random() - 0.5) * 70;
      particlePos[p + 1] = (Math.random() - 0.5) * 50;
      particlePos[p + 2] = Math.random() * 20;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xffe082,
      size: 0.8,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    particlesRef.current = particles;
    scene.add(particles);

    // ── 11. ANIMATION LOOP ───────────────────────────────────────
    let clock = new THREE.Clock();
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Rotate 3D Tarpa Dancers
      if (dancersGroupRef.current) {
        ring1.rotation.z = elapsedTime * 0.4;
        ring2.rotation.z = -elapsedTime * 0.25;
      }

      // Rotate 3D Sun
      if (sunGroupRef.current) {
        sunGroupRef.current.rotation.z = elapsedTime * 0.15;
      }

      // Gentle wave on 3D Tree
      if (treeGroupRef.current) {
        treeGroupRef.current.rotation.z = Math.sin(elapsedTime * 1.5) * 0.02;
      }

      // Animate floating Hotspot Pins (gentle bobbing & pulsing)
      hotspotPins.forEach((pin, idx) => {
        pin.position.z = 4.5 + Math.sin(elapsedTime * 3 + idx) * 0.8;
        pin.children[1].rotation.z = elapsedTime * 2;
      });

      // Shimmer particles drift
      if (particlesRef.current) {
        particlesRef.current.rotation.y = elapsedTime * 0.03;
      }

      // Smoothly apply manual 3D rotation from touch/mouse
      scene.rotation.x = THREE.MathUtils.lerp(scene.rotation.x, rotationRef.current.x, 0.1);
      scene.rotation.y = THREE.MathUtils.lerp(scene.rotation.y, rotationRef.current.y, 0.1);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, zoomRef.current, 0.1);

      renderer.render(scene, camera);
    };
    animate();

    // ── 12. MOUSE / TOUCH INTERACTION HANDLERS ───────────────────
    const onMouseDown = (e) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      rotationRef.current.y += deltaX * 0.008;
      rotationRef.current.x += deltaY * 0.008;
      // Clamp tilt
      rotationRef.current.x = Math.max(-0.6, Math.min(0.6, rotationRef.current.x));

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = (e) => {
      isDraggingRef.current = false;

      // Click detection for 3D Hotspot Pins
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(
        hotspotPins.map((p) => p.children[0])
      );

      if (intersects.length > 0) {
        const parentPin = intersects[0].object.parent;
        if (parentPin?.userData?.hotspot) {
          onSelectHotspot(parentPin.userData.hotspot);
        }
      }
    };

    const onWheel = (e) => {
      e.preventDefault();
      zoomRef.current += e.deltaY * 0.05;
      zoomRef.current = Math.max(40, Math.min(110, zoomRef.current));
    };

    // Touch support for mobile devices
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        previousMousePositionRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    };

    const onTouchMove = (e) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePositionRef.current.x;
      const deltaY = e.touches[0].clientY - previousMousePositionRef.current.y;

      rotationRef.current.y += deltaX * 0.01;
      rotationRef.current.x += deltaY * 0.01;
      rotationRef.current.x = Math.max(-0.6, Math.min(0.6, rotationRef.current.x));

      previousMousePositionRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    // Resize handler
    const onResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    container.addEventListener("wheel", onWheel, { passive: false });
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
    };
  }, [hotspots, activeHotspotId, mode]);

  return (
    <div className="relative w-full h-full cursor-grab active:cursor-grabbing select-none">
      <div ref={mountRef} className="w-full h-full" />

      {/* Interactive 3D Control Hints Overlay */}
      <div className="absolute bottom-3 left-3 bg-earth-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 text-[10px] font-mono text-white flex items-center gap-2 pointer-events-none shadow-lg">
        <span className="text-amber-400 font-bold">✨ 3D SPATIAL AR</span>
        <span className="text-white/60">|</span>
        <span>Drag to rotate 3D view • Pinch/Scroll to Zoom • Tap 3D Pins</span>
      </div>
    </div>
  );
}
