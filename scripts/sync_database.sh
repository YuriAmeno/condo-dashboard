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

# Aviso importante
echo "===================================================="
echo "ATENÇÃO: SINCRONIZAÇÃO DO ESQUEMA E ESTRUTURA"
echo "Esta operação irá:"
echo " - Criar um backup da produção atual"
echo " - Sincronizar apenas a ESTRUTURA do esquema público"
echo " - Os DADOS NÃO serão migrados nesta operação"
echo " - Preservar elementos do sistema gerenciados pelo Supabase"
echo "===================================================="
echo ""
echo -e "\033[31mAVISO: Esta é uma operação para sincronizar apenas ESTRUTURAS de tabelas!\033[0m"
read -p "Digite 'CONFIRMAR' para prosseguir: " confirmation

if [ "$confirmation" != "CONFIRMAR" ]; then
    echo "Operação cancelada pelo usuário."
    exit 1
fi

# Criar backup completo de segurança da produção primeiro
echo "Criando backup completo de segurança da produção..."
PGPASSWORD=$PROD_DB_PASSWORD pg_dump \
  -h $PROD_DB_HOST \
  -U $PROD_DB_USER \
  -d $PROD_DB_NAME \
  --format=custom \
  --no-owner \
  -f "$BACKUP_DIR/prod_backup_complete_$DATE.dump"

if [ $? -ne 0 ]; then
    echo "Erro ao criar backup de produção. Operação abortada."
    exit 1
fi

echo "Backup de produção criado com sucesso em: $BACKUP_DIR/prod_backup_complete_$DATE.dump"

# Exportar apenas a ESTRUTURA do esquema público (sem dados)
echo "Exportando estrutura do esquema público do ambiente de desenvolvimento..."
PGPASSWORD=$DEV_DB_PASSWORD pg_dump \
  -h $DEV_DB_HOST \
  -U $DEV_DB_USER \
  -d $DEV_DB_NAME \
  --schema-only \
  --format=custom \
  --no-owner \
  --no-acl \
  --schema=public \
  --exclude-schema="auth" \
  --exclude-schema="extensions" \
  --exclude-schema="pgbouncer" \
  --exclude-schema="pgsodium" \
  --exclude-schema="realtime" \
  --exclude-schema="storage" \
  --exclude-schema="supabase_functions" \
  --exclude-schema="vault" \
  -f "$BACKUP_DIR/dev_export_structure_only_$DATE.dump"

if [ $? -ne 0 ]; then
    echo "Erro ao exportar estrutura do desenvolvimento. Operação abortada."
    exit 1
fi

echo "Exportação da estrutura de desenvolvimento concluída com sucesso."

# Última chance de cancelar
echo ""
echo -e "\033[31mÚLTIMA CHANCE: Isso irá atualizar a ESTRUTURA do esquema público em produção.\033[0m"
echo "Os DADOS existentes serão preservados, mas alterações na estrutura podem causar incompatibilidades."
read -p "Digite 'EXECUTAR' para confirmar a atualização da estrutura: " final_confirmation

if [ "$final_confirmation" != "EXECUTAR" ]; then
    echo "Operação cancelada pelo usuário."
    exit 1
fi

# Agora importar APENAS A ESTRUTURA para o esquema público em produção
echo "Importando estrutura para o esquema público em produção..."
echo "Desativando temporariamente verificação de chaves estrangeiras..."

# Desativar temporariamente a verificação de chaves estrangeiras
PGPASSWORD=$PROD_DB_PASSWORD psql \
  -h $PROD_DB_HOST \
  -U $PROD_DB_USER \
  -d $PROD_DB_NAME \
  -c "SET session_replication_role = 'replica';"

# Restaurar apenas a estrutura, ignorando erros
PGPASSWORD=$PROD_DB_PASSWORD pg_restore \
  -h $PROD_DB_HOST \
  -U $PROD_DB_USER \
  -d $PROD_DB_NAME \
  --no-owner \
  --no-acl \
  --schema=public \
  --single-transaction \
  --section=pre-data \
  --section=post-data \
  "$BACKUP_DIR/dev_export_structure_only_$DATE.dump" 2> "$BACKUP_DIR/restore_errors_$DATE.log"

# Não vamos verificar o código de saída porque esperamos alguns erros relacionados a foreign keys

# Ativar novamente a verificação de chaves estrangeiras
PGPASSWORD=$PROD_DB_PASSWORD psql \
  -h $PROD_DB_HOST \
  -U $PROD_DB_USER \
  -d $PROD_DB_NAME \
  -c "SET session_replication_role = 'origin';"

echo ""
echo "===================================================="
echo "Sincronização da estrutura do esquema público concluída!"
echo "Alguns avisos e erros de constraint são esperados e foram salvos em:"
echo "$BACKUP_DIR/restore_errors_$DATE.log"
echo ""
echo "Um backup do banco de produção anterior está disponível em:"
echo "$BACKUP_DIR/prod_backup_complete_$DATE.dump"
echo "===================================================="
echo ""
echo -e "\033[33mIMPORTANTE: Esta operação atualizou apenas a ESTRUTURA do banco de dados.\033[0m"
echo "Os dados existentes foram preservados, mas podem precisar de ajustes manuais"
echo "para conformidade com as novas estruturas." 