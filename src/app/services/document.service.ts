import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, throwError } from 'rxjs';
import { Document } from '../models/document.model';

// Interface para resposta da API
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private readonly baseUrl = 'http://localhost:3000/api/files';

  private documentsSubject = new BehaviorSubject<Document[]>([]);
  private currentPathSubject = new BehaviorSubject<string>('/');
  private viewTypeSubject = new BehaviorSubject<'all' | 'recent' | 'starred' | 'trash'>('all');

  constructor(private http: HttpClient) {
    // Carregar documentos da API ao inicializar
    this.loadDocumentsFromApi();
  }

  /**
   * Carregar documentos da API
   */
  private loadDocumentsFromApi(parentId?: number): void {
    let params = new HttpParams();
    if (parentId) {
      params = params.set('parent_id', parentId.toString());
    }

    this.http.get<ApiResponse<any[]>>(this.baseUrl, { params })
      .pipe(
        map(response => {
          if (response.success) {
            return response.data.map(this.mapApiToDocument);
          }
          throw new Error(response.message || 'Erro ao carregar documentos');
        }),
        catchError(error => {
          console.error('Erro ao carregar documentos da API:', error);
          // Fallback para dados mock se der erro na API
          return this.getMockDocuments();
        })
      )
      .subscribe(documents => {
        this.documentsSubject.next(documents);
      });
  }

  /**
   * Mapear dados da API para modelo Document
   */
  private mapApiToDocument = (apiData: any): Document => {
    return {
      id: apiData.id.toString(), // Manter como string para compatibilidade
      name: apiData.name,
      type: apiData.type,
      size: apiData.size,
      modifiedAt: new Date(apiData.modifiedAt),
      createdAt: new Date(apiData.createdAt),
      owner: 'Eu', // Valor fixo já que não tem usuários
      path: apiData.parentId ? `/folder/${apiData.parentId}` : '/',
      starred: apiData.starred,
      shared: apiData.shared
    };
  };

  /**
   * Dados mock como fallback
   */
  private getMockDocuments(): Observable<Document[]> {
    const mockDocuments: Document[] = [
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

    return new Observable(observer => {
      observer.next(mockDocuments);
      observer.complete();
    });
  }

  // =====================================================
  // MÉTODOS PÚBLICOS (MANTIDOS IGUAIS)
  // =====================================================

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

    // Recarregar da API quando mudar filtros
    this.loadDocumentsFromApi();
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

    // Adicionar à lista atual (você pode implementar POST na API depois)
    const currentDocs = this.documentsSubject.value;
    this.documentsSubject.next([...currentDocs, newFolder]);
  }

  uploadFile(file: {name: string, type: string, size: number}): void {
    const fileType = (): 'document' | 'spreadsheet' | 'presentation' | 'image' | 'pdf' => {
      if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) return 'document';
      if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) return 'spreadsheet';
      if (file.name.endsWith('.ppt') || file.name.endsWith('.pptx')) return 'presentation';
      if (file.name.endsWith('.jpg') || file.name.endsWith('.png')) return 'image';
      if (file.name.endsWith('.pdf')) return 'pdf';
      return 'document';
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

    // Adicionar à lista atual (você pode implementar POST na API depois)
    const currentDocs = this.documentsSubject.value;
    this.documentsSubject.next([...currentDocs, newFile]);
  }

  toggleStar(documentId: string): void {
    const currentDocs = this.documentsSubject.value;
    const updatedDocs = currentDocs.map(doc =>
      doc.id === documentId ? { ...doc, starred: !doc.starred } : doc
    );
    this.documentsSubject.next(updatedDocs);
  }

  deleteDocument(documentId: string): void {
    const currentDocs = this.documentsSubject.value;
    const filteredDocs = currentDocs.filter(doc => doc.id !== documentId);
    this.documentsSubject.next(filteredDocs);
  }

  searchDocuments(query: string): void {
    if (!query || query.trim() === '') {
      this.loadDocumentsFromApi();
      return;
    }

    const currentDocs = this.documentsSubject.value;
    const normalizedQuery = query.toLowerCase();
    const searchResults = currentDocs.filter(doc =>
      doc.name.toLowerCase().includes(normalizedQuery)
    );

    this.documentsSubject.next(searchResults);
  }
}
