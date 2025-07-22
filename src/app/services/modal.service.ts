import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ModalConfig } from '../components/modal/modal.component';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalStateSubject = new BehaviorSubject<{
    isOpen: boolean;
    config: ModalConfig;
  }>({
    isOpen: false,
    config: { title: '', type: 'alert' }
  });

  public modalState$ = this.modalStateSubject.asObservable();

  // Resolver de promessa atual
  private currentResolver: ((result: string | null) => void) | null = null;

  /**
   * Abrir modal de input (substitui prompt())
   */
  async prompt(
    title: string,
    options: {
      message?: string;
      placeholder?: string;
      defaultValue?: string;
      label?: string;
    } = {}
  ): Promise<string | null> {
    const config: ModalConfig = {
      title,
      message: options.message,
      type: 'input',
      inputLabel: options.label,
      inputPlaceholder: options.placeholder || `Digite ${title.toLowerCase()}`,
      inputValue: options.defaultValue || '',
      confirmText: 'Criar',
      cancelText: 'Cancelar'
    };

    return this.openModal(config);
  }

  /**
   * Abrir modal de confirmação (substitui confirm())
   */
  async confirm(
    title: string,
    options: {
      message?: string;
      confirmText?: string;
      cancelText?: string;
    } = {}
  ): Promise<boolean> {
    const config: ModalConfig = {
      title,
      message: options.message,
      type: 'confirm',
      confirmText: options.confirmText || 'Confirmar',
      cancelText: options.cancelText || 'Cancelar'
    };

    const result = await this.openModal(config);
    return result !== null;
  }

  /**
   * Abrir modal de alerta (substitui alert())
   */
  async alert(
    title: string,
    options: {
      message?: string;
      okText?: string;
    } = {}
  ): Promise<void> {
    const config: ModalConfig = {
      title,
      message: options.message,
      type: 'alert',
      okText: options.okText || 'OK'
    };

    await this.openModal(config);
  }

  /**
   * Métodos específicos para o Drive
   */
  async promptFolderName(defaultName?: string): Promise<string | null> {
    return this.prompt('Nova Pasta', {
      message: 'Digite o nome da nova pasta:',
      placeholder: 'Nome da pasta',
      defaultValue: defaultName,
      label: 'Nome da pasta'
    });
  }

  async promptDocumentName(type: 'document' | 'spreadsheet' | 'presentation', defaultName?: string): Promise<string | null> {
    const typeNames = {
      document: 'Documento',
      spreadsheet: 'Planilha',
      presentation: 'Apresentação'
    };

    return this.prompt(`Novo ${typeNames[type]}`, {
      message: `Digite o nome do novo ${typeNames[type].toLowerCase()}:`,
      placeholder: `Nome do ${typeNames[type].toLowerCase()}`,
      defaultValue: defaultName,
      label: `Nome do ${typeNames[type].toLowerCase()}`
    });
  }

  async confirmDelete(fileName: string): Promise<boolean> {
    return this.confirm('Mover para Lixeira', {
      message: `Tem certeza que deseja mover "${fileName}" para a lixeira?`,
      confirmText: 'Mover para Lixeira',
      cancelText: 'Cancelar'
    });
  }

  async confirmRestore(fileName: string): Promise<boolean> {
    return this.confirm('Restaurar Arquivo', {
      message: `Tem certeza que deseja restaurar "${fileName}"?`,
      confirmText: 'Restaurar',
      cancelText: 'Cancelar'
    });
  }

  async confirmPermanentDelete(fileName: string): Promise<boolean> {
    return this.confirm('Excluir Permanentemente', {
      message: `⚠️ ATENÇÃO: Esta ação não pode ser desfeita!\n\nTem certeza que deseja excluir permanentemente "${fileName}"?`,
      confirmText: 'Excluir Permanentemente',
      cancelText: 'Cancelar'
    });
  }

  async showSuccess(message: string): Promise<void> {
    await this.alert('✅ Sucesso!', {
      message: message
    });
  }

  async showError(message: string): Promise<void> {
    await this.alert('❌ Erro', {
      message: message
    });
  }

  /**
   * Método interno para abrir modal e aguardar resultado
   */
  private async openModal(config: ModalConfig): Promise<string | null> {
    // Se já há um modal aberto, feche-o primeiro
    if (this.currentResolver) {
      console.warn('Modal já está aberto, fechando o anterior...');
      this.currentResolver(null);
      this.currentResolver = null;
      await this.delay(100); // Pequeno delay para evitar conflitos
    }

    return new Promise((resolve) => {
      this.currentResolver = resolve;

      this.modalStateSubject.next({
        isOpen: true,
        config
      });

      console.log('🎯 Modal aberto:', config.title, config.type);
    });
  }

  /**
   * Método chamado pelo componente modal para emitir resultado
   */
  handleModalResult(result: { confirmed: boolean; value?: string }) {
    console.log('📤 Resultado do modal:', result);

    if (this.currentResolver) {
      if (result.confirmed) {
        this.currentResolver(result.value || 'confirmed');
      } else {
        this.currentResolver(null);
      }
      this.currentResolver = null;
    }

    // Fechar modal
    this.modalStateSubject.next({
      isOpen: false,
      config: { title: '', type: 'alert' }
    });
  }

  /**
   * Fechar modal programaticamente
   */
  closeModal() {
    console.log('🔒 Fechando modal programaticamente');

    if (this.currentResolver) {
      this.currentResolver(null);
      this.currentResolver = null;
    }

    this.modalStateSubject.next({
      isOpen: false,
      config: { title: '', type: 'alert' }
    });
  }

  /**
   * Utilitário para delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Debug: verificar estado atual
   */
  getDebugInfo() {
    const currentState = this.modalStateSubject.value;
    return {
      isOpen: currentState.isOpen,
      config: currentState.config,
      hasResolver: !!this.currentResolver
    };
  }
}
