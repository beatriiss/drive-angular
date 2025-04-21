import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentService } from '../../services/document.service';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent {
  viewMode: 'grid' | 'list' = 'grid';

  constructor(private documentService: DocumentService) {}

  toggleView(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  createNewFolder(): void {
    const folderName = prompt('Nome da nova pasta:');
    if (folderName) {
      this.documentService.createFolder(folderName);
    }
  }
}
