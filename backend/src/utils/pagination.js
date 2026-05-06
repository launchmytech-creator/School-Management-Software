/**
 * Shared pagination helper for PostgreSQL queries
 * 
 * Usage:
 * const { query, params, countQuery, countParams } = buildPaginationQuery(
 *   'SELECT * FROM students WHERE school_id = $1',
 *   [schoolId],
 *   filters,
 *   { page, limit }
 * );
 */
function buildPaginationQuery(baseQuery, params, pagination = {}) {
  const page = Math.max(1, parseInt(pagination.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(pagination.limit) || 20));
  const offset = (page - 1) * limit;

  const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as count_query`;
  const countParams = [...params];

  const paginatedQuery = `${baseQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const paginatedParams = [...params, limit, offset];

  return {
    query: paginatedQuery,
    params: paginatedParams,
    countQuery,
    countParams,
    page,
    limit,
  };
}

function formatPaginationResult(rows, countRows, page, limit) {
  const total = parseInt(countRows[0]?.total || 0, 10);
  const totalPages = Math.ceil(total / limit);

  return {
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

module.exports = { buildPaginationQuery, formatPaginationResult };
