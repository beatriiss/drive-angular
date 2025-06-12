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
    if (doc.type === 'folder') {
      console.log('📁 Abrindo pasta:', doc.name);
      // Usar o novo método openFolder do service
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
