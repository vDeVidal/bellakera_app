import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity,
  Image, Alert, Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { api, buildImageUrl } from '../../api/client';

export default function EventoFormScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { modo, evento } = route.params || { modo: 'crear' };
  const esEdicion = modo === 'editar';

  const [nombre, setNombre] = useState(evento?.nombre || '');
  const [descripcion, setDescripcion] = useState(evento?.descripcion || '');
  const [fecha, setFecha] = useState(
    evento?.fecha_evento ? new Date(evento.fecha_evento).toISOString().slice(0, 16) : ''
  );
  const [estado, setEstado] = useState(evento?.estado || 'proximo');
  const [imagenLocal, setImagenLocal] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const elegirImagen = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      aspect: [3, 4],
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImagenLocal(result.assets[0].uri);
    }
  };

  const guardar = async () => {
    if (!nombre.trim()) {
      return Alert.alert('Falta nombre');
    }
    if (!fecha) {
      return Alert.alert('Falta fecha');
    }

    setGuardando(true);
    try {
      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('descripcion', descripcion);
      formData.append('fecha_evento', new Date(fecha).toISOString());
      formData.append('estado', estado);

      if (imagenLocal) {
        const name = imagenLocal.split('/').pop() || 'flyer.jpg';
        const match = /\.(\w+)$/.exec(name);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('flyer', { uri: imagenLocal, name, type } as any);
      }

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (esEdicion) {
        await api.patch(`/eventos/${evento.id_evento}`, formData, config);
      } else {
        await api.post('/eventos', formData, config);
      }
      navigation.goBack();
    } catch (e: any) {
      console.log('Error guardando evento:', e?.response?.data || e.message);
      Alert.alert('Error', 'No se pudo guardar el evento');
    } finally {
      setGuardando(false);
    }
  };

  const previewUri = imagenLocal || (evento?.flyer_url ? buildImageUrl(evento.flyer_url) : null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>{esEdicion ? 'Editar evento' : 'Nuevo evento'}</Text>

      <TouchableOpacity style={styles.imgPicker} onPress={elegirImagen}>
        {previewUri ? (
          <Image source={{ uri: previewUri }} style={styles.imgPreview} />
        ) : (
          <View style={styles.imgPlaceholder}>
            <Ionicons name="cloud-upload-outline" size={42} color="#ff2d75" />
            <Text style={{ color: '#888', marginTop: 8 }}>Subir flyer</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>Nombre *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Reggaetón Night"
        placeholderTextColor="#555"
        value={nombre}
        onChangeText={setNombre}
      />

      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
        multiline
        placeholder="Detalles del evento..."
        placeholderTextColor="#555"
        value={descripcion}
        onChangeText={setDescripcion}
      />

      <Text style={styles.label}>Fecha (YYYY-MM-DDTHH:mm) *</Text>
      <TextInput
        style={styles.input}
        placeholder="2025-12-31T22:00"
        placeholderTextColor="#555"
        value={fecha}
        onChangeText={setFecha}
      />

      <Text style={styles.label}>Estado</Text>
      <View style={styles.estadoRow}>
        {['proximo', 'en_curso', 'finalizado'].map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.estadoOpt, estado === opt && styles.estadoOptActive]}
            onPress={() => setEstado(opt)}
          >
            <Text style={[styles.estadoOptText, estado === opt && { color: '#fff' }]}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, guardando && { opacity: 0.6 }]}
        onPress={guardar}
        disabled={guardando}
      >
        <Text style={styles.saveBtnText}>
          {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear evento'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 16 },
  imgPicker: { marginBottom: 16, borderRadius: 14, overflow: 'hidden' },
  imgPreview: { width: '100%', height: 240 },
  imgPlaceholder: {
    height: 200, backgroundColor: '#1a1a1a',
    borderWidth: 1, borderColor: '#333', borderStyle: 'dashed', borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  label: { color: '#aaa', fontSize: 13, marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: '#1a1a1a', color: '#fff',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  estadoRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  estadoOpt: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a',
    alignItems: 'center',
  },
  estadoOptActive: { backgroundColor: '#ff2d75', borderColor: '#ff2d75' },
  estadoOptText: { color: '#888', fontSize: 12, fontWeight: '600' },
  saveBtn: {
    marginTop: 24, backgroundColor: '#ff2d75',
    paddingVertical: 14, borderRadius: 12, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});