import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, ChevronLeft, User, Calendar, FileText, Building, Users } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const STAGE_STATUS_STYLES = {
    'Validé': { badge: 'text-green-800 bg-green-200', border: 'border-green-500' },
    'En cours': { badge: 'text-yellow-800 bg-yellow-200', border: 'border-yellow-500' },
    'Terminé': { badge: 'text-gray-800 bg-gray-200', border: 'border-gray-500' },
};

const RapportBadge = ({ statut }) => {
    let style = 'text-gray-700 bg-gray-100 border-gray-300';
    if (statut === 'Validé') style = 'text-green-700 bg-green-100 border-green-300';
    if (statut === 'En attente') style = 'text-yellow-700 bg-yellow-100 border-yellow-300';
    if (statut === 'Non Déposé') style = 'text-red-700 bg-red-100 border-red-300';

    return (
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${style}`}>
            {statut}
        </span>
    );
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR');
};


const getAffectationNames = (stage) => {

  if (stage.direction === 'BCR') {
    return {
      directionNom: stage.direction|| 'BCR - Bureau du Recensement National',
      divisionNom: stage.division || 'Non applicable',
      uniteNom: stage.unite || 'Non définie',
      serviceNom: stage.service|| 'Non défini'
    };
  } else {
    
    return {
      directionNom: stage.direction || 'Non définie',
      divisionNom: stage.division || 'Non définie',
      uniteNom: stage.unite || 'Non applicable',
      serviceNom: stage.service|| 'Non applicable'
    };
  }
};

export default function StagiaireDetail() {
    const { stagiaireId } = useParams(); 
    const [stagiaire, setStagiaire] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        fetch(`http://localhost:8000/stagiaires/api/${stagiaireId}/detail/`) 
            .then(response => {
                if (!response.ok) throw new Error('Stagiaire non trouvé ou erreur réseau');
                return response.json();
            })
            .then(data => {
                
                const stagesWithAffectationNames = data.stages?.map(stage => ({
                  ...stage,
                  ...getAffectationNames(stage)
                })) || [];
                
                setStagiaire({
                  ...data,
                  stages: stagesWithAffectationNames
                });
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError(err.message);
                setLoading(false);
            });
    }, [stagiaireId]);

    const downloadStagiairePDF = () => {
        if (!stagiaire) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        
        doc.setFontSize(20);
        doc.setTextColor(30, 64, 175);
        doc.text('DOSSIER STAGIAIRE', pageWidth / 2, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setTextColor(55, 65, 81);
        doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 30, { align: 'center' });
        
        let yPosition = 45;

        doc.setFontSize(16);
        doc.setTextColor(30, 64, 175);
        doc.text('INFORMATIONS PERSONNELLES', 14, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        
        const infoData = [
            ['Nom & Prénom:', `${stagiaire.nom} ${stagiaire.prenom}`],
            ['Matricule:', stagiaire.matricule || 'Non attribué'],
            ['Email:', stagiaire.email],
            ['Téléphone:', stagiaire.telephone || 'Non renseigné'],
            ['École:', stagiaire.ecole || 'Non renseignée'],
            ['Spécialité:', stagiaire.specialite || 'Non renseignée'],
            ['Niveau d\'étude:', stagiaire.niveau_etude || 'Non renseigné']
        ];

        autoTable(doc, {
            startY: yPosition,
            head: [['Champ', 'Valeur']],
            body: infoData,
            theme: 'grid',
            headStyles: {
                fillColor: [30, 64, 175],
                textColor: 255,
                fontStyle: 'bold'
            },
            styles: {
                fontSize: 10,
                cellPadding: 3
            },
            columnStyles: {
                0: { fontStyle: 'bold', fillColor: [243, 244, 246] },
                1: { fillColor: [255, 255, 255] }
            }
        });

        yPosition = doc.lastAutoTable.finalY + 15;

        if (stagiaire.stages && stagiaire.stages.length > 0) {
            doc.setFontSize(16);
            doc.setTextColor(30, 64, 175);
            doc.text(`HISTORIQUE DES STAGES (${stagiaire.stages.length})`, 14, yPosition);
            yPosition += 10;

            const stagesData = [];
            
            stagiaire.stages.forEach((stage, index) => {
                const rapport = stage.rapport || { statut: "Non Déposé" };
                const { directionNom, divisionNom, uniteNom, serviceNom } = getAffectationNames(stage);
                
                stagesData.push([`STAGE ${index + 1}`, '']);
                stagesData.push(['Thème', stage.theme]);
                stagesData.push(['Période', `${formatDate(stage.date_debut)} - ${formatDate(stage.date_fin)}`]);
                stagesData.push(['Type', stage.type_stage]);
                stagesData.push(['Statut', stage.statut]);
                
                
                if (stage.direction === 'BCR') {
                    stagesData.push(['Direction', directionNom]);
                    stagesData.push(['Unité d\'affectation', uniteNom]);
                    stagesData.push(['Service d\'affectation', serviceNom]);
                } else {
                    stagesData.push(['Direction', directionNom]);
                    stagesData.push(['Division d\'affectation', divisionNom]);
                    stagesData.push(['Unité/Service', 'Non applicable']);
                }
                
                stagesData.push(['Encadrant', stage.encadrant_nom || 'Non assigné']);
                stagesData.push(['Rapport', `${rapport.statut}${rapport.date_depot ? ` (Déposé le ${formatDate(rapport.date_depot)})` : ''}`]);
                
                if (index < stagiaire.stages.length - 1) {
                    stagesData.push(['', '']);
                }
            });

            autoTable(doc, {
                startY: yPosition,
                head: [['Champ', 'Valeur']],
                body: stagesData,
                theme: 'grid',
                headStyles: {
                    fillColor: [30, 64, 175],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                styles: {
                    fontSize: 9,
                    cellPadding: 3
                },
                columnStyles: {
                    0: { 
                        fontStyle: (data) => {
                            return data.cell.raw.includes('STAGE') ? 'bold' : 'normal';
                        }, 
                        fillColor: [243, 244, 246],
                        cellWidth: 60 
                    },
                    1: { 
                        fillColor: [255, 255, 255],
                        cellWidth: 120 
                    }
                },
                didParseCell: function (data) {
                    if (data.cell.raw.includes('STAGE')) {
                        data.cell.styles.fillColor = [30, 64, 175];
                        data.cell.styles.textColor = [255, 255, 255];
                        data.cell.styles.fontStyle = 'bold';
                    }
                    
                    if (data.cell.raw === '') {
                        data.cell.styles.fillColor = [249, 250, 251];
                        data.cell.styles.minCellHeight = 5;
                    }
                },
                didDrawPage: function (data) {
                    doc.setFontSize(8);
                    doc.setTextColor(128, 128, 128);
                    doc.text(
                        `Page ${doc.internal.getNumberOfPages()}`,
                        data.settings.margin.left,
                        doc.internal.pageSize.height - 10
                    );
                }
            });
        } else {
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            doc.text('Aucun stage enregistré pour ce stagiaire', 14, yPosition);
        }

        const fileName = `dossier_${stagiaire.matricule}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    };

    if (loading) return <div className="p-6 text-center text-xl text-blue-600">Chargement du dossier...</div>;
    if (error || !stagiaire) return <div className="p-6 text-center text-red-600">Erreur : {error || "Aucun stagiaire trouvé."}</div>;

    const { nom, prenom, matricule, email, telephone, ecole, specialite, niveau_etude, stages } = stagiaire;

    return (
        <div className=" p-6">
            {/* En-tête */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <Link to="/stagiaires" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 font-semibold transition-colors">
                        <ChevronLeft size={20} className="mr-1" /> Retour à la liste des Stagiaires
                    </Link>
                    <h1 className="text-3xl font-bold mb-2">Dossier Stagiaire</h1>
                    <p className="text-xl text-blue-600 font-mono">Matricule : {matricule} - {nom} {prenom}</p>
                </div>
                
                <button
                    onClick={downloadStagiairePDF}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md"
                >
                    <Download size={20} />
                    Télécharger PDF
                </button>
            </div>

            {/* Bloc d'Informations Personnelles */}
            <div className="bg-white shadow-xl rounded-lg p-6 mb-8 border-t-4 border-blue-500">
                <h2 className="text-2xl font-semibold mb-4 text-gray-700 flex items-center">
                    <User size={24} className="mr-2 text-blue-500" /> Informations Personnelles
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-800">
                    <div className="border-b pb-2"><strong className="text-gray-600">Nom & Prénom:</strong> {nom} {prenom}</div>
                    <div className="border-b pb-2"><strong className="text-gray-600">Matricule:</strong> {matricule}</div>
                    <div className="border-b pb-2"><strong className="text-gray-600">Téléphone:</strong> {telephone}</div>
                    <div className="border-b pb-2"><strong className="text-gray-600">Email:</strong> {email}</div>
                    <div className="border-b pb-2"><strong className="text-gray-600">École:</strong> {ecole}</div>
                    <div className="border-b pb-2"><strong className="text-gray-600">Niveau/Spécialité:</strong> {niveau_etude} / {specialite}</div>
                </div>
            </div>

            {/* Bloc de l'Historique des Stages */}
            <div className="bg-white shadow-xl rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-6 text-gray-700 flex items-center">
                    <Calendar size={24} className="mr-2 text-blue-500" /> Historique des Stages ({stages ? stages.length : 0})
                </h2>
                
                {stages && stages.length > 0 ? (
                    stages.map((stage) => {
                        const style = STAGE_STATUS_STYLES[stage.statut] || STAGE_STATUS_STYLES['Terminé'];
                        const rapport = stage.rapport || { statut: "Non Déposé" };
                        const hasDownload = rapport.statut === 'Validé' || rapport.statut === 'Archivé';
                        const { directionNom, divisionNom, uniteNom, serviceNom } = getAffectationNames(stage);
                        
                        return (
                            <div key={stage.id} className={`border-l-4 ${style.border} p-4 mb-4 bg-gray-50 hover:bg-white transition-colors rounded-r-md shadow-sm`}>
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-xl font-bold text-gray-800">{stage.theme}</h3>
                                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${style.badge}`}>
                                        {stage.statut}
                                    </span>
                                </div>
                                
                                <div className="text-gray-600 space-y-1">
                                    <p>Période: {formatDate(stage.date_debut)} &rarr; {formatDate(stage.date_fin)}</p>
                                    <p>Encadrant: <span className="font-semibold">{stage.encadrant_nom}</span></p>
                                    <p>Type: <span className="font-semibold">{stage.type_stage}</span></p>
                                    
                                   
                                    {stage.direction === 'BCR' ? (
                                        <div className="flex flex-col sm:flex-row sm:space-x-4">
                                            <p>Direction: <span className="font-semibold">{directionNom}</span></p>
                                            <p>Unité: <span className="font-semibold">{uniteNom}</span></p>
                                            <p>Service: <span className="font-semibold">{serviceNom}</span></p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col sm:flex-row sm:space-x-4">
                                            <p>Direction: <span className="font-semibold">{directionNom}</span></p>
                                            <p>Division: <span className="font-semibold">{divisionNom}</span></p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
                                    <div className="flex items-center">
                                        <strong className="text-gray-700 mr-2 flex items-center"><FileText size={18} className="mr-1" /> Rapport :</strong> 
                                        <RapportBadge statut={rapport.statut} />
                                        {rapport.date_depot && <span className="ml-2 text-sm text-gray-500">- Déposé le {formatDate(rapport.date_depot)}</span>}
                                    </div>
                                    
                                    {hasDownload && (
                                        <button 
                                            onClick={() => window.open(rapport.download_url, '_blank')}
                                            className="flex items-center text-blue-600 hover:text-blue-800 font-semibold transition-colors" 
                                        >
                                            <Download size={18} className="mr-1" />
                                            Télécharger
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-gray-500 p-4 border border-dashed rounded-md text-center">
                        Ce stagiaire n'a pas encore d'historique de stages enregistré.
                    </div>
                )}
            </div>
        </div>
    );
}