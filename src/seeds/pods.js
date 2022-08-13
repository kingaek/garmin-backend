import pods from "../../static/data/pods";

export const createPods = async (collection) => {
  console.log("Pods seed is creating...");
  for (let pod of pods) {
    await collection.upsert({
      where: {
        title: pod.title,
      },
      update: {},
      create: pod,
    });
  }
  console.log("Pods seed is created");
};
