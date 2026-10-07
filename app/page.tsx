// app/page.tsx — Server Component
import MainWorkspace from "@/components/MainWorkspace";

export default function Home() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-[var(--surface-0)]">
      <MainWorkspace />
    </div>
  );
}
