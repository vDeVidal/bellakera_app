import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Dimensions,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { api, buildImageUrl } from '../../api/client';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

// ── Tipos del backend real (Prisma) ───────────────────────────────────────────
// Los IDs de Prisma son números pequeños; los simulados son Date.now() > 1.7T
const ES_ID_REAL = (id: number) => id < 10_000_000;

interface MediaItem {
  // Campos del backend (Prisma Galeria model)
  id: number;           // PK real
  usuario_id: number;
  imagen_url: string;   // URL en servidor o vacío para simulados
  descripcion?: string | null;
  fecha: string;
  liked_by_me: boolean;
  likes_count: number;  // agregado por el service con _count
  usuario: {
    id: number;
    nombre?: string | null;
    avatar_url?: string | null;
  };
  evento?: { id: number; nombre: string } | null;

  // Extras locales (no vienen del backend)
  localUri?: string;    // URI real del dispositivo cuando es simulado
  esSimulado?: boolean;
}

export default function GaleriaScreen() {
  const navigation = useNavigation<any>();
  const isAdmin = useIsAdmin();
  const { usuario } = useAuth();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  // Modal caption
  const [modalCaption, setModalCaption] = useState(false);
  const [imagenPendiente, setImagenPendiente] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [subiendo, setSubiendo] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get('/galeria');
      // El service devuelve likes_count en _count si se incluye, sino calcular del array
      const normalizado = data.map((it: any) => ({
        ...it,
        likes_count: it.likes_count ?? it._count?.likes ?? 0,
      }));
      setItems(normalizado);
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

  // ── Elegir y subir imagen ────────────────────────────────────────────────────

  const elegirImagen = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permiso requerido', 'Necesitamos acceso a la galería.');
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return;
    setImagenPendiente(result.assets[0].uri);
    setCaption('');
    setModalCaption(true);
  };

  const confirmarSubida = async () => {
    if (!imagenPendiente) return;
    setSubiendo(true);

    try {
      const filename = imagenPendiente.split('/').pop() || 'foto.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';

      const formData = new FormData();
      formData.append('imagen', { uri: imagenPendiente, name: filename, type } as any);
      if (caption.trim()) formData.append('descripcion', caption.trim());

      const { data } = await api.post('/galeria', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Éxito real — añadir al feed con localUri para visualización inmediata
      const usuarioId = (usuario as any)?.id ?? (usuario as any)?.id_usuario ?? 99;
      const nuevoItem: MediaItem = {
        ...data,
        usuario: {
          id: usuarioId,
          nombre: usuario?.nombre ?? 'Tú',
          avatar_url: usuario?.foto_perfil_url ?? null,
        },
        localUri: imagenPendiente,
        likes_count: 0,
        liked_by_me: false,
      };
      setItems((prev) => [nuevoItem, ...prev]);
      Alert.alert('✅ Publicado', '¡Tu foto ya está en la galería!');

    } catch (e: any) {
      // Fallback simulado: usar URI local con ID no colisionante
      const usuarioId = (usuario as any)?.id ?? (usuario as any)?.id_usuario ?? 99;
      const nuevoSimulado: MediaItem = {
        id: Date.now(),              // ID grande → ES_ID_REAL() devuelve false
        usuario_id: usuarioId,
        imagen_url: '',
        localUri: imagenPendiente,   // ← imagen real del dispositivo
        descripcion: caption.trim() || null,
        fecha: new Date().toISOString(),
        liked_by_me: false,
        likes_count: 0,
        esSimulado: true,
        usuario: {
          id: usuarioId,
          nombre: usuario?.nombre ?? 'Tú',
          avatar_url: null,
        },
      };
      setItems((prev) => [nuevoSimulado, ...prev]);
      Alert.alert('✅ Publicado', 'Imagen visible en la galería (modo local).');
    } finally {
      setSubiendo(false);
      setModalCaption(false);
      setImagenPendiente(null);
      setCaption('');
    }
  };

  // ── Like ──────────────────────────────────────────────────────────────────────

  const toggleLike = async (id: number) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? {
              ...it,
              liked_by_me: !it.liked_by_me,
              likes_count: it.likes_count + (it.liked_by_me ? -1 : 1),
            }
          : it,
      ),
    );

    // Solo llamar al backend si el ID es real (no simulado)
    if (!ES_ID_REAL(id)) return;

    try {
      await api.post(`/galeria/${id}/like`);
    } catch {
      // Revertir si falló
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? {
                ...it,
                liked_by_me: !it.liked_by_me,
                likes_count: it.likes_count + (it.liked_by_me ? 1 : -1),
              }
            : it,
        ),
      );
    }
  };

  // ── Eliminar ──────────────────────────────────────────────────────────────────

  const eliminar = (item: MediaItem) => {
    Alert.alert('Eliminar imagen', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          setItems((prev) => prev.filter((i) => i.id !== item.id));
          if (ES_ID_REAL(item.id)) {
            try { await api.delete(`/galeria/${item.id}`); } catch { /* silencioso */ }
          }
        },
      },
    ]);
  };

  // ── Render item ───────────────────────────────────────────────────────────────

  const renderItem = ({ item }: { item: MediaItem }) => {
    const miUsuarioId = (usuario as any)?.id ?? (usuario as any)?.id_usuario;
    const esMia = !isAdmin && miUsuarioId === item.usuario_id;
    const puedeEliminar = isAdmin || esMia;
    const autor = item.usuario?.nombre ?? 'Anónimo';

    // Fuente de imagen: localUri primero, luego URL del backend
    const imageSource = item.localUri
      ? { uri: item.localUri }
      : item.imagen_url
        ? { uri: buildImageUrl(item.imagen_url) }
        : null;

    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={18} color="#888" />
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

        {imageSource ? (
          <Image source={imageSource} style={styles.foto} resizeMode="cover" />
        ) : (
          <View style={[styles.foto, styles.fotoPlaceholder]}>
            <Ionicons name="image-outline" size={48} color="#333" />
          </View>
        )}

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => toggleLike(item.id)} style={styles.likeBtn}>
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

  // ── UI ────────────────────────────────────────────────────────────────────────

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
        keyExtractor={(it) => String(it.id)}   // usa 'id' real, no 'id_media'
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
        <TouchableOpacity style={styles.fab} onPress={elegirImagen}>
          <Ionicons name="camera" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Modal de caption */}
      <Modal visible={modalCaption} animationType="slide" transparent onRequestClose={() => setModalCaption(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBox}>
            {imagenPendiente && (
              <Image source={{ uri: imagenPendiente }} style={styles.preview} resizeMode="cover" />
            )}
            <Text style={styles.modalTitle}>Agrega un caption</Text>
            <TextInput
              style={styles.captionInput}
              placeholder="Escribe algo sobre esta foto…"
              placeholderTextColor="#555"
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={200}
            />
            <Text style={styles.captionCount}>{caption.length}/200</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btnCancelar} onPress={() => { setModalCaption(false); setImagenPendiente(null); }}>
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnPublicar, subiendo && { opacity: 0.6 }]}
                onPress={confirmarSubida}
                disabled={subiendo}
              >
                {subiendo
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.btnPublicarText}>Publicar 🚀</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  card: { backgroundColor: '#111', marginBottom: 14, paddingBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#222',
    justifyContent: 'center', alignItems: 'center',
  },
  autor: { color: '#fff', fontWeight: '700', fontSize: 14 },
  eventoTag: { color: '#ff2d75', fontSize: 11, marginTop: 1 },
  foto: { width, height: width, backgroundColor: '#222' },
  fotoPlaceholder: { justifyContent: 'center', alignItems: 'center' },
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

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#141414', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36,
  },
  preview: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  captionInput: {
    backgroundColor: '#1e1e1e', borderRadius: 12, padding: 14,
    color: '#fff', fontSize: 15, minHeight: 80, textAlignVertical: 'top',
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  captionCount: { color: '#444', fontSize: 11, textAlign: 'right', marginTop: 4, marginBottom: 16 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  btnCancelar: {
    flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#1e1e1e', borderWidth: 1, borderColor: '#2a2a2a',
  },
  btnCancelarText: { color: '#888', fontWeight: '700' },
  btnPublicar: {
    flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#ff2d75',
    shadowColor: '#ff2d75', shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  btnPublicarText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});