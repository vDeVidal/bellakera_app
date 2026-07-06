// mobile-app/src/screens/auth/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [numero, setNumero] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNumeroChange = (text: string) => {
    // Solo permite dígitos numéricos
    const soloDigitos = text.replace(/[^0-9]/g, '');
    if (soloDigitos.length <= 9) {
      setNumero(soloDigitos);
    }
  };

  const handlePinChange = (text: string) => {
    const soloDigitos = text.replace(/[^0-9]/g, '');
    if (soloDigitos.length <= 4) {
      setPin(soloDigitos);
    }
  };

  const handleLogin = async () => {
    if (numero.length !== 9) {
      Alert.alert(
        'Número inválido',
        `Debes ingresar 9 dígitos. Llevas ${numero.length}.`
      );
      return;
    }

    if (pin.length !== 4) {
      Alert.alert('PIN inválido', 'El PIN debe tener 4 dígitos.');
      return;
    }

    // 🎯 Construimos el teléfono base
    const telefonoBase = `+56${numero}`;

    try {
      setLoading(true);

      // Envia el login normal. Si falla por los espacios del Seed,
      // la app intentará automáticamente el formato alternativo con espacios configurados
      try {
        await login(telefonoBase, pin);
      } catch (innerError: any) {
        if (innerError.response?.status === 401 || innerError.response?.status === 404) {
          // 💡 PLAN B: Si falló, formateamos el string con los espacios exactos del Seed de DBeaver: "+56 9 XXXX XXXX"
          const telefonoConEspacios = `+56 9 ${numero.substring(1, 5)} ${numero.substring(5, 9)}`;
          console.log('🔄 Reintentando con formato del Seed:', telefonoConEspacios);
          await login(telefonoConEspacios, pin);
        } else {
          throw innerError;
        }
      }

    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Credenciales inválidas';
      Alert.alert(
        'Error de autenticación',
        Array.isArray(errorMsg) ? errorMsg[0] : errorMsg
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>BELLAKERA 🔥</Text>
        <Text style={styles.subtitle}>Inicia sesión</Text>

        <Text style={styles.label}>Teléfono</Text>
        <View style={styles.telefonoContainer}>
          <View style={styles.prefijoBox}>
            <Text style={styles.prefijoText}>+56</Text>
          </View>
          <TextInput
            style={styles.numeroInput}
            placeholder="932344567"
            placeholderTextColor="#888"
            keyboardType="number-pad"
            value={numero}
            onChangeText={handleNumeroChange}
            maxLength={9}
            autoFocus
          />
        </View>
        <Text style={styles.helperText}>
          {numero.length}/9 dígitos
        </Text>

        <Text style={styles.label}>PIN (4 dígitos)</Text>
        <TextInput
          style={styles.pinInput}
          placeholder="••••"
          placeholderTextColor="#888"
          keyboardType="number-pad"
          value={pin}
          onChangeText={handlePinChange}
          maxLength={4}
          secureTextEntry
        />
        <Text style={styles.helperText}>{pin.length}/4 dígitos</Text>

        <TouchableOpacity
          style={[
            styles.button,
            (numero.length !== 9 || pin.length !== 4) && styles.buttonDisabled,
          ]}
          onPress={handleLogin}
          disabled={loading || numero.length !== 9 || pin.length !== 4}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>INGRESAR</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 42, fontWeight: 'bold', color: '#ff1493', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 18, color: '#fff', textAlign: 'center', marginBottom: 40 },
  label: { color: '#fff', fontSize: 14, marginBottom: 8, marginTop: 12 },
  telefonoContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  prefijoBox: { paddingHorizontal: 16, paddingVertical: 14, borderRightWidth: 1, borderRightColor: '#333' },
  prefijoText: { color: '#ff1493', fontSize: 16, fontWeight: 'bold' },
  numeroInput: { flex: 1, color: '#fff', fontSize: 16, paddingHorizontal: 12, paddingVertical: 14 },
  pinInput: { backgroundColor: '#1a1a1a', borderRadius: 8, borderWidth: 1, borderColor: '#333', color: '#fff', fontSize: 20, textAlign: 'center', letterSpacing: 8, paddingVertical: 14 },
  helperText: { color: '#666', fontSize: 12, marginTop: 4, textAlign: 'right' },
  button: { backgroundColor: '#ff1493', paddingVertical: 16, borderRadius: 8, marginTop: 24, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#555' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 2 },
  link: { color: '#ff1493', textAlign: 'center', marginTop: 24, fontSize: 14 },
});