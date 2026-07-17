import { redirect } from "next/navigation";
import { getCollectionPageBootstrap } from "@/app/actions/collection";
import type { CollectionInitialData } from "@/app/lib/hooks/useCollection";
import { MEMBER_PERSONA_FEATURES_BLOCKED_ERROR } from "@/lib/auth/member-persona-features";
import { getOptionalAuthUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { UserCollectionClient } from "./UserCollectionClient";

export async function UserCollectionPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/auth");
  }

  const user = await getOptionalAuthUser();
  if (!user) {
    redirect("/auth");
  }

  const bootstrapResult = await getCollectionPageBootstrap({
    page: 1,
    filter: "all",
    query: "",
  });

  if (
    !bootstrapResult.success &&
    bootstrapResult.error === MEMBER_PERSONA_FEATURES_BLOCKED_ERROR
  ) {
    redirect("/profile/merchant");
  }

  const initialData: CollectionInitialData = bootstrapResult.success
    ? bootstrapResult.data
    : {};

  return (
    <UserCollectionClient
      initialData={initialData}
      bootstrapError={bootstrapResult.success ? undefined : bootstrapResult.error}
    />
  );
}
