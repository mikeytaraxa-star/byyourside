import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Html, Lightformer, RoundedBox } from "@react-three/drei";
import { useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";

/** Panto lens outline like the Even G2: round with a softly flattened brow line. */
function lensPath(scale: number) {
  const s = new THREE.Shape();
  const n = 72;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    let x = Math.cos(t) * 0.95, y = Math.sin(t) * 0.88;
    if (y > 0) y *= 1 - 0.22 * Math.pow(Math.abs(Math.cos(t)), 3) * (x > 0 ? 1 : 0.6);
    x *= scale; y *= scale;
    i === 0 ? s.moveTo(x, y) : s.lineTo(x, y);
  }
  return s;
}

/** Fine-grain matte texture for the frame, generated once. */
function useGrain() {
  return useMemo(() => {
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const g = c.getContext("2d")!; const img = g.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) { const v = 150 + Math.random() * 90; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6); return t;
  }, []);
}

function Glasses({ hud }: { hud: ReactNode }) {
  const grain = useGrain();
  const group = useRef<THREE.Group>(null);
  useFrame((st) => { const g = group.current; if (!g) return; g.position.y = Math.sin(st.clock.elapsedTime * 0.8) * 0.03; g.rotation.y += (st.pointer.x * 0.12 - 0.12 - g.rotation.y) * 0.05; g.rotation.x += (-st.pointer.y * 0.06 + 0.05 - g.rotation.x) * 0.05; });
  const rim = useMemo(() => { const o = lensPath(1.16); o.holes.push(lensPath(1)); return o; }, []);
  const lens = useMemo(() => lensPath(1.02), []);
  const frame = <meshStandardMaterial color="#2e2c2b" roughness={0.62} metalness={0.15} roughnessMap={grain} bumpMap={grain} bumpScale={0.004} />;
  const metal = <meshStandardMaterial color="#8a8079" roughness={0.3} metalness={0.9} />;
  const ext = { depth: 0.14, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 6, curveSegments: 48 };
  return (
    <group ref={group} rotation={[0.05, -0.12, 0]}>
      {[-1.22, 1.22].map((x) => (
        <group key={x} position={[x, 0, 0]} scale={[x < 0 ? -1 : 1, 1, 1]}>
          <mesh castShadow><extrudeGeometry args={[rim, ext]} />{frame}</mesh>
          <mesh position={[0, 0, 0.07]}><shapeGeometry args={[lens]} />
            <meshPhysicalMaterial transmission={1} roughness={0.04} thickness={0.2} ior={1.5} color="#fff5ea" transparent opacity={0.35} />
          </mesh>
          {/* hinge / display module */}
          <RoundedBox args={[0.42, 0.3, 0.34]} radius={0.06} position={[1.12, 0.48, -0.06]} castShadow>{frame}</RoundedBox>
          <mesh position={[1.34, 0.48, 0.02]}><boxGeometry args={[0.02, 0.16, 0.2]} />{metal}</mesh>
          {/* temple arm + battery pod */}
          <mesh position={[1.3, 0.45, -1.9]} castShadow><boxGeometry args={[0.06, 0.12, 3.4]} />{metal}</mesh>
          <RoundedBox args={[0.22, 0.5, 0.75]} radius={0.1} position={[1.3, 0.12, -3.6]} rotation={[0.5, 0, 0]} castShadow>{frame}</RoundedBox>
          {/* nose pad */}
          <mesh position={[-0.78, -0.25, -0.22]}><sphereGeometry args={[0.09, 24, 24]} /><meshPhysicalMaterial transmission={0.9} roughness={0.15} color="#ffffff" /></mesh>
        </group>
      ))}
      {/* G2 display: anchored inside the upper part of the right lens, above the line of sight, so it moves with the frame. */}
      <Html transform position={[1.22, 0.3, 0.12]} distanceFactor={1.6} pointerEvents="none" zIndexRange={[5, 0]}>
        <div style={{ width: 300 }}>{hud}</div>
      </Html>
      {/* keyhole bridge */}
      <mesh position={[0, 0.32, 0.07]} rotation={[0, 0, 0]} castShadow><torusGeometry args={[0.2, 0.08, 20, 40, Math.PI]} />{frame}</mesh>
    </group>
  );
}

export default function G2Scene({ hud }: { hud: ReactNode }) {
  return (
    <div className="relative h-full w-full">
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0.6, 6.2], fov: 38 }} gl={{ antialias: true }}>
      <color attach="background" args={["#1e1712"]} />
      <fog attach="fog" args={["#1e1712", 8, 16]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[0, 2, 6]} intensity={1.6} color="#fff1e2" />
      <spotLight position={[4, 6, 5]} angle={0.4} penumbra={0.8} intensity={60} color="#ffd2a1" castShadow />
      <pointLight position={[-5, 1, 2]} intensity={8} color="#e8894a" />
      <Glasses hud={hud} />
      <ContactShadows position={[0, -1.6, 0]} opacity={0.55} scale={12} blur={2.6} far={4} color="#000000" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.62, 0]} receiveShadow>
        <circleGeometry args={[9, 64]} /><meshStandardMaterial color="#3a2a1f" roughness={0.9} />
      </mesh>
      <Environment resolution={256}>
        <Lightformer intensity={2.2} color="#ffe2c2" position={[0, 5, 2]} scale={[10, 4, 1]} />
        <Lightformer intensity={1.2} color="#e8894a" position={[-6, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 2, 1]} />
        <Lightformer intensity={0.8} color="#fff" position={[6, 0, 2]} rotation-y={-Math.PI / 2} scale={[10, 2, 1]} />
      </Environment>
    </Canvas>
    </div>
  );
}
