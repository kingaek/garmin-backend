import banners from "../../static/data/banners";

export const createBanners = async (collection) => {
  console.log("Banners seed is creating...");
  for (let banner of banners) {
    await collection.upsert({
      where: {
        title: banner.title,
      },
      update: {},
      create: banner,
    });
  }
  console.log("Banners seed is created");
};
