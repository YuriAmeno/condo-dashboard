#!/bin/bash

# Configurações
PROD_DB_HOST="db.kzmfnhnfqlrrhyznpkpr.supabase.co"
PROD_DB_NAME="postgres"
PROD_DB_USER="postgres"
PROD_DB_PASSWORD="96@99-34!72-Ridu"
BACKUP_DIR="./scripts/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/verified_backup_$TIMESTAMP.dump"
LOCAL_DB_NAME="temp_restore_db"

echo "===================================================="
echo "RESTAURAÇÃO DE DADOS VIA BANCO LOCAL"
echo "===================================================="

# Verificar se o PostgreSQL local está instalado
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL não está instalado localmente. Por favor, instale-o primeiro."
    exit 1
fi

# Verificar se o arquivo de backup existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Arquivo de backup não encontrado: $BACKUP_FILE"
    exit 1
fi

# Criar banco de dados local temporário
echo "Criando banco de dados local temporário..."
dropdb --if-exists $LOCAL_DB_NAME 2>/dev/null
createdb $LOCAL_DB_NAME

# Restaurar o backup para o banco local
echo "Restaurando backup para o banco local..."
pg_restore -d $LOCAL_DB_NAME "$BACKUP_FILE"

# Criar arquivo SQL com comandos INSERT para cada tabela
echo "Gerando script de inserção de dados..."
TEMP_DIR=$(mktemp -d)
SQL_FILE="$TEMP_DIR/insert_data.sql"

# Obter lista de tabelas no schema public
echo "\\o $TEMP_DIR/tables.txt
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;" | psql -d $LOCAL_DB_NAME

# Criar arquivo SQL com TRUNCATE e INSERT para cada tabela
echo "-- Script gerado automaticamente para migração de dados" > $SQL_FILE
echo "BEGIN;" >> $SQL_FILE
echo "SET session_replication_role = 'replica';" >> $SQL_FILE

while read table; do
    # Ignorar linhas vazias
    if [ -z "$table" ]; then continue; fi
    
    # Remover espaços em branco
    table=$(echo "$table" | tr -d '[:space:]')
    
    echo "Processando tabela: $table"
    echo "TRUNCATE TABLE public.\"$table\" CASCADE;" >> $SQL_FILE
    
    # Exportar dados da tabela para o arquivo SQL
    echo "\\copy (SELECT * FROM public.\"$table\") TO '$TEMP_DIR/${table}.csv' WITH CSV" | psql -d $LOCAL_DB_NAME
    
    # Contar linhas no arquivo CSV
    if [ -f "$TEMP_DIR/${table}.csv" ]; then
        line_count=$(wc -l < "$TEMP_DIR/${table}.csv")
        if [ "$line_count" -gt 0 ]; then
            echo "-- Inserindo $line_count registros na tabela $table" >> $SQL_FILE
            echo "\\copy public.\"$table\" FROM '$TEMP_DIR/${table}.csv' WITH CSV;" >> $SQL_FILE
        else
            echo "-- Tabela $table está vazia" >> $SQL_FILE
        fi
    fi
done < "$TEMP_DIR/tables.txt"

echo "SET session_replication_role = 'origin';" >> $SQL_FILE
echo "COMMIT;" >> $SQL_FILE

# Limpar o banco de dados de produção e inserir os dados
echo "Aplicando script de dados ao banco de produção..."
PGPASSWORD=$PROD_DB_PASSWORD psql \
  -h $PROD_DB_HOST \
  -U $PROD_DB_USER \
  -d $PROD_DB_NAME \
  -f "$SQL_FILE"

# Limpar banco de dados local temporário
echo "Limpando recursos temporários..."
dropdb $LOCAL_DB_NAME
echo "Script de inserção de dados: $SQL_FILE"

echo "===================================================="
echo "Processo concluído!"
echo "===================================================="

# Criar backup
echo "Criando backup..."
PGPASSWORD=$PROD_DB_PASSWORD pg_dump \
  -h $PROD_DB_HOST \
  -U $PROD_DB_USER \
  -d $PROD_DB_NAME \
  -Fc \
  --schema=public \
  --no-owner \
  > "$BACKUP_FILE"

# Verificar backup imediatamente
echo "Verificando conteúdo do backup..."
pg_restore -l "$BACKUP_FILE" | grep -i "TABLE DATA.*public"

# Criar banco temporário para teste
createdb backup_test
pg_restore -d backup_test "$BACKUP_FILE"

# Verificar se há dados nas tabelas
echo "Verificando dados das tabelas restauradas:"
psql -d backup_test -c "\
  SELECT table_name, \
  (SELECT count(*) FROM \"\""'||table_name||'"\"\"') AS count \
  FROM information_schema.tables \
  WHERE table_schema = 'public' \
  AND table_type = 'BASE TABLE';"

# Limpar
dropdb backup_test

echo "Verificação completa. O backup está em: $BACKUP_FILE" 