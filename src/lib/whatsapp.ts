import { Database } from '@/types/supabase';

type Resident = Database['public']['Tables']['residents']['Row'];
type Package = Database['public']['Tables']['packages']['Row'];
type NotificationTemplate = Database['public']['Tables']['notification_templates']['Row'];

interface WhatsAppConfig {
  apiKey: string;
  phoneNumberId: string;
  accessToken: string;
  webhookSecret: string;
}

class WhatsAppService {
  private config: WhatsAppConfig;
  private baseUrl = 'https://graph.facebook.com/v17.0';

  constructor(config: WhatsAppConfig) {
    this.config = config;
  }

  private async sendRequest(endpoint: string, data: any) {
    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('WhatsApp API error:', error);
      throw error;
    }
  }

  async sendMessage(to: string, template: NotificationTemplate, data: {
    resident: Resident;
    package_?: Package | null;
  }) {
    // Formata o número de telefone
    const formattedPhone = to.replace(/\D/g, '');
    if (formattedPhone.length < 10) {
      throw new Error('Invalid phone number');
    }

    // Processa o template com os dados
    const processedContent = this.processTemplate(template.content, data);

    return this.sendRequest(`${this.config.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'text',
      text: {
        body: processedContent,
      },
    });
  }

  private processTemplate(template: string, data: {
    resident: Resident;
    package_?: Package | null;
  }): string {
    const { resident, package_ } = data;

    // Substitui as variáveis do template
    let content = template
      .replace(/\${resident\.name}/g, resident.name)
      .replace(/\${resident\.phone}/g, resident.phone);

    if (package_) {
      content = content
        .replace(/\${package\.delivery_company}/g, package_.delivery_company)
        .replace(/\${package\.received_at}/g, new Date(package_.received_at).toLocaleString('pt-BR'))
        .replace(/\${package\.store_name}/g, package_.store_name);
    }

    return content;
  }

  // Placeholder for webhook verification - implement actual logic as needed
  verifyWebhook(): boolean {
    return true;
  }
}

// Cria uma instância única do serviço
export const whatsappService = new WhatsAppService({
  apiKey: import.meta.env.VITE_WHATSAPP_API_KEY || '',
  phoneNumberId: import.meta.env.VITE_WHATSAPP_PHONE_ID || '',
  accessToken: import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN || '',
  webhookSecret: import.meta.env.VITE_WHATSAPP_WEBHOOK_SECRET || '',
});