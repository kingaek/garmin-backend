import { AuthenticationError, ForbiddenError } from "apollo-server-core";
import { cartItem, signToken, updateCartItems } from "../utils";
import currency from "currency.js";

async function login(_, { username }, { prisma, res, cookies }) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw new AuthenticationError(`${username} doesn't exist`);

  const { refresh_token, expires_in } = signToken(user.id);

  res.cookie("refresh_token", refresh_token, {
    httpOnly: true,
    sameSite: "strict",
    secure: true,
    // signed: true,
    maxAge: expires_in,
  });

  const authedCart = await prisma.cart.findUnique({
    where: { id: user.cartId },
    include: { cartItems: true },
  });

  let totalQuantity = authedCart.cartItems.reduce((acc, item) => {
    acc += item.quantity;
    return acc;
  }, 0);

  if (cookies?.cartId) {
    const guestCart = await prisma.cart.findUnique({
      where: { id: cookies.cartId },
      include: { cartItems: true },
    });

    const cartItemIds = guestCart.cartItems?.map((item) => ({ id: item.id }));

    totalQuantity += guestCart.cartItems.reduce((acc, item) => {
      acc += item.quantity;
      return acc;
    }, 0);

    const totalPrice = currency(guestCart.subtotal).add(authedCart.subtotal);

    await prisma.cart.update({
      where: { id: guestCart.id },
      data: {
        cartItems: { disconnect: cartItemIds },
      },
    });

    await prisma.cart.update({
      where: { id: user.cartId },
      data: {
        subtotal: totalPrice.value,
        formattedSubtotal: `$${totalPrice.value} USD`,
        estimatedTotal: totalPrice.value,
        formattedEstimatedTotal: `$${totalPrice.value} USD`,
        cartItems: { connect: cartItemIds },
      },
    });

    await prisma.cart.delete({ where: { id: guestCart.id } });

    res.clearCookie("cartId");
  }

  return {
    user,
    totalQuantity,
    refresh_token,
    expires_in,
  };
}

async function refreshToken(_, __, { prisma, userId, res }) {
  if (!userId) {
    return {
      user: null,
      refresh_token: null,
      expires_in: null,
    };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AuthenticationError(`user doesn't authenticated`);

  const { refresh_token, expires_in } = signToken(userId);

  res.cookie("refresh_token", refresh_token, {
    httpOnly: true,
    sameSite: "strict",
    secure: true,
    // signed: true,
    maxAge: expires_in,
  });

  return {
    user,
    refresh_token,
    expires_in,
  };
}

function logout(_, __, { res }) {
  res.clearCookie("refresh_token");
  return {
    message: "You have been successfully logged out",
  };
}

async function fetchOrcreateCart(
  _,
  __,
  { prisma, userId, res, cookies, cartId }
) {
  const guestCartId = cookies?.cartId;

  if (userId) {
    const cart = await prisma.cart.findUnique({ where: { id: cartId } });
    if (!cart)
      throw new UserInputError(
        `${user.name} with the id ${user.id} must has a cart`
      );
    return cart;
  }

  if (guestCartId) {
    const cart = await prisma.cart.findUnique({ where: { id: guestCartId } });
    if (!cart) throw new UserInputError(`${guestCartId} is wrong input`);
    return cart;
  }

  const cart = await prisma.cart.create({
    data: {},
  });

  res.cookie("cartId", cart.id);

  return cart;
}

async function addItemToCart(
  _,
  { item, price },
  { prisma, userId, res, cookies, cartId }
) {
  const guestCartId = cookies?.cartId;

  if (!guestCartId && !userId) {
    const cart = await prisma.cart.create({
      data: {
        subtotal: price,
        formattedSubtotal: `$${price} USD`,
        estimatedTotal: price,
        formattedEstimatedTotal: `$${price} USD`,
        cartItems: {
          create: [cartItem(item)],
        },
      },
    });

    res.cookie("cartId", cart.id);

    return cart;
  }

  const cart = await prisma.cart.findUnique({
    where: { id: cartId || guestCartId },
  });

  const totalPrice = currency(cart.subtotal).add(currency(price));

  return prisma.cart.update({
    where: { id: cartId || guestCartId },
    data: {
      subtotal: totalPrice.value,
      formattedSubtotal: `$${totalPrice.value} USD`,
      estimatedTotal: totalPrice.value,
      formattedEstimatedTotal: `$${totalPrice.value} USD`,
      cartItems: {
        create: [cartItem(item)],
      },
    },
  });
}

async function updateCart(_, { cartId, item }, { prisma, cookies, userId }) {
  if (!userId && !cookies?.cartId)
    throw new ForbiddenError("Forbidden Request");

  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { cartItems: { include: { product: true } } },
  });

  let totalPrice =
    cart.cartItems.length > 1
      ? cart.cartItems
          .filter((cartItem) => cartItem.id !== item.itemId)
          .reduce(
            (acc, item) =>
              currency(acc).add(
                currency(item.product.price).multiply(item.quantity)
              ),
            0
          )
      : { value: 0 };

  totalPrice = currency(totalPrice.value).add(
    currency(item.price).multiply(item.quantity)
  );

  return prisma.cart.update({
    where: { id: cartId },
    data: {
      subtotal: totalPrice.value,
      formattedSubtotal: `$${totalPrice.value} USD`,
      estimatedTotal: totalPrice.value,
      formattedEstimatedTotal: `$${totalPrice.value} USD`,
      cartItems: {
        update: {
          where: { id: item.itemId },
          data: {
            quantity: item.quantity,
          },
        },
      },
    },
  });
}

