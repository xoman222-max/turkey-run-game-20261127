// All art is drawn in code: no image files, no network. Every creature
// and prop below is a small canvas drawing routine.

// ---------- background ----------
export function drawSky(ctx, W, H, t, distance) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#3b1d4e');
  g.addColorStop(0.45, '#a34a3c');
  g.addColorStop(0.72, '#e8863c');
  g.addColorStop(1, '#f7c873');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Low autumn sun.
  const sx = W * 0.72, sy = H * 0.30;
  const sg = ctx.createRadialGradient(sx, sy, 10, sx, sy, 190);
  sg.addColorStop(0, 'rgba(255, 236, 170, 0.95)');
  sg.addColorStop(0.35, 'rgba(255, 190, 90, 0.55)');
  sg.addColorStop(1, 'rgba(255, 190, 90, 0)');
  ctx.fillStyle = sg;
  ctx.fillRect(sx - 200, sy - 200, 400, 400);
  ctx.fillStyle = '#ffdf8a';
  ctx.beginPath(); ctx.arc(sx, sy, 46, 0, Math.PI * 2); ctx.fill();

  // Drifting clouds.
  ctx.fillStyle = 'rgba(255, 220, 190, 0.28)';
  for (let i = 0; i < 4; i++) {
    const cx = ((i * 397 + t * 12) % (W + 320)) - 160;
    const cy = 70 + i * 42;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 90, 20, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 55, cy + 8, 60, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Distant hills.
  ctx.fillStyle = '#5d2b3e';
  ctx.beginPath();
  ctx.moveTo(0, 470);
  for (let x = 0; x <= W; x += 80) ctx.lineTo(x, 470 - Math.sin(x * 0.004 + 1.2) * 42 - 18);
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();

  // Barn silhouette on the far hill, parallax-slow.
  const bx = W - ((distance * 0.12) % (W + 500)) - 120;
  drawBarn(ctx, bx, 400, 0.55);

  // Autumn tree line.
  for (let i = 0; i < 9; i++) {
    const tx = ((i * 173 - distance * 0.25) % (W + 200) + W + 200) % (W + 200) - 100;
    drawTree(ctx, tx, 468, 0.8 + (i % 3) * 0.18, i);
  }
}

export function drawBarn(ctx, x, groundY, s) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(s, s);
  ctx.fillStyle = '#4a1f2b';
  ctx.fillRect(0, -110, 170, 110);
  ctx.beginPath();
  ctx.moveTo(-12, -110); ctx.lineTo(85, -165); ctx.lineTo(182, -110);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#6b2f35';
  ctx.fillRect(65, -62, 40, 62);
  ctx.strokeStyle = '#3a1820'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(65, -62); ctx.lineTo(105, 0); ctx.moveTo(105, -62); ctx.lineTo(65, 0); ctx.stroke();
  ctx.restore();
}

