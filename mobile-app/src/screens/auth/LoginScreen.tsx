import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { colors } from '../../theme/colors';

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { login } = useAuth();
  const [telefono, setTelefono] = useState('+56');
  const [pin, setPin] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleLogin = async () => {
    if (telefono.length < 8 || pin.length !== 4) {
      Alert.alert('Error', 'Verifica el teléfono y el PIN de 4 dígitos');
      return;
    }
    setCargando(true);
    try {
      await login(telefono, pin);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Credenciales inválidas');
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <Text style={styles.titulo}>BELLAKERA</Text>
      <Text style={styles.subtitulo}>Inicia sesión</Text>

      <TextInput
        style={styles.input}
        placeholder="Teléfono (+56912345678)"
        placeholderTextColor={colors.textMuted}
        keyboardType="phone-pad"
        value={telefono}
        onChangeText={setTelefono}
      />

      <TextInput
        style={styles.input}
        placeholder="PIN (4 dígitos)"
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        maxLength={4}
        secureTextEntry
        value={pin}
        onChangeText={setPin}
      />

      <TouchableOpacity style={styles.boton} onPress={handleLogin} disabled={cargando}>
        <Text style={styles.botonText}>{cargando ? 'Ingresando...' : 'INGRESAR'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 30, justifyContent: 'center' },
  titulo: { fontSize: 42, fontWeight: 'bold', color: colors.primary, textAlign: 'center', marginBottom: 8, letterSpacing: 3 },
  subtitulo: { fontSize: 18, color: colors.text, textAlign: 'center', marginBottom: 40 },
  input: {
    backgroundColor: colors.card, color: colors.text, padding: 16, borderRadius: 10,
    marginBottom: 15, borderWidth: 1, borderColor: colors.border, fontSize: 16,
  },
  boton: {
    backgroundColor: colors.primary, padding: 16, borderRadius: 10,
    alignItems: 'center', marginTop: 10,
  },
  botonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  link: { color: colors.accent, textAlign: 'center', marginTop: 25, fontSize: 14 },
});