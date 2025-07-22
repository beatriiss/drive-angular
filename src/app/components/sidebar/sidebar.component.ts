import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentService } from '../../services/document.service';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  currentPath: string = '/';
  currentViewType: 'all' | 'recent' | 'starred' | 'trash' = 'all';
  showCreateMenu = false;

  // Referência para o input de arquivo (hidden)
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private documentService: DocumentService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.documentService.getCurrentPath().subscribe(path => {
      this.currentPath = path;
    });

    this.documentService.getViewType().subscribe(viewType => {
      this.currentViewType = viewType;
    });
  }

  navigateTo(path: string): void {
    this.documentService.navigateToFolder(path);
  }

  showRecent(): void {
    this.documentService.setViewType('recent');
  }

  showStarred(): void {
    this.documentService.setViewType('starred');
  }

  showTrash(): void {
    this.documentService.setViewType('trash');
  }

  toggleCreateMenu(): void {
    this.showCreateMenu = !this.showCreateMenu;
  }

  async createNewFolder(): Promise<void> {
    try {
      const folderName = await this.modalService.promptFolderName();

      if (folderName) {
        console.log('📁 Criando pasta:', folderName);

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

    this.showCreateMenu = false;
  }

  /**
   * Abrir seletor de arquivo
   */
  uploadFile(): void {
    console.log('📁 Abrindo seletor de arquivo...');
    this.fileInput.nativeElement.click();
    this.showCreateMenu = false;
  }

  /**
   * Processar arquivo selecionado
   */
  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      console.log('📄 Arquivo selecionado:', file.name, 'Tamanho:', file.size, 'Tipo:', file.type);

      // Verificar tamanho (50MB max)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        await this.modalService.showError('Arquivo muito grande! Máximo permitido: 50MB');
        return;
      }

      // Fazer upload real
      try {
        console.log('📤 Iniciando upload...');
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

      // Limpar input para permitir upload do mesmo arquivo novamente se necessário
      input.value = '';
    }
  }

  /**
   * Criar documento Google
   */
  async createGoogleDoc(): Promise<void> {
    try {
      const docName = await this.modalService.promptDocumentName('document');

      if (docName) {
        console.log('📄 Criando documento:', docName);

        const result = await this.documentService.createGoogleDocument(docName, 'document');

        if (result.success) {
          await this.modalService.showSuccess(result.message);
        } else {
          await this.modalService.showError(result.message);
        }
      }
    } catch (error) {
      console.error('Erro ao criar documento:', error);
      await this.modalService.showError('Erro inesperado ao criar documento. Tente novamente.');
    }

    this.showCreateMenu = false;
  }

  /**
   * Criar planilha Google
   */
  async createGoogleSheet(): Promise<void> {
    try {
      const sheetName = await this.modalService.promptDocumentName('spreadsheet');

      if (sheetName) {
        console.log('📊 Criando planilha:', sheetName);

        const result = await this.documentService.createGoogleDocument(sheetName, 'spreadsheet');

        if (result.success) {
          await this.modalService.showSuccess(result.message);
        } else {
          await this.modalService.showError(result.message);
        }
      }
    } catch (error) {
      console.error('Erro ao criar planilha:', error);
      await this.modalService.showError('Erro inesperado ao criar planilha. Tente novamente.');
    }

    this.showCreateMenu = false;
  }

  /**
   * Criar apresentação Google
   */
  async createGoogleSlides(): Promise<void> {
    try {
      const slidesName = await this.modalService.promptDocumentName('presentation');

      if (slidesName) {
        console.log('🎞️ Criando apresentação:', slidesName);

        const result = await this.documentService.createGoogleDocument(slidesName, 'presentation');

        if (result.success) {
          await this.modalService.showSuccess(result.message);
        } else {
          await this.modalService.showError(result.message);
        }
      }
    } catch (error) {
      console.error('Erro ao criar apresentação:', error);
      await this.modalService.showError('Erro inesperado ao criar apresentação. Tente novamente.');
    }

    this.showCreateMenu = false;
  }
}
