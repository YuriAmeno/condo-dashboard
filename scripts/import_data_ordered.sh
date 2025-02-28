#!/bin/bash

# Configurações do banco de produção
PROD_DB_HOST="db.kzmfnhnfqlrrhyznpkpr.supabase.co"
PROD_DB_NAME="postgres"
PROD_DB_USER="postgres"
PROD_DB_PASSWORD="96@99-34!72-Ridu"

# Diretório com os arquivos CSV
CSV_DIR="./scripts/csv_export"

echo "===================================================="
echo "IMPORTAÇÃO DE DADOS COM ORDEM CORRETA"
echo "===================================================="
echo ""

# Confirmar antes de continuar
echo -e "\033[31mAVISO: Esta operação irá substituir os dados em produção!\033[0m"
read -p "Digite 'IMPORTAR' para confirmar: " confirmation

if [ "$confirmation" != "IMPORTAR" ]; then
    echo "Operação cancelada pelo usuário."
    exit 0
fi

# Desativar triggers e constraints temporariamente
echo "Desativando verificação de restrições..."
PGPASSWORD=$PROD_DB_PASSWORD psql \
  -h $PROD_DB_HOST \
  -U $PROD_DB_USER \
  -d $PROD_DB_NAME \
  -c "SET session_replication_role = 'replica';" \
  -c "\q"

# Criar script SQL temporário para importação
TEMP_SQL=$(mktemp)
echo "-- Script de importação com ordem correta" > "$TEMP_SQL"
echo "BEGIN;" >> "$TEMP_SQL"
echo "SET session_replication_role = 'replica';" >> "$TEMP_SQL"

# Função para importar tabela e lidar com erros de FK
import_table() {
    local table=$1
    
    if [ -f "$CSV_DIR/$table.csv" ]; then
        echo "Preparando importação de $table..."
        
        # Adicionar TRUNCATE
        echo "TRUNCATE TABLE public.\"$table\" CASCADE;" >> "$TEMP_SQL"
        
        # Gerar comando COPY para importar dados
        echo "\\COPY public.\"$table\" FROM '$CSV_DIR/$table.csv' WITH CSV HEADER;" >> "$TEMP_SQL"
        
        # Adicionar verificação para capturar erros
        echo "DO \$\$" >> "$TEMP_SQL"
        echo "BEGIN" >> "$TEMP_SQL"
        echo "    RAISE NOTICE 'Tabela $table importada com sucesso';" >> "$TEMP_SQL"
        echo "EXCEPTION WHEN OTHERS THEN" >> "$TEMP_SQL"
        echo "    RAISE WARNING 'Erro ao importar $table: %', SQLERRM;" >> "$TEMP_SQL"
        echo "END \$\$;" >> "$TEMP_SQL"
        echo "" >> "$TEMP_SQL"
    else
        echo "Arquivo $table.csv não encontrado. Pulando..."
    fi
}

# Ordem de importação baseada nas dependências (do menos dependente para o mais dependente)
echo "Ordenando tabelas para importação..."

# 1. Tabelas independentes primeiro
import_table "company"
import_table "store"
import_table "notification_templates"
import_table "apartment_complex"
import_table "signatures"

# 2. Se o usuário estiver na sua própria tabela, precisamos verificar
echo "-- Verificar se a tabela auth.users existe e tem dados" >> "$TEMP_SQL"
echo "DO \$\$" >> "$TEMP_SQL"
echo "DECLARE user_count INT;" >> "$TEMP_SQL"
echo "BEGIN" >> "$TEMP_SQL"
echo "    SELECT COUNT(*) INTO user_count FROM auth.users;" >> "$TEMP_SQL"
echo "    RAISE NOTICE 'Encontrados % usuários na tabela auth.users', user_count;" >> "$TEMP_SQL"
echo "EXCEPTION WHEN OTHERS THEN" >> "$TEMP_SQL"
echo "    RAISE WARNING 'Não foi possível verificar auth.users: %', SQLERRM;" >> "$TEMP_SQL"
echo "END \$\$;" >> "$TEMP_SQL"

# 3. Tabelas com dependências de primeiro nível
import_table "managers"

# 4. Tabelas que dependem do nível anterior
import_table "buildings"

# 5. Tabelas que dependem do nível anterior
import_table "apartments"

# 6. Tabelas que dependem do nível anterior
import_table "residents"
import_table "doormen"

# 7. Dependências finais
import_table "doormen_history"
import_table "packages"
import_table "notification_queue"
import_table "notification_logs"

# Restaurar configuração normal
echo "SET session_replication_role = 'origin';" >> "$TEMP_SQL"
echo "COMMIT;" >> "$TEMP_SQL"

# Executar o script completo
echo "Iniciando importação na ordem correta..."
PGPASSWORD=$PROD_DB_PASSWORD psql \
  -h $PROD_DB_HOST \
  -U $PROD_DB_USER \
  -d $PROD_DB_NAME \
  -f "$TEMP_SQL"

# Exibir o script em caso de erro (opcional)
echo "Script de importação gerado em: $TEMP_SQL"
echo "Em caso de erros, inspecione o arquivo acima."

echo ""
echo "===================================================="
echo "Importação finalizada!"
echo "====================================================" 