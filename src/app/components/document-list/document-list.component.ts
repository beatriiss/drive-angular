import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentService } from '../../services/document.service';
import { Document } from '../../models/document.model';
import { DocumentItemComponent } from '../document-item/document-item.component';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, DocumentItemComponent],
  templateUrl: './document-list.component.html',
  styleUrls: ['./document-list.component.css']
})
export class DocumentListComponent implements OnInit {
  documents: Document[] = [];
  viewMode: 'grid' | 'list' = 'grid';
  currentPath: string = '/';
  viewType: 'all' | 'recent' | 'starred' | 'trash' = 'all';

  constructor(private documentService: DocumentService) {}

  ngOnInit(): void {
    this.documentService.getDocuments().subscribe(docs => {
      this.documents = docs;
    });

    this.documentService.getCurrentPath().subscribe(path => {
      this.currentPath = path;
    });

    this.documentService.getViewType().subscribe(viewType => {
      this.viewType = viewType;
    });
  }

  openDocument(doc: Document): void {
    // Na lixeira, não permitir abrir documentos
    if (this.viewType === 'trash') {
      return;
    }

    if (doc.type === 'folder') {
      console.log('📁 Abrindo pasta:', doc.name);
      this.documentService.openFolder(doc);
    } else {
      console.log('📄 Abrindo documento:', doc.name);
      alert(`Abrindo "${doc.name}"`);
    }
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  getViewTypeTitle(): string {
    switch (this.viewType) {
      case 'all':
        return this.currentPath === '/' ? 'Meu Drive' : this.getLastFolderName(this.currentPath);
      case 'recent':
        return 'Recentes';
      case 'starred':
        return 'Com estrela';
      case 'trash':
        return 'Lixeira';
      default:
        return 'Meu Drive';
    }
  }

  getViewTypeIcon(): string {
    switch (this.viewType) {
      case 'recent':
        return 'schedule';
      case 'starred':
        return 'star';
      case 'trash':
        return 'delete';
      default:
        return 'folder';
    }
  }

  getViewTypeDescription(): string {
    switch (this.viewType) {
      case 'recent':
        return 'Arquivos modificados nos últimos 7 dias';
      case 'starred':
        return 'Seus arquivos favoritados';
      case 'trash':
        return 'Arquivos excluídos';
      default:
        return '';
    }
  }

  getEmptyStateIcon(): string {
    switch (this.viewType) {
      case 'recent':
        return 'schedule';
      case 'starred':
        return 'star_border';
      case 'trash':
        return 'delete_outline';
      default:
        return 'folder_open';
    }
  }

  getEmptyStateTitle(): string {
    switch (this.viewType) {
      case 'all':
        return this.currentPath === '/'
          ? 'Nenhum item encontrado nesta pasta'
          : `A pasta "${this.getViewTypeTitle()}" está vazia`;
      case 'recent':
        return 'Nenhum arquivo recente';
      case 'starred':
        return 'Nenhum arquivo favoritado';
      case 'trash':
        return 'Lixeira vazia';
      default:
        return 'Nenhum item encontrado';
    }
  }

  getEmptyStateMessage(): string {
    switch (this.viewType) {
      case 'recent':
        return 'Arquivos que você modificou recentemente aparecerão aqui.';
      case 'starred':
        return 'Clique na estrela ao lado dos arquivos para favoritá-los.';
      case 'trash':
        return 'Arquivos excluídos ficam aqui por 30 dias antes de serem removidos permanentemente.';
      default:
        return 'Esta pasta está vazia.';
    }
  }

  private getLastFolderName(path: string): string {
    const parts = path.split('/').filter(p => p);
    return parts.length > 0 ? parts[parts.length - 1] : 'Meu Drive';
  }

  /**
   * Voltar para pasta pai
   */
  goBack(): void {
    this.documentService.goBack();
  }

  /**
   * Verificar se pode voltar
   */
  canGoBack(): boolean {
    return this.currentPath !== '/' && this.viewType === 'all';
  }
}
