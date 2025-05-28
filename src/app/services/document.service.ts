import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Document } from '../models/document.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private mockDocuments: Document[] = [
    {
      id: '1',
      name: 'Meus Documentos',
      type: 'folder',
      modifiedAt: new Date('2025-04-15'),
      createdAt: new Date('2025-04-01'),
      owner: 'Eu',
      path: '/Meus Documentos',
      starred: false,
      shared: false
    },
    {
      id: '2',
      name: 'Relatório Trimestral',
      type: 'document',
      size: 1240000,
      modifiedAt: new Date('2025-04-18'),
      createdAt: new Date('2025-04-10'),
      owner: 'Eu',
      path: '/',
      starred: true,
      shared: true
    },
    {
      id: '3',
      name: 'Apresentação Projeto',
      type: 'presentation',
      size: 3500000,
      modifiedAt: new Date('2025-04-19'),
      createdAt: new Date('2025-04-05'),
      owner: 'Eu',
      path: '/',
      starred: false,
      shared: true
    },
    {
      id: '4',
      name: 'Planilha Financeira',
      type: 'spreadsheet',
      size: 890000,
      modifiedAt: new Date('2025-04-20'),
      createdAt: new Date('2025-04-12'),
      owner: 'Eu',
      path: '/',
      starred: false,
      shared: false
    },
    {
      id: '5',
      name: 'Fotos Evento',
      type: 'folder',
      modifiedAt: new Date('2025-04-14'),
      createdAt: new Date('2025-04-14'),
      owner: 'Eu',
      path: '/',
      starred: false,
      shared: true
    }
  ];

  private documentsSubject = new BehaviorSubject<Document[]>(this.mockDocuments);
  private currentPathSubject = new BehaviorSubject<string>('/');
  private viewTypeSubject = new BehaviorSubject<'all' | 'recent' | 'starred' | 'trash'>('all');

  constructor() { }

  getDocuments(): Observable<Document[]> {
    return this.documentsSubject.asObservable();
  }

  getCurrentPath(): Observable<string> {
    return this.currentPathSubject.asObservable();
  }

  getViewType(): Observable<'all' | 'recent' | 'starred' | 'trash'> {
    return this.viewTypeSubject.asObservable();
  }

  setViewType(viewType: 'all' | 'recent' | 'starred' | 'trash'): void {
    this.viewTypeSubject.next(viewType);
    this.filterDocuments();
  }

  navigateToFolder(path: string): void {
    this.currentPathSubject.next(path);
    this.setViewType('all');
    this.filterDocuments();
  }

  private filterDocuments(): void {
    const viewType = this.viewTypeSubject.value;
    const currentPath = this.currentPathSubject.value;

    let filteredDocs: Document[] = [...this.mockDocuments];

    // First filter by path if we're in 'all' view
    if (viewType === 'all') {
      filteredDocs = filteredDocs.filter(doc => doc.path === currentPath);
    }
    // Then apply view-specific filters
    else if (viewType === 'recent') {
      // Get docs modified in the last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filteredDocs = filteredDocs.filter(doc => doc.modifiedAt >= oneWeekAgo);
    }
    else if (viewType === 'starred') {
      filteredDocs = filteredDocs.filter(doc => doc.starred);
    }
    else if (viewType === 'trash') {
      // In a real app, we'd have a "deleted" flag
      filteredDocs = [];
    }

    this.documentsSubject.next(filteredDocs);
  }

  createFolder(name: string): void {
    const newFolder: Document = {
      id: Date.now().toString(),
      name,
      type: 'folder',
      modifiedAt: new Date(),
      createdAt: new Date(),
      owner: 'Eu',
      path: this.currentPathSubject.value,
      starred: false,
      shared: false
    };

    this.mockDocuments.push(newFolder);
    this.filterDocuments();
  }

  uploadFile(file: {name: string, type: string, size: number}): void {
    const fileType = (): 'document' | 'spreadsheet' | 'presentation' | 'image' | 'pdf' => {
      if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) return 'document';
      if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) return 'spreadsheet';
      if (file.name.endsWith('.ppt') || file.name.endsWith('.pptx')) return 'presentation';
      if (file.name.endsWith('.jpg') || file.name.endsWith('.png')) return 'image';
      if (file.name.endsWith('.pdf')) return 'pdf';
      return 'document'; // default
    };

    const newFile: Document = {
      id: Date.now().toString(),
      name: file.name,
      type: fileType(),
      size: file.size,
      modifiedAt: new Date(),
      createdAt: new Date(),
      owner: 'Eu',
      path: this.currentPathSubject.value,
      starred: false,
      shared: false
    };

    this.mockDocuments.push(newFile);
    this.filterDocuments();
  }

  toggleStar(documentId: string): void {
    const docIndex = this.mockDocuments.findIndex(doc => doc.id === documentId);
    if (docIndex !== -1) {
      this.mockDocuments[docIndex].starred = !this.mockDocuments[docIndex].starred;
      this.filterDocuments();
    }
  }

  deleteDocument(documentId: string): void {
    // In a real app, you would move to trash instead of deleting
    this.mockDocuments = this.mockDocuments.filter(doc => doc.id !== documentId);
    this.filterDocuments();
  }

  searchDocuments(query: string): void {
    if (!query || query.trim() === '') {
      this.filterDocuments();
      return;
    }

    const normalizedQuery = query.toLowerCase();
    const searchResults = this.mockDocuments.filter(doc =>
      doc.name.toLowerCase().includes(normalizedQuery)
    );

    this.documentsSubject.next(searchResults);
  }
}
