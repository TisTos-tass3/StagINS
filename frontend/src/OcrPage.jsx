import React, { useState } from 'react';
import { createWorker } from 'tesseract.js';

function OcrPage() {
  const [ocrResult, setOcrResult] = useState('');
  const [extractedData, setExtractedData] = useState({});
  const [log, setLog] = useState('');
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Fonction pour extraire les champs spécifiques à l'aide des expressions régulières (RegEx)
   * adaptées au format de votre lettre.
   * @param {string} text - Le texte brut extrait par Tesseract.js.
   */
  const extractSpecificData = (text) => {
    // 1. Nettoyage du texte : remplacement des sauts de ligne et des espaces multiples.
    const cleanedText = text.replace(/(\r\n|\n|\r)/gm, ' ').replace(/\s+/g, ' ');

    const data = {
      decisionNo: 'Non trouvé',
      nomPrenom: 'Non trouvé',
      telephone: 'Non trouvé',
      dureeStage: 'Non trouvée',
    };

    // --- 1. Numéro de Décision (Ex: N° : 00053/ME/F/INS/DG/DRH/DGCFC) ---
    // Cherche 'N°:' suivi d'un code alphanumérique et de slashs.
    let match = cleanedText.match(/N°\s*:\s*([\d\s]+[A-Za-z0-9\/]+)/i);
    if (match) data.decisionNo = match[1].trim();

    // --- 2. Nom et Prénom du Stagiaire (Ex: Madame Tasnim ABOU MAHAMAN LAWAN) ---
    // Cherche 'Madame' ou 'Monsieur' suivi du nom et prénom, avant un mot clé comme 'titulaire'.
    match = cleanedText.match(/(Madame|Monsieur)\s*([A-Za-z\s]+)\s*,\s*titulaire/i);
    if (match) data.nomPrenom = match[2].trim();

    // --- 3. Numéro de Téléphone (Ex: Cel: 85 73 64 14) ---
    // Cherche 'Cel:' suivi de 8 à 15 caractères (chiffres/espaces)
    match = cleanedText.match(/Cel\s*:\s*([\d\s]{8,15})/i);
    if (match) data.telephone = match[1].trim();
    
    // --- 4. Durée du Stage (Ex: 08 septembre au 07 décembre 2025) ---
    // Cherche "allant du [Date] au [Date]"
    // Capture les deux bornes, qui peuvent contenir des chiffres, lettres et espaces.
    match = cleanedText.match(/allant\s*du\s*([\d\sA-Za-z]+)\s*au\s*([\d\sA-Za-z]+)/i);
    if (match) data.dureeStage = `Du ${match[1].trim()} au ${match[2].trim()}`;

    return data;
  };

  /**
   * Lance le processus d'OCR
   * @param {File} file - Le fichier image à traiter.
   */
  const doOCR = async (file) => {
    setIsProcessing(true);
    setLog('Initialisation du worker Tesseract...');
    setOcrResult('');
    setExtractedData({});
    setProgress(0);

    // Initialisation du worker avec la langue française ('fra')
    const worker = await createWorker('fra', 1, {
      logger: m => {
        // Mise à jour de la progression et du log
        if (m.status === 'recognizing text' || m.status === 'initialized') {
            setLog(`[${m.status}] Progression : ${(m.progress * 100).toFixed(2)}%`);
            setProgress(m.progress);
        }
      },
    });

    // Reconnaissance du texte
    setLog('Démarrage de la reconnaissance...');
    const { data: { text } } = await worker.recognize(file);
    
    setOcrResult(text);
    setLog('Extraction terminée. Analyse des données...');
    
    // Extraction des informations spécifiques
    const extracted = extractSpecificData(text);
    setExtractedData(extracted);
    
    // Fermeture du worker
    await worker.terminate();
    setLog('Worker Tesseract terminé. ✅');
    setIsProcessing(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'application/pdf') {
         // Blocage du PDF pour ce test simple
         alert("Veuillez fournir un fichier IMAGE (PNG, JPEG) pour ce test simple. Les PDF nécessitent une étape de conversion supplémentaire.");
         return;
      }
      doOCR(file);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🤖 Extraction OCR de Lettre d'Acceptation</h1>
      <p>Sélectionnez l'image scannée de votre lettre (PNG ou JPEG).</p>
      
      <input 
        type="file" 
        onChange={handleFileChange} 
        accept="image/png, image/jpeg" 
        disabled={isProcessing} 
        style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
      />

      {/* ------------------------------------------- */}

      {isProcessing && (
        <div style={{ marginTop: '20px', backgroundColor: '#f0f8ff', padding: '10px', borderRadius: '4px' }}>
          <p><strong>Statut:</strong> {log}</p>
          <progress value={progress} max="1" style={{ width: '100%', height: '20px' }} />
        </div>
      )}

      {/* ------------------------------------------- */}
      
      <h2 style={{ marginTop: '30px' }}>📋 Informations Extraites</h2>
      <div style={{ border: '2px solid #32CD32', padding: '15px', backgroundColor: '#e6ffe6', borderRadius: '4px' }}>
        <p><strong>Numéro de Décision:</strong> <span style={{ fontWeight: 'bold', color: '#006400' }}>{extractedData.decisionNo || 'En attente...'}</span></p>
        <p><strong>Nom et Prénom:</strong> <span style={{ fontWeight: 'bold', color: '#006400' }}>{extractedData.nomPrenom || 'En attente...'}</span></p>
        <p><strong>Numéro de Téléphone:</strong> <span style={{ fontWeight: 'bold', color: '#006400' }}>{extractedData.telephone || 'En attente...'}</span></p>
        <p><strong>Durée du Stage:</strong> <span style={{ fontWeight: 'bold', color: '#006400' }}>{extractedData.dureeStage || 'En attente...'}</span></p>
      </div>

      {/* ------------------------------------------- */}

      <h2 style={{ marginTop: '30px' }}>🔍 Texte Brut (Pour Debug)</h2>
      <textarea
        value={ocrResult || 'Le texte OCR apparaîtra ici après le traitement...'}
        readOnly
        style={{ width: '100%', height: '250px', marginTop: '10px', padding: '10px', backgroundColor: '#f5f5f5', border: '1px solid #ddd' }}
      />
    </div>
  );
}

export default OcrPage;