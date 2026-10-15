"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, Sparkles } from "@react-three/drei";
import {
  Bloom,
  EffectComposer,
  Noise,
  Vignette
} from "@react-three/postprocessing";
import * as THREE from "three";
import gsap from "gsap";
import { SILO_GEOMETRY, SILO_LEVELS } from "@/data/portfolio";
import { useSiloStore } from "@/store/useSiloStore";

const G = SILO_GEOMETRY;
const FLOOR_COUNT = SILO_LEVELS.length;
const PIPE_PADDING = 8;
const PIPE_TOP = G.floorHeight * (FLOOR_COUNT - 1) + PIPE_PADDING; // +48m
const PIPE_BOTTOM = -PIPE_PADDING; // -8m
const PIPE_HEIGHT = PIPE_TOP - PIPE_BOTTOM;
const PIPE_CENTER_Y = (PIPE_TOP + PIPE_BOTTOM) / 2;
const THETA_START = G.cutawayHalfAngle; // 0.58
const THETA_LENGTH = Math.PI * 2 - G.cutawayHalfAngle * 2; // 2PI - 1.16
// Tori sweep from +X; rotate them so the un-swept gap lines up with the front cutaway (+Z)
const RING_ARC_ROT_Z = Math.PI / 2 + G.cutawayHalfAngle;

const STEP_RISE = G.floorHeight / G.stepsPerFloor;
const STEP_ANGLE = (Math.PI * 2) / G.stepsPerFloor;
const STEP_OVERSHOOT = 10; // extra steps below floor 00 and above floor 05
const FIRST_STEP = -STEP_OVERSHOOT;
const LAST_STEP = G.totalSteps + STEP_OVERSHOOT;

const tmpObj = new THREE.Object3D();
const tmpColor = new THREE.Color();

/* ------------------------------------------------------------------ */
/* Exterior camera rig + spiral staircase rotation driver (GSAP)       */
/* ------------------------------------------------------------------ */

function ExteriorSiloRig({
  stairGroupRef
}: {
  stairGroupRef: React.RefObject<THREE.Group | null>;
}) {
  const { camera, pointer } = useThree();
  const currentStepIndex = useSiloStore((s) => s.currentStepIndex);
  const completeTransition = useSiloStore((s) => s.completeTransition);

  const anim = useRef({ floorProgress: 0 });

  useEffect(() => {
    const tween = gsap.to(anim.current, {
      floorProgress: currentStepIndex,
      duration: 1.35,
      ease: "power3.inOut",
      overwrite: "auto",
      onUpdate: () => {
        // Rotate the interior helix one full turn per floor so the stairs
        // visibly wind up/down inside the cutaway pipe while the camera climbs.
        if (stairGroupRef.current) {
          stairGroupRef.current.rotation.y =
            -anim.current.floorProgress * Math.PI * 2;
        }
      },
      onComplete: () => {
        if (stairGroupRef.current) {
          stairGroupRef.current.rotation.y = -currentStepIndex * Math.PI * 2;
        }
        completeTransition();
      }
    });
    return () => {
      tween.kill();
    };
  }, [currentStepIndex, completeTransition, stairGroupRef]);

  useFrame((state, delta) => {
    const floorY = anim.current.floorProgress * G.floorHeight;
    const breathe = Math.sin(state.clock.elapsedTime * 1.2) * 0.06;
    const px = pointer.x * 0.7;
    const py = pointer.y * 0.35;

    // camera.position = [0, currentFloorY, 17.5] (+ subtle parallax / breathing)
    const k = Math.min(1, delta * 9);
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, px, k);
    camera.position.y = floorY + 1.5 + py + breathe;
    camera.position.z = G.cameraDistanceZ;
    camera.lookAt(0, floorY + 0.35, 0);
  });

  return null;
}

/* ------------------------------------------------------------------ */
/* The outer silo pipe: shell, inner liner, cutaway jambs, collars,    */
/* buttress columns, floor indicator rings                             */
/* ------------------------------------------------------------------ */

