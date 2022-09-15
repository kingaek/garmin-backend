import { ApolloServer } from "apollo-server-express";
import { createServer } from "http";
import express from "express";
import fs from "fs";
import path from "path";
import cookieParser from "cookie-parser";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { PrismaClient } from "@prisma/client";

import resolvers from "./resolvers";
import { APP_SECRET, getUserId } from "./utils";

const typeDefs = fs.readFileSync(
  path.join(__dirname, "schema.graphql"),
  "utf8"
);

const prisma = new PrismaClient();

async function main() {
  const app = express();
  const httpServer = createServer(app);

  app.use(cookieParser(APP_SECRET));

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  const server = new ApolloServer({
    schema,
    csrfPrevention: true,
    cache: "bounded",
    context: async ({ req, res }) => {
      const user =
        req && req.headers.authorization && (await getUserId(prisma.user, req));

      return {
        ...req,
        res,
        prisma,
        pubsub,
        userId: user ? user.userId : null,
        userRole: user ? user.userRole : null,
        token: user ? user.token : null,
        cartId: user ? user.cartId : null,
      };
    },
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();
  server.applyMiddleware({
    app,
    path: "/graphql",
    cors: {
      credentials: true,
      origin: ["https://garmin-website.netlify.app"],
    },
  });

  await new Promise((resolve) =>
    httpServer.listen({ port: process.env.PORT || 4001 }, resolve)
  );
  console.log(
    `🚀 Server ready at http://localhost:${process.env.PORT || 4001}${
      server.graphqlPath
    }`
  );
}

main();
