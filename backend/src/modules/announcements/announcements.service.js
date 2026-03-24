const pool = require("../../database/connection");
const { ERROR_CODES } = require("../../constants");
const AppError = require("../../utils/AppError");

class AnnouncementsService {
  async createAnnouncement(announcementData, schoolId, createdBy) {
    const query = `
      INSERT INTO announcements (
        school_id, title, message, target_role, created_by
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await pool.query(query, [
      schoolId,
      announcementData.title,
      announcementData.message,
      announcementData.targetRole || null,
      createdBy,
    ]);

    return result.rows[0];
  }

  async getAnnouncements(schoolId, userRole, filters = {}) {
    let query = `
      SELECT a.id, a.title, a.message, a.target_role, a.created_at,
             u.full_name as created_by_name
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.school_id = $1
    `;

    const params = [schoolId];
    let paramCount = 2;

    // Filter by target role - show announcements for "all" or specific role
    if (userRole && userRole !== "school_admin") {
      query += ` AND (a.target_role IS NULL OR a.target_role = $${paramCount++})`;
      params.push(userRole);
    }

    if (filters.targetRole) {
      query += ` AND a.target_role = $${paramCount++}`;
      params.push(filters.targetRole);
    }

    query += ` ORDER BY a.created_at DESC`;

    if (filters.limit) {
      query += ` LIMIT $${paramCount++}`;
      params.push(filters.limit);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getAnnouncementById(announcementId, schoolId) {
    const query = `
      SELECT a.id, a.title, a.message, a.target_role, a.created_at,
             u.full_name as created_by_name, u.email as created_by_email
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.id = $1 AND a.school_id = $2
    `;

    const result = await pool.query(query, [announcementId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(
        ERROR_CODES.RESOURCE_NOT_FOUND,
        "Announcement not found",
        404,
      );
    }

    return result.rows[0];
  }

  async updateAnnouncement(announcementId, updateData, schoolId) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updateData.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(updateData.title);
    }
    if (updateData.message !== undefined) {
      fields.push(`message = $${paramCount++}`);
      values.push(updateData.message);
    }
    if (updateData.targetRole !== undefined) {
      fields.push(`target_role = $${paramCount++}`);
      values.push(updateData.targetRole);
    }

    if (fields.length === 0) {
      throw new AppError(ERROR_CODES.INVALID_INPUT, "No fields to update", 400);
    }

    values.push(announcementId, schoolId);
    const query = `
      UPDATE announcements 
      SET ${fields.join(", ")}
      WHERE id = $${paramCount++} AND school_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new AppError(
        ERROR_CODES.RESOURCE_NOT_FOUND,
        "Announcement not found",
        404,
      );
    }

    return result.rows[0];
  }

  async deleteAnnouncement(announcementId, schoolId) {
    const query = `
      DELETE FROM announcements 
      WHERE id = $1 AND school_id = $2
      RETURNING id
    `;

    const result = await pool.query(query, [announcementId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(
        ERROR_CODES.RESOURCE_NOT_FOUND,
        "Announcement not found",
        404,
      );
    }

    return result.rows[0];
  }
}

module.exports = new AnnouncementsService();
