"use client";
import { useEffect, useRef } from "react";

// Smooth lerp helper
const lerp = (a, b, t) => a + (b - a) * t;

export default function BlobScene() {
  const containerRef = useRef(null);

  useEffect(() => {
    let cleanup;

    const start = async () => {
      const THREE = await import("three");
      const el = containerRef.current;
      if (!el) return;

      const W = el.clientWidth;
      const H = el.clientHeight;

      /* ── RENDERER ── */
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(W, H);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.6;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      el.appendChild(renderer.domElement);

      const scene  = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(44, W / H, 0.1, 100);
      camera.position.set(0, 0, 6.5);

      /* ── CUBE RENDER TARGET for reflections ── */
      const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
        format: THREE.RGBAFormat, generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter,
      });
      const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget);
      scene.add(cubeCamera);

      /* ── GREEN BLOB ── */
      const blobGeo  = new THREE.SphereGeometry(1.6, 200, 200);
      const origPos  = Float32Array.from(blobGeo.attributes.position.array);

      const blobMat = new THREE.MeshPhysicalMaterial({
        color:              new THREE.Color(0x5DD000),
        emissive:           new THREE.Color(0x1C5000),
        emissiveIntensity:  0.25,
        roughness:          0.06,
        metalness:          0.05,
        clearcoat:          1.0,
        clearcoatRoughness: 0.04,
        envMapIntensity:    1.8,
        envMap:             cubeRenderTarget.texture,
      });
      const blobMesh = new THREE.Mesh(blobGeo, blobMat);
      scene.add(blobMesh);

      /* ── ORGANIC METALLIC ARMS ── */
      const armMat = new THREE.MeshPhysicalMaterial({
        color:              new THREE.Color(0x7088B8),
        metalness:          1.0,
        roughness:          0.03,
        clearcoat:          0.8,
        clearcoatRoughness: 0.02,
        envMapIntensity:    3.5,
        envMap:             cubeRenderTarget.texture,
      });

      const makeArm = (phaseShift, latitudeBias, radius, thickness, tiltX, tiltY) => {
        const pts = [];
        const N   = 150;
        for (let i = 0; i <= N; i++) {
          const t     = i / N;
          const theta = t * Math.PI * 2;
          const wobble = Math.sin(theta * 2 + phaseShift) * 0.55
                       + Math.sin(theta * 3 + phaseShift * 1.3) * 0.15;
          const phi    = Math.PI / 2 + latitudeBias + wobble;
          const r      = radius + Math.sin(theta * 4 + phaseShift) * 0.07;

          pts.push(new THREE.Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.cos(phi),
            r * Math.sin(phi) * Math.sin(theta),
          ));
        }
        const curve  = new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.5);
        const geo    = new THREE.TubeGeometry(curve, 400, thickness, 14, true);
        const mesh   = new THREE.Mesh(geo, armMat);
        mesh.rotation.x = tiltX;
        mesh.rotation.y = tiltY;
        return mesh;
      };

      const arm1 = makeArm(0.0,   0.0,  1.88, 0.060,  0.50,  0.00);
      const arm2 = makeArm(2.09,  0.1,  1.92, 0.048, -0.55,  0.90);
      const arm3 = makeArm(4.19, -0.1,  1.84, 0.054,  0.20, -0.60);
      scene.add(arm1, arm2, arm3);

      /* ── THIN ORBITAL RINGS ── */
      const thinRingMat = new THREE.MeshStandardMaterial({
        color:       new THREE.Color(0xAABBCC),
        metalness:   0.95,
        roughness:   0.05,
        transparent: true,
        opacity:     0.55,
        envMap:      cubeRenderTarget.texture,
      });

      const orbits = [
        { r: 2.30, tube: 0.010, rx:  0.30, ry: 0.10, speed:  0.004  },
        { r: 2.55, tube: 0.007, rx: -0.75, ry: 0.65, speed: -0.003  },
      ];
      const orbitMeshes = orbits.map(({ r, tube, rx, ry }) => {
        const geo  = new THREE.TorusGeometry(r, tube, 8, 400);
        const mesh = new THREE.Mesh(geo, thinRingMat);
        mesh.rotation.set(rx, ry, 0);
        scene.add(mesh);
        return mesh;
      });

      /* ── INNER GLOW ── */
      const glowGeo = new THREE.SphereGeometry(1.55, 32, 32);
      const glowMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0x88FF00), transparent: true, opacity: 0.06, side: THREE.BackSide,
      });
      scene.add(new THREE.Mesh(glowGeo, glowMat));

      /* ── LIGHTING ── */
      scene.add(new THREE.AmbientLight(0xffffff, 0.6));
      const key = new THREE.DirectionalLight(0xffffff, 4.0);
      key.position.set(6, 10, 6);
      scene.add(key);
      const spec = new THREE.PointLight(0xFFFFFF, 8.0, 7);
      spec.position.set(2.5, 3.5, 4.5);
      scene.add(spec);
      const greenFill = new THREE.PointLight(0x88FF10, 5.0, 10);
      greenFill.position.set(-3.5, -1, 3);
      scene.add(greenFill);
      const rim = new THREE.PointLight(0x2255FF, 2.5, 10);
      rim.position.set(4, -3, -2);
      scene.add(rim);
      const silver = new THREE.PointLight(0xCCDDFF, 3.0, 10);
      silver.position.set(-2, 5, 2);
      scene.add(silver);

      /* ── MOUSE TRACKING ── */
      let mouseX = 0, mouseY = 0;   // target (-1 to 1)
      let smoothX = 0, smoothY = 0; // current (lerped)

      const onMouseMove = (e) => {
        mouseX =  (e.clientX / window.innerWidth  - 0.5) * 2;
        mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
      };
      window.addEventListener("mousemove", onMouseMove);

      // Group so we can rotate arms+blob together for mouse parallax
      const group = new THREE.Group();
      group.add(blobMesh, arm1, arm2, arm3);
      // (orbital rings stay in world space for independent rotation)
      scene.add(group);

      /* ── ANIMATION ── */
      let t = 0;
      let animId;
      const pos = blobGeo.attributes.position;

      const tick = () => {
        animId = requestAnimationFrame(tick);
        t += 0.0055;

        for (let i = 0; i < pos.count; i++) {
          const ox = origPos[i * 3], oy = origPos[i * 3 + 1], oz = origPos[i * 3 + 2];
          const len = Math.sqrt(ox * ox + oy * oy + oz * oz);
          const nx = ox / len, ny = oy / len, nz = oz / len;
          const d =
            Math.sin(nx * 3.5 + t * 1.0) * 0.17 +
            Math.sin(ny * 4.0 + t * 0.8) * 0.13 +
            Math.sin(nz * 5.5 + t * 1.5) * 0.10 +
            Math.sin((nx + ny) * 2.5 + t * 0.6) * 0.08 +
            Math.sin((ny + nz) * 3.0 + t * 0.4) * 0.05;
          pos.setXYZ(i, ox + nx * d, oy + ny * d, oz + nz * d);
        }
        pos.needsUpdate = true;
        blobGeo.computeVertexNormals();

        // Smooth mouse follow
        smoothX = lerp(smoothX, mouseX, 0.04);
        smoothY = lerp(smoothY, mouseY, 0.04);

        const blobRotY = t * 0.20;
        const blobRotX = Math.sin(t * 0.28) * 0.10;
        blobMesh.rotation.set(blobRotX, blobRotY, 0);
        [arm1, arm2, arm3].forEach(a => a.rotation.y = blobRotY);

        // Apply mouse parallax to whole group
        group.rotation.y = smoothX * 0.35;
        group.rotation.x = smoothY * 0.25;

        orbitMeshes.forEach((m, i) => {
          m.rotation.z += orbits[i].speed;
          m.rotation.x += 0.0005;
        });

        if (Math.round(t * 1000) % 3 === 0) {
          blobMesh.visible = false;
          cubeCamera.position.copy(blobMesh.position);
          cubeCamera.update(renderer, scene);
          blobMesh.visible = true;
        }

        renderer.render(scene, camera);
      };


      tick();

      const onResize = () => {
        if (!el) return;
        const W2 = el.clientWidth, H2 = el.clientHeight;
        camera.aspect = W2 / H2;
        camera.updateProjectionMatrix();
        renderer.setSize(W2, H2);
      };
      window.addEventListener("resize", onResize);

      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("mousemove", onMouseMove);
        cubeRenderTarget.dispose();
        renderer.dispose();
        if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      };
    };

    start().then(fn => { cleanup = fn; });
    return () => { if (cleanup) cleanup(); };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
    />
  );
}
