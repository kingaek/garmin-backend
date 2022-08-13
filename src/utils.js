import { AuthenticationError } from "apollo-server-core";
import jwt from "jsonwebtoken";

export const APP_SECRET = "App-secret";
export const expires_in = 90 * 24 * 60 * 60 * 1000;

export function getTokenPayload(token) {
  try {
    const payload = jwt.verify(token, APP_SECRET);
    return payload;
  } catch (error) {
    console.log(error);
  }
}

export function generatePayload(sub) {
  return { sub, iat: Date.now() };
}

export function signToken(sub) {
  const refresh_token = jwt.sign(generatePayload(sub), APP_SECRET, {
    expiresIn: expires_in,
  });

  return { refresh_token, expires_in };
}

// export async function getUserId(userQuery, req) {
//   if (req) {
//     const token = req.signedCookies.refresh_token;
//     if (!token) throw new AuthenticationError("No token found");
//     const { sub: userId } = getTokenPayload(token);
//     const { role: userRole } = await userQuery.findUnique({
//       where: { id: userId },
//     });
//     return { userId, userRole };
//   }

//   throw new AuthenticationError("Not authenticated");
// }

export async function getUserId(userQuery, req, authToken) {
  if (req) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      if (!token) {
        return { userId: null, userRole: null };
      }
      const payload = getTokenPayload(token);
      if (!payload.sub) {
        return { userId: null, userRole: null };
      }
      const { role: userRole, cartId } = await userQuery.findUnique({
        where: { id: payload.sub },
      });
      return { userId: payload.sub, userRole, cartId, token };
    }
  } else if (authToken) {
    const { userId } = getTokenPayload(authToken);
    const user = await userQuery.findUnique({
      where: { id: userId },
    });
    return { userId, userRole: user.role, cartId: user.cartId, token };
  }

  return { userId: null, userRole: null };
}

export async function getDynamicContext(userQuery, ctx) {
  const authHeader = ctx.connectionParams.Authorization;
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    throw new AuthenticationError("No token found");
  }
  const { userId, userRole } = await getUserId(userQuery, undefined, token);
  return { userId, userRole };
}

export const updateCartItems = ({ id, item, cartQueryUpdate }) =>
  cartQueryUpdate({
    where: { id },
    data: {
      cartItems: {
        create: [item],
      },
    },
  });

export const cartItem = (item) => {
  const createdItem = {
    product: { connect: { id: item.productId } },
  };
  if (item.modelId) createdItem.model = { connect: { id: item.modelId } };
  if (item.features) {
    /*
      create or connect (to do later)
      feature.name
      feature.item
    */
    createdItem.features = { create: [...item.features] };
  }
  return createdItem;
};
