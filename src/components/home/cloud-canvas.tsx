"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

/**
 * "Mây" means cloud: a WebGL shader of slowly drifting, domain-warped clouds
 * in the brand palette. The clouds part around the cursor. No libraries:
 * one full-screen triangle and a fragment shader. Renders at reduced
 * resolution (the image is soft anyway), pauses off-screen, and draws a single
 * still frame when the visitor prefers reduced motion.
 */
const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uBg, uC1, uC2, uC3;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
  return v;
}
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = uv * vec2(uRes.x / uRes.y, 1.0) * 1.8;
  float t = uTime * 0.035;
  vec2 d = uv - uMouse;
  p += normalize(d + 1e-4) * 0.18 * smoothstep(0.45, 0.0, length(d * vec2(uRes.x / uRes.y, 1.0)));
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) + 1.5 * t), fbm(p + 3.0 * q + vec2(8.3, 2.8) - t));
  float f = fbm(p + 2.6 * r);
  vec3 col = mix(uBg, uC1, smoothstep(0.25, 0.85, f));
  col = mix(col, uC2, clamp(length(q) * length(q), 0.0, 1.0) * 0.55);
  col = mix(col, uC3, smoothstep(0.55, 0.95, r.x) * 0.6);
  col = mix(uBg, col, 0.85 + 0.15 * uv.y);
  col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) * 0.025;
  gl_FragColor = vec4(col, 1.0);
}`;

const PALETTES = {
  light: { bg: "#f7f4ee", c1: "#ecc8b2", c2: "#c4d3bd", c3: "#ffffff" },
  dark: { bg: "#12110f", c1: "#4a2c20", c2: "#1d2a3a", c3: "#6b3a28" },
};

function rgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function CloudCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) {
      canvas.dataset.fallback = "true";
      return;
    }

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      canvas.dataset.fallback = "true";
      return;
    }
    gl.useProgram(prog);

    // one triangle that covers the screen
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(prog, name);
    const uRes = u("uRes"), uTime = u("uTime"), uMouse = u("uMouse");
    const pal = PALETTES[resolvedTheme === "dark" ? "dark" : "light"];
    gl.uniform3fv(u("uBg"), rgb(pal.bg));
    gl.uniform3fv(u("uC1"), rgb(pal.c1));
    gl.uniform3fv(u("uC2"), rgb(pal.c2));
    gl.uniform3fv(u("uC3"), rgb(pal.c3));

    const SCALE = 0.4; // soft image: low resolution is plenty and saves battery
    const resize = () => {
      const w = Math.max(1, Math.floor(canvas.clientWidth * SCALE));
      const h = Math.max(1, Math.floor(canvas.clientHeight * SCALE));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(uRes, w, h);
    };

    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) / r.width;
      mouse.ty = 1 - (e.clientY - r.top) / r.height;
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = true;
    let raf = 0;
    const start = performance.now();
    const draw = () => {
      resize();
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uTime, reduced ? 12 : (performance.now() - start) / 1000 + 12);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    // clouds move slowly: 30 frames per second is indistinguishable and halves the GPU work
    let last = 0;
    const loop = (now: number) => {
      if (visible && !document.hidden && now - last >= 33) {
        last = now;
        draw();
      }
      raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(canvas);
    if (reduced) {
      draw();
      window.addEventListener("resize", draw);
    } else {
      window.addEventListener("pointermove", onMove, { passive: true });
      raf = requestAnimationFrame(loop);
    }
    canvas.dataset.ready = "true";

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", draw);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [resolvedTheme]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={`h-full w-full bg-[radial-gradient(ellipse_at_20%_20%,#ecc8b2,transparent_55%),radial-gradient(ellipse_at_80%_60%,#c4d3bd,transparent_50%)] dark:bg-[radial-gradient(ellipse_at_20%_20%,#4a2c20,transparent_55%),radial-gradient(ellipse_at_80%_60%,#1d2a3a,transparent_50%)] ${className ?? ""}`}
    />
  );
}
