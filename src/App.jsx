import { useState, useMemo } from 'react';
import { Plus, ArrowLeft, Trash2, Users, DollarSign, ArrowUpRight, ArrowDownRight, Share2, Calendar, RefreshCw } from 'lucide-react';

function App() {
  const [trips, setTrips] = useState([]);
  const [currentTripId, setCurrentTripId] = useState(null);

  // Modals state
  const [modalState, setModalState] = useState({ isOpen: false, type: null, data: null });

  const currentTrip = useMemo(() => trips.find(t => t.id === currentTripId), [trips, currentTripId]);

  const updateTrip = (tripId, updater) => {
    setTrips(prev => prev.map(t => (t.id === tripId ? updater(t) : t)));
  };

  const openModal = (type, data = null) => {
    setModalState({ isOpen: true, type, data });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null, data: null });
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
      members: []
    };

    setTrips([...trips, newTrip]);
    closeModal();
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

  const handleDeleteMember = (memberId) => {
    updateTrip(currentTripId, trip => ({
      ...trip,
      members: trip.members.filter(m => m.id !== memberId)
    }));
  };

  // ---- Transaction Methods ----
  const handleAddExpense = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const amount = parseFloat(formData.get('amount'));
    const selectedMembers = formData.getAll('members');

    if (!selectedMembers.length || isNaN(amount)) return;

    const y = amount / selectedMembers.length;

    updateTrip(currentTripId, trip => {
      const newMembers = trip.members.map(member => {
        if (!selectedMembers.includes(member.id)) return member;

        const newExpense = member.expense + y;
        const newRemaining = member.received >= newExpense ? member.received - newExpense : 0;

        return {
          ...member,
          expense: newExpense,
          remaining: newRemaining
        };
      });
      return { ...trip, members: newMembers };
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
        const newRemaining = newReceived >= member.expense ? newReceived - member.expense : 0;

        return {
          ...member,
          received: newReceived,
          remaining: newRemaining
        };
      });
      return { ...trip, members: newMembers };
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
          toGive: member.toGive + amount
        };
      });
      return { ...trip, members: newMembers };
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
          toGet: member.toGet + amount
        };
      });
      return { ...trip, members: newMembers };
    });
    closeModal();
  };

  const handleResetStats = () => {
    if (window.confirm('Are you sure you want to reset all data for these members to zero?')) {
      updateTrip(currentTripId, trip => ({
        ...trip,
        members: trip.members.map(m => ({
          ...m,
          received: 0,
          expense: 0,
          toGive: 0,
          toGet: 0,
          remaining: 0
        }))
      }));
    }
  };

  const handleResetMemberStats = (memberId) => {
    if (window.confirm('Are you sure you want to reset all data for this member to zero?')) {
      updateTrip(currentTripId, trip => ({
        ...trip,
        members: trip.members.map(m => m.id === memberId ? {
          ...m,
          received: 0,
          expense: 0,
          toGive: 0,
          toGet: 0,
          remaining: 0
        } : m)
      }));
    }
  };

  // ---- Renders ----
  const renderHome = () => (
    <div className="container">
      <div className="hero">
        <h1 className="gradient-text">Split Your Expenses</h1>
        <p className="text-muted text-lg mb-8">Effortlessly track trips, group expenses, and balances.</p>
        <button className="btn btn-primary text-xl px-8 py-4" onClick={() => openModal('CREATE_TRIP')}>
          <Plus size={24} /> Create a new Day / Trip
        </button>
      </div>

      <div className="trip-grid mt-8">
        {trips.length === 0 ? (
          <div className="empty-state w-full" style={{ gridColumn: '1 / -1' }}>
            <Calendar size={48} className="text-muted mb-4 mx-auto" opacity={0.5} />
            <h3 className="text-xl mb-2">No trips yet</h3>
            <p className="text-muted">Create your first trip or day to start tracking expenses.</p>
          </div>
        ) : (
          trips.map(trip => {
            const totalSpent = trip.members.reduce((acc, m) => acc + m.expense, 0);
            return (
              <div key={trip.id} className="glass-card trip-card-content" onClick={() => setCurrentTripId(trip.id)}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold">{trip.tripName}</h3>
                  <span className="badge">{trip.isSingleDay ? '1 Day' : `${trip.numberOfDays} Days`}</span>
                </div>
                <div className="text-muted flex items-center gap-2 mb-4 text-sm">
                  <Calendar size={16} />
                  <span>
                    {trip.isSingleDay ? new Date(trip.startDate).toLocaleDateString() : `${new Date(trip.startDate).toLocaleDateString()} - ${new Date(trip.endDate).toLocaleDateString()}`}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-6 border-t border-glass pt-4" style={{ borderColor: 'var(--border-glass)' }}>
                  <div className="flex items-center gap-2 text-muted text-sm">
                    <Users size={16} /> {trip.members.length} members
                  </div>
                  <div className="font-bold text-lg">
                    ${totalSpent.toFixed(2)}
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
              <h1 className="text-3xl font-bold gradient-text">{currentTrip.tripName}</h1>
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
                <div className="text-2xl font-bold text-danger">${totalSpent.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <div className="stat-label">Total Pool (Received)</div>
                <div className="text-2xl font-bold text-success">${totalReceived.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        {currentTrip.members.length > 0 && (
          <div className="glass p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Quick Actions</h3>
              <button className="btn btn-danger text-sm px-4 py-2" onClick={handleResetStats}>
                <RefreshCw size={16} /> Reset Data
              </button>
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

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2"><Users size={24} className="text-accent-1" /> Members</h2>
          <button className="btn btn-primary" onClick={() => openModal('ADD_MEMBER')}>
            <Plus size={18} /> Add Member
          </button>
        </div>

        {currentTrip.members.length === 0 ? (
          <div className="empty-state mb-8">
            <Users size={40} className="text-muted mb-4 mx-auto" opacity={0.5} />
            <p className="text-muted">No members added yet. Add members to start sharing expenses.</p>
          </div>
        ) : (
          <div className="member-list mb-8">
            {currentTrip.members.map(member => (
              <div key={member.id} className="member-item">
                <div className="flex items-center justify-between w-full mb-2 border-b border-glass pb-4" style={{ borderColor: 'var(--border-glass)' }}>
                  <h3 className="text-xl font-bold">{member.name}</h3>
                  <div className="flex gap-2">
                    <button className="btn btn-secondary text-sm px-3 py-1" onClick={() => handleResetMemberStats(member.id)}>
                      <RefreshCw size={14} /> Reset
                    </button>
                    <button className="btn btn-danger text-sm px-3 py-1" onClick={() => handleDeleteMember(member.id)}>
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
                <div className="flex flex-row md:flex-row flex-wrap gap-4 w-full">
                  <div className="stat-box">
                    <div className="stat-label">Received</div>
                    <div className="stat-value text-success">${member.received.toFixed(2)}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">Expense</div>
                    <div className="stat-value text-danger">${member.expense.toFixed(2)}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">To Give</div>
                    <div className="stat-value" style={{ color: member.toGive > 0 ? 'var(--warning)' : 'inherit' }}>
                      ${member.toGive.toFixed(2)}
                    </div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">To Get</div>
                    <div className="stat-value" style={{ color: member.toGet > 0 ? 'var(--accent-1)' : 'inherit' }}>
                      ${member.toGet.toFixed(2)}
                    </div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">Remaining</div>
                    <div className="stat-value">${member.remaining.toFixed(2)}</div>
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
            <label className="input-label mb-2">Select Members</label>
            <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto" style={{ paddingRight: '8px' }}>
              {currentTrip?.members.map(member => (
                <label key={member.id} className="checkbox-item">
                  <input type="checkbox" name="members" value={member.id} defaultChecked />
                  <span className="font-medium">{member.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary">{config.btn}</button>
          </div>
        </form>
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

  return (
    <>
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      <header className="border-b border-glass mb-4" style={{ backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)' }}>
        <div className="container py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold cursor-pointer" onClick={() => setCurrentTripId(null)}>
            Split<span className="text-accent-1">Sync</span>
          </h1>
        </div>
      </header>

      <main>
        {currentTripId ? renderCurrentTrip() : renderHome()}
      </main>

      {renderModals()}
    </>
  );
}

export default App;
