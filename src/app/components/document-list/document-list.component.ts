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

  constructor(private documentService: DocumentService) {}

  ngOnInit(): void {
    this.documentService.getDocuments().subscribe(docs => {
      this.documents = docs;
    });
  }

  openDocument(doc: Document): void {
    if (doc.type === 'folder') {
      this.documentService.navigateToFolder(doc.path + '/' + doc.name);
    } else {
      // Lógica para abrir documento
      console.log('Abrindo documento:', doc.name);
    }
  }
}
