import React, { useState } from 'react';
import CameraCapture from '../common/CameraCapture';

const FaceUploadModal = ({
  isOpen,
  onClose,
  student,
  onFileChange,
  onUpload,
  imagePreview,
  isLoading,
  file,
}) => {
  const [showCamera, setShowCamera] = useState(false);

  if (!isOpen) return null;

  const handleCapturePhoto = (blob) => {
    // Dosya seçme input'una manuel olarak blob'u ata
    const fileObj = new File([blob], "captured-photo.jpg", { type: "image/jpeg" });
    
    console.log("[DEBUG] Kamera ile çekilen fotoğraf:", {
      name: fileObj.name,
      size: fileObj.size,
      type: fileObj.type
    });
    
    // onFileChange fonksiyonunu manuel olarak çağır
    const event = { target: { files: [fileObj] } };
    onFileChange(event);
    
    setShowCamera(false);
  };

  return (
    <div className="modal is-active">
      <div className="modal-background" onClick={onClose}></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">
            Yüz Verisi Yükle: {student?.ad} {student?.soyad}
          </p>
          <button className="delete" aria-label="close" onClick={onClose}></button>
        </header>
        <section className="modal-card-body">
          {!showCamera ? (
            <>
              <div className="field">
                <label className="label">Öğrenci Fotoğrafı</label>
                <p className="help mb-3">Lütfen sadece öğrencinin yüzünün net göründüğü bir fotoğraf yükleyin.</p>
                
                <div className="buttons is-centered mb-4">
                  <button 
                    className="button is-info" 
                    onClick={() => setShowCamera(true)}
                  >
                    <span className="icon">
                      <i className="fas fa-camera"></i>
                    </span>
                    <span>Kamera ile Çek</span>
                  </button>
                  
                  <div className="file is-info">
                    <label className="file-label">
                      <input
                        className="file-input"
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={onFileChange}
                      />
                      <span className="file-cta">
                        <span className="file-icon"><i className="fas fa-upload"></i></span>
                        <span className="file-label">Dosya Seç</span>
                      </span>
                    </label>
                  </div>
                </div>
                
                {file && (
                  <div className="notification is-light is-info has-text-centered">
                    <p><strong>Seçilen Dosya:</strong> {file.name}</p>
                  </div>
                )}
              </div>
              
              {imagePreview && (
                <div className="field" style={{ textAlign: "center", marginTop: "1rem" }}>
                  <label className="label">Önizleme</label>
                  <img src={imagePreview} alt="Önizleme" style={{ maxWidth: '200px', maxHeight: '200px', border: '1px solid #ddd', borderRadius: '4px' }} />
                </div>
              )}
            </>
          ) : (
            <CameraCapture 
              onCapture={handleCapturePhoto} 
              onClose={() => setShowCamera(false)} 
            />
          )}
        </section>
        <footer className="modal-card-foot">
          {!showCamera && (
            <>
              <button
                className="button is-success"
                onClick={onUpload}
                disabled={!file || isLoading}
              >
                {isLoading ? 'Yükleniyor...' : 'Yükle'}
              </button>
              <button className="button" onClick={onClose}>İptal</button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
};

export default FaceUploadModal;