import React, { useRef, useState, useEffect } from 'react';

const CameraCapture = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [videoReady, setVideoReady] = useState(false);

  const handleLoadedMetadata = () => {
    setVideoReady(true);
  };

  useEffect(() => {
    if (videoRef.current) {
      console.log('Video elementi DOM\'da:', videoRef.current);
      console.log('Video genişlik:', videoRef.current.width, 'Yükseklik:', videoRef.current.height);
    }
  }, [videoRef, stream]);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(s);
      setVideoReady(false);
      setError(null);
    } catch (err) {
      setError('Kameraya erişilemiyor: ' + err.message);
      console.error('Kamera erişim hatası:', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (onClose) onClose();
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) {
        setError('Fotoğraf çekilemedi. Lütfen tekrar deneyin.');
        return;
      }
      setCapturedImage(URL.createObjectURL(blob));
      if (onCapture) {
        onCapture(blob);
        stopCamera(); // ✅ kamera burada kapanır
      }
    }, 'image/jpeg');
  };
  

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      console.log('Kamera akışı video elementine atandı:', stream);
    }
  }, [stream]);

  return (
    <div className="box has-text-centered">
      {!stream && (
        <button className="button is-info mb-3" onClick={startCamera}>
          <span className="icon"><i className="fas fa-video"></i></span>
          <span>Kamerayı Aç</span>
        </button>
      )}
      {error && <div className="notification is-danger">{error}</div>}
      {stream && (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            width={320}
            height={240}
            onLoadedMetadata={handleLoadedMetadata}
            style={{ borderRadius: 8, border: '1px solid #ccc' }}
          />
          <div className="mt-3">
            <button className="button is-primary mr-2" onClick={capturePhoto} disabled={!videoReady}>
              <span className="icon"><i className="fas fa-camera"></i></span>
              <span>Fotoğraf Çek</span>
            </button>
            <button className="button is-danger" onClick={stopCamera}>
              <span className="icon"><i className="fas fa-times"></i></span>
              <span>Kapat</span>
            </button>
          </div>
        </>
      )}
      {capturedImage && (
        <div className="mt-4">
          <p>Çekilen Fotoğraf:</p>
          <img src={capturedImage} alt="Çekilen Yüz" style={{ maxWidth: 320, borderRadius: 8, border: '1px solid #ccc' }} />
        </div>
      )}
    </div>
  );
};

export default CameraCapture; 