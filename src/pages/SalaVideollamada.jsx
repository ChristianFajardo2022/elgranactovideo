// src/pages/SalaVideollamada.jsx
import { useEffect, useState, useRef } from "react";
import SimplePeer from "simple-peer";
import { useParams } from "react-router-dom";

export default function SalaVideollamada() {
  const { id } = useParams();
  const [peers, setPeers] = useState([]);
  const localVideo = useRef();
  const remoteVideo = useRef();
  const [stream, setStream] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [callEnded, setCallEnded] = useState(false);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideo.current.srcObject = stream;
        setStream(stream);
      })
      .catch((error) => {
        console.error("Error al acceder a la cámara/micrófono:", error);
        alert("No se pudo acceder a la cámara o al micrófono. Verifica los permisos.");
      });
  }, []);

  const iniciarLlamada = () => {
    if (!stream) {
      alert("No se puede iniciar la llamada sin acceso al video.");
      return;
    }

    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      console.log("SIGNAL", JSON.stringify(data));
      // Aquí deberías implementar un intercambio de señales con WebSocket
    });

    peer.on("stream", (remoteStream) => {
      remoteVideo.current.srcObject = remoteStream;
    });

    setPeers([...peers, peer]);
  };

  const grabarLlamada = () => {
    if (recording) {
      // Detiene la grabación y guarda el video
      recorder.stop();
      setRecording(false);
    } else {
      const mediaRecorder = new MediaRecorder(stream);
      setRecorder(mediaRecorder);
      setRecordedChunks([]);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: "video/mp4" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `grabacion-${id}.mp`;
        a.click();
      };

      mediaRecorder.start();
      setRecording(true);
    }
  };

  const colgarLlamada = () => {
    setCallEnded(true);
    peers.forEach((peer) => peer.destroy());
    setStream(null);
  };

  if (callEnded) {
    return <h1>Gracias por hacer feliz a un abuelito esta navidad 🎄</h1>;
  }

  return (
    <div className="bg-black text-white flex flex-col items-center justify-center">
      <h1>Videollamada - Sala {id}</h1>
      <video ref={localVideo} autoPlay muted className="w-1/2" />
      <video ref={remoteVideo} autoPlay className="w-1/2" />
      <button onClick={iniciarLlamada} className="btn-primary mt-4">
        Iniciar Llamada
      </button>
      <button onClick={grabarLlamada} className="btn-primary mt-4">
        {recording ? "Detener Grabación" : "Grabar Videollamada"}
      </button>
      <button onClick={colgarLlamada} className="btn-primary mt-4">
        Colgar
      </button>
    </div>
  );
}
