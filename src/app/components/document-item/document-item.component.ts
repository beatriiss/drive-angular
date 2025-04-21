import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Document } from '../../models/document.model';

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
}
