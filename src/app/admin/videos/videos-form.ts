import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminDataService } from '../../services/admin-data.service';

/** Supabase free plan: 50 MB per stored object. */
const MAX_BYTES = 50 * 1024 * 1024;
const ACCEPTED = ['video/webm', 'video/mp4'];

interface VideoProbe {
  width: number;
  height: number;
  poster: File | null;
}

/**
 * Load a local video file, read its real resolution and grab one frame as a
 * WebP poster. Works on the local File (object URL), so there are no CORS
 * issues and nothing is uploaded until the probe succeeds. Rejects when the
 * browser can't decode the file (e.g. HEVC/H.265 iPhone clips in Chrome) —
 * the public site couldn't play those either.
 */
function probeVideo(file: File): Promise<VideoProbe> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.preload = 'auto';
    const done = (fn: () => void) => { fn(); URL.revokeObjectURL(url); v.removeAttribute('src'); v.load(); };

    v.onerror = () => done(() => reject(new Error(
      'This browser cannot play this video. Export it as WebM or MP4 (H.264) and try again.')));

    v.onloadedmetadata = () => {
      if (!v.videoWidth || !v.videoHeight) {
        done(() => reject(new Error('Could not read the video size.')));
        return;
      }
      const t = isFinite(v.duration) ? Math.min(1, v.duration * 0.25) : 0;
      v.currentTime = t;
    };

    v.onseeked = () => {
      const width = v.videoWidth, height = v.videoHeight;
      try {
        // Cap the poster at 1280px on the long edge — it's only a placeholder.
        const scale = Math.min(1, 1280 / Math.max(width, height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        canvas.getContext('2d')!.drawImage(v, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
          const poster = blob ? new File([blob], 'poster.webp', { type: 'image/webp' }) : null;
          done(() => resolve({ width, height, poster }));
        }, 'image/webp', 0.82);
      } catch {
        done(() => resolve({ width, height, poster: null }));
      }
    };

    v.src = url;
  });
}

@Component({
  selector: 'app-admin-videos-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './videos-form.html',
  styleUrl: '../admin-shared.scss',
})
export class AdminVideosForm implements OnInit {
  private fb = inject(FormBuilder);
  private data = inject(AdminDataService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  editingId = signal<string | null>(null);
  saving = signal(false);
  uploading = signal<string | null>(null);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    videoUrl: ['', Validators.required],
    posterUrl: [''],
    width: [0],
    height: [0],
    sortOrder: [0],
    published: [true],
  });

  invalid(field: string) {
    const c = this.form.get(field);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.editingId.set(id);
    try {
      const v = await this.data.getVideo(id);
      this.form.patchValue({
        title: v.title,
        description: v.description,
        videoUrl: v.videoUrl,
        posterUrl: v.posterUrl ?? '',
        width: v.width ?? 0,
        height: v.height ?? 0,
        sortOrder: v.sortOrder,
        published: v.published,
      });
    } catch (e: any) {
      this.error.set(e.message ?? 'Failed to load video');
    }
  }

  async onVideoChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.error.set(null);
    if (!ACCEPTED.includes(file.type)) {
      this.error.set('Please choose a WebM or MP4 video.');
      return;
    }
    if (file.size > MAX_BYTES) {
      this.error.set(`Video is ${(file.size / 1048576).toFixed(1)} MB — the limit is 50 MB. Compress it (e.g. HandBrake) and try again.`);
      return;
    }

    try {
      this.uploading.set('Reading video…');
      const probe = await probeVideo(file);

      this.uploading.set(`Uploading video (${(file.size / 1048576).toFixed(1)} MB)…`);
      const videoUrl = await this.data.uploadVideo(file);

      let posterUrl = '';
      if (probe.poster) {
        this.uploading.set('Saving thumbnail…');
        posterUrl = await this.data.uploadImage('videos', probe.poster).catch(() => '');
      }

      this.form.patchValue({ videoUrl, posterUrl, width: probe.width, height: probe.height });
      if (!this.form.value.title) {
        this.form.patchValue({ title: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ') });
      }
    } catch (e: any) {
      this.error.set(e.message ?? 'Video upload failed');
    } finally {
      this.uploading.set(null);
    }
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (!this.form.value.videoUrl) this.error.set('Please upload a video first.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    try {
      const v = this.form.getRawValue();
      await this.data.saveVideo({
        id: this.editingId() ?? undefined,
        title: v.title.trim(),
        description: v.description.trim(),
        videoUrl: v.videoUrl,
        posterUrl: v.posterUrl || undefined,
        width: v.width || undefined,
        height: v.height || undefined,
        sortOrder: Number(v.sortOrder) || 0,
        published: v.published,
      });
      this.router.navigate(['/adminauthlogin/videos']);
    } catch (e: any) {
      this.error.set(e.message ?? 'Save failed');
    } finally {
      this.saving.set(false);
    }
  }
}
