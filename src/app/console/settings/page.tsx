import { getMaintenanceConfig } from "@/features/console/actions";
import { SettingsClient } from "./settings-client";

export default async function SettingsConsolePage() {
  const configRes = await getMaintenanceConfig();

  return (
    <SettingsClient
      initialMaintenanceMode={configRes.maintenanceMode}
      initialContactEmail={configRes.contactEmail}
    />
  );
}
