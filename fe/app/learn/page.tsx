import { redirect } from "next/navigation";
import { randomUUID } from "crypto";

export default async function LearnRedirect() {
  await fetch("http://localhost:8000/session", { method: "POST" });
  redirect(`/learn/${randomUUID()}`);
}
