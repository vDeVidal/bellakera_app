import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '../../api/client';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { colors } from '../../theme/colors';

export default function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [telefono, setTelefono] = useState('+56');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleRegistro = async () => {
    if (telefono.length < 11) {
      Alert.alert('Error', 'Ingresa un número válido con código de país');
      return;
    }
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      Alert.alert('Error', 'El PIN debe ser de 4 dígitos numéricos');
      return;
    }
    if (pin !== pinConfirm) {
      Alert.alert('Error', 'Los PIN no coinciden');
      return;
    }

    setCargando(true);
    try {
      await api.post('/auth/registro', { telefono, pin });
      Alert.alert('¡Listo!', 'Te enviamos un código por SMS');
      navigation.navigate('Verify', { telefono });
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo registrar');
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <Text style={styles.titulo}>Crear cuenta</Text>
      <Text style={styles.descripcion}>
        Te enviaremos un código SMS para verificar tu número.
      </Text>

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
        placeholder="Crea un PIN de 4 dígitos"
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        maxLength={4}
        secureTextEntry
        value={pin}
        onChangeText={setPin}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirma tu PIN"
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        maxLength={4}
        secureTextEntry
        value={pinConfirm}
        onChangeText={setPinConfirm}
      />

      <TouchableOpacity style={styles.boton} onPress={handleRegistro} disabled={cargando}>
        <Text style={styles.botonText}>{cargando ? 'Enviando...' : 'REGISTRARME'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 30, justifyContent: 'center' },
  titulo: { fontSize: 32, fontWeight: 'bold', color: colors.primary, textAlign: 'center', marginBottom: 10 },
  descripcion: { color: colors.textMuted, textAlign: 'center', marginBottom: 30, fontSize: 14 },
  input: {
    backgroundColor: colors.card, color: colors.text, padding: 16, borderRadius: 10,
    marginBottom: 15, borderWidth: 1, borderColor: colors.border, fontSize: 16,
  },
  boton: { backgroundColor: colors.primary, padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  botonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  link: { color: colors.accent, textAlign: 'center', marginTop: 25, fontSize: 14 },
});