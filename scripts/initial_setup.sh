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

# Data atual para nome do backup
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"

# Criar diretório de backup se não existir
mkdir -p $BACKUP_DIR

echo "Iniciando cópia completa do banco de produção para desenvolvimento..."

# Exportar estrutura E dados do banco de produção
echo "Exportando estrutura e dados do banco de produção..."
PGPASSWORD=$PROD_DB_PASSWORD pg_dump \
  -h $PROD_DB_HOST \
  -U $PROD_DB_USER \
  -d $PROD_DB_NAME \
  --format=custom \
  -f "$BACKUP_DIR/full_prod_backup_$DATE.dump"

# Restaurar tudo para o banco de desenvolvimento
echo "Restaurando estrutura e dados para o banco de desenvolvimento..."
PGPASSWORD=$DEV_DB_PASSWORD pg_restore \
  -h $DEV_DB_HOST \
  -U $DEV_DB_USER \
  -d $DEV_DB_NAME \
  --clean \
  --if-exists \
  "$BACKUP_DIR/full_prod_backup_$DATE.dump"

echo "Configuração inicial concluída!" 