export function drawTree(ctx, x, groundY, s, seed) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(s, s);
  ctx.fillStyle = '#3d2118';
  ctx.fillRect(-5, -70, 10, 70);
  const cols = ['#c96a2e', '#d98a2b', '#b84a2a'];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = cols[(seed + i) % 3];
    ctx.beginPath();
    ctx.arc(-18 + i * 18, -78 - (i % 2) * 16, 26, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawGround(ctx, W, H, groundY, t, distance) {
  // Field.
  const g = ctx.createLinearGradient(0, groundY, 0, H);
  g.addColorStop(0, '#7a5a2e');
  g.addColorStop(0.25, '#5e4423');
  g.addColorStop(1, '#3c2a15');
  ctx.fillStyle = g;
  ctx.fillRect(0, groundY, W, H - groundY);
  // Furrows scrolling past.
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 14; i++) {
    const fx = ((i * 113 - distance) % (W + 120) + W + 120) % (W + 120) - 60;
    ctx.beginPath(); ctx.moveTo(fx, groundY + 8); ctx.lineTo(fx - 26, H); ctx.stroke();
  }
  // Fence posts, mid parallax.
  ctx.fillStyle = '#4a2f1a';
  for (let i = 0; i < 10; i++) {
    const px = ((i * 190 - distance * 0.6) % (W + 200) + W + 200) % (W + 200) - 100;
    ctx.fillRect(px, groundY - 52, 10, 52);
    ctx.fillRect(px - 4, groundY - 56, 18, 8);
  }
  ctx.fillRect(0, groundY - 34, W, 7);
  // Grass tufts.
  ctx.strokeStyle = '#8a6a35';
  ctx.lineWidth = 2;
  for (let i = 0; i < 22; i++) {
    const gx = ((i * 97 - distance) % (W + 60) + W + 60) % (W + 60) - 30;
    ctx.beginPath();
    ctx.moveTo(gx, groundY + 6);
    ctx.lineTo(gx - 4, groundY - 6);
    ctx.moveTo(gx + 4, groundY + 6);
    ctx.lineTo(gx + 8, groundY - 5);
    ctx.stroke();
  }
  // Falling leaves.
  ctx.fillStyle = 'rgba(217, 138, 43, 0.85)';
  for (let i = 0; i < 12; i++) {
    const lx = ((i * 211 + t * 30) % (W + 40)) - 20;
    const ly = ((i * 137 + t * 46) % (H - groundY)) + groundY - 120;
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(Math.sin(t * 2 + i) * 0.8);
    ctx.fillRect(-4, -2, 8, 4);
    ctx.restore();
  }
}

export function drawForestGate(ctx, x, groundY) {
  // The escape: an arch of tall pines the turkey runs toward.
  ctx.save();
  ctx.translate(x, groundY);
  for (const [dx, s, col] of [[-70, 1.5, '#1d4023'], [-30, 1.8, '#24512b'], [30, 1.8, '#1d4023'], [70, 1.5, '#2a5c31']]) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(dx - 34 * s, 0);
    ctx.lineTo(dx, -150 * s);
    ctx.lineTo(dx + 34 * s, 0);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3d2118';
    ctx.fillRect(dx - 5, -18, 10, 18);
  }
  ctx.fillStyle = '#f7c873';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('FOREST', 0, -170);
  ctx.restore();
}

