import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SmileTreatment =
  | 'veneers'
  | 'whitening'
  | 'implants'
  | 'braces'
  | 'crowns'
  | 'makeover';

export type SmileVariant = 'before' | 'after';

/**
 * Stylised dental illustration — renders a matched before/after pair
 * per treatment. Used in the gallery to visualise each case without
 * relying on stock photos that don't actually pair.
 *
 * Common viewBox is 200x150. Each variant changes tooth colour, shape,
 * spacing, or adds a decoration (sparkle, gap, crown badge, aligner).
 */
@Component({
  selector: 'app-smile-svg',
  standalone: true,
  imports: [CommonModule],
  template: `
<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" class="smile-svg">

  <!-- ===== BACKGROUND (per variant) ===== -->
  <rect width="200" height="150" [attr.fill]="bg()"/>

  <!-- soft radial highlight -->
  <defs>
    <radialGradient id="hl-{{ treatment }}-{{ variant }}" cx="30%" cy="20%" r="80%">
      <stop offset="0" stop-color="rgba(255,255,255,0.45)"/>
      <stop offset="1" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
  </defs>
  <rect width="200" height="150" [attr.fill]="'url(#hl-' + treatment + '-' + variant + ')'"/>

  <!-- ===== TOP GUM ===== -->
  <path d="M-2,40 Q100,28 202,40 L202,54 L-2,54 Z" [attr.fill]="gumColor()"/>

  <!-- ===== TEETH (5 in a row) ===== -->
  <ng-container [ngSwitch]="treatment">

    <!-- ─── VENEERS ─── -->
    <g *ngSwitchCase="'veneers'">
      <ng-container *ngIf="variant === 'before'">
        <!-- chipped uneven teeth -->
        <path d="M22,55 L46,55 L48,108 L22,112 Z" fill="#E8DEC8"/>
        <path d="M52,55 L78,55 L78,100 L70,108 L52,108 Z" fill="#E0D0B5"/>
        <path d="M84,55 L108,55 L108,112 L82,108 Z" fill="#D8C8AB"/>
        <path d="M114,55 L140,55 L140,108 L112,112 Z" fill="#E8DEC8"/>
        <path d="M146,55 L170,55 L168,108 L144,112 Z" fill="#D8C8AB"/>
        <!-- chip mark -->
        <path d="M85,55 L97,72 L108,55 Z" fill="rgba(0,0,0,0.18)"/>
      </ng-container>
      <ng-container *ngIf="variant === 'after'">
        <!-- uniform veneers -->
        <rect x="22" y="55" width="26" height="58" rx="6" fill="#FFFFFF"/>
        <rect x="52" y="55" width="26" height="58" rx="6" fill="#FAFCFF"/>
        <rect x="82" y="55" width="26" height="58" rx="6" fill="#FFFFFF"/>
        <rect x="112" y="55" width="26" height="58" rx="6" fill="#FAFCFF"/>
        <rect x="142" y="55" width="26" height="58" rx="6" fill="#FFFFFF"/>
        <!-- shine on each tooth -->
        <rect *ngFor="let i of fives" [attr.x]="22 + i*30" y="60" width="6" height="20" rx="2" fill="rgba(14,165,233,0.18)"/>
        <!-- sparkle -->
        <text x="172" y="42" fill="#0EA5E9" font-size="20" font-family="serif">✦</text>
      </ng-container>
    </g>

    <!-- ─── WHITENING ─── -->
    <g *ngSwitchCase="'whitening'">
      <rect *ngFor="let i of fives"
            [attr.x]="22 + i*30" y="55" width="26" height="58" rx="6"
            [attr.fill]="variant === 'before' ? toothBefore(i) : '#FFFFFF'"/>
      <ng-container *ngIf="variant === 'after'">
        <rect *ngFor="let i of fives" [attr.x]="22 + i*30" y="60" width="6" height="20" rx="2" fill="rgba(14,165,233,0.18)"/>
        <text x="172" y="42" fill="#0EA5E9" font-size="20" font-family="serif">✦</text>
        <text x="14"  y="42" fill="#14B8A6" font-size="14" font-family="serif">✦</text>
      </ng-container>
    </g>

    <!-- ─── IMPLANTS ─── -->
    <g *ngSwitchCase="'implants'">
      <ng-container *ngIf="variant === 'before'">
        <rect x="22" y="55" width="26" height="58" rx="6" fill="#FFFFFF"/>
        <rect x="52" y="55" width="26" height="58" rx="6" fill="#FFFFFF"/>
        <!-- gap (dark mouth) -->
        <rect x="82" y="55" width="26" height="58" rx="6" fill="#7E2F2A"/>
        <path d="M88,62 Q95,80 102,62" stroke="#a04640" stroke-width="2" fill="none"/>
        <rect x="112" y="55" width="26" height="58" rx="6" fill="#FFFFFF"/>
        <rect x="142" y="55" width="26" height="58" rx="6" fill="#FFFFFF"/>
      </ng-container>
      <ng-container *ngIf="variant === 'after'">
        <rect *ngFor="let i of fives" [attr.x]="22 + i*30" y="55" width="26" height="58" rx="6" fill="#FFFFFF"/>
        <!-- implant screw indicator under center tooth -->
        <rect x="92" y="113" width="6" height="14" fill="#94a3b8"/>
        <rect x="89" y="118" width="12" height="2" fill="#64748b"/>
        <rect x="89" y="122" width="12" height="2" fill="#64748b"/>
        <text x="172" y="42" fill="#0EA5E9" font-size="14" font-family="sans-serif">+</text>
      </ng-container>
    </g>

    <!-- ─── BRACES / ALIGNERS ─── -->
    <g *ngSwitchCase="'braces'">
      <ng-container *ngIf="variant === 'before'">
        <!-- crowded / rotated teeth -->
        <rect x="22" y="58" width="26" height="55" rx="6" fill="#FFFFFF" transform="rotate(-8 35 85)"/>
        <rect x="50" y="55" width="26" height="58" rx="6" fill="#FFFFFF" transform="rotate(6 63 85)"/>
        <rect x="80" y="60" width="26" height="55" rx="6" fill="#FFFFFF" transform="rotate(-4 93 85)"/>
        <rect x="108" y="55" width="26" height="58" rx="6" fill="#FFFFFF" transform="rotate(10 121 85)"/>
        <rect x="140" y="58" width="26" height="55" rx="6" fill="#FFFFFF" transform="rotate(-6 153 85)"/>
      </ng-container>
      <ng-container *ngIf="variant === 'after'">
        <rect *ngFor="let i of fives" [attr.x]="22 + i*30" y="55" width="26" height="58" rx="6" fill="#FFFFFF"/>
        <!-- transparent aligner overlay (cyan tint) -->
        <rect x="18" y="51" width="156" height="66" rx="10" fill="rgba(14,165,233,0.12)" stroke="rgba(14,165,233,0.45)" stroke-width="1.5"/>
        <text x="172" y="42" fill="#0EA5E9" font-size="14" font-family="serif">✦</text>
      </ng-container>
    </g>

    <!-- ─── CROWNS ─── -->
    <g *ngSwitchCase="'crowns'">
      <ng-container *ngIf="variant === 'before'">
        <rect x="22" y="55" width="26" height="58" rx="6" fill="#FFFFFF"/>
        <rect x="52" y="55" width="26" height="58" rx="6" fill="#FFFFFF"/>
        <!-- broken/dark tooth -->
        <path d="M82,55 L108,55 L108,80 L100,90 L96,72 L88,90 L82,80 Z" fill="#6B5740"/>
        <rect x="112" y="55" width="26" height="58" rx="6" fill="#FFFFFF"/>
        <rect x="142" y="55" width="26" height="58" rx="6" fill="#FFFFFF"/>
      </ng-container>
      <ng-container *ngIf="variant === 'after'">
        <rect *ngFor="let i of fives" [attr.x]="22 + i*30" y="55" width="26" height="58" rx="6" fill="#FFFFFF"/>
        <!-- crown indicator (small badge) -->
        <circle cx="95" cy="46" r="9" fill="#0EA5E9"/>
        <text x="91.5" y="49.5" fill="#fff" font-size="10" font-family="serif">♛</text>
      </ng-container>
    </g>

    <!-- ─── SMILE MAKEOVER ─── -->
    <g *ngSwitchCase="'makeover'">
      <ng-container *ngIf="variant === 'before'">
        <!-- mixed: yellow + gap + crooked -->
        <rect x="22" y="55" width="26" height="58" rx="6" fill="#E5C977"/>
        <rect x="50" y="55" width="26" height="58" rx="6" fill="#E8D08A" transform="rotate(-6 63 85)"/>
        <rect x="82" y="55" width="26" height="58" rx="6" fill="#7E2F2A"/>
        <rect x="110" y="55" width="26" height="58" rx="6" fill="#E0D0B5" transform="rotate(8 121 85)"/>
        <rect x="142" y="55" width="26" height="58" rx="6" fill="#E5C977"/>
      </ng-container>
      <ng-container *ngIf="variant === 'after'">
        <rect *ngFor="let i of fives" [attr.x]="22 + i*30" y="55" width="26" height="58" rx="6" fill="#FFFFFF"/>
        <rect *ngFor="let i of fives" [attr.x]="22 + i*30" y="60" width="6" height="20" rx="2" fill="rgba(14,165,233,0.2)"/>
        <text x="172" y="42" fill="#0EA5E9" font-size="20" font-family="serif">✦</text>
        <text x="12"  y="42" fill="#14B8A6" font-size="14" font-family="serif">✦</text>
      </ng-container>
    </g>

  </ng-container>

  <!-- ===== BOTTOM LIP / SHADOW ===== -->
  <path d="M-2,118 Q100,108 202,118 L202,150 L-2,150 Z" [attr.fill]="gumColor()"/>
</svg>
  `,
  styles: [`
    :host {
      position: absolute;
      inset: 0;
      display: block;
    }
    .smile-svg {
      width: 100%;
      height: 100%;
      display: block;
    }
  `]
})
export class SmileSvgComponent {
  @Input({ required: true }) treatment!: SmileTreatment;
  @Input({ required: true }) variant!: SmileVariant;

  fives = [0, 1, 2, 3, 4];

  /** Background tone: warm/dull for "before", cool/clean for "after". */
  bg(): string {
    return this.variant === 'before' ? '#FCE7E0' : '#E0F2FE';
  }

  /** Lip / gum colour stays roughly the same in both variants. */
  gumColor(): string {
    return this.variant === 'before' ? '#E89989' : '#F2A696';
  }

  /** Per-tooth colour for the whitening "before" — alternating yellow shades. */
  toothBefore(i: number): string {
    return i % 2 === 0 ? '#E8D08A' : '#E5C977';
  }
}
