import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map } from 'rxjs';
import { Document } from '../models/document.model';

// Interface para resposta da API
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Interface para dados do arquivo da API
interface ApiFile {
  id: number;
  name: string;
  type: string;
  size: number;
  mimeType: string;
  filePath: string;
  parentId: number | null;
  starred: boolean;
  shared: boolean;
  sharedEmails: string | null;
  trashed: boolean;
  createdAt: string;
  modifiedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private readonly baseUrl = 'http://localhost:3333/api/files';

  private documentsSubject = new BehaviorSubject<Document[]>([]);
  private currentPathSubject = new BehaviorSubject<string>('/');
  private currentParentIdSubject = new BehaviorSubject<number | null>(null);
  private viewTypeSubject = new BehaviorSubject<'all' | 'recent' | 'starred' | 'trash'>('all');

  constructor(private http: HttpClient) {
    this.loadDocumentsFromApi();
  }

  /**
   * Carregar documentos da API
   */
  private loadDocumentsFromApi(parentId?: number | null): void {
    let params = new HttpParams();
    if (parentId !== undefined && parentId !== null) {
      params = params.set('parent_id', parentId.toString());
    }

    console.log('🔄 Carregando documentos da API...', { parentId });

    this.http.get<ApiResponse<ApiFile[]>>(this.baseUrl, { params })
      .pipe(
        map(response => {
          console.log('✅ Resposta da API:', response);
          if (response.success) {
            return response.data.map(this.mapApiToDocument);
          }
          throw new Error(response.message || 'Erro ao carregar documentos');
        }),
        catchError(error => {
          console.error('❌ Erro ao carregar da API:', error);
          this.loadMockDocuments();
          return [];
        })
      )
      .subscribe({
        next: (documents) => {
          console.log('📄 Documentos carregados:', documents.length);
          this.documentsSubject.next(documents);
        },
        error: (error) => {
          console.error('❌ Erro final:', error);
          this.loadMockDocuments();
        }
      });
  }

  /**
   * Mapear dados da API para modelo Document
   */
  private mapApiToDocument = (apiData: ApiFile): Document => {
    return {
      id: apiData.id.toString(),
      name: apiData.name,
      type: this.mapApiTypeToDocumentType(apiData.type),
      size: apiData.size,
      modifiedAt: new Date(apiData.modifiedAt),
      createdAt: new Date(apiData.createdAt),
      owner: 'Eu',
      path: this.currentPathSubject.value,
      starred: apiData.starred,
      shared: apiData.shared,
      parentId: apiData.parentId?.toString()
    };
  };

  /**
   * Mapear tipos da API para tipos do Document
   */
  private mapApiTypeToDocumentType(apiType: string): 'folder' | 'document' | 'spreadsheet' | 'presentation' | 'image' | 'pdf' {
    switch (apiType) {
      case 'folder': return 'folder';
      case 'document': return 'document';
      case 'spreadsheet': return 'spreadsheet';
      case 'presentation': return 'presentation';
      case 'image': return 'image';
      case 'pdf': return 'pdf';
      default: return 'document';
    }
  }

  /**
   * Dados mock como fallback
   */
  private loadMockDocuments(): void {
    console.log('📝 Carregando dados mock como fallback...');

    const mockDocuments: Document[] = [
      {
        id: '1',
        name: 'Meus Documentos',
        type: 'folder',
        modifiedAt: new Date('2025-04-15'),
        createdAt: new Date('2025-04-01'),
        owner: 'Eu',
        path: '/',
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
      }
    ];

    this.documentsSubject.next(mockDocuments);
  }

  // =====================================================
  // MÉTODOS PÚBLICOS
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

  navigateToFolder(path: string, parentId?: string): void {
    this.currentPathSubject.next(path);

    // Atualizar o parentId atual
    if (parentId) {
      this.currentParentIdSubject.next(parseInt(parentId));
    } else if (path === '/') {
      this.currentParentIdSubject.next(null); // Raiz
    }

    this.setViewType('all');
    this.loadDocumentsFromApi(this.currentParentIdSubject.value);
  }

