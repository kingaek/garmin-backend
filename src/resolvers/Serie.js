function products({ id }, _, { prisma }, { variableValues }) {
  if (variableValues.hasProducts === false) return null;
  return prisma.serie.findUnique({ where: { id } }).products();
}

const Serie = {
  products,
};

export default Serie;
