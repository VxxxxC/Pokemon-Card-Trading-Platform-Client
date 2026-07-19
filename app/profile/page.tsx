import { redirect } from "next/navigation";
import { getProfileHomePath } from "@/lib/auth/roles";
import { resolveActiveListingPersonaServer } from "@/lib/auth/resolve-active-listing-persona-server";
import { resolveCurrentAuthRole } from "@/lib/auth/session";

export default async function ProfileGateway() {
  const role = await resolveCurrentAuthRole();

  if (role === "GUEST") {
    redirect("/auth");
  }

  const persona = await resolveActiveListingPersonaServer();
  redirect(getProfileHomePath(role, persona));
}
