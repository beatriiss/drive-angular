import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentService } from '../../services/document.service';

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

  constructor(private documentService: DocumentService) {}

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

  createNewFolder(): void {
    const folderName = prompt('Nome da nova pasta:');
    if (folderName && folderName.trim()) {
      this.documentService.createFolder(folderName.trim());
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
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      console.log('📄 Arquivo selecionado:', file.name, 'Tamanho:', file.size, 'Tipo:', file.type);

      // Verificar tamanho (50MB max)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        alert('Arquivo muito grande! Máximo permitido: 50MB');
        return;
      }

      // Fazer upload real
      this.documentService.uploadFile(file);

      // Limpar input para permitir upload do mesmo arquivo novamente se necessário
      input.value = '';
    }
  }

  /**
   * Criar documento Google
   */
  createGoogleDoc(): void {
    const docName = prompt('Nome do documento:');
    if (docName && docName.trim()) {
      this.documentService.createGoogleDocument(docName.trim(), 'document');
    }
    this.showCreateMenu = false;
  }

  /**
   * Criar planilha Google
   */
  createGoogleSheet(): void {
    const sheetName = prompt('Nome da planilha:');
    if (sheetName && sheetName.trim()) {
      this.documentService.createGoogleDocument(sheetName.trim(), 'spreadsheet');
    }
    this.showCreateMenu = false;
  }

  /**
   * Criar apresentação Google
   */
  createGoogleSlides(): void {
    const slidesName = prompt('Nome da apresentação:');
    if (slidesName && slidesName.trim()) {
      this.documentService.createGoogleDocument(slidesName.trim(), 'presentation');
    }
    this.showCreateMenu = false;
  }
}
