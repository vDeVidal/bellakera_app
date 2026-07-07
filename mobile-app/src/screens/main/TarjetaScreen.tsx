import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, Animated, Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

const BANCOS = ['Banco Estado', 'Santander', 'BCI', 'Scotiabank', 'Itaú', 'BICE', 'Falabella', 'Ripley'];
const STORAGE_KEY = 'tarjeta_guardada';

interface TarjetaData {
  numero: string;
  nombre: string;
  expiry: string;
  cvv: string;
  tipo: 'debito' | 'credito';
  banco: string;
}

function formatCardNumber(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + '/' + digits.slice(2);
}

function maskNumber(num: string) {
  const digits = num.replace(/\s/g, '');
  if (digits.length < 4) return '**** **** **** ****';
  return `**** **** **** ${digits.slice(-4)}`;
}

const GRADIENT_COLORS: Record<string, [string, string]> = {
  debito:  ['#1a1a2e', '#16213e'],
  credito: ['#0f0c29', '#302b63'],
};

export default function TarjetaScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [numero, setNumero] = useState('');
  const [nombre, setNombre] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [tipo, setTipo] = useState<'debito' | 'credito'>('debito');
  const [banco, setBanco] = useState(BANCOS[0]);
  const [guardando, setGuardando] = useState(false);
  const [tarjetaExistente, setTarjetaExistente] = useState<TarjetaData | null>(null);
  const [mostrandoCvv, setMostrandoCvv] = useState(false);

  // Animación del chip
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Cargar tarjeta existente
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        const t: TarjetaData = JSON.parse(raw);
        setTarjetaExistente(t);
        setNumero(t.numero);
        setNombre(t.nombre);
        setExpiry(t.expiry);
        setCvv(t.cvv);
        setTipo(t.tipo);
        setBanco(t.banco);
      }
    });
  }, []);

  const handleGuardar = async () => {
    const digits = numero.replace(/\s/g, '');
    if (digits.length < 16) return Alert.alert('Número inválido', 'El número debe tener 16 dígitos.');
    if (!nombre.trim()) return Alert.alert('Nombre requerido', 'Ingresa el nombre del titular.');
    if (expiry.length < 5) return Alert.alert('Fecha inválida', 'Usa formato MM/YY.');
    if (cvv.length < 3) return Alert.alert('CVV inválido', 'El CVV debe tener al menos 3 dígitos.');

    setGuardando(true);
    try {
      const data: TarjetaData = { numero: digits, nombre: nombre.trim(), expiry, cvv, tipo, banco };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setTarjetaExistente(data);
      Alert.alert('✅ Tarjeta guardada', 'Tu tarjeta fue guardada de forma segura en tu dispositivo.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = () => {
    Alert.alert('Eliminar tarjeta', '¿Estás seguro de que deseas eliminar tu tarjeta guardada?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(STORAGE_KEY);
          setTarjetaExistente(null);
          setNumero(''); setNombre(''); setExpiry(''); setCvv('');
        },
      },
    ]);
  };

  const shimmerOpacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Tarjeta Visual */}
      <View style={[styles.card, { backgroundColor: tipo === 'debito' ? '#1a1a2e' : '#0f0c29' }]}>
        {/* Shimmer overlay */}
        <Animated.View style={[styles.cardShimmer, { opacity: shimmerOpacity }]} />

        <View style={styles.cardTop}>
          <View style={styles.chip}>
            <View style={styles.chipLine} />
            <View style={styles.chipLineV} />
          </View>
          <View style={styles.wifiIcon}>
            <Ionicons name="wifi-outline" size={22} color="rgba(255,255,255,0.6)" style={{ transform: [{ rotate: '90deg' }] }} />
          </View>
        </View>

        <Text style={styles.cardNumber}>
          {numero ? maskNumber(formatCardNumber(numero)) : '**** **** **** ****'}
        </Text>

        <View style={styles.cardBottom}>
          <View>
            <Text style={styles.cardLabel}>TITULAR</Text>
            <Text style={styles.cardValue}>{nombre.toUpperCase() || 'NOMBRE APELLIDO'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.cardLabel}>VENCE</Text>
            <Text style={styles.cardValue}>{expiry || 'MM/YY'}</Text>
          </View>
        </View>

        <View style={styles.cardBankRow}>
          <Text style={styles.cardBank}>{banco}</Text>
          <Text style={[styles.cardTipo, { color: tipo === 'debito' ? '#7dd3fc' : '#c4b5fd' }]}>
            {tipo.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Tipo de tarjeta */}
      <View style={styles.tipoRow}>
        <TouchableOpacity
          style={[styles.tipoBtn, tipo === 'debito' && styles.tipoBtnActive]}
          onPress={() => setTipo('debito')}
        >
          <Text style={[styles.tipoBtnText, tipo === 'debito' && { color: '#7dd3fc' }]}>Débito</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tipoBtn, tipo === 'credito' && styles.tipoBtnActive]}
          onPress={() => setTipo('credito')}
        >
          <Text style={[styles.tipoBtnText, tipo === 'credito' && { color: '#c4b5fd' }]}>Crédito</Text>
        </TouchableOpacity>
      </View>

      {/* Banco */}
      <Text style={styles.label}>Banco</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {BANCOS.map((b) => (
          <TouchableOpacity
            key={b}
            style={[styles.bancoChip, banco === b && styles.bancoChipActive]}
            onPress={() => setBanco(b)}
          >
            <Text style={[styles.bancoChipText, banco === b && { color: '#fff' }]}>{b}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Formulario */}
      <Text style={styles.label}>Número de tarjeta</Text>
      <TextInput
        style={styles.input}
        placeholder="1234 5678 9012 3456"
        placeholderTextColor="#555"
        keyboardType="number-pad"
        value={formatCardNumber(numero)}
        onChangeText={(t) => setNumero(t.replace(/\s/g, '').slice(0, 16))}
        maxLength={19}
      />

      <Text style={styles.label}>Nombre del titular</Text>
      <TextInput
        style={styles.input}
        placeholder="Como aparece en la tarjeta"
        placeholderTextColor="#555"
        value={nombre}
        onChangeText={setNombre}
        autoCapitalize="characters"
      />

      <View style={styles.row2}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={styles.label}>Vencimiento</Text>
          <TextInput
            style={styles.input}
            placeholder="MM/YY"
            placeholderTextColor="#555"
            keyboardType="number-pad"
            value={expiry}
            onChangeText={(t) => setExpiry(formatExpiry(t))}
            maxLength={5}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>CVV</Text>
          <View style={{ position: 'relative' }}>
            <TextInput
              style={styles.input}
              placeholder="•••"
              placeholderTextColor="#555"
              keyboardType="number-pad"
              value={cvv}
              onChangeText={(t) => setCvv(t.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
              secureTextEntry={!mostrandoCvv}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setMostrandoCvv((v) => !v)}
            >
              <Ionicons name={mostrandoCvv ? 'eye-off' : 'eye'} size={16} color="#555" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Aviso de seguridad */}
      <View style={styles.secureNote}>
        <Ionicons name="lock-closed" size={14} color="#22c55e" />
        <Text style={styles.secureText}>
          Tu información se guarda únicamente en este dispositivo. Nunca se envía a ningún servidor.
        </Text>
      </View>

      {/* Botones */}
      <TouchableOpacity
        style={[styles.btnGuardar, guardando && { opacity: 0.6 }]}
        onPress={handleGuardar}
        disabled={guardando}
      >
        <Ionicons name="card" size={18} color="#fff" />
        <Text style={styles.btnGuardarText}>
          {tarjetaExistente ? 'Actualizar tarjeta' : 'Guardar tarjeta'}
        </Text>
      </TouchableOpacity>

      {tarjetaExistente && (
        <TouchableOpacity style={styles.btnEliminar} onPress={handleEliminar}>
          <Ionicons name="trash-outline" size={16} color="#ef4444" />
          <Text style={styles.btnEliminarText}>Eliminar tarjeta guardada</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20 },

  // Tarjeta visual
  card: {
    borderRadius: 20, padding: 24, marginBottom: 24, minHeight: 200,
    shadowColor: '#7c3aed', shadowOpacity: 0.4, shadowRadius: 20, elevation: 8,
    overflow: 'hidden',
  },
  cardShimmer: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  chip: {
    width: 42, height: 32, backgroundColor: '#D4AF37', borderRadius: 6,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  chipLine: { width: '100%', height: 1, backgroundColor: 'rgba(0,0,0,0.3)', marginVertical: 4 },
  chipLineV: { position: 'absolute', width: 1, height: '100%', backgroundColor: 'rgba(0,0,0,0.3)' },
  wifiIcon: { opacity: 0.7 },
  cardNumber: {
    color: '#fff', fontSize: 20, fontWeight: '300', letterSpacing: 3,
    marginBottom: 20, fontFamily: 'monospace',
  },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cardLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, letterSpacing: 1, marginBottom: 2 },
  cardValue: { color: '#fff', fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
  cardBankRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardBank: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  cardTipo: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },

  // Tipo
  tipoRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  tipoBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    backgroundColor: '#141414', borderWidth: 1, borderColor: '#2a2a2a',
  },
  tipoBtnActive: { borderColor: '#7c3aed' },
  tipoBtnText: { color: '#666', fontWeight: '700', fontSize: 14 },

  // Banco chips
  bancoChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8,
    backgroundColor: '#141414', borderWidth: 1, borderColor: '#2a2a2a',
  },
  bancoChipActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  bancoChipText: { color: '#666', fontSize: 12 },

  // Form
  label: { color: '#888', fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6 },
  input: {
    backgroundColor: '#141414', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 16, marginBottom: 14,
  },
  row2: { flexDirection: 'row' },
  eyeBtn: { position: 'absolute', right: 14, top: 16 },

  // Seguridad
  secureNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#001510', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#22c55e22', marginBottom: 20,
  },
  secureText: { color: '#4ade80', fontSize: 12, flex: 1, lineHeight: 18 },

  // Botones
  btnGuardar: {
    backgroundColor: '#7c3aed', paddingVertical: 16, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginBottom: 12,
    shadowColor: '#7c3aed', shadowOpacity: 0.4, shadowRadius: 12, elevation: 4,
  },
  btnGuardarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  btnEliminar: {
    paddingVertical: 14, borderRadius: 14, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#1a0000', borderWidth: 1, borderColor: '#ef444444',
  },
  btnEliminarText: { color: '#ef4444', fontWeight: '700', fontSize: 14 },
});
