import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { DataService } from './data.service';
import { BlogPost } from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class BlogService {
  private data = inject(DataService);

  list(): Observable<BlogPost[]> {
    return this.data.getBlog();
  }

  featured(): Observable<BlogPost | undefined> {
    return this.data.getBlog().pipe(map(list => list[0]));
  }

  related(currentSlug: string, limit = 3): Observable<BlogPost[]> {
    return this.data.getBlog().pipe(
      map(list => list.filter(p => p.slug !== currentSlug).slice(0, limit))
    );
  }
}
