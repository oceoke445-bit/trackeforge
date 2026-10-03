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

function drawSoldierPin(ctx: CanvasRenderingContext2D, size: number, color: string) {
  ctx.clearRect(0, 0, size, size);
  const cx = size * 0.5;
  const cy = size * 0.36;
  const r = size * 0.26;

  ctx.save();
  ctx.globalAlpha = 0.55;
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.15);
  glow.addColorStop(0, color);
  glow.addColorStop(0.45, color);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 2.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.38, cy + r * 0.62);
  ctx.lineTo(cx + r * 0.38, cy + r * 0.62);
  ctx.lineTo(cx, size * 0.96);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  ctx.lineWidth = Math.max(2, size * 0.028);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.22, r * 0.28, Math.PI * 1.05, Math.PI * 1.95);
  ctx.lineTo(cx + r * 0.22, cy - r * 0.16);
  ctx.lineTo(cx - r * 0.22, cy - r * 0.16);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx, cy - r * 0.12, r * 0.4, r * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx - r * 0.46, cy + r * 0.58);
  ctx.quadraticCurveTo(cx - r * 0.5, cy + r * 0.16, cx - r * 0.16, cy + r * 0.08);
  ctx.lineTo(cx + r * 0.16, cy + r * 0.08);
  ctx.quadraticCurveTo(cx + r * 0.5, cy + r * 0.16, cx + r * 0.46, cy + r * 0.58);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.1, cy + r * 0.1);
  ctx.lineTo(cx, cy + r * 0.28);
  ctx.lineTo(cx + r * 0.1, cy + r * 0.1);
  ctx.closePath();
  ctx.fill();
}

function drawWeaponBadge(ctx: CanvasRenderingContext2D, size: number, color: string) {
  ctx.clearRect(0, 0, size, size);
  const cx = size * 0.5;
  const cy = size * 0.5;
  const r = size * 0.4;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  ctx.lineWidth = Math.max(2, size * 0.04);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#ffffff";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const x = (n: number) => size * n;
  const y = (n: number) => size * n;

  ctx.beginPath();
  ctx.moveTo(x(0.22), y(0.44));
  ctx.lineTo(x(0.34), y(0.44));
  ctx.lineTo(x(0.36), y(0.5));
  ctx.lineTo(x(0.32), y(0.56));
  ctx.lineTo(x(0.22), y(0.58));
  ctx.closePath();
  ctx.fill();

  ctx.fillRect(x(0.32), y(0.46), x(0.4), y(0.08));
  ctx.fillRect(x(0.68), y(0.44), x(0.08), y(0.12));

  ctx.beginPath();
  ctx.moveTo(x(0.4), y(0.54));
  ctx.lineTo(x(0.48), y(0.54));
  ctx.lineTo(x(0.5), y(0.72));
  ctx.lineTo(x(0.4), y(0.72));
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x(0.32), y(0.54));
  ctx.lineTo(x(0.38), y(0.54));
  ctx.lineTo(x(0.36), y(0.7));
  ctx.lineTo(x(0.3), y(0.68));
  ctx.closePath();
  ctx.fill();
}

const WEAPON_MARK_COLORS = {
  "weapon-mark-connected": "#3B82F6",
  "weapon-mark-disconnected": "#FF3B4A",
  "weapon-mark-unassigned": "#8B9AAF",
  "weapon-mark-low-battery": "#FFB020",
  "weapon-mark-maintenance": "#22D3EE",
} as const;

const PERSONNEL_PIN_COLORS = {
  "personnel-pin-online": "#00D99A",
  "personnel-pin-warning": "#FFB020",
  "personnel-pin-critical": "#FF3B4A",
  "personnel-pin-offline": "#8B9AAF",
  "personnel-pin-leader": "#3B82F6",
} as const;

export function registerMapIcons(map: Map) {
  for (const [id, color] of Object.entries(PERSONNEL_PIN_COLORS)) {
    upsertImage(map, id, makeIcon((ctx, size) => drawSoldierPin(ctx, size, color), 128));
  }
  for (const [id, color] of Object.entries(WEAPON_MARK_COLORS)) {
    upsertImage(map, id, makeIcon((ctx, size) => drawWeaponBadge(ctx, size, color), 96));
  }

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
