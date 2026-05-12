import { Component, Input, computed, signal } from '@angular/core';

/**
 * Blog post illustration — renders a stylised, category-themed SVG
 * cover for each blog card. No external image dependencies, fully
 * on-brand, scales to any size.
 *
 * Category mapping:
 *   Implants    → tooth + implant screw
 *   Cosmetic    → sparkle burst + smile arc
 *   Orthodontics → aligner / curved teeth
 *   Pediatric   → smiling child tooth
 *   Lifestyle   → coffee cup + tooth (food/staining)
 *   Hygiene     → toothbrush + bubbles
 *   General     → stethoscope + tooth
 */
@Component({
  selector: 'app-blog-illustration',
  standalone: true,
  imports: [],
  template: `
    <svg
      viewBox="0 0 400 250"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      class="blog-svg"
    >
      <!-- Background -->
      <defs>
        <linearGradient [attr.id]="'bg-' + uid()" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" [attr.stop-color]="bgFrom()" />
          <stop offset="100%" [attr.stop-color]="bgTo()" />
        </linearGradient>
        <radialGradient [attr.id]="'shine-' + uid()" cx="30%" cy="20%" r="60%">
          <stop offset="0" stop-color="rgba(255,255,255,0.35)" />
          <stop offset="1" stop-color="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <rect width="400" height="250" [attr.fill]="'url(#bg-' + uid() + ')'" />
      <rect width="400" height="250" [attr.fill]="'url(#shine-' + uid() + ')'" />

      <!-- Category-specific illustration -->
      <g>
        @switch (key()) {
          <!-- ─── IMPLANTS ─── -->
          @case ('implants') {
            <g>
              <!-- Big tooth -->
              <path
                d="M200 50 C242 50 270 70 270 105 C270 138 262 158 252 188 C247 207 240 222 224 222 C212 222 210 200 200 188 C190 200 188 222 176 222 C160 222 153 207 148 188 C138 158 130 138 130 105 C130 70 158 50 200 50 Z"
                fill="#FFFFFF"
                opacity="0.96"
              />
              <path
                d="M170 80 C180 72 195 70 200 76 C205 70 220 72 230 80"
                stroke="rgba(14,165,233,0.4)"
                stroke-width="2"
                fill="none"
                stroke-linecap="round"
              />
              <!-- implant screw under tooth -->
              <rect x="195" y="222" width="10" height="14" fill="rgba(255,255,255,0.85)" />
              <rect x="190" y="226" width="20" height="2" fill="rgba(15,23,42,0.4)" />
              <rect x="190" y="230" width="20" height="2" fill="rgba(15,23,42,0.4)" />
              <rect x="190" y="234" width="20" height="2" fill="rgba(15,23,42,0.4)" />
              <!-- accent dots -->
              <circle cx="80" cy="60" r="6" fill="rgba(255,255,255,0.5)" />
              <circle cx="340" cy="200" r="8" fill="rgba(255,255,255,0.4)" />
              <circle cx="50" cy="180" r="4" fill="rgba(255,255,255,0.55)" />
            </g>
          }
          <!-- ─── COSMETIC / SMILE DESIGN ─── -->
          @case ('cosmetic') {
            <g>
              <!-- sparkle burst (large, center-back) -->
              <g
                transform="translate(200,125)"
                stroke="rgba(255,255,255,0.55)"
                stroke-width="2.5"
                stroke-linecap="round"
              >
                <line x1="0" y1="-70" x2="0" y2="-50" />
                <line x1="0" y1="50" x2="0" y2="70" />
                <line x1="-70" y1="0" x2="-50" y2="0" />
                <line x1="50" y1="0" x2="70" y2="0" />
                <line x1="-50" y1="-50" x2="-36" y2="-36" />
                <line x1="50" y1="50" x2="36" y2="36" />
                <line x1="-50" y1="50" x2="-36" y2="36" />
                <line x1="50" y1="-50" x2="36" y2="-36" />
              </g>
              <!-- 5 white teeth in a smile arc -->
              <path
                d="M150,140 Q200,165 250,140"
                stroke="rgba(255,255,255,0.4)"
                stroke-width="2"
                fill="none"
              />
              <rect x="160" y="120" width="14" height="28" rx="3" fill="#fff" />
              <rect x="178" y="120" width="14" height="30" rx="3" fill="#fff" />
              <rect x="196" y="120" width="14" height="30" rx="3" fill="#fff" />
              <rect x="214" y="120" width="14" height="30" rx="3" fill="#fff" />
              <rect x="232" y="120" width="14" height="28" rx="3" fill="#fff" />
              <!-- decorative star -->
              <text x="60" y="60" fill="rgba(255,255,255,0.8)" font-size="28" font-family="serif">
                ✦
              </text>
              <text x="320" y="200" fill="rgba(255,255,255,0.6)" font-size="20" font-family="serif">
                ✦
              </text>
            </g>
          }
          <!-- ─── ORTHODONTICS / ALIGNERS ─── -->
          @case ('orthodontics') {
            <g>
              <!-- aligner outline arc -->
              <path
                d="M120,140 Q200,75 280,140"
                stroke="rgba(255,255,255,0.7)"
                stroke-width="3"
                fill="rgba(255,255,255,0.1)"
                stroke-linecap="round"
              />
              <path
                d="M125,150 Q200,90 275,150"
                stroke="rgba(255,255,255,0.5)"
                stroke-width="2"
                fill="none"
                stroke-dasharray="4,4"
                stroke-linecap="round"
              />
              <!-- 5 aligned teeth inside arc -->
              <rect x="155" y="115" width="14" height="30" rx="3" fill="#fff" />
              <rect x="175" y="105" width="14" height="38" rx="3" fill="#fff" />
              <rect x="195" y="100" width="14" height="42" rx="3" fill="#fff" />
              <rect x="215" y="105" width="14" height="38" rx="3" fill="#fff" />
              <rect x="235" y="115" width="14" height="30" rx="3" fill="#fff" />
              <!-- arrow indicating alignment -->
              <path
                d="M310,80 L340,80 L335,75 M340,80 L335,85"
                stroke="rgba(255,255,255,0.7)"
                stroke-width="2"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <text
                x="300"
                y="200"
                fill="rgba(255,255,255,0.55)"
                font-size="18"
                font-family="serif"
              >
                ✓
              </text>
            </g>
          }
          <!-- ─── PEDIATRIC ─── -->
          @case ('pediatric') {
            <g>
              <!-- friendly tooth with face -->
              <path
                d="M200 60 C242 60 268 78 268 110 C268 138 260 156 252 182 C247 200 240 215 226 215 C214 215 212 195 200 185 C188 195 186 215 174 215 C160 215 153 200 148 182 C140 156 132 138 132 110 C132 78 158 60 200 60 Z"
                fill="#FFFFFF"
                opacity="0.96"
              />
              <!-- smile face on tooth -->
              <circle cx="180" cy="115" r="5" fill="rgba(15,23,42,0.6)" />
              <circle cx="220" cy="115" r="5" fill="rgba(15,23,42,0.6)" />
              <path
                d="M178,140 Q200,158 222,140"
                stroke="rgba(15,23,42,0.6)"
                stroke-width="3"
                fill="none"
                stroke-linecap="round"
              />
              <!-- balloons / dots -->
              <circle cx="70" cy="80" r="14" fill="rgba(255,255,255,0.45)" />
              <line
                x1="70"
                y1="94"
                x2="70"
                y2="125"
                stroke="rgba(255,255,255,0.45)"
                stroke-width="1"
              />
              <circle cx="330" cy="60" r="10" fill="rgba(255,255,255,0.4)" />
              <line
                x1="330"
                y1="70"
                x2="330"
                y2="105"
                stroke="rgba(255,255,255,0.4)"
                stroke-width="1"
              />
              <text x="50" y="200" fill="rgba(255,255,255,0.55)" font-size="22" font-family="serif">
                ★
              </text>
              <text x="350" y="195" fill="rgba(255,255,255,0.5)" font-size="18" font-family="serif">
                ★
              </text>
            </g>
          }
          <!-- ─── LIFESTYLE / FOODS ─── -->
          @case ('lifestyle') {
            <g>
              <!-- coffee cup -->
              <rect x="135" y="105" width="80" height="80" rx="6" fill="#FFFFFF" opacity="0.95" />
              <rect x="135" y="105" width="80" height="14" fill="rgba(15,23,42,0.15)" />
              <path
                d="M215,130 Q245,130 245,150 Q245,170 215,170"
                stroke="#FFFFFF"
                stroke-width="6"
                fill="none"
              />
              <!-- steam -->
              <path
                d="M155,90 Q160,80 155,70"
                stroke="rgba(255,255,255,0.7)"
                stroke-width="2.5"
                fill="none"
                stroke-linecap="round"
              />
              <path
                d="M175,85 Q180,73 175,63"
                stroke="rgba(255,255,255,0.65)"
                stroke-width="2.5"
                fill="none"
                stroke-linecap="round"
              />
              <path
                d="M195,90 Q200,80 195,70"
                stroke="rgba(255,255,255,0.7)"
                stroke-width="2.5"
                fill="none"
                stroke-linecap="round"
              />
              <!-- small tooth on the side -->
              <path
                d="M310 130 C322 130 330 138 330 150 C330 162 326 168 322 178 C320 184 318 190 313 190 C309 190 309 182 307 178 C305 182 305 190 301 190 C296 190 294 184 292 178 C288 168 285 162 285 150 C285 138 293 130 305 130 Z"
                fill="rgba(255,255,255,0.85)"
              />
              <text x="270" y="100" fill="rgba(255,255,255,0.6)" font-size="22" font-family="serif">
                !
              </text>
            </g>
          }
          <!-- ─── HYGIENE / GUMS ─── -->
          @case ('hygiene') {
            <g>
              <!-- toothbrush at angle -->
              <g transform="rotate(-30 200 130)">
                <rect
                  x="120"
                  y="124"
                  width="160"
                  height="14"
                  rx="6"
                  fill="#FFFFFF"
                  opacity="0.95"
                />
                <!-- bristles -->
                <rect x="240" y="120" width="42" height="22" rx="3" fill="rgba(255,255,255,0.7)" />
                <line
                  x1="246"
                  y1="118"
                  x2="246"
                  y2="144"
                  stroke="rgba(15,23,42,0.4)"
                  stroke-width="1"
                />
                <line
                  x1="252"
                  y1="116"
                  x2="252"
                  y2="146"
                  stroke="rgba(15,23,42,0.4)"
                  stroke-width="1"
                />
                <line
                  x1="258"
                  y1="118"
                  x2="258"
                  y2="144"
                  stroke="rgba(15,23,42,0.4)"
                  stroke-width="1"
                />
                <line
                  x1="264"
                  y1="116"
                  x2="264"
                  y2="146"
                  stroke="rgba(15,23,42,0.4)"
                  stroke-width="1"
                />
                <line
                  x1="270"
                  y1="118"
                  x2="270"
                  y2="144"
                  stroke="rgba(15,23,42,0.4)"
                  stroke-width="1"
                />
                <line
                  x1="276"
                  y1="120"
                  x2="276"
                  y2="142"
                  stroke="rgba(15,23,42,0.4)"
                  stroke-width="1"
                />
              </g>
              <!-- bubbles -->
              <circle cx="320" cy="80" r="14" fill="rgba(255,255,255,0.5)" />
              <circle cx="350" cy="110" r="8" fill="rgba(255,255,255,0.45)" />
              <circle cx="60" cy="190" r="12" fill="rgba(255,255,255,0.45)" />
              <circle cx="90" cy="215" r="6" fill="rgba(255,255,255,0.5)" />
              <text x="40" y="80" fill="rgba(255,255,255,0.55)" font-size="20" font-family="serif">
                ✦
              </text>
            </g>
          }
          <!-- ─── GENERAL / DEFAULT ─── -->
          @default {
            <g>
              <!-- clipboard -->
              <rect x="140" y="65" width="120" height="140" rx="10" fill="#FFFFFF" opacity="0.95" />
              <rect x="170" y="58" width="60" height="20" rx="4" fill="rgba(15,23,42,0.18)" />
              <line
                x1="160"
                y1="100"
                x2="240"
                y2="100"
                stroke="rgba(15,23,42,0.25)"
                stroke-width="2"
                stroke-linecap="round"
              />
              <line
                x1="160"
                y1="120"
                x2="220"
                y2="120"
                stroke="rgba(15,23,42,0.2)"
                stroke-width="2"
                stroke-linecap="round"
              />
              <line
                x1="160"
                y1="140"
                x2="240"
                y2="140"
                stroke="rgba(15,23,42,0.25)"
                stroke-width="2"
                stroke-linecap="round"
              />
              <line
                x1="160"
                y1="160"
                x2="210"
                y2="160"
                stroke="rgba(15,23,42,0.2)"
                stroke-width="2"
                stroke-linecap="round"
              />
              <!-- check mark -->
              <circle cx="240" cy="180" r="14" fill="rgba(14,165,233,0.85)" />
              <path
                d="M233,180 L238,185 L248,175"
                stroke="#FFFFFF"
                stroke-width="2.5"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <!-- dots -->
              <circle cx="70" cy="100" r="5" fill="rgba(255,255,255,0.55)" />
              <circle cx="340" cy="170" r="6" fill="rgba(255,255,255,0.5)" />
            </g>
          }
        }
      </g>
    </svg>
  `,
  styles: [
    `
      :host {
        position: absolute;
        inset: 0;
        display: block;
      }
      .blog-svg {
        width: 100%;
        height: 100%;
        display: block;
      }
    `,
  ],
})
export class BlogIllustrationComponent {
  @Input({ required: true }) category = 'General';
  @Input() color = '#0EA5E9';

