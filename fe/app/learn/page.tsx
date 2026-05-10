import { redirect } from "next/navigation";
import { cookies } from "next/headers";

function firstLeafId(chunks: { id: string; children?: any[] }[]): string | null {
  for (const chunk of chunks) {
    if (!chunk.children || chunk.children.length === 0) return chunk.id;
    const child = firstLeafId(chunk.children);
    if (child) return child;
  }
  return null;
}

export default async function LearnRedirect() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("sessionId")?.value;

  const res = await fetch("http://localhost:8000/chunks", {
    headers: sessionId ? { Cookie: `sessionId=${sessionId}` } : {},
  });

  if (res.ok) {
    const chunks = await res.json();
    const id = firstLeafId(chunks);
    if (id) redirect(`/learn/${id}`);
  }

  redirect("/");
}
