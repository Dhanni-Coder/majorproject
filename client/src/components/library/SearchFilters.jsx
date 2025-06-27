import React, { useState } from 'react';
import { FaSearch, FaFilter, FaSortAlphaDown, FaSortAlphaUp, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';

/**
 * SearchFilters Component
 * Provides search, filter, and sorting controls for the library
 */
const SearchFilters = ({
  searchQuery,
  onSearchChange,
  branches,
  selectedBranch,
  onBranchChange,
  sortBy,
  sortOrder,
  onSortChange
}) => {
  // Local state for search input
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Handle search input change
  const handleSearchInputChange = (e) => {
    setLocalSearch(e.target.value);
  };

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearchChange(localSearch);
  };

  // Get appropriate sort icon based on field and order
  const getSortIcon = (field) => {
    if (sortBy !== field) return null;

    if (field === 'availability') {
      return sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />;
    } else {
      return sortOrder === 'asc' ? <FaSortAlphaDown /> : <FaSortAlphaUp />;
    }
  };

  return (
    <div className="search-filters">
      {/* Search Box */}
      <form className="search-box" onSubmit={handleSearchSubmit}>
        <div className="search-input-container">
          <input
            type="text"
            placeholder="Search by title, author, or ISBN..."
            value={localSearch}
            onChange={handleSearchInputChange}
            className="search-input"
          />
          <button type="submit" className="search-btn">
            <FaSearch />
          </button>
        </div>
      </form>

      {/* Filters and Sorting */}
      <div className="filters-sorting">
        {/* Branch Filter */}
        <div className="filter-dropdown">
          <div className="filter-label">
            <FaFilter /> Branch:
          </div>
          <select
            value={selectedBranch}
            onChange={(e) => onBranchChange(e.target.value)}
            className="branch-select"
          >
            <option value="">All Branches</option>
            {branches.map(branch => (
              <option key={branch._id} value={branch._id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Buttons */}
        <div className="sort-controls">
          <button
            className={`sort-btn ${sortBy === 'title' ? 'active' : ''}`}
            onClick={() => onSortChange('title')}
          >
            Title {getSortIcon('title')}
          </button>

          <button
            className={`sort-btn ${sortBy === 'author' ? 'active' : ''}`}
            onClick={() => onSortChange('author')}
          >
            Author {getSortIcon('author')}
          </button>

          <button
            className={`sort-btn ${sortBy === 'availability' ? 'active' : ''}`}
            onClick={() => onSortChange('availability')}
          >
            Availability {getSortIcon('availability')}
          </button>
        </div>
      </div>
    </div>
  );
};

// PropTypes validation removed temporarily

export default SearchFilters;