  private filterDocuments(): void {
    const viewType = this.viewTypeSubject.value;

    switch (viewType) {
      case 'starred':
        const currentDocs = this.documentsSubject.value;
        const starredDocs = currentDocs.filter(doc => doc.starred);
        this.documentsSubject.next(starredDocs);
        break;
      case 'recent':
        const allDocs = this.documentsSubject.value;
        const recentDocs = allDocs.filter(doc => {
          const diffTime = Math.abs(new Date().getTime() - doc.modifiedAt.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 7;
        });
        this.documentsSubject.next(recentDocs);
        break;
      case 'trash':
        this.documentsSubject.next([]);
        break;
      default:
        this.loadDocumentsFromApi(this.currentParentIdSubject.value);
        break;
    }
  }

  /**
   * Criar pasta usando a API
   */
  createFolder(name: string): void {
    console.log('🔄 Criando pasta via API:', name);

    const createData = {
      name: name,
      type: 'folder',
      parent_id: this.currentParentIdSubject.value
    };

    this.http.post<ApiResponse<ApiFile>>(this.baseUrl, createData)
      .subscribe({
        next: (response) => {
          console.log('✅ Pasta criada com sucesso:', response);

          if (response.success) {
            this.loadDocumentsFromApi(this.currentParentIdSubject.value);
            alert(`Pasta "${name}" criada com sucesso!`);
          } else {
            console.error('❌ Erro na resposta da API:', response.message);
            alert(`Erro ao criar pasta: ${response.message}`);
          }
        },
        error: (error) => {
          console.error('❌ Erro ao criar pasta:', error);
          alert(`Erro na API ao criar pasta: ${error.message}`);
        }
      });
  }

  /**
   * Favoritar/desfavoritar documento usando a API
   */
  toggleStar(documentId: string): void {
    console.log('🔄 Alternando estrela via API:', documentId);

    const url = `${this.baseUrl}/${documentId}/toggle-star`;

    this.http.put<ApiResponse<ApiFile>>(url, {})
      .subscribe({
        next: (response) => {
          console.log('✅ Estrela alternada com sucesso:', response);

          if (response.success) {
            // Atualizar o documento na lista local
            const currentDocs = this.documentsSubject.value;
            const updatedDocs = currentDocs.map(doc => {
              if (doc.id === documentId) {
                return { ...doc, starred: response.data.starred };
              }
              return doc;
            });
            this.documentsSubject.next(updatedDocs);

            const action = response.data.starred ? 'favoritado' : 'desfavoritado';
            console.log(`📋 Documento ${action}:`, response.data.name);
          } else {
            console.error('❌ Erro na resposta da API:', response.message);
            alert(`Erro ao favoritar: ${response.message}`);
          }
        },
        error: (error) => {
          console.error('❌ Erro ao alternar estrela:', error);
          alert(`Erro na API ao favoritar: ${error.message}`);
        }
      });
  }

  /**
   * Excluir documento usando a API
   */
  deleteDocument(documentId: string): void {
    console.log('🔄 Excluindo documento via API:', documentId);

    const url = `${this.baseUrl}/${documentId}`;

    this.http.delete<ApiResponse<any>>(url)
      .subscribe({
        next: (response) => {
          console.log('✅ Documento excluído com sucesso:', response);

          if (response.success) {
            // Remover o documento da lista local
            const currentDocs = this.documentsSubject.value;
            const filteredDocs = currentDocs.filter(doc => doc.id !== documentId);
            this.documentsSubject.next(filteredDocs);

            console.log('🗑️ Documento removido da lista');
          } else {
            console.error('❌ Erro na resposta da API:', response.message);
            alert(`Erro ao excluir: ${response.message}`);
          }
        },
        error: (error) => {
          console.error('❌ Erro ao excluir documento:', error);
          alert(`Erro na API ao excluir: ${error.message}`);
        }
      });
  }

  /**
   * Upload de arquivo real usando a API
   */
  uploadFile(file: File): void {
    console.log('🔄 Fazendo upload real via API:', file.name);

    // Criar FormData para upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    formData.append('type', this.getApiTypeFromFile(file));

    // Adicionar parent_id se estivermos dentro de uma pasta
    const currentParentId = this.currentParentIdSubject.value;
    if (currentParentId !== null) {
      formData.append('parent_id', currentParentId.toString());
    }

    this.http.post<ApiResponse<ApiFile>>(this.baseUrl, formData)
      .subscribe({
        next: (response) => {
          console.log('✅ Upload realizado com sucesso:', response);

          if (response.success) {
            // Recarregar a lista de documentos
            this.loadDocumentsFromApi(this.currentParentIdSubject.value);
            alert(`Arquivo "${file.name}" enviado com sucesso!`);
          } else {
            console.error('❌ Erro na resposta da API:', response.message);
            alert(`Erro no upload: ${response.message}`);
          }
        },
        error: (error) => {
          console.error('❌ Erro no upload:', error);
          alert(`Erro no upload: ${error.message}`);
        }
      });
  }

  /**
   * Criar documento Google usando a API
   */
  createGoogleDocument(name: string, type: 'document' | 'spreadsheet' | 'presentation'): void {
    console.log('🔄 Criando documento Google via API:', name, type);

    const createData = {
      name: name,
      type: type,
      parent_id: this.currentParentIdSubject.value
    };

    this.http.post<ApiResponse<ApiFile>>(this.baseUrl, createData)
      .subscribe({
        next: (response) => {
          console.log('✅ Documento Google criado com sucesso:', response);

          if (response.success) {
            this.loadDocumentsFromApi(this.currentParentIdSubject.value);
            alert(`${this.getDocumentTypeName(type)} "${name}" criado com sucesso!`);
          } else {
            console.error('❌ Erro na resposta da API:', response.message);
            alert(`Erro ao criar documento: ${response.message}`);
          }
        },
        error: (error) => {
          console.error('❌ Erro ao criar documento Google:', error);
          alert(`Erro na API ao criar documento: ${error.message}`);
        }
      });
  }

  /**
   * Obter nome amigável do tipo de documento
   */
  private getDocumentTypeName(type: string): string {
    switch (type) {
      case 'document': return 'Documento';
      case 'spreadsheet': return 'Planilha';
      case 'presentation': return 'Apresentação';
      default: return 'Documento';
    }
  }

  /**
   * Upload simulado (REMOVIDO - não usar mais)
   * @deprecated Use createGoogleDocument() para documentos Google
   */
  uploadFileSimulated(file: {name: string, type: string, size: number}): void {
    console.warn('⚠️ uploadFileSimulated() está deprecated. Use createGoogleDocument()');

    // Fallback para não quebrar se ainda for chamado
    const newFile: Document = {
      id: Date.now().toString(),
      name: file.name,
      type: this.getDocumentTypeFromFileName(file.name),
      size: file.size,
      modifiedAt: new Date(),
      createdAt: new Date(),
      owner: 'Eu',
      path: this.currentPathSubject.value,
      starred: false,
      shared: false
    };

    const currentDocs = this.documentsSubject.value;
    this.documentsSubject.next([...currentDocs, newFile]);

    alert(`Arquivo "${file.name}" adicionado (simulação local - NÃO SALVO NO BANCO)`);
  }

  /**
   * Determinar tipo da API baseado no arquivo
   */
  private getApiTypeFromFile(file: File): string {
    const mimeType = file.type;

    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
    if (mimeType.includes('document') || mimeType.includes('word')) return 'document';

    return 'document'; // padrão
  }

  /**
   * Determinar tipo do documento baseado no nome do arquivo
   */
  private getDocumentTypeFromFileName(fileName: string): 'document' | 'spreadsheet' | 'presentation' | 'image' | 'pdf' {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'doc':
      case 'docx':
        return 'document';
      case 'xls':
      case 'xlsx':
        return 'spreadsheet';
      case 'ppt':
      case 'pptx':
        return 'presentation';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'image';
      case 'pdf':
        return 'pdf';
      default:
        return 'document';
    }
  }

