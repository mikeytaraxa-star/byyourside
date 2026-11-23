import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, RoundedBox } from "@react-three/drei";
import { isValidElement, useEffect, useMemo, useRef, type ReactNode } from "react";
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

type HudData = { title?: string; body?: string; footer?: string; alert?: boolean };

/** Lens-shaped display surface: the HUD is painted into a texture whose UVs span the lens bounds, so text can never leave the glass. */
function LensDisplay({ draw, deps }: { draw: (g: CanvasRenderingContext2D, w: number, h: number) => void; deps: unknown[] }) {
  const shape = useMemo(() => lensPath(0.97), []);
  const { tex, canvas } = useMemo(() => {
    const canvas = document.createElement("canvas"); canvas.width = 1024; canvas.height = 1024;
    const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    return { tex, canvas };
  }, []);
  const geo = useMemo(() => {
    const gm = new THREE.ShapeGeometry(shape, 48); gm.computeBoundingBox();
    const b = gm.boundingBox!; const pos = gm.attributes["position"]!; const uv = gm.attributes["uv"]!;
    const span = Math.max(b.max.x - b.min.x, b.max.y - b.min.y);
    const cx = (b.max.x + b.min.x) / 2, cy = (b.max.y + b.min.y) / 2;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - cx) / span + 0.5, (pos.getY(i) - cy) / span + 0.5);
    uv.needsUpdate = true; return gm;
  }, [shape]);
  useEffect(() => {
    const g = canvas.getContext("2d")!; g.clearRect(0, 0, 1024, 1024); draw(g, 1024, 1024); tex.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return (
    <mesh geometry={geo} position={[0, 0, 0.075]} renderOrder={2}>
      <meshBasicMaterial map={tex} transparent toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

const HUD_COLOR = "#ffc27a";
function glow(g: CanvasRenderingContext2D) { g.fillStyle = HUD_COLOR; g.shadowColor = "rgba(255,170,90,0.85)"; g.shadowBlur = 18; g.textAlign = "center"; g.textBaseline = "middle"; }
function wrap(g: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(/\s+/); const lines: string[] = []; let cur = "";
  for (const w of words) { const t = cur ? cur + " " + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines.slice(0, 3);
}
const FONT = "'DM Sans', system-ui, sans-serif";

function Glasses({ hud, clock }: { hud: HudData; clock?: string | undefined }) {
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
          {x > 0 ? (
            <LensDisplay deps={[hud.title, hud.body, hud.footer, hud.alert]} draw={(g, w) => {
              glow(g);
              // Upper half of the lens, above the line of sight. Safe width shrinks toward the top of the circle.
              if (hud.title) { g.font = `600 44px ${FONT}`; g.globalAlpha = 0.8; g.fillText((hud.alert ? "⚠ " : "") + hud.title, w / 2, 250); }
              g.globalAlpha = 1; g.font = `700 74px ${FONT}`;
              const lines = wrap(g, hud.body ?? "", 660);
              lines.forEach((l, i) => g.fillText(l, w / 2, 340 + i * 86));
              if (hud.footer) { g.font = `500 38px ${FONT}`; g.globalAlpha = 0.75; g.fillText(hud.footer, w / 2, 830); }
            }} />
          ) : (
            <LensDisplay deps={[clock]} draw={(g) => {
              // Mirrored group (scale x -1): draw flipped so the clock reads correctly in the left lens's top-left corner.
              if (!clock) return; glow(g); g.font = `700 56px ${FONT}`;
              g.save(); g.translate(1024, 0); g.scale(-1, 1); g.fillText(clock, 1024 - 300, 250); g.restore();
            }} />
          )}
          <mesh position={[-0.78, -0.25, -0.22]}><sphereGeometry args={[0.09, 24, 24]} /><meshPhysicalMaterial transmission={0.9} roughness={0.15} color="#ffffff" /></mesh>
        </group>
      ))}
      {/* keyhole bridge */}
      <mesh position={[0, 0.32, 0.07]} rotation={[0, 0, 0]} castShadow><torusGeometry args={[0.2, 0.08, 20, 40, Math.PI]} />{frame}</mesh>
    </group>
  );
}

export default function G2Scene({ hud, clock }: { hud: ReactNode; clock?: string | undefined }) {
  const data = (isValidElement(hud) ? hud.props : {}) as HudData;
  return (
    <div className="relative h-full w-full">
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0.6, 6.2], fov: 38 }} gl={{ antialias: true }}>
      <color attach="background" args={["#1e1712"]} />
      <fog attach="fog" args={["#1e1712", 8, 16]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[0, 2, 6]} intensity={1.6} color="#fff1e2" />
      <spotLight position={[4, 6, 5]} angle={0.4} penumbra={0.8} intensity={60} color="#ffd2a1" castShadow />
      <pointLight position={[-5, 1, 2]} intensity={8} color="#e8894a" />
      <Glasses hud={data} clock={clock} />
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
