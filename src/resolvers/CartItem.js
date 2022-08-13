function product({ id }, _, { prisma }) {
  return prisma.cartItem.findUnique({ where: { id } }).product();
}

function model({ id }, _, { prisma }) {
  return prisma.cartItem.findUnique({ where: { id } }).model();
}

function features({ id }, _, { prisma }) {
  return prisma.cartItem.findUnique({ where: { id } }).features();
}

const CartItem = {
  product,
  model,
  features,
};

export default CartItem;
