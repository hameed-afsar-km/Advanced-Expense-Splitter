import { useState, useMemo, useEffect } from 'react';
import { Plus, ArrowLeft, Trash2, Users, DollarSign, ArrowUpRight, ArrowDownRight, Share2, Calendar, RefreshCw, FileText, List, Settings, Edit3, Undo2, Download, Upload, Trash } from 'lucide-react';
import { useSettingsStore } from './store';
import * as XLSX from 'xlsx';

function App() {
  const [trips, setTrips] = useState(() => {
    const savedTrips = localStorage.getItem('splitsync_trips');
    return savedTrips ? JSON.parse(savedTrips) : [];
  });

  const [currentTripId, setCurrentTripId] = useState(null);
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState([]);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentTripId]);

  const { currency, setCurrency, themePrimary, setThemePrimary, themeSecondary, setThemeSecondary } = useSettingsStore();

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-1', themePrimary);
    document.documentElement.style.setProperty('--accent-2', themeSecondary);
  }, [themePrimary, themeSecondary]);

  // Home query state
  const [homeSearchTerm, setHomeSearchTerm] = useState('');
  const [homeSortBy, setHomeSortBy] = useState('date-desc');
  const [homeFilterType, setHomeFilterType] = useState('all');
  const [homeDateFrom, setHomeDateFrom] = useState('');
  const [homeDateTo, setHomeDateTo] = useState('');

  // Trip query state
  const [tripSearchTerm, setTripSearchTerm] = useState('');

  // Modal query state
  const [modalSearchTerm, setModalSearchTerm] = useState('');

  // Modals state
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

  // This runs every single time the 'trips' array changes
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
  const handleCreateTrip = (e) => {
    e.preventDefault();
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

    // Sheet 1: Trips
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

    // Sheet 2: Members
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

    // Sheet 3: Logs
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

    // Save File
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

        // Retrieve data from sheets
        const tripsSheet = wb.Sheets["Trips Summary"];
        const membersSheet = wb.Sheets["Members Detail"];
        const logsSheet = wb.Sheets["Transaction Logs"];

        if (!tripsSheet) {
          throw new Error("Invalid file format: 'Trips Summary' sheet missing.");
        }

        const rawTrips = XLSX.utils.sheet_to_json(tripsSheet);
        const rawMembers = membersSheet ? XLSX.utils.sheet_to_json(membersSheet) : [];
        const rawLogs = logsSheet ? XLSX.utils.sheet_to_json(logsSheet) : [];

        // Reconstruct the trips state
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

        if (reconstructedTrips.length === 0) {
          throw new Error("No trips found in the file.");
        }

        const prevTrips = [...trips];
        setHistory(prev => [...prev, { action: "Imported from Excel", state: prevTrips }]);
        setTrips(reconstructedTrips);
        setToast({ message: `Successfully imported ${reconstructedTrips.length} trips`, id: crypto.randomUUID(), canUndo: true });
        e.target.value = ''; // Reset input
      } catch (err) {
        setToast({ message: "Import failed: " + err.message, id: crypto.randomUUID() });
        console.error(err);
      }
    };
    reader.readAsBinaryString(file);
  };


  // ---- Member Methods ----
  const handleAddMember = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name');

    updateTrip(currentTripId, trip => ({
      ...trip,
      members: [
        ...trip.members,
        {
          id: crypto.randomUUID(),
          name,
          received: 0,
          expense: 0,
          toGive: 0,
          toGet: 0,
          remaining: 0
        }
      ]
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

    updateTrip(currentTripId, trip => ({
      ...trip,
      tripName
    }), "Edited trip name");

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

        const newExpense = member.expense + y;
        const newRemaining = member.remaining - y;

        return {
          ...member,
          expense: newExpense,
          remaining: newRemaining
        };
      });

      const newLog = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        action: 'Add Expense',
        description: expenseName,
        amount: amount,
        splitAmount: y,
        memberIds: selectedMembers
      };

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

        const newReceived = member.received + amount;
        const newRemaining = member.remaining + amount;

        return {
          ...member,
          received: newReceived,
          remaining: newRemaining
        };
      });

      const newLog = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        action: 'Add Amount',
        description: 'Amount Added',
        amount: amount,
        memberIds: selectedMembers
      };

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
        return {
          ...member,
          toGive: member.toGive + amount,
          remaining: member.remaining + amount
        };
      });

      const newLog = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        action: 'To Give',
        description: 'To Give',
        amount: amount,
        memberIds: selectedMembers
      };

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
        return {
          ...member,
          toGet: member.toGet + amount,
          remaining: member.remaining - amount
        };
      });

      const newLog = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        action: 'To Get',
        description: 'To Get',
        amount: amount,
        memberIds: selectedMembers
      };

      return { ...trip, members: newMembers, logs: [...(trip.logs || []), newLog] };
    });
    closeModal();
  };

  const handleResetStats = () => {
    updateTrip(currentTripId, trip => {
      const newLog = { id: crypto.randomUUID(), date: new Date().toISOString(), action: 'Reset Data', description: 'Reset all members data to zero.', memberIds: [] };
      return {
        ...trip,
        members: trip.members.map(m => ({
          ...m,
          received: 0,
          expense: 0,
          toGive: 0,
          toGet: 0,
          remaining: 0
        })),
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
        members: trip.members.map(m => m.id === memberId ? {
          ...m,
          received: 0,
          expense: 0,
          toGive: 0,
          toGet: 0,
          remaining: 0
        } : m),
        logs: [...(trip.logs || []), newLog]
      };
    });
    closeModal();
  };

  // ---- Renders ----
  const renderHome = () => (
    <div className="container">
      <div className="hero">
        <h1 className="gradient-text">Split Your Expenses</h1>
        <p>Effortlessly track trips, group expenses, and balances.</p>
        <div className="hero-actions-container">
          <button className="btn btn-primary text-xl px-8 py-4" onClick={() => openModal('CREATE_TRIP')}>
            <Plus size={24} /> Create a new Day / Trip
          </button>

          <div className="flex gap-4 justify-center flex-wrap">
            <button className="btn btn-secondary flex items-center gap-2" title="Export all data to Excel" onClick={handleExportExcel}>
              <Download size={18} /> Export Results
            </button>
            <label className="btn btn-secondary flex items-center gap-2 cursor-pointer" title="Import data from Excel">
              <Upload size={18} /> Import Data
              <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportExcel} style={{ display: 'none' }} />
            </label>
            {trips.length > 0 && (
              <button className="btn btn-danger flex items-center gap-2" title="Delete all trips" onClick={handleClearAllTrips}>
                <Trash size={18} /> Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="home-filter-bar glass mt-8 mb-8">
        <div className="filter-item search">
          <label className="input-label">Search Trips/Date</label>
          <input type="text" className="input-base" placeholder="Name or Date..." value={homeSearchTerm} onChange={e => setHomeSearchTerm(e.target.value)} />
        </div>
        <div className="filter-item type">
          <label className="input-label">Type</label>
          <select className="input-base" value={homeFilterType} onChange={e => setHomeFilterType(e.target.value)}>
            <option value="all" style={{ background: '#13131a' }}>All Types</option>
            <option value="single" style={{ background: '#13131a' }}>Single Day</option>
            <option value="multi" style={{ background: '#13131a' }}>Multi Day</option>
          </select>
        </div>
        <div className="filter-item sort">
          <label className="input-label">Sort</label>
          <select className="input-base" value={homeSortBy} onChange={e => setHomeSortBy(e.target.value)}>
            <option value="date-desc" style={{ background: '#13131a' }}>Newest First</option>
            <option value="date-asc" style={{ background: '#13131a' }}>Oldest First</option>
            <option value="name-asc" style={{ background: '#13131a' }}>Name (A-Z)</option>
            <option value="name-desc" style={{ background: '#13131a' }}>Name (Z-A)</option>
          </select>
        </div>
        <div className="filter-item date-from">
          <label className="input-label">From Date</label>
          <input type="date" className="input-base" value={homeDateFrom} onChange={e => setHomeDateFrom(e.target.value)} />
        </div>
        <div className="filter-item date-to">
          <label className="input-label">To Date</label>
          <input type="date" className="input-base" value={homeDateTo} onChange={e => setHomeDateTo(e.target.value)} />
        </div>
      </div>

      <div className="trip-grid mt-6">
        {filteredTrips.length === 0 ? (
          <div className="empty-state w-full" style={{ gridColumn: '1 / -1' }}>
            <Calendar size={48} className="text-muted mb-4 mx-auto" opacity={0.5} />
            <h3 className="text-xl mb-2">No trips found</h3>
            <p className="text-muted">{trips.length === 0 ? "Create your first trip or day to start tracking expenses." : "Adjust your search or filters to find trips."}</p>
          </div>
        ) : (
          filteredTrips.map(trip => {
            const totalSpent = trip.members.reduce((acc, m) => acc + m.expense, 0);
            return (
              <div key={trip.id} className="glass-card trip-card-content" onClick={() => setCurrentTripId(trip.id)}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-bold truncate pr-4">{trip.tripName}</h3>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="badge">{trip.isSingleDay ? '1 Day' : `${trip.numberOfDays} Days`}</span>
                    <button
                      className="btn btn-danger p-1 text-sm rounded-lg opacity-80 hover:opacity-100 transition-opacity"
                      onClick={(e) => handleIndividualDelete(e, trip.id)}
                      title="Delete Trip"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="text-muted flex items-center gap-2 mb-4 text-sm">
                  <Calendar size={16} />
                  <span>
                    {trip.isSingleDay
                      ? (trip.startDate ? new Date(trip.startDate).toLocaleDateString() : 'N/A')
                      : `${trip.startDate ? new Date(trip.startDate).toLocaleDateString() : 'N/A'} - ${trip.endDate ? new Date(trip.endDate).toLocaleDateString() : 'N/A'}`
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center mt-6 border-t border-glass pt-4" style={{ borderColor: 'var(--border-glass)' }}>
                  <div className="flex items-center gap-2 text-muted text-sm">
                    <Users size={16} /> {trip.members.length} members
                  </div>
                  <div className="font-bold text-lg">
                    {currency}{totalSpent.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );


  const renderCurrentTrip = () => {
    if (!currentTrip) return null;

    const totalSpent = currentTrip.members.reduce((acc, m) => acc + m.expense, 0);
    const totalReceived = currentTrip.members.reduce((acc, m) => acc + m.received, 0);

    return (
      <div className="container">
        <button className="btn btn-secondary mb-8 text-sm" onClick={() => setCurrentTripId(null)}>
          <ArrowLeft size={16} /> Back to Trips
        </button>

        <div className="glass-card mb-8">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-4 flex-wrap">
                <h1 className="text-3xl font-bold gradient-text">{currentTrip.tripName}</h1>
                <button
                  className="btn btn-secondary text-sm px-2 py-1"
                  onClick={() => openModal('EDIT_TRIP', { tripName: currentTrip.tripName })}
                >
                  <Edit3 size={14} />
                </button>
              </div>
              <div className="text-muted flex items-center gap-2 mt-2">
                <Calendar size={16} />
                {currentTrip.isSingleDay
                  ? `${new Date(currentTrip.startDate).toLocaleDateString()} (Single Day)`
                  : `${new Date(currentTrip.startDate).toLocaleDateString()} to ${new Date(currentTrip.endDate).toLocaleDateString()} (${currentTrip.numberOfDays} Days)`
                }
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-right">
                <div className="stat-label">Total Spent</div>
                <div className="text-2xl font-bold text-danger">{currency}{totalSpent.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <div className="stat-label">Total Pool (Received)</div>
                <div className="text-2xl font-bold text-success">{currency}{totalReceived.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        {currentTrip.members.length > 0 && (
          <div className="glass mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Quick Actions</h3>
              <div className="flex gap-2 flex-wrap">
                <button className="btn btn-secondary text-sm px-4 py-2" onClick={() => openModal('VIEW_TRIP_LOGS')}>
                  <FileText size={16} /> Logs
                </button>
                <button className="btn btn-secondary text-sm px-4 py-2" onClick={() => openModal('CONFIRM_RESET_STATS')}>
                  <RefreshCw size={16} /> Reset
                </button>
                <button className="btn btn-danger text-sm px-4 py-2" onClick={() => openModal('CONFIRM_DELETE_TRIP')}>
                  <Trash2 size={16} /> Delete Trip
                </button>
              </div>
            </div>
            <div className="actions-grid mt-0">
              <button className="btn btn-primary" onClick={() => openModal('ADD_EXPENSE')}>
                <Share2 size={18} /> Add Expense
              </button>
              <button className="btn btn-secondary" onClick={() => openModal('ADD_AMOUNT')}>
                <DollarSign size={18} /> Add Amount
              </button>
              <button className="btn btn-secondary" onClick={() => openModal('TO_GIVE')}>
                <ArrowUpRight size={18} /> To Give
              </button>
              <button className="btn btn-secondary" onClick={() => openModal('TO_GET')}>
                <ArrowDownRight size={18} /> To Get
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users size={24} className="text-accent-1" />
            Members <span className="text-muted text-lg">({currentTrip.members.length})</span>
          </h2>
          <div className="member-search-container">
            <input
              type="text"
              className="input-base member-search-input"
              placeholder="Search member name..."
              value={tripSearchTerm}
              onChange={(e) => setTripSearchTerm(e.target.value)}
            />
            <button className="btn btn-primary add-member-btn" onClick={() => openModal('ADD_MEMBER')}>
              <Plus size={18} /> <span className="btn-text">Add Member</span>
            </button>
          </div>
        </div>

        {currentTrip.members.length === 0 ? (
          <div className="empty-state mb-8">
            <Users size={40} className="text-muted mb-4 mx-auto" opacity={0.5} />
            <p className="text-muted">No members added yet. Add members to start sharing expenses.</p>
          </div>
        ) : (
          <div className="member-list mb-8">
            {currentTrip.members.filter(m => m.name.toLowerCase().includes(tripSearchTerm.toLowerCase())).map(member => (
              <div key={member.id} className="member-item">
                <div className="flex items-center justify-between w-full mb-2 border-b border-glass pb-4 flex-wrap gap-4" style={{ borderColor: 'var(--border-glass)' }}>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <h3 className="text-xl font-bold truncate">{member.name}</h3>
                    <button
                      className="btn btn-secondary text-sm p-1 flex-shrink-0"
                      onClick={() => openModal('EDIT_MEMBER', { memberId: member.id, name: member.name })}
                      title="Edit Member"
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    <button className="btn btn-secondary text-sm px-2 md-px-3 py-1 flex items-center gap-1" onClick={() => openModal('VIEW_MEMBER_LOGS', member.id)}>
                      <List size={14} /> <span className="hidden md-inline">Details</span>
                    </button>
                    <button className="btn btn-secondary text-sm px-2 md-px-3 py-1 flex items-center gap-1" onClick={() => openModal('CONFIRM_RESET_MEMBER', member.id)}>
                      <RefreshCw size={14} /> <span className="hidden md-inline">Reset</span>
                    </button>
                    <button className="btn btn-danger text-sm px-2 md-px-3 py-1 flex items-center gap-1" onClick={() => openModal('CONFIRM_DELETE_MEMBER', member.id)}>
                      <Trash2 size={14} /> <span className="hidden md-inline">Remove</span>
                    </button>
                  </div>
                </div>
                <div className="flex flex-row md:flex-row flex-wrap gap-4 w-full">
                  <div className="stat-box">
                    <div className="stat-label">Received</div>
                    <div className="stat-value text-success">{currency}{member.received.toFixed(2)}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">Expense</div>
                    <div className="stat-value text-danger">{currency}{member.expense.toFixed(2)}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">To Give</div>
                    <div className="stat-value" style={{ color: member.toGive > 0 ? 'var(--warning)' : 'inherit' }}>
                      {currency}{member.toGive.toFixed(2)}
                    </div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">To Get</div>
                    <div className="stat-value" style={{ color: member.toGet > 0 ? 'var(--accent-1)' : 'inherit' }}>
                      {currency}{member.toGet.toFixed(2)}
                    </div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">Remaining</div>
                    <div className="stat-value" style={{ color: member.remaining < 0 ? 'var(--danger)' : 'inherit' }}>
                      {currency}{Math.abs(member.remaining).toFixed(2)}{member.remaining < 0 ? ' (due)' : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ---- Modal Renders ----
  const renderModals = () => {
    if (!modalState.isOpen) return null;

    let title = '';
    let content = null;

    if (modalState.type === 'CREATE_TRIP') {
      title = 'Create a new Day / Trip';
      content = (
        <form onSubmit={handleCreateTrip} className="flex flex-col gap-4">
          <div>
            <label className="input-label">Trip/Day Name</label>
            <input type="text" name="tripName" required className="input-base" placeholder="e.g., Goa Trip 2026" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" id="isSingleDay" name="isSingleDay" defaultChecked className="w-4 h-4" />
            <label htmlFor="isSingleDay">Single Day Event</label>
          </div>
          <div>
            <label className="input-label">Start Date</label>
            <input type="date" name="startDate" required className="input-base" />
          </div>
          <div id="endDateContainer">
            <label className="input-label">End Date (Optional for Single Day)</label>
            <input type="date" name="endDate" className="input-base" />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create</button>
          </div>
        </form>
      );
    }
    else if (modalState.type === 'ADD_MEMBER') {
      title = 'Add Member';
      content = (
        <form onSubmit={handleAddMember} className="flex flex-col gap-4">
          <div>
            <label className="input-label">Member Name</label>
            <input type="text" name="name" required className="input-base" placeholder="e.g., Alice" />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Member</button>
          </div>
        </form>
      );
    }
    // Shared template for the 4 action forms
    else if (['ADD_EXPENSE', 'ADD_AMOUNT', 'TO_GIVE', 'TO_GET'].includes(modalState.type)) {
      const typeConfig = {
        'ADD_EXPENSE': { title: 'Add Expense', btn: 'Split Expense', hasName: true, onSubmit: handleAddExpense },
        'ADD_AMOUNT': { title: 'Add Amount (Received)', btn: 'Add Amount', hasName: false, onSubmit: handleAddAmount },
        'TO_GIVE': { title: 'To Give', btn: 'Update To Give', hasName: false, onSubmit: handleToGive },
        'TO_GET': { title: 'To Get', btn: 'Update To Get', hasName: false, onSubmit: handleToGet },
      };

      const config = typeConfig[modalState.type];
      title = config.title;

      const updateSelectedCount = (form) => {
        if (!form) return;
        const checked = form.querySelectorAll('input[name="members"]:checked').length;
        const display = form.querySelector('#selectedCountDisplay');
        if (display) display.textContent = `(${checked} Selected)`;
      };

      content = (
        <form onSubmit={config.onSubmit} className="flex flex-col gap-4">
          {config.hasName && (
            <div>
              <label className="input-label">Expense Name</label>
              <input type="text" name="expenseName" required className="input-base" placeholder="e.g., Dinner" />
            </div>
          )}
          <div>
            <label className="input-label">Amount</label>
            <input type="number" step="0.01" name="amount" required className="input-base" placeholder="0.00" />
          </div>

          <div className="mt-2">
            <div className="flex justify-between items-center mb-2">
              <label className="input-label" style={{ marginBottom: 0 }}>
                Select Members
                <span id="selectedCountDisplay" className="text-accent-1 font-bold ml-2">({currentTrip?.members.length} Selected)</span>
              </label>
              <button
                type="button"
                className="text-accent-1 text-sm font-medium select-button"
                style={{ textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={(e) => {
                  const form = e.target.closest('form');
                  const visibleCheckboxes = form.querySelectorAll('.checkbox-item:not([style*="display: none"]) input[type="checkbox"]');
                  const allChecked = Array.from(visibleCheckboxes).every(cb => cb.checked);
                  visibleCheckboxes.forEach(cb => cb.checked = !allChecked);
                  updateSelectedCount(form);
                }}
              >
                Select / Deselect Visible
              </button>
            </div>
            <input
              type="text"
              className="input-base mb-3"
              placeholder="Search members..."
              value={modalSearchTerm}
              onChange={(e) => setModalSearchTerm(e.target.value)}
            />
            <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto" style={{ paddingRight: '8px' }}>
              {currentTrip?.members.map(member => {
                const isMatch = member.name.toLowerCase().includes(modalSearchTerm.toLowerCase());
                return (
                  <label key={member.id} className="checkbox-item" style={{ display: isMatch ? 'flex' : 'none' }}>
                    <input type="checkbox" name="members" value={member.id} defaultChecked onChange={(e) => updateSelectedCount(e.target.closest('form'))} />
                    <span className="font-medium">{member.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary">{config.btn}</button>
          </div>
        </form>
      );
    }
    else if (modalState.type === 'VIEW_TRIP_LOGS') {
      title = 'Trip Logs';
      const logs = currentTrip?.logs || [];
      content = (
        <div className="flex flex-col gap-4">
          {logs.length === 0 ? (
            <p className="text-muted text-center py-4">No activity logged yet.</p>
          ) : (
            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2">
              {logs.slice().reverse().map(log => (
                <div key={log.id} className="p-3 glass" style={{ borderRadius: '8px' }}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-accent-1">{log.action}</span>
                    <span className="text-xs text-muted">{new Date(log.date).toLocaleString()}</span>
                  </div>
                  <p className="text-sm m-0">{log.description}</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end mt-2">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Close</button>
          </div>
        </div>
      );
    }
    else if (modalState.type === 'VIEW_MEMBER_LOGS') {
      const memberId = modalState.data;
      const member = currentTrip?.members.find(m => m.id === memberId);
      title = `Expense Details: ${member?.name}`;

      const memberLogs = (currentTrip?.logs || []).filter(log => log.memberIds?.includes(memberId));

      content = (
        <div className="flex flex-col gap-4">
          {memberLogs.length === 0 ? (
            <p className="text-muted text-center py-4">No events found for this member.</p>
          ) : (
            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2">
              {memberLogs.slice().reverse().map(log => {
                let amountEffect = "";
                let colorClass = "";
                let titleText = log.description;

                if (log.action === 'Add Expense') {
                  amountEffect = `-$${log.splitAmount?.toFixed(2)}`;
                  colorClass = "text-danger";
                } else if (log.action === 'Add Amount') {
                  amountEffect = `+$${log.amount?.toFixed(2)}`;
                  colorClass = "text-success";
                } else if (log.action === 'To Give') {
                  amountEffect = `+$${log.amount?.toFixed(2)}`;
                  colorClass = "text-success";
                } else if (log.action === 'To Get') {
                  amountEffect = `-$${log.amount?.toFixed(2)}`;
                  colorClass = "text-danger";
                }

                return (
                  <div key={log.id} className="p-3 glass" style={{ borderRadius: '8px' }}>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-sm text-accent-1">{titleText}</div>
                        <div className="text-xs text-muted">{new Date(log.date).toLocaleString()}</div>
                      </div>
                      <div className={`font-bold ${colorClass}`}>{amountEffect}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex justify-end mt-2">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Close</button>
          </div>
        </div>
      );
    }
    else if (modalState.type === 'EDIT_MEMBER') {
      title = 'Edit Member';
      content = (
        <form onSubmit={handleEditMember} className="flex flex-col gap-4">
          <div>
            <label className="input-label">Member Name</label>
            <input type="text" name="name" required className="input-base" defaultValue={modalState.data?.name} />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      );
    }
    else if (modalState.type === 'EDIT_TRIP') {
      title = 'Edit Trip Name';
      content = (
        <form onSubmit={handleEditTrip} className="flex flex-col gap-4">
          <div>
            <label className="input-label">Trip/Day Name</label>
            <input type="text" name="tripName" required className="input-base" defaultValue={modalState.data?.tripName} />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      );
    }
    else if (modalState.type === 'CONFIRM_DELETE_TRIP') {
      title = 'Delete Current Trip';
      content = (
        <div className="flex flex-col gap-4">
          <p className="text-muted">Are you sure you want to delete this entire trip? This action cannot be undone.</p>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="button" className="btn btn-danger" onClick={handleDeleteTrip}>Delete Permanently</button>
          </div>
        </div>
      );
    }
    else if (modalState.type === 'CONFIRM_DELETE_INDIVIDUAL') {
      const tripId = modalState.data;
      const trip = trips.find(t => t.id === tripId);
      title = 'Delete Trip';
      content = (
        <div className="flex flex-col gap-4">
          <p className="text-muted">Are you sure you want to delete the trip <strong>{trip?.tripName}</strong>? This action cannot be undone.</p>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="button" className="btn btn-danger" onClick={() => handleIndividualDeleteFinal(tripId)}>Delete Permanently</button>
          </div>
        </div>
      );
    }
    else if (modalState.type === 'CONFIRM_CLEAR_ALL_TRIPS') {
      title = 'Clear All Trips';
      content = (
        <div className="flex flex-col gap-4">
          <p className="text-muted">Are you sure you want to delete <strong>ALL</strong> trips? This action will remove everything and cannot be undone unless you have an exported backup.</p>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="button" className="btn btn-danger" onClick={handleClearAllTripsFinal}>Clear Everything</button>
          </div>
        </div>
      );
    }
    else if (modalState.type === 'CONFIRM_RESET_STATS') {
      title = 'Reset Trip Data';
      content = (
        <div className="flex flex-col gap-4">
          <p className="text-muted">Are you sure you want to reset all data for all members in this trip to zero?</p>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="button" className="btn btn-danger" onClick={handleResetStats}>Reset Data</button>
          </div>
        </div>
      );
    }
    else if (modalState.type === 'CONFIRM_RESET_MEMBER') {
      const memberId = modalState.data;
      const member = currentTrip?.members.find(m => m.id === memberId);
      title = 'Reset Member Stats';
      content = (
        <div className="flex flex-col gap-4">
          <p className="text-muted">Are you sure you want to reset all data for member <strong>{member?.name}</strong> to zero?</p>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="button" className="btn btn-danger" onClick={() => handleResetMemberStats(memberId)}>Reset Data</button>
          </div>
        </div>
      );
    }
    else if (modalState.type === 'CONFIRM_DELETE_MEMBER') {
      const memberId = modalState.data;
      const member = currentTrip?.members.find(m => m.id === memberId);
      title = 'Remove Member';
      content = (
        <div className="flex flex-col gap-4">
          <p className="text-muted">Are you sure you want to remove <strong>{member?.name}</strong> from this trip? Their expenses and history will be lost.</p>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="button" className="btn btn-danger" onClick={() => handleDeleteMember(memberId)}>Remove Member</button>
          </div>
        </div>
      );
    }
    else if (modalState.type === 'SETTINGS') {
      title = 'Settings';
      const commonCurrencies = [
        { label: 'US Dollar ($)', value: '$' },
        { label: 'Euro (€)', value: '€' },
        { label: 'British Pound (£)', value: '£' },
        { label: 'Indian Rupee (₹)', value: '₹' },
        { label: 'Japanese Yen (¥)', value: '¥' },
        { label: 'Australian Dollar (A$)', value: 'A$' },
        { label: 'Canadian Dollar (C$)', value: 'C$' },
        { label: 'Swiss Franc (₣)', value: '₣' },
        { label: 'Indonesian Rupiah (Rp)', value: 'Rp' },
        { label: 'South Korean Won (₩)', value: '₩' }
      ];

      content = (
        <div className="flex flex-col gap-6">
          <div className="settings-group">
            <label className="input-label mb-2">Currency Denomination</label>
            <div className="select-wrapper">
              <select
                className="input-base cursor-pointer appearance-none"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)' }}
              >
                {commonCurrencies.map(c => (
                  <option key={c.value} value={c.value} style={{ background: '#13131a' }}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="settings-group">
            <label className="input-label mb-3">App Appearance</label>
            <div className="flex flex-col gap-4">
              <div className="theme-color-picker glass p-4 rounded-2xl flex items-center justify-between border border-glass">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold mb-1">Primary Accent</span>
                  <span className="text-xs text-muted">Brand & Main Actions</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted uppercase tracking-widest">{themePrimary}</span>
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 shadow-lg cursor-pointer">
                    <input
                      type="color"
                      className="absolute inset-[-50%] w-[200%] h-[200%] cursor-pointer bg-transparent border-none appearance-none"
                      value={themePrimary}
                      onChange={(e) => setThemePrimary(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="theme-color-picker glass p-4 rounded-2xl flex items-center justify-between border border-glass">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold mb-1">Secondary Accent</span>
                  <span className="text-xs text-muted">Highlights & Effects</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted uppercase tracking-widest">{themeSecondary}</span>
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 shadow-lg cursor-pointer">
                    <input
                      type="color"
                      className="absolute inset-[-50%] w-[200%] h-[200%] cursor-pointer bg-transparent border-none appearance-none"
                      value={themeSecondary}
                      onChange={(e) => setThemeSecondary(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-2">
            <button type="button" className="btn btn-primary w-full" onClick={closeModal}>Save & Close</button>
          </div>
        </div>
      );
    }

    return (
      <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
        <div className="modal-content">
          <h2 className="text-2xl font-bold mb-6 gradient-text">{title}</h2>
          {content}
        </div>
      </div>
    );
  };

  if (showSplash) {
    return (
      <div className="splash-screen">
        <div className="splash-content">
          <div className="splash-logo">
            <span className="split">Split</span><span className="sync">Sync</span>
          </div>
          <div className="splash-loader">
            <div className="loader-ring"></div>
            <div className="loader-ring"></div>
            <div className="loader-ring"></div>
          </div>
          <div className="splash-tagline">Managing memories, not just expenses.</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="background-ornaments">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="grid-overlay"></div>
      </div>

      <header className="site-header">
        <div className="container header-inner">
          <h1 className="logo" onClick={() => setCurrentTripId(null)}>
            Split<span className="accent">Sync</span>
          </h1>
          <div className="header-actions">
            <button className="nav-icon-btn" onClick={handleUndo} title="Undo last action">
              <Undo2 size={20} />
            </button>
            <button className="nav-icon-btn" onClick={() => openModal('SETTINGS')} title="Settings">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        {currentTripId ? renderCurrentTrip() : renderHome()}
      </main>

      {renderModals()}

      {toast && (
        <div className="toast-container" key={toast.id}>
          <div className="toast-content">
            <span className="font-medium">{toast.message}</span>
            <button className="btn-undo-mini" onClick={handleUndo}>
              Undo
            </button>
          </div>
          <div className="toast-progress-bar"></div>
        </div>
      )}
      <footer className="border-t border-glass mt-12 py-8 text-center text-muted">
        <div className="container">
          <div className="mb-8 max-w-[728px] mx-auto min-h-[90px] glass flex items-center justify-center text-xs opacity-50" style={{ borderStyle: 'dashed' }}>
            Advertisement Placeholder (AdSense)
          </div>
          <p className="text-sm">© {new Date().getFullYear()} SplitSync. Built with ❤️ for your group trips.</p>
        </div>
      </footer>
    </>
  );
}

export default App;
