import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  Image, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

interface RedSocial {
  id_red: number;
  plataforma: string;
  username: string;
}

export default function PerfilScreen() {
  const { usuario, logout, refrescarUsuario } = useAuth();
  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [apellido, setApellido] = useState(usuario?.apellido || '');
  const [fotoUrl, setFotoUrl] = useState(usuario?.foto_perfil_url || '');
  const [redes, setRedes] = useState<RedSocial[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(false);

  // Nueva red social
  const [nuevaPlataforma, setNuevaPlataforma] = useState('instagram');
  const [nuevoUsername, setNuevoUsername] = useState('');

  useEffect(() => { cargarRedes(); }, []);

  const cargarRedes = async () => {
    try {
      const { data } = await api.get<RedSocial[]>('/usuarios/me/redes');
      setRedes(data);
    } catch (e) {
      console.log('Error redes:', e);
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
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo agregar');
    }
  };

  const handleEliminarRed = async (id: number) => {
    Alert.alert('Confirmar', '¿Eliminar esta red social?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          await api.delete(`/usuarios/me/redes/${id}`);
          cargarRedes();
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={styles.titulo}>Perfil BELLAKO</Text>

      {/* Foto y nombre */}
      <View style={styles.card}>
        <TouchableOpacity onPress={handleCambiarFoto} style={styles.fotoContainer}>
          {fotoUrl ? (
            <Image source={{ uri: fotoUrl }} style={styles.foto} />
          ) : (
            <View style={[styles.foto, styles.fotoPlaceholder]}>
              <Ionicons name="person" size={50} color={colors.textMuted} />
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
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Apellido</Text>
        <TextInput
          style={[styles.input, !editando && styles.inputDisabled]}
          value={apellido}
          onChangeText={setApellido}
          editable={editando}
          placeholder="Tu apellido"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Teléfono</Text>
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={usuario?.telefono}
          editable={false}
        />

        {editando ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[styles.btn, { flex: 1, backgroundColor: colors.textMuted }]}
              onPress={() => setEditando(false)}
            >
              <Text style={styles.btnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { flex: 1 }]}
              onPress={handleGuardar}
              disabled={guardando}
            >
              <Text style={styles.btnText}>{guardando ? 'Guardando...' : 'Guardar'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.btn} onPress={() => setEditando(true)}>
            <Ionicons name="pencil" size={16} color="#fff" />
            <Text style={styles.btnText}>Editar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Redes sociales */}
      <View style={styles.card}>
        <Text style={styles.cardTitulo}>Mis redes sociales</Text>

        {redes.length === 0 && (
          <Text style={styles.emptyText}>Aún no agregaste redes</Text>
        )}

        {redes.map((red) => (
          <View key={red.id_red} style={styles.redItem}>
            <Ionicons name={iconoRed(red.plataforma)} size={22} color={colors.primary} />
            <Text style={styles.redText}>@{red.username}</Text>
            <TouchableOpacity onPress={() => handleEliminarRed(red.id_red)}>
              <Ionicons name="trash" size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
        ))}

        <Text style={styles.label}>Agregar red social</Text>
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
              <Ionicons name={iconoRed(p)} size={20} color={nuevaPlataforma === p ? '#fff' : colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="username (sin @)"
          placeholderTextColor={colors.textMuted}
          value={nuevoUsername}
          onChangeText={setNuevoUsername}
          autoCapitalize="none"
        />

        <TouchableOpacity style={styles.btn} onPress={handleAgregarRed}>
          <Text style={styles.btnText}>+ Agregar</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
        <Ionicons name="log-out" size={20} color={colors.danger} />
        <Text style={styles.btnLogoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: colors.white,
    fontSize: 40,
    fontWeight: 'bold',
  },
  nombreUsuario: {
    color: colors.white,
    fontSize: 22,
    fontWeight: 'bold',
  },
  telefono: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.card,
    color: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
  },
  btnGuardar: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  btnGuardarText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  redItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  redText: {
    color: colors.white,
    fontSize: 15,
  },
  plataformasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  plataformaBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  plataformaBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  plataformaBtnText: {
    color: colors.white,
    fontSize: 13,
  },
  btnLogout: {
    backgroundColor: colors.danger,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  btnLogoutText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 12,
    fontStyle: 'italic',
  },
});