function CollarRings() {
  const minorRef = useRef<THREE.InstancedMesh>(null);
  const majorRef = useRef<THREE.InstancedMesh>(null);

  const { minor, major } = useMemo(() => {
    const minor: number[] = [];
    const major: number[] = [];
    for (let y = PIPE_BOTTOM; y <= PIPE_TOP; y += 2) {
      const relative = ((y % G.floorHeight) + G.floorHeight) % G.floorHeight;
      if (relative === 0) continue; // neon floor ring lives here
      if (relative === G.floorHeight / 2) major.push(y);
      else minor.push(y);
    }
    return { minor, major };
  }, []);

  useLayoutEffect(() => {
    const fill = (mesh: THREE.InstancedMesh | null, ys: number[]) => {
      if (!mesh) return;
      ys.forEach((y, i) => {
        tmpObj.position.set(0, y, 0);
        tmpObj.rotation.set(Math.PI / 2, 0, RING_ARC_ROT_Z);
        tmpObj.scale.set(1, 1, 1);
        tmpObj.updateMatrix();
        mesh.setMatrixAt(i, tmpObj.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    };
    fill(minorRef.current, minor);
    fill(majorRef.current, major);
  }, [minor, major]);

  return (
    <>
      <instancedMesh
        ref={minorRef}
        args={[undefined, undefined, minor.length]}
        castShadow
        receiveShadow
      >
        <torusGeometry args={[G.outerPipeRadius + 0.1, 0.09, 10, 96, THETA_LENGTH]} />
        <meshStandardMaterial color="#2a1a0e" metalness={0.6} roughness={0.42} />
      </instancedMesh>
      <instancedMesh
        ref={majorRef}
        args={[undefined, undefined, major.length]}
        castShadow
        receiveShadow
      >
        <torusGeometry args={[G.outerPipeRadius + 0.18, 0.3, 12, 96, THETA_LENGTH]} />
        <meshStandardMaterial color="#3b2615" metalness={0.5} roughness={0.5} />
      </instancedMesh>
    </>
  );
}

function ButtressColumns() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const angles = useMemo(
    () => [0.9, 1.35, 1.8, 2.3, 2.8, Math.PI, -2.8, -2.3, -1.8, -1.35, -0.9],
    []
  );

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    angles.forEach((a, i) => {
      const r = G.outerPipeRadius + 0.3;
      tmpObj.position.set(r * Math.sin(a), PIPE_CENTER_Y, r * Math.cos(a));
      tmpObj.rotation.set(0, a, 0);
      tmpObj.scale.set(1, 1, 1);
      tmpObj.updateMatrix();
      mesh.setMatrixAt(i, tmpObj.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [angles]);

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, angles.length]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[0.42, PIPE_HEIGHT + 0.6, 0.6]} />
      <meshStandardMaterial color="#2e1c0f" metalness={0.65} roughness={0.4} />
    </instancedMesh>
  );
}

function CutawaySiloPipeStructure() {
  const currentStepIndex = useSiloStore((s) => s.currentStepIndex);
  const accent = SILO_LEVELS[currentStepIndex].accentColor;
  const jambRadius = (G.outerPipeRadius + G.innerWallRadius) / 2;

  return (
    <group>
      {/* Outer cylindrical shell with the front cutaway window */}
      <mesh position={[0, PIPE_CENTER_Y, 0]} castShadow receiveShadow>
        <cylinderGeometry
          args={[
            G.outerPipeRadius,
            G.outerPipeRadius,
            PIPE_HEIGHT,
            96,
            1,
            true,
            THETA_START,
            THETA_LENGTH
          ]}
        />
        <meshStandardMaterial
          color="#2b1a0d"
          roughness={0.78}
          metalness={0.38}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner brutalist concrete liner (seen through the cutaway) */}
      <mesh position={[0, PIPE_CENTER_Y, 0]} receiveShadow>
        <cylinderGeometry
          args={[
            G.innerWallRadius,
            G.innerWallRadius,
            PIPE_HEIGHT,
            96,
            1,
            true,
            THETA_START,
            THETA_LENGTH
          ]}
        />
        <meshStandardMaterial
          color="#170d06"
          roughness={0.95}
          metalness={0.12}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Top crown & bottom base caps */}
      {[PIPE_TOP, PIPE_BOTTOM].map((y, i) => (
        <mesh
          key={i}
          position={[0, y, 0]}
          rotation={[Math.PI / 2, 0, RING_ARC_ROT_Z]}
        >
          <torusGeometry
            args={[G.outerPipeRadius + 0.05, 0.5, 14, 96, THETA_LENGTH]}
          />
          <meshStandardMaterial color="#3a2614" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}

      {/* Vertical steel jambs framing the left/right cutaway edges */}
      {[-1, 1].map((side) => {
        const a = side * G.cutawayHalfAngle;
        return (
          <group
            key={side}
            position={[
              jambRadius * Math.sin(a),
              PIPE_CENTER_Y,
              jambRadius * Math.cos(a)
            ]}
            rotation={[0, a, 0]}
          >
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.6, PIPE_HEIGHT, 1.1]} />
              <meshStandardMaterial
                color="#3b2615"
                metalness={0.75}
                roughness={0.3}
              />
            </mesh>
            {/* Glowing accent strip facing the opening */}
            <mesh position={[-side * 0.33, 0, 0.25]}>
              <boxGeometry args={[0.05, PIPE_HEIGHT - 1, 0.05]} />
              <meshBasicMaterial color={accent} transparent opacity={0.75} />
            </mesh>
          </group>
        );
      })}

      <CollarRings />
      <ButtressColumns />

      {/* Per-floor neon indicator rings + interior chamber lights */}
      {SILO_LEVELS.map((lvl) => {
        const y = lvl.index * G.floorHeight;
        const active = lvl.index === currentStepIndex;
        return (
          <group key={lvl.id} position={[0, y, 0]}>
            <mesh rotation={[Math.PI / 2, 0, RING_ARC_ROT_Z]}>
              <torusGeometry
                args={[G.outerPipeRadius + 0.42, 0.075, 10, 96, THETA_LENGTH]}
              />
              <meshBasicMaterial
                color={lvl.accentColor}
                transparent
                opacity={active ? 1 : 0.25}
                toneMapped={false}
              />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, RING_ARC_ROT_Z]}>
              <torusGeometry
                args={[G.innerWallRadius - 0.12, 0.16, 10, 96, THETA_LENGTH]}
              />
              <meshStandardMaterial
                color="#30200f"
                emissive={lvl.accentColor}
                emissiveIntensity={active ? 0.7 : 0.08}
                metalness={0.7}
                roughness={0.3}
              />
            </mesh>
            <pointLight
              position={[0, 2.6, 1.6]}
              color={lvl.accentColor}
              intensity={active ? 14 : 2}
              distance={14}
              decay={2}
            />
          </group>
        );
      })}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Interior helical staircase around the central spine                 */
