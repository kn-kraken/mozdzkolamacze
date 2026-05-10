import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function LearnRedirect() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("sessionId")?.value;

  const res = await fetch("http://localhost:8000/chunks", {
    headers: sessionId ? { Cookie: `sessionId=${sessionId}` } : {},
  });

  if (res.ok) {
    const chunks = await res.json();
    if (chunks.length > 0) redirect(`/learn/${chunks[0].id}`);
  }

  redirect("/");
}
