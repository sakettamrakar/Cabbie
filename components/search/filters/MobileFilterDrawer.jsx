'use client';
import { useState, useEffect } from 'react';
import { FilterSidebar } from './FilterSidebar';
export function MobileFilterDrawer({ priceRange, onFilterChange, activeFilterCount }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    // Prevent hydration mismatch
    useEffect(() => {
        setIsMounted(true);
    }, []);
    if (!isMounted) {
        return null;
    }
    return (<div>
      <button onClick={() => setIsOpen(true)} className="md:hidden flex items-center gap-2 fixed bottom-6 right-4 z-10 shadow-lg px-4 py-2 border rounded-md bg-white" aria-expanded={isOpen} aria-controls="mobile-filters-panel">
        {/* Simple icon substitute */}
        <span aria-hidden>⚙️</span>
        Filters
        {activeFilterCount > 0 && (<span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-600 text-white text-xs font-medium">
            {activeFilterCount}
          </span>)}
      </button>

      {isOpen && (<div id="mobile-filters-panel" className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <button className="absolute inset-0 bg-black/30 cursor-default w-full h-full border-0 p-0 m-0" onClick={() => setIsOpen(false)} aria-label="Close filters overlay"/>
          <div className="absolute bottom-0 left-0 right-0 h-[90vh] max-h-[90vh] bg-white rounded-t-xl shadow-xl" role="document" tabIndex={-1}>
            <div className="p-4 border-b sticky top-0 bg-white z-10 flex items-center justify-between">
              <h2 className="text-lg font-medium">Filters</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700 p-2" aria-label="Close filters">
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto h-[calc(90vh-56px)]">
              <FilterSidebar priceRange={priceRange} onFilterChange={onFilterChange}/>
            </div>
          </div>
        </div>)}
    </div>);
}
