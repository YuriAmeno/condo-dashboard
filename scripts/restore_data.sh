#!/bin/bash

# Configurações do banco de produção
PROD_DB_HOST="db.kzmfnhnfqlrrhyznpkpr.supabase.co"
PROD_DB_NAME="postgres"
PROD_DB_USER="postgres"
PROD_DB_PASSWORD="96@99-34!72-Ridu"

# Solicitar caminho do arquivo de backup
echo "===================================================="
echo "RESTAURAÇÃO DE DADOS DO BACKUP"
echo "===================================================="
echo ""
echo "Por favor, insira o caminho completo para o arquivo de backup:"
echo "(exemplo: ./backups/prod_backup_complete_20230528_123456.dump)"
read -p "Caminho do backup: " BACKUP_FILE

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Erro: Arquivo de backup não encontrado!"
  exit 1
fi

echo ""
echo -e "\033[31mAVISO: Esta operação irá restaurar APENAS OS DADOS para o banco de produção.\033[0m"
echo "A estrutura atual será mantida, mas os dados serão restaurados do backup."
read -p "Digite 'RESTAURAR' para confirmar: " confirmation

if [ "$confirmation" != "RESTAURAR" ]; then
  echo "Operação cancelada pelo usuário."
  exit 1
fi

# Criação de diretório temporário
TEMP_DIR=$(mktemp -d)
echo "Criando diretório temporário: $TEMP_DIR"

# Extrair o backup para o diretório temporário
echo "Extraindo backup para processamento..."
pg_restore -f "$TEMP_DIR/dump.sql" "$BACKUP_FILE"

# Criar um script temporário que listará todas as tabelas no schema público
echo "Identificando tabelas no esquema público..."
PGPASSWORD=$PROD_DB_PASSWORD psql \
  -h $PROD_DB_HOST \
  -U $PROD_DB_USER \
  -d $PROD_DB_NAME \
  -t \
  -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';" > "$TEMP_DIR/tables.txt"

# Desativar verificação de chaves estrangeiras no nível da sessão
echo "Desativando temporariamente verificação de chaves estrangeiras..."
PGPASSWORD=$PROD_DB_PASSWORD psql \
  -h $PROD_DB_HOST \
  -U $PROD_DB_USER \
  -d $PROD_DB_NAME \
  -c "SET session_replication_role = 'replica';" -c "\q"

# Para cada tabela, truncar e depois restaurar os dados
while read -r table; do
  # Remover espaços em branco
  table=$(echo "$table" | tr -d '[:space:]')
  
  if [ -n "$table" ]; then
    echo "Limpando tabela: $table"
    PGPASSWORD=$PROD_DB_PASSWORD psql \
      -h $PROD_DB_HOST \
      -U $PROD_DB_USER \
      -d $PROD_DB_NAME \
      -c "TRUNCATE TABLE public.\"$table\" CASCADE;"
    
    # Extrair e importar dados desta tabela específica
    echo "Importando dados para: $table"
    
    # Extrair os comandos COPY desta tabela do arquivo SQL
    grep -A 100000 "COPY public.\"$table\"" "$TEMP_DIR/dump.sql" | sed -n '/COPY/,/\\./p' > "$TEMP_DIR/${table}_copy.sql"
    
    # Executar os comandos COPY para esta tabela
    PGPASSWORD=$PROD_DB_PASSWORD psql \
      -h $PROD_DB_HOST \
      -U $PROD_DB_USER \
      -d $PROD_DB_NAME \
      -f "$TEMP_DIR/${table}_copy.sql"
  fi
done < "$TEMP_DIR/tables.txt"

# Reativar verificação de chaves estrangeiras
echo "Reativando verificação de chaves estrangeiras..."
PGPASSWORD=$PROD_DB_PASSWORD psql \
  -h $PROD_DB_HOST \
  -U $PROD_DB_USER \
  -d $PROD_DB_NAME \
  -c "SET session_replication_role = 'origin';" -c "\q"

# Limpar arquivos temporários
echo "Limpando arquivos temporários..."
rm -rf "$TEMP_DIR"

echo ""
echo "===================================================="
echo "Restauração de dados concluída!"
echo "====================================================" 