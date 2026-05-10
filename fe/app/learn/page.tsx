import { redirect } from "next/navigation";
import { randomUUID } from "crypto";

export default function LearnRedirect() {
  redirect(`/learn/${randomUUID()}`);
}
