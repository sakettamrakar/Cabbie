import React from 'react';
const NoResults = ({ onResetFilters }) => {
    return (<div className="text-center py-12">
      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <h3 className="mt-2 text-lg font-medium text-gray-900">No cabs available</h3>
      <p className="mt-1 text-sm text-gray-500">
        We couldn&apos;t find any cabs matching your search criteria. Try adjusting your filters or search again.
      </p>
      <div className="mt-6">
        <button type="button" onClick={onResetFilters} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Reset all filters
        </button>
        <div className="mt-3">
          <button type="button" onClick={() => window.history.back()} className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Go back to search
          </button>
        </div>
      </div>
    </div>);
};
export default NoResults;
