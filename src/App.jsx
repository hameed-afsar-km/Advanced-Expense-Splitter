import { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useSettingsStore } from './store';

// Components
import { SplashScreen } from './components/SplashScreen';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Toast } from './components/ui/Toast';
import { ModalManager } from './components/modals/ModalManager';

// Pages
import { Home } from './pages/Home';
import { TripDetails } from './pages/TripDetails';

function App() {
  const [trips, setTrips] = useState(() => {
    const savedTrips = localStorage.getItem('splitsync_trips');
    return savedTrips ? JSON.parse(savedTrips) : [];
  });

  const [currentTripId, setCurrentTripId] = useState(null);
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState([]);
  const [showSplash, setShowSplash] = useState(true);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // PWA Install Prompt
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!installPrompt) return;
    const result = await installPrompt.prompt();
    if (result.outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentTripId]);

  const { currency, setCurrency, themePrimary, setThemePrimary, themeSecondary, setThemeSecondary, resetTheme } = useSettingsStore();

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-1', themePrimary);
    document.documentElement.style.setProperty('--accent-2', themeSecondary);
  }, [themePrimary, themeSecondary]);

  // States for filtering and search
  const [homeSearchTerm, setHomeSearchTerm] = useState('');
  const [homeSortBy, setHomeSortBy] = useState('date-desc');
  const [homeFilterType, setHomeFilterType] = useState('all');
  const [homeDateFrom, setHomeDateFrom] = useState('');
  const [homeDateTo, setHomeDateTo] = useState('');
  const [tripSearchTerm, setTripSearchTerm] = useState('');
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalState, setModalState] = useState({ isOpen: false, type: null, data: null });

  const currentTrip = useMemo(() => trips.find(t => t.id === currentTripId), [trips, currentTripId]);

  const filteredTrips = useMemo(() => {
    return trips
      .filter(trip => {
        const searchRaw = homeSearchTerm.toLowerCase();
        const matchSearch = (trip.tripName && trip.tripName.toLowerCase().includes(searchRaw)) ||
          (trip.startDate && trip.startDate.includes(searchRaw)) ||
          (trip.endDate && trip.endDate.includes(searchRaw));
        if (!matchSearch) return false;

        if (homeFilterType === 'single' && !trip.isSingleDay) return false;
        if (homeFilterType === 'multi' && trip.isSingleDay) return false;

        const tStart = new Date(trip.startDate);
        if (homeDateFrom && tStart < new Date(homeDateFrom)) return false;
        if (homeDateTo && tStart > new Date(homeDateTo)) return false;

        return true;
      })
      .sort((a, b) => {
        switch (homeSortBy) {
          case 'date-asc': return new Date(a.startDate) - new Date(b.startDate);
          case 'date-desc': return new Date(b.startDate) - new Date(a.startDate);
          case 'name-asc': return a.tripName.localeCompare(b.tripName);
          case 'name-desc': return b.tripName.localeCompare(a.tripName);
          default: return 0;
        }
      });
  }, [trips, homeSearchTerm, homeFilterType, homeDateFrom, homeDateTo, homeSortBy]);

  useEffect(() => {
    localStorage.setItem('splitsync_trips', JSON.stringify(trips));
  }, [trips]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleUndo = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setTrips(prev.state);
      setHistory(history.slice(0, -1));
      setToast({ message: `Undid: ${prev.action}`, id: crypto.randomUUID() });
    } else {
      setToast({ message: "Nothing to undo", id: crypto.randomUUID() });
    }
  };

  const updateTrip = (tripId, updater, undoMessage = "Action successful") => {
    const prevTrips = [...trips];
    setHistory(prev => [...prev, { action: undoMessage, state: prevTrips }]);
    setTrips(prevTrips.map(t => (t.id === tripId ? updater(t) : t)));
    setToast({ message: undoMessage, id: crypto.randomUUID(), canUndo: true });
  };

  const openModal = (type, data = null) => {
    setModalState({ isOpen: true, type, data });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null, data: null });
    setModalSearchTerm('');
  };

  // ---- Trip Methods ----
  const TRIP_LIMIT = 5;
  const MEMBER_LIMIT = 10;

  const handleCreateTrip = (e) => {
    e.preventDefault();
    if (trips.length >= TRIP_LIMIT) {
      closeModal();
      setTimeout(() => openModal('LIMIT_REACHED', { type: 'trips', limit: TRIP_LIMIT }), 50);
      return;
    }

    const formData = new FormData(e.target);
    const tripName = formData.get('tripName');
    const isSingleDay = formData.get('isSingleDay') === 'on';
    const startDate = formData.get('startDate');
    const endDate = formData.get('endDate');

    let numberOfDays = 1;
    if (!isSingleDay && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    const newTrip = {
      id: crypto.randomUUID(),
      tripName,
      isSingleDay,
      startDate,
      endDate,
      numberOfDays,
      createdAt: new Date().toISOString(),
      members: [],
      logs: []
    };

    const prevTrips = [...trips];
    setTrips([...trips, newTrip]);
    setToast({ message: "Trip created", id: crypto.randomUUID(), canUndo: true });
    setHistory(prev => [...prev, { action: "Created Trip", state: prevTrips }]);
    closeModal();
  };

  const handleDeleteTrip = () => {
    const prevTrips = [...trips];
    setHistory(prev => [...prev, { action: "Deleted Trip", state: prevTrips }]);
    setTrips(prev => prev.filter(t => t.id !== currentTripId));
    setCurrentTripId(null);
    setToast({ message: "Trip deleted successfully", id: crypto.randomUUID() });
    closeModal();
  };

  const handleIndividualDelete = (e, tripId) => {
    e.stopPropagation();
    openModal('CONFIRM_DELETE_INDIVIDUAL', tripId);
  };

  const handleIndividualDeleteFinal = (tripId) => {
    const prevTrips = [...trips];
    setHistory(prev => [...prev, { action: "Deleted Individual Trip", state: prevTrips }]);
    setTrips(prev => prev.filter(t => t.id !== tripId));
    setToast({ message: "Trip deleted", id: crypto.randomUUID(), canUndo: true });
    closeModal();
  };

  const handleClearAllTrips = () => {
    openModal('CONFIRM_CLEAR_ALL_TRIPS');
  };

  const handleClearAllTripsFinal = () => {
    const prevTrips = [...trips];
    setHistory(prev => [...prev, { action: "Cleared all trips", state: prevTrips }]);
    setTrips([]);
    setToast({ message: "All trips cleared", id: crypto.randomUUID(), canUndo: true });
    closeModal();
  };

  const handleExportExcel = () => {
    if (trips.length === 0) {
      setToast({ message: "No data to export", id: crypto.randomUUID() });
      return;
    }
    const wb = XLSX.utils.book_new();
    const tripsData = trips.map(t => ({
      ID: t.id,
      'Trip Name': t.tripName,
      'Single Day': t.isSingleDay ? 'Yes' : 'No',
      'Start Date': t.startDate,
      'End Date': t.endDate,
      'Days Count': t.numberOfDays,
      'Created At': t.createdAt
    }));
    const tripsSheet = XLSX.utils.json_to_sheet(tripsData);
    XLSX.utils.book_append_sheet(wb, tripsSheet, "Trips Summary");

    const membersData = [];
    trips.forEach(t => {
      t.members.forEach(m => {
        membersData.push({
          'Trip ID': t.id,
          'Trip Name': t.tripName,
          'Member ID': m.id,
          'Member Name': m.name,
          'Received Amount': m.received,
          'Expense Amount': m.expense,
          'To Give': m.toGive,
          'To Get': m.toGet,
          'Remaining Balance': m.remaining
        });
      });
    });
    const membersSheet = XLSX.utils.json_to_sheet(membersData);
    XLSX.utils.book_append_sheet(wb, membersSheet, "Members Detail");

    const logsData = [];
    trips.forEach(t => {
      (t.logs || []).forEach(l => {
        logsData.push({
          'Trip ID': t.id,
          'Trip Name': t.tripName,
          'Log ID': l.id,
          'Log Date': l.date,
          'Action Type': l.action,
          'Description': l.description,
          'Total Amount': l.amount,
          'Split Per Person': l.splitAmount || 0,
          'Member IDs Involved': (l.memberIds || []).join(', ')
        });
      });
    });
    const logsSheet = XLSX.utils.json_to_sheet(logsData);
    XLSX.utils.book_append_sheet(wb, logsSheet, "Transaction Logs");

    XLSX.writeFile(wb, `SplitSync_Backup_${new Date().toISOString().split('T')[0]}.xlsx`);
    setToast({ message: "Data exported successfully", id: crypto.randomUUID() });
  };

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const tripsSheet = wb.Sheets["Trips Summary"];
        const membersSheet = wb.Sheets["Members Detail"];
        const logsSheet = wb.Sheets["Transaction Logs"];
        if (!tripsSheet) throw new Error("Invalid file format: 'Trips Summary' sheet missing.");

        const rawTrips = XLSX.utils.sheet_to_json(tripsSheet);
        const rawMembers = membersSheet ? XLSX.utils.sheet_to_json(membersSheet) : [];
        const rawLogs = logsSheet ? XLSX.utils.sheet_to_json(logsSheet) : [];

        const reconstructedTrips = rawTrips.map(rt => {
          const tripId = rt.ID;
          const tripMembers = rawMembers.filter(rm => rm['Trip ID'] === tripId).map(rm => ({
            id: rm['Member ID'],
            name: rm['Member Name'],
            received: rm['Received Amount'] || 0,
            expense: rm['Expense Amount'] || 0,
            toGive: rm['To Give'] || 0,
            toGet: rm['To Get'] || 0,
            remaining: rm['Remaining Balance'] || 0
          }));
          const tripLogs = rawLogs.filter(rl => rl['Trip ID'] === tripId).map(rl => ({
            id: rl['Log ID'],
            date: rl['Log Date'],
            action: rl['Action Type'],
            description: rl['Description'],
            amount: rl['Total Amount'] || 0,
            splitAmount: rl['Split Per Person'] || 0,
            memberIds: typeof rl['Member IDs Involved'] === 'string' ? rl['Member IDs Involved'].split(',').map(s => s.trim()) : []
          }));
          return {
            id: tripId,
            tripName: rt['Trip Name'],
            isSingleDay: rt['Single Day'] === 'Yes',
            startDate: rt['Start Date'],
            endDate: rt['End Date'],
            numberOfDays: rt['Days Count'],
            createdAt: rt['Created At'],
            members: tripMembers,
            logs: tripLogs
          };
        });

        if (reconstructedTrips.length === 0) throw new Error("No trips found in the file.");
        const prevTrips = [...trips];
        setHistory(prev => [...prev, { action: "Imported from Excel", state: prevTrips }]);
        setTrips(reconstructedTrips);
        setToast({ message: `Successfully imported ${reconstructedTrips.length} trips`, id: crypto.randomUUID(), canUndo: true });
        e.target.value = '';
      } catch (err) {
        setToast({ message: "Import failed: " + err.message, id: crypto.randomUUID() });
      }
    };
    reader.readAsBinaryString(file);
  };

  // ---- Member Methods ----
  const handleAddMember = (e) => {
    e.preventDefault();
    const trip = trips.find(t => t.id === currentTripId);
    if (trip && trip.members.length >= MEMBER_LIMIT) {
      closeModal();
      setTimeout(() => openModal('LIMIT_REACHED', { type: 'members', limit: MEMBER_LIMIT }), 50);
      return;
    }
    const formData = new FormData(e.target);
    const name = formData.get('name');
    updateTrip(currentTripId, t => ({
      ...t,
      members: [...t.members, { id: crypto.randomUUID(), name, received: 0, expense: 0, toGive: 0, toGet: 0, remaining: 0 }]
    }));
    closeModal();
  };

  const handleEditMember = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newName = formData.get('name');
    const memberId = modalState.data.memberId;
    updateTrip(currentTripId, trip => ({
      ...trip,
      members: trip.members.map(m => m.id === memberId ? { ...m, name: newName } : m)
    }), "Edited member name");
    closeModal();
  };

  const handleEditTrip = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const tripName = formData.get('tripName');
    updateTrip(currentTripId, trip => ({ ...trip, tripName }), "Edited trip name");
    closeModal();
  };

  const handleDeleteMember = (memberId) => {
    updateTrip(currentTripId, trip => ({
      ...trip,
      members: trip.members.filter(m => m.id !== memberId)
    }), "Deleted member");
    closeModal();
  };

  // ---- Transaction Methods ----
  const handleAddExpense = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const amount = parseFloat(formData.get('amount'));
    const selectedMembers = formData.getAll('members');
    if (!selectedMembers.length || isNaN(amount)) return;
    const y = amount / selectedMembers.length;
    const expenseName = formData.get('expenseName') || 'Unnamed Expense';
    updateTrip(currentTripId, trip => {
      const newMembers = trip.members.map(member => {
        if (!selectedMembers.includes(member.id)) return member;
        return { ...member, expense: member.expense + y, remaining: member.remaining - y };
      });
      const newLog = { id: crypto.randomUUID(), date: new Date().toISOString(), action: 'Add Expense', description: expenseName, amount, splitAmount: y, memberIds: selectedMembers };
      return { ...trip, members: newMembers, logs: [...(trip.logs || []), newLog] };
    });
    closeModal();
  };

  const handleAddAmount = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const amount = parseFloat(formData.get('amount'));
    const selectedMembers = formData.getAll('members');
    if (!selectedMembers.length || isNaN(amount)) return;
    updateTrip(currentTripId, trip => {
      const newMembers = trip.members.map(member => {
        if (!selectedMembers.includes(member.id)) return member;
        return { ...member, received: member.received + amount, remaining: member.remaining + amount };
      });
      const newLog = { id: crypto.randomUUID(), date: new Date().toISOString(), action: 'Add Amount', description: 'Amount Added', amount, memberIds: selectedMembers };
      return { ...trip, members: newMembers, logs: [...(trip.logs || []), newLog] };
    });
    closeModal();
  };

  const handleToGive = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const amount = parseFloat(formData.get('amount'));
    const selectedMembers = formData.getAll('members');
    if (!selectedMembers.length || isNaN(amount)) return;
    updateTrip(currentTripId, trip => {
      const newMembers = trip.members.map(member => {
        if (!selectedMembers.includes(member.id)) return member;
        return { ...member, toGive: member.toGive + amount, remaining: member.remaining + amount };
      });
      const newLog = { id: crypto.randomUUID(), date: new Date().toISOString(), action: 'To Give', description: 'To Give', amount, memberIds: selectedMembers };
      return { ...trip, members: newMembers, logs: [...(trip.logs || []), newLog] };
    });
    closeModal();
  };

  const handleToGet = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const amount = parseFloat(formData.get('amount'));
    const selectedMembers = formData.getAll('members');
    if (!selectedMembers.length || isNaN(amount)) return;
    updateTrip(currentTripId, trip => {
      const newMembers = trip.members.map(member => {
        if (!selectedMembers.includes(member.id)) return member;
        return { ...member, toGet: member.toGet + amount, remaining: member.remaining - amount };
      });
      const newLog = { id: crypto.randomUUID(), date: new Date().toISOString(), action: 'To Get', description: 'To Get', amount, memberIds: selectedMembers };
      return { ...trip, members: newMembers, logs: [...(trip.logs || []), newLog] };
    });
    closeModal();
  };

  const handleResetStats = () => {
    updateTrip(currentTripId, trip => {
      const newLog = { id: crypto.randomUUID(), date: new Date().toISOString(), action: 'Reset Data', description: 'Reset all members data to zero.', memberIds: [] };
      return {
        ...trip,
        members: trip.members.map(m => ({ ...m, received: 0, expense: 0, toGive: 0, toGet: 0, remaining: 0 })),
        logs: [...(trip.logs || []), newLog]
      };
    });
    closeModal();
  };

  const handleResetMemberStats = (memberId) => {
    updateTrip(currentTripId, trip => {
      const member = trip.members.find(m => m.id === memberId);
      const newLog = { id: crypto.randomUUID(), date: new Date().toISOString(), action: 'Reset Member', description: `Reset data for ${member?.name} to zero.`, memberIds: [memberId] };
      return {
        ...trip,
        members: trip.members.map(m => m.id === memberId ? { ...m, received: 0, expense: 0, toGive: 0, toGet: 0, remaining: 0 } : m),
        logs: [...(trip.logs || []), newLog]
      };
    });
    closeModal();
  };

  const handleToggleMemberCompletion = (memberId) => {
    updateTrip(currentTripId, trip => {
      const member = trip.members.find(m => m.id === memberId);
      const newCompletedState = !member.isCompleted;
      const newLog = { 
        id: crypto.randomUUID(), 
        date: new Date().toISOString(), 
        action: newCompletedState ? 'Mark Configured' : 'Unmark Configured', 
        description: `${member?.name} was marked as ${newCompletedState ? 'completed' : 'incomplete'}.`, 
        memberIds: [memberId] 
      };
      return {
        ...trip,
        members: trip.members.map(m => m.id === memberId ? { ...m, isCompleted: newCompletedState } : m),
        logs: [...(trip.logs || []), newLog]
      };
    });
    closeModal();
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  const modalHandlers = {
    handleCreateTrip, handleAddMember, handleAddExpense, handleAddAmount, handleToGive, handleToGet,
    handleEditMember, handleEditTrip, handleDeleteTrip, handleIndividualDeleteFinal,
    handleClearAllTripsFinal, handleResetStats, handleResetMemberStats, handleDeleteMember,
    handleToggleMemberCompletion
  };

  const settingsProps = {
    setCurrency, themePrimary, setThemePrimary, themeSecondary, setThemeSecondary, resetTheme, setToast
  };

  return (
    <>
      <div className="background-ornaments">
        <div className="blob-container">
          <div className="blob"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
        </div>
        <div className="mesh-grid"></div>
      </div>

      <Header 
        onLogoClick={() => setCurrentTripId(null)}
        onUndo={handleUndo}
        onSettingsClick={() => openModal('SETTINGS')}
        installPrompt={installPrompt}
        isInstalled={isInstalled}
        onInstall={handleInstallPWA}
      />

      <main className="main-content">
        {currentTripId ? (
          <TripDetails 
            currentTrip={currentTrip}
            setCurrentTripId={setCurrentTripId}
            openModal={openModal}
            tripSearchTerm={tripSearchTerm}
            setTripSearchTerm={setTripSearchTerm}
            currency={currency}
          />
        ) : (
          <Home 
            trips={trips}
            TRIP_LIMIT={TRIP_LIMIT}
            openModal={openModal}
            handleExportExcel={handleExportExcel}
            handleImportExcel={handleImportExcel}
            handleClearAllTrips={handleClearAllTrips}
            homeSearchTerm={homeSearchTerm}
            setHomeSearchTerm={setHomeSearchTerm}
            homeFilterType={homeFilterType}
            setHomeFilterType={setHomeFilterType}
            homeSortBy={homeSortBy}
            setHomeSortBy={setHomeSortBy}
            homeDateFrom={homeDateFrom}
            setHomeDateFrom={setHomeDateFrom}
            homeDateTo={homeDateTo}
            setHomeDateTo={setHomeDateTo}
            filteredTrips={filteredTrips}
            setCurrentTripId={setCurrentTripId}
            handleIndividualDelete={handleIndividualDelete}
            currency={currency}
          />
        )}
      </main>

      <ModalManager 
        modalState={modalState}
        closeModal={closeModal}
        handlers={modalHandlers}
        currentTrip={currentTrip}
        trips={trips}
        modalSearchTerm={modalSearchTerm}
        setModalSearchTerm={setModalSearchTerm}
        currency={currency}
        settings={settingsProps}
      />

      <Toast toast={toast} onUndo={handleUndo} />
      
      <Footer />
    </>
  );
}

export default App;
