import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatar telefone para exibição (XX) XXXXX-XXXX
export function formatPhoneForDisplay(phone: string): string {
  // Remove tudo que não for número
  const numbers = phone.replace(/\D/g, '');
  
  // Verifica se tem a quantidade correta de números
  if (numbers.length !== 11) return phone;
  
  // Formata o número (XX) XXXXX-XXXX
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
}

// Formatar telefone para o banco de dados (5531986830483)
export function formatPhoneForDB(phone: string): string {
  // Remove tudo que não for número
  const numbers = phone.replace(/\D/g, '');
  
  // Adiciona o prefixo 55 se não existir
  if (numbers.length === 11) {
    return `55${numbers}`;
  }
  
  return numbers;
}

// Validar formato do telefone
export function isValidPhone(phone: string): boolean {
  const numbers = phone.replace(/\D/g, '');
  return numbers.length === 11;
}

// Aplicar máscara enquanto digita
export function applyPhoneMask(value: string): string {
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length <= 2) {
    return numbers;
  }
  
  if (numbers.length <= 7) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  }
  
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
}