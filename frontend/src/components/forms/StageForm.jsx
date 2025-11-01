
import React, { useState, useEffect, useRef } from "react";
import GenericModal from "./GenericForm";
import { StagiaireStep, StageInfoStep } from "../stageformcomponents/StageSteps"; 
import { 
  API, 
  NIVEAU_ETUDE_OPTIONS, 
  SERVICE_OPTIONS,
  DIRECTION_OPTIONS,
  DIVISION_OPTIONS
} from "../stageformcomponents/StageConstants";
import { 
  FileText, AlertCircle 
} from "lucide-react";

export default function StageForm({ initial, onClose, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [step, setStep] = useState(1);
  const [stagiaireChoice, setStagiaireChoice] = useState('new');
  
  const [stagiaires, setStagiaires] = useState([]);
  const [stagiaireOptions, setStagiaireOptions] = useState([]);
  const [encadrantOptions, setEncadrantOptions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [formData, setFormData] = useState({
    nom: "", 
    prenom: "", 
    ecole: "", 
    specialite: "", 
    niveau_etude: "Bac +2", 
    email: "", 
    telephone: "",
    theme: "", 
    type_stage: "Academique", 
    date_debut: "", 
    date_fin: "", 
    
    direction: "",
    division: "",
    
    unite: "",
    service: "",
    decision: "N° ME/F/INS/DG/DRH/DGCFC",
    lettre_acceptation: null,
    stagiaire: "",
    encadrant: "",
    existingStagiaire: "",
  });

  const [lettreFileName, setLettreFileName] = useState("");
  const [errors, setErrors] = useState({});
  const [availableBcrServices, setAvailableBcrServices] = useState([]);
  const [availableDivisions, setAvailableDivisions] = useState([]);
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const isEditMode = !!initial;

  
  useEffect(() => {
    if (formData.direction) {
      if (formData.direction === 'BCR') {
        
        setAvailableDivisions([]);
        setFormData(prev => ({ 
          ...prev, 
          division: ""
        }));
      } else {
       
        setAvailableDivisions(DIVISION_OPTIONS[formData.direction] || []);
        setAvailableBcrServices([]);
        setFormData(prev => ({ 
          ...prev, 
          unite: "",
          service: ""
        }));
      }
    } else {
      setAvailableDivisions([]);
      setAvailableBcrServices([]);
    }
  }, [formData.direction]);

   
  useEffect(() => {
    if (formData.direction === 'BCR' && formData.unite) {
      setAvailableBcrServices(SERVICE_OPTIONS[formData.unite] || []);
      setFormData(prev => ({ ...prev, service: "" }));
    } else {
      setAvailableBcrServices([]);
    }
  }, [formData.unite, formData.direction]);

  const handleDecisionChange = (e) => {
    const { value } = e.target;
    
    if (!value.startsWith("N°")) {
      setFormData(prev => ({
        ...prev,
        decision: "N° ME/F/INS/DG/DRH/DGCFC"
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        decision: value
      }));
    }
    
    if (errors.decision) {
      setErrors(prev => ({ ...prev, decision: null }));
    }
    setError(null);
  };

  
  const loadOptions = async () => {
    setSearchLoading(true);
    try {
      const [stagiairesRes, encadrantsRes] = await Promise.all([
        fetch(`${API}/stagiaires/api/`),
        fetch(`${API}/encadrants/api/`)
      ]);

      if (!stagiairesRes.ok || !encadrantsRes.ok) {
        throw new Error("Erreur lors du chargement des données");
      }

      const stagiairesData = await stagiairesRes.json();
      const encadrantsData = await encadrantsRes.json();
      
      setStagiaires(stagiairesData);
      
      setStagiaireOptions(stagiairesData.map(s => ({
        value: s.id,
        label: `${s.matricule || ''} - ${s.prenom} ${s.nom} ${s.ecole ? `(${s.ecole})` : ''}`
      })));

      setEncadrantOptions(encadrantsData.map(e => ({
        value: e.id,
        label: `${e.prenom} ${e.nom} - ${e.institution}`
      })));

    } catch (err) {
      console.error("Erreur chargement options:", err);
      setError("Erreur lors du chargement des listes de stagiaires/encadrants.");
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  
  useEffect(() => {
    if (isEditMode && initial) {
      setStep(2);
      setFormData(prev => ({
        ...prev,
        theme: initial.theme || "",
        type_stage: initial.type_stage || "Academique",
        date_debut: initial.date_debut || "",
        date_fin: initial.date_fin || "",
        direction: initial.direction || "",
        division: initial.division || "",
        unite: initial.unite || "",
        service: initial.service || "",
        decision: initial.decision || "N° ME/F/INS/DG/DRH/DGCFC",
        stagiaire: initial.stagiaire?.id || initial.stagiaire_id || "", 
        encadrant: initial.encadrant?.id || initial.encadrant_id || "",
        ecole: initial.stagiaire?.ecole || "",
        specialite: initial.stagiaire?.specialite || "",
        niveau_etude: initial.stagiaire?.niveau_etude || "Bac +2",
      }));
      if (initial.lettre_acceptation_url) {
        setLettreFileName("Fichier existant");
      }
    }
  }, [initial, isEditMode]);

  
  useEffect(() => {
    if (stagiaireChoice === 'existing' && formData.existingStagiaire && stagiaires.length > 0) {
      const selectedId = parseInt(formData.existingStagiaire);
      const selectedStagiaire = stagiaires.find(s => s.id === selectedId);
      if (selectedStagiaire) {
        setFormData(prev => ({
          ...prev,
          ecole: selectedStagiaire.ecole || "",
          specialite: selectedStagiaire.specialite || "",
          niveau_etude: selectedStagiaire.niveau_etude || "Bac +2"
        }));
      }
    }
  }, [formData.existingStagiaire, stagiaireChoice, stagiaires]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    setError(null);
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    setError(null);
  };

  const validateFile = (file) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 10 * 1024 * 1024;

    if (file) {
      if (!allowedTypes.includes(file.type)) {
        return 'Format de fichier non autorisé. Formats acceptés: PDF, JPG, PNG';
      } else if (file.size > maxSize) {
        return 'La taille du fichier ne doit pas dépasser 10 Mo';
      }
    }
    return null;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const fileError = validateFile(file);
    
    if (file) {
      if (fileError) {
        setErrors(prev => ({ ...prev, lettre_acceptation: fileError }));
        setFormData(prev => ({ ...prev, lettre_acceptation: null }));
        setLettreFileName(file.name);
      } else {
        setFormData(prev => ({ ...prev, lettre_acceptation: file }));
        setLettreFileName(file.name);
        if (errors.lettre_acceptation) {
          setErrors(prev => ({ ...prev, lettre_acceptation: null }));
        }
      }
    } else {
        setFormData(prev => ({ ...prev, lettre_acceptation: null }));
        setLettreFileName("");
        if (errors.lettre_acceptation) {
            setErrors(prev => ({ ...prev, lettre_acceptation: null }));
        }
    }
    setError(null);
  };

  const handleStagiaireChoiceChange = (choice) => {
    setStagiaireChoice(choice);
    if (choice === 'new') {
      setFormData(prev => ({
        ...prev,
        existingStagiaire: "",
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        nom: "", 
        prenom: "", 
        email: "", 
        telephone: "",
      }));
    }
    setError(null);
    setErrors({});
  };
  
 
  const validateStep1 = () => {
    const newErrors = {};

    if (stagiaireChoice === 'new') {
      if (!formData.nom.trim()) newErrors.nom = 'Le nom est obligatoire';
      if (!formData.prenom.trim()) newErrors.prenom = 'Le prénom est obligatoire';
      if (!formData.email.trim()) {
        newErrors.email = 'L\'email est obligatoire';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Format d\'email invalide';
      }
    } else {
      if (!formData.existingStagiaire) newErrors.existingStagiaire = 'Veuillez sélectionner un stagiaire existant';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const validateStep2 = () => {
  const newErrors = {};

  if (!formData.theme.trim()) newErrors.theme = 'Le thème du stage est obligatoire';
  if (!formData.date_debut) newErrors.date_debut = 'La date de début est obligatoire';
  if (!formData.date_fin) newErrors.date_fin = 'La date de fin est obligatoire';
  
  
  if (!formData.direction) newErrors.direction = 'La direction est obligatoire';
  
 
  if (formData.direction === 'BCR') {
    
    if (!formData.unite) newErrors.unite = 'L\'unité est obligatoire pour la direction BCR';
  } else if (formData.direction && formData.direction !== 'BCR') {
   
   
  }
  
  if (isEditMode && !formData.stagiaire) newErrors.stagiaire = 'Le stagiaire est obligatoire';

  if (formData.date_debut && formData.date_fin) {
    const debut = new Date(formData.date_debut);
    const fin = new Date(formData.date_fin);
    if (debut >= fin) newErrors.date_fin = 'La date de fin doit être postérieure à la date de début';
  }

  if (formData.lettre_acceptation) {
      const fileError = validateFile(formData.lettre_acceptation);
      if (fileError) {
          newErrors.lettre_acceptation = fileError;
      }
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
      setError(null);
    }
  };

  const handlePreviousStep = () => {
    setStep(1);
    setError(null);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;
    
    setLoading(true);
    setError(null);
    setErrors({});

    try {
      let stagiaireId;

      if (isEditMode) {
       
        const stageData = {
          theme: formData.theme,
          type_stage: formData.type_stage,
          date_debut: formData.date_debut,
          date_fin: formData.date_fin,
          direction: formData.direction,
         
          division: formData.division || null,
        
          unite: formData.unite || null,
      
          service: formData.service || null,
   
          decision: formData.decision,
          stagiaire: formData.stagiaire,
          encadrant: formData.encadrant || null,
        };

        const response = await fetch(`${API}/stages/api/${initial.id}/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(stageData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Erreur lors de la mise à jour du stage");
        }

        onSaved();
      } else {
       
        if (stagiaireChoice === 'new') {
       
          const stagiaireData = {
            nom: formData.nom,
            prenom: formData.prenom,
            ecole: formData.ecole,
            specialite: formData.specialite,
            niveau_etude: formData.niveau_etude,
            email: formData.email,
            telephone: formData.telephone,
          };

          const stagiaireResponse = await fetch(`${API}/stagiaires/api/create/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(stagiaireData),
          });

          if (!stagiaireResponse.ok) {
            const errorData = await stagiaireResponse.json();
            throw new Error(errorData.message || "Erreur lors de la création du stagiaire");
          }

          const newStagiaire = await stagiaireResponse.json();
          stagiaireId = newStagiaire.id;
        } else {
         
          stagiaireId = formData.existingStagiaire;

          const updatedStagiaireData = {
            ecole: formData.ecole,
            specialite: formData.specialite,
            niveau_etude: formData.niveau_etude,
          };

          const currentResponse = await fetch(`${API}/stagiaires/api/${stagiaireId}/`);
          if (currentResponse.ok) {
            const currentStagiaire = await currentResponse.json();
            const finalData = { ...currentStagiaire, ...updatedStagiaireData };

            await fetch(`${API}/stagiaires/api/${stagiaireId}/`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(finalData),
            });
          }
        }

        
        const formDataToSend = new FormData();
        formDataToSend.append('theme', formData.theme);
        formDataToSend.append('type_stage', formData.type_stage);
        formDataToSend.append('date_debut', formData.date_debut);
        formDataToSend.append('date_fin', formData.date_fin);
        formDataToSend.append('direction', formData.direction);
       
        formDataToSend.append('division', formData.division || '');
        
        formDataToSend.append('unite', formData.unite || '');
       
        formDataToSend.append('service', formData.service || '');
        
        formDataToSend.append('decision', formData.decision);
        formDataToSend.append('stagiaire', stagiaireId);
        
        if (formData.encadrant) {
          formDataToSend.append('encadrant', formData.encadrant);
        }
        
        if (formData.lettre_acceptation) {
          formDataToSend.append('lettre_acceptation', formData.lettre_acceptation);
        }

        const stageResponse = await fetch(`${API}/stages/api/create/`, {
          method: "POST",
          body: formDataToSend,
        });

        if (!stageResponse.ok) {
          const errorData = await stageResponse.json();
          throw new Error(errorData.message || "Erreur lors de la création du stage");
        }

        onSaved();
      }
    } catch (err) {
      setError(err.message || "Une erreur est survenue lors de la soumission");
      console.error("Erreur de soumission:", err);
    } finally {
      setLoading(false);
    }
  };
  

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const fileError = validateFile(file);
      
      if (fileError) {
        setErrors(prev => ({ ...prev, lettre_acceptation: fileError }));
        setFormData(prev => ({ ...prev, lettre_acceptation: null }));
        setLettreFileName(file.name);
      } else {
        setFormData(prev => ({ ...prev, lettre_acceptation: file }));
        setLettreFileName(file.name);
        if (errors.lettre_acceptation) {
          setErrors(prev => ({ ...prev, lettre_acceptation: null }));
        }
      }
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current.click();
  };

  const modalTitle = isEditMode ? "Modifier un Stage" : "Ajouter un nouveau Stage";
  const submitButtonText = isEditMode ? "Mettre à jour" : "Créer le stage";

  return (
    <GenericModal
      isOpen={true}
      onClose={onClose}
      title={modalTitle}
      icon={FileText}
      size="4xl"
      loading={loading}
    >
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle size={18} className="text-red-600" />
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Étape 1 - Informations du stagiaire*/}
        {!isEditMode && step === 1 && (
          <StagiaireStep
            formData={formData}
            handleChange={handleChange}
            handleSelectChange={handleSelectChange}
            handleStagiaireChoiceChange={handleStagiaireChoiceChange}
            stagiaireChoice={stagiaireChoice}
            stagiaireOptions={stagiaireOptions}
            searchLoading={searchLoading}
            errors={errors}
            handleNextStep={handleNextStep}
            loading={loading}
          />
        )}

        {/* Étape 2 - Informations du stage */}
        {(isEditMode || step === 2) && (
          <StageInfoStep
            formData={formData}
            handleChange={handleChange}
            handleSelectChange={handleSelectChange}
            handleFileChange={handleFileChange}
            handleDecisionChange={handleDecisionChange}
            handleSubmit={handleSubmit}
            handlePreviousStep={handlePreviousStep}
            onClose={onClose}
            isEditMode={isEditMode}
            availableServices={availableBcrServices}
            encadrantOptions={encadrantOptions}
            stagiaireOptions={stagiaireOptions}
            searchLoading={searchLoading}
            errors={errors}
            loading={loading}
            lettreFileName={lettreFileName}
            setLettreFileName={setLettreFileName}
            fileInputRef={fileInputRef}
            dragActive={dragActive}
            handleDrag={handleDrag}
            handleDrop={handleDrop}
            handleFileButtonClick={handleFileButtonClick}
            submitButtonText={submitButtonText}
            availableDivisions={availableDivisions}
            availableBcrServices={availableBcrServices}
          />
        )}
      </form>
    </GenericModal>
  );
}