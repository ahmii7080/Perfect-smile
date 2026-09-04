import { Component, ElementRef, forwardRef, signal, viewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cleanPastedHtml, escapeHtml, toArticleHtml } from './content-html';

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditor),
      multi: true,
    },
  ],
  template: `
    <div class="rte">
      <div class="rte__bar">
        <button type="button" title="Heading 2" (mousedown)="cmd($event, 'formatBlock', 'h2')"><b>H2</b></button>
        <button type="button" title="Heading 3" (mousedown)="cmd($event, 'formatBlock', 'h3')"><b>H3</b></button>
        <button type="button" title="Paragraph" (mousedown)="cmd($event, 'formatBlock', 'p')">&para;</button>
        <span class="rte__sep"></span>
        <button type="button" title="Bold" (mousedown)="cmd($event, 'bold')"><b>B</b></button>
        <button type="button" title="Italic" (mousedown)="cmd($event, 'italic')"><i>I</i></button>
        <span class="rte__sep"></span>
        <button type="button" title="Bulleted list" (mousedown)="cmd($event, 'insertUnorderedList')">&bull; List</button>
        <button type="button" title="Numbered list" (mousedown)="cmd($event, 'insertOrderedList')">1. List</button>
        <button type="button" title="Quote" (mousedown)="cmd($event, 'formatBlock', 'blockquote')">&ldquo;</button>
        <span class="rte__sep"></span>
        <button type="button" title="Add link" (mousedown)="link($event)">&#128279;</button>
        <button type="button" title="Remove formatting" (mousedown)="cmd($event, 'removeFormat')">&#10005;</button>
        <span class="rte__spacer"></span>
        <button
          type="button"
          class="rte__toggle"
          [class.is-on]="sourceMode()"
          (mousedown)="toggleSource($event)"
        >&lt;/&gt; HTML</button>
      </div>

      @if (!sourceMode()) {
        <div
          #surface
          class="rte__surface"
          contenteditable="true"
          role="textbox"
          aria-multiline="true"
          (input)="onInput()"
          (blur)="onTouched()"
          (paste)="onPaste($event)"
        ></div>
      } @else {
        <textarea
          class="rte__source"
          spellcheck="false"
          [value]="value()"
          (input)="onSourceInput($event)"
          (blur)="onTouched()"
        ></textarea>
      }

      <div class="rte__foot">
        <span>{{ wordCount() }} words</span>
        <span>Pasting from Word keeps headings, bold and lists — the markup is cleaned automatically.</span>
      </div>
    </div>
  `,
  styles: [`
    .rte { border: 1px solid #d7dfe6; border-radius: 10px; overflow: hidden; background: #fff; }
    .rte__bar {
      display: flex; align-items: center; gap: 4px; flex-wrap: wrap;
      padding: 6px 8px; background: #f5f8fa; border-bottom: 1px solid #e3eaf0;
    }
    .rte__bar button {
      min-width: 30px; height: 28px; padding: 0 7px;
      border: 1px solid transparent; border-radius: 6px;
      background: transparent; cursor: pointer;
      font-size: 12.5px; color: #33505f; line-height: 1;
    }
    .rte__bar button:hover { background: #e4edf3; border-color: #cfdde7; }
    .rte__toggle.is-on { background: #0f7ab0; border-color: #0f7ab0; color: #fff; }
    .rte__sep { width: 1px; height: 18px; background: #d7e2ea; margin: 0 3px; }
    .rte__spacer { flex: 1; }
    .rte__surface, .rte__source {
      display: block; width: 100%; min-height: 320px; max-height: 620px;
      overflow-y: auto; padding: 16px 18px; box-sizing: border-box;
      font-size: 14.5px; line-height: 1.7; color: #17313d;
    }
    .rte__surface:focus, .rte__source:focus { outline: none; }
    .rte__surface h2 { font-size: 21px; margin: 1.3em 0 0.5em; }
    .rte__surface h3 { font-size: 17.5px; margin: 1.2em 0 0.45em; }
    .rte__surface p { margin: 0 0 0.95em; }
    .rte__surface ul, .rte__surface ol { margin: 0 0 0.95em; padding-left: 1.5em; }
    .rte__surface blockquote {
      margin: 0 0 0.95em; padding: 0.4em 0 0.4em 1em;
      border-left: 3px solid #0f7ab0; color: #46606e; font-style: italic;
    }
    .rte__surface a { color: #0f7ab0; }
    .rte__source {
      border: 0; resize: vertical;
      font-family: ui-monospace, Consolas, monospace;
      font-size: 12.5px; background: #fbfdfe;
    }
    .rte__foot {
      display: flex; justify-content: space-between; gap: 1rem;
      padding: 6px 10px; background: #f5f8fa; border-top: 1px solid #e3eaf0;
      font-size: 11.5px; color: #6b8494;
    }
    .rte__foot span:last-child { text-align: right; }
  `],
})
export class RichTextEditor implements ControlValueAccessor {
  private surface = viewChild<ElementRef<HTMLElement>>('surface');

