import { Component } from '@angular/core';
import { LogoComponent } from '../../atoms/logo/logo.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [LogoComponent],
  template: `
    <footer class="pa-footer">
      <div class="pa-footer__container">
        <div class="pa-footer__grid">
          <div class="pa-footer__col pa-footer__col--brand">
            <app-logo subtitle="Atención Preferencial para el Adulto Mayor" />
            <p class="pa-footer__desc">
              Institución Prestadora de Servicios de Salud (IPS) comprometida con la excelencia
              clínica, trato humano y accesibilidad universal para nuestros pacientes y sus familias.
            </p>
            <div class="pa-footer__cert">
              Código Habilitación MINSALUD: <strong>REPS-1100109482-01</strong> · NIT:
              <strong>901.482.319-4</strong>
            </div>
          </div>

          <div class="pa-footer__col">
            <h3>Sede y Líneas de Atención</h3>
            <ul>
              <li>📍 Av. Piedra Azul # 114-50, Torre Médica Central, Bogotá D.C.</li>
              <li>🚑 Línea de Urgencias 24 Horas: <strong>(601) 742-8900 Ext. 1</strong></li>
              <li>📞 Central Telefónica de Citas: <strong>(601) 742-8950</strong></li>
              <li>✉️ atencionpaciente&#64;piedraazul.com.co</li>
            </ul>
          </div>

          <div class="pa-footer__col">
            <h3>Horarios y Dirección Médica</h3>
            <ul>
              <li>🕒 Consulta Externa: Lunes a Viernes 07:00 a 19:00 | Sábados 08:00 a 14:00</li>
              <li>🧪 Toma de Muestras de Laboratorio: Lunes a Sábado 06:00 a 16:00</li>
              <li>🩺 Director Médico: Dr. Hernando Villa Restrepo (RM 19402-COL)</li>
              <li>🛡️ Vigilado Supersalud · Certificación de Calidad Hospitalaria</li>
            </ul>
          </div>
        </div>

        <div class="pa-footer__bottom">
          <span>© 2026 Clínica Piedra Azul S.A.S. Todos los derechos reservados.</span>
          <span>Tema Accesible Azul Celeste y Blanco · Seguridad JWT y Roles</span>
        </div>
      </div>
    </footer>
  `,
  styles: [
    `
      .pa-footer {
        background-color: var(--pa-surface-alt);
        color: var(--pa-text-main);
        margin-top: auto;
        border-top: 4px solid var(--pa-blue-700);
      }

      .pa-footer__container {
        max-width: 1360px;
        margin: 0 auto;
        padding: 2.5rem 1.5rem 1.75rem;
      }

      .pa-footer__grid {
        display: grid;
        grid-template-columns: 1.25fr 1fr 1fr;
        gap: 2.25rem;
        padding-bottom: 1.75rem;
        border-bottom: 2px solid var(--pa-border);
      }

      .pa-footer__col h3 {
        color: var(--pa-blue-900);
        font-size: 1.2rem;
        margin-bottom: 0.9rem;
      }

      .pa-footer__col ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
        font-size: 1.05rem;
        color: var(--pa-text-secondary);
      }

      .pa-footer__desc {
        margin-top: 0.85rem;
        font-size: 1.05rem;
        color: var(--pa-text-secondary);
      }

      .pa-footer__cert {
        margin-top: 0.9rem;
        display: inline-block;
        padding: 0.5rem 0.9rem;
        border-radius: var(--pa-radius-sm);
        background-color: var(--pa-white);
        border: 2px solid var(--pa-blue-700);
        color: var(--pa-blue-900);
        font-size: 0.95rem;
      }

      .pa-footer__bottom {
        padding-top: 1.25rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.85rem;
        font-size: 1rem;
        font-weight: 700;
        color: var(--pa-text-secondary);
      }

      @media (max-width: 960px) {
        .pa-footer__grid {
          grid-template-columns: 1fr;
          gap: 1.75rem;
        }
      }
    `,
  ],
})
export class FooterComponent {}
