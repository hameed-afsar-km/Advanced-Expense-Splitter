import { Plus, Download, Upload, Trash, Calendar, Users, Trash2 } from 'lucide-react';

export function Home({ 
  trips, 
  TRIP_LIMIT, 
  openModal, 
  handleExportExcel, 
  handleImportExcel, 
  handleClearAllTrips,
  homeSearchTerm,
  setHomeSearchTerm,
  homeFilterType,
  setHomeFilterType,
  homeSortBy,
  setHomeSortBy,
  homeDateFrom,
  setHomeDateFrom,
  homeDateTo,
  setHomeDateTo,
  filteredTrips,
  setCurrentTripId,
  handleIndividualDelete,
  currency
}) {
  return (
    <div className="container">
      <div className="hero">
        <h1 className="gradient-text">Split Your Expenses</h1>
        <p>Effortlessly track trips, group expenses, and balances.</p>
        <div className="hero-actions-container">
          <button className="btn btn-primary text-xl px-8 py-4" onClick={() => openModal('CREATE_TRIP')}>
            <Plus size={24} /> Create a new Day / Trip
          </button>
          <div className="trip-quota-pill">
            <span className="trip-quota-bar" style={{ width: `${(trips.length / TRIP_LIMIT) * 100}%` }} />
            <span className="trip-quota-text">
              {trips.length} / {TRIP_LIMIT} trips used
              {trips.length >= TRIP_LIMIT && <span className="trip-quota-full"> · Limit reached</span>}
            </span>
          </div>

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
                <div className="flex justify-between items-start mb-2">
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
                <div className="text-muted flex items-center gap-2 mb-2 text-sm">
                  <Calendar size={16} />
                  <span>
                    {trip.isSingleDay
                      ? (trip.startDate ? new Date(trip.startDate).toLocaleDateString() : 'N/A')
                      : `${trip.startDate ? new Date(trip.startDate).toLocaleDateString() : 'N/A'} - ${trip.endDate ? new Date(trip.endDate).toLocaleDateString() : 'N/A'}`
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center mt-4 border-t border-glass pt-3" style={{ borderColor: 'var(--border-glass)' }}>
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
}
