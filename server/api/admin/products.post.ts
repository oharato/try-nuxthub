import { blob } from "hub:blob";
import { useDrizzle, tables } from "../../utils/drizzle";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session?.user || (session.user as any).role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "管理者権限が必要です。" });
  }

  const contentType = getHeader(event, "content-type") || "";
  const db = useDrizzle();

  let name = "";
  let slug = "";
  let categoryId = 1;
  let price = 0;
  let stockQuantity = 0;
  let description = "";
  let isPublished = true;
  const imageFiles: File[] = [];

  if (contentType.includes("multipart/form-data")) {
    const formData = await readFormData(event);
    name = String(formData.get("name") || "");
    slug = String(formData.get("slug") || "");
    categoryId = Number(formData.get("categoryId") || 1);
    price = Number(formData.get("price") || 0);
    stockQuantity = Number(formData.get("stockQuantity") || 0);
    description = String(formData.get("description") || "");
    isPublished = formData.get("isPublished") === "true" || formData.get("isPublished") === "1";

    const files = formData.getAll("images");
    for (const f of files) {
      if (f instanceof File && f.size > 0) {
        imageFiles.push(f);
      }
    }
  } else {
    const body = await readBody(event);
    name = body.name;
    slug = body.slug;
    categoryId = Number(body.categoryId || 1);
    price = Number(body.price || 0);
    stockQuantity = Number(body.stockQuantity || 0);
    description = body.description || "";
    isPublished = body.isPublished !== false;
  }

  if (!name || !slug || !price) {
    throw createError({
      statusCode: 400,
      statusMessage: "商品名、スラッグ、価格は必須項目です。",
    });
  }

  // Insert product
  const [createdProduct] = await db
    .insert(tables.products)
    .values({
      categoryId,
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description: description.trim(),
      price,
      stockQuantity,
      isPublished,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  if (!createdProduct) {
    throw createError({
      statusCode: 500,
      statusMessage: "商品の作成に失敗しました。",
    });
  }

  // Handle image uploads
  let displayOrder = 1;
  for (const file of imageFiles) {
    const safeFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const blobKey = `products/${createdProduct.id}/${safeFilename}`;

    await blob.put(blobKey, file, {
      addRandomSuffix: false,
    });

    await db.insert(tables.productImages).values({
      productId: createdProduct.id,
      blobKey,
      filename: file.name,
      displayOrder: displayOrder++,
      createdAt: new Date(),
    });
  }

  return { success: true, product: createdProduct };
});
