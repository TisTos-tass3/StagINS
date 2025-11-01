import React, { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  Calendar,
  FileText,
  AlertTriangle,
  Clock,
  FileWarning,
  MapPin,
  ClipboardCheck,
  ChevronRight,
  Building
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import AlertesStages from "../components/AlertesStages"; 

const PIE_COLORS = {
  "En cours": "#3b82f6",
  Validé: "#10b981",
  Terminé: "#f59e0b",
};

const LOCATION_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#64748b'
];

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stagiairesParUnite, setStagiairesParUnite] = useState([]);
  const [activeChart, setActiveChart] = useState("status");

  useEffect(() => {
    fetchDashboardData();
    fetchStagiairesParUnite();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/dashboard/api/");
      if (!response.ok) throw new Error("Erreur de chargement des données");
      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err.message);
      console.error("Erreur dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStagiairesParUnite = async () => {
    try {
      const response = await fetch("http://localhost:8000/stages/api/");
      if (response.ok) {
        const stages = await response.json();
        
        
        const repartitionParUnite = stages.reduce((acc, stage) => {
          const unite = stage.unite || "Non spécifié";
          if (!acc[unite]) {
            acc[unite] = 0;
          }
          acc[unite]++;
          return acc;
        }, {});

        const dataPourGraphique = Object.entries(repartitionParUnite)
          .map(([name, value], index) => ({
            name: name.length > 15 ? name.substring(0, 15) + "..." : name,
            fullName: name,
            value,
            fill: LOCATION_COLORS[index % LOCATION_COLORS.length]
          }))
          .sort((a, b) => b.value - a.value);

        setStagiairesParUnite(dataPourGraphique);
      }
    } catch (error) {
      console.error("Erreur chargement répartition par unité:", error);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subText, onClick, children }) => (
    <div
      className="bg-white rounded-lg shadow-lg p-3 sm:p-4 border-l-4 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
      style={{ borderLeftColor: color }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
            {value}
          </p>
          {subText && (
            <p className="text-xs text-gray-600 mt-2 line-clamp-2">
              {subText}
            </p>
          )}
          {children}
        </div>
        <div className="ml-2 flex-shrink-0">
          <div 
            className="p-1 sm:p-2 rounded-full"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="text-gray-700" size={16} style={{ color }} />
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end text-xs text-blue-600 hover:underline">
        Voir détails
        <ChevronRight size={14} className="ml-1" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <AlertTriangle className="mx-auto text-red-600 mb-2" size={20} />
        <h3 className="text-red-800 font-semibold text-sm">Erreur de chargement</h3>
        <p className="text-red-600 text-xs mt-1">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-3 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center text-gray-500 p-4 text-sm">
        Aucune donnée disponible
      </div>
    );
  }

  const {
    total_stagiaires,
    total_encadrants,
    stages_encours,
    stages_termines,
    stages_valides,
    total_stages,
    rapports_en_attente,
    rapports_valides,
    rapports_archives,
    total_rapports,
    stages_bientot_finis,
    stages_retard_non_valides,
    stages_by_status,
    monthly_stages,
  } = dashboardData;

  return (
    <div className="space-y-3 sm:space-y-6 p-4">
      {/* Cartes de statistiques */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Stagiaires"
          value={total_stagiaires}
          icon={Users}
          color="#3b82f6"
          onClick={() => (window.location.href = "/stagiaires")}
        />

        <StatCard
          title="Encadrants"
          value={total_encadrants}
          icon={UserCheck}
          color="#10b981"
          onClick={() => (window.location.href = "/encadrants")}
        />

        <StatCard
          title="Stages"
          value={total_stages}
          icon={Calendar}
          color="#8b5cf6"
          subText={`En cours: ${stages_encours} | Validés: ${stages_valides} | Terminés: ${stages_termines}`}
          onClick={() => (window.location.href = "/stages")}
        />

        <StatCard
          title="Rapports"
          value={total_rapports}
          icon={FileText}
          color="#f59e0b"
          subText={`En attente: ${rapports_en_attente} | Validés: ${rapports_valides} | Archivés: ${rapports_archives}`}
          onClick={() => (window.location.href = "/rapports")}
        />
      </div>

      {/* Alertes Stages*/}
      {dashboardData && <AlertesStages alertes={dashboardData} />}

      {/* Section Graphiques */}
      <div className="lg:hidden">
        <div className="flex space-x-1 mb-2">
          <button
            onClick={() => setActiveChart("status")}
            className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-colors ${
              activeChart === "status" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Statut Stages
          </button>
          <button
            onClick={() => setActiveChart("location")}
            className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-colors ${
              activeChart === "location" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Par Unité
          </button>
        </div>

        {/* Graphique actif */}
        <div className="bg-white rounded-lg shadow-lg p-3">
          {activeChart === "status" ? (
            <>
              <h3 className="text-sm font-semibold mb-2 text-gray-800">
                Répartition des Stages
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stages_by_status || []}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      label={({ name, percent }) => 
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                    >
                      {stages_by_status?.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[entry.name] || "#ccc"}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} stages`, 'Nombre']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold mb-2 text-gray-800 flex items-center">
                <Building className="mr-1 text-blue-600" size={16} />
                Stagiaires par Unité
              </h3>
              <div className="h-48">
                {stagiairesParUnite.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stagiairesParUnite}
                      margin={{ top: 10, right: 5, left: 5, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={50}
                        interval={0}
                        fontSize={8}
                      />
                      <YAxis fontSize={10} />
                      <Tooltip 
                        formatter={(value) => [`${value} stagiaires`, 'Nombre']}
                        labelFormatter={(label) => {
                          const fullItem = stagiairesParUnite.find(item => item.name === label);
                          return `Unité: ${fullItem?.fullName || label}`;
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        name="Nombre de stagiaires"
                      >
                        {stagiairesParUnite.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 text-xs">
                    <Building size={24} className="mb-1 text-gray-300" />
                    <p className="text-center">Aucune donnée d'unité d'affectation disponible</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Section Graphiques Desktop */}
      <div className="hidden lg:grid grid-cols-1 xl:grid-cols-2 gap-3">
        {/* Répartition des stages (PieChart) */}
        <div className="bg-white rounded-lg shadow-lg p-3">
          <h3 className="text-sm font-semibold mb-2 text-gray-800 flex items-center">
            <ClipboardCheck className="mr-1 text-blue-600" size={16} />
            Répartition des Stages par Statut
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stages_by_status || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, percent }) => 
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                >
                  {stages_by_status?.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[entry.name] || "#ccc"}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} stages`, 'Nombre']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Répartition des Stagiaires par Unité d'Affectation */}
        <div className="bg-white rounded-lg shadow-lg p-3">
          <h3 className="text-sm font-semibold mb-2 text-gray-800 flex items-center">
            <Building className="mr-1 text-blue-600" size={16} />
            Répartition des Stagiaires par Unité
          </h3>
          <div className="h-64"> 
            {stagiairesParUnite.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={stagiairesParUnite}
                  margin={{ top: 10, right: 20, left: 10, bottom: 5 }} 
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number"
                    fontSize={10} 
                  />
                  <YAxis 
                    dataKey="name"
                    type="category"
                    fontSize={10}
                    width={60}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} stagiaires`, 'Nombre']}
                    labelFormatter={(label) => {
                      const fullItem = stagiairesParUnite.find(item => item.name === label);
                      return `Unité: ${fullItem?.fullName || label}`;
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    name="Nombre de stagiaires"
                  >
                    {stagiairesParUnite.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 text-xs">
                <Building size={32} className="mb-1 text-gray-300" />
                <p>Aucune donnée d'unité d'affectation disponible</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stages par Mois (BarChart) */}
      {monthly_stages && monthly_stages.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-3 ">
          <h3 className="text-sm font-semibold mb-2 text-gray-800">
            Stages par Mois ({new Date().getFullYear()})
          </h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly_stages || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  fontSize={10}
                />
                <YAxis allowDecimals={false} fontSize={10} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Stages" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}