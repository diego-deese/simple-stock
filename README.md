# SimpleStock Offline

Una aplicación móvil de gestión de inventario 100% offline diseñada para trabajadores con baja alfabetización digital. La app funciona como una "lista de mandado" donde se registran las cantidades de alimentos que llegan mensualmente a un centro de conservación.

## 🎯 Características Principales

- **100% Offline**: No requiere conexión a internet
- **Interface Accesible**: Botones grandes, fuentes >18px, alta legibilidad
- **Base de Datos Local**: Persistencia con SQLite usando expo-sqlite
- **Exportación CSV**: Los reportes se pueden exportar y compartir
- **Persistencia de Datos**: Si se cierra la app durante el conteo, los datos se recuperan automáticamente

## 🛠 Stack Tecnológico

- **React Native** con **Expo** (Managed Workflow)
- **TypeScript** para tipado estático
- **expo-sqlite** para base de datos local
- **React Navigation** para navegación entre pantallas
- **React Context API** para gestión de estado
- **expo-file-system** y **expo-sharing** para exportación

## 📊 Modelo de Datos

### Tablas SQLite

| Tabla | Campos |
|-------|---------|
| `products` | id (PK), name (TEXT), unit (TEXT), active (BOOLEAN) |
| `reports` | id (PK), date (DATETIME, default NOW) |
| `report_details` | id (PK), report_id (FK), product_name (TEXT), quantity (REAL) |
| `temp_counts` | product_name (PK), quantity (REAL) |

## 📱 Pantallas

### 1. Registro Mensual (Principal)
- Lista vertical de productos activos
- Controles de cantidad con botones grandes [ - ] y [ + ]
- Botón inferior "GUARDAR REPORTE" con modal de confirmación

### 2. Gestión de Catálogo (Admin)
- CRUD completo de productos
- Campos: Nombre del producto y unidad de medida
- Borrado lógico para mantener integridad de reportes históricos

### 3. Historial de Reportes
- Lista de fechas de reportes guardados
- Vista de detalles al tocar un reporte
- Botón de exportación CSV

## 🚀 Instalación y Desarrollo

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Expo CLI

### Configuración inicial

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npx expo start

# Para Android
npx expo start --android

# Para iOS (requiere macOS)
npx expo start --ios

# Para web
npx expo start --web
```

### Generación de APK para distribución

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Inicializar EAS (primera vez)
eas login
eas build:configure

# Generar APK de desarrollo
eas build -p android --profile preview

# Generar APK de producción
eas build -p android --profile production
```

## 🗂 Estructura del Proyecto

```
src/
├── components/         # Componentes reutilizables
├── context/           # Context API para gestión de estado
├── database/          # Lógica de base de datos SQLite
├── navigation/        # Configuración de React Navigation
├── screens/           # Pantallas principales
├── types/            # Tipos TypeScript
├── utils/            # Utilidades helper
└── constants/        # Constantes de la aplicación
```

## 🔧 Configuración Personalizada

### Base de Datos
El archivo `src/database/index.ts` contiene toda la lógica de SQLite. La base de datos se inicializa automáticamente con productos de ejemplo.

### Productos Iniciales
Los productos se cargan automáticamente la primera vez que se ejecuta la app:
- Arroz (kg)
- Frijoles (kg) 
- Aceite (litros)
- Azúcar (kg)
- Sal (kg)
- Harina (bultos)
- Pasta (kg)
- Leche en polvo (kg)

### Persistencia de Conteos
Los conteos temporales se guardan automáticamente en la tabla `temp_counts` para que si el usuario cierra la app durante el proceso de conteo, pueda continuar donde lo dejó.

## 📤 Exportación de Datos

Los reportes se exportan en formato CSV con la siguiente estructura:

```csv
Reporte de Inventario
Fecha: 25/02/2026

Producto,Cantidad,Unidad
Arroz,50,kg
Frijoles,30,kg
Aceite,20,litros
```

## 📦 Respaldo automático vía Google Apps Script

La aplicación ahora puede generar una copia de seguridad del archivo de base de datos SQLite (`.db`) y enviarla a un *Webhook* construido con Google Apps Script. El script guardará los metadatos en una hoja de cálculo y el archivo `.db` en una carpeta de Drive centralizada.

