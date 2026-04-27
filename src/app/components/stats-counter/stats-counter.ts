import { Component, ElementRef, Input, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats-counter',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="counter">{{ display() }}{{ suffix }}</span>
  `,
  styles: [`
    .counter {
      font-family: 'Fraunces', serif;
      font-weight: 600;
      font-size: clamp(2rem, 4vw, 3rem);
      background: linear-gradient(135deg, #FAC775 0%, #ffffff 100%);
      -webkit-background-clip: text; background-clip: text;
      -webkit-text-fill-color: transparent;
      display: inline-block;
    }
  `]
})
export class StatsCounterComponent implements OnInit, OnDestroy {
  @Input({ required: true }) target!: number;
  @Input() duration = 1800;
  @Input() suffix = '';

  display = signal(0);
  private observer?: IntersectionObserver;
  private started = false;
  private host = inject(ElementRef);

  ngOnInit() {
    this.observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting && !this.started) {
          this.started = true;
          this.run();
          this.observer?.disconnect();
        }
      }
    }, { threshold: 0.4 });
    this.observer.observe(this.host.nativeElement);
  }

  ngOnDestroy() { this.observer?.disconnect(); }

  private run() {
    const start = performance.now();
    const target = this.target;
    const duration = this.duration;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.display.set(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}
