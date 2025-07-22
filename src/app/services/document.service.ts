import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, firstValueFrom } from 'rxjs';
import { Document } from '../models/document.model';
import { ModalService } from './modal.service';

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

  constructor(
    private http: HttpClient,
    private modalService: ModalService
  ) {
    this.loadDocumentsFromApi();
  }

  /**
   * Carregar documentos da API baseado no tipo de visualização
   */
  private loadDocumentsFromApi(parentId?: number | null, viewType?: 'all' | 'recent' | 'starred' | 'trash'): void {
    let params = new HttpParams();

    const currentViewType = viewType || this.viewTypeSubject.value;

    // Para diferentes tipos de visualização, fazemos queries diferentes
    switch (currentViewType) {
      case 'all':
        // Arquivos normais (não deletados) de uma pasta específica
        if (parentId !== undefined && parentId !== null) {
          params = params.set('parent_id', parentId.toString());
        }
        break;

      case 'starred':
        // Todos os arquivos favoritados (não deletados)
        params = params.set('starred', 'true');
        break;

      case 'trash':
        // Todos os arquivos deletados
        params = params.set('trashed', 'true');
        break;

      case 'recent':
        // Arquivos modificados recentemente (últimos 7 dias)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        params = params.set('recent', 'true');
        params = params.set('since', sevenDaysAgo.toISOString());
        break;
    }

    console.log('🔄 Carregando documentos da API...', {
      parentId,
      viewType: currentViewType,
      params: params.toString()
    });

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
          console.log('📄 Documentos carregados:', documents.length, 'Tipo:', currentViewType);
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

  /**
   * Definir tipo de visualização e carregar dados correspondentes
   */
  setViewType(viewType: 'all' | 'recent' | 'starred' | 'trash'): void {
    console.log('📋 Mudando para visualização:', viewType);

    this.viewTypeSubject.next(viewType);

    // Para views especiais, resetar path e parent
    if (viewType !== 'all') {
      this.currentPathSubject.next('/');
      this.currentParentIdSubject.next(null);
    }

    // Carregar documentos do tipo específico
    this.loadDocumentsFromApi(null, viewType);
  }

  navigateToFolder(path: string, parentId?: string): void {
    console.log('📁 Navegando para:', path, 'Parent ID:', parentId);

    this.currentPathSubject.next(path);

    // Atualizar o parentId atual
    if (parentId) {
      this.currentParentIdSubject.next(parseInt(parentId));
    } else if (path === '/') {
      this.currentParentIdSubject.next(null); // Raiz
    }

    // Sempre voltar para view 'all' quando navegando por pastas
    this.viewTypeSubject.next('all');
    this.loadDocumentsFromApi(this.currentParentIdSubject.value, 'all');
  }

  /**
   * Criar pasta usando a API - RETORNA PROMISE
   */
  async createFolder(name: string): Promise<{ success: boolean; message: string }> {
    console.log('🔄 Criando pasta via API:', name);

    const createData = {
      name: name,
      type: 'folder',
      parent_id: this.currentParentIdSubject.value
    };

    try {
      const response = await firstValueFrom(
        this.http.post<ApiResponse<ApiFile>>(this.baseUrl, createData)
      );

      console.log('✅ Resposta da criação de pasta:', response);

      if (response.success) {
        // Recarregar a lista atual
        this.reloadCurrentView();

        return {
          success: true,
          message: `Pasta "${name}" criada com sucesso!`
        };
      } else {
        console.error('❌ Erro na resposta da API:', response.message);
        return {
          success: false,
          message: response.message || 'Erro ao criar pasta'
        };
      }
    } catch (error: any) {
      console.error('❌ Erro ao criar pasta:', error);
      return {
        success: false,
        message: `Erro na API: ${error.message}`
      };
    }
  }

  /**
   * Favoritar/desfavoritar documento usando a API
   */
  toggleStar(documentId: string): void {
    console.log('🔄 Alternando estrela via API:', documentId);

    const url = `${this.baseUrl}/${documentId}/toggle-star`;

    this.http.put<ApiResponse<ApiFile>>(url, {})
      .subscribe({
        next: async (response) => {
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

            // Se estamos na view de favoritos e o item foi desfavoritado, removê-lo da lista
            if (this.viewTypeSubject.value === 'starred' && !response.data.starred) {
              this.reloadCurrentView();
            }
          } else {
            console.error('❌ Erro na resposta da API:', response.message);
            await this.modalService.showError(`Erro ao favoritar: ${response.message}`);
          }
        },
        error: async (error) => {
          console.error('❌ Erro ao alternar estrela:', error);
          await this.modalService.showError(`Erro na API ao favoritar: ${error.message}`);
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
        next: async (response) => {
          console.log('✅ Documento excluído com sucesso:', response);

          if (response.success) {
            // Remover o documento da lista local
            const currentDocs = this.documentsSubject.value;
            const filteredDocs = currentDocs.filter(doc => doc.id !== documentId);
            this.documentsSubject.next(filteredDocs);

            await this.modalService.showSuccess('Arquivo movido para lixeira com sucesso!');
            console.log('🗑️ Documento movido para lixeira');
          } else {
            console.error('❌ Erro na resposta da API:', response.message);
            await this.modalService.showError(`Erro ao excluir: ${response.message}`);
          }
        },
        error: async (error) => {
          console.error('❌ Erro ao excluir documento:', error);
          await this.modalService.showError(`Erro na API ao excluir: ${error.message}`);
        }
      });
  }

  /**
   * Upload de arquivo real usando a API - RETORNA PROMISE
   */
  async uploadFile(file: File): Promise<{ success: boolean; message: string }> {
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

    try {
      const response = await firstValueFrom(
        this.http.post<ApiResponse<ApiFile>>(this.baseUrl, formData)
      );

      console.log('✅ Upload realizado com sucesso:', response);

      if (response.success) {
        // Recarregar a lista atual
        this.reloadCurrentView();

        return {
          success: true,
          message: `Arquivo "${file.name}" enviado com sucesso!`
        };
      } else {
        console.error('❌ Erro na resposta da API:', response.message);
        return {
          success: false,
          message: response.message || 'Erro no upload'
        };
      }
    } catch (error: any) {
      console.error('❌ Erro no upload:', error);
      return {
        success: false,
        message: `Erro no upload: ${error.message}`
      };
    }
  }

  /**
   * Criar documento Google usando a API - RETORNA PROMISE
   */
  async createGoogleDocument(name: string, type: 'document' | 'spreadsheet' | 'presentation'): Promise<{ success: boolean; message: string }> {
    console.log('🔄 Criando documento Google via API:', name, type);

    const createData = {
      name: name,
      type: type,
      parent_id: this.currentParentIdSubject.value
    };

    try {
      const response = await firstValueFrom(
        this.http.post<ApiResponse<ApiFile>>(this.baseUrl, createData)
      );

      console.log('✅ Documento Google criado com sucesso:', response);

      if (response.success) {
        // Recarregar a lista atual
        this.reloadCurrentView();

        return {
          success: true,
          message: `${this.getDocumentTypeName(type)} "${name}" criado com sucesso!`
        };
      } else {
        console.error('❌ Erro na resposta da API:', response.message);
        return {
          success: false,
          message: response.message || 'Erro ao criar documento'
        };
      }
    } catch (error: any) {
      console.error('❌ Erro ao criar documento Google:', error);
      return {
        success: false,
        message: `Erro na API: ${error.message}`
      };
    }
  }

  /**
   * Restaurar documento da lixeira
   */
  restoreDocument(documentId: string): void {
    console.log('🔄 Restaurando documento via API:', documentId);

    const url = `${this.baseUrl}/${documentId}/restore`;

    this.http.put<ApiResponse<any>>(url, {})
      .subscribe({
        next: async (response) => {
          console.log('✅ Documento restaurado com sucesso:', response);

          if (response.success) {
            // Remover o documento da lista da lixeira
            const currentDocs = this.documentsSubject.value;
            const filteredDocs = currentDocs.filter(doc => doc.id !== documentId);
            this.documentsSubject.next(filteredDocs);

            await this.modalService.showSuccess('Arquivo restaurado com sucesso!');
            console.log('📋 Documento restaurado e removido da lixeira');
          } else {
            console.error('❌ Erro na resposta da API:', response.message);
            await this.modalService.showError(`Erro ao restaurar: ${response.message}`);
          }
        },
        error: async (error) => {
          console.error('❌ Erro ao restaurar documento:', error);
          await this.modalService.showError(`Erro na API ao restaurar: ${error.message}`);
        }
      });
  }

  /**
   * Excluir documento permanentemente
   */
  permanentDeleteDocument(documentId: string): void {
    console.log('🔄 Excluindo permanentemente via API:', documentId);

    const url = `${this.baseUrl}/${documentId}/permanent`;

    this.http.delete<ApiResponse<any>>(url)
      .subscribe({
        next: async (response) => {
          console.log('✅ Documento excluído permanentemente:', response);

          if (response.success) {
            // Remover o documento da lista
            const currentDocs = this.documentsSubject.value;
            const filteredDocs = currentDocs.filter(doc => doc.id !== documentId);
            this.documentsSubject.next(filteredDocs);

            await this.modalService.showSuccess('Arquivo excluído permanentemente!');
            console.log('🗑️ Documento removido permanentemente');
          } else {
            console.error('❌ Erro na resposta da API:', response.message);
            await this.modalService.showError(`Erro ao excluir permanentemente: ${response.message}`);
          }
        },
        error: async (error) => {
          console.error('❌ Erro ao excluir permanentemente:', error);
          await this.modalService.showError(`Erro na API ao excluir permanentemente: ${error.message}`);
        }
      });
  }

  /**
   * Recarregar a visualização atual (favoritos, lixeira, etc.)
   */
  private reloadCurrentView(): void {
    const currentViewType = this.viewTypeSubject.value;
    const currentParentId = this.currentParentIdSubject.value;

    console.log('🔄 Recarregando visualização atual:', currentViewType);

    this.loadDocumentsFromApi(currentParentId, currentViewType);
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
   * Pesquisar documentos (local por enquanto)
   */
  searchDocuments(query: string): void {
    if (!query || query.trim() === '') {
      this.reloadCurrentView();
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

  /**
   * Teste de conexão com API
   */
  testApiConnection(): void {
    console.log('🔍 Testando conexão com API...');

    this.http.get<ApiResponse<any>>(this.baseUrl.replace('/files', '/health'))
      .subscribe({
        next: async (response) => {
          console.log('✅ API funcionando!', response);
          await this.modalService.showSuccess('API conectada com sucesso!');
        },
        error: async (error) => {
          console.error('❌ API não está funcionando:', error);
          await this.modalService.showError('API não está funcionando. Verifique se está rodando em http://localhost:3333');
        }
      });
  }
}
