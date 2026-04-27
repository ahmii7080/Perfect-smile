import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Doctor } from '../../models/doctor.model';

@Component({
  selector: 'app-doctor-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="doc-card lift">
      <div class="doc-card__head" [style.background]="'linear-gradient(135deg,' + doctor.color + ', #0C4A6E)'">
        <div class="doc-card__avatar"
             [class.has-image]="!!doctor.image"
             [style.background-image]="doctor.image ? 'url(' + doctor.image + ')' : null">
          <span *ngIf="!doctor.image">{{ initials() }}</span>
        </div>
        <span class="doc-card__spec">{{ doctor.specialization }}</span>
      </div>
      <div class="doc-card__body">
        <h3>{{ doctor.name }}</h3>
        <p class="doc-card__qual">{{ doctor.qualifications }}</p>
        <p class="doc-card__bio">{{ doctor.shortBio }}</p>
        <div class="doc-card__social">
          <a href="#" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
          <a href="#" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
          <a href="#" aria-label="LinkedIn"><i class="fa-brands fa-linkedin-in"></i></a>
        </div>
      </div>
    </article>
  `,
  styles: [`
    .doc-card {
      background: #fff; border-radius: 22px; overflow: hidden;
      box-shadow: var(--shadow-card);
      border: 1px solid rgba(15,122,176,0.06);
      display: flex; flex-direction: column; height: 100%;
    }
    .doc-card__head {
      padding: 1.75rem 1.5rem 2.25rem;
      color: #fff; position: relative;
      display: flex; flex-direction: column; align-items: center;
    }
    .doc-card__avatar {
      width: 110px; height: 110px;
      border-radius: 50%;
      background: rgba(255,255,255,0.15);
      border: 3px solid rgba(255,255,255,0.5);
      display: inline-flex; align-items: center; justify-content: center;
      font-family: 'Fraunces', serif;
      font-size: 28px; font-weight: 600; color: #fff;
      margin-bottom: 0.65rem;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      box-shadow: 0 14px 28px -10px rgba(0,0,0,0.3);
    }
    .doc-card__avatar.has-image {
      background-color: transparent;
    }
    .doc-card__spec {
      font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase;
      color: rgba(255,255,255,0.92); font-weight: 600;
    }
    .doc-card__body { padding: 1.5rem; text-align: center; flex: 1; }
    .doc-card__body h3 {
      font-family: 'Fraunces', serif; font-size: 20px; font-weight: 500;
      margin: 0 0 0.35rem;
    }
    .doc-card__qual { color: var(--color-primary); font-size: 12px; font-weight: 600; margin: 0 0 0.7rem; }
    .doc-card__bio { font-size: 13.5px; line-height: 1.6; margin: 0 0 1rem; color: var(--color-text-muted); }
    .doc-card__social { display: flex; justify-content: center; gap: 0.6rem; }
    .doc-card__social a {
      width: 32px; height: 32px; border-radius: 50%;
      background: var(--color-primary-soft); color: var(--color-primary);
      display: inline-flex; align-items: center; justify-content: center;
      transition: all 0.2s ease;
    }
    .doc-card__social a:hover { background: var(--color-primary); color: #fff; transform: translateY(-2px); }
  `]
})
export class DoctorCardComponent {
  @Input({ required: true }) doctor!: Doctor;
  initials() {
    return this.doctor.name.split(' ').filter(p => !p.startsWith('Dr')).slice(0,2).map(p => p[0]).join('');
  }
}
