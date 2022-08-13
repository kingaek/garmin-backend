import users from "../../static/data/users";

export const createUsers = async (userCollection) => {
  console.log("Users seed is creating...");
  for (let user of users) {
    await userCollection.upsert({
      where: {
        username: user.username,
      },
      update: {},
      create: {
        ...user,
        cart:
          user.role === "Customer"
            ? {
                create: {},
              }
            : undefined,
      },
    });
  }
  console.log("Users seed is created");
};
