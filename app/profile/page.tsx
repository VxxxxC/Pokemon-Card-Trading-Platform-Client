import { redirect } from "next/navigation";
import { getRoleHomePath } from "@/lib/auth/roles";
import { resolveCurrentDemoRole } from "@/lib/auth/session";

export default async function ProfileGateway() {
  const role = await resolveCurrentDemoRole();

  if (role === "GUEST") {
    redirect("/auth");
  }

  redirect(getRoleHomePath(role));
}
