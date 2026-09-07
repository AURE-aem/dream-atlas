import { redirect } from "next/navigation";

import MemoryExplorer from "@/components/memory/MemoryExplorer";
import { getCurrentUser } from "@/lib/auth/session";

type Props = {
  searchParams: Promise<{
    view?: string | string[];
  }>;
};

export default async function DreamsPage({ searchParams }: Props) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { view } = await searchParams;
  const initialView = view === "timeline" ? "timeline" : "cards";

  return (
    <MemoryExplorer key={initialView} initialView={initialView} />
  );
}