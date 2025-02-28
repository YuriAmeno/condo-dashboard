#!/bin/bash

# Configurações do banco de desenvolvimento
DEV_DB_HOST="db.rklznjeykolpjkawmcuw.supabase.co"
DEV_DB_NAME="postgres"
DEV_DB_USER="postgres"
DEV_DB_PASSWORD="96@99-34!72-Ridu" 

# Configurações do banco de produção
PROD_DB_HOST="db.kzmfnhnfqlrrhyznpkpr.supabase.co"
PROD_DB_NAME="postgres"
PROD_DB_USER="postgres"
PROD_DB_PASSWORD="96@99-34!72-Ridu"

# Diretório para armazenar os arquivos CSV
CSV_DIR="./scripts/csv_export"
mkdir -p "$CSV_DIR"

echo "===================================================="
echo "EXPORTAÇÃO DE DADOS PARA CSV"
echo "===================================================="
echo ""

# Criar lista de tabelas do schema public
TABLES_FILE="$CSV_DIR/tables.txt"
PGPASSWORD=$DEV_DB_PASSWORD psql -h $DEV_DB_HOST -U $DEV_DB_USER -d $DEV_DB_NAME -t -c "
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;" > "$TABLES_FILE"

# Contador para tabelas exportadas
COUNT=0

# Exportar cada tabela para CSV
echo "Exportando tabelas para CSV..."
while read table; do
    # Remover espaços em branco
    table=$(echo "$table" | tr -d '[:space:]')
    
    if [ -n "$table" ]; then
        echo "Exportando tabela: $table"
        
        # Exportar para CSV
        PGPASSWORD=$DEV_DB_PASSWORD psql -h $DEV_DB_HOST -U $DEV_DB_USER -d $DEV_DB_NAME -c "
        COPY public.\"$table\" TO STDOUT WITH CSV HEADER" > "$CSV_DIR/$table.csv"
        
        # Contar linhas no arquivo CSV (subtrair 1 para o cabeçalho)
        if [ -f "$CSV_DIR/$table.csv" ]; then
            lines=$(wc -l < "$CSV_DIR/$table.csv")
            records=$((lines - 1))
            echo "  - $records registros exportados para $table.csv"
            COUNT=$((COUNT + 1))
        else
            echo "  - Falha ao exportar tabela $table"
        fi
    fi
done < "$TABLES_FILE"

echo ""
echo "Exportação concluída! $COUNT tabelas exportadas para $CSV_DIR/"
echo ""

# Perguntar se deseja importar para produção
read -p "Deseja importar estes dados para o banco de produção? (s/n): " IMPORT_CHOICE

if [ "$IMPORT_CHOICE" = "s" ] || [ "$IMPORT_CHOICE" = "S" ]; then
    echo ""
    echo "===================================================="
    echo "IMPORTAÇÃO DE DADOS PARA PRODUÇÃO"
    echo "===================================================="
    echo ""
    
    # Confirmar antes de continuar
    echo -e "\033[31mAVISO: Esta operação irá substituir os dados em produção!\033[0m"
    read -p "Digite 'IMPORTAR' para confirmar: " confirmation
    
    if [ "$confirmation" != "IMPORTAR" ]; then
        echo "Operação cancelada pelo usuário."
        exit 0
    fi
    
    # Desativar verificação de chaves estrangeiras
    echo "Desativando verificação de chaves estrangeiras..."
    PGPASSWORD=$PROD_DB_PASSWORD psql \
      -h $PROD_DB_HOST \
      -U $PROD_DB_USER \
      -d $PROD_DB_NAME \
      -c "SET session_replication_role = 'replica';" -c "\q"
    
    # Importar cada tabela para produção
    while read table; do
        # Remover espaços em branco
        table=$(echo "$table" | tr -d '[:space:]')
        
        if [ -n "$table" ] && [ -f "$CSV_DIR/$table.csv" ]; then
            echo "Importando tabela: $table"
            
            # Limpar tabela
            PGPASSWORD=$PROD_DB_PASSWORD psql \
              -h $PROD_DB_HOST \
              -U $PROD_DB_USER \
              -d $PROD_DB_NAME \
              -c "TRUNCATE TABLE public.\"$table\" CASCADE;" -c "\q"
            
            # Importar do CSV
            PGPASSWORD=$PROD_DB_PASSWORD psql -h $PROD_DB_HOST -U $PROD_DB_USER -d $PROD_DB_NAME -c "
            COPY public.\"$table\" FROM STDIN WITH CSV HEADER" < "$CSV_DIR/$table.csv"
            
            echo "  - Dados importados para $table"
        fi
    done < "$TABLES_FILE"
    
    # Reativar verificação de chaves estrangeiras
    echo "Reativando verificação de chaves estrangeiras..."
    PGPASSWORD=$PROD_DB_PASSWORD psql \
      -h $PROD_DB_HOST \
      -U $PROD_DB_USER \
      -d $PROD_DB_NAME \
      -c "SET session_replication_role = 'origin';" -c "\q"
    
    echo ""
    echo "Importação para produção concluída!"
else
    echo "Importação para produção não foi realizada."
fi

echo ""
echo "===================================================="
echo "Processo concluído!"
echo "====================================================" 