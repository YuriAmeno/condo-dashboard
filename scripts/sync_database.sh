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

# Criar backup de segurança da produção primeiro
echo "Criando backup de segurança da produção..."
PGPASSWORD=$PROD_DB_PASSWORD pg_dump \
  -h $PROD_DB_HOST \
  -U $PROD_DB_USER \
  -d $PROD_DB_NAME \
  --data-only \
  --format=custom \
  -f "$BACKUP_DIR/prod_backup_$DATE.dump"

# Exportar dados do ambiente de desenvolvimento
echo "Exportando dados do ambiente de desenvolvimento..."
PGPASSWORD=$DEV_DB_PASSWORD pg_dump \
  -h $DEV_DB_HOST \
  -U $DEV_DB_USER \
  -d $DEV_DB_NAME \
  --data-only \
  --format=custom \
  -f "$BACKUP_DIR/dev_export_$DATE.dump"

# Adicione isso antes da sincronização
echo "ATENÇÃO: Isso irá sobrescrever os dados em produção!"
read -p "Tem certeza que deseja continuar? (s/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]
then
    echo "Operação cancelada"
    exit 1
fi

# Importar dados para produção
echo "Importando dados para produção..."
PGPASSWORD=$PROD_DB_PASSWORD pg_restore \
  -h $PROD_DB_HOST \
  -U $PROD_DB_USER \
  -d $PROD_DB_NAME \
  --clean \
  --if-exists \
  "$BACKUP_DIR/dev_export_$DATE.dump"

echo "Sincronização concluída!" 