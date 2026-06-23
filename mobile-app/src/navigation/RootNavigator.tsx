import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import VerifyScreen from '../screens/auth/VerifyScreen';
import TabNavigator from './TabNavigator';
import EventoDetalleScreen from '../screens/main/EventoDetalleScreen';
import EventoFormScreen from '../screens/main/EventoFormScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { token, cargando } = useAuth();

  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' }}>
        <ActivityIndicator size="large" color="#ff2d75" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen
            name="EventoDetalle"
            component={EventoDetalleScreen}
            options={{
              headerShown: true,
              title: 'Detalle del evento',
              headerStyle: { backgroundColor: '#0a0a0a' },
              headerTintColor: '#fff',
            }}
          />
          <Stack.Screen
            name="EventoForm"
            component={EventoFormScreen}
            options={{
              headerShown: true,
              title: '',
              headerStyle: { backgroundColor: '#0a0a0a' },
              headerTintColor: '#fff',
            }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Verify" component={VerifyScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}