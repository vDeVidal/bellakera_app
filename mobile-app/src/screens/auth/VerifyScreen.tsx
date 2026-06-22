import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { colors } from '../../theme/colors';

export default function VerifyScreen() {
  const route = useRoute<RouteProp<AuthStackParamList, 'Verify'>>();
  const { telefono } = route.params;
  const { guardarSesion } = useAuth();
  const [codigo, setCodigo] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleVerificar = async () => {
    if (codigo.length !== 6) {
      Alert.alert('Error', 'El código es de 6 dígitos');
      return;
    }
    setCargando(true);
    try {
      const { data } = await api.post('/auth/verificar', { telefono, codigo });
      await guardarSesion(data.access_token, data.usuario);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Código incorrecto');
    } finally {
      setCargando(false);
    }
  };

  const handleReenviar = async () => {
    try {
      await api.post('/auth/reenviar-codigo', { telefono });
      Alert.alert('Listo', 'Te enviamos un nuevo código');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo reenviar');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Verifica tu número</Text>
      <Text style={styles.descripcion}>
        Ingresa el código de 6 dígitos que enviamos a {telefono}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="------"
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        maxLength={6}
        value={codigo}
        onChangeText={setCodigo}
        textAlign="center"
      />

      <TouchableOpacity style={styles.boton} onPress={handleVerificar} disabled={cargando}>
        <Text style={styles.botonText}>{cargando ? 'Verificando...' : 'VERIFICAR'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleReenviar}>
        <Text style={styles.link}>Reenviar código</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 30, justifyContent: 'center' },
  titulo: { fontSize: 28, fontWeight: 'bold', color: colors.primary, textAlign: 'center', marginBottom: 12 },
  descripcion: { color: colors.textMuted, textAlign: 'center', marginBottom: 30, fontSize: 14 },
  input: {
    backgroundColor: colors.card, color: colors.text, padding: 20, borderRadius: 10,
    marginBottom: 20, borderWidth: 1, borderColor: colors.border, fontSize: 28, letterSpacing: 8,
  },
  boton: { backgroundColor: colors.primary, padding: 16, borderRadius: 10, alignItems: 'center' },
  botonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  link: { color: colors.accent, textAlign: 'center', marginTop: 25, fontSize: 14 },
});