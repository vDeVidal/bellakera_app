import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import QRCode from 'react-native-qrcode-svg';
import { ventasApi, Venta } from '../../api/ventas';

// ─── Notificaciones ───────────────────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function pedirPermisosNotif() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('pedidos', {
      name: 'Estado de Pedidos',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#ff2d75',
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function notificarCambioEstado(nombreEstado: string) {
  const mensajes: Record<string, { titulo: string; cuerpo: string }> = {
    preparando: { titulo: '🍹 Tu pedido está en preparación', cuerpo: '¡El barman ya está trabajando en tu pedido!' },
    listo: { titulo: '✅ ¡Tu pedido está listo!', cuerpo: 'Pasa a retirar tu pedido a la barra.' },
    entregado: { titulo: '🎉 Pedido entregado', cuerpo: '¡Que lo disfrutes!' },
    cancelado: { titulo: '❌ Pedido cancelado', cuerpo: 'Tu pedido fue cancelado. Contacta al staff.' },
  };
  const msg = mensajes[nombreEstado];
  if (!msg) return;
  await Notifications.scheduleNotificationAsync({
    content: { title: msg.titulo, body: msg.cuerpo, sound: true },
    trigger: null,
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CLP = (v: number) => `$${v.toLocaleString('es-CL')}`;

const ESTADO_CONFIG: Record<string, { label: string; color: string; icon: string; bg: string }> = {
  pendiente:   { label: 'Pendiente',   color: '#f59e0b', icon: 'time-outline',         bg: '#2a2200' },
  preparando:  { label: 'Preparando',  color: '#3b82f6', icon: 'build-outline',         bg: '#001730' },
  listo:       { label: '¡Listo!',     color: '#22c55e', icon: 'checkmark-circle-outline', bg: '#002010' },
  entregado:   { label: 'Entregado',   color: '#a855f7', icon: 'bag-check-outline',    bg: '#1a0030' },
  pagado:      { label: 'Pagado',      color: '#ec4899', icon: 'card-outline',          bg: '#2a0020' },
  cancelado:   { label: 'Cancelado',   color: '#ef4444', icon: 'close-circle-outline',  bg: '#2a0000' },
};

function formatRelative(fechaStr: string) {
  const diff = Date.now() - new Date(fechaStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Hace un momento';
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  return `Hace ${h}h ${min % 60}m`;
}

type Seccion = 'pedidos' | 'entradas';

// ─── Componente ───────────────────────────────────────────────────────────────

export default function MisPedidosScreen() {
  const navigation = useNavigation<any>();

  const [ventas, setVentas] = useState<Venta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [seccion, setSeccion] = useState<Seccion>('pedidos');
  const [qrVisible, setQrVisible] = useState<string | null>(null); // qr_code string

  // Referencia para detectar cambios de estado entre polls
  const estadosRef = useRef<Record<number, string>>({});

  // ── Carga y polling ─────────────────────────────────────────────────────────

  const cargar = useCallback(async (silente = false) => {
    if (!silente) { setCargando(true); }
    try {
      const data = await ventasApi.misVentas();
      setVentas(data);

      // Detectar cambios de estado y notificar
      const nuevosEstados: Record<number, string> = {};
      for (const v of data) {
        nuevosEstados[v.id] = v.estado;
        const prev = estadosRef.current[v.id];
        if (prev && prev !== v.estado && v.tipo_venta === 'BEBIDA') {
          await notificarCambioEstado(v.estado).catch(() => {});
        }
      }
      estadosRef.current = nuevosEstados;
    } catch {
      if (!silente) Alert.alert('Error', 'No se pudieron cargar tus pedidos.');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  // Pedir permisos de notificaciones al montar
  useEffect(() => {
    pedirPermisosNotif().catch(() => {});
  }, []);

  // Focus listener
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => cargar(false));
    return unsub;
  }, [navigation, cargar]);

  // Polling cada 5 segundos (solo pedidos activos)
  useEffect(() => {
    const activos = ventas.filter(
      (v) => v.tipo_venta === 'BEBIDA' && ['pendiente', 'preparando', 'listo'].includes(v.estado),
    );
    if (activos.length === 0) return;

    const timer = setInterval(() => cargar(true), 5000);
    return () => clearInterval(timer);
  }, [ventas, cargar]);

  // ── Separar ventas ──────────────────────────────────────────────────────────

  const pedidosBarra = ventas.filter((v) => v.tipo_venta === 'BEBIDA');
  const misEntradas  = ventas.filter((v) => v.tipo_venta === 'ENTRADA');

  // ── Render helpers ───────────────────────────────────────────────────────────

  const renderEstadoBadge = (estado: string) => {
    const cfg = ESTADO_CONFIG[estado] ?? ESTADO_CONFIG.pendiente;
    return (
      <View style={[styles.estadoBadge, { backgroundColor: cfg.bg, borderColor: cfg.color + '44' }]}>
        <Ionicons name={cfg.icon as any} size={13} color={cfg.color} />
        <Text style={[styles.estadoText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
    );
  };

  const renderPedido = (venta: Venta) => {
    const cfg = ESTADO_CONFIG[venta.estado] ?? ESTADO_CONFIG.pendiente;
    const activo = ['pendiente', 'preparando'].includes(venta.estado);

    return (
      <View key={venta.id} style={[styles.card, activo && { borderColor: cfg.color + '33' }]}>
        {/* Barra lateral de color */}
        <View style={[styles.barraEstado, { backgroundColor: cfg.color }]} />

        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              {renderEstadoBadge(venta.estado)}
              <Text style={styles.cardFecha}>{formatRelative(venta.fecha)}</Text>
            </View>
            <Text style={styles.cardTotal}>{CLP(Number(venta.total))}</Text>
          </View>

          {/* Items */}
          <View style={styles.items}>
            {venta.detalles.map((d, i) => (
              <View key={i} style={styles.itemRow}>
                <Text style={styles.itemCant}>{d.cantidad}×</Text>
                <Text style={styles.itemNombre} numberOfLines={1}>{d.nombre_snapshot}</Text>
                <Text style={styles.itemSubtotal}>{CLP(Number(d.subtotal))}</Text>
              </View>
            ))}
          </View>

          {/* Notas */}
          {venta.notas ? (
            <Text style={styles.notas}>📝 {venta.notas}</Text>
          ) : null}

          {/* Evento */}
          {venta.evento && (
            <Text style={styles.eventoChip}>🎵 {venta.evento.nombre}</Text>
          )}
        </View>
      </View>
    );
  };

  const renderEntrada = (venta: Venta) => {
    const usada = venta.qr_escaneado;
    return (
      <View key={venta.id} style={[styles.card, usada && styles.cardUsada]}>
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.entradaNombre} numberOfLines={2}>
                {venta.detalles[0]?.nombre_snapshot ?? 'Entrada'}
              </Text>
              <Text style={styles.cardFecha}>{new Date(venta.fecha).toLocaleDateString('es-CL', { dateStyle: 'medium' })}</Text>
            </View>
            <View style={styles.qrWrapper}>
              {venta.qr_code ? (
                <TouchableOpacity onPress={() => setQrVisible(venta.qr_code)}>
                  <QRCode
                    value={venta.qr_code}
                    size={72}
                    backgroundColor="#0a0a0a"
                    color={usada ? '#444' : '#fff'}
                  />
                  <Text style={styles.qrHint}>TAP para ampliar</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.qrPlaceholder}>
                  <Ionicons name="qr-code" size={36} color="#333" />
                </View>
              )}
            </View>
          </View>

          {usada ? (
            <View style={styles.usadaBadge}>
              <Ionicons name="checkmark-done-circle" size={14} color="#666" />
              <Text style={styles.usadaText}>Entrada ya utilizada</Text>
            </View>
          ) : (
            <View style={styles.validaBadge}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#22c55e" />
              <Text style={styles.validaText}>Entrada válida — Muestra el QR en la puerta</Text>
            </View>
          )}

          {venta.evento && (
            <Text style={styles.eventoChip}>🎵 {venta.evento.nombre}</Text>
          )}
        </View>
      </View>
    );
  };

  // ── UI Principal ─────────────────────────────────────────────────────────────

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff2d75" />
        <Text style={styles.cargandoText}>Cargando tus pedidos…</Text>
      </View>
    );
  }

  const dataActual = seccion === 'pedidos' ? pedidosBarra : misEntradas;
  const pedidosActivos = pedidosBarra.filter((v) => ['pendiente', 'preparando'].includes(v.estado)).length;

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Mis Pedidos</Text>
        {pedidosActivos > 0 && (
          <View style={styles.activoBadge}>
            <View style={styles.activoPulse} />
            <Text style={styles.activoText}>{pedidosActivos} activo{pedidosActivos > 1 ? 's' : ''}</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, seccion === 'pedidos' && styles.tabActive]}
          onPress={() => setSeccion('pedidos')}
        >
          <Ionicons name="beer-outline" size={15} color={seccion === 'pedidos' ? '#ff2d75' : '#666'} />
          <Text style={[styles.tabText, seccion === 'pedidos' && styles.tabTextActive]}>
            BARRA {pedidosBarra.length > 0 ? `(${pedidosBarra.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, seccion === 'entradas' && styles.tabActive]}
          onPress={() => setSeccion('entradas')}
        >
          <Ionicons name="ticket-outline" size={15} color={seccion === 'entradas' ? '#ff2d75' : '#666'} />
          <Text style={[styles.tabText, seccion === 'entradas' && styles.tabTextActive]}>
            ENTRADAS {misEntradas.length > 0 ? `(${misEntradas.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Info de polling */}
      {seccion === 'pedidos' && pedidosActivos > 0 && (
        <View style={styles.pollingInfo}>
          <View style={styles.pollingDot} />
          <Text style={styles.pollingText}>Actualizando en tiempo real cada 5 segundos</Text>
        </View>
      )}

      {/* Lista */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => { setRefrescando(true); cargar(false); }}
            tintColor="#ff2d75"
          />
        }
      >
        {dataActual.length === 0 ? (
          <View style={styles.vacio}>
            <Ionicons
              name={seccion === 'pedidos' ? 'beer-outline' : 'ticket-outline'}
              size={56} color="#222"
            />
            <Text style={styles.vacioTitulo}>
              {seccion === 'pedidos' ? 'Sin pedidos aún' : 'Sin entradas aún'}
            </Text>
            <Text style={styles.vacioSub}>
              {seccion === 'pedidos'
                ? 'Pide algo desde la pestaña "Ventas" y lo verás aquí.'
                : 'Compra tu entrada desde la pestaña "Ventas".'}
            </Text>
            <TouchableOpacity
              style={styles.irBtnComprar}
              onPress={() => navigation.navigate('Entradas')}
            >
              <Text style={styles.irBtnText}>Ir a comprar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {seccion === 'pedidos'
              ? pedidosBarra.map(renderPedido)
              : misEntradas.map(renderEntrada)}
            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>

      {/* Modal QR ampliado */}
      {qrVisible && (
        <TouchableOpacity
          style={styles.qrModal}
          activeOpacity={1}
          onPress={() => setQrVisible(null)}
        >
          <View style={styles.qrModalCard}>
            <Text style={styles.qrModalTitle}>Tu código de acceso</Text>
            <View style={styles.qrModalBox}>
              <QRCode value={qrVisible} size={220} backgroundColor="#fff" color="#000" />
            </View>
            <Text style={styles.qrModalCode}>{qrVisible}</Text>
            <Text style={styles.qrModalHint}>Muestra este código en la puerta</Text>
            <TouchableOpacity style={styles.qrModalClose} onPress={() => setQrVisible(null)}>
              <Text style={styles.qrModalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  cargandoText: { color: '#666', marginTop: 12 },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#fff', letterSpacing: 0.5, flex: 1 },
  activoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#2a0010', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: '#ff2d7544',
  },
  activoPulse: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#ff2d75' },
  activoText: { color: '#ff2d75', fontSize: 12, fontWeight: '700' },

  tabs: {
    flexDirection: 'row', backgroundColor: '#121212', borderRadius: 10,
    marginBottom: 12, padding: 4, borderWidth: 1, borderColor: '#1f1f1f',
  },
  tab: {
    flex: 1, padding: 11, alignItems: 'center', borderRadius: 8,
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  tabActive: { backgroundColor: '#1a1a1a' },
  tabText: { color: '#666', fontWeight: 'bold', fontSize: 12, letterSpacing: 0.5 },
  tabTextActive: { color: '#ff2d75' },

  pollingInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, marginBottom: 8,
  },
  pollingDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e',
  },
  pollingText: { color: '#22c55e', fontSize: 11, opacity: 0.8 },

  // Tarjeta
  card: {
    flexDirection: 'row', backgroundColor: '#111', borderRadius: 14,
    marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#1f1f1f',
  },
  cardUsada: { opacity: 0.6 },
  barraEstado: { width: 4 },
  cardBody: { flex: 1, padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardFecha: { color: '#555', fontSize: 11, marginTop: 5 },
  cardTotal: { color: '#fff', fontWeight: 'bold', fontSize: 18 },

  estadoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1,
  },
  estadoText: { fontSize: 12, fontWeight: '700' },

  items: { gap: 5, marginBottom: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemCant: { color: '#ff2d75', fontWeight: '700', fontSize: 13, width: 22 },
  itemNombre: { color: '#ccc', fontSize: 13, flex: 1 },
  itemSubtotal: { color: '#888', fontSize: 12 },

  notas: { color: '#666', fontSize: 12, marginTop: 4 },
  eventoChip: { color: '#444', fontSize: 11, marginTop: 8 },

  // Entradas
  entradaNombre: { color: '#fff', fontWeight: '700', fontSize: 16, marginBottom: 4 },
  qrWrapper: { alignItems: 'center' },
  qrHint: { color: '#444', fontSize: 9, textAlign: 'center', marginTop: 4 },
  qrPlaceholder: {
    width: 72, height: 72, backgroundColor: '#1a1a1a',
    justifyContent: 'center', alignItems: 'center', borderRadius: 8,
  },
  usadaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 10, backgroundColor: '#1a1a1a', padding: 8, borderRadius: 8,
  },
  usadaText: { color: '#555', fontSize: 12 },
  validaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 10, backgroundColor: '#001510', padding: 8, borderRadius: 8,
    borderWidth: 1, borderColor: '#22c55e33',
  },
  validaText: { color: '#22c55e', fontSize: 12, flex: 1 },

  // Vacío
  vacio: {
    alignItems: 'center', paddingVertical: 60, gap: 12,
  },
  vacioTitulo: { color: '#444', fontSize: 18, fontWeight: '700' },
  vacioSub: { color: '#333', fontSize: 13, textAlign: 'center', paddingHorizontal: 30 },
  irBtnComprar: {
    marginTop: 8, backgroundColor: '#ff2d75', paddingHorizontal: 24,
    paddingVertical: 12, borderRadius: 10,
  },
  irBtnText: { color: '#fff', fontWeight: '700' },

  // Modal QR
  qrModal: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center',
  },
  qrModalCard: {
    backgroundColor: '#111', borderRadius: 24, padding: 28, alignItems: 'center',
    borderWidth: 1, borderColor: '#2a2a2a', width: '85%',
  },
  qrModalTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 20 },
  qrModalBox: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
  },
  qrModalCode: { color: '#555', fontSize: 11, letterSpacing: 1, marginBottom: 8 },
  qrModalHint: { color: '#888', fontSize: 13, textAlign: 'center', marginBottom: 24 },
  qrModalClose: {
    backgroundColor: '#ff2d75', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 10,
  },
  qrModalCloseText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