  // Stable per-instance id so multiple cards on the same page don't share gradient defs
  private static counter = 0;
  uid = signal(`b${++BlogIllustrationComponent.counter}`);

  /** Lowercase-keyword used by the [ngSwitch]. */
  key = computed(() => {
    const c = (this.category || '').toLowerCase();
    if (c.includes('implant')) return 'implants';
    if (c.includes('cosmetic')) return 'cosmetic';
    if (c.includes('ortho')) return 'orthodontics';
    if (c.includes('pediatric') || c.includes('paediatric') || c.includes('child'))
      return 'pediatric';
    if (c.includes('lifestyle') || c.includes('food')) return 'lifestyle';
    if (c.includes('hygiene') || c.includes('gum')) return 'hygiene';
    return 'general';
  });

  /** Slightly darker shade derived from the post's color for the gradient. */
  bgFrom = computed(() => this.color || '#0EA5E9');
  bgTo = computed(() => this.darken(this.color || '#0EA5E9', 0.45));

  private darken(hex: string, amount: number): string {
    const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (!m) return hex;
    const r = Math.max(0, Math.round(parseInt(m[1], 16) * (1 - amount)));
    const g = Math.max(0, Math.round(parseInt(m[2], 16) * (1 - amount)));
    const b = Math.max(0, Math.round(parseInt(m[3], 16) * (1 - amount)));
    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  }
}
