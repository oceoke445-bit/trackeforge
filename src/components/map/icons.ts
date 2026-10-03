import type { Map } from "maplibre-gl";

function makeIcon(draw: (ctx: CanvasRenderingContext2D, size: number) => void, size = 64) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");
  draw(ctx, size);
  return ctx.getImageData(0, 0, size, size);
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

  if (!map.hasImage("weapon-icon")) {
    map.addImage(
      "weapon-icon",
      makeIcon((ctx, size) => {
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(size * 0.2, size * 0.55);
        ctx.lineTo(size * 0.78, size * 0.38);
        ctx.lineTo(size * 0.82, size * 0.46);
        ctx.lineTo(size * 0.34, size * 0.64);
        ctx.closePath();
        ctx.fill();
      }),
      { pixelRatio: 2 },
    );
  }
}
