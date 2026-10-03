import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const assets = path.resolve(
  "C:/Users/Muhamad Adam/.cursor/projects/d-tracking-iot/assets",
);

const markSrc = path.join(
  assets,
  "c__Users_Muhamad_Adam_AppData_Roaming_Cursor_User_workspaceStorage_4402e9b7b2ee46ac42b47188420fa9c8_images_Emblem_Neon_Hutan_Futuristik-removebg-preview-c06541b1-2d84-463f-a7b1-9567defade6b.png",
);
const wordSrc = path.join(
  assets,
  "c__Users_Muhamad_Adam_AppData_Roaming_Cursor_User_workspaceStorage_4402e9b7b2ee46ac42b47188420fa9c8_images_image-e517bc4c-2bdc-48ce-9dee-d658a69805f0.png",
);

const markOut = path.join(root, "public/images/traxon-mark.png");
const wordOut = path.join(root, "public/images/traxon-wordmark.png");

fs.copyFileSync(markSrc, markOut);

{
  const { data, info } = await sharp(wordSrc).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let kept = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const isGreen = g > 80 && g > r + 20 && g > b + 20;
    const isLetter = max >= 70;
    if (!isGreen && !isLetter) data[i + 3] = 0;
    else kept += 1;
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(wordOut);
  console.log("wordmark kept", kept, "of", info.width * info.height);
}

{
  const { data, info } = await sharp(markOut).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let fringe = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a > 0 && r > 200 && g > 200 && b > 200) {
      data[i + 3] = 0;
      fringe += 1;
    }
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(markOut);
  console.log("mark fringe removed", fringe);
}
