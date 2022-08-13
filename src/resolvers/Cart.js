function cartItems({ id }, _, { prisma }) {
  return prisma.cart.findUnique({ where: { id } }).cartItems();
}

const Cart = {
  cartItems,
};

export default Cart;
