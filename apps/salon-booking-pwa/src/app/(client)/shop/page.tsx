import { getShopProducts } from "@/lib/data/catalog";
import { ShopClient } from "./shop-client";

export default async function ShopPage() {
  const products = await getShopProducts();
  return <ShopClient products={products} />;
}
