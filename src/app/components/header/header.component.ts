import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentService } from '../../services/document.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  searchQuery: string = '';

  constructor(private documentService: DocumentService) {}

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;

    // Implementar lógica de pesquisa
    this.documentService.searchDocuments(this.searchQuery);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.documentService.searchDocuments('');
  }
}
