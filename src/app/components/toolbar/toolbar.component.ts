import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentService } from '../../services/document.service';

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

  constructor(private documentService: DocumentService) {}

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

  createNewFolder(): void {
    const folderName = prompt('Nome da nova pasta:');
    if (folderName && folderName.trim()) {
      this.documentService.createFolder(folderName.trim());
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
    console.log('📁 Abrindo seletor de arquivo...');
    this.fileInput.nativeElement.click();
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

      // Limpar input
      input.value = '';
    }
  }
}
