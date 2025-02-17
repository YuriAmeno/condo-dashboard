import { useState } from 'react';
import { FileUp, Upload, X, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useResidentTemplate } from '@/hooks/use-resident-template';
import { useToast } from '@/hooks/use-toast';

interface ImportDialogProps {
  onImport: (file: File, mapping: Record<string, string>) => Promise<void>;
}

// Mapeamento padrão de colunas
const defaultColumnMappings: Record<string, string[]> = {
  name: ['nome', 'nome completo', 'nome do morador'],
  phone: ['telefone', 'celular', 'contato', 'fone'],
  email: ['email', 'e-mail'],
  building: ['torre', 'predio', 'prédio', 'bloco'],
  apartment: ['apartamento', 'apto', 'unidade', 'numero', 'número'],
};

// Campos obrigatórios e seus rótulos
const requiredFields = [
  { key: 'name', label: 'Nome' },
  { key: 'phone', label: 'Telefone' },
  { key: 'email', label: 'Email' },
  { key: 'building', label: 'Torre' },
  { key: 'apartment', label: 'Apartamento' },
];

export function ImportDialog({ onImport }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { generateTemplate } = useResidentTemplate();
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Ler o arquivo Excel
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Obter cabeçalhos
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      const headers: string[] = [];
      
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c: col })];
        if (cell?.v) {
          headers.push(cell.v.toString().trim());
        }
      }

      if (headers.length === 0) {
        throw new Error('Arquivo não contém cabeçalhos válidos');
      }

      setFile(file);
      setExcelColumns(headers);

      // Tentar mapear automaticamente as colunas
      const autoMapping: Record<string, string> = {};
      headers.forEach((header) => {
        const headerLower = header.toLowerCase();
        
        // Procurar em cada campo obrigatório
        for (const field of requiredFields) {
          const possibleMatches = defaultColumnMappings[field.key];
          if (possibleMatches?.some(match => headerLower.includes(match))) {
            autoMapping[header] = field.key;
            break;
          }
        }
      });

      setMapping(autoMapping);
    } catch (error) {
      console.error('Erro ao ler arquivo:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao ler arquivo',
        description: 'Verifique se o arquivo está no formato correto.',
      });
      // Limpar estado em caso de erro
      setFile(null);
      setExcelColumns([]);
      setMapping({});
    }
  };

  const validateMapping = () => {
    // Verificar se todos os campos obrigatórios estão mapeados
    const mappedFields = new Set(Object.values(mapping));
    const missingFields = requiredFields.filter(field => !mappedFields.has(field.key));
    
    if (missingFields.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Mapeamento incompleto',
        description: `Campos obrigatórios não mapeados: ${missingFields.map(f => f.label).join(', ')}`,
      });
      return false;
    }
    
    return true;
  };

  const handleImport = async () => {
    if (!file) return;
    
    if (!validateMapping()) return;

    try {
      setIsLoading(true);
      await onImport(file, mapping);
      
      // Limpar estado após importação bem-sucedida
      setFile(null);
      setExcelColumns([]);
      setMapping({});
      
      toast({
        title: 'Importação concluída',
        description: 'Os dados foram importados com sucesso.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro na importação',
        description: error instanceof Error ? error.message : 'Erro ao importar dados.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Download Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Importar Moradores</h3>
        <Button variant="outline" onClick={generateTemplate}>
          <Download className="mr-2 h-4 w-4" />
          Baixar Modelo
        </Button>
      </div>

      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <FileUp className="w-8 h-8 mb-2 text-muted-foreground" />
            <p className="mb-2 text-sm text-muted-foreground">
              Clique para selecionar ou arraste o arquivo
            </p>
            <p className="text-xs text-muted-foreground">XLSX até 10MB</p>
          </div>
          <Input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            disabled={isLoading}
          />
        </label>
      </div>

      {file && (
        <>
          <Alert>
            <AlertTitle>Arquivo selecionado</AlertTitle>
            <AlertDescription>{file.name}</AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Mapear Colunas</h3>
            <p className="text-sm text-muted-foreground">
              Verifique se o mapeamento automático está correto ou ajuste manualmente.
            </p>
            {excelColumns.map((excelColumn) => (
              <div
                key={excelColumn}
                className="flex items-center space-x-2"
              >
                <p className="w-1/3 text-sm">{excelColumn}</p>
                <Select
                  value={mapping[excelColumn]}
                  onValueChange={(value) => setMapping(prev => ({
                    ...prev,
                    [excelColumn]: value
                  }))}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o campo" />
                  </SelectTrigger>
                  <SelectContent>
                    {requiredFields.map(({ key, label }) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setFile(null);
                setExcelColumns([]);
                setMapping({});
              }}
              disabled={isLoading}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button 
              onClick={handleImport}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}