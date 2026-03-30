import { ArrowLeft, Edit3, Calendar, FileText, RefreshCw, Trash2, Share2, DollarSign, ArrowUpRight, ArrowDownRight, Users, Plus, List } from 'lucide-react';

export function TripDetails({
  currentTrip,
  setCurrentTripId,
  openModal,
  tripSearchTerm,
  setTripSearchTerm,
  currency
}) {
  if (!currentTrip) return null;

  const totalSpent = currentTrip.members.reduce((acc, m) => acc + m.expense, 0);
  const totalReceived = currentTrip.members.reduce((acc, m) => acc + m.received, 0);

  return (
    <div className="container">
      <button className="btn btn-secondary mb-12 text-sm" onClick={() => setCurrentTripId(null)}>
        <ArrowLeft size={16} /> Back to Trips
      </button>

      <div className="glass-card mb-12">
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
        <div className="glass mb-12">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Quick Actions</h3>
            <div className="flex gap-2 flex-wrap">
              <button className="btn btn-secondary text-sm px-2 md-px-3 py-2" onClick={() => openModal('VIEW_TRIP_LOGS')}>
                <FileText size={16} /> <span className="hidden md-inline">Logs</span>
              </button>
              <button className="btn btn-secondary text-sm px-2 md-px-3 py-2" onClick={() => openModal('CONFIRM_RESET_STATS')}>
                <RefreshCw size={16} /> <span className="hidden md-inline">Reset</span>
              </button>
              <button className="btn btn-danger text-sm px-2 md-px-3 py-2" onClick={() => openModal('CONFIRM_DELETE_TRIP')}>
                <Trash2 size={16} /> <span className="hidden md-inline">Delete Trip</span>
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

      <div className="flex justify-between items-center mb-10 flex-wrap gap-4">
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
              <div className="flex items-center justify-between w-full mb-4 border-b border-glass pb-4 flex-wrap gap-4">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    className="w-5 h-5 cursor-pointer"
                    style={{ accentColor: 'var(--accent-1)' }}
                    checked={member.isCompleted || false}
                    onChange={() => openModal('CONFIRM_MEMBER_COMPLETION', member.id)}
                    title={member.isCompleted ? "Unmark as completed" : "Mark as completed"}
                  />
                  <h3 className="text-xl font-bold truncate" style={{ textDecoration: member.isCompleted ? 'line-through' : 'none', opacity: member.isCompleted ? 0.6 : 1, color: member.isCompleted ? 'var(--text-muted)' : 'inherit' }}>{member.name}</h3>
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
}
