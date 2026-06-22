import { useEffect, useState } from 'react';
import axios from 'axios';

interface Evento {
  id_evento: number;
  nombre: string;
  fecha_evento: string;
  estado: string;
}

function App() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get<Evento[]>('http://localhost:3000/api/eventos')
      .then((res) => setEventos(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const crearEventoPrueba = async () => {
    await axios.post('http://localhost:3000/api/eventos', {
      nombre: 'Como Antes - DJ Set',
      descripcion: 'Evento de prueba',
      fecha_evento: '2025-02-15T22:00:00',
    });
    window.location.reload();
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 40, background: '#1a0033', color: '#fff', minHeight: '100vh' }}>
      <h1 style={{ color: '#ff00ff' }}>🎉 BELLAKERA Admin Panel</h1>
      <button onClick={crearEventoPrueba} style={{ padding: 10, background: '#ff00ff', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: 5 }}>
        + Crear evento de prueba
      </button>
      <h2 style={{ marginTop: 30 }}>Eventos:</h2>
      {loading && <p>Cargando...</p>}
      {!loading && eventos.length === 0 && <p>No hay eventos. Crea uno con el botón de arriba.</p>}
      <ul>
        {eventos.map((e) => (
          <li key={e.id_evento}>
            <strong>{e.nombre}</strong> - {new Date(e.fecha_evento).toLocaleString()} ({e.estado})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;