import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ScannerQRScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="qr-code-outline" size={120} color="#D4AF37" />
      <Text style={styles.titulo}>Scanner QR</Text>
      <Text style={styles.subtitulo}>
        Aquí podrás validar las entradas escaneando el código QR de los clientes
      </Text>
      <Text style={styles.placeholder}>
        🚧 Próximamente: cámara con detección automática
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  titulo: {
    color: '#D4AF37',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 24,
  },
  subtitulo: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    opacity: 0.8,
  },
  placeholder: {
    color: '#D4AF37',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 32,
    opacity: 0.6,
  },
});