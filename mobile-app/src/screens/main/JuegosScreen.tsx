import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { api } from '../../api/client';
import { colors } from '../../theme/colors';

interface Dinamica {
  id_dinamica: number;
  nombre: string;
  descripcion?: string;
  estado: string;
  premio?: string;
}

export default function JuegosScreen() {
  const [dinamicas, setDinamicas] = useState<Dinamica[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get<Dinamica[]>('/dinamicas')
      .then((res) => setDinamicas(res.data))
      .catch((e) => console.log('Error dinámicas:', e))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Juegos BELLAKOS</Text>

      {dinamicas.length === 0 ? (
        <View style={styles.proxima}>
          <Text style={styles.proximaTitulo}>Próxima dinámica</Text>
          <Text style={styles.proximaSubtitulo}>BELLAKERA pronto</Text>
        </View>
      ) : null}

      <Text style={styles.subtitulo}>Juegos Bellakos para pasar el rato</Text>

      <View style={styles.numerosContainer}>
        {[1, 2, 3].map((n) => (
          <TouchableOpacity key={n} style={styles.numeroBtn}>
            <Text style={styles.numeroText}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={dinamicas}
        keyExtractor={(item) => item.id_dinamica.toString()}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay dinámicas activas en este momento</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <Text style={styles.cardNombre}>{item.nombre}</Text>
            {item.descripcion && <Text style={styles.cardDesc}>{item.descripcion}</Text>}
            {item.premio && (
              <View style={styles.premio}>
                <Text style={styles.premioText}>🏆 {item.premio}</Text>
              </View>
            )}
            <Text style={styles.cardEstado}>{item.estado.toUpperCase()}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  titulo: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: 20 },
  proxima: {
    backgroundColor: colors.card, padding: 30, borderRadius: 12,
    alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: colors.border,
  },
  proximaTitulo: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  proximaSubtitulo: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  subtitulo: { color: colors.text, fontSize: 16, marginBottom: 16, textAlign: 'center' },
  numerosContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 30 },
  numeroBtn: {
    width: 80, height: 80, backgroundColor: colors.primary, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  numeroText: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  card: {
    backgroundColor: colors.card, padding: 16, borderRadius: 12, marginBottom: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  cardNombre: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  cardDesc: { color: colors.textMuted, fontSize: 14, marginBottom: 8 },
  premio: { backgroundColor: colors.backgroundLight, padding: 8, borderRadius: 6, marginBottom: 8 },
  premioText: { color: colors.accent, fontSize: 14 },
  cardEstado: { color: colors.primary, fontSize: 12, fontWeight: 'bold' },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 20 },
});