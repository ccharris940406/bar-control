/**
 * Devuelve la fecha actual en formato YYYY-MM-DD
 * usando la zona horaria de México (America/Mexico_City).
 * Funciona correctamente tanto en desarrollo como en Vercel (UTC).
 */
export function getTodayMexico(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
  }).format(new Date());
}
