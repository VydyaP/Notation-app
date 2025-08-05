import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const App = () => {
  const [keerthanas, setKeerthanas] = useState([]);
  const [filteredKeerthanas, setFilteredKeerthanas] = useState([]);
  const [classifications, setClassifications] = useState({
    ragas: [],
    talas: [],
    composers: [],
    deities: []
  });
  const [currentFilter, setCurrentFilter] = useState("all");
  const [selectedKeerthana, setSelectedKeerthana] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    raga: "",
    tala: "",
    composer: "",
    deity: "",
    date_taught: "",
    lyrics: "",
    meaning: ""
  });

  const [uploadFiles, setUploadFiles] = useState([]);

  useEffect(() => {
    fetchKeerthanas();
    fetchClassifications();
  }, []);

  const fetchKeerthanas = async () => {
    try {
      const response = await axios.get(`${API}/keerthanas`);
      setKeerthanas(response.data);
      setFilteredKeerthanas(response.data);
    } catch (error) {
      console.error("Error fetching keerthanas:", error);
      showNotification("Error fetching keerthanas", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchClassifications = async () => {
    try {
      const response = await axios.get(`${API}/classifications`);
      setClassifications(response.data);
    } catch (error) {
      console.error("Error fetching classifications:", error);
    }
  };

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const filterKeerthanas = (filterType, value = null) => {
    setCurrentFilter(filterType);
    
    if (filterType === "all") {
      setFilteredKeerthanas(keerthanas);
    } else {
      const filtered = keerthanas.filter(k => 
        k[filterType.replace("by-", "")] === value
      );
      setFilteredKeerthanas(filtered);
    }
  };

  const handleAddKeerthana = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/keerthanas`, formData);
      
      // Upload files if any
      if (uploadFiles.length > 0) {
        for (const file of uploadFiles) {
          const formData = new FormData();
          formData.append("file", file);
          await axios.post(`${API}/upload-notation/${response.data.id}`, formData);
        }
      }

      await fetchKeerthanas();
      setShowAddForm(false);
      resetForm();
      showNotification("Keerthana added successfully!");
    } catch (error) {
      console.error("Error adding keerthana:", error);
      showNotification("Error adding keerthana", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      raga: "",
      tala: "",
      composer: "",
      deity: "",
      date_taught: "",
      lyrics: "",
      meaning: ""
    });
    setUploadFiles([]);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setUploadFiles(files);
  };

  const groupKeerthanasByCategory = () => {
    if (currentFilter === "all") {
      return { "All Keerthanas": filteredKeerthanas };
    }

    const categoryKey = currentFilter.replace("by-", "");
    const groups = {};
    
    filteredKeerthanas.forEach(keerthana => {
      const key = keerthana[categoryKey];
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(keerthana);
    });

    return groups;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Keerthanas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
          notification.type === "error" 
            ? "bg-red-500 text-white" 
            : "bg-green-500 text-white"
        }`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-orange-600 via-orange-500 to-yellow-500 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">🎵 Keerthana Collection</h1>
              <p className="text-orange-100">Carnatic Music Notation Management</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              + Add Keerthana
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8 overflow-x-auto py-4">
            <button
              onClick={() => filterKeerthanas("all")}
              className={`whitespace-nowrap px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                currentFilter === "all"
                  ? "bg-orange-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-orange-100"
              }`}
            >
              All ({keerthanas.length})
            </button>
            <button
              onClick={() => filterKeerthanas("by-raga")}
              className={`whitespace-nowrap px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                currentFilter === "by-raga"
                  ? "bg-blue-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-blue-100"
              }`}
            >
              By Raga ({classifications.ragas.length})
            </button>
            <button
              onClick={() => filterKeerthanas("by-tala")}
              className={`whitespace-nowrap px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                currentFilter === "by-tala"
                  ? "bg-green-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-green-100"
              }`}
            >
              By Tala ({classifications.talas.length})
            </button>
            <button
              onClick={() => filterKeerthanas("by-composer")}
              className={`whitespace-nowrap px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                currentFilter === "by-composer"
                  ? "bg-purple-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-purple-100"
              }`}
            >
              By Composer ({classifications.composers.length})
            </button>
            <button
              onClick={() => filterKeerthanas("by-deity")}
              className={`whitespace-nowrap px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                currentFilter === "by-deity"
                  ? "bg-indigo-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-indigo-100"
              }`}
            >
              By Deity ({classifications.deities.length})
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {Object.entries(groupKeerthanasByCategory()).map(([groupName, groupKeerthanas]) => (
          <div key={groupName} className="mb-12">
            {currentFilter !== "all" && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{groupName}</h2>
                <div className="w-20 h-1 bg-gradient-to-r from-orange-500 to-yellow-500 rounded"></div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupKeerthanas.map((keerthana) => (
                <div
                  key={keerthana.id}
                  onClick={() => setSelectedKeerthana(keerthana)}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{keerthana.name}</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                          {keerthana.raga}
                        </span>
                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                          {keerthana.tala}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span className="font-medium">Composer:</span>
                        <span>{keerthana.composer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Deity:</span>
                        <span>{keerthana.deity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Taught:</span>
                        <span>{formatDate(keerthana.date_taught)}</span>
                      </div>
                    </div>

                    {keerthana.notation_files && keerthana.notation_files.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center text-sm text-indigo-600">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
                          </svg>
                          {keerthana.notation_files.length} notation file(s)
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>

      {/* Keerthana Detail Modal */}
      {selectedKeerthana && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">{selectedKeerthana.name}</h2>
              <button
                onClick={() => setSelectedKeerthana(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Raga:</span>
                        <span className="text-blue-600 font-medium">{selectedKeerthana.raga}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Tala:</span>
                        <span className="text-green-600 font-medium">{selectedKeerthana.tala}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Composer:</span>
                        <span className="text-purple-600 font-medium">{selectedKeerthana.composer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Deity:</span>
                        <span className="text-indigo-600 font-medium">{selectedKeerthana.deity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Date Taught:</span>
                        <span className="text-gray-800">{formatDate(selectedKeerthana.date_taught)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {selectedKeerthana.lyrics && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Lyrics</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-800 whitespace-pre-line">{selectedKeerthana.lyrics}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedKeerthana.meaning && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Meaning</h3>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-gray-800">{selectedKeerthana.meaning}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notation Files */}
              {selectedKeerthana.notation_files && selectedKeerthana.notation_files.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Notation Files</h3>
                  {selectedKeerthana.notation_files.map((file, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-gray-900">{file.name}</h4>
                        <a
                          href={`${BACKEND_URL}${file.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors"
                        >
                          Open in New Tab
                        </a>
                      </div>
                      
                      {file.type === 'pdf' ? (
                        <iframe
                          src={`${BACKEND_URL}${file.url}`}
                          className="w-full h-96 border rounded"
                          title={file.name}
                        />
                      ) : (
                        <img
                          src={`${BACKEND_URL}${file.url}`}
                          alt={file.name}
                          className="w-full h-auto max-h-96 object-contain border rounded"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Keerthana Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Add New Keerthana</h2>
              <button
                onClick={() => { setShowAddForm(false); resetForm(); }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleAddKeerthana} className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Keerthana Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter keerthana name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Raga</label>
                  <input
                    type="text"
                    required
                    value={formData.raga}
                    onChange={(e) => setFormData({...formData, raga: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter raga name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tala</label>
                  <input
                    type="text"
                    required
                    value={formData.tala}
                    onChange={(e) => setFormData({...formData, tala: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter tala name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Composer</label>
                  <input
                    type="text"
                    required
                    value={formData.composer}
                    onChange={(e) => setFormData({...formData, composer: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter composer name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deity</label>
                  <input
                    type="text"
                    required
                    value={formData.deity}
                    onChange={(e) => setFormData({...formData, deity: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter deity name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Taught</label>
                  <input
                    type="date"
                    required
                    value={formData.date_taught}
                    onChange={(e) => setFormData({...formData, date_taught: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lyrics (Optional)</label>
                <textarea
                  value={formData.lyrics}
                  onChange={(e) => setFormData({...formData, lyrics: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  rows="4"
                  placeholder="Enter lyrics..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meaning (Optional)</label>
                <textarea
                  value={formData.meaning}
                  onChange={(e) => setFormData({...formData, meaning: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  rows="3"
                  placeholder="Enter meaning..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notation Files (Optional)</label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <p className="text-sm text-gray-500 mt-1">Upload PDF files or images (JPG, PNG)</p>
              </div>
              
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                >
                  Add Keerthana
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); resetForm(); }}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;