import { EchoRecord, TouchPoint } from '../types';

const STORAGE_KEY = 'door_echoes';

// Fallback echo: a gentle, human-like swipe across the screen
const FALLBACK_ECHO: EchoRecord = {
  id: 'fallback-1',
  duration: 8000,
  points: Array.from({ length: 80 }).map((_, i) => {
    const progress = i / 80;
    return {
      x: 0.2 + progress * 0.6 + Math.sin(progress * Math.PI * 2) * 0.1,
      y: 0.8 - progress * 0.6 + Math.cos(progress * Math.PI * 2) * 0.1,
      t: i * 100
    };
  })
};

export class EchoService {
  static saveEcho(points: TouchPoint[], duration: number) {
    try {
      const echoes = this.getAllEchoes();
      const newEcho: EchoRecord = {
        id: `echo_${Date.now()}`,
        duration,
        points
      };
      echoes.push(newEcho);
      
      // Keep only last 20 echoes to avoid local storage quota issues
      if (echoes.length > 20) echoes.shift();
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(echoes));
      console.log('Echo saved successfully. Total echoes:', echoes.length);
    } catch (e) {
      console.error('Failed to save echo', e);
    }
  }

  static getAllEchoes(): EchoRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static getRandomEcho(): EchoRecord {
    const echoes = this.getAllEchoes();
    if (echoes.length === 0) return FALLBACK_ECHO;
    const randomIndex = Math.floor(Math.random() * echoes.length);
    return echoes[randomIndex];
  }
}
