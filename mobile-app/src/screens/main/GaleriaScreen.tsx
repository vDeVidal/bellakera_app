import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { api, buildImageUrl } from '../../api/client';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

interface MediaItem {
  id_media: number;
  id_usuario: number;
  url: string;
  descripcion?: string;
  likes_count: number;
  liked_by_me: boolean;
  fecha_subida: string;
  usuario: {
    id_usuario: number;
    nombre?: string;
    apellido?: string;
    foto_perfil_url?: string;
  };
  evento?: { id_evento: number; nombre: string };
}

export default function GaleriaScreen() {
  const navigation = useNavigation<any>();
  const isAdmin = useIsAdmin();
  const { usuario } = useAuth();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get('/galeria');
      setItems(data);
    } catch (e) {
      console.log('Error cargando galería:', e);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', cargar);
    return unsub;
  }, [navigation, cargar]);

  const subirImagen = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permiso requerido');
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets[0]) return;

    try {
      const uri = result.assets[0].uri;
      const name = uri.split('/').pop() || 'foto.jpg';
      const match = /\.(\w+)$/.exec(name);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      const formData = new FormData();
      formData.append('imagen', { uri, name, type } as any);

      await api.post('/galeria', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      cargar();
    } catch (e: any) {
      console.log('Error subiendo:', e?.response?.data || e.message);
      Alert.alert('Error', 'No se pudo subir la imagen');
    }
  };

  const toggleLike = async (id: number) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((it) =>
        it.id_media === id
          ? {
              ...it,
              liked_by_me: !it.liked_by_me,
              likes_count: it.likes_count + (it.liked_by_me ? -1 : 1),
            }
          : it,
      ),
    );
    try {
      await api.post(`/galeria/${id}/like`);
    } catch {
      cargar(); // revertir desde backend si falla
    }
  };

  const eliminar = (item: MediaItem) => {
    Alert.alert('Eliminar imagen', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/galeria/${item.id_media}`);
            setItems((prev) => prev.filter((i) => i.id_media !== item.id_media));
          } catch {
            Alert.alert('Error', 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: MediaItem }) => {
    const esMia = !isAdmin && usuario?.id_usuario === item.id_usuario;
    const puedeEliminar = isAdmin || esMia;
    const autor = `${item.usuario.nombre || ''} ${item.usuario.apellido || ''}`.trim() || 'Anónimo';

    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            {item.usuario.foto_perfil_url ? (
              <Image source={{ uri: buildImageUrl(item.usuario.foto_perfil_url) }} style={styles.avatarImg} />
            ) : (
              <Ionicons name="person" size={18} color="#888" />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.autor}>{autor}</Text>
            {item.evento && (
              <Text style={styles.eventoTag}>📍 {item.evento.nombre}</Text>
            )}
          </View>
          {puedeEliminar && (
            <TouchableOpacity onPress={() => eliminar(item)} style={{ padding: 6 }}>
              <Ionicons
                name={isAdmin && !esMia ? 'shield' : 'trash-outline'}
                size={20}
                color={isAdmin && !esMia ? '#ff2d75' : '#888'}
              />
            </TouchableOpacity>
          )}
        </View>

        <Image source={{ uri: buildImageUrl(item.url) }} style={styles.foto} />

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => toggleLike(item.id_media)} style={styles.likeBtn}>
            <Ionicons
              name={item.liked_by_me ? 'heart' : 'heart-outline'}
              size={26}
              color={item.liked_by_me ? '#ff2d75' : '#fff'}
            />
            <Text style={styles.likeCount}>{item.likes_count}</Text>
          </TouchableOpacity>
          {item.descripcion ? (
            <Text style={styles.desc} numberOfLines={2}>{item.descripcion}</Text>
          ) : null}
        </View>
      </View>
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
        data={items}
        keyExtractor={(it) => it.id_media.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 12, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={styles.vacio}>Aún no hay fotos. ¡Sé el primero!</Text>}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => { setRefrescando(true); cargar(); }}
            tintColor="#ff2d75"
          />
        }
      />

      {!isAdmin && (
        <TouchableOpacity style={styles.fab} onPress={subirImagen}>
          <Ionicons name="camera" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  card: { backgroundColor: '#111', marginBottom: 14, paddingBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#222',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  autor: { color: '#fff', fontWeight: '700', fontSize: 14 },
  eventoTag: { color: '#ff2d75', fontSize: 11, marginTop: 1 },
  foto: { width, height: width, backgroundColor: '#222' },
  footer: { paddingHorizontal: 12, paddingTop: 8 },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  likeCount: { color: '#fff', fontSize: 14, fontWeight: '600' },
  desc: { color: '#ccc', marginTop: 6, fontSize: 13 },
  vacio: { color: '#666', textAlign: 'center', marginTop: 60 },
  fab: {
    position: 'absolute', right: 20, bottom: 24,
    backgroundColor: '#ff2d75', width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#ff2d75', shadowOpacity: 0.6, shadowRadius: 10, elevation: 6,
  },
});