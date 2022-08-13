function features({ id }, _, { prisma }) {
  return prisma.product.findUnique({ where: { id } }).features();
}

function models({ id }, _, { prisma }) {
  return prisma.product.findUnique({ where: { id } }).models();
}

const Product = {
  features,
  models,
};

export default Product;
