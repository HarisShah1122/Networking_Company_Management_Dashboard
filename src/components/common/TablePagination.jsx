import React from 'react';

const defaultPageSizeOptions = [
  { value: 10, label: '10' },
  { value: 25, label: '25' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
];

const TablePagination = ({
  pagination,
  onPageChange,
  isFetching = false,
  onPageSizeChange,
  pageSize,
  pageSizeOptions = defaultPageSizeOptions,
}) => {
  const { currentPage, totalPages, totalCount } = pagination ?? {};

  const handlePageSizeChange = (e) => {
    const value = Number(e.target.value);
    if (value && onPageSizeChange) {
      onPageSizeChange(value);
    }
  };

  const handlePageChange = (newPage) => {
    if (onPageChange && !isFetching) {
      onPageChange(newPage);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    // First page
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isFetching}
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis-start" className="px-2">
            ...
          </span>
        );
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 border rounded ${
            i === currentPage
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'hover:bg-gray-100'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={isFetching}
        >
          {i}
        </button>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="ellipsis-end" className="px-2">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isFetching}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  if (!pagination || totalCount === 0) {
    return null;
  }

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Show</span>
        <select
          value={pageSize}
          onChange={handlePageSizeChange}
          disabled={isFetching}
          className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {pageSizeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-600">of {totalCount} items</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isFetching}
          className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <div className="flex items-center gap-1">{renderPageNumbers()}</div>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || isFetching}
          className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default TablePagination;

