import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

import EventosScreen from '../screens/main/EventosScreen';
import EntradasScreen from '../screens/main/EntradasScreen';
import JuegosScreen from '../screens/main/JuegosScreen';
import GaleriaScreen from '../screens/main/GaleriaScreen';
import PerfilScreen from '../screens/main/PerfilScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.backgroundLight },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarStyle: {
          backgroundColor: colors.backgroundLight,
          borderTopColor: colors.border,
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => {
          let iconName: any = 'home';
          if (route.name === 'Eventos') iconName = 'calendar';
          else if (route.name === 'Entradas') iconName = 'ticket';
          else if (route.name === 'Juegos') iconName = 'game-controller';
          else if (route.name === 'Galería') iconName = 'images';
          else if (route.name === 'Perfil') iconName = 'person';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Eventos" component={EventosScreen} />
      <Tab.Screen name="Entradas" component={EntradasScreen} />
      <Tab.Screen name="Juegos" component={JuegosScreen} />
      <Tab.Screen name="Galería" component={GaleriaScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}