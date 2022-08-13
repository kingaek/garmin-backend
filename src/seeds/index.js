import { createBanners } from "./banners";
import { createFeatureds } from "./features";
import { createPods } from "./pods";
import { createProducts } from "./products";
import { createUsers } from "./users";

const createSeed = async (prisma) => {
  await Promise.all([
    createBanners(prisma.banner),
    createFeatureds(prisma.featured),
    createPods(prisma.pod),
    createProducts(prisma),
    createUsers(prisma.user),
  ]);
};

export default createSeed;
