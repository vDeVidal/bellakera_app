import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';

type Tab = 'entradas' | 'barra';

export default function EntradasScreen() {
  const [tab, setTab] = useState<Tab>('entradas');
  const [carrito, setCarrito] = useState<{ [key: number]: number }>({});

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

      {/* Tabs */}
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

      {/* Caja de Subtotal Unificada en Negro Puro */}
      <View style={styles.subtotalBox}>
        <Text style={styles.subtotalLabel}>TOTAL CARRITO</Text>
        <Text style={styles.subtotalValue}>${subtotal.toLocaleString()}</Text>
      </View>

      {/* Listado de Productos */}
      <ScrollView style={styles.lista} showsVerticalScrollIndicator={false}>
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

      {/* Botón de Pago abajo */}
      <TouchableOpacity style={styles.btnPagar} onPress={handlePagar}>
        <Text style={styles.btnPagarText}>PAGAR AQUÍ</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0a0a0a', 
    padding: 16 
  },
  titulo: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginBottom: 16,
    letterSpacing: 0.5
  },
  tabs: { 
    flexDirection: 'row', 
    backgroundColor: '#121212', 
    borderRadius: 10, 
    marginBottom: 16, 
    padding: 4,
    borderWidth: 1,
    borderColor: '#1f1f1f'
  },
  tab: { 
    flex: 1, 
    padding: 12, 
    alignItems: 'center', 
    borderRadius: 8 
  },
  tabActive: { 
    backgroundColor: '#1a1a1a' 
  },
  tabText: { 
    color: '#666', 
    fontWeight: 'bold', 
    fontSize: 13,
    letterSpacing: 0.5
  },
  tabTextActive: { 
    color: '#ff2d75' 
  },
  subtotalBox: {
    backgroundColor: '#121212', 
    padding: 18, 
    borderRadius: 12,
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1f1f1f'
  },
  subtotalLabel: { 
    color: '#aaa', 
    fontWeight: 'bold', 
    fontSize: 14,
    letterSpacing: 0.5
  },
  subtotalValue: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 22 
  },
  lista: { 
    flex: 1 
  },
  item: {
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#121212',
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1f1f1f'
  },
  itemInfo: { 
    flex: 1 
  },
  itemNombre: { 
    color: '#fff', 
    fontSize: 15, 
    fontWeight: '600', 
    marginBottom: 4 
  },
  itemPrecio: { 
    color: '#aaa', 
    fontSize: 13,
    fontWeight: '500'
  },
  controles: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  btnCantidad: {
    width: 34, 
    height: 34, 
    backgroundColor: '#1a1a1a', 
    borderRadius: 8,
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333'
  },
  btnCantidadText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  cantidad: {
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold',
    marginHorizontal: 14, 
    minWidth: 20, 
    textAlign: 'center',
  },
  btnPagar: {
    backgroundColor: '#ff2d75', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 12,
    shadowColor: '#ff2d75',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  btnPagarText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16, 
    letterSpacing: 1 
  },
});