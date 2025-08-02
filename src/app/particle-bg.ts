import {
    AfterViewInit,
    Directive,
    ElementRef,
    Input,
    OnDestroy,
    inject,
} from '@angular/core';

interface ParticleBgOptions {
    particleCount?: number;
    maxDistance?: number;
    bgColor?: string;
    dotColor?: string; // as "r,g,b"
    linkOpacity?: number;
    dotOpacity?: number;
    hoverDistance?: number;
    repulseStrength?: number;
    pushQuantity?: number;
    speed?: number; // base movement speed
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
}

const DEFAULTS: Required<ParticleBgOptions> = {
    particleCount: 80,
    maxDistance: 150,
    bgColor: '#000000',
    dotColor: '255,255,255', // using white links/particles over black background for visibility; change to '0,0,0' if strict
    linkOpacity: 0.4,
    dotOpacity: 0.5,
    hoverDistance: 200,
    repulseStrength: 0.2, // tuned for a visible but smooth repulse
    pushQuantity: 4,
    speed: 6 / 4, // original speed=6; dividing to keep motion moderate (tweak as needed)
};

@Directive({
    selector: '[particleBg]',
    standalone: true,
})
export class ParticleBgDirective implements AfterViewInit, OnDestroy {
    @Input('particleBg') options: ParticleBgOptions = {};

    private host = inject(ElementRef<HTMLElement>);
    private canvas!: HTMLCanvasElement;
    private ctx!: CanvasRenderingContext2D;
    private particles: Particle[] = [];
    private animationId: number | null = null;

    private cfg!: Required<ParticleBgOptions>;

    private mouseX: number | null = null;
    private mouseY: number | null = null;

    private resizeListener = () => this.onResize();
    private mouseMoveListener = (e: MouseEvent) => this.onMouseMove(e);
    private mouseLeaveListener = () => this.onMouseLeave();
    private clickListener = (e: MouseEvent) => this.onClick(e);

    ngAfterViewInit(): void {
        this.cfg = { ...DEFAULTS, ...this.options };
        this.setupCanvas();
        this.createParticles();
        this.animate();

        window.addEventListener('resize', this.resizeListener);
        window.addEventListener('mousemove', this.mouseMoveListener);
        window.addEventListener('mouseleave', this.mouseLeaveListener);
        window.addEventListener('click', this.clickListener);
    }

    ngOnDestroy(): void {
        if (this.animationId !== null) cancelAnimationFrame(this.animationId);
        this.resizeObserver?.disconnect();
        window.removeEventListener('mousemove', this.mouseMoveListener);
        window.removeEventListener('mouseleave', this.mouseLeaveListener);
        window.removeEventListener('click', this.clickListener);
        if (this.canvas && this.canvas.parentElement) {
            this.canvas.parentElement.removeChild(this.canvas);
        }
    }


    private onResize(): void {
        this.resizeCanvas();
        this.createParticles();
    }

    private onMouseMove(e: MouseEvent): void {
        const dpr = window.devicePixelRatio || 1;
        this.mouseX = e.clientX * dpr;
        this.mouseY = e.clientY * dpr;
    }

    private onMouseLeave(): void {
        this.mouseX = null;
        this.mouseY = null;
    }

    private onClick(_: MouseEvent): void {
        // push mode: add particles_nb
        for (let i = 0; i < this.cfg.pushQuantity; i++) {
            this.particles.push(this.makeParticle());
        }
        // optional: cap total to avoid runaway
        if (this.particles.length > this.cfg.particleCount * 3) {
            this.particles.splice(0, this.particles.length - this.cfg.particleCount * 2);
        }
    }

    private resizeObserver!: ResizeObserver;

    private setupCanvas(): void {
        this.canvas = document.createElement('canvas');
        const hostEl = this.host.nativeElement;

        // ensure host can be positioning context
        const computed = getComputedStyle(hostEl);
        if (computed.position === 'static') {
            hostEl.style.position = 'relative';
        }

        Object.assign(this.canvas.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: '-1',
            display: 'block',
            background: this.cfg.bgColor,
        } as CSSStyleDeclaration);

        this.ctx = this.canvas.getContext('2d')!;
        hostEl.appendChild(this.canvas);
        this.resizeCanvas(); // initial sizing

        // observe host size changes
        this.resizeObserver = new ResizeObserver(() => {
            this.resizeCanvas();
            this.createParticles(); // optional: regenerate on size change
        });
        this.resizeObserver.observe(hostEl);
    }

    private resizeCanvas(): void {
        const dpr = window.devicePixelRatio || 1;
        const hostRect = this.host.nativeElement.getBoundingClientRect();
        const w = hostRect.width;
        const h = hostRect.height;

        this.canvas.width = Math.max(1, Math.floor(w * dpr));
        this.canvas.height = Math.max(1, Math.floor(h * dpr));
        this.canvas.style.width = `${w}px`;
        this.canvas.style.height = `${h}px`;

        if (this.ctx) {
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
    }

    private createParticles(): void {
        this.particles = [];
        for (let i = 0; i < this.cfg.particleCount; i++) {
            this.particles.push(this.makeParticle());
        }
    }

    private makeParticle(): Particle {
        const speed = this.cfg.speed * (0.5 + Math.random() * 1); // randomize slightly
        const angle = Math.random() * Math.PI * 2;
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 2 + Math.random() * 3, // around 5 with randomness
        };
    }

    private animate = (): void => {
        const { width, height } = this.canvas;
        this.ctx.clearRect(0, 0, width, height);

        // update & draw particles with repulse
        for (const p of this.particles) {
            if (this.mouseX !== null && this.mouseY !== null) {
                const dx = p.x - this.mouseX;
                const dy = p.y - this.mouseY;
                const dist = Math.hypot(dx, dy);
                if (dist < this.cfg.hoverDistance) {
                    const normX = dx / (dist || 1);
                    const normY = dy / (dist || 1);
                    const force = (1 - dist / this.cfg.hoverDistance) * this.cfg.repulseStrength;
                    p.vx += normX * force;
                    p.vy += normY * force;
                }
            }

            p.x += p.vx;
            p.y += p.vy;

            if (p.x <= 0 || p.x >= width) p.vx *= -1;
            if (p.y <= 0 || p.y >= height) p.vy *= -1;

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${this.cfg.dotColor}, ${this.cfg.dotOpacity})`;
            this.ctx.fill();
        }

        // draw links
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const a = this.particles[i];
                const b = this.particles[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const dist = Math.hypot(dx, dy);
                if (dist < this.cfg.maxDistance) {
                    const alpha = this.cfg.linkOpacity * (1 - dist / this.cfg.maxDistance);
                    this.ctx.strokeStyle = `rgba(${this.cfg.dotColor}, ${alpha})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(a.x, a.y);
                    this.ctx.lineTo(b.x, b.y);
                    this.ctx.stroke();
                }
            }
        }

        this.animationId = requestAnimationFrame(this.animate);
    };

}
