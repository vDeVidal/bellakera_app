import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api, buildImageUrl } from '../../api/client';
import { useIsAdmin } from '../../hooks/useIsAdmin';

interface Evento {
  id_evento: number;
  nombre: string;
  descripcion?: string;
  flyer_url?: string;
  fecha_evento: string;
  estado: string;
}

export default function EventosScreen() {
  const navigation = useNavigation<any>();
  const isAdmin = useIsAdmin();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get('/eventos');
      setEventos(data);
    } catch (e) {
      console.log('Error cargando eventos:', e);
      Alert.alert('Error', 'No se pudieron cargar los eventos');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', cargar);
    return unsub;
  }, [navigation, cargar]);

  const renderItem = ({ item }: { item: Evento }) => {
    const fecha = new Date(item.fecha_evento);
    const fechaTexto = fecha.toLocaleDateString('es-CL', {
      day: '2-digit', month: 'short', year: 'numeric',
    });

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('EventoDetalle', { id: item.id_evento })}
        activeOpacity={0.85}
      >
        {item.flyer_url ? (
          <Image source={{ uri: buildImageUrl(item.flyer_url) }} style={styles.flyer} />
        ) : (
          <View style={[styles.flyer, styles.flyerPlaceholder]}>
            <Ionicons name="image-outline" size={48} color="#666" />
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.nombre} numberOfLines={1}>{item.nombre}</Text>
          <Text style={styles.fecha}>{fechaTexto}</Text>
          {item.descripcion ? (
            <Text style={styles.desc} numberOfLines={2}>{item.descripcion}</Text>
          ) : null}
          <View style={styles.estadoBadge}>
            <Text style={styles.estadoText}>{item.estado.toUpperCase()}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff2d75" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={eventos}
        keyExtractor={(it) => it.id_evento.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <Text style={styles.vacio}>No hay eventos todavía.</Text>
        }
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => { setRefrescando(true); cargar(); }}
            tintColor="#ff2d75"
          />
        }
      />

      {isAdmin && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('EventoForm', { modo: 'crear' })}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  card: {
    backgroundColor: '#1a1a1a', borderRadius: 16, marginBottom: 16, overflow: 'hidden',
  },
  flyer: { width: '100%', height: 220, backgroundColor: '#222' },
  flyerPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  info: { padding: 14 },
  nombre: { color: '#fff', fontSize: 18, fontWeight: '700' },
  fecha: { color: '#ff2d75', fontSize: 13, marginTop: 2 },
  desc: { color: '#bbb', fontSize: 14, marginTop: 6 },
  estadoBadge: {
    alignSelf: 'flex-start', marginTop: 10,
    backgroundColor: '#ff2d7522', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  estadoText: { color: '#ff2d75', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  vacio: { color: '#666', textAlign: 'center', marginTop: 60 },
  fab: {
    position: 'absolute', right: 20, bottom: 24,
    backgroundColor: '#ff2d75', width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#ff2d75', shadowOpacity: 0.6, shadowRadius: 10, elevation: 6,
  },
});