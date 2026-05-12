import { Component, Input } from '@angular/core';

import { Testimonial } from '../../models/appointment.model';

@Component({
  selector: 'app-testimonial-card',
  standalone: true,
  imports: [],
  template: `
    <figure class="t-card lift" [style.background]="testimonial.color">
      <i class="fa-solid fa-quote-left t-card__quote"></i>
      <div class="t-card__stars">
        @for (_ of stars(); track _) {
          <i class="fa-solid fa-star"></i>
        }
      </div>
      <blockquote>{{ testimonial.quote }}</blockquote>
      <figcaption>
        <strong>{{ testimonial.name }}</strong>
        <span>{{ testimonial.location }}</span>
      </figcaption>
    </figure>
  `,
  styles: [
    `
      .t-card {
        border-radius: 22px;
        padding: 2rem 1.75rem;
        position: relative;
        box-shadow: var(--shadow-card);
        border: 1px solid rgba(15, 122, 176, 0.06);
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      .t-card__quote {
        font-size: 28px;
        color: var(--color-primary);
        opacity: 0.18;
        position: absolute;
        top: 1rem;
        right: 1.25rem;
      }
      .t-card__stars {
        color: #f5b827;
        font-size: 13px;
        margin-bottom: 0.75rem;
        letter-spacing: 2px;
      }
      blockquote {
        font-family: 'Fraunces', serif;
        font-style: italic;
        font-size: 16px;
        line-height: 1.6;
        color: var(--color-ink-soft);
        margin: 0 0 1.25rem;
        flex: 1;
      }
      figcaption strong {
        display: block;
        font-size: 14.5px;
        color: var(--color-ink);
      }
      figcaption span {
        font-size: 12px;
        color: var(--color-text-muted);
      }
    `,
  ],
})
export class TestimonialCardComponent {
  @Input({ required: true }) testimonial!: Testimonial;
  stars() {
    return Array(this.testimonial.rating).fill(0);
  }
}
