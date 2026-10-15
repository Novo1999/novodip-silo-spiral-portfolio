"use client";

import dynamic from "next/dynamic";

// WebGL can't render on the server, so the scene is client-only
const SiloScene = dynamic(() => import("@/components/canvas/SiloScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-[#0e0804] font-mono text-xs tracking-widest text-amber-400">
      INITIALIZING EXTERIOR SILO PIPE & HELICAL STAIRCASE // [FLR 00..05]...
    </div>
  )
});

export default function SiloSceneLoader() {
  return <SiloScene />;
}
