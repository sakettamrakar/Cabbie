import React from 'react';

interface NoResultsProps {
  onResetFilters: () => void;
}

const NoResults: React.FC<NoResultsProps> = ({ onResetFilters }) => {
  return (
    <div className="card search-results__message" role="status">
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
        style={{ color: 'var(--brand-muted)' }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h2>No cabs available</h2>
      <p>We couldn&apos;t find any cabs matching your search criteria. Try adjusting your filters or search again.</p>
      <div className="search-results__actions">
        <button type="button" className="cta cta--sm" onClick={onResetFilters}>
          Reset search
        </button>
        <button
          type="button"
          className="pill"
          onClick={() => window.history.back()}
        >
          Go back
        </button>
      </div>
    </div>
  );
};

export default NoResults;
