import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentService } from '../../services/document.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  currentPath: string = '/';

  constructor(private documentService: DocumentService) {
    this.documentService.getCurrentPath().subscribe(path => {
      this.currentPath = path;
    });
  }

  navigateTo(path: string): void {
    this.documentService.navigateToFolder(path);
  }
}
