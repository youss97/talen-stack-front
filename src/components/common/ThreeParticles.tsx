"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Props {
  color?: string;
  count?: number;
  opacity?: number;
  className?: string;
}

export default function ThreeParticles({
  color = "#8AB925",
  count = 55,
  opacity = 0.6,
  className = "",
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth || 800;
    const H = mount.clientHeight || 600;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, W / H, 0.1, 1000);
    camera.position.z = 28;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const col = new THREE.Color(color);

    // Particles
    const positions: THREE.Vector3[] = [];
    const velocities: THREE.Vector3[] = [];
    const posArr = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 55;
      const y = (Math.random() - 0.5) * 38;
      const z = (Math.random() - 0.5) * 8;
      positions.push(new THREE.Vector3(x, y, z));
      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.025,
          (Math.random() - 0.5) * 0.025,
          0
        )
      );
      posArr[i * 3] = x;
      posArr[i * 3 + 1] = y;
      posArr[i * 3 + 2] = z;
    }

    const ptGeo = new THREE.BufferGeometry();
    ptGeo.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
    const ptMat = new THREE.PointsMaterial({ color: col, size: 0.45, transparent: true, opacity });
    const points = new THREE.Points(ptGeo, ptMat);
    scene.add(points);

    const lineMat = new THREE.LineBasicMaterial({
      color: col,
      transparent: true,
      opacity: opacity * 0.25,
    });
    let linesMesh: THREE.LineSegments | null = null;

    let frame = 0;
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      frame++;

      const pos = ptGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        positions[i].add(velocities[i]);
        if (Math.abs(positions[i].x) > 27) velocities[i].x *= -1;
        if (Math.abs(positions[i].y) > 19) velocities[i].y *= -1;
        pos[i * 3] = positions[i].x;
        pos[i * 3 + 1] = positions[i].y;
        pos[i * 3 + 2] = positions[i].z;
      }
      ptGeo.attributes.position.needsUpdate = true;

      // Rebuild lines every 2 frames for performance
      if (frame % 2 === 0) {
        const linePos: number[] = [];
        const maxD = 11;
        for (let i = 0; i < count; i++) {
          for (let j = i + 1; j < count; j++) {
            if (positions[i].distanceTo(positions[j]) < maxD) {
              linePos.push(
                positions[i].x, positions[i].y, positions[i].z,
                positions[j].x, positions[j].y, positions[j].z
              );
            }
          }
        }
        if (linesMesh) { scene.remove(linesMesh); linesMesh.geometry.dispose(); }
        if (linePos.length) {
          const lg = new THREE.BufferGeometry();
          lg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(linePos), 3));
          linesMesh = new THREE.LineSegments(lg, lineMat);
          scene.add(linesMesh);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      if (linesMesh) { scene.remove(linesMesh); linesMesh.geometry.dispose(); }
      ptGeo.dispose();
      ptMat.dispose();
      lineMat.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [color, count, opacity]);

  return <div ref={mountRef} className={`absolute inset-0 pointer-events-none ${className}`} />;
}
