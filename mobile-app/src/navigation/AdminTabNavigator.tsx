import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import EventosScreen from '../screens/main/EventosScreen';
import ScannerQRScreen from '../screens/admin/ScannerQRScreen';
import GaleriaScreen from '../screens/main/GaleriaScreen';
import PerfilScreen from '../screens/main/PerfilScreen';

const Tab = createBottomTabNavigator();

export default function AdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: '#0a0a0a', borderBottomWidth: 0, elevation: 0 },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarStyle: { backgroundColor: '#0a0a0a', borderTopWidth: 1, borderTopColor: '#1a1a1a', paddingBottom: 5, height: 60 },
        tabBarActiveTintColor: '#ff2d75',
        tabBarInactiveTintColor: '#888',
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'AdminEventos') {
            return <Ionicons name="calendar" size={size} color={color} />;
          } else if (route.name === 'Scanner') {
            return <Ionicons name="camera-outline" size={size} color={color} /> || 
                   <MaterialCommunityIcons name="qrcode" size={size} color={color} />;
          } else if (route.name === 'AdminGaleria') {
            return <Ionicons name="images" size={size} color={color} />;
          } else if (route.name === 'AdminPerfil') {
            return <Ionicons name="person" size={size} color={color} />;
          }
        },
      })}
    >
      <Tab.Screen name="AdminEventos" component={EventosScreen} options={{ title: 'Eventos' }} />
      <Tab.Screen name="Scanner" component={ScannerQRScreen} options={{ title: 'Validar QR' }} />
      <Tab.Screen name="AdminGaleria" component={GaleriaScreen} options={{ title: 'Galería' }} />
      <Tab.Screen name="AdminPerfil" component={PerfilScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}