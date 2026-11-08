#!/bin/bash
# cd backend
#chmod +x run-tests.sh
#./run-tests.sh

# --- Configuración ---
BASE_URL="http://localhost:3000/api"

echo "Iniciando pruebas automatizadas de la API..."

# --- 1. Obtener Tokens (y guardarlos en variables) ---
echo -e "\n1. Autenticando..."

# Extraer token de Administrador
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@piedraazul.com","password":"Admin123*"}')
ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Token de Admin obtenido."

# Extraer token de Paciente
PACIENTE_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"paciente@piedraazul.com","password":"Paciente123*"}')
PACIENTE_TOKEN=$(echo "$PACIENTE_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Token de Paciente obtenido."

# --- 2. Probar Rutas Públicas ---
echo -e "\n2. Probando rutas públicas..."
curl -s "$BASE_URL/health" | head -c 50
echo -e "\n"
curl -s "$BASE_URL/medicos" | head -c 50
echo -e "\n"

# --- 3. Probar Códigos de Seguridad (401 y 403) ---
echo -e "\n3. Verificando seguridad..."

echo "   -> Sin token (debe dar 401):"
curl -s -o /dev/null -w "   Código de estado: %{http_code}\n" "$BASE_URL/pacientes"

echo "   -> Token de Paciente en ruta Admin (debe dar 403):"
curl -s -o /dev/null -w "   Código de estado: %{http_code}\n" \
  "$BASE_URL/pacientes" -H "Authorization: Bearer $PACIENTE_TOKEN"

# --- 4. Probar Rutas Privadas con tokens válidos ---
echo -e "\n4. Probando rutas privadas exitosas..."
echo "   -> Listar pacientes (Admin):"
curl -s -o /dev/null -w "   Código de estado: %{http_code}\n" \
  "$BASE_URL/pacientes" -H "Authorization: Bearer $ADMIN_TOKEN"

echo "   -> Ver mis citas (Paciente):"
curl -s -o /dev/null -w "   Código de estado: %{http_code}\n" \
  "$BASE_URL/citas/mis-citas" -H "Authorization: Bearer $PACIENTE_TOKEN"

echo -e "\nPruebas finalizadas."
