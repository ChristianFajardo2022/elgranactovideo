// SalaVideollamada.jsx
import React, { useState, useRef, useEffect } from "react";
import Peer from "simple-peer";

let ffmpeg = null;

const initFFmpeg = async () => {
  if (!ffmpeg) {
    const { createFFmpeg, fetchFile } = await import("@ffmpeg/ffmpeg");
    ffmpeg = createFFmpeg({ log: true });
    await ffmpeg.load();
  }
};

export default function SalaVideollamada({ id, link }) {
  const [peers, setPeers] = useState([]);
  const [recording, setRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [recorder, setRecorder] = useState(null);

  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const setupMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (localVideo.current) {
          localVideo.current.srcObject = stream;
        }
        streamRef.current = stream;

        const peer = new Peer({
          initiator: !id,
          trickle: false,
          stream: stream,
        });

        peer.on("signal", (data) => {
          if (!id) {
            link.current = JSON.stringify(data);
          } else {
            peer.signal(id);
          }
        });

        peer.on("stream", (remoteStream) => {
          if (remoteVideo.current) {
            remoteVideo.current.srcObject = remoteStream;
          }
        });

        setPeers((prevPeers) => [...prevPeers, peer]);
      } catch (error) {
        console.error("Error accessing media devices.", error);
      }
    };

    setupMedia();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      peers.forEach((peer) => peer.destroy());
    };
  }, [id, link]);

  const handleGrabar = async () => {
    await initFFmpeg();

    if (recording) {
      recorder.stop();
      setRecording(false);
    } else {
      const mediaRecorder = new MediaRecorder(streamRef.current);
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

        await ffmpeg.FS("writeFile", "grabacion.webm", await fetchFile(webmFile));
        await ffmpeg.run("-i", "grabacion.webm", "grabacion.mp4");

        const mp4Data = ffmpeg.FS("readFile", "grabacion.mp4");
        const mp4Blob = new Blob([mp4Data.buffer], { type: "video/mp4" });
        const url = URL.createObjectURL(mp4Blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `grabacion-${id || "new"}.mp4`;
        a.click();
      };

      mediaRecorder.start();
      setRecording(true);
    }
  };

  const handleColgar = () => {
    peers.forEach((peer) => peer.destroy());
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    alert("Gracias por hacer feliz a un abuelito esta navidad");
  };

  return (
    <div className="bg-black text-white flex flex-col items-center justify-center h-screen">
      <h2>Videollamada</h2>
      <div>
        <video ref={localVideo} autoPlay muted style={{ width: "300px" }} />
        <video ref={remoteVideo} autoPlay style={{ width: "300px" }} />
      </div>
      <button onClick={handleGrabar}>
        {recording ? "Detener Grabación" : "Grabar"}
      </button>
      <button onClick={handleColgar}>Colgar</button>
    </div>
  );
}
