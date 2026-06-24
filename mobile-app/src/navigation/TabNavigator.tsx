import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

// Pantallas usuario (carpeta main/)
import EventosScreen from '../screens/main/EventosScreen';
import EntradasScreen from '../screens/main/EntradasScreen';
import JuegosScreen from '../screens/main/JuegosScreen';
import GaleriaScreen from '../screens/main/GaleriaScreen';
import PerfilScreen from '../screens/main/PerfilScreen';

// Pantallas admin (carpeta admin/)
import ScannerQRScreen from '../screens/admin/ScannerQRScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { tipo } = useAuth();
  const esAdmin = tipo === 'admin';

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
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help-circle';

          if (route.name === 'Eventos') iconName = 'calendar-outline';
          else if (route.name === 'Entradas') iconName = 'ticket-outline';
          else if (route.name === 'Scanner') iconName = 'qr-code-outline';
          else if (route.name === 'Juegos') iconName = 'game-controller-outline';
          else if (route.name === 'Galería') iconName = 'images-outline';
          else if (route.name === 'Perfil') iconName = 'person-outline';

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
        <Tab.Screen
          name="Entradas"
          component={EntradasScreen}
          options={{ title: 'Ventas' }}
        />
      )}

      <Tab.Screen name="Juegos" component={JuegosScreen} />
      <Tab.Screen name="Galería" component={GaleriaScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}