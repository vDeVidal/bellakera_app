import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { colors } from '../../theme/colors';

type Tab = 'entradas' | 'barra';

export default function EntradasScreen() {
  const [tab, setTab] = useState<Tab>('entradas');
  const [carrito, setCarrito] = useState<{ [key: number]: number }>({});

  // Datos de ejemplo (luego vendrán del API)
  const items = tab === 'entradas'
    ? [{ id: 1, nombre: 'Acceso Normal Carrete "Como Antes"', precio: 5000 }]
    : [
        { id: 1, nombre: 'Piscola', precio: 5000 },
        { id: 2, nombre: 'Cerveza Royal Guard', precio: 3000 },
        { id: 3, nombre: 'Cerveza Kunstmann Torobayo', precio: 4000 },
      ];

  const cambiarCantidad = (id: number, delta: number) => {
    setCarrito((prev) => {
      const nueva = (prev[id] || 0) + delta;
      if (nueva <= 0) {
        const { [id]: _, ...resto } = prev;
        return resto;
      }
      return { ...prev, [id]: nueva };
    });
  };

  const subtotal = items.reduce((sum, item) => sum + (carrito[item.id] || 0) * item.precio, 0);

  const handlePagar = () => {
    if (subtotal === 0) {
      Alert.alert('Carrito vacío', 'Agrega productos antes de pagar');
      return;
    }
    Alert.alert('Pago', `Total a pagar: $${subtotal.toLocaleString()}\n\n(Integración con pasarela pendiente)`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Caja Virtual</Text>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'entradas' && styles.tabActive]}
          onPress={() => setTab('entradas')}
        >
          <Text style={[styles.tabText, tab === 'entradas' && styles.tabTextActive]}>
            ENTRADAS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'barra' && styles.tabActive]}
          onPress={() => setTab('barra')}
        >
          <Text style={[styles.tabText, tab === 'barra' && styles.tabTextActive]}>
            BARRA
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.subtotalBox}>
        <Text style={styles.subtotalLabel}>SUBTOTAL:</Text>
        <Text style={styles.subtotalValue}>${subtotal.toLocaleString()}</Text>
      </View>

      <ScrollView style={styles.lista}>
        {items.map((item) => (
          <View key={item.id} style={styles.item}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemNombre}>{item.nombre}</Text>
              <Text style={styles.itemPrecio}>${item.precio.toLocaleString()}</Text>
            </View>
            <View style={styles.controles}>
              <TouchableOpacity
                style={styles.btnCantidad}
                onPress={() => cambiarCantidad(item.id, -1)}
              >
                <Text style={styles.btnCantidadText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.cantidad}>{carrito[item.id] || 0}</Text>
              <TouchableOpacity
                style={styles.btnCantidad}
                onPress={() => cambiarCantidad(item.id, 1)}
              >
                <Text style={styles.btnCantidadText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.btnPagar} onPress={handlePagar}>
        <Text style={styles.btnPagarText}>PAGA AQUÍ</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: 16 },
  tabs: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 8, marginBottom: 16, padding: 4 },
  tab: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 6 },
  tabActive: { backgroundColor: colors.background },
  tabText: { color: colors.textMuted, fontWeight: 'bold', fontSize: 13 },
  tabTextActive: { color: colors.text },
  subtotalBox: {
    backgroundColor: colors.primary, padding: 16, borderRadius: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  subtotalLabel: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  subtotalValue: { color: '#fff', fontWeight: 'bold', fontSize: 20 },
  lista: { flex: 1 },
  item: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    padding: 14, borderRadius: 10, marginBottom: 10,
  },
  itemInfo: { flex: 1 },
  itemNombre: { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  itemPrecio: { color: colors.accent, fontSize: 13 },
  controles: { flexDirection: 'row', alignItems: 'center' },
  btnCantidad: {
    width: 32, height: 32, backgroundColor: colors.primary, borderRadius: 6,
    justifyContent: 'center', alignItems: 'center',
  },
  btnCantidadText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  cantidad: {
    color: colors.text, fontSize: 16, fontWeight: 'bold',
    marginHorizontal: 12, minWidth: 24, textAlign: 'center',
  },
  btnPagar: {
    backgroundColor: colors.primary, padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 16,
  },
  btnPagarText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
});