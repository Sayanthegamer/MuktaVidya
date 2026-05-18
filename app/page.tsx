// app/page.tsx — Server Component
import MainWorkspace from "@/components/MainWorkspace";
import 'katex/dist/katex.min.css';

export default function Home() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-[var(--surface-0)]">
      <MainWorkspace />
    </div>
  );
}
