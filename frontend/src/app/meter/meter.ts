import { Component, computed, input } from '@angular/core';

type Severity = 'normal' | 'warning' | 'critical';

const SEVERITY_COLOR: Record<Severity, string> = {
  normal: 'var(--accent)',
  warning: 'var(--status-warning)',
  critical: 'var(--status-critical)',
};

const SEVERITY_LABEL: Record<Severity, string | null> = {
  normal: null,
  warning: 'Warning',
  critical: 'Critical',
};

@Component({
  selector: 'app-meter',
  imports: [],
  template: `
    <div>
      <div class="mb-1 flex items-baseline justify-between">
        <span class="text-sm text-(--ink-secondary)">{{ label() }}</span>
        <span class="text-sm font-semibold text-(--ink-primary)">
          {{ percent() !== null ? percent() + '%' : '—' }}
        </span>
      </div>

      <div
        class="h-2 overflow-hidden rounded-full bg-(--accent-track)"
        role="progressbar"
        [attr.aria-label]="label()"
        [attr.aria-valuenow]="percent()"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          class="h-full rounded-full transition-[width]"
          [style.width.%]="percent() ?? 0"
          [style.backgroundColor]="fillColor()"
        ></div>
      </div>

      <div class="mt-1 flex min-h-4 items-center justify-between">
        @if (sublabel(); as sub) {
          <span class="text-xs text-(--ink-muted)">{{ sub }}</span>
        }
        @if (severityLabel(); as sev) {
          <span class="inline-flex items-center gap-1 text-xs font-medium text-(--ink-secondary)">
            <span
              class="h-1.5 w-1.5 rounded-full"
              [style.backgroundColor]="fillColor()"
              aria-hidden="true"
            ></span>
            {{ sev }}
          </span>
        }
      </div>
    </div>
  `,
})
export class Meter {
  readonly label = input.required<string>();
  readonly percent = input<number | null>(null);
  readonly sublabel = input<string | null>(null);

  private readonly severity = computed<Severity>(() => {
    const p = this.percent();
    if (p === null) return 'normal';
    if (p >= 90) return 'critical';
    if (p >= 75) return 'warning';
    return 'normal';
  });

  readonly fillColor = computed(() => SEVERITY_COLOR[this.severity()]);
  readonly severityLabel = computed(() => SEVERITY_LABEL[this.severity()]);
}
