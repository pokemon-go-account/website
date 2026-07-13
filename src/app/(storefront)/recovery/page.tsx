import connectDB from "@/lib/db";
import Product from "@/models/Product";
import { RecoveryClient } from "./recovery-client";
import { auth } from "@/auth";

export const revalidate = 0;

export default async function RecoveryPage() {
  await connectDB();
  const session = await auth();

  const productDoc = await Product.findOne({
    name: "Premium Pokémon GO Account Recovery Service",
  }).lean();

  const product = productDoc
    ? JSON.parse(JSON.stringify(productDoc))
    : {
        _id: "recovery-service-placeholder-id",
        name: "Premium Pokémon GO Account Recovery Service",
        price: 49.99,
        description:
          "Professional recovery and retrieval service for lost, banned, or compromised Pokémon GO accounts. 100% secure, manual review, and high success rate.",
        imageUrl: "/recovery-service.png",
      };

  return <RecoveryClient product={product} isLoggedIn={!!session?.user} />;
}
