import { redirect } from "next/navigation";
import { getRoleHomePath } from "@/lib/auth/roles";
import { resolveCurrentAuthRole } from "@/lib/auth/session";

export default async function ProfileGateway() {
  const role = await resolveCurrentAuthRole();

  if (role === "GUEST") {
    redirect("/auth");
  }

  redirect(getRoleHomePath(role));
}
