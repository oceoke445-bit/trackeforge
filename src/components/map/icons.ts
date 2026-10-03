import type { Map } from "maplibre-gl";

function makeIcon(draw: (ctx: CanvasRenderingContext2D, size: number) => void, size = 72) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");
  draw(ctx, size);
  return ctx.getImageData(0, 0, size, size);
}

function upsertImage(map: Map, id: string, image: ImageData) {
  if (map.hasImage(id)) map.updateImage(id, image);
  else map.addImage(id, image, { pixelRatio: 2 });
}

/** Side-profile assault rifle — readable inside map marker circles. */
function drawAssaultRifle(ctx: CanvasRenderingContext2D, size: number) {
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#ffffff";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const x = (n: number) => size * n;
  const y = (n: number) => size * n;

  // Stock
  ctx.beginPath();
  ctx.moveTo(x(0.08), y(0.42));
  ctx.lineTo(x(0.22), y(0.42));
  ctx.lineTo(x(0.26), y(0.48));
  ctx.lineTo(x(0.22), y(0.58));
  ctx.lineTo(x(0.08), y(0.62));
  ctx.closePath();
  ctx.fill();

  // Receiver + handguard
  ctx.beginPath();
  ctx.moveTo(x(0.22), y(0.4));
  ctx.lineTo(x(0.58), y(0.4));
  ctx.lineTo(x(0.6), y(0.48));
  ctx.lineTo(x(0.58), y(0.54));
  ctx.lineTo(x(0.26), y(0.54));
  ctx.lineTo(x(0.22), y(0.48));
  ctx.closePath();
  ctx.fill();

  // Barrel
  ctx.fillRect(x(0.58), y(0.44), x(0.3), y(0.055));
  // Muzzle tip
  ctx.fillRect(x(0.86), y(0.43), x(0.06), y(0.075));

  // Front sight
  ctx.fillRect(x(0.72), y(0.34), x(0.035), y(0.12));

  // Optic / carry handle
  ctx.beginPath();
  ctx.moveTo(x(0.34), y(0.34));
  ctx.lineTo(x(0.5), y(0.34));
  ctx.lineTo(x(0.5), y(0.4));
  ctx.lineTo(x(0.34), y(0.4));
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = Math.max(2, size * 0.04);
  ctx.beginPath();
  ctx.moveTo(x(0.36), y(0.34));
  ctx.quadraticCurveTo(x(0.42), y(0.26), x(0.48), y(0.34));
  ctx.stroke();

  // Magazine
  ctx.beginPath();
  ctx.moveTo(x(0.36), y(0.54));
  ctx.lineTo(x(0.46), y(0.54));
  ctx.lineTo(x(0.48), y(0.78));
  ctx.lineTo(x(0.34), y(0.78));
  ctx.closePath();
  ctx.fill();

  // Pistol grip
  ctx.beginPath();
  ctx.moveTo(x(0.26), y(0.54));
  ctx.lineTo(x(0.34), y(0.54));
  ctx.lineTo(x(0.32), y(0.76));
  ctx.lineTo(x(0.24), y(0.76));
  ctx.closePath();
  ctx.fill();
}

function drawPistol(ctx: CanvasRenderingContext2D, size: number) {
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#ffffff";
  ctx.lineJoin = "round";

  const x = (n: number) => size * n;
  const y = (n: number) => size * n;

  // Slide / barrel
  ctx.beginPath();
  ctx.moveTo(x(0.22), y(0.32));
  ctx.lineTo(x(0.82), y(0.32));
  ctx.lineTo(x(0.86), y(0.38));
  ctx.lineTo(x(0.86), y(0.48));
  ctx.lineTo(x(0.22), y(0.48));
  ctx.closePath();
  ctx.fill();

  // Trigger guard ring
  ctx.lineWidth = Math.max(2.5, size * 0.05);
  ctx.strokeStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(x(0.36), y(0.48));
  ctx.lineTo(x(0.36), y(0.6));
  ctx.quadraticCurveTo(x(0.44), y(0.68), x(0.52), y(0.6));
  ctx.lineTo(x(0.52), y(0.48));
  ctx.stroke();

  // Grip
  ctx.beginPath();
  ctx.moveTo(x(0.22), y(0.48));
  ctx.lineTo(x(0.4), y(0.48));
  ctx.lineTo(x(0.36), y(0.82));
  ctx.lineTo(x(0.18), y(0.82));
  ctx.closePath();
  ctx.fill();
}