  /**
   * Pesquisar documentos (local por enquanto)
   */
  searchDocuments(query: string): void {
    if (!query || query.trim() === '') {
      this.loadDocumentsFromApi(this.currentParentIdSubject.value);
      return;
    }

    console.log('🔍 Pesquisando:', query);

    const normalizedQuery = query.toLowerCase();
    const allDocs = this.documentsSubject.value;
    const searchResults = allDocs.filter(doc =>
      doc.name.toLowerCase().includes(normalizedQuery)
    );

    this.documentsSubject.next(searchResults);

    // TODO: Implementar API call para pesquisa no backend
    // GET /api/files?search=query
  }

  /**
   * Navegar para dentro de uma pasta
   */
  openFolder(folder: Document): void {
    if (folder.type !== 'folder') {
      console.warn('Tentando abrir um item que não é pasta:', folder);
      return;
    }

    console.log('📁 Navegando para pasta:', folder.name, 'ID:', folder.id);

    // Construir novo path
    const currentPath = this.currentPathSubject.value;
    const newPath = currentPath === '/' ? `/${folder.name}` : `${currentPath}/${folder.name}`;

    // Navegar para a pasta
    this.navigateToFolder(newPath, folder.id);
  }

  /**
   * Voltar para pasta pai
   */
  goBack(): void {
    const currentPath = this.currentPathSubject.value;

    if (currentPath === '/') {
      console.log('Já está na raiz');
      return;
    }

    // Calcular path pai
    const pathParts = currentPath.split('/').filter(p => p);
    pathParts.pop(); // Remove último elemento

    const parentPath = pathParts.length === 0 ? '/' : '/' + pathParts.join('/');

    console.log('⬆️ Voltando para:', parentPath);

    // TODO: Aqui precisaria buscar o parentId do banco
    // Por enquanto, vamos navegar para raiz
    this.navigateToFolder('/', undefined);
  }
  testApiConnection(): void {
    console.log('🔍 Testando conexão com API...');

    this.http.get<ApiResponse<any>>(this.baseUrl.replace('/files', '/health'))
      .subscribe({
        next: (response) => {
          console.log('✅ API funcionando!', response);
          alert('API conectada com sucesso!');
        },
        error: (error) => {
          console.error('❌ API não está funcionando:', error);
          alert('API não está funcionando. Verifique se está rodando em http://localhost:3000');
        }
      });
  }
}