async function deletecartItem(_, { itemId }, { prisma, cookies, cartId }) {
  const deletedItem = await prisma.cartItem.delete({
    where: { id: itemId },
    include: { product: true },
  });

  const cart = await prisma.cart.findUnique({
    where: { id: cartId || cookies?.cartId },
  });

  const deletedItemPrice = currency(deletedItem.product.price).multiply(
    deletedItem.quantity
  );

  const totalPrice = currency(cart.subtotal).subtract(deletedItemPrice.value);

  await prisma.cart.update({
    where: { id: cart.id },
    data: {
      subtotal: totalPrice.value,
      formattedSubtotal: `$${totalPrice.value} USD`,
      estimatedTotal: totalPrice.value,
      formattedEstimatedTotal: `$${totalPrice.value} USD`,
    },
  });

  return { quantity: deletedItem.quantity };
}

async function signup(_, { username }, { prisma, res, cookies }) {
  const user = await prisma.user.create({
    data: { username, role: "Customer", cart: { create: {} } },
  });

  const { refresh_token, expires_in } = signToken(user.id);

  res.cookie("refresh_token", refresh_token, {
    httpOnly: true,
    sameSite: "strict",
    secure: true,
    // signed: true,
    maxAge: expires_in,
  });

  const authedCart = await prisma.cart.findUnique({
    where: { id: user.cartId },
    include: { cartItems: true },
  });

  let totalQuantity = authedCart.cartItems.reduce((acc, item) => {
    acc += item.quantity;
    return acc;
  }, 0);

  if (cookies?.cartId) {
    const guestCart = await prisma.cart.findUnique({
      where: { id: cookies.cartId },
      include: { cartItems: true },
    });

    const cartItemIds = guestCart.cartItems?.map((item) => ({ id: item.id }));

    totalQuantity += guestCart.cartItems.reduce((acc, item) => {
      acc += item.quantity;
      return acc;
    }, 0);

    const totalPrice = currency(guestCart.subtotal).add(authedCart.subtotal);

    await prisma.cart.update({
      where: { id: guestCart.id },
      data: {
        cartItems: { disconnect: cartItemIds },
      },
    });

    await prisma.cart.update({
      where: { id: user.cartId },
      data: {
        subtotal: totalPrice.value,
        formattedSubtotal: `$${totalPrice.value} USD`,
        estimatedTotal: totalPrice.value,
        formattedEstimatedTotal: `$${totalPrice.value} USD`,
        cartItems: { connect: cartItemIds },
      },
    });

    await prisma.cart.delete({ where: { id: guestCart.id } });

    res.clearCookie("cartId");
  }

  return {
    user,
    totalQuantity,
    refresh_token,
    expires_in,
  };
}

// function createOrder(_, { products }, { prisma, res }) {}

const Mutation = {
  login,
  refreshToken,
  logout,
  fetchOrcreateCart,
  addItemToCart,
  updateCart,
  deletecartItem,
  signup,
};

export default Mutation;
