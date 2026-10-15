import SiloSceneLoader from "@/components/canvas/SiloSceneLoader";
import Overlay from "@/components/ui/Overlay";
import SeoContent from "@/components/SeoContent";

export default function HomePage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#0e0804] text-zinc-100">
      <SeoContent />
      <SiloSceneLoader />
      <Overlay />
    </main>
  );
}
