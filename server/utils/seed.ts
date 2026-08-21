import { blob } from "hub:blob";
import { useDrizzle, tables } from "./drizzle";

function createProductSvg(title: string, category: string, color: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0.35"/>
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="#f8fafc"/>
    <rect x="40" y="40" width="720" height="520" rx="16" fill="url(#bg)" stroke="${color}" stroke-width="2"/>
    <circle cx="400" cy="240" r="80" fill="${color}" fill-opacity="0.2"/>
    <path d="M370 240 L400 200 L430 240 L415 240 L415 280 L385 280 L385 240 Z" fill="${color}"/>
    <text x="400" y="380" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="28" font-weight="bold" fill="#1e293b" text-anchor="middle">${title}</text>
    <text x="400" y="420" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="18" fill="#64748b" text-anchor="middle">${category} Collection • CraftCommerce</text>
  </svg>`;
}

let seedPromise: Promise<void> | null = null;

export function ensureSeedData(): Promise<void> {
  if (!seedPromise) {
    seedPromise = doEnsureSeedData().catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  return seedPromise;
}

async function doEnsureSeedData() {
  const db = useDrizzle();

  // 1. Check if products already seeded
  const existingProducts = await db.select().from(tables.products);
  if (existingProducts.length >= 8) {
    return;
  }

  console.log("🌱 Seeding CraftCommerce initial data...");

  // 2. Seed Users if missing
  const passwordHash = await hashPassword("password123");
  const existingUsers = await db.select().from(tables.users);

  let adminUser = existingUsers.find((u) => u.email === "admin@example.com");
  if (!adminUser) {
    [adminUser] = await db
      .insert(tables.users)
      .values({
        email: "admin@example.com",
        passwordDigest: passwordHash,
        name: "管理者",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
  }

  let customerUser = existingUsers.find((u) => u.email === "user@example.com");
  if (!customerUser) {
    [customerUser] = await db
      .insert(tables.users)
      .values({
        email: "user@example.com",
        passwordDigest: passwordHash,
        name: "一般 太郎",
        role: "customer",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
  }

  // 3. Seed Categories
  const categoryData = [
    {
      name: "クラフト・雑貨",
      slug: "craft-art",
      description: "手作りの温もりを感じる日用雑貨・アート作品",
    },
    {
      name: "木工家具",
      slug: "woodwork",
      description: "天然木を使用した丁寧な手仕事による家具・木工品",
    },
    {
      name: "陶芸・ガラス",
      slug: "ceramics",
      description: "職人の手打ちによる美しい陶器と繊細なガラス細工",
    },
    {
      name: "レザーアイテム",
      slug: "leather",
      description: "経年変化を楽しめる上質な本革製品",
    },
    {
      name: "デジタルアート・フォント",
      slug: "digital",
      description: "クリエイター制作のオリジナルフォント・デジタル素材",
    },
  ];

  const insertedCategories: Record<string, number> = {};
  for (const cat of categoryData) {
    const existing = await db
      .select()
      .from(tables.categories)
      .where(eq(tables.categories.slug, cat.slug));
    if (existing.length > 0 && existing[0]) {
      insertedCategories[cat.slug] = existing[0].id;
    } else {
      const [inserted] = await db.insert(tables.categories).values(cat).returning();
      if (inserted) {
        insertedCategories[cat.slug] = inserted.id;
      }
    }
  }

  // 4. Seed Products
  const productData = [
    {
      name: "手挽き信楽焼 削り出しマグカップ",
      slug: "handmade-ceramic-cup",
      categorySlug: "ceramics",
      price: 3800,
      stockQuantity: 8,
      isPublished: true,
      description:
        "土の質感をダイレクトに感じられる素朴で力強い風合いの削り出しマグカップです。一つひとつ職人が手作業で削り出した削ぎ目が手に馴染みます。",
      color: "#0284c7",
    },
    {
      name: "山桜のカッティングボード (Mサイズ)",
      slug: "cherry-wood-cutting-board",
      categorySlug: "woodwork",
      price: 6500,
      stockQuantity: 5,
      isPublished: true,
      description:
        "国産の山桜材を一枚板から削り出した贅沢なカッティングボード。硬く反りにくい材質で、使うほどに飴色へと変化します。オリーブオイル仕上げ。",
      color: "#d97706",
    },
    {
      name: "イタリアンレザー ミニマリストL字ジップ財布",
      slug: "leather-minimalist-wallet",
      categorySlug: "leather",
      price: 12800,
      stockQuantity: 3,
      isPublished: true,
      description:
        "トスカーナ産ベジタブルタンニンレザーを使用したコンパクトかつ機能的なL字ウォレット。お札、小銭、カード6枚をスマートに収納。",
      color: "#b45309",
    },
    {
      name: "藍染めオーガニックリネン トートバッグ",
      slug: "linen-indigo-tote-bag",
      categorySlug: "craft-art",
      price: 7200,
      stockQuantity: 12,
      isPublished: true,
      description:
        "伝統的な天然本藍染めを施した特厚リネンキャンバスのデイリートート。深みのある藍のグラデーションと丈夫な縫製が魅力です。",
      color: "#1d4ed8",
    },
    {
      name: "真鍮と無垢ウォルナットのコーヒードリッパースタンド",
      slug: "brass-coffee-dripper-stand",
      categorySlug: "craft-art",
      price: 15400,
      stockQuantity: 4,
      isPublished: true,
      description:
        "経年美化する真鍮パイプと北米産ブラックウォルナットを組み合わせた本格ドリップスタンド。高さ調節可能でサーバーに合わせて使えます。",
      color: "#eab308",
    },
    {
      name: "「宵待フォント」モダン日本語フォント（商用可）",
      slug: "minimal-modern-japanese-font",
      categorySlug: "digital",
      price: 4800,
      stockQuantity: 99,
      isPublished: true,
      description:
        "明朝体とゴシックの要素を融合させた、モダンで洗練されたOpenTypeフォントファミリー。Webサイトや広告デザインに最適。",
      color: "#8b5cf6",
    },
    {
      name: "宙吹きガラスの気泡フラワーベース",
      slug: "handblown-glass-vase",
      categorySlug: "ceramics",
      price: 8900,
      stockQuantity: 2,
      isPublished: true,
      description:
        "ガラス職人が息を吹き込みながら成形した、光を受けてきらめく一点物の花器。水を入れると細かな気泡が美しく浮かび上がります。",
      color: "#06b6d4",
    },
    {
      name: "真鍮ギボシ留め 4連レザーキーケース",
      slug: "handcrafted-leather-keycase",
      categorySlug: "leather",
      price: 4500,
      stockQuantity: 15,
      isPublished: true,
      description:
        "スマートキーもすっきり収まる立体構造の本革キーケース。真鍮製の金具と上質なオイルレザーのコンビネーション。",
      color: "#475569",
    },
  ];

  for (const item of productData) {
    const existing = await db
      .select()
      .from(tables.products)
      .where(eq(tables.products.slug, item.slug));
    if (existing.length > 0) continue;

    const categoryId = insertedCategories[item.categorySlug] || 1;
    const [product] = await db
      .insert(tables.products)
      .values({
        categoryId,
        name: item.name,
        slug: item.slug,
        description: item.description,
        price: item.price,
        stockQuantity: item.stockQuantity,
        isPublished: item.isPublished,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (product) {
      // Store sample images in Blob and insert into product_images
      for (let i = 1; i <= 3; i++) {
        const svgContent = createProductSvg(
          `${item.name} (${i === 1 ? "メイン" : `詳細${i}`})`,
          item.categorySlug,
          item.color,
        );
        const blobKey = `products/${product.id}/image-${i}.svg`;
        try {
          await blob.put(blobKey, svgContent, {
            contentType: "image/svg+xml",
            addRandomSuffix: false,
          });
        } catch {
          // ignore
        }

        await db.insert(tables.productImages).values({
          productId: product.id,
          blobKey,
          filename: `image-${i}.svg`,
          displayOrder: i,
          createdAt: new Date(),
        });
      }

      // Insert sample reviews
      if (customerUser) {
        if (item.slug === "handmade-ceramic-cup") {
          await db.insert(tables.reviews).values({
            userId: customerUser.id,
            productId: product.id,
            rating: 5,
            comment:
              "手に馴染む重みと温かみがあり、毎朝のコーヒータイムが楽しみになりました！削り出しの模様がとても綺麗です。",
            createdAt: new Date(),
          });
        } else if (item.slug === "cherry-wood-cutting-board") {
          await db.insert(tables.reviews).values({
            userId: customerUser.id,
            productId: product.id,
            rating: 5,
            comment:
              "刃当たりが柔らかく、包丁に優しいです。木目も美しくてキッチンに立てかけておくだけで絵になります。",
            createdAt: new Date(),
          });
        } else if (item.slug === "leather-minimalist-wallet") {
          await db.insert(tables.reviews).values({
            userId: customerUser.id,
            productId: product.id,
            rating: 4,
            comment: "革の良い香りがします。キャッシュレスメインの生活にジャストなサイズ感でした。",
            createdAt: new Date(),
          });
        }
      }
    }
  }

  console.log("✅ Seed completed successfully!");
}
