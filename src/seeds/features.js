import featureds from "../../static/data/featureds";

export const createFeatureds = async (collection) => {
  console.log("Featureds seed is creating...");
  for (let featured of featureds) {
    await collection.upsert({
      where: {
        title: featured.title,
      },
      update: {},
      create: featured,
    });
  }
  console.log("Featureds seed is created");
};