// ---------- turkey ----------
export function drawTurkey(ctx, x, y, s, runPhase, sliding, flapping, blink) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  if (sliding) ctx.scale(1.25, 0.62);

  const legSwing = Math.sin(runPhase * 9) * 10;
  // Legs.
  ctx.strokeStyle = '#e8863c';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, 26); ctx.lineTo(-6 + legSwing, 44);
  ctx.moveTo(8, 26); ctx.lineTo(8 - legSwing, 44);
  ctx.stroke();
  // Feet.
  ctx.fillStyle = '#e8863c';
  ctx.fillRect(-12 + legSwing, 42, 12, 4);
  ctx.fillRect(2 - legSwing, 42, 12, 4);

  // Tail fan.
  for (let i = -2; i <= 2; i++) {
    ctx.save();
    ctx.rotate(i * 0.38);
    ctx.fillStyle = i % 2 === 0 ? '#8a5a2b' : '#6b4420';
    ctx.beginPath();
    ctx.ellipse(-30, -18, 9, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c98a3a';
    ctx.beginPath();
    ctx.ellipse(-30, -38, 6, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Body.
  ctx.fillStyle = '#7a4a22';
  ctx.beginPath(); ctx.ellipse(0, 0, 34, 30, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#9a6530';
  ctx.beginPath(); ctx.ellipse(2, 4, 26, 22, 0, 0, Math.PI * 2); ctx.fill();
  // Wing, flapping.
  const flap = flapping ? Math.sin(runPhase * 14) * 0.9 : Math.sin(runPhase * 9) * 0.25;
  ctx.save();
  ctx.translate(-4, -4);
  ctx.rotate(-0.5 + flap * 0.5);
  ctx.fillStyle = '#5e3a1a';
  ctx.beginPath(); ctx.ellipse(-8, 0, 20, 11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Neck and head.
  ctx.fillStyle = '#7a4a22';
  ctx.fillRect(20, -44, 12, 30);
  ctx.fillStyle = '#e8b88a';
  ctx.beginPath(); ctx.arc(28, -50, 14, 0, Math.PI * 2); ctx.fill();
  // Wattle.
  ctx.fillStyle = '#d23c2e';
  ctx.beginPath(); ctx.ellipse(38, -40, 4, 8, 0.3, 0, Math.PI * 2); ctx.fill();
  // Snood.
  ctx.fillStyle = '#d23c2e';
  ctx.beginPath(); ctx.ellipse(40, -52, 3, 6, 0.5, 0, Math.PI * 2); ctx.fill();
  // Beak.
  ctx.fillStyle = '#f2a93b';
  ctx.beginPath(); ctx.moveTo(38, -54); ctx.lineTo(52, -49); ctx.lineTo(38, -44); ctx.closePath(); ctx.fill();
  // Eye.
  if (!blink) {
    ctx.fillStyle = '#1c0f1e';
    ctx.beginPath(); ctx.arc(30, -53, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(31, -54, 1.2, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.strokeStyle = '#1c0f1e'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(26, -53); ctx.lineTo(34, -53); ctx.stroke();
  }
  ctx.restore();
}

// ---------- farmer ----------
export function drawFarmer(ctx, x, y, s, runPhase, angry) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const swing = Math.sin(runPhase * 10) * 12;
  // Legs (overalls).
  ctx.strokeStyle = '#3a5a8a';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-4, -8); ctx.lineTo(-4 + swing, 34);
  ctx.moveTo(6, -8); ctx.lineTo(6 - swing, 34);
  ctx.stroke();
  // Body: plaid shirt + overalls.
  ctx.fillStyle = '#a33327';
  ctx.fillRect(-16, -46, 34, 42);
  ctx.fillStyle = '#3a5a8a';
  ctx.fillRect(-14, -30, 30, 28);
  ctx.fillStyle = '#c9a227';
  ctx.fillRect(-14, -30, 30, 4);
  // Arm reaching forward, holding a pitchfork.
  ctx.strokeStyle = '#e8b88a';
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(12, -40); ctx.lineTo(34, -28); ctx.stroke();
  // Pitchfork.
  ctx.strokeStyle = '#8a6a35';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(30, -52); ctx.lineTo(44, 6); ctx.stroke();
  ctx.strokeStyle = '#c9c9c9';
  ctx.lineWidth = 3;
  for (const dx of [-5, 0, 5]) {
    ctx.beginPath(); ctx.moveTo(44 + dx, 6); ctx.lineTo(44 + dx, -12); ctx.stroke();
  }
  // Head.
  ctx.fillStyle = '#e8b88a';
  ctx.beginPath(); ctx.arc(2, -58, 14, 0, Math.PI * 2); ctx.fill();
  // Angry brows / moustache.
  ctx.strokeStyle = '#1c0f1e'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(-6, -64); ctx.lineTo(0, -61); ctx.moveTo(10, -64); ctx.lineTo(4, -61); ctx.stroke();
  ctx.fillStyle = '#6b4420';
  ctx.fillRect(-4, -52, 14, 4);
  // Straw hat.
  ctx.fillStyle = '#d9b64a';
  ctx.beginPath(); ctx.ellipse(2, -68, 24, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-12, -84, 28, 16);
  ctx.fillStyle = '#8a6a35';
  ctx.fillRect(-12, -72, 28, 4);
  if (angry) {
    ctx.fillStyle = '#ff3b2e';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', 26, -92);
  }
  ctx.restore();
}

// ---------- obstacles & pickups ----------
export function drawOven(ctx, x, groundY, s, t) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(s, s);
  // Body.
  ctx.fillStyle = '#23232e';
  ctx.fillRect(-46, -96, 92, 96);
  ctx.fillStyle = '#33333f';
  ctx.fillRect(-46, -96, 92, 12);
  // Glowing door.
  const glow = 0.55 + Math.sin(t * 6) * 0.25;
  ctx.fillStyle = `rgba(255, 110, 20, ${glow})`;
  ctx.fillRect(-34, -72, 68, 56);
  ctx.fillStyle = '#ff9a3c';
  ctx.fillRect(-30, -68, 60, 48);
  ctx.fillStyle = '#7a2a00';
  ctx.fillRect(-30, -46, 60, 4);
  // Handle + knobs.
  ctx.fillStyle = '#c9c9c9';
  ctx.fillRect(-34, -80, 68, 6);
  ctx.beginPath(); ctx.arc(-22, -88, 4, 0, Math.PI * 2); ctx.arc(22, -88, 4, 0, Math.PI * 2); ctx.fill();
  // Chimney + smoke.
  ctx.fillStyle = '#23232e';
  ctx.fillRect(24, -128, 16, 34);
  ctx.fillStyle = 'rgba(200,200,200,0.5)';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(32 + Math.sin(t * 2 + i) * 6, -138 - i * 14, 7 + i * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  // Warning sign.
  ctx.fillStyle = '#f7c873';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('HOT!', 0, 14);
  ctx.restore();
}

export function drawKnife(ctx, x, y, s, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  // Blade.
  const g = ctx.createLinearGradient(0, -8, 0, 8);
  g.addColorStop(0, '#e8e8e8');
  g.addColorStop(0.5, '#b8b8c8');
  g.addColorStop(1, '#8a8a9a');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-34, -6); ctx.lineTo(22, -8); ctx.lineTo(38, 0); ctx.lineTo(22, 8); ctx.lineTo(-34, 6);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(-52, -7, 20, 14);
  ctx.fillStyle = '#c9a227';
  ctx.fillRect(-34, -7, 4, 14);
  ctx.restore();
}

export function drawHayBale(ctx, x, groundY, s) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(s, s);
  ctx.fillStyle = '#c9a227';
  ctx.beginPath(); ctx.arc(0, -30, 34, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8a6a35';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, -30, 26, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -30, 16, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#a3802a';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 16, -30 + Math.sin(a) * 16);
    ctx.lineTo(Math.cos(a) * 33, -30 + Math.sin(a) * 33);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawFence(ctx, x, groundY, s) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(s, s);
  ctx.fillStyle = '#6b4a2a';
  for (const px of [-34, 0, 34]) ctx.fillRect(px - 5, -64, 10, 64);
  ctx.fillRect(-44, -56, 88, 8);
  ctx.fillRect(-44, -30, 88, 8);
  ctx.restore();
}

export function drawPumpkin(ctx, x, groundY, s, t) {
  ctx.save();
  ctx.translate(x, groundY + Math.sin(t * 3) * 2);
  ctx.scale(s, s);
  ctx.fillStyle = '#e8863c';
  ctx.beginPath(); ctx.ellipse(0, -24, 30, 24, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#b85a1a';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, -24, 16, 24, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#3a5a1a';
  ctx.fillRect(-3, -52, 6, 10);
  ctx.fillStyle = '#1c0f1e';
  ctx.beginPath(); ctx.moveTo(-14, -28); ctx.lineTo(-8, -20); ctx.lineTo(-2, -28); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(4, -28); ctx.lineTo(10, -20); ctx.lineTo(16, -28); ctx.closePath(); ctx.fill();
  ctx.restore();
}

export function drawCorn(ctx, x, y, s, t) {
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 4 + x) * 4);
  ctx.scale(s, s);
  ctx.rotate(0.3);
  ctx.fillStyle = '#f2c230';
  ctx.beginPath(); ctx.ellipse(0, 0, 11, 22, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d9a41a';
  for (let i = -2; i <= 2; i++) {
    ctx.fillRect(i * 4 - 1, -18, 2, 36);
  }
  ctx.fillStyle = '#4a7a2a';
  ctx.beginPath(); ctx.moveTo(-8, 14); ctx.lineTo(0, 34); ctx.lineTo(8, 14); ctx.closePath(); ctx.fill();
  ctx.restore();
}

export function drawFeather(ctx, x, y, s, t) {
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 3) * 6);
  ctx.rotate(Math.sin(t * 2) * 0.4);
  ctx.scale(s, s);
  ctx.fillStyle = '#f7c873';
  ctx.beginPath(); ctx.ellipse(0, 0, 9, 22, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d23c2e';
  ctx.beginPath(); ctx.ellipse(0, -10, 5, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(0, 22); ctx.stroke();
  ctx.restore();
}
