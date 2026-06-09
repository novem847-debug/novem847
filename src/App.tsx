import { useEffect, useRef, useState } from "react";
import { FilesetResolver, FaceDetector } from "@mediapipe/tasks-vision";

let faceDetector: FaceDetector | null = null;

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [faces, setFaces] = useState<any[]>([]);
  const [winnerImage, setWinnerImage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    let animationId = 0;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
          };
        }
      } catch (error) {
        console.error(error);
      }
    };

    const loadDetector = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      faceDetector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite",
        },
        runningMode: "VIDEO",
      });

      detectFaces();
    };

    const detectFaces = () => {
      if (!faceDetector || !videoRef.current || !canvasRef.current) {
        animationId = requestAnimationFrame(detectFaces);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        animationId = requestAnimationFrame(detectFaces);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animationId = requestAnimationFrame(detectFaces);
        return;
      }

      const detections = faceDetector.detectForVideo(video, performance.now());
      setFaces(detections.detections || []);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      detections.detections?.forEach((detection) => {
        const box = detection.boundingBox;
        if (!box) return;

        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 4;
        ctx.strokeRect(box.originX, box.originY, box.width, box.height);
      });

      animationId = requestAnimationFrame(detectFaces);
    };

    startCamera();
    loadDetector();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  const randomStudent = () => {
    if (!videoRef.current) return;
    if (faces.length === 0) return;

    setCountdown(5);

    let count = 5;
    const timer = setInterval(() => {
      count--;

      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(timer);
        setCountdown(null);

        const randomIndex = Math.floor(Math.random() * faces.length);
        const winner = faces[randomIndex];
        if (!winner.boundingBox) return;

        const box = winner.boundingBox;
        const video = videoRef.current!;
        const tempCanvas = document.createElement("canvas");
        const ctx = tempCanvas.getContext("2d");
        if (!ctx) return;

        const padding = 80;
        const sx = Math.max(0, box.originX - padding);
        const sy = Math.max(0, box.originY - padding);
        const sw = Math.min(video.videoWidth - sx, box.width + padding * 2);
        const sh = Math.min(video.videoHeight - sy, box.height + padding * 2);

        tempCanvas.width = sw;
        tempCanvas.height = sh;

        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
        setWinnerImage(tempCanvas.toDataURL("image/png"));
      }
    }, 1000);
  };

  const resetRandom = () => {
    setWinnerImage(null);
  };

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <video
          ref={videoRef}
          style={{
            width: "100%",
            height: "auto",
            borderRadius: "20px",
            background: "#000",
          }}
          autoPlay
          muted
          playsInline
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          justifyContent: "center",
          marginTop: "20px",
        }}
      >
        <button
          onClick={randomStudent}
          disabled={countdown !== null}
          style={{
            padding: "12px 24px",
            fontSize: "18px",
            cursor: countdown !== null ? "not-allowed" : "pointer",
            opacity: countdown !== null ? 0.5 : 1,
          }}
        >
          🎲 สุ่มนักเรียน
        </button>

        {winnerImage && (
          <button
            onClick={resetRandom}
            style={{ padding: "12px 24px", fontSize: "18px" }}
          >
            🔄 เริ่มใหม่
          </button>
        )}
      </div>

      {countdown !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "white",
            fontSize: "200px",
            fontWeight: "bold",
            zIndex: 10000,
          }}
        >
          {countdown}
        </div>
      )}

      {winnerImage && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.95)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: "20px",
            zIndex: 9999,
          }}
        >
          <img
            src={winnerImage}
            alt="winner"
            style={{
              maxWidth: "90%",
              maxHeight: "60%",
              borderRadius: "20px",
              boxShadow: "0 0 30px gold",
            }}
          />

          <h1
            style={{
              color: "gold",
              fontSize: "60px",
              margin: 0,
              textAlign: "center",
            }}
          >
            🎉 คุณคือผู้โชคดี 🎉
          </h1>

          <button
            onClick={resetRandom}
            style={{ padding: "12px 24px", fontSize: "18px" }}
          >
            🔁 คืนค่า
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
