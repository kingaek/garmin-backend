function cart({ id }, _, { prisma }) {
  return prisma.user.findUnique({ where: { id } }).cart();
}

const Customer = {
  cart,
};

export default Customer;
