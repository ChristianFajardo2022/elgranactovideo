// src/pages/Home.jsx
import { useState } from "react";
import { nanoid } from "nanoid";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const navigate = useNavigate();

  const generarLink = () => {
    if (!fecha || !hora) {
      alert("Selecciona una fecha y hora.");
      return;
    }
    const idUnico = nanoid(10);
    navigate(`/videollamada/${idUnico}`);
  };

  return (
    <div className=" bg-black h-screen flex flex-col items-center justify-center gap-y-4 text-white">
      <h1>Agendar Videollamada</h1>
      <label>
        Fecha:
        <input className="text-black" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </label>
      <label>
        Hora:
        <input className="text-black"  type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
      </label>
      <button className="" onClick={generarLink}>Generar Link de Videollamada</button>
    </div>
  );
}
