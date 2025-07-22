import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentService } from '../../services/document.service';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent implements OnInit {
  viewMode: 'grid' | 'list' = 'grid';
  currentPath: string = '/';
  breadcrumbParts: string[] = [];

  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private documentService: DocumentService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.documentService.getCurrentPath().subscribe(path => {
      this.currentPath = path;
      this.updateBreadcrumb();
    });
  }

  private updateBreadcrumb(): void {
    if (this.currentPath === '/') {
      this.breadcrumbParts = [];
    } else {
      this.breadcrumbParts = this.currentPath.split('/').filter(part => part !== '');
    }
  }

  toggleView(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
    // TODO: Comunicar mudança de view para document-list via service
  }

  async createNewFolder(): Promise<void> {
    try {
      const folderName = await this.modalService.promptFolderName();

      if (folderName) {
        console.log('📁 Criando pasta via toolbar:', folderName);

        // Aguardar resultado da API
        const result = await this.documentService.createFolder(folderName);

        if (result.success) {
          await this.modalService.showSuccess(result.message);
        } else {
          await this.modalService.showError(result.message);
        }
      }
    } catch (error) {
      console.error('Erro ao criar pasta:', error);
      await this.modalService.showError('Erro inesperado ao criar pasta. Tente novamente.');
    }
  }

  navigateToBreadcrumb(index: number): void {
    if (index === -1) {
      // Navigate to root
      this.documentService.navigateToFolder('/');
    } else {
      // Navigate to specific part
      const path = '/' + this.breadcrumbParts.slice(0, index + 1).join('/');
      this.documentService.navigateToFolder(path);
    }
  }

  /**
   * Abrir seletor de arquivo
   */
  uploadFile(): void {
    console.log('📁 Abrindo seletor de arquivo via toolbar...');
    this.fileInput.nativeElement.click();
  }

  /**
   * Processar arquivo selecionado
   */
  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      console.log('📄 Arquivo selecionado via toolbar:', file.name, 'Tamanho:', file.size, 'Tipo:', file.type);

      // Verificar tamanho (50MB max)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        await this.modalService.showError('Arquivo muito grande! Máximo permitido: 50MB');
        return;
      }

      // Fazer upload real
      try {
        console.log('📤 Iniciando upload via toolbar...');
        const result = await this.documentService.uploadFile(file);

        if (result.success) {
          await this.modalService.showSuccess(result.message);
        } else {
          await this.modalService.showError(result.message);
        }
      } catch (error) {
        console.error('Erro no upload:', error);
        await this.modalService.showError('Erro inesperado no upload. Tente novamente.');
      }

      // Limpar input
      input.value = '';
    }
  }
}
