Especificación de Proyecto: SimpleStock Offline

Objetivo: Crear una aplicación móvil de gestión de inventario 100% offline para trabajadores con baja alfabetización digital. La app funciona como una "lista de mandado" donde se registran las cantidades de alimentos que llegan mensualmente a un centro de conservación.
🛠 1. Stack Tecnológico

    Framework: React Native con Expo (Managed Workflow).

    Base de Datos: expo-sqlite (Persistencia local estricta).

    Gestión de Estado: React Context API o Hooks (Simplicidad sobre Redux).

    Diseño: UI de alta accesibilidad (Botones grandes, fuentes > 18px).

📊 2. Modelo de Datos (SQLite)

Generar un script de inicialización con las siguientes tablas:
Tabla	Campos
products	id (PK), name (TEXT), unit (TEXT), active (BOOLEAN)
reports	id (PK), date (DATETIME, default NOW)
report_details	id (PK), report_id (FK), product_name (TEXT), quantity (REAL)
📱 3. Requerimientos de Pantallas (UI/UX)
Pantalla A: Registro Mensual (Principal)

    Vista: Lista vertical de productos activos.

    Control: Cada fila debe tener el nombre del producto en negrita y un control de cantidad con botones gigantes de [ - ] y [ + ].

    Acción: Botón inferior fijo "GUARDAR REPORTE" que dispare un modal de confirmación simple.

Pantalla B: Gestión de Catálogo (Admin)

    Funciones: CRUD simple de productos.

    Campos: Nombre del producto y unidad de medida (kg, bulto, etc.).

    Borrado: Implementar "borrado lógico" (campo active = 0) para no corromper reportes históricos.

Pantalla C: Historial de Reportes

    Vista: Lista de fechas de reportes guardados.

    Detalle: Al tocar un reporte, mostrar qué cantidades se registraron ese día.

    Exportación: Botón para generar un string CSV de los datos y guardarlo en la carpeta de documentos del dispositivo (acceso local).

🧠 4. Lógica Crítica

    Persistencia Inmediata: Si el usuario cierra la app a mitad del conteo, los valores actuales deben recuperarse (usar un campo temporal en la DB o AsyncStorage).

    Cero Internet: No incluir ninguna librería que requiera conectividad (Firebase, Auth0, etc.).

    Offline First: La app debe ser funcional desde el primer segundo sin procesos de login.

    Instalación: Configurar eas.json para generar un APK directo.

🤖 5. Instrucción para el Generador

    "Genera el código inicial priorizando un archivo database.js que maneje todas las consultas de SQLite con async/await (usando la API moderna de expo-sqlite) y una pantalla principal que utilice un FlatList para el conteo de productos con botones de incremento/decremento de gran tamaño."