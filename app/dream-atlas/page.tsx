import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ selected?: string; symbol?: string; new?: string }>;
};

export default async function DreamAtlasRedirect({ searchParams }: Props) {
  const { selected, symbol, new: newDreamId } = await searchParams;
  const params = new URLSearchParams();

  if (selected) params.set("selected", selected);
  if (symbol) params.set("symbol", symbol);
  if (newDreamId) params.set("new", newDreamId);

  const query = params.toString();
  redirect(query ? `/?${query}` : "/");
}
