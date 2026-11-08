import { Component, Input } from '@angular/core';
import { TableColumn } from '../../../core/models/clinic.models';
import { BadgeComponent } from '../../atoms/badge/badge.component';
import { TableComponent } from '../../atoms/table/table.component';

@Component({
  selector: 'app-table-with-title',
  standalone: true,
  imports: [TableComponent, BadgeComponent],
  template: `
    <section class="pa-table-card">
      <header class="pa-table-card__header">
        <div class="pa-table-card__heading">
          <div class="pa-table-card__title-row">
            <h2>{{ title }}</h2>
            @if (badgeText) {
              <app-badge variant="primary" [text]="badgeText" />
            }
          </div>
          @if (subtitle) {
            <p class="pa-table-card__subtitle">{{ subtitle }}</p>
          }
        </div>
        <div class="pa-table-card__actions">
          <ng-content></ng-content>
        </div>
      </header>

      <div class="pa-table-card__body">
        <app-table [columns]="columns" [data]="data" [emptyMessage]="emptyMessage" />
      </div>
    </section>
  `,
  styles: [
    `
      .pa-table-card {
        background-color: var(--pa-surface);
        border: 2px solid var(--pa-border);
        border-radius: var(--pa-radius-lg);
        box-shadow: var(--pa-shadow-sm);
        padding: 1.65rem 1.85rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .pa-table-card__header {
        background-color: var(--pa-surface-alt);
        border: 1.5px solid var(--pa-border);
        border-radius: var(--pa-radius-md);
        padding: 1.15rem 1.35rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 1.15rem;
      }

      .pa-table-card__heading {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      .pa-table-card__title-row {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        flex-wrap: wrap;
      }

      .pa-table-card__subtitle {
        font-size: 1.05rem;
        color: var(--pa-text-secondary);
      }

      .pa-table-card__actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      @media (max-width: 640px) {
        .pa-table-card {
          padding: 1.15rem;
        }
      }
    `,
  ],
})
export class TableWithTitleComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() badgeText = '';
  @Input() columns: TableColumn[] = [];
  @Input() data: Record<string, unknown>[] = [];
  @Input() emptyMessage = 'No hay registros disponibles.';
}
