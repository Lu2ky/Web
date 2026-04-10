#!/bin/bash

# pull-and-build-loop.sh

INTERVALO=60  # segundos entre cada revisión

echo "🚀 Iniciando watcher (cada ${INTERVALO}s)..."

while true; do
  echo ""
  echo "🕐 [$(date '+%H:%M:%S')] Verificando cambios..."

  BEFORE=$(git rev-parse HEAD)
  git pull

  if [ $? -ne 0 ]; then
    echo "❌ Error en git pull. Reintentando en ${INTERVALO}s..."
    sleep $INTERVALO
    continue
  fi

  AFTER=$(git rev-parse HEAD)

  if [ "$BEFORE" = "$AFTER" ]; then
    echo "ℹ️  Sin cambios nuevos."
  else
    echo "✅ Cambios detectados. Ejecutando install y build..."

    npm install
    if [ $? -ne 0 ]; then
      echo "❌ Error en npm install."
      sleep $INTERVALO
      continue
    fi

    npm run build
    if [ $? -ne 0 ]; then
      echo "❌ Error en npm run build."
      sleep $INTERVALO
      continue
    fi

    echo "🎉 Build completado exitosamente."
  fi

  sleep $INTERVALO
done
