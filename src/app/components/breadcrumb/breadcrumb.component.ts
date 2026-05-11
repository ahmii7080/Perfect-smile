import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Single shape used for both the visible breadcrumb UI **and** the
 * `BreadcrumbList` JSON-LD that `StructuredDataService.setBreadcrumb`
 * emits — keep the DOM and the schema in lock-step by passing the same
 * array to both.
 */
export interface BreadcrumbItem {
  /** Display text in the crumb and Schema.org `name` field. */
  label: string;
  /** Site-relative path, e.g. `/services/dental-implants`. */
  path: string;
}

/**
 * Visible breadcrumb navigation. The full crumb path is always rendered
 * in the DOM (important for screen readers and search-engine context);
 * middle items collapse to a single ellipsis on narrow screens via CSS
 * only — no JS branching, so the SSR HTML is identical for every viewport.
 */
@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BreadcrumbComponent {
  /** Crumb path, root → current. Last item is rendered as the current page. */
  items = input.required<BreadcrumbItem[]>();
}
