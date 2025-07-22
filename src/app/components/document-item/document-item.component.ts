import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Document } from '../../models/document.model';
import { DocumentService } from '../../services/document.service';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-document-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-item.component.html',
  styleUrls: ['./document-item.component.css']
})
export class DocumentItemComponent {
  @Input() document!: Document;
  @Input() viewMode: 'grid' | 'list' = 'grid';
  @Input() viewType: 'all' | 'recent' | 'starred' | 'trash' = 'all';

  constructor(
    private documentService: DocumentService,
    private modalService: ModalService
  ) {}

  getFileIcon(): string {
    switch(this.document.type) {
      case 'folder':
        return 'folder';
      case 'document':
        return 'description';
      case 'spreadsheet':
        return 'table_chart';
      case 'presentation':
        return 'slideshow';
      case 'image':
        return 'image';
      case 'pdf':
        return 'picture_as_pdf';
      default:
        return 'insert_drive_file';
    }
  }

  getFileSize(): string {
    if (!this.document.size) return '-';

    const kb = this.document.size / 1024;
    if (kb < 1024) {
      return `${Math.round(kb)} KB`;
    } else {
      const mb = kb / 1024;
      return `${mb.toFixed(1)} MB`;
    }
  }

  getModifiedDate(): string {
    const date = this.document.modifiedAt;
    return date.toLocaleDateString('pt-BR');
  }

  toggleStar(event: MouseEvent): void {
    event.stopPropagation(); // Prevent opening the document

    // Não permitir favoritar na lixeira
    if (this.viewType === 'trash') {
      return;
    }

    this.documentService.toggleStar(this.document.id);
  }

  async deleteDocument(event: MouseEvent): Promise<void> {
    event.stopPropagation(); // Prevent opening the document

    if (this.viewType === 'trash') {
      // Na lixeira, mostrar menu de opções diretamente
      await this.showTrashActionsMenu();
    } else {
      // Fora da lixeira, confirmar exclusão
      const confirmed = await this.modalService.confirmDelete(this.document.name);

      if (confirmed) {
        this.documentService.deleteDocument(this.document.id);
      }
    }
  }

  /**
   * Menu de ações para itens na lixeira
   */
  private async showTrashActionsMenu(): Promise<void> {
    try {
      // Criar um modal customizado para escolher a ação
      const action = await this.showTrashOptionsModal();

      if (action === 'restore') {
        await this.restoreDocument();
      } else if (action === 'delete') {
        await this.permanentDeleteDocument();
      }
      // Se action for null, o usuário cancelou
    } catch (error) {
      console.error('Erro no menu da lixeira:', error);
    }
  }

  /**
   * Modal personalizado para opções da lixeira
   */
  private async showTrashOptionsModal(): Promise<'restore' | 'delete' | null> {
    // Primeiro modal: Restaurar
    const wantsToRestore = await this.modalService.confirm('Opções do Arquivo', {
      message: `"${this.document.name}"\n\nO que deseja fazer com este arquivo?`,
      confirmText: 'Restaurar Arquivo',
      cancelText: 'Excluir Permanentemente'
    });

    if (wantsToRestore) {
      return 'restore';
    } else {
      // Usuário clicou em "Excluir Permanentemente"
      // Mostrar segundo modal de confirmação
      const confirmDelete = await this.modalService.confirm('Confirmar Exclusão', {
        message: `⚠️ ATENÇÃO: Esta ação não pode ser desfeita!\n\nTem certeza que deseja excluir permanentemente "${this.document.name}"?`,
        confirmText: 'Sim, Excluir Permanentemente',
        cancelText: 'Cancelar'
      });

      return confirmDelete ? 'delete' : null;
    }
  }

  private async restoreDocument(): Promise<void> {
    try {
      this.documentService.restoreDocument(this.document.id);
    } catch (error) {
      console.error('Erro ao restaurar:', error);
      await this.modalService.showError('Erro ao restaurar arquivo. Tente novamente.');
    }
  }

  private async permanentDeleteDocument(): Promise<void> {
    try {
      this.documentService.permanentDeleteDocument(this.document.id);
    } catch (error) {
      console.error('Erro ao excluir permanentemente:', error);
      await this.modalService.showError('Erro ao excluir arquivo. Tente novamente.');
    }
  }

  /**
   * Verificar se o item pode ser favoritado
   */
  canToggleStar(): boolean {
    return this.viewType !== 'trash';
  }

  /**
   * Verificar se deve mostrar ações da lixeira
   */
  isInTrash(): boolean {
    return this.viewType === 'trash';
  }

  /**
   * Obter texto do tooltip para o botão de ação
   */
  getActionTooltip(): string {
    if (this.viewType === 'trash') {
      return 'Opções da lixeira';
    }
    return 'Mover para lixeira';
  }

  /**
   * Obter ícone do botão de ação principal
   */
  getActionIcon(): string {
    if (this.viewType === 'trash') {
      return 'more_vert'; // Ícone de mais opções
    }
    return 'delete'; // Ícone de lixeira
  }
}
