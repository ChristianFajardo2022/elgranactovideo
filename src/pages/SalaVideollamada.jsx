// src/pages/SalaVideollamada.jsx
import { useEffect, useState, useRef } from "react";
import SimplePeer from "simple-peer";
import { useParams } from "react-router-dom";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

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

  const ffmpeg = createFFmpeg({ log: true });

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

  const grabarLlamada = async () => {
    if (recording) {
      // Detiene la grabación y convierte el archivo
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

      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const webmFile = new File([blob], "grabacion.webm", { type: "video/webm" });
        
        // Cargar ffmpeg y convertir a mp4
        await ffmpeg.load();
        ffmpeg.FS("writeFile", "grabacion.webm", await fetchFile(webmFile));
        await ffmpeg.run("-i", "grabacion.webm", "grabacion.mp4");

        const mp4Data = ffmpeg.FS("readFile", "grabacion.mp4");
        const mp4Blob = new Blob([mp4Data.buffer], { type: "video/mp4" });
        const url = URL.createObjectURL(mp4Blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `grabacion-${id}.mp4`;
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
    <div>
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
