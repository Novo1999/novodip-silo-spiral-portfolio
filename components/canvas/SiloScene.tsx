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
/**
 * Sections run top-down: section 0 (Hero) sits on the highest landing and
 * the last section on the ground floor. Maps a section index to its physical
 * floor slot (0 = ground) and back — the mapping is its own inverse.
 */
const slotOf = (index: number) => FLOOR_COUNT - 1 - index;
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

/**
 * The staircase never stops: a slow spin on top of the per-floor turns makes
 * the helix read as a staircase flowing steadily downward (positive rotation
 * shifts every tread down its own spiral).
 */
const STAIR_SPIN_SPEED = 0.1; // rad/s

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

  const anim = useRef({
    floorProgress: slotOf(useSiloStore.getState().currentStepIndex)
  });

  useEffect(() => {
    const tween = gsap.to(anim.current, {
      floorProgress: slotOf(currentStepIndex),
      duration: 1.35,
      ease: "power3.inOut",
      overwrite: "auto",
      onComplete: completeTransition
    });
    return () => {
      tween.kill();
    };
  }, [currentStepIndex, completeTransition, stairGroupRef]);

  const spin = useRef(0);
  const reduceMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  useFrame((state, delta) => {
    const floorY = anim.current.floorProgress * G.floorHeight;

    // One full helix turn per floor while travelling, plus the idle spin
    if (!reduceMotion) spin.current += Math.min(delta, 0.1) * STAIR_SPIN_SPEED;
    if (stairGroupRef.current) {
      stairGroupRef.current.rotation.y =
        -anim.current.floorProgress * Math.PI * 2 + spin.current;
    }
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
        const y = slotOf(lvl.index) * G.floorHeight;
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

/* ------------------------------------------------------------------ */
/* Silhouettes walking down the spiral — spawn above the top floor,   */
/* descend the whole helix, fade out below the ground floor, loop     */
/* ------------------------------------------------------------------ */

const WALKER_COUNT = 12;
const WALK_SPEED = 1.2; // steps per second along the helix
const LOOP_STEPS = LAST_STEP - FIRST_STEP;
const FADE_STEPS = 4; // fade in/out over the first/last few steps
const WALKER_RIM_COLOR = new THREE.Color("#ff9a3c").multiplyScalar(2.8);

/** Joints of one figure, animated every frame */
interface FigureRig {
  root: THREE.Group | null;
  pelvis: THREE.Group | null;
  torso: THREE.Group | null;
  head: THREE.Group | null;
  coat: THREE.Group | null;
  thighs: (THREE.Group | null)[];
  shins: (THREE.Group | null)[];
  feet: (THREE.Group | null)[];
  upperArms: (THREE.Group | null)[];
  forearms: (THREE.Group | null)[];
}

interface FigureVariant {
  offset: number; // position along the loop, in steps
  speed: number;
  lane: number; // radial offset across the tread
  height: number;
  shoulders: number; // shoulder-width multiplier
  hips: number; // hip-width multiplier
  coat: number; // coat length in metres below the waist, 0 = fitted jumpsuit
  hood: boolean;
  bun: boolean;
}

/** A cylinder hanging from its top end, for limbs that pivot at a joint */
function limb(rTop: number, rBottom: number, length: number) {
  const g = new THREE.CylinderGeometry(rTop, rBottom, length, 12, 1);
  g.translate(0, -length / 2, 0);
  return g;
}

/** Lathe profile given as [radius, y] pairs */
function lathe(points: [number, number][], segments = 28) {
  return new THREE.LatheGeometry(
    points.map(([r, y]) => new THREE.Vector2(r, y)),
    segments
  );
}

function createFigureGeometry() {
  // feet point along +Z (the walking direction)
  const foot = new THREE.CapsuleGeometry(0.034, 0.17, 4, 10);
  foot.rotateX(Math.PI / 2);
  foot.translate(0, -0.035, 0.055);

  return {
    joint: new THREE.SphereGeometry(1, 14, 10),
    head: new THREE.SphereGeometry(1, 22, 16),
    // half-shell hood that sits behind the head, open at the face
    hood: new THREE.SphereGeometry(1, 20, 14, Math.PI, Math.PI, 0, Math.PI * 0.64),
    torso: lathe([
      [0.02, -0.02],
      [0.13, 0.0],
      [0.142, 0.07],
      [0.124, 0.17], // waist
      [0.148, 0.3],
      [0.172, 0.41], // chest
      [0.168, 0.47],
      [0.128, 0.525],
      [0.05, 0.56]
    ]),
    neck: limb(0.049, 0.056, 0.09),
    thigh: limb(0.086, 0.057, 0.46),
    shin: limb(0.057, 0.036, 0.45),
    upperArm: limb(0.058, 0.045, 0.3),
    forearm: limb(0.045, 0.031, 0.27),
    foot,
    coat: (length: number) =>
      lathe([
        [0.152, 0.14],
        [0.174, 0.02],
        [0.188, -length * 0.35],
        [0.207, -length * 0.72],
        [0.226, -length]
      ])
  };
}

function SilhouetteFigure({
  variant: v,
  material,
  rig,
  geo
}: {
  variant: FigureVariant;
  material: THREE.Material;
  rig: FigureRig;
  geo: ReturnType<typeof createFigureGeometry>;
}) {
  const coatGeometry = useMemo(
    () => (v.coat > 0 ? geo.coat(v.coat) : null),
    [geo, v.coat]
  );
  useEffect(() => () => coatGeometry?.dispose(), [coatGeometry]);

  const shoulderX = 0.19 * v.shoulders;
  const hipX = 0.088 * v.hips;

  return (
    <group
      ref={(el) => {
        rig.root = el;
      }}
      scale={v.height}
    >
      {/* pelvis at hip height; legs hang from it, torso sits on it */}
      <group
        position={[0, 0.98, 0]}
        ref={(el) => {
          rig.pelvis = el;
        }}
      >
        <mesh
          geometry={geo.joint}
          material={material}
          position={[0, 0.02, 0]}
          scale={[0.165 * v.hips, 0.115, 0.12]}
          castShadow
        />

        {([-1, 1] as const).map((side, i) => (
          <group
            key={`leg${side}`}
            position={[side * hipX, 0, 0]}
            ref={(el) => {
              rig.thighs[i] = el;
            }}
          >
            <mesh geometry={geo.thigh} material={material} castShadow />
            <group
              position={[0, -0.46, 0]}
              ref={(el) => {
                rig.shins[i] = el;
              }}
            >
              <mesh geometry={geo.joint} material={material} scale={0.058} castShadow />
              <mesh geometry={geo.shin} material={material} castShadow />
              <group
                position={[0, -0.45, 0]}
                ref={(el) => {
                  rig.feet[i] = el;
                }}
              >
                <mesh geometry={geo.joint} material={material} scale={0.036} />
                <mesh geometry={geo.foot} material={material} castShadow />
              </group>
            </group>
          </group>
        ))}

        {coatGeometry && (
          <group
            ref={(el) => {
              rig.coat = el;
            }}
          >
            <mesh
              geometry={coatGeometry}
              material={material}
              scale={[1.06 * v.hips, 1, 0.8]}
              castShadow
            />
          </group>
        )}

        <group
          position={[0, 0.06, 0]}
          ref={(el) => {
            rig.torso = el;
          }}
        >
          <mesh
            geometry={geo.torso}
            material={material}
            scale={[(v.coat > 0 ? 1.17 : 1.1) * v.shoulders, 1, v.coat > 0 ? 0.78 : 0.72]}
            castShadow
          />
          {/* shoulders cap the torso so the arms read as attached */}
          {([-1, 1] as const).map((side) => (
            <mesh
              key={`sh${side}`}
              geometry={geo.joint}
              material={material}
              position={[side * (shoulderX - 0.02), 0.47, 0]}
              scale={[0.08, 0.066, 0.072]}
              castShadow
            />
          ))}
          <mesh geometry={geo.neck} material={material} position={[0, 0.645, 0.008]} castShadow />


          <group
            position={[0, 0.76, 0.01]}
            ref={(el) => {
              rig.head = el;
            }}
          >
            <mesh
              geometry={geo.head}
              material={material}
              position={[0, 0.012, 0]}
              scale={[0.09, 0.104, 0.1]}
              castShadow
            />
            {/* jaw and chin, set slightly forward of the skull */}
            <mesh
              geometry={geo.head}
              material={material}
              position={[0, -0.045, 0.02]}
              scale={[0.068, 0.07, 0.075]}
            />
            {/* hair mass shapes the back and crown of the skull */}
            <mesh
              geometry={geo.head}
              material={material}
              position={[0, 0.026, -0.03]}
              scale={[0.096, 0.104, 0.104]}
            />
            {v.bun && (
              <mesh
                geometry={geo.joint}
                material={material}
                position={[0, 0.06, -0.1]}
                scale={0.046}
              />
            )}
            {v.hood && (
              <mesh
                geometry={geo.hood}
                material={material}
                position={[0, 0.005, -0.012]}
                scale={[0.132, 0.15, 0.132]}
              />
            )}
          </group>

          {([-1, 1] as const).map((side, i) => (
            <group
              key={`arm${side}`}
              position={[side * shoulderX, 0.465, 0]}
              rotation={[0, 0, side * 0.07]}
              ref={(el) => {
                rig.upperArms[i] = el;
              }}
            >
              <mesh geometry={geo.upperArm} material={material} castShadow />
              <group
                position={[0, -0.3, 0]}
                ref={(el) => {
                  rig.forearms[i] = el;
                }}
              >
                <mesh geometry={geo.joint} material={material} scale={0.046} />
                <mesh geometry={geo.forearm} material={material} castShadow />
                <mesh
                  geometry={geo.joint}
                  material={material}
                  position={[0, -0.31, 0.005]}
                  scale={[0.028, 0.058, 0.022]}
                />
              </group>
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}

function StairWalkers() {
  const variants = useMemo<FigureVariant[]>(() => {
    let seed = 1999;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    return Array.from({ length: WALKER_COUNT }, (_, k) => {
      const coat = rnd() < 0.62 ? 0.42 + rnd() * 0.2 : 0;
      const slender = rnd() < 0.45;
      return {
        offset: (k / WALKER_COUNT) * LOOP_STEPS + rnd() * 5,
        speed: WALK_SPEED * (0.85 + rnd() * 0.3),
        lane: (rnd() - 0.5) * 0.36,
        height: 0.9 + rnd() * 0.16,
        shoulders: slender ? 0.86 + rnd() * 0.06 : 0.98 + rnd() * 0.12,
        hips: slender ? 1.04 + rnd() * 0.08 : 0.94 + rnd() * 0.06,
        coat,
        hood: coat > 0 && rnd() < 0.4,
        bun: slender && rnd() < 0.6
      };
    });
  }, []);

  const rigs = useRef<FigureRig[]>(
    variants.map(() => ({
      root: null,
      pelvis: null,
      torso: null,
      head: null,
      coat: null,
      thighs: [null, null],
      shins: [null, null],
      feet: [null, null],
      upperArms: [null, null],
      forearms: [null, null]
    }))
  );

  const geo = useMemo(createFigureGeometry, []);

  // one material per walker so each can fade independently; near-black bodies
  // with an amber fresnel rim so they read as backlit silhouettes
  const materials = useMemo(
    () =>
      variants.map(() => {
        const mat = new THREE.MeshStandardMaterial({
          color: "#030201",
          roughness: 1,
          metalness: 0,
          transparent: true,
          side: THREE.DoubleSide // coat hems and hoods are open shells
        });
        mat.onBeforeCompile = (shader) => {
          shader.uniforms.uRimColor = { value: WALKER_RIM_COLOR };
          shader.fragmentShader = shader.fragmentShader
            .replace(
              "#include <common>",
              "#include <common>\nuniform vec3 uRimColor;"
            )
            .replace(
              "#include <emissivemap_fragment>",
              `#include <emissivemap_fragment>
              float rim = 1.0 - saturate(dot(normal, normalize(vViewPosition)));
              totalEmissiveRadiance += uRimColor * pow(rim, 4.6);`
            );
        };
        return mat;
      }),
    [variants]
  );

  useEffect(
    () => () => {
      Object.values(geo).forEach((g) => {
        if (g instanceof THREE.BufferGeometry) g.dispose();
      });
      materials.forEach((m) => m.dispose());
    },
    [geo, materials]
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    variants.forEach((v, k) => {
      const rig = rigs.current[k];
      if (!rig.root) return;

      const travelled = (t * v.speed + v.offset) % LOOP_STEPS;
      const s = LAST_STEP - travelled; // continuous step index, decreasing
      const angle = s * STEP_ANGLE;
      const r = G.stairRadius + v.lane;

      // hold on each tread, then drop to the next one mid-stride
      const base = Math.floor(s);
      const drop = THREE.MathUtils.smoothstep(s - base, 0.3, 0.7);
      const y = (base + drop) * STEP_RISE + 0.08;

      const phase = travelled * Math.PI; // one full gait cycle every two steps
      const sway = Math.sin(phase);

      rig.root.position.set(
        r * Math.sin(angle),
        y + Math.abs(Math.cos(phase)) * 0.025,
        r * Math.cos(angle)
      );
      // face the direction of travel (down the helix = decreasing angle)
      rig.root.rotation.set(0, angle - Math.PI / 2, 0);

      // hips and shoulders counter-rotate; slight lean into the descent
      if (rig.pelvis) rig.pelvis.rotation.set(0, -sway * 0.06, sway * 0.025);
      if (rig.torso) rig.torso.rotation.set(0.07, sway * 0.09, -sway * 0.02);
      if (rig.head) rig.head.rotation.set(0.2, -sway * 0.05, 0);
      if (rig.coat) rig.coat.rotation.set(0.04 + Math.sin(phase * 2) * 0.035, 0, sway * 0.03);

      for (let i = 0; i < 2; i++) {
        // left leg leads on phase, right leg half a cycle later
        const p = phase + i * Math.PI;
        const forward = Math.sin(p);
        const swingPhase = Math.max(0, Math.cos(p)); // knee folds as the leg swings through

        const thigh = rig.thighs[i];
        const shin = rig.shins[i];
        const foot = rig.feet[i];
        if (thigh) thigh.rotation.x = -forward * 0.42 - 0.1;
        if (shin) shin.rotation.x = 0.14 + swingPhase * 0.78;
        if (foot) foot.rotation.x = 0.05 - swingPhase * 0.3;

        // arms swing opposite to the leg on the same side, elbows flex forward
        const arm = rig.upperArms[i];
        const forearm = rig.forearms[i];
        if (arm) arm.rotation.x = forward * 0.34;
        if (forearm) forearm.rotation.x = -(0.22 + Math.max(0, -forward) * 0.32);
      }

      materials[k].opacity = THREE.MathUtils.clamp(
        Math.min(s - FIRST_STEP, LAST_STEP - s) / FADE_STEPS,
        0,
        1
      );
    });
  });

  return (
    <>
      {variants.map((v, k) => (
        <SilhouetteFigure
          key={k}
          variant={v}
          material={materials[k]}
          rig={rigs.current[k]}
          geo={geo}
        />
      ))}
    </>
  );
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
          tmpColor.set(SILO_LEVELS[slotOf(s.floorIndex)].accentColor)
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
        const lvl = SILO_LEVELS[slotOf(s.floorIndex)];
        const active = lvl.index === currentStepIndex;
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

      <StairWalkers />
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