### Configuración del Webhook
1. Cree un nuevo proyecto de Apps Script (https://script.google.com).
2. Pegue el siguiente código en el editor y guarde:

```javascript
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);

    // append rows to spreadsheet
    const ssId = 'TU_SPREADSHEET_ID';
    const sheetName = 'Sincronizaciones';
    const ss = SpreadsheetApp.openById(ssId);
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) sheet = ss.insertSheet(sheetName);
    
    // prepare headers once; check first cell value instead of row count
    const first = sheet.getRange(1,1).getValue();
    if (first !== 'fecha') {
      sheet.insertRowBefore(1);
      sheet.getRange(1,1,1,7).setValues([['fecha','deviceId','filename','reportId','tipo','relatedReport','cantidadDetalles']]);
    }

    // append metadata row only if this is a backup (filename exists)
    if (payload.metadata.filename) {
      sheet.appendRow([
        payload.metadata.date,
        payload.metadata.deviceId,
        payload.metadata.filename,
        '', '', '', ''
      ]);
    }

    // if payload contains multiple rows (sync operation), append them too
    if (payload.rows && Array.isArray(payload.rows)) {
      payload.rows.forEach(r => {
        sheet.appendRow([
          payload.metadata.date,
          payload.metadata.deviceId,
          '',
          r.id,
          r.type,
          r.related_report_id || '',
          r.quantity || ''
        ]);
      });
    }

    // if we received a full-report CSV, write it to a separate sheet
    if (payload.full_report_csv) {
      let cons = ss.getSheetByName('Consolidado');
      if (!cons) cons = ss.insertSheet('Consolidado');
      // clear previous contents and rewrite whole CSV; use parseCsv to split columns
      cons.clear();
      const lines = payload.full_report_csv.split('\n');
      lines.forEach(line => {
        if (line.trim() === '') return;
        const parsed = Utilities.parseCsv(line)[0] || [];
        cons.appendRow(parsed);
      });
    }

    // save database file if present (filename should include .db)
    if (payload.file_b64) {
      const folderId = 'TU_FOLDER_ID';
      const folder = DriveApp.getFolderById(folderId);
      const blob = Utilities.newBlob(Utilities.base64Decode(payload.file_b64), 'application/octet-stream', payload.metadata.filename);
      folder.createFile(blob);
    }

    // success response
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
                         .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log('doPost error: ' + err);
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Despliegue el proyecto como "Aplicación web".
4. Anote la URL del Web App; ese será el endpoint donde la app enviará los backups.

### Variables de entorno
Añada las siguientes variables a un archivo `.env` o a `expo.extra`:

```env
BACKUP_ENDPOINT=https://script.google.com/macros/s/ABC123/exec
# Opcionalmente, si usa la sincronización automática:
SYNC_ENDPOINT=https://script.google.com/macros/s/DEF456/exec
```

> 👀 Asegúrese de que el Web App tenga los permisos adecuados (cualquiera, incluso anónimo, o proteja con algún token propio).

### Uso
- La copia se envía automáticamente cuando la app detecta conexión de red.
- El botón “Exportar copia” en el **Panel de Admin** también dispara el envío.

> ⚠️ **Seguridad**: la URL del Webhook puede ser sensible. Guardarla fuera del control de versiones y, si desea, añada un token privado en el payload.


## 🎨 Guía de Accesibilidad

La aplicación sigue las mejores prácticas de accesibilidad:

- **Botones grandes**: Mínimo 56dp de altura
- **Fuentes grandes**: >18px para toda la interfaz
- **Alto contraste**: Colores que cumplen WCAG AA
- **Navegación simple**: Máximo 3 pantallas principales
- **Iconos universales**: Emojis para facilitar comprensión

## 🔒 Consideraciones de Seguridad

- No se recopilan datos personales
- Toda la información se almacena localmente
- No hay conexiones a servidores externos
- Los datos están disponibles solo en el dispositivo

## 🐛 Solución de Problemas

### La app no inicia
```bash
# Limpiar cache
npx expo start --clear

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Problemas con SQLite
```bash
# Verificar que expo-sqlite está instalado correctamente
npx expo install expo-sqlite
```

### Problemas de exportación
```bash
# Verificar permisos en app.json
# Las dependencias expo-file-system y expo-sharing deben estar instaladas
```

## 📄 Licencia

Este proyecto está diseñado específicamente para centros de conservación de alimentos y organizaciones sin fines de lucro.

## 🤝 Contribución

Para mejorar la aplicación o reportar problemas:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Si necesitas ayuda con la implementación o tienes sugerencias de mejora, por favor abre un issue en el repositorio del proyecto.