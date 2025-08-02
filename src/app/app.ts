import { Component, computed, effect, HostListener, signal } from '@angular/core';
import emailjs from 'emailjs-com';
import Typed from 'typed.js';
import VanillaTilt from 'vanilla-tilt';
import ScrollReveal from 'scrollreveal';
import { NgClass } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ParticleBgDirective } from './particle-bg';

const skills: { name: string; icon: string }[] = [{
    "name": "Angular",
    "icon": "https://img.icons8.com/fluency/48/000000/angularjs.png"
  },
  {
    "name": "ExpressJS",
    "icon": "https://img.icons8.com/fluency/48/000000/node-js.png"
  },
  {
    "name": "NodeJS",
    "icon": "https://img.icons8.com/color/48/000000/nodejs.png"
  },
  {
    "name": "AI",
    "icon": "https://img.icons8.com/?size=100&id=fTkqveCX0blI&format=png&color=000000"
  },

  {
    "name": "Firebase",
    "icon": "https://img.icons8.com/color/48/000000/firebase.png"
  },

  {
    "name": "MaterialUI",
    "icon": "https://img.icons8.com/color/48/000000/material-ui.png"
  },

  {
    "name": "TailwindCSS",
    "icon": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Tailwind_CSS_Logo.svg/48px-Tailwind_CSS_Logo.png"
  },
  {
    "name": "Bootstrap",
    "icon": "https://img.icons8.com/color/48/000000/bootstrap.png"
  },
  {
    "name": "Sass",
    "icon": "https://img.icons8.com/color/48/000000/sass.png"
  },
  {
    "name": "HTML5",
    "icon": "https://img.icons8.com/color/48/000000/html-5--v1.png"
  },
  {
    "name": "CSS3",
    "icon": "https://img.icons8.com/color/48/000000/css3.png"
  },
  {
    "name": "JavaScript",
    "icon": "https://img.icons8.com/color/48/000000/javascript--v1.png"
  },

  {
    "name": "Python",
    "icon": "https://img.icons8.com/color/48/000000/python--v1.png"
  },
  {

    "name": "MongoDB",
    "icon": "https://img.icons8.com/color/48/000000/mongodb.png"
  },
  {
    "name": "MySQL",
    "icon": "https://img.icons8.com/color/48/000000/mysql-logo.png"
  },

  {
    "name": "AWS",
    "icon": "https://img.icons8.com/color/48/000000/amazon-web-services.png"
  },

  {
    "name": "jQuery",
    "icon": "https://img.icons8.com/ios-filled/48/1169ae/jquery.png"
  },
  {
    "name": "Git VCS",
    "icon": "https://img.icons8.com/color/48/000000/git.png"
  },
  {
    "name": "GitHub",
    "icon": "https://img.icons8.com/glyph-neue/48/ffffff/github.png"
  }
]
const projects: { name: string; desc: string; image: string; category: string; links: { view: string; code: string } }[] = [
  {
    "name": "NotyStack Android",
    "desc": "Fully fledged android CRUD app based on different design patterns. Built using Java, XML, SQLite, Firebase, RoomDB, MVVM.",
    "image": "notystackandroid",
    "category": "android",
    "links": {
      "view": "https://www.linkedin.com/posts/jigar-sable_androiddev-androidstudio-java-activity-6955224473822199808-JT0j",
      "code": "https://github.com/jigar-sable/notystack-android"
    }
  }];
@Component({
  selector: 'app-root',
  imports: [NgClass, FormsModule, ReactiveFormsModule, ParticleBgDirective],
  templateUrl: './app.html',
  styles: `
  `,
})
export class App {
  // Signals
  menuToggled = signal(false);
  scrollY = signal(0);
  activeSection = signal<string | null>(null);
  skills = signal<any[]>(skills);
  projects = signal<any[]>(projects);

  showScrollTop = computed(() => this.scrollY() > 60);
  menuIconClasses = computed(() => (this.menuToggled() ? 'fa-times' : ''));
  navbarClasses = computed(() => (this.menuToggled() ? 'nav-toggle' : ''));

  private typedInstance?: Typed;
  private effectRef?: { destroy: () => void };
  particlesOptions = {
    particleCount: 80,
    maxDistance: 150,
    bgColor: 'initial',
    dotColor: '0, 0, 0', // using gray for visibility; change to '0,0,0' if strict
    linkOpacity: 0.4,
    dotOpacity: 0.45,
    hoverDistance: 200,
    repulseStrength: 0.2,
    pushQuantity: 4,
    speed: 1.5
  };
  contactForm: ReturnType<FormBuilder['group']>;
  isSubmitting = false;

