import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api, buildImageUrl } from '../../api/client';
import { useIsAdmin } from '../../hooks/useIsAdmin';

export default function EventoDetalleScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const isAdmin = useIsAdmin();
  const { id } = route.params;

  const [evento, setEvento] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    try {
      const { data } = await api.get(`/eventos/${id}`);
      setEvento(data);
    } catch (e) {
      Alert.alert('Error', 'No se pudo cargar el evento');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener('focus', cargar);
    return unsub;
  }, [navigation]);

  const eliminar = () => {
    Alert.alert('Eliminar evento', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/eventos/${id}`);
            navigation.goBack();
          } catch {
            Alert.alert('Error', 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  if (cargando || !evento) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff2d75" />
      </View>
    );
  }

  const fecha = new Date(evento.fecha_evento).toLocaleString('es-CL', {
    dateStyle: 'full', timeStyle: 'short',
  });

  return (
    <ScrollView style={styles.container}>
      {evento.flyer_url && (
        <Image source={{ uri: buildImageUrl(evento.flyer_url) }} style={styles.flyer} />
      )}

      <View style={styles.content}>
        <Text style={styles.nombre}>{evento.nombre}</Text>
        <Text style={styles.fecha}>📅 {fecha}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{evento.estado.toUpperCase()}</Text>
        </View>

        {evento.descripcion && (
          <Text style={styles.desc}>{evento.descripcion}</Text>
        )}

        {isAdmin && (
          <View style={styles.adminActions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnEdit]}
              onPress={() => navigation.navigate('EventoForm', { modo: 'editar', evento })}
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
              <Text style={styles.btnText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnDelete]} onPress={eliminar}>
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.btnText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  flyer: { width: '100%', height: 320, backgroundColor: '#222' },
  content: { padding: 20 },
  nombre: { color: '#fff', fontSize: 26, fontWeight: '800' },
  fecha: { color: '#ff2d75', fontSize: 14, marginTop: 6 },
  badge: {
    alignSelf: 'flex-start', marginTop: 10,
    backgroundColor: '#ff2d7522', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  badgeText: { color: '#ff2d75', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  desc: { color: '#ddd', fontSize: 15, marginTop: 20, lineHeight: 22 },
  adminActions: { flexDirection: 'row', marginTop: 30, gap: 12 },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 10, gap: 6,
  },
  btnEdit: { backgroundColor: '#3b82f6' },
  btnDelete: { backgroundColor: '#dc2626' },
  btnText: { color: '#fff', fontWeight: '700' },
});