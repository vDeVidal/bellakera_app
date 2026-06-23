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
  // ⚡ Solo guardamos los 9 dígitos del número, SIN el +56
  const [numero, setNumero] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNumeroChange = (text: string) => {
    // Solo permite dígitos numéricos
    const soloDigitos = text.replace(/[^0-9]/g, '');
    // Máximo 9 dígitos
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
    // Validaciones frontend estrictas
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

    // 🎯 Construimos el teléfono completo con +56
    const telefonoCompleto = `+56${numero}`;

    console.log('🚀 Login con:', {
      telefono: telefonoCompleto,
      telefono_length: telefonoCompleto.length,
      pin,
      pin_length: pin.length,
    });

    try {
      setLoading(true);
      await login(telefonoCompleto, pin);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Credenciales inválidas'
      );
    } finally {
      setLoading(false);
    }
  };

  const { login } = useAuth();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>BELLAKERA 🔥</Text>
        <Text style={styles.subtitle}>Inicia sesión</Text>

        {/* Input de teléfono con prefijo fijo */}
        <Text style={styles.label}>Teléfono</Text>
        <View style={styles.telefonoContainer}>
          <View style={styles.prefijoBox}>
            <Text style={styles.prefijoText}>+56</Text>
          </View>
          <TextInput
            style={styles.numeroInput}
            placeholder="912345678"
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

        {/* Input de PIN */}
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

        {/* Botón Login */}
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

        {/* Link a registro */}
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#ff1493',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
    marginTop: 12,
  },
  telefonoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  prefijoBox: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: '#333',
  },
  prefijoText: {
    color: '#ff1493',
    fontSize: 16,
    fontWeight: 'bold',
  },
  numeroInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  pinInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    color: '#fff',
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 8,
    paddingVertical: 14,
  },
  helperText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  button: {
    backgroundColor: '#ff1493',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 24,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#555',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  link: {
    color: '#ff1493',
    textAlign: 'center',
    marginTop: 24,
    fontSize: 14,
  },
});