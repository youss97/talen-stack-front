type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  pageSizeOptions?: number[];
};

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage = 10,
  onItemsPerPageChange,
  pageSizeOptions = [5, 10, 20, 50],
}) => {
  // Fenêtre de pages bornée à [1, totalPages] — évite d'afficher des pages vides
  const windowSize = Math.min(3, totalPages);
  let windowStart = Math.max(currentPage - 1, 1);
  if (windowStart + windowSize - 1 > totalPages) {
    windowStart = Math.max(totalPages - windowSize + 1, 1);
  }
  const pagesAroundCurrent = Array.from(
    { length: windowSize },
    (_, i) => windowStart + i
  );

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems || 0);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        {totalItems !== undefined && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Affichage de {startItem} à {endItem} sur {totalItems} résultats
          </p>
        )}
        {onItemsPerPageChange && (
          <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Par page</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="h-9 rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 focus:outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="flex items-center">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="mr-2.5 flex items-center h-10 justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] text-sm"
        >
          Précédent
        </button>
        <div className="flex items-center gap-2">
          {windowStart > 1 && <span className="px-2">...</span>}
          {pagesAroundCurrent.map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-4 py-2 rounded ${
                currentPage === page
                  ? "bg-brand-500 text-white"
                  : "text-gray-700 dark:text-gray-400"
              } flex w-10 items-center justify-center h-10 rounded-lg text-sm font-medium hover:bg-blue-500/[0.08] hover:text-brand-500 dark:hover:text-brand-500`}
            >
              {page}
            </button>
          ))}
          {windowStart + windowSize - 1 < totalPages && <span className="px-2">...</span>}
        </div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="ml-2.5 flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-gray-700 shadow-theme-xs text-sm hover:bg-gray-50 h-10 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
        >
          Suivant
        </button>
      </div>
    </div>
  );
};

export default Pagination;
