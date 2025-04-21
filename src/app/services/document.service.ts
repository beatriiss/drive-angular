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

  constructor() { }

  getDocuments(): Observable<Document[]> {
    return this.documentsSubject.asObservable();
  }

  getCurrentPath(): Observable<string> {
    return this.currentPathSubject.asObservable();
  }

  navigateToFolder(path: string): void {
    this.currentPathSubject.next(path);
    // Em uma implementação real, aqui filtraríamos os documentos pelo path
  }

  getFilteredDocuments(): Observable<Document[]> {
    // Aqui implementaríamos a lógica de filtragem por pasta atual
    return this.documentsSubject.asObservable();
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

    const updatedDocs = [...this.mockDocuments, newFolder];
    this.documentsSubject.next(updatedDocs);
    this.mockDocuments = updatedDocs;
  }

  // Métodos adicionais como deleteDocument, renameDocument, etc.
}
