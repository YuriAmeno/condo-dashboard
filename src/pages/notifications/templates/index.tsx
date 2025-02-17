import { useState } from 'react';
import { FileText, Plus, Loader2 } from 'lucide-react';
import { useNotificationTemplates } from '@/hooks/use-notification-templates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { NotificationTemplateType } from '@/types/supabase';

const templateTypes: Record<NotificationTemplateType, { label: string }> = {
  package_arrival: { label: 'Chegada de Encomenda' },
  followup_24h: { label: 'Lembrete 24h' },
  followup_48h: { label: 'Lembrete 48h' },
  followup_72h: { label: 'Lembrete 72h' },
  followup_7d: { label: 'Lembrete 7 dias' },
  package_pickup: { label: 'Confirmação de Retirada' },
};

export function NotificationTemplates() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const { templates, isLoading, createTemplate, updateTemplate, toggleTemplate } = useNotificationTemplates();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      type: formData.get('type') as NotificationTemplateType,
      title: formData.get('title') as string,
      content: formData.get('content') as string,
    };

    try {
      if (editingTemplate) {
        await updateTemplate.mutateAsync({ id: editingTemplate.id, ...data });
        toast({
          title: 'Template atualizado',
          description: 'O template foi atualizado com sucesso.',
        });
      } else {
        await createTemplate.mutateAsync(data);
        toast({
          title: 'Template criado',
          description: 'O template foi criado com sucesso.',
        });
      }
      setShowDialog(false);
      setEditingTemplate(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar template',
        description: 'Não foi possível salvar o template. Tente novamente.',
      });
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await toggleTemplate.mutateAsync({ id, active });
      toast({
        title: active ? 'Template ativado' : 'Template desativado',
        description: `O template foi ${active ? 'ativado' : 'desativado'} com sucesso.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao alterar status',
        description: 'Não foi possível alterar o status do template.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            Templates de Mensagem
          </h1>
        </div>

        <Button onClick={() => {
          setEditingTemplate(null);
          setShowDialog(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Template
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6">
          {templates?.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{template.title}</CardTitle>
                  <Switch
                    checked={template.active}
                    onCheckedChange={(checked) => handleToggle(template.id, checked)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium">Tipo:</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {templateTypes[template.type].label}
                    </span>
                  </div>

                  <div>
                    <span className="text-sm font-medium">Conteúdo:</span>
                    <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                      {template.content}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingTemplate(template);
                      setShowDialog(true);
                    }}
                  >
                    Editar Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Template' : 'Novo Template'}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? 'Edite as informações do template de notificação.'
                : 'Crie um novo template de notificação.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select
                name="type"
                defaultValue={editingTemplate?.type}
                disabled={!!editingTemplate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(templateTypes).map(([value, { label }]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input
                name="title"
                defaultValue={editingTemplate?.title}
                placeholder="Título do template"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Conteúdo</label>
              <Textarea
                name="content"
                defaultValue={editingTemplate?.content}
                placeholder="Conteúdo da mensagem"
                className="h-32"
              />
              <p className="text-xs text-muted-foreground">
                Variáveis disponíveis: ${'{resident.name}'}, ${'{resident.phone}'}, ${'{package.delivery_company}'}, ${'{package.store_name}'}
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setEditingTemplate(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingTemplate ? 'Atualizar' : 'Criar'} Template
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}