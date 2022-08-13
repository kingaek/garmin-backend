async function series({ id }, _, { prisma }, { variableValues }) {
  if (variableValues.hasSeries === false) return null;
  const series = await prisma.category
    .findUnique({
      where: { id },
    })
    .series();

  if (!variableValues.serieId) return series;

  const serie = series.filter((serie) => serie.id === variableValues.serieId);

  return serie;
}

async function coverImgsList({ id }, _, { prisma }, { variableValues }) {
  if (variableValues.hasCoverImgsList === false) return null;
  const coverImgsList = await prisma.category
    .findUnique({
      where: { id },
    })
    .coverImgsList();

  return coverImgsList;
}

const Category = {
  series,
  coverImgsList,
};

export default Category;
