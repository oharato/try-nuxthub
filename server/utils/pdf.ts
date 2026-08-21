import { PDFDocument, rgb, StandardFonts, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { blob } from "hub:blob";
import type { Order } from "./drizzle";
import fs from "node:fs";

export interface ReceiptItemDetail {
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
}

let cachedFontBytes: Uint8Array | null = null;

async function loadNotoSansFontBytes(): Promise<Uint8Array | null> {
  if (cachedFontBytes) {
    return cachedFontBytes;
  }

  // 1. Try Nitro Server Assets
  try {
    const asset = await useStorage("assets:server").getItemRaw("fonts/NotoSansJP.ttf");
    if (asset) {
      if (asset instanceof Uint8Array) {
        cachedFontBytes = asset;
        return cachedFontBytes;
      }
      if (typeof asset === "string") {
        cachedFontBytes = Buffer.from(asset, "binary");
        return cachedFontBytes;
      }
    }
  } catch {
    // continue to fallback
  }

  // 2. Try Local File System paths (copied from modern-rails vendor/fonts)
  const fontPaths = [
    "./server/assets/fonts/NotoSansJP.ttf",
    "/home/oharato/workspace/try-nuxthub/server/assets/fonts/NotoSansJP.ttf",
    "/home/oharato/workspace/modern-rails/vendor/fonts/NotoSansJP.ttf",
  ];

  for (const fp of fontPaths) {
    try {
      if (fs.existsSync(fp)) {
        cachedFontBytes = fs.readFileSync(fp);
        return cachedFontBytes;
      }
    } catch {
      // ignore
    }
  }

  return null;
}

export async function generateAndStoreReceiptPdf(
  order: Order,
  items: ReceiptItemDetail[],
): Promise<string> {
  const pdfDoc = await PDFDocument.create();

  // Load Google Noto Sans JP Font with fontkit
  const fontBytes = await loadNotoSansFontBytes();
  let font: PDFFont;
  let isJapaneseSupported = false;

  if (fontBytes) {
    try {
      pdfDoc.registerFontkit(fontkit);
      font = await pdfDoc.embedFont(fontBytes);
      isJapaneseSupported = true;
    } catch (err) {
      console.warn("Failed to embed Noto Sans JP font, falling back to Helvetica:", err);
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }
  } else {
    font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }

  const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size in points
  const { width, height } = page.getSize();

  // Primary Theme Colors
  const primaryColor = rgb(0.08, 0.45, 0.65); // CraftCommerce deep blue
  const textColor = rgb(0.15, 0.2, 0.25);
  const lightGray = rgb(0.94, 0.96, 0.98);
  const borderGray = rgb(0.82, 0.86, 0.9);

  // Top header banner
  page.drawRectangle({
    x: 0,
    y: height - 80,
    width,
    height: 80,
    color: primaryColor,
  });

  page.drawText("CraftCommerce", {
    x: 40,
    y: height - 48,
    size: 22,
    font,
    color: rgb(1, 1, 1),
  });

  const headerTitle = isJapaneseSupported ? "ご購入領収書 (Official Receipt)" : "OFFICIAL RECEIPT";
  page.drawText(headerTitle, {
    x: width - 240,
    y: height - 46,
    size: 13,
    font,
    color: rgb(1, 1, 1),
  });

  let currentY = height - 115;

  // Order Details block
  page.drawText(isJapaneseSupported ? "■ 注文・決済情報" : "Receipt Details", {
    x: 40,
    y: currentY,
    size: 13,
    font,
    color: primaryColor,
  });
  currentY -= 20;

  const orderDate = new Date(order.createdAt).toISOString().replace("T", " ").substring(0, 19);

  const customerNameStr = isJapaneseSupported
    ? `${order.customerName} 様`
    : order.customerEmail.split("@")[0] || "Valued Customer";

  const details = [
    isJapaneseSupported ? `注文番号: ${order.orderNumber}` : `Order Number: ${order.orderNumber}`,
    isJapaneseSupported ? `発行日時: ${orderDate}` : `Date: ${orderDate}`,
    isJapaneseSupported ? `宛名: ${customerNameStr}` : `Customer: ${customerNameStr}`,
    isJapaneseSupported ? `メール: ${order.customerEmail}` : `Email: ${order.customerEmail}`,
    isJapaneseSupported
      ? `決済状態: 決済完了 (PAID - Mock Payment)`
      : `Status: PAID (Mock Payment)`,
  ];

  for (const line of details) {
    page.drawText(line, {
      x: 40,
      y: currentY,
      size: 10,
      font,
      color: textColor,
    });
    currentY -= 16;
  }

  currentY -= 12;

  // Items Table Header
  page.drawRectangle({
    x: 40,
    y: currentY - 6,
    width: width - 80,
    height: 24,
    color: lightGray,
    borderColor: borderGray,
    borderWidth: 1,
  });

  page.drawText(isJapaneseSupported ? "商品名 / 仕様" : "Item / Product", {
    x: 50,
    y: currentY,
    size: 10,
    font,
    color: textColor,
  });
  page.drawText(isJapaneseSupported ? "単価 (税込)" : "Price", {
    x: 320,
    y: currentY,
    size: 10,
    font,
    color: textColor,
  });
  page.drawText(isJapaneseSupported ? "数量" : "Qty", {
    x: 410,
    y: currentY,
    size: 10,
    font,
    color: textColor,
  });
  page.drawText(isJapaneseSupported ? "小計 (税込)" : "Subtotal", {
    x: 470,
    y: currentY,
    size: 10,
    font,
    color: textColor,
  });

  currentY -= 26;

  // Table rows
  let itemIndex = 1;
  for (const item of items) {
    const rawName = isJapaneseSupported ? item.productName : `Craft Item #${itemIndex}`;
    const displayName = rawName.length > 28 ? rawName.substring(0, 26) + "..." : rawName;

    page.drawText(displayName, {
      x: 50,
      y: currentY,
      size: 9.5,
      font,
      color: textColor,
    });

    page.drawText(`¥${item.price.toLocaleString()}`, {
      x: 320,
      y: currentY,
      size: 9.5,
      font,
      color: textColor,
    });

    page.drawText(`${item.quantity}`, {
      x: 415,
      y: currentY,
      size: 9.5,
      font,
      color: textColor,
    });

    page.drawText(`¥${item.subtotal.toLocaleString()}`, {
      x: 470,
      y: currentY,
      size: 9.5,
      font,
      color: textColor,
    });

    // Row divider line
    page.drawLine({
      start: { x: 40, y: currentY - 6 },
      end: { x: width - 40, y: currentY - 6 },
      color: borderGray,
      thickness: 0.5,
    });

    currentY -= 22;
    itemIndex++;
  }

  currentY -= 15;

  // Total summary box
  page.drawRectangle({
    x: width - 260,
    y: currentY - 30,
    width: 220,
    height: 40,
    color: lightGray,
    borderColor: borderGray,
    borderWidth: 1,
  });

  page.drawText(isJapaneseSupported ? "合計金額 (税込):" : "Total Amount:", {
    x: width - 250,
    y: currentY - 14,
    size: 10,
    font,
    color: textColor,
  });

  page.drawText(`¥${order.totalAmount.toLocaleString()}`, {
    x: width - 130,
    y: currentY - 16,
    size: 14,
    font,
    color: primaryColor,
  });

  currentY -= 65;

  // Footer notes
  const footerThanks = isJapaneseSupported
    ? "CraftCommerce をご利用いただき誠にありがとうございます。"
    : "Thank you for choosing CraftCommerce.";
  const footerNote = isJapaneseSupported
    ? "※ 本領収書は決済完了時に電子的に自動発行されたものです。"
    : "This receipt is generated automatically upon payment completion.";

  page.drawText(footerThanks, {
    x: 40,
    y: currentY,
    size: 9,
    font,
    color: textColor,
  });
  page.drawText(footerNote, {
    x: 40,
    y: currentY - 14,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Save PDF bytes
  const pdfBytes = await pdfDoc.save();

  // Store into Cloudflare R2 Blob Storage
  const receiptBlobKey = `receipts/${order.orderNumber}.pdf`;
  await blob.put(receiptBlobKey, pdfBytes, {
    contentType: "application/pdf",
    addRandomSuffix: false,
  });

  return receiptBlobKey;
}
