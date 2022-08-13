import categories from "../../static/data/categories";
import series from "../../static/data/series";
import products from "../../static/data/products";

const createNew = async (data, unique, collection) => {
  if (!(Array.isArray(data) && data.length > 0)) return;
  const items = [];
  for (let item of data) {
    const existItem = await collection.findUnique({
      where: { [unique]: item[unique] },
    });
    if (!existItem) {
      items.push(item);
    }
  }
  return {
    create: items,
  };
};

const createMany = (data) => ({
  create: data,
});

const createProductsBySerie = async (serieName, categoryName, prisma) => {
  if (!products[categoryName][serieName])
    throw new Error(`${serieName} doesn't exist in ${categoryName}`);

  const newProducts = [];

  for (let product of products[categoryName][serieName]) {
    const { features, models, ...others } = product;

    const existProduct = await prisma.product.findUnique({
      where: { name: product.name },
    });

    if (!existProduct)
      newProducts.push({
        ...others,
        features: createMany(features),
        models: createMany(models),
      });
  }

  return newProducts;
};

const createSeries = async (categoryName, prisma) => {
  if (!series[categoryName])
    throw new Error(`${categoryName} doesn't exist in Series`);

  const category = await prisma.category.findUnique({
    where: { name: categoryName },
    include: {
      series: true,
    },
  });

  const filtredSeries = category
    ? series[categoryName].filter(
        (serie) =>
          !category.series.find((existSerie) => serie.name === existSerie.name)
      )
    : undefined;

  const newSeries = [];

  for (let serie of filtredSeries || series[categoryName]) {
    const newProducts = await createProductsBySerie(
      serie.name,
      categoryName,
      prisma
    );

    const createdProducts = await createNew(
      newProducts,
      "name",
      prisma.product
    );

    newSeries.push({
      name: serie.name,
      products: createdProducts,
    });
  }

  return newSeries;
};

export const createProducts = async (prisma) => {
  console.log("Products seed is creating...");
  for (let category of categories) {
    const { coverImgsList, ...others } = category;

    const createdCoverImgsList = await createNew(
      category.coverImgsList,
      "title",
      prisma.coverImgList
    );

    const newSeries = await createSeries(category.name, prisma);

    const createdseries = await createMany(newSeries);

    await prisma.category.upsert({
      where: {
        name: others.name,
      },
      update: {},
      create: {
        ...others,
        coverImgsList: createdCoverImgsList,
        series: createdseries,
      },
    });
  }

  console.log("Products seed is created");
};
