export interface TouchPoint {
  x: number; // Нормализованная координата X (0.0 - 1.0) для адаптивности
  y: number; // Нормализованная координата Y (0.0 - 1.0)
  t: number; // Временная метка (ms) от начала записи
}

export interface EchoRecord {
  id: string;
  duration: number; // Общая длительность слепка
  points: TouchPoint[];
}
