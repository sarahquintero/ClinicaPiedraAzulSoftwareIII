import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="pa-form-field">
      @if (label) {
        <label class="pa-form-label" [attr.for]="inputId">
          {{ label }}
          @if (required) {
            <span class="pa-form-req" aria-hidden="true">*</span>
          }
        </label>
      }
      <input
        class="pa-form-control"
        [class.pa-form-control--invalid]="!!error"
        [id]="inputId"
        [type]="type"
        [placeholder]="placeholder"
        [value]="value"
        [disabled]="disabled"
        (input)="onInputChange($event)"
        (blur)="onTouched()"
      />
      @if (error) {
        <div class="pa-form-error" role="alert">
          <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
          <span>{{ error }}</span>
        </div>
      } @else if (hint) {
        <span class="pa-form-hint">{{ hint }}</span>
      }
    </div>
  `,
})
export class InputComponent implements ControlValueAccessor {
  @Input() inputId = `pa-input-${Math.random().toString(36).slice(2, 8)}`;
  @Input() label = '';
  @Input() type: 'text' | 'email' | 'password' | 'date' | 'tel' | 'number' = 'text';
  @Input() placeholder = '';
  @Input() value = '';
  @Input() error = '';
  @Input() hint = '';
  @Input() required = false;
  @Input() disabled = false;

  @Output() valueChange = new EventEmitter<string>();

  private onChange: (val: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: string | null): void {
    this.value = val ?? '';
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
    this.valueChange.emit(this.value);
  }
}
