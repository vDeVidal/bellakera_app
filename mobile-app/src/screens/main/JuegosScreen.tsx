import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing,
  PanResponder, Dimensions, ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../api/client';
import { colors } from '../../theme/colors';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const FRUTAS = ['🍓', '🍉', '🍌', '🍇', '🍒', '🥝', '🍑', '🍍', '🍋', '🫐'];
const BASKET_W = 90;
const FRUIT_SIZE = 40;
const GAME_DURATION = 30; // segundos

interface FrutaCayendo {
  id: number;
  emoji: string;
  x: number;
  anim: Animated.Value;
}

// ─── Pantalla principal de Juegos ─────────────────────────────────────────────

export default function JuegosScreen() {
  const navigation = useNavigation<any>();
  const [juegoActivo, setJuegoActivo] = useState(false);
  const [cargando, setCargando] = useState(true);
  const pulso = useRef(new Animated.Value(1)).current;

  const checkEstadoJuego = useCallback(async () => {
    try {
      const { data } = await api.get('/config/juego');
      setJuegoActivo(data.juego_activo);
    } catch {
      // silencioso
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    checkEstadoJuego();
    const interval = setInterval(checkEstadoJuego, 5000);
    return () => clearInterval(interval);
  }, [checkEstadoJuego]);

  // Animación de pulso cuando el juego está activo
  useEffect(() => {
    if (!juegoActivo) {
      pulso.setValue(1);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1.08, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [juegoActivo]);

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff2d75" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Juegos BELLAKOS 🎮</Text>

      {/* Botón principal del juego */}
      <View style={styles.juegoSection}>
        {juegoActivo ? (
          <>
            <View style={styles.activoBadge}>
              <View style={styles.activoPulse} />
              <Text style={styles.activoText}>¡Juego ACTIVADO por el Admin!</Text>
            </View>
            <Animated.View style={{ transform: [{ scale: pulso }] }}>
              <TouchableOpacity
                style={styles.btnJuego}
                onPress={() => navigation.navigate('FruitCatcher')}
                activeOpacity={0.8}
              >
                <Text style={styles.btnJuegoEmoji}>🍓</Text>
                <Text style={styles.btnJuegoTitle}>FRUIT CATCHER</Text>
                <Text style={styles.btnJuegoSub}>¡Atrapa todas las frutas!</Text>
                <View style={styles.btnJuegoArrow}>
                  <Ionicons name="play-circle" size={28} color="#fff" />
                </View>
              </TouchableOpacity>
            </Animated.View>
          </>
        ) : (
          <View style={styles.juegoInactivo}>
            <Text style={styles.juegoInactivoEmoji}>🎮</Text>
            <Text style={styles.juegoInactivoTitle}>Próximo juego</Text>
            <Text style={styles.juegoInactivoSub}>El staff activará un juego en vivo durante el evento</Text>
          </View>
        )}
      </View>

      <Text style={styles.subtitulo}>Más juegos próximamente…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#ff2d75', marginBottom: 24, letterSpacing: 0.5 },

  juegoSection: { marginBottom: 30 },

  activoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14,
    backgroundColor: '#1a0010', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: '#ff2d7544',
  },
  activoPulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff2d75' },
  activoText: { color: '#ff2d75', fontWeight: '700', fontSize: 13 },

  btnJuego: {
    backgroundColor: '#1a0a0a', borderRadius: 20, padding: 24,
    alignItems: 'center', gap: 8,
    borderWidth: 2, borderColor: '#ff2d75',
    shadowColor: '#ff2d75', shadowOpacity: 0.5, shadowRadius: 16, elevation: 8,
  },
  btnJuegoEmoji: { fontSize: 56 },
  btnJuegoTitle: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  btnJuegoSub: { color: '#888', fontSize: 14 },
  btnJuegoArrow: { marginTop: 8 },

  juegoInactivo: {
    backgroundColor: '#111', borderRadius: 20, padding: 40, alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#1f1f1f',
  },
  juegoInactivoEmoji: { fontSize: 56, opacity: 0.4 },
  juegoInactivoTitle: { color: '#444', fontSize: 18, fontWeight: '700' },
  juegoInactivoSub: { color: '#333', fontSize: 13, textAlign: 'center' },

  subtitulo: { color: '#333', textAlign: 'center', fontSize: 14 },
});