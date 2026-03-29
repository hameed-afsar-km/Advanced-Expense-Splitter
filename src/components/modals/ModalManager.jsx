import { Zap, Smartphone, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export function ModalManager({
  modalState,
  closeModal,
  handlers, // object containing all handlers
  currentTrip,
  trips,
  modalSearchTerm,
  setModalSearchTerm,
  currency,
  settings // object containing settings states
}) {
  if (!modalState.isOpen) return null;

  const {
    handleCreateTrip,
    handleAddMember,
    handleAddExpense,
    handleAddAmount,
    handleToGive,
    handleToGet,
    handleEditMember,
    handleEditTrip,
    handleDeleteTrip,
    handleIndividualDeleteFinal,
    handleClearAllTripsFinal,
    handleResetStats,
    handleResetMemberStats,
    handleDeleteMember,
    handleToggleMemberCompletion
  } = handlers;

  const {
    setCurrency,
    themePrimary,
    setThemePrimary,
    themeSecondary,
    setThemeSecondary,
    resetTheme,
    setToast
  } = settings;

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
        <label className="checkbox-item mt-2">
          <input type="checkbox" id="isSingleDay" name="isSingleDay" defaultChecked />
          <span>Single Day Event</span>
        </label>
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
                amountEffect = `-${currency}${log.splitAmount?.toFixed(2)}`;
                colorClass = "text-danger";
              } else if (log.action === 'Add Amount') {
                amountEffect = `+${currency}${log.amount?.toFixed(2)}`;
                colorClass = "text-success";
              } else if (log.action === 'To Give') {
                amountEffect = `+${currency}${log.amount?.toFixed(2)}`;
                colorClass = "text-success";
              } else if (log.action === 'To Get') {
                amountEffect = `-${currency}${log.amount?.toFixed(2)}`;
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
  else if (modalState.type === 'CONFIRM_MEMBER_COMPLETION') {
    const memberId = modalState.data;
    const member = currentTrip?.members.find(m => m.id === memberId);
    const isMarkingComplete = !member?.isCompleted;
    
    title = isMarkingComplete ? 'Done for this Trip?' : 'Reopen Member Stats?';
    content = (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3 p-4 glass" style={{ borderRadius: '16px', borderLeft: isMarkingComplete ? '4px solid var(--success)' : '4px solid var(--warning)' }}>
          {isMarkingComplete ? <CheckCircle className="text-success" size={24} /> : <AlertCircle className="text-warning" size={24} /> }
          <div>
            <div className="font-bold text-lg">{member?.name}</div>
            <div className={`text-sm ${isMarkingComplete ? 'text-success' : 'text-warning'}`}>
              {isMarkingComplete ? 'Summary at Completion' : 'Currently Marked Complete'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="stat-box" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="stat-label">Total Expense</div>
            <div className="text-xl font-bold text-danger">{currency}{member?.expense.toFixed(2)}</div>
          </div>
          <div className="stat-box" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="stat-label">Total Received</div>
            <div className="text-xl font-bold text-success">{currency}{member?.received.toFixed(2)}</div>
          </div>
          <div className="stat-box col-span-2" style={{ background: isMarkingComplete ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.03)' }}>
            <div className="stat-label">Remaining Balance</div>
            <div className={`text-2xl font-bold ${member?.remaining < 0 ? 'text-danger' : (member?.remaining > 0 ? 'text-success' : '')}`}>
              {currency}{Math.abs(member?.remaining).toFixed(2)} {member?.remaining < 0 ? '(Due)' : (member?.remaining > 0 ? '(Change)' : '')}
            </div>
          </div>
        </div>

        <p className="text-sm text-muted italic">
          {isMarkingComplete 
            ? "Marking as completed will strike the name and visually indicate they are done with all expenses for this session."
            : "This will unmark the member as completed and restore normal visibility."
          }
        </p>

        <div className="flex justify-end gap-3 mt-2">
          <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
          <button 
            type="button" 
            className={`btn ${isMarkingComplete ? 'btn-primary' : 'btn-secondary'}`} 
            onClick={() => handleToggleMemberCompletion(memberId)}
            style={isMarkingComplete ? { background: 'var(--success)', boxShadow: '0 8px 16px -4px rgba(16, 185, 129, 0.4)' } : {}}
          >
            {isMarkingComplete ? 'Yes, Complete' : 'Restore Member'}
          </button>
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
              className="input-base cursor-pointer"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {commonCurrencies.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="settings-group">
          <label className="input-label mb-3">App Appearance</label>
          <div className="flex flex-col gap-2">
            <div className="theme-color-card">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold">Primary Accent</span>
                <span className="text-xs text-muted">Core brand & main buttons</span>
                <span className="text-xs font-mono mt-1 opacity-60 uppercase tracking-tighter">{themePrimary}</span>
              </div>
              <div className="color-input-container">
                <input
                  type="color"
                  value={themePrimary}
                  onChange={(e) => setThemePrimary(e.target.value)}
                />
              </div>
            </div>

            <div className="theme-color-card">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold">Secondary Accent</span>
                <span className="text-xs text-muted">Subtle highlights & gradients</span>
                <span className="text-xs font-mono mt-1 opacity-60 uppercase tracking-tighter">{themeSecondary}</span>
              </div>
              <div className="color-input-container">
                <input
                  type="color"
                  value={themeSecondary}
                  onChange={(e) => setThemeSecondary(e.target.value)}
                />
              </div>
            </div>
            <button
              type="button"
              className="btn btn-secondary text-sm flex items-center justify-center gap-2 mt-2"
              onClick={() => {
                resetTheme();
                setToast({ message: "Theme colors reset to default", id: crypto.randomUUID() });
              }}
            >
              <RefreshCw size={14} /> Reset Theme to Default
            </button>
          </div>
        </div>

        <div className="flex justify-end mt-2">
          <button type="button" className="btn btn-primary w-full" onClick={closeModal}>Save & Close</button>
        </div>
      </div>
    );
  }
  else if (modalState.type === 'LIMIT_REACHED') {
    const isTrips = modalState.data?.type === 'trips';
    const limit = modalState.data?.limit;
    title = isTrips ? '✦ Trip Limit Reached' : '✦ Member Limit Reached';
    content = (
      <div className="limit-modal-body">
        <div className="limit-icon-wrap">
          <Zap size={32} className="limit-icon" />
        </div>
        <p className="limit-desc">
          You've reached the <strong>{isTrips ? `${limit} trip` : `${limit} member`}</strong> limit on the free web version.
        </p>
        <div className="limit-feature-list">
          <div className="limit-feature-item">
            <span className="limit-check">✓</span>
            <span>Unlimited {isTrips ? 'trips & days' : 'members per trip'}</span>
          </div>
          <div className="limit-feature-item">
            <span className="limit-check">✓</span>
            <span>Offline access — works without internet</span>
          </div>
          <div className="limit-feature-item">
            <span className="limit-check">✓</span>
            <span>Native mobile experience</span>
          </div>
          <div className="limit-feature-item">
            <span className="limit-check">✓</span>
            <span>Faster & smoother on the go</span>
          </div>
        </div>
        <div className="limit-cta-group">
          <button
            className="btn btn-primary w-full limit-cta-btn"
            onClick={() => {
              setToast({ message: 'Mobile app coming soon! Stay tuned.', id: crypto.randomUUID() });
              closeModal();
            }}
          >
            <Smartphone size={18} /> Get the Mobile App
          </button>
          <button type="button" className="btn btn-secondary w-full" onClick={closeModal}>
            Maybe Later
          </button>
        </div>
        <p className="limit-footnote">To use more on web, delete an existing {isTrips ? 'trip' : 'member'} first.</p>
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
}
