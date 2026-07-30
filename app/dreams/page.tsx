import MemoryExplorer from "@/components/memory/MemoryExplorer";

type Props = {
  searchParams: Promise<{
    view?: string | string[];
  }>;
};

export default async function DreamsPage({ searchParams }: Props) {
  const { view } = await searchParams;
  const initialView = view === "timeline" ? "timeline" : "cards";

  return (
    <MemoryExplorer key={initialView} initialView={initialView} />
  );
}
