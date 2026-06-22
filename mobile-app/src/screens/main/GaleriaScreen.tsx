import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/client';
import { colors } from '../../theme/colors';

interface MediaItem {
  id_media: number;
  url: string;
  tipo: string;
  descripcion?: string;
  likes_count: number;
  fecha_subida: string;
  usuario: {
    nombre?: string;
    foto_perfil_url?: string;
  };
}

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48) / 2;

export default function GaleriaScreen() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get<MediaItem[]>('/galeria');
      setMedia(data);
    } catch (e) {
      console.log('Error galería:', e);
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

  const handleSubir = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (result.canceled) return;

    setSubiendo(true);
    try {
      // ⚠️ En producción aquí deberías subir a S3/Cloudinary y obtener la URL real
      // Por ahora usamos la URI local como demo
      const uri = result.assets[0].uri;
      await api.post('/galeria', {
        url: uri,
        tipo: 'foto',
        descripcion: 'Subido desde la app',
      });
      Alert.alert('¡Listo!', 'Foto subida correctamente');
      cargar();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo subir');
    } finally {
      setSubiendo(false);
    }
  };

  const handleLike = async (id: number) => {
    try {
      await api.post(`/galeria/${id}/like`);
      cargar();
    } catch (e) {
      console.log('Error like:', e);
    }
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
      <View style={styles.header}>
        <Text style={styles.titulo}>Galería</Text>
        <TouchableOpacity
          style={styles.btnSubir}
          onPress={handleSubir}
          disabled={subiendo}
        >
          <Ionicons name="cloud-upload" size={20} color="#fff" />
          <Text style={styles.btnSubirText}>
            {subiendo ? 'Subiendo...' : 'Subir foto'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={media}
        keyExtractor={(item) => item.id_media.toString()}
        numColumns={2}
        columnWrapperStyle={{ gap: 8 }}
        contentContainerStyle={{ gap: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Aún no hay fotos. ¡Sé el primero! 📸</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.mediaCard}>
            <Image source={{ uri: item.url }} style={styles.mediaImg} />
            <TouchableOpacity
              style={styles.likeBtn}
              onPress={() => handleLike(item.id_media)}
            >
              <Ionicons name="heart" size={18} color={colors.primary} />
              <Text style={styles.likeText}>{item.likes_count}</Text>
            </TouchableOpacity>
            {item.usuario.nombre && (
              <Text style={styles.userName} numberOfLines={1}>
                {item.usuario.nombre}
              </Text>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  btnSubir: {
    flexDirection: 'row', backgroundColor: colors.primary, padding: 10, borderRadius: 8,
    alignItems: 'center', gap: 6,
  },
  btnSubirText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  mediaCard: { width: ITEM_SIZE, backgroundColor: colors.card, borderRadius: 10, overflow: 'hidden' },
  mediaImg: { width: '100%', height: ITEM_SIZE, backgroundColor: colors.backgroundLight },
  likeBtn: {
    position: 'absolute', bottom: 30, right: 8, flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 6, alignItems: 'center', gap: 4,
  },
  likeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  userName: { color: colors.textMuted, fontSize: 11, padding: 6 },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: 14 },
});