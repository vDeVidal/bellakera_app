import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  Image, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { api } from '../../api/client';
import { colors } from '../../theme/colors';

interface Evento {
  id_evento: number;
  nombre: string;
  descripcion?: string;
  flyer_url?: string;
  fecha_evento: string;
  estado: string;
}

export default function EventosScreen() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get<Evento[]>('/eventos');
      setEventos(data);
    } catch (e) {
      console.log('Error eventos:', e);
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const onRefresh = () => {
    setRefreshing(true);
    cargar();
  };

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Próximos Eventos</Text>
      <FlatList
        data={eventos}
        keyExtractor={(item) => item.id_evento.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aún no hay eventos programados 🎉</Text>
            <Text style={styles.emptySubtext}>Desliza hacia abajo para actualizar</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            {item.flyer_url ? (
              <Image source={{ uri: item.flyer_url }} style={styles.flyer} />
            ) : (
              <View style={[styles.flyer, styles.flyerPlaceholder]}>
                <Text style={styles.flyerPlaceholderText}>🎉</Text>
              </View>
            )}
            <View style={styles.cardContent}>
              <Text style={styles.eventoNombre}>{item.nombre}</Text>
              <Text style={styles.eventoFecha}>
                📅 {new Date(item.fecha_evento).toLocaleDateString('es-CL', {
                  weekday: 'long', day: 'numeric', month: 'long',
                })}
              </Text>
              {item.descripcion && (
                <Text style={styles.eventoDescripcion} numberOfLines={3}>
                  {item.descripcion}
                </Text>
              )}
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.estado.toUpperCase()}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  titulo: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: 16 },
  card: {
    backgroundColor: colors.card, borderRadius: 12, marginBottom: 16,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  flyer: { width: '100%', height: 200, backgroundColor: colors.backgroundLight },
  flyerPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  flyerPlaceholderText: { fontSize: 60 },
  cardContent: { padding: 16 },
  eventoNombre: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 6 },
  eventoFecha: { color: colors.accent, fontSize: 14, marginBottom: 8 },
  eventoDescripcion: { color: colors.textMuted, fontSize: 14, marginBottom: 12 },
  badge: {
    backgroundColor: colors.primary, alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { color: colors.text, fontSize: 16, marginBottom: 8 },
  emptySubtext: { color: colors.textMuted, fontSize: 12 },
});