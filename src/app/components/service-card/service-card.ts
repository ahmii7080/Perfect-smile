import { Component, Input } from '@angular/core';

import { RouterLink } from '@angular/router';
import { ServiceItem } from '../../models/service.model';

@Component({
  selector: 'app-service-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <a [routerLink]="['/services', service.slug]" class="svc-card lift">
      <div
        class="svc-card__icon"
        [style.background]="service.color + '1F'"
        [style.color]="service.color"
      >
        <i class="fa-solid" [class]="service.icon"></i>
      </div>
      <h3 class="svc-card__title">{{ service.title }}</h3>
      <p class="svc-card__summary">{{ service.summary }}</p>
      <span class="svc-card__more">Read more <i class="fa-solid fa-arrow-right"></i></span>
    </a>
  `,
  styles: [
    `
      .svc-card {
        display: block;
        background: #fff;
        border-radius: 22px;
        padding: 1.75rem;
        border: 1px solid rgba(15, 122, 176, 0.08);
        box-shadow: var(--shadow-card);
        text-decoration: none;
        color: inherit;
        height: 100%;
      }
      .svc-card__icon {
        width: 56px;
        height: 56px;
        border-radius: 16px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        margin-bottom: 1rem;
      }
      .svc-card__title {
        font-family: 'Fraunces', serif;
        font-size: 20px;
        font-weight: 500;
        color: var(--color-ink);
        margin: 0 0 0.5rem;
      }
      .svc-card__summary {
        font-size: 13.5px;
        color: var(--color-text-muted);
        line-height: 1.65;
        margin: 0 0 1rem;
      }
      .svc-card__more {
        color: var(--color-primary);
        font-size: 13px;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        transition: gap 0.2s ease;
      }
      .svc-card:hover .svc-card__more {
        gap: 0.7rem;
      }
    `,
  ],
})
export class ServiceCardComponent {
  @Input({ required: true }) service!: ServiceItem;
}
