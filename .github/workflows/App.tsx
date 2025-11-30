
import React, { useState, useEffect } from 'react';
import ScannerView from './components/ScannerView';
import TableView from './components/TableView';
import FolderView from './components/FolderView';
import { QrCodeIcon, TableIcon, FolderIcon } from './components/Icons';
import { AppTab, ScannedItem } from './types';
import { identifyProduct } from './services/geminiService';

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.SCANNER);
  
  // Global State for Scanned Data
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('scannedItems');
    if (saved) {
      try {
        setScannedItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load scanned items", e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('scannedItems', JSON.stringify(scannedItems));
  }, [scannedItems]);

  const handleScan = (code: string, format: string) => {
      const newItem: ScannedItem = {
          id: Date.now().toString(),
          code: code,
          format: format,
          timestamp: Date.now()
      };
      // Add new item to the top of the list
      setScannedItems(prev => [newItem, ...prev]);
  };

  const handleDeleteItem = (id: string) => {
      setScannedItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateName = (id: string, name: string) => {
    setScannedItems(prev => prev.map(item => 
        item.id === id ? { ...item, name: name } : item
    ));
  };

  const handleUpdateManualCode = (id: string, code: string) => {
    setScannedItems(prev => prev.map(item => 
        item.id === id ? { ...item, manualCode: code } : item
    ));
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to delete all data?")) {
        setScannedItems([]);
    }
  };

  const handleClearDate = (dateStr: string) => {
      if(confirm(`Delete all scans from ${dateStr}?`)) {
          setScannedItems(prev => prev.filter(item => new Date(item.timestamp).toLocaleDateString() !== dateStr));
          setSelectedDate(null);
      }
  }

  const handleAnalyzeItem = async (id: string) => {
      const itemToAnalyze = scannedItems.find(i => i.id === id);
      if (!itemToAnalyze) return;

      // Set loading
      setScannedItems(prev => prev.map(item => item.id === id ? { ...item, isLoading: true } : item));

      try {
          const analysis = await identifyProduct(itemToAnalyze.code);
          setScannedItems(prev => prev.map(item => item.id === id ? { ...item, description: analysis, isLoading: false } : item));
      } catch (e) {
          setScannedItems(prev => prev.map(item => item.id === id ? { ...item, description: "Analysis failed.", isLoading: false } : item));
      }
  };

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.SCANNER:
        return <ScannerView onScan={handleScan} />;
      case AppTab.DATA:
        return (
            <TableView 
                items={scannedItems} 
                onDelete={handleDeleteItem} 
                onUpdateName={handleUpdateName}
                onUpdateManualCode={handleUpdateManualCode}
                onAnalyze={handleAnalyzeItem}
                onClearAll={handleClearAll}
            />
        );
      case AppTab.FILES:
        if (selectedDate) {
             const itemsForDate = scannedItems.filter(item => new Date(item.timestamp).toLocaleDateString() === selectedDate);
             return (
                 <TableView
                    items={itemsForDate}
                    onDelete={handleDeleteItem}
                    onUpdateName={handleUpdateName}
                    onUpdateManualCode={handleUpdateManualCode}
                    onAnalyze={handleAnalyzeItem}
                    onClearAll={() => handleClearDate(selectedDate)}
                    title={selectedDate}
                    onBack={() => setSelectedDate(null)}
                 />
             )
        }
        return (
            <FolderView 
                items={scannedItems} 
                onSelectFolder={(date) => setSelectedDate(date)} 
            />
        );
      default:
        return <ScannerView onScan={handleScan} />;
    }
  };

  return (
    <div className="flex justify-center bg-black min-h-screen">
      {/* Mobile-first container: constrained width on desktop, full on mobile */}
      <div className="w-full max-w-md bg-gray-950 h-[100dvh] flex flex-col shadow-2xl relative overflow-hidden border-x border-gray-800">
        
        {/* Header - Centered SPC Logo */}
        <header className="h-16 px-6 flex items-center justify-center border-b border-gray-800 bg-background/80 backdrop-blur-md z-10 sticky top-0">
          <div className="flex flex-col items-center justify-center">
             {/* Recreating the SPC Logo look with text to ensure no background artifacts */}
            <h1 className="font-extrabold text-3xl tracking-tighter text-white leading-none">SPC</h1>
            <span className="text-[9px] font-bold text-cyan-500 tracking-[0.2em] uppercase">SAZEH PEYVAND</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden relative">
            {renderContent()}
        </main>

        {/* Bottom Navigation */}
        <nav className="h-20 bg-surface/90 backdrop-blur-lg border-t border-gray-800 absolute bottom-0 w-full flex items-start justify-around pt-3 pb-8 z-20">

          <button
            onClick={() => setActiveTab(AppTab.SCANNER)}
            className={`flex flex-col items-center gap-1 w-14 transition-colors ${
              activeTab === AppTab.SCANNER ? 'text-green-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <QrCodeIcon className={`w-6 h-6 ${activeTab === AppTab.SCANNER ? 'fill-current opacity-20' : ''}`} />
            <span className="text-[10px] font-medium">Scan</span>
          </button>

          <button
            onClick={() => setActiveTab(AppTab.DATA)}
            className={`flex flex-col items-center gap-1 w-14 transition-colors ${
              activeTab === AppTab.DATA ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <TableIcon className={`w-6 h-6 ${activeTab === AppTab.DATA ? 'fill-current opacity-20' : ''}`} />
            <span className="text-[10px] font-medium">History</span>
          </button>

           <button
            onClick={() => {
                setActiveTab(AppTab.FILES);
                setSelectedDate(null); // Reset drilldown when entering tab
            }}
            className={`flex flex-col items-center gap-1 w-14 transition-colors ${
              activeTab === AppTab.FILES ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <FolderIcon className={`w-6 h-6 ${activeTab === AppTab.FILES ? 'fill-current opacity-20' : ''}`} />
            <span className="text-[10px] font-medium">File</span>
          </button>
        </nav>

      </div>
    </div>
  );
}

export default App;