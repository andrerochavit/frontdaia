import { useEffect, useRef } from "react";

/**
 * EntrepreneurshipOrb
 * 
 * Animated SVG representing an entrepreneurship ecosystem:
 * - Central node = Entrepreneur
 * - 5 orbiting nodes = Effectuation Principles
 * - Connection lines pulsing = relationships/partnerships
 * 
 * Replaces the generic rotating cube with something on-theme.
 */

const NODES = [
    { label: "Bird in Hand", emoji: "🤝", color: "#60a5fa", delay: 0, radius: 130 },
    { label: "Affordable Loss", emoji: "🎯", color: "#818cf8", delay: 0.2, radius: 130 },
    { label: "Crazy Quilt", emoji: "🌐", color: "#34d399", delay: 0.4, radius: 130 },
    { label: "Lemonade", emoji: "💡", color: "#fbbf24", delay: 0.6, radius: 130 },
    { label: "Pilot-in-the-Plane", emoji: "✈️", color: "#f472b6", delay: 0.8, radius: 130 },
];

// Static orbital angles for each node (equally spaced 72° apart from -90°)
const BASE_ANGLES = NODES.map((_, i) => -90 + i * 72); // degrees

export default function EntrepreneurshipOrb() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);
    const startRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;
        const cx = W / 2;
        const cy = H / 2;
        const orbitR = Math.min(W, H) * 0.34;
        const centerR = 36;
        const nodeR = 22;
        const rotationSpeed = 0.00028; // radians/ms

        // Detect dark mode
        const isDark = () => document.documentElement.classList.contains("dark");

        function toRad(deg: number) { return deg * (Math.PI / 180); }

        function draw(ts: number) {
            if (!startRef.current) startRef.current = ts;
            const elapsed = ts - startRef.current;
            const angle = elapsed * rotationSpeed; // total rotation in radians

            ctx.clearRect(0, 0, W, H);

            const dark = isDark();

            // ── Background glow ring ──
            const ring = ctx.createRadialGradient(cx, cy, orbitR * 0.3, cx, cy, orbitR * 1.1);
            ring.addColorStop(0, dark ? "rgba(96,165,250,0.07)" : "rgba(96,165,250,0.10)");
            ring.addColorStop(1, "rgba(96,165,250,0)");
            ctx.fillStyle = ring;
            ctx.beginPath();
            ctx.arc(cx, cy, orbitR * 1.1, 0, Math.PI * 2);
            ctx.fill();

            // ── Orbit path (dashed ring) ──
            ctx.save();
            ctx.setLineDash([4, 8]);
            ctx.strokeStyle = dark ? "rgba(148,163,184,0.15)" : "rgba(148,163,184,0.30)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(cx, cy, orbitR, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            // ── Compute node positions ──
            const nodePositions = NODES.map((_, i) => {
                const baseAngle = toRad(BASE_ANGLES[i]);
                const a = baseAngle + angle;
                return {
                    x: cx + Math.cos(a) * orbitR,
                    y: cy + Math.sin(a) * orbitR,
                };
            });

            // ── Connection lines from center to nodes ──
            nodePositions.forEach((pos, i) => {
                const node = NODES[i];
                const pulse = 0.5 + 0.5 * Math.sin(elapsed * 0.002 + i * 1.2);

                const grad = ctx.createLinearGradient(cx, cy, pos.x, pos.y);
                grad.addColorStop(0, node.color + (dark ? "55" : "66"));
                grad.addColorStop(1, node.color + "00");

                ctx.save();
                ctx.globalAlpha = 0.5 + 0.3 * pulse;
                ctx.strokeStyle = grad;
                ctx.lineWidth = 1.5;
                ctx.setLineDash([]);
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
                ctx.restore();
            });

            // ── Cross-connection lines between neighbouring nodes ──
            for (let i = 0; i < nodePositions.length; i++) {
                const j = (i + 2) % nodePositions.length; // skip one for star pattern
                const a = nodePositions[i];
                const b = nodePositions[j];
                const pulse = 0.3 + 0.3 * Math.sin(elapsed * 0.0015 + i * 0.9);

                ctx.save();
                ctx.globalAlpha = pulse;
                ctx.strokeStyle = dark ? "rgba(148,163,184,0.18)" : "rgba(148,163,184,0.28)";
                ctx.lineWidth = 0.8;
                ctx.setLineDash([3, 6]);
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
                ctx.restore();
            }

            // ── Orbital nodes ──
            nodePositions.forEach((pos, i) => {
                const node = NODES[i];
                const pulse = 0.85 + 0.15 * Math.sin(elapsed * 0.002 + NODES[i].delay * 10);
                const r = nodeR * pulse;

                // Outer glow
                const glow = ctx.createRadialGradient(pos.x, pos.y, r * 0.3, pos.x, pos.y, r * 1.6);
                glow.addColorStop(0, node.color + "55");
                glow.addColorStop(1, node.color + "00");
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, r * 1.6, 0, Math.PI * 2);
                ctx.fillStyle = glow;
                ctx.fill();

                // Node circle
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
                ctx.fillStyle = dark
                    ? "rgba(15, 23, 42, 0.85)"
                    : "rgba(255, 255, 255, 0.88)";
                ctx.shadowColor = node.color;
                ctx.shadowBlur = 12;
                ctx.fill();
                ctx.shadowBlur = 0;

                // Node border
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
                ctx.strokeStyle = node.color + "cc";
                ctx.lineWidth = 1.8;
                ctx.stroke();

                // Emoji
                ctx.font = `${r * 0.88}px serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(node.emoji, pos.x, pos.y + 1);
            });

            // ── Central node ──
            const centralPulse = 0.88 + 0.12 * Math.sin(elapsed * 0.0018);
            const cr = centerR * centralPulse;

            // Central glow rings
            for (let ring = 3; ring >= 1; ring--) {
                const ringPulse = 0.5 + 0.5 * Math.sin(elapsed * 0.001 + ring * 0.8);
                ctx.beginPath();
                ctx.arc(cx, cy, cr + ring * 12, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(96, 165, 250, ${0.06 * ringPulse})`;
                ctx.lineWidth = ring * 3;
                ctx.stroke();
            }

            // Central bg
            const centralGrad = ctx.createRadialGradient(cx - cr * 0.2, cy - cr * 0.2, 0, cx, cy, cr);
            centralGrad.addColorStop(0, dark ? "rgba(49, 80, 160, 0.95)" : "rgba(96, 165, 250, 0.95)");
            centralGrad.addColorStop(1, dark ? "rgba(30, 50, 120, 0.90)" : "rgba(59, 130, 246, 0.90)");
            ctx.beginPath();
            ctx.arc(cx, cy, cr, 0, Math.PI * 2);
            ctx.fillStyle = centralGrad;
            ctx.shadowColor = "#60a5fa";
            ctx.shadowBlur = 20;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Central border
            ctx.beginPath();
            ctx.arc(cx, cy, cr, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(255,255,255,0.40)";
            ctx.lineWidth = 2;
            ctx.stroke();

            // Central emoji
            ctx.font = `${cr * 0.85}px serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("🚀", cx, cy + 1);

            animRef.current = requestAnimationFrame(draw);
        }

        animRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animRef.current);
    }, []);

    return (
        <div className="relative flex items-center justify-center w-full h-72 md:h-80">
            <canvas
                ref={canvasRef}
                width={380}
                height={320}
                className="w-full h-full"
                style={{ maxWidth: 400, maxHeight: 340 }}
            />
            {/* Legend — hidden on small screens */}
            <div className="absolute bottom-0 left-0 right-0 flex flex-wrap justify-center gap-2 px-4 pb-1 hidden md:flex">
                {NODES.map((n) => (
                    <span
                        key={n.label}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{
                            background: n.color + "20",
                            color: n.color,
                            border: `1px solid ${n.color}50`,
                        }}
                    >
                        {n.emoji} {n.label}
                    </span>
                ))}
            </div>
        </div>
    );
}