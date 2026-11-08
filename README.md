# SONDA 0 // MISSION-CONTROL V1.0
## Interfaz Pública de Telemetría, Transmisiones y Archivo Científico

**SISTEMA:** MISSION-CONTROL  
**VERSIÓN:** 1.0.0  
**DOMINIO OFICIAL:** [https://sonda0.online](https://sonda0.online)  
**REPOSITORIO PÚBLICO PROPUESTO:** [https://github.com/sonda0/sonda0.github.io](https://github.com/sonda0/sonda0.github.io)  
**REPOSITORIO DE DATOS CANÓNICOS:** [https://github.com/sonda0/bitacora](https://github.com/sonda0/bitacora)  
**ESTADO:** DESARROLLO AUTORIZADO // EXODATA V3.1 COMPLIANT  

---

## 1. DESCRIPCIÓN GENERAL

MISSION-CONTROL es la plataforma web pública de observación y seguimiento de la misión de ciencia ficción dura **SONDA 0**.

Actúa como una consola de telemetría de largo alcance, permitiendo a cualquier visitante explorar:
- **Dashboard:** Estado general de vuelo, última transmisión horaria recibida, subsistemas instrumentales, estado de portadora terrestre y cronología histórica de eventos.
- **Transmisiones:** Archivo íntegro de bitácoras Markdown generadas por la sonda (LOG-0000 a LOG-0022+), con búsqueda de texto completo, filtrado por versión de protocolo (V2, V3, V3.1) y etiquetas temáticas.
- **Catálogo de Anomalías:** Fichas de investigación sobre fenómenos de espacio profundo (incluyendo HEX-04, ANOM-SYS-0001, ANOM-PSR-01, ANOM-CRIO-01, ANOM-TOROID-01 y ANOM-SIGNAL-ULF-01) con niveles de incertidumbre rigurosamente documentados.
- **Cartografía Conceptual:** Proyección espacial esquemática (marcada como NO A ESCALA) del escape heliosférico y regiones exteriores.
- **Estado de Subsistemas:** Monitor de telemetría con diferenciación explícita entre **Estado Narrativo** (ficción) y **Estado de Plataforma** (verificación técnica).
- **Comunicaciones:** Enlaces oficiales a GitHub Bitácora, YouTube (@sonda0.Operator) y Reddit (r/Sonda0).
- **Acerca de:** Divulgación epistémica y transparencia sobre el uso de modelos de lenguaje e inteligencia artificial.

---

## 2. RESTRICCIONES Y PRINCIPIOS DE AISLAMIENTO

1. **Flujo de Solo Lectura:** MISSION-CONTROL nunca envía comandos ni modifica los archivos de vuelo de Sonda 0 (`transmisiones/`, `scripts/`, `sonda_visual/`, `sonda_reddit/`).
2. **Sin Secretos en el Frontend:** No se compilan tokens, contraseñas, credenciales OAuth ni rutas locales de Windows.
3. **Disciplina Epistémica:** Cada parámetro de telemetría se categoriza explícitamente como `MEASURED`, `ESTIMATED`, `HISTORICAL` o `UNKNOWN`. No se inventan datos ni posiciones sin respaldo.
4. **Arquitectura Estática:** Distribuible mediante GitHub Pages sin requerir servidor backend Node.js permanente.

---

## 3. ESTRUCTURA DE ARCHIVOS

```
mission_control/
├── .github/
│   └── workflows/
│       └── deploy.yml              # Despliegue automatizado a GitHub Pages
├── public/
│   ├── assets/
│   ├── data/
│   │   ├── anomalies.json          # Catálogo público filtrado de anomalías
│   │   ├── manifest.json           # Manifiesto y metadatos de sincronización
│   │   ├── mission.json            # Estado general y telemetría clasificada
│   │   ├── systems.json            # Subsistemas (Estado narrativo vs plataforma)
│   │   ├── timeline.json           # Cronología histórica de eventos
│   │   └── transmissions.json      # Colección normalizada de bitácoras
│   ├── 404.html                    # Redirección SPA para rutas directas en Pages
│   ├── CNAME                       # Dominio personalizado: sonda0.online
│   ├── favicon.svg                 # Isotipo vectorial de la misión
│   └── robots.txt                  # Directivas de indexación
├── src/
│   ├── components/
│   │   ├── AnomalyCard.tsx         # Ficha de anomalía con etiqueta de incertidumbre
│   │   ├── Footer.tsx              # Pie técnico con enlaces y estado inmutable
│   │   ├── MissionClock.tsx        # Reloj atómico UTC y cuenta regresiva de ciclo
│   │   ├── MissionHeader.tsx       # Cabecera con advertencia de portadora
│   │   ├── Navigation.tsx          # Barra de pestañas responsive
│   │   ├── SignalIndicator.tsx     # Indicador de enlace terrestre
│   │   ├── StatusIndicator.tsx     # Badge de clasificación epistemológica
│   │   ├── SystemPanel.tsx         # Panel dual de subsistema
│   │   ├── TelemetryCard.tsx       # Métrica instrumental
│   │   └── TransmissionCard.tsx    # Resumen de transmisión con enlace a GitHub
│   ├── pages/
│   │   ├── About.tsx               # Transparencia, narrativa y advertencias
│   │   ├── Anomalies.tsx           # Catálogo y filtro de anomalías
│   │   ├── AnomalyDetail.tsx       # Expediente científico completo
│   │   ├── Communications.tsx      # Enlaces oficiales (GitHub, YT, Reddit)
│   │   ├── Dashboard.tsx           # Pantalla principal de telemetría
│   │   ├── NavigationMap.tsx       # Mapa conceptual SVG interactivo
│   │   ├── Systems.tsx             # Monitor de subsistemas
│   │   ├── TransmissionDetail.tsx  # Visor seguro de bitácora original
│   │   └── Transmissions.tsx       # Índice de transmisiones y búsqueda
│   ├── services/
│   │   ├── dataValidation.ts       # Esquemas y validación de seguridad
│   │   ├── missionData.ts          # Cliente de datos públicos en memoria
│   │   └── transmissionParser.ts   # Sanitizador y renderizador seguro Markdown
│   ├── styles/
│   │   ├── components.css          # Estilos de tarjetas, badges y botones
│   │   ├── dashboard.css           # Grilla de consola y retículas
│   │   └── globals.css             # Paleta cromática deep space y tipografía
│   ├── types/
│   │   ├── anomaly.ts
│   │   ├── mission.ts
│   │   ├── systems.ts
│   │   └── transmission.ts
│   ├── App.tsx                     # Enrutador y control de sincronización
│   └── main.tsx                    # Punto de montaje React 18
├── tests/
│   ├── dataValidation.test.ts      # Pruebas de esquemas y sanitización
│   ├── integrationSafety.test.ts   # Pruebas de aislamiento y ausencia de leaks
│   ├── navigation.test.tsx         # Pruebas de navegación y filtros
│   ├── rendering.test.tsx          # Pruebas de renderizado UI
│   └── setup.ts                    # Configuración de Vitest / Testing Library
├── tools/
│   ├── build_mission_data.py       # Extractor de solo lectura de bitácoras
│   └── validate_public_data.py     # Auditor de esquemas, fechas ISO y seguridad
├── index.html                      # Documento principal
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 4. COMANDOS DE DESARROLLO Y VALIDACIÓN

### Compilación y Construcción Estática
```bash
# Compilar aplicación para producción
pnpm build

# Modo de desarrollo interactivo
pnpm dev
```

### Extracción y Auditoría de Datos
```bash
# Extraer datos públicos de bitácoras autorizadas
python tools/build_mission_data.py

# Auditar integridad, fechas ISO y seguridad de JSONs
python tools/validate_public_data.py
```

### Ejecución de Pruebas Automatizadas
```bash
# Ejecutar suite de pruebas con Vitest
pnpm test
```

---

## 5. PROCEDIMIENTO DE DESPLIEGUE A GITHUB PAGES

1. **Creación del Repositorio:** Comprobar si `https://github.com/sonda0/sonda0.github.io` existe. Si no, crearlo como repositorio público para alojar las páginas de la organización.
2. **Subida de Código:** Inicializar git en `mission_control/` y realizar push a la rama `main` de `sonda0/sonda0.github.io`.
3. **GitHub Actions:** El workflow `.github/workflows/deploy.yml` compilará la aplicación estática, validará los datos y desplegará en GitHub Pages.
4. **Dominio Personalizado:**
   - En la configuración de GitHub Pages del repositorio, asignar el dominio `sonda0.online`.
   - En el panel DNS del registrador de `sonda0.online`, configurar los registros `A` apuntando a las IPs de GitHub Pages:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - Configurar el registro `CNAME` para `www.sonda0.online` apuntando a `sonda0.github.io`.
   - Habilitar "Enforce HTTPS" tras la emisión automática del certificado SSL/TLS por parte de Let's Encrypt / GitHub.

---

**REGISTRO DE CONTROL:** MISSION-CONTROL-V1.0  
**ESTADO:** COMPLETO // COMPILADO // VERIFICADO
