export function drawWords(
  canvas: HTMLCanvasElement,
  text: string,
  box: { cx: number; cy: number; width: number; height: number },
  weight = 0.05,
) {
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let size = box.height / 2.2;
  let lines: string[] = [];
  for (; size > box.height / 14; size *= 0.92) {
    ctx.font = `300 ${size}px "Kalam", cursive`;
    lines = wrap(ctx, text, box.width);
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (lines.length <= 4 && lines.length * size * 1.02 < box.height && widest <= box.width) break;
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = size * weight;
  const lineHeight = size * 1.02;
  const top = box.cy - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => {
    const w = ctx.measureText(line).width;
    const x0 = box.cx - w / 2;
    const order = ctx.createLinearGradient(x0, 0, x0 + w, 0);
    order.addColorStop(0, `rgb(255,${Math.round((i / lines.length) * 250)},0)`);
    order.addColorStop(1, `rgb(255,${Math.round(((i + 1) / lines.length) * 250)},0)`);
    ctx.fillStyle = order;
    ctx.strokeStyle = order;
    ctx.fillText(line, box.cx, top + i * lineHeight);
    ctx.strokeText(line, box.cx, top + i * lineHeight);
  });
}

export function drawStroke(canvas: HTMLCanvasElement, from: [number, number], to: [number, number], width: number) {
  const ctx = canvas.getContext("2d")!;
  ctx.strokeStyle = "rgba(255,0,0,1)";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  ctx.lineTo(to[0] + 0.01, to[1]);
  ctx.stroke();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}
