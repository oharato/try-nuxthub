import { useDrizzle, tables } from "../../utils/drizzle";
import { ensureSeedData } from "../../utils/seed";

export default defineCachedEventHandler(
  async (event) => {
    await ensureSeedData();
    const db = useDrizzle();
    const query = getQuery(event);
    const categorySlug = query.category as string | undefined;
    const search = query.search as string | undefined;
    const sort = query.sort as string | undefined;

    // Fetch all categories to map
    const allCategories = await db.select().from(tables.categories);
    const categoryMap = new Map(allCategories.map((c) => [c.id, c]));

    // Query products
    const allProducts = await db.select().from(tables.products);

    // Fetch images and reviews to enrich
    const allImages = await db.select().from(tables.productImages);
    const allReviews = await db.select().from(tables.reviews);

    const imagesByProductId = new Map<number, typeof allImages>();
    for (const img of allImages) {
      if (!imagesByProductId.has(img.productId)) {
        imagesByProductId.set(img.productId, []);
      }
      imagesByProductId.get(img.productId)!.push(img);
    }

    const reviewsByProductId = new Map<number, typeof allReviews>();
    for (const rev of allReviews) {
      if (!reviewsByProductId.has(rev.productId)) {
        reviewsByProductId.set(rev.productId, []);
      }
      reviewsByProductId.get(rev.productId)!.push(rev);
    }

    let filtered = allProducts.filter((p) => p.isPublished);

    if (categorySlug) {
      const targetCat = allCategories.find((c) => c.slug === categorySlug);
      if (targetCat) {
        filtered = filtered.filter((p) => p.categoryId === targetCat.id);
      }
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)),
      );
    }

    if (sort === "price_asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sort === "price_desc") {
      filtered.sort((a, b) => b.price - a.price);
    } else {
      // Default: newest
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const enriched = filtered.map((product) => {
      const category = categoryMap.get(product.categoryId);
      const images = (imagesByProductId.get(product.id) || []).sort(
        (a, b) => a.displayOrder - b.displayOrder,
      );
      const reviews = reviewsByProductId.get(product.id) || [];
      const averageRating =
        reviews.length > 0
          ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
          : 0;

      return {
        ...product,
        category: category ? { id: category.id, name: category.name, slug: category.slug } : null,
        images,
        mainImage: images[0]?.blobKey || null,
        reviewCount: reviews.length,
        averageRating,
      };
    });

    return enriched;
  },
  {
    maxAge: 60,
    name: "products-list",
    getKey: (event) => `products:${getRequestURL(event).search || "all"}`,
  },
);