/* ------------------------------------------------------------------ */

class HelixCurve extends THREE.Curve<THREE.Vector3> {
  constructor(
    private radius: number,
    private y0: number,
    private y1: number,
    private a0: number,
    private a1: number
  ) {
    super();
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    const a = this.a0 + (this.a1 - this.a0) * t;
    return target.set(
      this.radius * Math.sin(a),
      this.y0 + (this.y1 - this.y0) * t,
      this.radius * Math.cos(a)
    );
  }
}

interface StepInfo {
  i: number;
  angle: number;
  y: number;
  floorIndex: number; // floor segment this step belongs to (0..5)
  isLanding: boolean;
}

const InteriorSpiralStaircase = React.forwardRef<THREE.Group>((_, ref) => {
  const currentStepIndex = useSiloStore((s) => s.currentStepIndex);

  const treadRef = useRef<THREE.InstancedMesh>(null);
  const stripRef = useRef<THREE.InstancedMesh>(null);
  const strutRef = useRef<THREE.InstancedMesh>(null);
  const postRef = useRef<THREE.InstancedMesh>(null);

  const { treads, landings, posts } = useMemo(() => {
    const treads: StepInfo[] = [];
    const landings: StepInfo[] = [];
    const posts: StepInfo[] = [];
    for (let i = FIRST_STEP; i <= LAST_STEP; i++) {
      const isLanding =
        i >= 0 && i <= G.totalSteps && i % G.stepsPerFloor === 0;
      const floorIndex = THREE.MathUtils.clamp(
        Math.floor(i / G.stepsPerFloor),
        0,
        FLOOR_COUNT - 1
      );
      const info: StepInfo = {
        i,
        angle: i * STEP_ANGLE, // landings (i % stepsPerFloor === 0) sit at angle 0 => facing +Z
        y: i * STEP_RISE,
        floorIndex: isLanding ? i / G.stepsPerFloor : floorIndex,
        isLanding
      };
      if (isLanding) landings.push(info);
      else treads.push(info);
      if (i % 2 === 0) posts.push(info);
    }
    return { treads, landings, posts };
  }, []);

  const railCurve = useMemo(
    () =>
      new HelixCurve(
        G.stairRadius + 1.05,
        FIRST_STEP * STEP_RISE + 1.05,
        LAST_STEP * STEP_RISE + 1.05,
        FIRST_STEP * STEP_ANGLE,
        LAST_STEP * STEP_ANGLE
      ),
    []
  );

  useLayoutEffect(() => {
    const strutR = (G.coreColumnRadius + G.stairRadius) / 2;
    const railR = G.stairRadius + 1.05;

    const tread = treadRef.current;
    const strip = stripRef.current;
    const strut = strutRef.current;
    const post = postRef.current;

    treads.forEach((s, idx) => {
      const x = G.stairRadius * Math.sin(s.angle);
      const z = G.stairRadius * Math.cos(s.angle);
      if (tread) {
        tmpObj.position.set(x, s.y, z);
        tmpObj.rotation.set(0, s.angle, 0);
        tmpObj.scale.set(1, 1, 1);
        tmpObj.updateMatrix();
        tread.setMatrixAt(idx, tmpObj.matrix);
      }
      if (strip) {
        tmpObj.position.set(x, s.y + 0.08, z);
        tmpObj.rotation.set(0, s.angle, 0);
        tmpObj.updateMatrix();
        strip.setMatrixAt(idx, tmpObj.matrix);
        strip.setColorAt(
          idx,
          tmpColor.set(SILO_LEVELS[s.floorIndex].accentColor)
        );
      }
      if (strut) {
        tmpObj.position.set(
          strutR * Math.sin(s.angle),
          s.y - 0.1,
          strutR * Math.cos(s.angle)
        );
        tmpObj.rotation.set(0, s.angle, 0);
        tmpObj.updateMatrix();
        strut.setMatrixAt(idx, tmpObj.matrix);
      }
    });
    posts.forEach((s, idx) => {
      if (!post) return;
      tmpObj.position.set(
        railR * Math.sin(s.angle),
        s.y + 0.55,
        railR * Math.cos(s.angle)
      );
      tmpObj.rotation.set(0, 0, 0);
      tmpObj.scale.set(1, 1, 1);
      tmpObj.updateMatrix();
      post.setMatrixAt(idx, tmpObj.matrix);
    });

    if (tread) tread.instanceMatrix.needsUpdate = true;
    if (strip) {
      strip.instanceMatrix.needsUpdate = true;
      if (strip.instanceColor) strip.instanceColor.needsUpdate = true;
    }
    if (strut) strut.instanceMatrix.needsUpdate = true;
    if (post) post.instanceMatrix.needsUpdate = true;
  }, [treads, posts]);

  return (
    <group ref={ref}>
      {/* Central structural spine column */}
      <mesh position={[0, PIPE_CENTER_Y, 0]} castShadow receiveShadow>
        <cylinderGeometry
          args={[G.coreColumnRadius, G.coreColumnRadius, PIPE_HEIGHT, 48]}
        />
        <meshStandardMaterial color="#1d1208" metalness={0.6} roughness={0.48} />
      </mesh>

      {/* Regular treads */}
      <instancedMesh
        ref={treadRef}
        args={[undefined, undefined, treads.length]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[2.4, 0.14, 1.0]} />
        <meshStandardMaterial color="#2c1b0d" metalness={0.5} roughness={0.5} />
      </instancedMesh>

      {/* Glowing nose strip on every tread (per-floor accent color) */}
      <instancedMesh ref={stripRef} args={[undefined, undefined, treads.length]}>
        <boxGeometry args={[2.42, 0.03, 1.02]} />
        <meshBasicMaterial transparent opacity={0.28} toneMapped={false} />
      </instancedMesh>

      {/* Cantilever struts from spine to tread */}
      <instancedMesh ref={strutRef} args={[undefined, undefined, treads.length]}>
        <boxGeometry args={[0.2, 0.1, G.stairRadius - G.coreColumnRadius]} />
        <meshStandardMaterial color="#241508" metalness={0.7} roughness={0.35} />
      </instancedMesh>

      {/* Baluster posts */}
      <instancedMesh ref={postRef} args={[undefined, undefined, posts.length]}>
        <cylinderGeometry args={[0.028, 0.028, 1.1, 8]} />
        <meshStandardMaterial color="#7a5530" metalness={0.85} roughness={0.25} />
      </instancedMesh>

      {/* Continuous helical handrail */}
      <mesh>
        <tubeGeometry args={[railCurve, 720, 0.055, 8, false]} />
        <meshStandardMaterial color="#9a6d3c" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Floor landing platforms (facing the front cutaway at angle 0) */}
      {landings.map((s) => {
        const lvl = SILO_LEVELS[s.floorIndex];
        const active = s.floorIndex === currentStepIndex;
        const x = G.stairRadius * Math.sin(s.angle);
        const z = G.stairRadius * Math.cos(s.angle);
        return (
          <group key={s.i} position={[x, s.y, z]} rotation={[0, s.angle, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[3.6, 0.3, 2.6]} />
              <meshStandardMaterial
                color={active ? "#4a3015" : "#30200f"}
                metalness={0.45}
                roughness={0.55}
                emissive={lvl.accentColor}
                emissiveIntensity={active ? 0.28 : 0.05}
              />
            </mesh>
            <mesh position={[0, 0.17, 0]}>
              <boxGeometry args={[3.64, 0.03, 2.64]} />
              <meshBasicMaterial
                color={lvl.accentColor}
                transparent
                opacity={active ? 0.35 : 0.15}
                toneMapped={false}
              />
            </mesh>
            {/* Landing strut to spine */}
            <mesh
              position={[0, -0.12, -(G.stairRadius - G.coreColumnRadius) / 2]}
            >
              <boxGeometry
                args={[0.3, 0.22, G.stairRadius - G.coreColumnRadius]}
              />
              <meshStandardMaterial
                color="#241508"
                metalness={0.7}
                roughness={0.35}
              />
            </mesh>
            {/* Floor plate on the front face of the landing */}
            <mesh position={[0, 0.5, 1.3]}>
              <boxGeometry args={[1.1, 0.3, 0.06]} />
              <meshBasicMaterial
                color={lvl.accentColor}
                transparent
                opacity={active ? 0.7 : 0.25}
                toneMapped={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
});
InteriorSpiralStaircase.displayName = "InteriorSpiralStaircase";


/* ------------------------------------------------------------------ */
/* Poster-style amber sunburst fan behind the silo + glitch slats      */
/* ------------------------------------------------------------------ */

const SUNBURST_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SUNBURST_FRAG = /* glsl */ `
  uniform vec3 uCore;
  uniform vec3 uEdge;
  uniform float uTime;
  varying vec2 vUv;

  float hash(float n) { return fract(sin(n * 12.9898) * 43758.5453); }

  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0;
    float a = atan(p.y, p.x) / 6.28318530 + 0.5;

    // 36 radial panels, each with its own brightness and a dark seam
    const float panels = 36.0;
    float idx = floor(a * panels);
    float local = fract(a * panels);
    float seam = smoothstep(0.0, 0.07, local) * smoothstep(0.0, 0.07, 1.0 - local);
    float shade = 0.7 + 0.3 * hash(idx + 3.0);

    // a slow shimmer so the fan feels alive
    shade += 0.05 * sin(uTime * 0.4 + idx * 1.7);

    float glow = exp(-r * 2.1);
    float fade = 1.0 - smoothstep(0.5, 0.95, r);
    float intensity = 0.55 * (0.12 + 0.88 * glow) * shade * seam * fade;

    vec3 col = mix(uEdge, uCore, glow);
    gl_FragColor = vec4(col * intensity, 1.0);
    #include <colorspace_fragment>
  }
`;

function SunburstBackdrop() {
  const ref = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({
      uCore: { value: new THREE.Color("#ff7a12") },
      uEdge: { value: new THREE.Color("#2a1004") },
      uTime: { value: 0 }
    }),
    []
  );

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    if (ref.current) {
      // keep the fan centred behind whichever floor the camera is on
      ref.current.position.y = state.camera.position.y + 6;
    }
  });

  return (
    <mesh ref={ref} position={[0, 6, -42]} renderOrder={-10}>
      <planeGeometry args={[150, 150]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={SUNBURST_VERT}
        fragmentShader={SUNBURST_FRAG}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
}

function GlitchSlats() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const COUNT = 140;

  const slats = useMemo(() => {
    const arr: { x: number; y: number; z: number; h: number; w: number; c: string }[] = [];
    let seed = 7;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const tones = ["#ff9a3c", "#f26b0f", "#ffc966", "#a94a08", "#ffb24a"];
    for (let i = 0; i < COUNT; i++) {
      const side = rnd() < 0.5 ? -1 : 1;
      const x = side * (G.outerPipeRadius + 1.5 + rnd() * 9);
      const y = PIPE_BOTTOM + rnd() * (PIPE_HEIGHT + 8);
      const z = -14 + rnd() * 18;
      arr.push({
        x,
        y,
        z,
        h: 0.6 + rnd() * 5.5,
        w: 0.05 + rnd() * 0.14,
        c: tones[Math.floor(rnd() * tones.length)]
      });
    }
    return arr;
  }, []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    slats.forEach((s, i) => {
      tmpObj.position.set(s.x, s.y, s.z);
      tmpObj.rotation.set(0, 0, 0);
      tmpObj.scale.set(s.w, s.h, s.w);
      tmpObj.updateMatrix();
      mesh.setMatrixAt(i, tmpObj.matrix);
      mesh.setColorAt(i, tmpColor.set(s.c));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [slats]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial transparent opacity={0.55} toneMapped={false} />
    </instancedMesh>
  );
}

/* ------------------------------------------------------------------ */

export default function SiloScene() {
  const stairGroupRef = useRef<THREE.Group | null>(null);

  return (
    <div className="fixed inset-0 h-screen w-screen bg-[#050507]">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{
          position: [0, 0, G.cameraDistanceZ],
          fov: G.cameraFov,
          near: 0.1,
          far: 140
        }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#0e0804"]} />
        <fog attach="fog" args={["#120904", 18, 48]} />

        <ambientLight intensity={0.24} color="#ff9f52" />
        <hemisphereLight args={["#ff8a2a", "#140903", 0.4]} />

        {/* Rim lights grazing the left/right outer edges of the cylinder */}
        <directionalLight
          position={[-24, 26, -6]}
          intensity={2.4}
          color="#ff7a14"
        />
        <directionalLight
          position={[24, 18, -6]}
          intensity={2.0}
          color="#ffb347"
        />

        {/* Key light through the cutaway */}
        <spotLight
          position={[0, 52, 18]}
          angle={0.55}
          penumbra={0.85}
          intensity={4}
          color="#ffd9a0"
          castShadow
          shadow-mapSize={[1024, 1024]}
        />

        <Sparkles
          count={220}
          scale={[18, 60, 18]}
          position={[0, 20, 0]}
          size={1.4}
          speed={0.2}
          opacity={0.3}
          color="#ffb347"
        />

        <SunburstBackdrop />
        <GlitchSlats />
        <CutawaySiloPipeStructure />
        <InteriorSpiralStaircase ref={stairGroupRef} />
        <ExteriorSiloRig stairGroupRef={stairGroupRef} />

        <EffectComposer>
          <Bloom
            luminanceThreshold={0.42}
            mipmapBlur
            intensity={0.8}
            radius={0.6}
          />
          <Noise opacity={0.02} />
          <Vignette eskil={false} offset={0.15} darkness={0.85} />
        </EffectComposer>

        <AdaptiveDpr pixelated />
      </Canvas>
    </div>
  );
}