  constructor(private fb: FormBuilder) {
    // reactive side effects
    this.effectRef = effect(() => {
      const y = this.scrollY();
      const active = this.activeSection();
      // scroll-top button
      const st = document.getElementById('scroll-top');
      if (st) {
        y > 60 ? st.classList.add('active') : st.classList.remove('active');
      }
      // active nav link
      document.querySelectorAll('.navbar ul li a').forEach((a) => a.classList.remove('active'));
      if (active) {
        const sel = document.querySelector(`.navbar a[href="#${active}"]`);
        sel?.classList.add('active');
      }
    });
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      message: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  get name() {
    return this.contactForm.get('name')!;
  }
  get email() {
    return this.contactForm.get('email')!;
  }
  get phone() {
    return this.contactForm.get('phone')!;
  }
  get message() {
    return this.contactForm.get('message')!;
  }
  ngAfterViewInit(): void {
    this.initTyped();
    this.initTilt();
    this.initScrollReveal();
    this.setupScrollListener();

  }

  ngOnDestroy(): void {
    this.typedInstance?.destroy();
    this.effectRef?.destroy();
    window.removeEventListener('scroll', this.onScrollOrLoad);
    window.removeEventListener('load', this.onScrollOrLoad);
  }


  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleMenu() {
    this.menuToggled.update((v) => !v);
  }

  onAnchorClick(event: Event, href: string) {
    event.preventDefault();
    const targetId = href.split('#')[1];
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    this.activeSection.set(targetId);
    this.menuToggled.set(false);
  }

  private initTyped() {
    this.typedInstance = new Typed('.typing-text', {
      strings: [
        'Full Stack Development',
        'Mobile App Development',
        'Artificial Intelligence Solutions',
        'Freelance Software Projects',
        'Web Design & Development',
        'Technical Consulting & Strategy',
        'Server & Cloud Infrastructure Management',
        'UI/UX Design & Prototyping',
        'Custom Software Development',
      ],
      loop: true,
      typeSpeed: 50,
      backSpeed: 25,
      backDelay: 500,
    });
  }

  private initTilt() {
    const tiltEls = document.querySelectorAll<HTMLElement>('.tilt');
    if (tiltEls.length) VanillaTilt.init(Array.from(tiltEls), { max: 15 });
  }

  private initScrollReveal() {
    const srtop = ScrollReveal({ origin: 'top', distance: '80px', duration: 1000, reset: true });
    // common reveals - can be refactored to config array
    srtop.reveal('.home .content h3', { delay: 200 });
    srtop.reveal('.home .content p', { delay: 200 });
    srtop.reveal('.home .content .btn', { delay: 200 });
    srtop.reveal('.home .image', { delay: 400 });
    srtop.reveal('.home .linkedin', { interval: 600 });
    srtop.reveal('.home .github', { interval: 800 });
    srtop.reveal('.home .twitter', { interval: 1000 });
    srtop.reveal('.home .telegram', { interval: 600 });
    srtop.reveal('.home .instagram', { interval: 600 });
    srtop.reveal('.home .dev', { interval: 600 });
    srtop.reveal('.about .content h3', { delay: 200 });
    srtop.reveal('.about .content .tag', { delay: 200 });
    srtop.reveal('.about .content p', { delay: 200 });
    srtop.reveal('.about .content .box-container', { delay: 200 });
    srtop.reveal('.about .content .resumebtn', { delay: 200 });
    srtop.reveal('.skills .container', { interval: 200 });
    srtop.reveal('.skills .container .bar', { delay: 300 });
    srtop.reveal('.education .box', { interval: 200 });
    srtop.reveal('.work .box', { interval: 200 });
    srtop.reveal('.experience .timeline', { delay: 400 });
    srtop.reveal('.experience .timeline .container', { interval: 400 });
    srtop.reveal('.contact .container', { delay: 400 });
    srtop.reveal('.contact .container .form-group', { delay: 400 });
  }

  private setupScrollListener() {
    const handler = () => {
      this.scrollY.set(window.scrollY);
      this.updateActiveSection();
      this.menuToggled.set(false);
    };
    window.addEventListener('scroll', handler);
    window.addEventListener('load', handler);
    // store fallback reference for cleanup
    this.onScrollOrLoad = handler;
  }

  private updateActiveSection() {
    let current: string | null = null;
    document.querySelectorAll<HTMLElement>('section').forEach((section) => {
      const height = section.offsetHeight;
      const offset = section.offsetTop - 200;
      const top = window.scrollY;
      const id = section.getAttribute('id') || '';
      if (top > offset && top < offset + height) current = id;
    });
    this.activeSection.set(current);
  }

  async onSubmitContactForm() {
    if (this.contactForm.invalid || this.isSubmitting) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const { name, email, phone, message } = this.contactForm.value;

    const templateParams = {
      from_name: name.trim(),
      from_email: email.trim(),
      phone: phone?.trim() || '',
      message: message.trim(),
    };
    try {
      await emailjs.send("service_8a8to1m", "template_snlsy39", templateParams, 'u5vIxOkYhGpZ_xmr2');
      this.contactForm.reset();
    } catch (err: any) {
      console.error('FAILED...', err);
      alert('Submission failed. Please try again later.');
    } finally {
      this.isSubmitting = false;
    }
  }
  // fallback reference to remove listeners
  private onScrollOrLoad: () => void = () => { };

  // dev tools suppression (advisory: easily bypassed)
  @HostListener('document:keydown', ['$event'])
  handleKey(e: KeyboardEvent) {
    const blocked =
      e.key === 'F12' ||
      ((e.ctrlKey && e.shiftKey) && ['I', 'C', 'J'].includes(e.key.toUpperCase())) ||
      (e.ctrlKey && e.key.toUpperCase() === 'U');
    if (blocked) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
}
