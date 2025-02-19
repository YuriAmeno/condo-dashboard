import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatar telefone para exibição (XX) XXXXX-XXXX
export function formatPhoneForDisplay(phone: string): string {
  // Remove tudo que não for número
  const numbers = phone.replace(/\D/g, "");

  // Verifica se tem a quantidade correta de números
  if (numbers.length !== 11) return phone;

  // Formata o número (XX) XXXXX-XXXX
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
}

// Formatar telefone para o banco de dados (5531986830483)
export function formatPhoneForDB(phone: string): string {
  // Remove tudo que não for número
  const numbers = phone.replace(/\D/g, "");

  // Adiciona o prefixo 55 se não existir
  if (numbers.length === 11) {
    return `55${numbers}`;
  }

  return numbers;
}

// Validar formato do telefone
export function isValidPhone(phone: string): boolean {
  const numbers = phone.replace(/\D/g, "");
  return numbers.length === 11;
}

// Aplicar máscara enquanto digita
export function applyPhoneMask(value: string): string {
  let numbers = value.replace(/\D/g, ""); // Remove tudo que não for número

  // Verifica se há código de país (exemplo: "55")
  const hasCountryCode = numbers.length > 11 && numbers.startsWith("55");

  let countryCode = "";
  let formattedNumber = "";

  if (hasCountryCode) {
    countryCode = `+${numbers.slice(0, 2)} `; // Adiciona o código do país com "+"
    numbers = numbers.slice(2); // Remove o código do país da string
  }

  if (numbers.length <= 2) {
    formattedNumber = numbers;
  } else if (numbers.length <= 7) {
    formattedNumber = `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  } else {
    formattedNumber = `(${numbers.slice(0, 2)}) 9 ${numbers.slice(
      2,
      7
    )}-${numbers.slice(7, 11)}`;
  }

  return countryCode + formattedNumber;
}
