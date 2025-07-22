import { Component, EventEmitter, Input, Output, OnChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ModalConfig {
  title: string;
  message?: string;
  type: 'input' | 'confirm' | 'alert';
  inputLabel?: string;
  inputValue?: string;
  inputPlaceholder?: string;
  confirmText?: string;
  cancelText?: string;
  okText?: string;
}

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal.component.html'
  // Removido styleUrls - usando apenas Bootstrap
})
export class ModalComponent implements OnChanges, OnDestroy {
  @Input() isOpen: boolean = false;
  @Input() config: ModalConfig = { title: '', type: 'alert' };

  @Output() result = new EventEmitter<{ confirmed: boolean; value?: string }>();
  @Output() closed = new EventEmitter<void>();

  inputValue: string = '';
  public isProcessingResult = false;

  ngOnChanges() {
    console.log('🎯 Modal mudou:', { isOpen: this.isOpen, title: this.config.title });

    if (this.isOpen && this.config.inputValue) {
      this.inputValue = this.config.inputValue;
    }

    // Reset do estado quando modal abre
    if (this.isOpen) {
      this.isProcessingResult = false;
      this.focusInput();
    }
  }

  ngOnDestroy() {
    // Cleanup se componente for destruído com modal aberto
    if (this.isOpen && !this.isProcessingResult) {
      this.emitResult({ confirmed: false });
    }
  }

  private focusInput() {
    if (this.config.type === 'input') {
      setTimeout(() => {
        const input = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (input) {
          input.focus();
          input.select();
        }
      }, 150);
    }
  }

  onOverlayClick(event: MouseEvent) {
    // Só fechar se clicar exatamente no overlay
    if (event.target === event.currentTarget && !this.isProcessingResult) {
      this.cancel();
    }
  }

  confirm() {
    if (this.isProcessingResult) {
      console.log('⚠️ Já processando resultado, ignorando...');
      return;
    }

    const result = {
      confirmed: true,
      value: this.config.type === 'input' ? this.inputValue.trim() : undefined
    };

    // Validação para input
    if (this.config.type === 'input' && !result.value) {
      console.log('⚠️ Input vazio, não confirmando');
      return;
    }

    console.log('✅ Confirmando modal:', result);
    this.emitResult(result);
  }

  cancel() {
    if (this.isProcessingResult) {
      console.log('⚠️ Já processando resultado, ignorando cancelamento...');
      return;
    }

    console.log('❌ Cancelando modal');
    this.emitResult({ confirmed: false });
  }

  private emitResult(result: { confirmed: boolean; value?: string }) {
    if (this.isProcessingResult) {
      console.log('⚠️ Resultado já sendo processado, ignorando...');
      return;
    }

    this.isProcessingResult = true;

    console.log('📤 Emitindo resultado:', result);

    // Emit imediato
    this.result.emit(result);

    // Cleanup após pequeno delay
    setTimeout(() => {
      this.cleanup();
    }, 100);
  }

  private cleanup() {
    this.inputValue = '';
    this.isProcessingResult = false;
    this.closed.emit();
    console.log('🧹 Modal limpo');
  }

  // Métodos para teclas de atalho
  onKeyDown(event: KeyboardEvent) {
    if (this.isProcessingResult) {
      return;
    }

    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        this.confirm();
        break;
      case 'Escape':
        event.preventDefault();
        this.cancel();
        break;
    }
  }
}
