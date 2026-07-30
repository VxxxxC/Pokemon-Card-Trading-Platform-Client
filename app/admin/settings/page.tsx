import { requireAdminRole } from "@/app/actions/admin-settings";
import { AdminSettingsClient } from "./AdminSettingsClient";

export default async function AdminSettingsPage() {
  const adminData = await requireAdminRole();

  return <AdminSettingsClient initialData={adminData} />;
}