function drawLongGun(ctx: CanvasRenderingContext2D, size: number) {
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#ffffff";
  ctx.lineCap = "round";

  const x = (n: number) => size * n;
  const y = (n: number) => size * n;

  // Long barrel
  ctx.fillRect(x(0.12), y(0.44), x(0.74), y(0.06));
  // Muzzle brake
  ctx.fillRect(x(0.84), y(0.42), x(0.08), y(0.1));
  // Receiver
  ctx.fillRect(x(0.22), y(0.4), x(0.28), y(0.14));
  // Stock
  ctx.beginPath();
  ctx.moveTo(x(0.06), y(0.4));
  ctx.lineTo(x(0.22), y(0.42));
  ctx.lineTo(x(0.22), y(0.54));
  ctx.lineTo(x(0.06), y(0.6));
  ctx.closePath();
  ctx.fill();
  // Scope
  ctx.fillRect(x(0.3), y(0.28), x(0.2), y(0.1));
  ctx.beginPath();
  ctx.arc(x(0.3), y(0.33), size * 0.045, 0, Math.PI * 2);
  ctx.arc(x(0.5), y(0.33), size * 0.045, 0, Math.PI * 2);
  ctx.fill();
  // Magazine
  ctx.fillRect(x(0.34), y(0.54), x(0.1), y(0.2));
  // Grip
  ctx.beginPath();
  ctx.moveTo(x(0.24), y(0.54));
  ctx.lineTo(x(0.32), y(0.54));
  ctx.lineTo(x(0.3), y(0.76));
  ctx.lineTo(x(0.22), y(0.76));
  ctx.closePath();
  ctx.fill();
}

export function registerMapIcons(map: Map) {
  if (!map.hasImage("personnel-bell")) {
    map.addImage(
      "personnel-bell",
      makeIcon((ctx, size) => {
        ctx.clearRect(0, 0, size, size);
        ctx.strokeStyle = "#ffffff";
        ctx.fillStyle = "#ffffff";
        ctx.lineWidth = 3.2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(size * 0.28, size * 0.42);
        ctx.quadraticCurveTo(size * 0.28, size * 0.22, size * 0.5, size * 0.22);
        ctx.quadraticCurveTo(size * 0.72, size * 0.22, size * 0.72, size * 0.42);
        ctx.lineTo(size * 0.72, size * 0.58);
        ctx.lineTo(size * 0.82, size * 0.68);
        ctx.lineTo(size * 0.18, size * 0.68);
        ctx.lineTo(size * 0.28, size * 0.58);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(size * 0.5, size * 0.74, size * 0.07, Math.PI, 0);
        ctx.stroke();
      }),
      { pixelRatio: 2 },
    );
  }

  if (!map.hasImage("vehicle-car")) {
    map.addImage(
      "vehicle-car",
      makeIcon((ctx, size) => {
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.5;
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(size * 0.18, size * 0.58);
        ctx.lineTo(size * 0.28, size * 0.4);
        ctx.lineTo(size * 0.72, size * 0.4);
        ctx.lineTo(size * 0.84, size * 0.58);
        ctx.lineTo(size * 0.84, size * 0.68);
        ctx.lineTo(size * 0.18, size * 0.68);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(size * 0.32, size * 0.72, size * 0.07, 0, Math.PI * 2);
        ctx.arc(size * 0.68, size * 0.72, size * 0.07, 0, Math.PI * 2);
        ctx.fill();
      }),
      { pixelRatio: 2 },
    );
  }

  if (!map.hasImage("gateway-tower")) {
    map.addImage(
      "gateway-tower",
      makeIcon((ctx, size) => {
        ctx.clearRect(0, 0, size, size);
        ctx.strokeStyle = "#ffffff";
        ctx.fillStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(size * 0.5, size * 0.18);
        ctx.lineTo(size * 0.5, size * 0.78);
        ctx.moveTo(size * 0.32, size * 0.78);
        ctx.lineTo(size * 0.68, size * 0.78);
        ctx.moveTo(size * 0.5, size * 0.34);
        ctx.lineTo(size * 0.28, size * 0.48);
        ctx.moveTo(size * 0.5, size * 0.34);
        ctx.lineTo(size * 0.72, size * 0.48);
        ctx.moveTo(size * 0.5, size * 0.5);
        ctx.lineTo(size * 0.3, size * 0.64);
        ctx.moveTo(size * 0.5, size * 0.5);
        ctx.lineTo(size * 0.7, size * 0.64);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(size * 0.5, size * 0.2, size * 0.06, 0, Math.PI * 2);
        ctx.fill();
      }),
      { pixelRatio: 2 },
    );
  }

  upsertImage(map, "weapon-rifle", makeIcon(drawAssaultRifle));
  upsertImage(map, "weapon-pistol", makeIcon(drawPistol));
  upsertImage(map, "weapon-dmr", makeIcon(drawLongGun));
  // Alias used by Groups / legacy layers
  upsertImage(map, "weapon-icon", makeIcon(drawAssaultRifle));
}
