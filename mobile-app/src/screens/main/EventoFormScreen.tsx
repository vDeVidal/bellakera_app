import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Platform, 
  Alert,
  Image 
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
// Importación de Ionicons para la cruz rosa de eliminación
import { Ionicons } from '@expo/vector-icons'; 

// Importación desestructurada desde tu cliente de API
import { api, buildImageUrl } from '../../api/client';

export default function EventoFormScreen({ route, navigation }: any) {
  const evento = route?.params?.evento;
  const esEdicion = !!evento;

  // --- ESTADOS DEL FORMULARIO ---
  const [nombre, setNombre] = useState(esEdicion ? evento.nombre : '');
  const [descripcion, setDescripcion] = useState(esEdicion ? evento.descripcion : '');
  const [estado, setEstado] = useState(esEdicion ? (evento.estado || 'ACTIVO').toUpperCase() : 'ACTIVO');
  const [fotoUrl, setFotoUrl] = useState(esEdicion ? evento.foto_url : null);
  
  const [fechaObjeto, setFechaObjeto] = useState<Date>(
    esEdicion && evento?.fecha ? new Date(evento.fecha) : new Date()
  );

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // --- MANEJADORES DE FECHA Y HORA (ANTI-CRASH) ---
  const onChangeFecha = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);

    if (event.type === 'set' && selectedDate) {
      const nuevaFecha = new Date(fechaObjeto);
      nuevaFecha.setFullYear(selectedDate.getFullYear());
      nuevaFecha.setMonth(selectedDate.getMonth());
      nuevaFecha.setDate(selectedDate.getDate());
      setFechaObjeto(nuevaFecha);
    }
    if (Platform.OS === 'ios') setShowDatePicker(false);
  };

  const onChangeHora = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);

    if (event.type === 'set' && selectedDate) {
      const nuevaFecha = new Date(fechaObjeto);
      nuevaFecha.setHours(selectedDate.getHours());
      nuevaFecha.setMinutes(selectedDate.getMinutes());
      setFechaObjeto(nuevaFecha);
    }
    if (Platform.OS === 'ios') setShowTimePicker(false);
  };

  // --- MANEJADOR DE IMAGEN ---
  const seleccionarImagen = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos para cambiar la imagen del evento.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      // aspect: [16, 9], // Comentado correctamente para libre redimensión completa
      quality: 0.8,
    });

    if (!resultado.canceled && resultado.assets && resultado.assets.length > 0) {
      setFotoUrl(resultado.assets[0].uri);
    }
  };

  // --- ACCIÓN DE GUARDAR (CONEXIÓN BACKEND SINCRONIZADA) ---
  const handleGuardar = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre del evento es obligatorio.');
      return;
    }

    setGuardando(true);
    try {
      const fechaISO = fechaObjeto.toISOString();

      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('descripcion', descripcion);
      formData.append('fecha_evento', fechaISO);
      formData.append('estado', estado);

      // Si hay una foto seleccionada localmente en el carrete, la empaquetamos
      if (fotoUrl && (fotoUrl.startsWith('file:') || fotoUrl.startsWith('content:'))) {
        const filename = fotoUrl.split('/').pop();
        const match = /\.(\w+)$/.exec(filename ?? '');
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('flyer', {
          uri: fotoUrl,
          name: filename ?? 'evento-flyer.jpg',
          type,
        } as any);
      } else if (!fotoUrl) {
        // Opcional: si limpiaste la imagen con la cruz, puedes mandar 'flyer' vacío o manejarlo según tu backend
        formData.append('flyer', '');
      }

      let respuesta;

      if (esEdicion) {
        const idEvento = evento.id || evento.id_evento; 
        
        if (!idEvento) {
          Alert.alert('Error', 'No se pudo obtener el ID del evento para editar.');
          setGuardando(false);
          return;
        }

        respuesta = await api.patch(`/eventos/${idEvento}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        respuesta = await api.post('/eventos', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if (respuesta.status === 200 || respuesta.status === 201) {
        Alert.alert('Éxito', 'Evento guardado correctamente.');
        navigation.goBack();
      }

    } catch (error: any) {
      console.error('Error detallado al guardar:', error?.response?.data || error.message);
      Alert.alert(
        'Error al guardar el evento', 
        error?.response?.data?.message || 'Ocurrió un problema inesperado. Revisa la consola.'
      );
    } finally {
      setGuardando(false);
    }
  };

  const formatFechaTexto = (date: Date) => {
    return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatHoraTexto = (date: Date) => {
    return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const previewUri = fotoUrl 
    ? (fotoUrl.startsWith('http') || fotoUrl.startsWith('file') || fotoUrl.startsWith('content') ? fotoUrl : buildImageUrl(fotoUrl)) 
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>{esEdicion ? 'Editar evento' : 'Crear evento'}</Text>

      <Text style={styles.label}>Imagen del evento</Text>
      
      {previewUri ? (
        <View style={styles.imageContainer}>
          {/* Imagen completa y centrada usando contain */}
          <Image source={{ uri: previewUri }} style={styles.previewImage} />
          
          {/* Botón de la cruz rosa para eliminar */}
          <TouchableOpacity 
            style={styles.botonEliminarFoto} 
            onPress={() => setFotoUrl(null)}
          >
            <Ionicons name="close" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.imagePickerContainer} onPress={seleccionarImagen}>
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>📸 Seleccionar Imagen</Text>
          </View>
        </TouchableOpacity>
      )}

      <Text style={styles.label}>Nombre *</Text>
      <TextInput
        style={styles.input}
        value={nombre}
        onChangeText={setNombre}
        placeholder="Ej: Noche de Fiesta"
        placeholderTextColor="#555"
      />

      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={descripcion}
        onChangeText={setDescripcion}
        placeholder="Añade detalles del evento..."
        placeholderTextColor="#555"
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>Fecha y Hora del evento *</Text>
      <View style={styles.pickerRow}>
        <TouchableOpacity style={styles.selectorButton} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.buttonText}>📅 {formatFechaTexto(fechaObjeto)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.selectorButton} onPress={() => setShowTimePicker(true)}>
          <Text style={styles.buttonText}>⏰ {formatHoraTexto(fechaObjeto)}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Estado</Text>
      <View style={styles.estadoRow}>
        {['ACTIVO', 'CERRADO', 'CANCELADO'].map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.estadoButton,
              estado === item && styles.estadoButtonActive
            ]}
            onPress={() => setEstado(item)}
          >
            <Text style={[styles.estadoButtonText, estado === item && styles.estadoButtonTextActive]}>
              {item === 'ACTIVO' ? 'ACTIVO' : item === 'CERRADO' ? 'CERRADO' : 'CANCELADO'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity 
        style={[styles.saveButton, guardando && { opacity: 0.6 }]} 
        onPress={handleGuardar}
        disabled={guardando}
      >
        <Text style={styles.saveButtonText}>
          {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear Evento'}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={fechaObjeto}
          mode="date"
          display={Platform.OS === 'android' ? 'calendar' : 'default'}
          onChange={onChangeFecha}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={fechaObjeto}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'android' ? 'clock' : 'default'}
          onChange={onChangeHora}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 25, marginTop: 10 },
  label: { color: '#aaa', marginBottom: 8, fontSize: 14, fontWeight: '500' },
  input: { 
    backgroundColor: '#1e1e1e', 
    color: '#fff', 
    padding: 15, 
    borderRadius: 8, 
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333'
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  pickerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  selectorButton: {
    flex: 0.48,
    backgroundColor: '#1e1e1e',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  buttonText: { color: '#fff', fontSize: 15 },
  imagePickerContainer: { marginBottom: 20, borderRadius: 8, overflow: 'hidden' },
  imageContainer: {
    position: 'relative', // Obligatorio para posicionar el botón flotante de la cruz
    width: '100%',
    height: 220, // Más amplio para flyers completos verticales
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1e1e1e',
    marginBottom: 20,
  },
  imagePlaceholder: { 
    height: 150, 
    backgroundColor: '#1e1e1e', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#333',
    borderRadius: 8
  },
  placeholderText: { color: '#aaa', fontSize: 16 },
  previewImage: { height: '100%', width: '100%', resizeMode: 'contain' }, // Cambiado a contain para evitar recortes
  botonEliminarFoto: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#d81b60', // Color rosa corporativo
    borderRadius: 20,
    padding: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  estadoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  estadoButton: { 
    flex: 0.31, 
    backgroundColor: '#1e1e1e', 
    padding: 12, 
    borderRadius: 8, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333'
  },
  estadoButtonActive: { backgroundColor: '#d81b60', borderColor: '#d81b60' },
  estadoButtonText: { color: '#aaa', fontSize: 13, fontWeight: '600' },
  estadoButtonTextActive: { color: '#fff' },
  saveButton: { backgroundColor: '#d81b60', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});