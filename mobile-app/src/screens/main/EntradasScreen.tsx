import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
  ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../../api/client';
import { ventasApi } from '../../api/ventas';
import { useAuth } from '../../context/AuthContext';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Evento {
  id: number;
  nombre: string;
  fecha: string;
  precio: number;
  estado: string;
  aforo_maximo: number | null;
}

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  disponible: boolean;
}

type Tab = 'entradas' | 'barra';

const CLP = (v: number) =>
  `$${v.toLocaleString('es-CL')}`;

// ─── Componente ───────────────────────────────────────────────────────────────

export default function EntradasScreen() {
  const navigation = useNavigation<any>();
  const { usuario } = useAuth();

  const [tab, setTab] = useState<Tab>('entradas');
  const [carrito, setCarrito] = useState<{ [id: number]: number }>({});

  // Datos de la API
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [eventoActivo, setEventoActivo] = useState<Evento | null>(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  // Modal de confirmación
  const [modalVisible, setModalVisible] = useState(false);

  // ── Carga de datos ──────────────────────────────────────────────────────────

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const [{ data: evData }, { data: prodData }] = await Promise.all([
        apiClient.get<Evento[]>('/eventos'),
        apiClient.get<Producto[]>('/productos?disponibles=true'),
      ]);

      const activos = evData.filter((e) => e.estado === 'ACTIVO');
      setEventos(activos);
      if (activos.length > 0) setEventoActivo(activos[0]);
      setProductos(prodData);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los datos. Verifica tu conexión.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', cargarDatos);
    return unsub;
  }, [navigation, cargarDatos]);

  // ── Carrito ─────────────────────────────────────────────────────────────────

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

  const limpiarCarrito = () => setCarrito({});

  const itemsActivos = tab === 'entradas'
    ? (eventoActivo ? [{ id: eventoActivo.id, nombre: eventoActivo.nombre, precio: eventoActivo.precio }] : [])
    : productos;

  const subtotal = itemsActivos.reduce(
    (sum, item) => sum + (carrito[item.id] || 0) * item.precio,
    0,
  );

  const totalItems = Object.values(carrito).reduce((s, n) => s + n, 0);

  // ── Pago ────────────────────────────────────────────────────────────────────

  const handleConfirmar = async () => {
    if (!eventoActivo) {
      Alert.alert('Sin evento', 'No hay un evento activo en este momento.');
      return;
    }
    if (subtotal === 0) {
      Alert.alert('Carrito vacío', 'Agrega al menos un ítem antes de confirmar.');
      return;
    }
    setModalVisible(false);
    setEnviando(true);

    try {
      if (tab === 'entradas') {
        // Compra de entrada
        const cantidad = carrito[eventoActivo.id] || 1;
        await ventasApi.crear({
          evento_id: eventoActivo.id,
          tipo_venta: 'ENTRADA',
          items: [{ cantidad }],
          metodo_pago: 'app',
        });
        limpiarCarrito();
        Alert.alert(
          '🎟️ ¡Entrada comprada!',
          `Tu entrada para "${eventoActivo.nombre}" fue confirmada. Revisa tu QR en "Mis Pedidos".`,
          [{ text: 'Ver Mis Pedidos', onPress: () => navigation.navigate('MisPedidos') }],
        );
      } else {
        // Pedido de barra
        const items = Object.entries(carrito)
          .filter(([, cant]) => cant > 0)
          .map(([id, cantidad]) => ({ producto_id: Number(id), cantidad }));

        await ventasApi.crear({
          evento_id: eventoActivo.id,
          tipo_venta: 'BEBIDA',
          items,
          metodo_pago: 'app',
        });
        limpiarCarrito();
        Alert.alert(
          '🍹 ¡Pedido enviado!',
          'Tu pedido fue enviado a la barra. Sigue el estado en "Mis Pedidos".',
          [{ text: 'Ver Mis Pedidos', onPress: () => navigation.navigate('MisPedidos') }],
        );
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'No se pudo procesar tu pedido. Intenta nuevamente.';
      Alert.alert('Error', msg);
    } finally {
      setEnviando(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff2d75" />
        <Text style={styles.cargandoText}>Cargando disponibilidad…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Caja Virtual</Text>
        {eventoActivo && (
          <View style={styles.eventoBadge}>
            <Ionicons name="calendar" size={12} color="#ff2d75" />
            <Text style={styles.eventoText} numberOfLines={1}>
              {eventoActivo.nombre}
            </Text>
          </View>
        )}
      </View>

      {/* Sin eventos activos */}
      {!eventoActivo && (
        <View style={styles.sinEvento}>
          <Ionicons name="calendar-outline" size={48} color="#333" />
          <Text style={styles.sinEventoText}>No hay eventos activos en este momento</Text>
        </View>
      )}

      {eventoActivo && (
        <>
          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, tab === 'entradas' && styles.tabActive]}
              onPress={() => { setTab('entradas'); limpiarCarrito(); }}
            >
              <Ionicons
                name="ticket-outline"
                size={16}
                color={tab === 'entradas' ? '#ff2d75' : '#666'}
              />
              <Text style={[styles.tabText, tab === 'entradas' && styles.tabTextActive]}>
                ENTRADAS
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tab === 'barra' && styles.tabActive]}
              onPress={() => { setTab('barra'); limpiarCarrito(); }}
            >
              <Ionicons
                name="beer-outline"
                size={16}
                color={tab === 'barra' ? '#ff2d75' : '#666'}
              />
              <Text style={[styles.tabText, tab === 'barra' && styles.tabTextActive]}>
                BARRA
              </Text>
            </TouchableOpacity>
          </View>

          {/* Subtotal */}
          <View style={styles.subtotalBox}>
            <View>
              <Text style={styles.subtotalLabel}>TOTAL CARRITO</Text>
              {totalItems > 0 && (
                <Text style={styles.subtotalItems}>{totalItems} ítem{totalItems > 1 ? 's' : ''}</Text>
              )}
            </View>
            <Text style={styles.subtotalValue}>{CLP(subtotal)}</Text>
          </View>

          {/* Lista */}
          <ScrollView style={styles.lista} showsVerticalScrollIndicator={false}>
            {tab === 'barra' && productos.length === 0 && (
              <View style={styles.sinEvento}>
                <Text style={styles.sinEventoText}>No hay productos disponibles ahora</Text>
              </View>
            )}

            {itemsActivos.map((item) => (
              <View key={item.id} style={styles.item}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemNombre}>{item.nombre}</Text>
                  <Text style={styles.itemPrecio}>{CLP(item.precio)}</Text>
                  {tab === 'entradas' && (
                    <Text style={styles.itemHint}>Precio por persona</Text>
                  )}
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
                    style={[styles.btnCantidad, styles.btnSumar]}
                    onPress={() => cambiarCantidad(item.id, 1)}
                  >
                    <Text style={styles.btnCantidadText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={{ height: 120 }} />
          </ScrollView>

          {/* Botón de pago */}
          <TouchableOpacity
            style={[styles.btnPagar, (subtotal === 0 || enviando) && styles.btnPagarDisabled]}
            onPress={() => subtotal > 0 && setModalVisible(true)}
            disabled={subtotal === 0 || enviando}
          >
            {enviando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.btnPagarText}>
                  {tab === 'entradas' ? 'COMPRAR ENTRADAS' : 'PEDIR A LA BARRA'}
                  {subtotal > 0 && ` · ${CLP(subtotal)}`}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </>
      )}

      {/* Modal de confirmación */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {tab === 'entradas' ? '🎟️ Confirmar compra' : '🍹 Confirmar pedido'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {eventoActivo?.nombre}
            </Text>

            <View style={styles.modalDetalle}>
              {itemsActivos
                .filter((item) => (carrito[item.id] || 0) > 0)
                .map((item) => (
                  <View key={item.id} style={styles.modalItem}>
                    <Text style={styles.modalItemNombre}>
                      {carrito[item.id]}× {item.nombre}
                    </Text>
                    <Text style={styles.modalItemPrecio}>
                      {CLP(item.precio * (carrito[item.id] || 0))}
                    </Text>
                  </View>
                ))}
            </View>

            <View style={styles.modalTotal}>
              <Text style={styles.modalTotalLabel}>TOTAL</Text>
              <Text style={styles.modalTotalValue}>{CLP(subtotal)}</Text>
            </View>

            <Text style={styles.modalPago}>💳 Método: App (simulado)</Text>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancelar]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirmar]}
                onPress={handleConfirmar}
              >
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  cargandoText: { color: '#666', marginTop: 12, fontSize: 14 },

  header: { marginBottom: 16 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#fff', letterSpacing: 0.5 },
  eventoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4,
  },
  eventoText: { color: '#ff2d75', fontSize: 12, fontWeight: '600', flex: 1 },

  sinEvento: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60, gap: 12,
  },
  sinEventoText: { color: '#555', fontSize: 15, textAlign: 'center' },

  tabs: {
    flexDirection: 'row', backgroundColor: '#121212', borderRadius: 10,
    marginBottom: 16, padding: 4, borderWidth: 1, borderColor: '#1f1f1f',
  },
  tab: {
    flex: 1, padding: 11, alignItems: 'center', borderRadius: 8,
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  tabActive: { backgroundColor: '#1a1a1a' },
  tabText: { color: '#666', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 },
  tabTextActive: { color: '#ff2d75' },

  subtotalBox: {
    backgroundColor: '#121212', padding: 16, borderRadius: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 14, borderWidth: 1, borderColor: '#1f1f1f',
  },
  subtotalLabel: { color: '#aaa', fontWeight: 'bold', fontSize: 12, letterSpacing: 0.5 },
  subtotalItems: { color: '#555', fontSize: 11, marginTop: 2 },
  subtotalValue: { color: '#fff', fontWeight: 'bold', fontSize: 22 },

  lista: { flex: 1 },
  item: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#121212',
    padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#1f1f1f',
  },
  itemInfo: { flex: 1, paddingRight: 8 },
  itemNombre: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 3 },
  itemPrecio: { color: '#aaa', fontSize: 13, fontWeight: '500' },
  itemHint: { color: '#444', fontSize: 11, marginTop: 2 },

  controles: { flexDirection: 'row', alignItems: 'center' },
  btnCantidad: {
    width: 34, height: 34, backgroundColor: '#1a1a1a', borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333',
  },
  btnSumar: { borderColor: '#ff2d7544' },
  btnCantidadText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cantidad: {
    color: '#fff', fontSize: 16, fontWeight: 'bold',
    marginHorizontal: 12, minWidth: 22, textAlign: 'center',
  },

  btnPagar: {
    backgroundColor: '#ff2d75', padding: 16, borderRadius: 14, alignItems: 'center',
    marginTop: 10, flexDirection: 'row', justifyContent: 'center', gap: 8,
    shadowColor: '#ff2d75', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  btnPagarDisabled: { backgroundColor: '#3a1a22', shadowOpacity: 0 },
  btnPagarText: { color: '#fff', fontWeight: 'bold', fontSize: 15, letterSpacing: 0.5 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#141414', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, borderTopWidth: 1, borderColor: '#2a2a2a',
  },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  modalSubtitle: { color: '#ff2d75', fontSize: 13, marginBottom: 20 },
  modalDetalle: { gap: 10, marginBottom: 16 },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between' },
  modalItemNombre: { color: '#ccc', fontSize: 14, flex: 1 },
  modalItemPrecio: { color: '#fff', fontSize: 14, fontWeight: '600' },
  modalTotal: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderTopWidth: 1, borderColor: '#222', marginBottom: 8,
  },
  modalTotalLabel: { color: '#888', fontWeight: 'bold', letterSpacing: 0.5, fontSize: 13 },
  modalTotalValue: { color: '#fff', fontWeight: 'bold', fontSize: 24 },
  modalPago: { color: '#555', fontSize: 12, marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalBtn: {
    flex: 1, padding: 15, borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#333',
  },
  modalBtnCancelar: { backgroundColor: '#1a1a1a' },
  modalBtnConfirmar: { backgroundColor: '#ff2d75', borderColor: '#ff2d75' },
  modalBtnText: { color: '#ccc', fontWeight: '700', fontSize: 15 },
});