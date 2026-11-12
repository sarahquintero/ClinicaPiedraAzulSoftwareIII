import { Component, Input } from '@angular/core';
import { BadgeVariant, TableColumn } from '../../../core/models/clinic.models';
import { BadgeComponent } from '../badge/badge.component';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [BadgeComponent],
  template: `
    <div class="pa-table-wrapper">
      <table class="pa-table">
        <thead>
          <tr>
            @for (col of columns; track col.key) {
              <th scope="col" [class]="hideClass(col)">{{ col.label }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @if (data.length === 0) {
            <tr>
              <td [attr.colspan]="columns.length || 1" class="pa-table__empty">
                {{ emptyMessage }}
              </td>
            </tr>
          } @else {
            @for (row of data; track $index; let i = $index) {
              <tr class="pa-table__row" [style.animation-delay]="i * 40 + 'ms'">
                @for (col of columns; track col.key) {
                  <td [attr.data-label]="col.label" [class]="hideClass(col)">
                    @if (col.type === 'badge') {
                      <app-badge
                        [variant]="resolveBadgeVariant(col, row[col.key])"
                        [text]="formatCellValue(row[col.key])"
                      />
                    } @else {
                      <span class="pa-table__cell-text">{{ formatCellValue(row[col.key]) }}</span>
                    }
                  </td>
                }
              </tr>
            }
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [
    `
      .pa-table-wrapper {
        width: 100%;
        overflow-x: auto;
        border-radius: var(--pa-radius-md);
        border: 2px solid var(--pa-border);
        background-color: var(--pa-white);
      }

      .pa-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
        font-size: 1.05rem; /* 19px para lectura fácil */
      }

      .pa-table thead tr {
        background-color: var(--pa-surface-alt);
        border-bottom: 2px solid var(--pa-border-strong);
      }

      .pa-table th {
        padding: 1rem 1.15rem;
        font-size: 1rem; /* 18px */
        font-weight: 800;
        color: var(--pa-blue-900);
        white-space: nowrap;
      }

      .pa-table td {
        padding: 1.05rem 1.15rem;
        color: var(--pa-text-main);
        border-bottom: 1.5px solid var(--pa-border);
        vertical-align: middle;
      }

      .pa-table__row {
        animation: paRowFadeIn 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
        transition:
          background-color var(--pa-transition),
          transform var(--pa-transition);

        &:nth-child(even) {
          background-color: #fafcfe;
        }

        &:hover {
          background-color: var(--pa-blue-50);
          transform: translateX(3px);
        }

        &:last-child td {
          border-bottom: none;
        }
      }

      .pa-table__cell-text {
        font-weight: 600;
        color: var(--pa-text-main);
      }

      .pa-table__empty {
        text-align: center;
        padding: 2.5rem 1.25rem !important;
        color: var(--pa-text-secondary);
        font-size: 1.111rem;
        font-weight: 600;
      }

      /* Columnas que se ocultan según el tamaño */
      @media (max-width: 1024px) {
        .pa-col-hide-tablet {
          display: none !important;
        }
      }

      @media (max-width: 640px) {
        .pa-col-hide-mobile {
          display: none !important;
        }

        /* Móvil: cada fila se convierte en una tarjeta */
        .pa-table-wrapper {
          overflow-x: visible;
          border: none;
          background: transparent;
        }

        .pa-table,
        .pa-table tbody,
        .pa-table tr,
        .pa-table td {
          display: block;
          width: 100%;
        }

        .pa-table thead {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
        }

        .pa-table__row {
          background-color: var(--pa-white);
          border: 2px solid var(--pa-border);
          border-radius: var(--pa-radius-md);
          margin-bottom: 1rem;
          padding: 0.35rem 0;
        }

        .pa-table__row:hover {
          transform: none;
        }

        .pa-table td {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding: 0.7rem 1rem;
          text-align: right;
          border-bottom: 1px dashed var(--pa-border);
        }

        .pa-table td::before {
          content: attr(data-label);
          font-weight: 800;
          color: var(--pa-blue-900);
          text-align: left;
          flex-shrink: 0;
        }

        .pa-table__row td:last-child {
          border-bottom: none;
        }

        .pa-table td.pa-table__empty {
          display: block;
          text-align: center;
        }

        .pa-table td.pa-table__empty::before {
          content: none;
        }
    }
    `,
  ],
})
export class TableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: Record<string, unknown>[] = [];
  @Input() emptyMessage = 'No se encontraron registros para mostrar.';

  hideClass(col: TableColumn): string {
    return col.hide ? 'pa-col-hide-' + col.hide : '';
  }

  formatCellValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    return String(value);
  }

  resolveBadgeVariant(col: TableColumn, rawValue: unknown): BadgeVariant {
    const key = String(rawValue ?? '');
    if (col.badgeMap && col.badgeMap[key]) {
      return col.badgeMap[key];
    }
    const upper = key.toUpperCase();
    if (upper === 'ACTIVO' || upper === 'COMPLETADA') return 'success';
    if (upper === 'PROGRAMADA') return 'primary';
    if (upper === 'CANCELADA' || upper === 'INACTIVO') return 'danger';
    return 'info';
  }
}
