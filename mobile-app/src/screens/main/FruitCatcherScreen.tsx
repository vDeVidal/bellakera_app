import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing,
  PanResponder, Dimensions, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const BASKET_W = 90;
const BASKET_Y = SCREEN_H - 130;   // posición fija de la canasta
const ITEM_SIZE = 48;
const GAME_DURATION = 30;
const SPAWN_MS = 650;

const FRUTAS   = ['🍓', '🍉', '🍌', '🍇', '🍒', '🥝', '🍑', '🍍', '🫐', '🍋', '🍎'];
const MALOS    = ['🪨', '💣', '🗑️', '⚡'];   // items que restan puntos
const PUNTOS_BUENO = 10;
const PUNTOS_MALO  = -15;

interface Item {
  id: number;
  emoji: string;
  esMalo: boolean;
  x: number;
  speed: number;
  yRef: Animated.Value;
  atrapado: boolean;
}

let nextId = 0;

// ═══════════════════════════════════════════════════════════════════════════════
export default function FruitCatcherScreen() {
  const navigation = useNavigation<any>();

  const [fase, setFase] = useState<'inicio' | 'jugando' | 'fin'>('inicio');
  const [score, setScore] = useState(0);
  const [perdidas, setPerdidas] = useState(0);
  const [tiempoRestante, setTiempoRestante] = useState(GAME_DURATION);

  // Items visibles en pantalla (solo para re-render)
  const [items, setItems] = useState<Item[]>([]);
  const itemsRef = useRef<Item[]>([]);

  // Posición X de la canasta
  const basketX = useRef(SCREEN_W / 2 - BASKET_W / 2);
  const basketAnim = useRef(new Animated.Value(basketX.current)).current;

  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnerRef= useRef<ReturnType<typeof setInterval> | null>(null);
  const collRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const scoreRef  = useRef(0);   // copia mutable del score para leer en interval

  const startX = useRef(basketX.current);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder : () => true,
      onPanResponderGrant: () => {
        startX.current = basketX.current;
      },
      onPanResponderMove: (_, gs) => {
        const nx = Math.max(0, Math.min(SCREEN_W - BASKET_W, startX.current + gs.dx));
        basketX.current = nx;
        basketAnim.setValue(nx);
      },
      onPanResponderRelease: (_, gs) => {
        basketX.current = Math.max(0, Math.min(SCREEN_W - BASKET_W, startX.current + gs.dx));
      },
    }),
  ).current;

  // ── Limpiar al desmontar ───────────────────────────────────────────────────
  useEffect(() => () => pararTodo(), []);

  const pararTodo = () => {
    if (timerRef.current)   { clearInterval(timerRef.current);   timerRef.current   = null; }
    if (spawnerRef.current) { clearInterval(spawnerRef.current); spawnerRef.current = null; }
    if (collRef.current)    { clearInterval(collRef.current);    collRef.current    = null; }
    itemsRef.current.forEach((i) => i.yRef.stopAnimation());
  };

  // ── Spawn ──────────────────────────────────────────────────────────────────
  const spawnItem = useCallback(() => {
    const id       = nextId++;
    const esMalo   = Math.random() < 0.25;          // 25% de chance de ser malo
    const pool     = esMalo ? MALOS : FRUTAS;
    const emoji    = pool[Math.floor(Math.random() * pool.length)];
    const x        = Math.random() * (SCREEN_W - ITEM_SIZE);
    const speed    = 2800 + Math.random() * 2200;
    const yRef     = new Animated.Value(-ITEM_SIZE);
    const item: Item = { id, emoji, esMalo, x, speed, yRef, atrapado: false };

    itemsRef.current = [...itemsRef.current, item];
    setItems([...itemsRef.current]);

    Animated.timing(yRef, {
      toValue: SCREEN_H + ITEM_SIZE,
      duration: speed,
      useNativeDriver: false,   // ← CRÍTICO: false para leer _value desde JS en colisiones
    }).start(({ finished }) => {
      if (!finished) return;
      // Si llegó al suelo sin ser atrapado (y era fruta)
      const f = itemsRef.current.find((i) => i.id === id);
      if (f && !f.atrapado && !f.esMalo) {
        setPerdidas((p) => p + 1);
      }
      itemsRef.current = itemsRef.current.filter((i) => i.id !== id);
      setItems([...itemsRef.current]);
    });
  }, []);

  // ── Detección de colisión (por intervalo) ─────────────────────────────────
  const checkColisiones = useCallback(() => {
    const bx = basketX.current;
    const bxRight = bx + BASKET_W;
    const byTop   = BASKET_Y - 20;   // tolerancia vertical

    itemsRef.current.forEach((item) => {
      if (item.atrapado) return;

      // Leer la posición Y actual de la animación
      const yVal: number = (item.yRef as any)._value ?? 0;

      // ¿La fruta está dentro del rango vertical de la canasta?
      if (yVal < byTop || yVal > BASKET_Y + 40) return;

      // ¿Está horizontalmente dentro de la canasta?
      const itemCenter = item.x + ITEM_SIZE / 2;
      if (itemCenter < bx || itemCenter > bxRight) return;

      // ¡Colisión! Atrapar
      item.atrapado = true;
      item.yRef.stopAnimation();

      const delta = item.esMalo ? PUNTOS_MALO : PUNTOS_BUENO;
      scoreRef.current = Math.max(0, scoreRef.current + delta);
      setScore(scoreRef.current);

      // Eliminar del array
      itemsRef.current = itemsRef.current.filter((i) => i.id !== item.id);
      setItems([...itemsRef.current]);
    });
  }, []);

  // ── Iniciar ────────────────────────────────────────────────────────────────
  const iniciarJuego = () => {
    pararTodo();
    scoreRef.current = 0;
    setScore(0);
    setPerdidas(0);
    setTiempoRestante(GAME_DURATION);
    itemsRef.current = [];
    setItems([]);
    nextId = 0;
    basketX.current = SCREEN_W / 2 - BASKET_W / 2;
    basketAnim.setValue(basketX.current);
    setFase('jugando');

    // Countdown
    timerRef.current = setInterval(() => {
      setTiempoRestante((t) => {
        if (t <= 1) { terminarJuego(); return 0; }
        return t - 1;
      });
    }, 1000);

    // Spawn
    spawnItem();
    spawnerRef.current = setInterval(spawnItem, SPAWN_MS);

    // Colisiones cada 50ms (~20fps check)
    collRef.current = setInterval(checkColisiones, 50);
  };

  const terminarJuego = () => {
    pararTodo();
    setFase('fin');
  };

  // ── PANTALLA INICIO ────────────────────────────────────────────────────────
  if (fase === 'inicio') {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.inicioBox}>
          <Text style={styles.inicioEmoji}>🍓</Text>
          <Text style={styles.inicioTitle}>FRUIT CATCHER</Text>
          <Text style={styles.inicioSub}>
            Mueve la canasta para atrapar las frutas que caen.{'\n'}¡Tienes {GAME_DURATION} segundos!
          </Text>
          <View style={styles.instrucciones}>
            <Text style={styles.instrText}>🍓🍉🍌 Fruta  = <Text style={{ color: '#22c55e', fontWeight: 'bold' }}>+{PUNTOS_BUENO} pts</Text></Text>
            <Text style={styles.instrText}>🪨💣🗑️ Objeto malo = <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>{PUNTOS_MALO} pts</Text></Text>
            <Text style={styles.instrText}>🧺 Arrastra la canasta hacia los lados</Text>
          </View>
          <TouchableOpacity style={styles.btnIniciar} onPress={iniciarJuego}>
            <Ionicons name="play" size={22} color="#fff" />
            <Text style={styles.btnIniciarText}>¡JUGAR AHORA!</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── PANTALLA FIN ───────────────────────────────────────────────────────────
  if (fase === 'fin') {
    const nivel =
      score >= 200 ? '🏆 LEYENDA'
      : score >= 130 ? '🥇 EXPERTO'
      : score >= 70  ? '🥈 BUENO'
      : '🥉 NOVATO';
    return (
      <View style={styles.container}>
        <View style={styles.finBox}>
          <Text style={styles.finEmoji}>{score >= 130 ? '🏆' : '🎮'}</Text>
          <Text style={styles.finTitle}>¡Tiempo!</Text>
          <Text style={styles.finNivel}>{nivel}</Text>
          <View style={styles.finStats}>
            <View style={styles.finStat}>
              <Text style={styles.finStatNum}>{score}</Text>
              <Text style={styles.finStatLabel}>Puntos</Text>
            </View>
            <View style={styles.finDivider} />
            <View style={styles.finStat}>
              <Text style={[styles.finStatNum, { color: '#f59e0b' }]}>{Math.floor(score / PUNTOS_BUENO)}</Text>
              <Text style={styles.finStatLabel}>Frutas</Text>
            </View>
            <View style={styles.finDivider} />
            <View style={styles.finStat}>
              <Text style={[styles.finStatNum, { color: '#ef4444' }]}>{perdidas}</Text>
              <Text style={styles.finStatLabel}>Perdidas</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.btnReintentar} onPress={iniciarJuego}>
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.btnReintentarText}>Jugar de nuevo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnVolver} onPress={() => navigation.goBack()}>
            <Ionicons name="home-outline" size={16} color="#888" />
            <Text style={styles.btnVolverText}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── PANTALLA JUGANDO ───────────────────────────────────────────────────────
  return (
    <View style={styles.gameContainer} {...panResponder.panHandlers}>
      {/* HUD */}
      <View style={styles.hud}>
        <View style={styles.hudItem}>
          <Text style={styles.hudLabel}>PUNTOS</Text>
          <Text style={styles.hudValue}>{score}</Text>
        </View>
        <View style={[styles.timerBox, tiempoRestante <= 5 && styles.timerBoxUrgente]}>
          <Text style={[styles.timerText, tiempoRestante <= 5 && { color: '#ef4444' }]}>
            {tiempoRestante}s
          </Text>
        </View>
        <View style={styles.hudItem}>
          <Text style={styles.hudLabel}>PERDIDAS</Text>
          <Text style={[styles.hudValue, { color: '#f59e0b' }]}>{perdidas}</Text>
        </View>
      </View>

      {/* Items cayendo */}
      {items.map((item) => (
        <Animated.Text
          key={item.id}
          style={[
            styles.itemEmoji,
            {
              left: item.x,
              transform: [{ translateY: item.yRef }],
            },
          ]}
          pointerEvents="none"   // sin touch — la colisión es automática
        >
          {item.emoji}
        </Animated.Text>
      ))}

      {/* Canasta */}
      <Animated.View style={[styles.canasta, { transform: [{ translateX: basketAnim }] }]}>
        <Text style={styles.canastaEmoji}>🧺</Text>
      </Animated.View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  backBtn: { position: 'absolute', top: 50, left: 20, padding: 8 },

  inicioBox: { alignItems: 'center', padding: 30, width: '90%' },
  inicioEmoji: { fontSize: 80, marginBottom: 16 },
  inicioTitle: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 2, marginBottom: 12 },
  inicioSub: { color: '#888', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  instrucciones: { gap: 8, marginBottom: 30, width: '100%', backgroundColor: '#111', borderRadius: 12, padding: 16 },
  instrText: { color: '#aaa', fontSize: 14 },
  btnIniciar: {
    backgroundColor: '#ff2d75', paddingVertical: 16, paddingHorizontal: 40,
    borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#ff2d75', shadowOpacity: 0.5, shadowRadius: 12, elevation: 6,
  },
  btnIniciarText: { color: '#fff', fontWeight: '900', fontSize: 18, letterSpacing: 1 },

  gameContainer: { flex: 1, backgroundColor: '#060618', overflow: 'hidden' },
  hud: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 55 : 45, paddingBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  hudItem: { alignItems: 'center', minWidth: 70 },
  hudLabel: { color: '#555', fontSize: 10, letterSpacing: 1, fontWeight: '700' },
  hudValue: { color: '#fff', fontSize: 22, fontWeight: '900' },
  timerBox: {
    backgroundColor: '#1a1a2e', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#3b82f633',
  },
  timerBoxUrgente: { backgroundColor: '#2a0000', borderColor: '#ef444488' },
  timerText: { color: '#7dd3fc', fontSize: 22, fontWeight: '900' },

  itemEmoji: { position: 'absolute', fontSize: ITEM_SIZE, top: 0 },
  canasta: { position: 'absolute', bottom: 55, width: BASKET_W, alignItems: 'center' },
  canastaEmoji: { fontSize: 72 },

  finBox: { alignItems: 'center', padding: 30, width: '90%' },
  finEmoji: { fontSize: 80, marginBottom: 8 },
  finTitle: { fontSize: 36, fontWeight: '900', color: '#fff', marginBottom: 4 },
  finNivel: { fontSize: 20, color: '#ff2d75', fontWeight: '700', marginBottom: 24 },
  finStats: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 32 },
  finStat: { alignItems: 'center' },
  finStatNum: { fontSize: 36, fontWeight: '900', color: '#22c55e' },
  finStatLabel: { color: '#555', fontSize: 12, marginTop: 4 },
  finDivider: { width: 1, height: 50, backgroundColor: '#222' },
  btnReintentar: {
    backgroundColor: '#ff2d75', paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12,
    shadowColor: '#ff2d75', shadowOpacity: 0.4, shadowRadius: 10, elevation: 4,
  },
  btnReintentarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  btnVolver: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10 },
  btnVolverText: { color: '#666', fontSize: 14 },
});
