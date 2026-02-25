/**
 * Paleta de colores de Zoofari
 * Basada en https://www.zoofari.com.mx/
 */

export const colors = {
  // Colores primarios
  primary: '#F47C1F',        // Naranja principal
  primaryLight: '#F5AB56',   // Naranja claro
  primaryDark: '#D96A10',    // Naranja oscuro
  
  // Colores secundarios
  secondary: '#462402',      // Marrón oscuro
  secondaryLight: '#5A3A1A', // Marrón medio
  secondaryDark: '#201204',  // Marrón muy oscuro
  
  // Fondos
  background: '#FFF9F5',     // Fondo cálido claro
  backgroundDark: '#F5F0EB', // Fondo alternativo
  white: '#FFFFFF',
  
  // Textos
  textPrimary: '#201204',    // Texto principal (marrón oscuro)
  textSecondary: '#5A3A1A',  // Texto secundario
  textLight: '#FFFFFF',      // Texto sobre fondos oscuros
  textMuted: '#8B7355',      // Texto apagado
  
  // Estados
  success: '#4CAF50',        // Verde éxito
  error: '#E53935',          // Rojo error
  warning: '#F47C1F',        // Naranja advertencia (igual que primary)
  info: '#2196F3',           // Azul información
  
  // Bordes y separadores
  border: '#E8DDD4',
  borderLight: '#F0E8E0',
  
  // Gradiente principal (para botones destacados)
  gradientStart: '#F5AB56',
  gradientEnd: '#F47C1F',
};

// Gradiente como string para usar en estilos
export const primaryGradient = {
  colors: [colors.gradientStart, colors.gradientEnd],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
};
