import { Component, OnInit, inject, signal } from '@angular/core';

import { RouterLink } from '@angular/router';
import { take } from 'rxjs';
import { DataService } from '../../services/data.service';
import { ServiceItem } from '../../models/service.model';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class FooterComponent implements OnInit {
  private data = inject(DataService);

  year = new Date().getFullYear();

  /**
   * Was a plain field assigned from a constructor subscription. `getServices`
   * can emit between Angular's render pass and its dev-mode verification
   * pass, and a plain field write signals nothing — so the second pass saw
   * `s.slug` change from `undefined` to a real slug and threw NG0100.
   *
   * A signal notifies change detection properly. `take(1)` also matters for
   * SSR: it auto-unsubscribes, leaving no dangling subscription to keep the
   * app from reaching stability before the prerender snapshot is captured —
   * the same pattern the page components already use.
   */
  services = signal<ServiceItem[]>([]);

  ngOnInit(): void {
    this.data
      .getServices()
      .pipe(take(1))
      .subscribe((list) => this.services.set(list.slice(0, 6)));
  }
}
