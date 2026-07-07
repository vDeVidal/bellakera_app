import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  Image, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { api, buildImageUrl } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useIsAdmin } from '../../hooks/useIsAdmin'; // Importación de tu hook existente

interface RedSocial {
  id_red: number;
  plataforma: string;
  username: string;
}

export default function PerfilScreen() {
  const { usuario, logout, refrescarUsuario } = useAuth();
  const isAdmin = useIsAdmin(); // Verificamos si es administrador
  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [apellido, setApellido] = useState(usuario?.apellido || '');
  const [fotoUrl, setFotoUrl] = useState(usuario?.foto_perfil_url || '');
  const [redes, setRedes] = useState<RedSocial[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(false);

  const [nuevaPlataforma, setNuevaPlataforma] = useState('instagram');
  const [nuevoUsername, setNuevoUsername] = useState('');

  // Efecto reactivo para limpiar / reestructurar el perfil si cambia la sesión del AuthContext
  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre || '');
      setApellido(usuario.apellido || '');
      setFotoUrl(usuario.foto_perfil_url || '');
      if (!isAdmin) {
        cargarRedes();
      } else {
        setRedes([]); // Limpieza absoluta si entra un admin
      }
    }
  }, [usuario, isAdmin]);

  const cargarRedes = async () => {
    try {
      const { data } = await api.get<RedSocial[]>('/usuarios/me/redes');
      setRedes(data);
    } catch {
      // El endpoint de redes sociales no está disponible aún — se ignora silenciosamente
      setRedes([]);
    }
  };

  const handleCambiarFoto = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      setFotoUrl(result.assets[0].uri);
    }
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await api.put('/usuarios/me', {
        nombre,
        apellido,
        foto_perfil_url: fotoUrl,
      });
      await refrescarUsuario();
      setEditando(false);
      Alert.alert('Listo', 'Perfil actualizado');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  };

  const handleAgregarRed = async () => {
    if (!nuevoUsername.trim()) {
      Alert.alert('Error', 'Ingresa tu usuario');
      return;
    }
    try {
      await api.post('/usuarios/me/redes', {
        plataforma: nuevaPlataforma,
        username: nuevoUsername.trim(),
      });
      setNuevoUsername('');
      cargarRedes();
    } catch {
      // Endpoint no disponible — guardar solo localmente
      const nueva: RedSocial = {
        id_red: Date.now(),
        plataforma: nuevaPlataforma,
        username: nuevoUsername.trim(),
      };
      setRedes((prev) => [...prev, nueva]);
      setNuevoUsername('');
    }
  };

  const handleEliminarRed = async (id: number) => {
    Alert.alert('Confirmar', '¿Eliminar esta red social?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          // Eliminar localmente primero
          setRedes((prev) => prev.filter((r) => r.id_red !== id));
          try { await api.delete(`/usuarios/me/redes/${id}`); } catch { /* silenciado */ }
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
    ]);
  };

  const iconoRed = (plataforma: string): any => {
    const map: any = {
      instagram: 'logo-instagram',
      tiktok: 'musical-notes',
      twitter: 'logo-twitter',
      facebook: 'logo-facebook',
    };
    return map[plataforma] || 'link';
  };

  const renderSourceImage = fotoUrl.startsWith('http') || fotoUrl.startsWith('file')
    ? { uri: fotoUrl }
    : { uri: buildImageUrl(fotoUrl) };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.titulo}>Perfil BELLAKO</Text>

      {/* Foto y nombre */}
      <View style={styles.card}>
        <TouchableOpacity onPress={handleCambiarFoto} style={styles.fotoContainer}>
          {fotoUrl ? (
            <Image source={renderSourceImage} style={styles.foto} />
          ) : (
            <View style={[styles.foto, styles.fotoPlaceholder]}>
              <Ionicons name="person" size={50} color="#666" />
            </View>
          )}
          <View style={styles.fotoEditar}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>

        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={[styles.input, !editando && styles.inputDisabled]}
          value={nombre}
          onChangeText={setNombre}
          editable={editando}
          placeholder="Tu nombre"
          placeholderTextColor="#666"
        />

        <Text style={styles.label}>Apellido</Text>
        <TextInput
          style={[styles.input, !editando && styles.inputDisabled]}
          value={apellido}
          onChangeText={setApellido}
          editable={editando}
          placeholder="Tu apellido"
          placeholderTextColor="#666"
        />

        <Text style={styles.label}>Teléfono</Text>
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={usuario?.telefono}
          editable={false}
        />

        {editando ? (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <TouchableOpacity
              style={[styles.btn, { flex: 1, backgroundColor: '#333' }]}
              onPress={() => setEditando(false)}
            >
              <Text style={styles.btnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { flex: 1, backgroundColor: '#ff2d75' }]}
              onPress={handleGuardar}
              disabled={guardando}
            >
              <Text style={styles.btnText}>{guardando ? 'Guardando...' : 'Guardar'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#ff2d75', marginTop: 10 }]} onPress={() => setEditando(true)}>
            <Ionicons name="pencil" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.btnText}>Editar Perfil</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* PARCHE DEFINITIVO: Ocultar sección de Redes Sociales COMPLETAMENTE si el usuario ingresado es Admin */}
      {!isAdmin && (
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Mis redes sociales</Text>

          {redes.length === 0 && (
            <Text style={styles.emptyText}>Aún no agregaste redes</Text>
          )}

          {redes.map((red) => (
            <View key={red.id_red} style={styles.redItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name={iconoRed(red.plataforma)} size={20} color="#ff2d75" />
                <Text style={styles.redText}>@{red.username}</Text>
              </View>
              <TouchableOpacity onPress={() => handleEliminarRed(red.id_red)}>
                <Ionicons name="trash" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}

          <Text style={[styles.label, { marginTop: 15 }]}>Agregar red social</Text>
          <View style={styles.plataformasRow}>
            {['instagram', 'tiktok', 'twitter'].map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.plataformaBtn,
                  nuevaPlataforma === p && styles.plataformaBtnActive,
                ]}
                onPress={() => setNuevaPlataforma(p)}
              >
                <Ionicons name={iconoRed(p)} size={20} color={nuevaPlataforma === p ? '#fff' : '#666'} />
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="username (sin @)"
            placeholderTextColor="#666"
            value={nuevoUsername}
            onChangeText={setNuevoUsername}
            autoCapitalize="none"
          />

          <TouchableOpacity style={[styles.btn, { backgroundColor: '#1e1e1e', borderWidth: 1, borderColor: '#333' }]} onPress={handleAgregarRed}>
            <Text style={styles.btnText}>+ Agregar Red</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Logout unificado */}
      <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
        <Ionicons name="log-out" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.btnLogoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 20, textAlign: 'center', letterSpacing: 1 },
  card: { backgroundColor: '#121212', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1f1f1f' },
  cardTitulo: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 14 },
  fotoContainer: { alignSelf: 'center', marginBottom: 20, position: 'relative' },
  foto: { width: 100, height: 100, borderRadius: 50 },
  fotoPlaceholder: { backgroundColor: '#1f1f1f', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  fotoEditar: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#ff2d75', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#121212' },
  label: { color: '#aaa', fontSize: 13, marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: '#1a1a1a', color: '#fff', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 8, marginBottom: 14, fontSize: 15, borderWidth: 1, borderColor: '#2a2a2a' },
  inputDisabled: { backgroundColor: '#151515', color: '#777', borderColor: '#202020' },
  btn: { flexDirection: 'row', paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  redItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1a1a', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 8, marginBottom: 8 },
  redText: { color: '#fff', fontSize: 15 },
  plataformasRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  plataformaBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a' },
  plataformaBtnActive: { backgroundColor: '#ff2d75', borderColor: '#ff2d75' },
  btnLogout: { flexDirection: 'row', backgroundColor: '#ef4444', paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 10, shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 3 },
  btnLogoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  emptyText: { color: '#666', fontSize: 14, textAlign: 'center', paddingVertical: 12, fontStyle: 'italic' },
});