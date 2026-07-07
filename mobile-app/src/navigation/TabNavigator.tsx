import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

// Pantallas usuario
import EventosScreen from '../screens/main/EventosScreen';
import EntradasScreen from '../screens/main/EntradasScreen';
import MisPedidosScreen from '../screens/main/MisPedidosScreen';
import JuegosScreen from '../screens/main/JuegosScreen';
import GaleriaScreen from '../screens/main/GaleriaScreen';
import PerfilScreen from '../screens/main/PerfilScreen';

// Pantallas admin
import ScannerQRScreen from '../screens/admin/ScannerQRScreen';

const Tab = createBottomTabNavigator();

// ── Componente del ícono de Juegos con animación de pulso ─────────────────────
function JuegosTabIcon({ color, size, juegoActivo }: { color: string; size: number; juegoActivo: boolean }) {
  const pulso = useRef(new Animated.Value(1)).current;
  const glow  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!juegoActivo) {
      pulso.setValue(1);
      glow.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulso, { toValue: 1.3, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glow,  { toValue: 1,   duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulso, { toValue: 1,   duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glow,  { toValue: 0,   duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [juegoActivo]);

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.9] });

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {/* Halo rosa detrás del ícono cuando el juego está activo */}
      {juegoActivo && (
        <Animated.View
          style={{
            position: 'absolute',
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: '#ff2d75',
            opacity: glowOpacity,
            transform: [{ scale: pulso }],
          }}
        />
      )}
      <Animated.View style={{ transform: [{ scale: juegoActivo ? pulso : new Animated.Value(1) }] }}>
        <Ionicons
          name="game-controller-outline"
          size={size}
          color={juegoActivo ? '#ff2d75' : color}
        />
      </Animated.View>
    </View>
  );
}

// ── TabNavigator principal ────────────────────────────────────────────────────
export default function TabNavigator() {
  const { tipo } = useAuth();
  const esAdmin = tipo === 'admin';
  const [juegoActivo, setJuegoActivo] = useState(false);

  // Polling cada 5s para saber si el juego está activo
  useEffect(() => {
    const check = async () => {
      try {
        const { data } = await api.get('/config/juego');
        setJuegoActivo(data.juego_activo ?? false);
      } catch { /* silencioso */ }
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: '#000' },
        headerTintColor: '#D4AF37',
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopColor: '#D4AF37',
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#D4AF37',
        tabBarInactiveTintColor: '#888',
        tabBarIcon: ({ color, size, focused }) => {
          // Tab especial para Juegos
          if (route.name === 'Juegos') {
            return <JuegosTabIcon color={color} size={size} juegoActivo={juegoActivo} />;
          }

          let iconName: keyof typeof Ionicons.glyphMap = 'help-circle';
          if (route.name === 'Eventos')     iconName = 'calendar-outline';
          else if (route.name === 'Entradas')   iconName = 'cart-outline';
          else if (route.name === 'MisPedidos') iconName = 'receipt-outline';
          else if (route.name === 'Scanner')    iconName = 'qr-code-outline';
          else if (route.name === 'Galería')    iconName = 'images-outline';
          else if (route.name === 'Perfil')     iconName = 'person-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Eventos"
        component={EventosScreen}
        options={{ title: esAdmin ? 'Eventos (Admin)' : 'Eventos' }}
      />

      {esAdmin ? (
        <Tab.Screen
          name="Scanner"
          component={ScannerQRScreen}
          options={{ title: 'Scanner QR' }}
        />
      ) : (
        <>
          <Tab.Screen
            name="Entradas"
            component={EntradasScreen}
            options={{ title: 'Ventas' }}
          />
          <Tab.Screen
            name="MisPedidos"
            component={MisPedidosScreen}
            options={{ title: 'Mis Pedidos' }}
          />
        </>
      )}

      <Tab.Screen
        name="Juegos"
        component={JuegosScreen}
        options={{
          title: 'Juegos',
          // Badge rojo cuando el juego está activo
          tabBarBadge: juegoActivo ? '🔴' : undefined,
          tabBarBadgeStyle: juegoActivo ? { backgroundColor: 'transparent', color: '#ff2d75', fontSize: 8 } : undefined,
        }}
      />
      <Tab.Screen name="Galería" component={GaleriaScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}