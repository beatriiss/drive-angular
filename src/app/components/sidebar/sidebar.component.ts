import { Component, OnInit } from '@angular/core';
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
    if (folderName) {
      this.documentService.createFolder(folderName);
    }
    this.showCreateMenu = false;
  }

  uploadFile(): void {
    // In a real application, this would open a file picker
    // For demo purposes, we'll simulate a file upload
    const fileTypes = [
      { name: 'Relatório Final.docx', type: 'document', size: 2560000 },
      { name: 'Dados Financeiros.xlsx', type: 'spreadsheet', size: 1840000 },
      { name: 'Apresentação Cliente.pptx', type: 'presentation', size: 4230000 },
      { name: 'Diagrama.jpg', type: 'image', size: 850000 },
      { name: 'Contrato.pdf', type: 'pdf', size: 1200000 }
    ];

    const randomFile = fileTypes[Math.floor(Math.random() * fileTypes.length)];
    this.documentService.uploadFile(randomFile);
    this.showCreateMenu = false;
  }
}