  /** Current HTML, in a signal so the source textarea and the word counter
   *  stay in step with the contenteditable surface. */
  value = signal('');
  sourceMode = signal(false);

  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  // ── ControlValueAccessor ──────────────────────────────────────────────

  writeValue(v: string | null): void {
    const html = toArticleHtml(v);
    this.value.set(html);
    const el = this.surface()?.nativeElement;
    if (el && el.innerHTML !== html) el.innerHTML = html;
  }

  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  setDisabledState(disabled: boolean): void {
    const el = this.surface()?.nativeElement;
    if (el) el.contentEditable = disabled ? 'false' : 'true';
  }

  // ── Editing ───────────────────────────────────────────────────────────

  /**
   * Bound to `mousedown` rather than `click`, with `preventDefault`, so the
   * toolbar never steals focus from the surface — `execCommand` acts on the
   * live selection and needs the caret left where the author put it.
   */
  cmd(ev: Event, command: string, arg?: string): void {
    ev.preventDefault();
    this.surface()?.nativeElement.focus();
    document.execCommand(command, false, arg);
    this.onInput();
  }

  link(ev: Event): void {
    ev.preventDefault();
    const el = this.surface()?.nativeElement;
    el?.focus();
    const url = window.prompt('Link URL', 'https://');
    if (!url) return;
    document.execCommand('createLink', false, url);
    // Off-site links open in a new tab; internal ones stay in the SPA.
    for (const a of Array.from(el?.querySelectorAll('a') ?? [])) {
      const href = a.getAttribute('href') ?? '';
      if (/^https?:\/\//i.test(href) && !href.includes(location.host)) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
      }
    }
    this.onInput();
  }

  onInput(): void {
    const el = this.surface()?.nativeElement;
    if (!el) return;
    this.value.set(el.innerHTML);
    this.onChange(el.innerHTML);
  }

  onSourceInput(ev: Event): void {
    const html = (ev.target as HTMLTextAreaElement).value;
    this.value.set(html);
    this.onChange(html);
  }

  toggleSource(ev: Event): void {
    ev.preventDefault();
    const goingToSource = !this.sourceMode();
    if (!goingToSource) {
      // Returning from source view — push the hand-edited HTML back into
      // the surface once @if has re-created it.
      const html = this.value();
      queueMicrotask(() => {
        const el = this.surface()?.nativeElement;
        if (el) el.innerHTML = html;
      });
    }
    this.sourceMode.set(goingToSource);
  }

  wordCount(): number {
    const text = this.value().replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');
    return text.split(/\s+/).filter(Boolean).length;
  }

  // ── Paste cleaning ────────────────────────────────────────────────────

  /**
   * Word and Google Docs put a whole HTML document on the clipboard — <o:p>
   * tags, class="MsoNormal", and inline mso-* styles that bloat the stored
   * article and defeat the SEO analyser's heading parser. We take the rich
   * `text/html` flavour, reduce it to the allowlist, and insert that.
   * Falling back to `text/plain` means a source with no HTML flavour still
   * lands as real paragraphs instead of one run-on block.
   */
  onPaste(ev: ClipboardEvent): void {
    const html = ev.clipboardData?.getData('text/html');
    const text = ev.clipboardData?.getData('text/plain') ?? '';
    ev.preventDefault();

    const clean = html
      ? cleanPastedHtml(html, document)
      : text.split(/\n{2,}/).map(p => `<p>${escapeHtml(p.trim())}</p>`).join('');

    document.execCommand('insertHTML', false, clean);
    this.onInput();
  }

}
