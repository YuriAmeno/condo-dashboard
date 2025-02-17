import * as XLSX from 'xlsx';

export function useResidentTemplate() {
  const generateTemplate = () => {
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['Nome', 'Telefone', 'Email', 'Torre', 'Apartamento'], // Headers
      ['João Silva', '(11) 99999-9999', 'joao@email.com', 'Torre A', '101'], // Example row
    ]);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Moradores');

    // Generate buffer
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    // Create blob and download
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modelo-importacao-moradores.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return { generateTemplate };
}