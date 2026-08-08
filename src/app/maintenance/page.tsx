import { getMaintenanceConfig } from "@/features/console/actions";
import { MaintenanceClient } from "@/app/maintenance/maintenance-client";

export const metadata = {
  title: "Under Maintenance | Pokémon GO Services & Marketplace",
  description: "We are currently undergoing scheduled maintenance and will be back soon.",
};

export default async function MaintenancePage() {
  const config = await getMaintenanceConfig();

  return (
    <MaintenanceClient
      contactEmail={config.contactEmail || "support@pokemongo.com"}
      maintenanceMode={config.maintenanceMode}
    />
  );
}
