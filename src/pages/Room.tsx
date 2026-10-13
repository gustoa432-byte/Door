import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, SignalHigh, SignalLow, SignalMedium, Sparkles, Copy, Check, Users } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { EchoService } from '../services/EchoService';
import { TouchPoint, EchoRecord } from '../types';
import { _0xF } from '../core/Formula';
import { useResonator } from '../hooks/useResonator';

interface TouchData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  timestamp: number;
  isTouching: boolean;
  color?: string;
}

interface NetworkTouchData {
  roomId: string;
  x: number;
  y: number;
  isTouching: boolean;
  color?: string;
}

export default function Room() {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const isAI = roomId === '0n3';

  // UI State
  const [connectionQuality, setConnectionQuality] = useState<'high' | 'medium' | 'low' | 'poor'>('high');
  const [isPartnerConnected, setIsPartnerConnected] = useState<boolean>(isAI);
  const [copiedLink, setCopiedLink] = useState(false);

  const [isLiteMode, setIsLiteModeState] = useState(false);
  const isLiteModeRef = useRef(false);
  const audioIntensityRef = useRef(0);
  const isDrawingRef = useRef(false);
  const setIsLiteMode = (val: boolean) => {
    setIsLiteModeState(val);
    isLiteModeRef.current = val;
  };

  const [localLiteTouch, setLocalLiteTouchState] = useState(false);
  const localLiteTouchRef = useRef(false);
  const setLocalLiteTouch = (val: boolean) => {
    setLocalLiteTouchState(val);
    localLiteTouchRef.current = val;
  };

  const [partnerLiteTouch, setPartnerLiteTouchState] = useState(false);
  const partnerLiteTouchRef = useRef(false);
  const setPartnerLiteTouch = (val: boolean) => {
    setPartnerLiteTouchState(val);
    partnerLiteTouchRef.current = val;
  };

  // Alchemical State
  const [, setEntropy] = useState(1);
  const [, setIsResonating] = useState(false);

  // Colors
  const localAuraColor = '255, 150, 50'; // Warm Ember Gold
  const partnerAuraColor = isAI ? '0, 255, 133' : '100, 200, 255'; // Neon Green / Ocean Blue

  // Engine Refs
  const socketRef = useRef<Socket | null>(null);
  const localPosRef = useRef<TouchData | null>(null);
  const partnerPosRef = useRef<TouchData | null>(null);
  const partnerTargetRef = useRef<{ x: number; y: number; isTouching: boolean; color?: string } | null>(null);
  const partnerVisualRef = useRef<{ x: number; y: number; isTouching: boolean; color?: string } | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const hasPreTickedRef = useRef<boolean>(false);
  const lastVibeRef = useRef<number>(0);
  const lastEmitRef = useRef<number>(0);
  const animationRef = useRef<number>(0);

  // Canvas & Particles
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<any[]>([]);
  const visualBeatTimerRef = useRef<number>(0);

  // AI & Echo State (0n<3)
  const aiStateRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2, vx: 0, vy: 0 });
  const aiPlaybackRef = useRef({
    activeEcho: null as EchoRecord | null,
    startTime: 0,
    opacity: 0,
    state: 'idle' as 'idle' | 'playing' | 'fading',
  });
  const aiBehaviorRef = useRef({
    state: 'wandering' as 'wandering' | 'evading' | 'caught' | 'fleeing' | 'boredom_routine' | 'watching',
    tension: 0,
    userSpeedHistory: [] as number[],
    sessionStartTime: performance.now(),
    profilePhase: 'profiling' as 'profiling' | 'adapted',
    patienceScore: 0.5,
    touchDurations: [] as number[],
    currentTouchStart: 0,
    wasTouching: false,
    lastBoredomSequenceTime: 0,
    boredomStep: 0,
    boredomTimer: 0,
  });

  // Ping History
  const pingHistoryRef = useRef<number[]>([]);

  // Telemetry Recording
  const recordingRef = useRef<{ points: TouchPoint[]; startTime: number }>({ points: [], startTime: 0 });
  const lastRecordTimeRef = useRef<number>(0);

  // Resonator Audio Engine
  const { initAudio, updateResonance, cleanup: cleanupResonator } = useResonator();

  const loadNextEcho = useCallback(() => {
    const echo = EchoService.getRandomEcho();
    aiPlaybackRef.current = {
      activeEcho: echo,
      startTime: performance.now(),
      opacity: 0,
      state: 'playing',
    };
    if (echo.points.length > 0) {
      aiStateRef.current.x = echo.points[0].x * window.innerWidth;
      aiStateRef.current.y = echo.points[0].y * window.innerHeight;
    }
  }, []);

  // Initialize Socket or AI
  useEffect(() => {
    if (!isAI) {
      socketRef.current = io();
      socketRef.current.emit('join-room', roomId);

      socketRef.current.on('partner-connected', () => {
        setIsPartnerConnected(true);
      });

      socketRef.current.on('partner-disconnected', () => {
        setIsPartnerConnected(false);
        partnerTargetRef.current = null;
        partnerVisualRef.current = null;
        partnerPosRef.current = null;
      });

      socketRef.current.on('partner-touch', (data: NetworkTouchData) => {
        setIsPartnerConnected(true);
        partnerTargetRef.current = {
          x: data.x * window.innerWidth,
          y: data.y * window.innerHeight,
          isTouching: data.isTouching,
          color: data.color || partnerAuraColor,
        };
        if (!localPosRef.current?.isTouching && navigator.vibrate && data.isTouching) {
          navigator.vibrate(5);
        }
      });

      socketRef.current.on('partner-end', () => {
        if (partnerTargetRef.current) {
          partnerTargetRef.current.isTouching = false;
        }
      });

      socketRef.current.on('partner-lite-touch-start', () => {
        setIsPartnerConnected(true);
        setPartnerLiteTouch(true);
      });

      socketRef.current.on('partner-lite-touch-end', () => {
        setPartnerLiteTouch(false);
      });
    } else {
      setIsPartnerConnected(true);
      loadNextEcho();
    }

    return () => {
      socketRef.current?.disconnect();
      cancelAnimationFrame(animationRef.current);
      cleanupResonator();
    };
  }, [roomId, isAI, loadNextEcho, cleanupResonator]);

  // Ping Measurement & Automatic Lite-Mode
  useEffect(() => {
    if (isAI || !socketRef.current) return;

    const interval = setInterval(() => {
      const start = performance.now();
      socketRef.current?.emit('ping', () => {
        const latency = performance.now() - start;
        pingHistoryRef.current.push(latency);
        if (pingHistoryRef.current.length > 3) {
          pingHistoryRef.current.shift();
        }

        if (pingHistoryRef.current.length === 3) {
          const avgPing = pingHistoryRef.current.reduce((a, b) => a + b, 0) / 3;
          if (avgPing > 150) {
            setConnectionQuality('poor');
            setIsLiteMode(true);
          } else {
            setConnectionQuality('high');
            setIsLiteMode(false);
          }
        }
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isAI]);

  // Canvas Resize
  useEffect(() => {
    const resizeCanvas = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Main Alchemical Engine Loop
  const engineLoop = useCallback(() => {
    const now = performance.now();
    const dt = Math.max(1, now - lastTimeRef.current) / 1000;
    lastTimeRef.current = now;

    // 1. Dopamine Profiling for 0n<3
    const behavior = aiBehaviorRef.current;
    const isUserTouching = localPosRef.current?.isTouching || false;

    if (isUserTouching && !behavior.wasTouching) {
      behavior.currentTouchStart = now;
    } else if (!isUserTouching && behavior.wasTouching) {
      const duration = now - behavior.currentTouchStart;
      if (duration > 100) behavior.touchDurations.push(duration);
    }
    behavior.wasTouching = isUserTouching;

    if (behavior.profilePhase === 'profiling' && now - behavior.sessionStartTime > 15000) {
      behavior.profilePhase = 'adapted';
      if (behavior.touchDurations.length > 0) {
        const avgDuration = behavior.touchDurations.reduce((a, b) => a + b, 0) / behavior.touchDurations.length;
        behavior.patienceScore = Math.max(0, Math.min(1, (avgDuration - 500) / 4000));
      } else {
        behavior.patienceScore = 0.2;
      }
    }

    const patience = behavior.patienceScore;
    const evadeRadius = behavior.profilePhase === 'profiling' ? 120 : 60 + patience * 150;
    const evadeSpeedMult = behavior.profilePhase === 'profiling' ? 0.3 : 0.1 + patience * 0.4;
    const boredomThreshold = behavior.profilePhase === 'profiling' ? 2.5 : 1.5 + patience * 3.0;
    const decelerationSensitivity = behavior.profilePhase === 'profiling' ? 100 : 120 - patience * 40;

    // 2. AI Echo Playback Logic (0n<3)
    if (isAI) {
      const playback = aiPlaybackRef.current;
      const ai = aiStateRef.current;

      if (playback.state === 'playing' && playback.activeEcho) {
        const elapsed = now - playback.startTime;
        playback.opacity = Math.min(1, playback.opacity + dt * 2);

        if (elapsed > playback.activeEcho.duration) {
          playback.state = 'fading';
        } else {
          const points = playback.activeEcho.points;
          let targetPoint = points[0];

          if (elapsed > points[points.length - 1].t) {
            targetPoint = points[points.length - 1];
          } else {
            for (let i = 0; i < points.length - 1; i++) {
              if (elapsed >= points[i].t && elapsed <= points[i + 1].t) {
                const p1 = points[i];
                const p2 = points[i + 1];
                const progress = (elapsed - p1.t) / (p2.t - p1.t);
                targetPoint = {
                  x: p1.x + (p2.x - p1.x) * progress,
                  y: p1.y + (p2.y - p1.y) * progress,
                  t: elapsed,
                };
                break;
              }
            }
          }

          const targetX = targetPoint.x * window.innerWidth;
          const targetY = targetPoint.y * window.innerHeight;

          let forceX = (targetX - ai.x) * 0.05;
          let forceY = (targetY - ai.y) * 0.05;

          if (localPosRef.current && localPosRef.current.isTouching) {
            const user = localPosRef.current;
            const dx = ai.x - user.x;
            const dy = ai.y - user.y;
            const dist = Math.hypot(dx, dy);
            const userSpeed = Math.hypot(user.vx, user.vy);

            behavior.userSpeedHistory.push(userSpeed);
            if (behavior.userSpeedHistory.length > 10) behavior.userSpeedHistory.shift();
            const avgUserSpeed = behavior.userSpeedHistory.reduce((a, b) => a + b, 0) / behavior.userSpeedHistory.length;

            if (behavior.state === 'boredom_routine') {
              behavior.boredomTimer += dt;
              const t = behavior.boredomTimer;

              if (userSpeed > 20) {
                behavior.state = 'evading';
                behavior.tension = 0;
              } else {
                if (behavior.boredomStep === 0) {
                  const bumpCycle = Math.sin(t * Math.PI * 4);
                  forceX += dx * bumpCycle * 0.5;
                  forceY += dy * bumpCycle * 0.5;
                  if (t > 1.5) { behavior.boredomStep = 1; behavior.boredomTimer = 0; }
                } else if (behavior.boredomStep === 1) {
                  forceX -= dx * 0.1;
                  forceY -= dy * 0.1;
                  if (t > 1.5) { behavior.boredomStep = 2; behavior.boredomTimer = 0; }
                } else if (behavior.boredomStep === 2) {
                  const pingCycle = Math.sin(t * Math.PI * 8);
                  forceX += dx * pingCycle * 0.8;
                  forceY += dy * pingCycle * 0.8;
                  if (t > 1.0) { behavior.boredomStep = 3; behavior.boredomTimer = 0; }
                } else if (behavior.boredomStep === 3) {
                  const angle = t * Math.PI * 2;
                  const targetPosX = user.x + Math.cos(angle) * 40;
                  const targetPosY = user.y + Math.sin(angle) * 40;
                  forceX += (targetPosX - ai.x) * 0.2;
                  forceY += (targetPosY - ai.y) * 0.2;
                  if (t > 2.0) { behavior.boredomStep = 4; behavior.boredomTimer = 0; }
                } else if (behavior.boredomStep === 4) {
                  ai.vx *= 0.5;
                  ai.vy *= 0.5;
                  const targetPosX = user.x + (dx / (dist || 1)) * 80;
                  const targetPosY = user.y + (dy / (dist || 1)) * 80;
                  forceX += (targetPosX - ai.x) * 0.05;
                  forceY += (targetPosY - ai.y) * 0.05;
                }
              }
            } else if (behavior.state === 'watching') {
              if (userSpeed > 20) {
                behavior.state = 'evading';
                behavior.tension = 0;
              } else {
                ai.vx *= 0.5;
                ai.vy *= 0.5;
                const targetPosX = user.x + (dx / (dist || 1)) * 80;
                const targetPosY = user.y + (dy / (dist || 1)) * 80;
                forceX += (targetPosX - ai.x) * 0.05;
                forceY += (targetPosY - ai.y) * 0.05;
              }
            } else if (dist < 60) {
              behavior.state = 'caught';
              behavior.tension += dt;

              const isSlowingDown = behavior.tension > 1.5 && userSpeed < 15 && avgUserSpeed > decelerationSensitivity;
              const isBored = userSpeed < 5 && behavior.tension > boredomThreshold;

              if (isBored) {
                if (now - behavior.lastBoredomSequenceTime > 60000) {
                  behavior.state = 'boredom_routine';
                  behavior.boredomStep = 0;
                  behavior.boredomTimer = 0;
                  behavior.lastBoredomSequenceTime = now;
                } else {
                  behavior.state = 'watching';
                }
              } else if (isSlowingDown) {
                behavior.state = 'fleeing';
                behavior.tension = 0;
                playback.state = 'fading';

                const escapeAngle = Math.atan2(dy, dx) + (Math.random() - 0.5);
                ai.vx = Math.cos(escapeAngle) * 200;
                ai.vy = Math.sin(escapeAngle) * 200;

                if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
              } else {
                const pullStrength = 0.5;
                forceX -= dx * pullStrength;
                forceY -= dy * pullStrength;
                forceX += Math.sin(now * 0.01) * 4;
                forceY += Math.cos(now * 0.012) * 4;
              }
            } else if (dist < evadeRadius && behavior.state !== 'fleeing') {
              behavior.state = 'evading';
              behavior.tension = Math.max(0, behavior.tension - dt);

              const evadeStrength = Math.min(avgUserSpeed * evadeSpeedMult, 12);
              const dirX = dx / dist;
              const dirY = dy / dist;
              const dodgeX = -dirY;
              const dodgeY = dirX;
              const dodgeStrength = Math.sin(now * 0.005) * 6;

              forceX += dirX * evadeStrength + dodgeX * dodgeStrength;
              forceY += dirY * evadeStrength + dodgeY * dodgeStrength;
              forceX *= 0.2;
              forceY *= 0.2;
            } else {
              behavior.state = 'wandering';
              behavior.tension = Math.max(0, behavior.tension - dt);
            }
          }

          ai.vx += forceX;
          ai.vy += forceY;
          ai.vx *= 0.8;
          ai.vy *= 0.8;
        }
      } else if (playback.state === 'fading') {
        const fadeSpeed = aiBehaviorRef.current.state === 'fleeing' ? 3.0 : 1.5;
        playback.opacity = Math.max(0, playback.opacity - dt * fadeSpeed);
        ai.vx *= 0.92;
        ai.vy *= 0.92;
        if (playback.opacity <= 0) {
          playback.state = 'idle';
          aiBehaviorRef.current.state = 'wandering';
          setTimeout(loadNextEcho, Math.random() * 1000 + 500);
        }
      }

      ai.x += ai.vx;
      ai.y += ai.vy;

      if (playback.opacity > 0) {
        partnerPosRef.current = { x: ai.x, y: ai.y, vx: ai.vx, vy: ai.vy, timestamp: now, isTouching: true };
      } else {
        partnerPosRef.current = null;
      }
    }

    // 3. P2P Lerp Logic
    if (!isAI && !isLiteModeRef.current && partnerTargetRef.current) {
      if (!partnerVisualRef.current) {
        partnerVisualRef.current = { ...partnerTargetRef.current };
      } else {
        partnerVisualRef.current.x += (partnerTargetRef.current.x - partnerVisualRef.current.x) * 0.3;
        partnerVisualRef.current.y += (partnerTargetRef.current.y - partnerVisualRef.current.y) * 0.3;
        partnerVisualRef.current.isTouching = partnerTargetRef.current.isTouching;
      }
      partnerPosRef.current = {
        x: partnerVisualRef.current.x,
        y: partnerVisualRef.current.y,
        vx: 0,
        vy: 0,
        timestamp: now,
        isTouching: partnerVisualRef.current.isTouching,
        color: partnerAuraColor,
      };
    }

    let currentEntropy = 1;
    let intentI = 0;
    let isCurrentlyResonating = false;
    let adrenaline = 0;
    let isBeat = false;

    const isMainModeActive =
      !isLiteModeRef.current &&
      localPosRef.current &&
      partnerPosRef.current &&
      localPosRef.current.isTouching &&
      partnerPosRef.current.isTouching !== false;
    const isLiteModeActive = isLiteModeRef.current && localLiteTouchRef.current && partnerLiteTouchRef.current;

    if (isMainModeActive || isLiteModeActive) {
      const res = _0xF(
        isLiteModeActive ? 0 : localPosRef.current!.x / window.innerWidth,
        isLiteModeActive ? 0 : localPosRef.current!.y / window.innerHeight,
        isLiteModeActive ? 0 : partnerPosRef.current!.x / window.innerWidth,
        isLiteModeActive ? 0 : partnerPosRef.current!.y / window.innerHeight,
        now,
        dt
      );
      currentEntropy = res._e;
      intentI = res._i;
      isCurrentlyResonating = res._ir;
      adrenaline = res._a;
      isBeat = res._ib;

      audioIntensityRef.current = adrenaline;
      isDrawingRef.current = true;

      if (isMainModeActive && intentI > 0.3 && currentEntropy < 0.6 && !hasPreTickedRef.current) {
        hasPreTickedRef.current = true;
      } else if (currentEntropy >= 0.6) {
        hasPreTickedRef.current = false;
      }

      if (isBeat) {
        visualBeatTimerRef.current = now;
      }

      let speed = 0;
      let distanceNorm = 1;

      if (isMainModeActive && localPosRef.current && partnerPosRef.current) {
        speed = Math.hypot(localPosRef.current.vx, localPosRef.current.vy);
        const distance = Math.hypot(
          localPosRef.current.x - partnerPosRef.current.x,
          localPosRef.current.y - partnerPosRef.current.y
        );
        distanceNorm = Math.min(Math.max(distance / 500, 0), 1);
      } else if (isLiteModeActive) {
        speed = 0;
        distanceNorm = 0;
      }

      updateResonance(distanceNorm, speed / 1000, true);
    } else {
      isDrawingRef.current = false;
      audioIntensityRef.current = 0;
      _0xF(0, 0, 10, 10, now, dt);
      updateResonance(1, 0, false);
    }

    setEntropy(currentEntropy);
    setIsResonating(isCurrentlyResonating);

    // 4. Sand Particle Canvas Rendering
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.globalCompositeOperation = 'screen';

        const emitParticles = (x: number, y: number, color: string, amount: number, speedMult: number = 1) => {
          if (particlesRef.current.length > 500) return;
          const actualAmount = Math.min(amount, 500 - particlesRef.current.length);

          for (let i = 0; i < actualAmount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 * speedMult;
            particlesRef.current.push({
              x,
              y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 1,
              maxLife: Math.random() * 0.8 + 0.2,
              color,
              size: Math.random() * 2 + 0.5,
            });
          }
        };

        const isVisualBeat = now - visualBeatTimerRef.current < 50;

        // Emit from touches (Main Mode)
        if (!isLiteModeRef.current) {
          if (localPosRef.current?.isTouching) {
            emitParticles(localPosRef.current.x, localPosRef.current.y, localAuraColor, 2);
          }
          if (partnerPosRef.current?.isTouching !== false && partnerPosRef.current) {
            emitParticles(partnerPosRef.current.x, partnerPosRef.current.y, partnerAuraColor, 2);
          }
        }

        // Emit from center (Lite Mode)
        if (isLiteModeRef.current) {
          const cx = window.innerWidth / 2;
          const cy = window.innerHeight / 2;
          if (localLiteTouchRef.current) {
            emitParticles(cx + (Math.random() - 0.5) * 40, cy + (Math.random() - 0.5) * 40, localAuraColor, 2);
          }
          if (partnerLiteTouchRef.current) {
            emitParticles(cx + (Math.random() - 0.5) * 40, cy + (Math.random() - 0.5) * 40, partnerAuraColor, 2);
          }
        }

        // Heartbeat burst on resonance beat
        if (isBeat) {
          const cx = isLiteModeRef.current
            ? window.innerWidth / 2
            : (localPosRef.current!.x + partnerPosRef.current!.x) / 2;
          const cy = isLiteModeRef.current
            ? window.innerHeight / 2
            : (localPosRef.current!.y + partnerPosRef.current!.y) / 2;
          emitParticles(cx, cy, '255, 255, 255', 45 + adrenaline * 90, 2 + adrenaline * 3);
        }

        if (isVisualBeat) {
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = `rgba(255, 255, 255, ${0.05 + adrenaline * 0.1})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.globalCompositeOperation = 'screen';
        }

        // Update & Render Particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= dt;

          p.vx += Math.sin(p.y * 0.05 + now * 0.001) * 0.1 * currentEntropy;
          p.vy += Math.cos(p.x * 0.05 + now * 0.001) * 0.1 * currentEntropy;

          if (isCurrentlyResonating || (isLiteModeRef.current && localLiteTouchRef.current && partnerLiteTouchRef.current)) {
            const cx = isLiteModeRef.current
              ? window.innerWidth / 2
              : (localPosRef.current!.x + partnerPosRef.current!.x) / 2;
            const cy = isLiteModeRef.current
              ? window.innerHeight / 2
              : (localPosRef.current!.y + partnerPosRef.current!.y) / 2;
            const dx = cx - p.x;
            const dy = cy - p.y;
            const dist = Math.hypot(dx, dy);

            p.vx += (dx / (dist || 1)) * 0.5 * (1 + adrenaline);
            p.vy += (dy / (dist || 1)) * 0.5 * (1 + adrenaline);

            if (Math.random() < adrenaline * 0.1) {
              p.color = '255, 255, 255';
            }
          }

          p.vx *= 0.95;
          p.vy *= 0.95;

          if (p.life <= 0) {
            particlesRef.current.splice(i, 1);
            continue;
          }

          const alpha = p.life / p.maxLife;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${p.color}, ${alpha})`;
          ctx.lineWidth = p.size;
          ctx.lineCap = 'round';
          ctx.moveTo(p.x - p.vx * 2, p.y - p.vy * 2);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
      }
    }

    // 5. Network Emit & Telemetry Recording
    if (localPosRef.current && !isLiteModeRef.current) {
      const compression = Math.max(0, Math.min(34, intentI * 50));
      const emitInterval = Math.max(16, 50 - compression);

      if (!isAI && now - lastEmitRef.current > emitInterval && localPosRef.current.isTouching) {
        socketRef.current?.emit('touch-update', {
          roomId,
          x: localPosRef.current.x / window.innerWidth,
          y: localPosRef.current.y / window.innerHeight,
          isTouching: true,
          color: localAuraColor,
        });
        lastEmitRef.current = now;
      }

      if (!isAI && now - lastRecordTimeRef.current > 50) {
        recordingRef.current.points.push({
          x: localPosRef.current.x / window.innerWidth,
          y: localPosRef.current.y / window.innerHeight,
          t: now - recordingRef.current.startTime,
        });
        lastRecordTimeRef.current = now;
      }

      const speed = Math.hypot(localPosRef.current.vx, localPosRef.current.vy);
      if (speed > 20 && now - lastVibeRef.current > 100 && !isCurrentlyResonating) {
        lastVibeRef.current = now;
      }
    }

    animationRef.current = requestAnimationFrame(engineLoop);
  }, [roomId, isAI, localAuraColor, partnerAuraColor, loadNextEcho, updateResonance]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(engineLoop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [engineLoop]);

  // Touch Handlers
  const updateTouchPos = (e: React.TouchEvent | React.MouseEvent, isStart: boolean, isTouching: boolean) => {
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const now = performance.now();
    let vx = 0;
    let vy = 0;

    if (!isStart && localPosRef.current) {
      const dt = Math.max(1, now - localPosRef.current.timestamp);
      vx = ((clientX - localPosRef.current.x) / dt) * 1000;
      vy = ((clientY - localPosRef.current.y) / dt) * 1000;
    }

    localPosRef.current = { x: clientX, y: clientY, vx, vy, timestamp: now, isTouching, color: localAuraColor };
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (isLiteModeRef.current) return;
    initAudio();
    if (navigator.vibrate) navigator.vibrate(15);

    if (!isAI) {
      recordingRef.current = { points: [], startTime: performance.now() };
      lastRecordTimeRef.current = performance.now();
    }

    updateTouchPos(e, true, true);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (isLiteModeRef.current) return;
    if (!localPosRef.current?.isTouching) return;
    updateTouchPos(e, false, true);
  };

  const handleTouchEnd = () => {
    if (isLiteModeRef.current) return;

    if (!isAI && recordingRef.current.points.length > 0) {
      const duration = performance.now() - recordingRef.current.startTime;
      if (duration >= 5000) {
        EchoService.saveEcho(recordingRef.current.points, duration);
      }
    }

    if (localPosRef.current) {
      localPosRef.current.isTouching = false;
    }
    if (!isAI) {
      socketRef.current?.emit('touch-end', roomId);
    }
  };

  const handleLiteTouchStart = () => {
    initAudio();
    if (navigator.vibrate) navigator.vibrate(15);
    setLocalLiteTouch(true);
    socketRef.current?.emit('lite-touch-start', roomId);
  };

  const handleLiteTouchEnd = () => {
    setLocalLiteTouch(false);
    socketRef.current?.emit('lite-touch-end', roomId);
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getConnectionIcon = () => {
    if (isAI) return <Sparkles size={18} className="text-[var(--color-online)]" />;
    switch (connectionQuality) {
      case 'high': return <SignalHigh size={18} className="text-[var(--color-online)]" />;
      case 'medium': return <SignalMedium size={18} className="text-yellow-400" />;
      case 'low': return <SignalLow size={18} className="text-red-500 animate-pulse" />;
      case 'poor': return <SignalLow size={18} className="text-red-600 animate-pulse" />;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black overflow-hidden touch-none select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      {/* Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />

      {/* Top Header Bar */}
      <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 text-white/80 hover:text-white transition-colors">
            <ChevronLeft size={28} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-base font-medium text-white">
              {isAI ? '0n<3' : `Комната ${roomId}`}
            </span>
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isPartnerConnected
                  ? 'bg-[var(--color-online)] shadow-[0_0_8px_var(--color-online)] animate-pulse'
                  : 'bg-yellow-400/80 shadow-[0_0_8px_rgba(250,204,21,0.5)] animate-ping'
              }`}
            />
          </div>
        </div>

        {/* Center: Partner Status / Infinite Room Time */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {!isAI && (
            <div className="bg-white/5 border border-white/10 rounded-full px-3 py-1 flex items-center gap-2">
              <span className="text-xs text-white/70">
                {isPartnerConnected ? 'Партнёр в сети' : 'Ожидание партнёра'}
              </span>
              {!isPartnerConnected && (
                <button
                  onClick={handleCopyLink}
                  className="text-white/60 hover:text-white transition-colors p-0.5"
                  title="Скопировать ссылку"
                >
                  {copiedLink ? <Check size={14} className="text-[var(--color-online)]" /> : <Copy size={14} />}
                </button>
              )}
            </div>
          )}
          <span className="text-lg font-bold font-mono tracking-widest text-white/40">∞</span>
        </div>

        <div className="flex items-center pointer-events-auto gap-2">
          {getConnectionIcon()}
        </div>
      </header>

      {/* Waiting for Partner Banner if H2H and alone */}
      {!isAI && !isPartnerConnected && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-3 z-30 pointer-events-auto shadow-2xl">
          <Users size={18} className="text-white/60 shrink-0" />
          <div className="text-left">
            <p className="text-xs text-white font-medium">Отправь ссылку второму человеку</p>
            <p className="text-[10px] text-white/50 font-mono">ID: {roomId}</p>
          </div>
          <button
            onClick={handleCopyLink}
            className="ml-2 px-3 py-1.5 bg-white/15 hover:bg-white/25 active:scale-95 text-xs text-white font-medium rounded-xl transition-all flex items-center gap-1.5"
          >
            {copiedLink ? <Check size={14} className="text-[var(--color-online)]" /> : <Copy size={14} />}
            <span>{copiedLink ? 'Скопировано' : 'Копировать'}</span>
          </button>
        </div>
      )}

      {/* Weak Connection Notice */}
      <AnimatePresence>
        {!isAI && connectionQuality === 'poor' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 text-center z-30 pointer-events-none shadow-2xl max-w-[85vw]"
          >
            <p className="font-medium text-white text-xs">Связь нестабильна</p>
            <p className="text-[11px] text-white/60 mt-0.5">Включен Lite-режим тактильного контакта.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lite Mode Center Portal */}
      {isLiteMode && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="relative w-64 h-64 pointer-events-auto rounded-full flex items-center justify-center touch-none"
            onPointerDown={handleLiteTouchStart}
            onPointerUp={handleLiteTouchEnd}
            onPointerLeave={handleLiteTouchEnd}
            onPointerCancel={handleLiteTouchEnd}
          >
            <div className="absolute inset-0 rounded-full bg-white/5 blur-2xl transition-all duration-1000" />
            <div
              className={`absolute inset-0 rounded-full bg-[var(--color-accent)] blur-3xl transition-all duration-500 ${
                localLiteTouch ? 'opacity-40 scale-110' : 'opacity-0 scale-90'
              }`}
            />
            <div
              className={`absolute inset-0 rounded-full bg-white blur-3xl transition-all duration-500 ${
                partnerLiteTouch ? 'opacity-30 scale-125' : 'opacity-0 scale-90'
              }`}
            />
            <div
              className={`w-32 h-32 rounded-full border border-white/10 backdrop-blur-sm transition-all duration-300 flex items-center justify-center shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]
                ${
                  localLiteTouch && partnerLiteTouch
                    ? 'scale-90 bg-white/20 shadow-[0_0_50px_rgba(255,255,255,0.5)]'
                    : localLiteTouch
                    ? 'scale-95 bg-white/10'
                    : partnerLiteTouch
                    ? 'scale-105 bg-white/10'
                    : 'scale-100 bg-transparent'
                }`}
            >
              <div
                className={`w-16 h-16 rounded-full transition-all duration-500 
                ${
                  localLiteTouch && partnerLiteTouch
                    ? 'bg-white shadow-[0_0_30px_rgba(255,255,255,1)] scale-150'
                    : localLiteTouch
                    ? 'bg-[var(--color-accent)] opacity-80'
                    : partnerLiteTouch
                    ? 'bg-white opacity-80'
                    : 'bg-white/20'
                }`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
