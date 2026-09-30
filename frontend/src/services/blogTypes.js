// Blog API contract reference for frontend usage.
// These shapes mirror the requested backend contract.

/**
 * @typedef {Object} BlogAuthor
 * @property {string} id
 * @property {string} name
 * @property {string|null} avatar
 */

/**
 * @typedef {Object} Blog
 * @property {string} id
 * @property {string} title
 * @property {string} slug
 * @property {string} excerpt
 * @property {string} content
 * @property {string|null} coverImage
 * @property {string} category
 * @property {string[]} tags
 * @property {'draft'|'published'} status
 * @property {BlogAuthor} author
 * @property {number} readTimeMinutes
 * @property {string|null} publishedAt
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} PaginatedBlogs
 * @property {Blog[]} data
 * @property {{
 *   currentPage: number,
 *   totalPages: number,
 *   totalCount: number,
 *   limit: number
 * }} meta
 */

export {};
