import { Component, OnInit } from '@angular/core';
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
    // In a real app, this would be communicated via a service to the document-list component
  }

  createNewFolder(): void {
    const folderName = prompt('Nome da nova pasta:');
    if (folderName) {
      this.documentService.createFolder(folderName);
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

  uploadFile(): void {
    // In a real app, this would open a file picker
    // For demo purposes, we'll simulate a file upload
    const fileTypes = [
      { name: 'Documento.docx', type: 'document', size: 2560000 },
      { name: 'Planilha.xlsx', type: 'spreadsheet', size: 1840000 },
      { name: 'Apresentação.pptx', type: 'presentation', size: 4230000 },
      { name: 'Imagem.jpg', type: 'image', size: 850000 },
      { name: 'Arquivo.pdf', type: 'pdf', size: 1200000 }
    ];

    const randomFile = fileTypes[Math.floor(Math.random() * fileTypes.length)];
    this.documentService.uploadFile(randomFile);
  }
}
