const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const config = require("./config");
const logger = require("./utils/logger");
const errorHandler = require("./middleware/errorHandler");

// Import routes
const authRoutes = require("./modules/auth/auth.routes");
const schoolsRoutes = require("./modules/schools/schools.routes");
const teachersRoutes = require("./modules/teachers/teachers.routes");
const classesRoutes = require("./modules/classes/classes.routes");
const studentsRoutes = require("./modules/students/students.routes");
const subjectsRoutes = require("./modules/subjects/subjects.routes");
const chaptersRoutes = require("./modules/chapters/chapters.routes");
const academicYearsRoutes = require("./modules/academic-years/academic-years.routes");
const classSubjectsRoutes = require("./modules/class-subjects/class-subjects.routes");
const teacherAllocationsRoutes = require("./modules/teacher-allocations/teacher-allocations.routes");
const accountantsRoutes = require("./modules/accountants/accountants.routes");
const feeStructuresRoutes = require("./modules/fee-structures/fee-structures.routes");
const feeTransactionsRoutes = require("./modules/fee-transactions/fee-transactions.routes");
const studentAttendanceRoutes = require("./modules/student-attendance/student-attendance.routes");
const teacherAttendanceRoutes = require("./modules/teacher-attendance/teacher-attendance.routes");
const holidaysRoutes = require("./modules/holidays/holidays.routes");
const examsRoutes = require("./modules/exams/exams.routes");
const examResultsRoutes = require("./modules/exam-results/exam-results.routes");
const syllabusCompletionRoutes = require("./modules/syllabus-completion/syllabus-completion.routes");
const parentsRoutes = require("./modules/parents/parents.routes");



const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Logging
if (config.env === "development") {
  app.use(morgan("dev", { stream: logger.stream }));
} else {
  app.use(morgan("combined", { stream: logger.stream }));
}

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
  logger.info("Health check accessed");
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// API Documentation
const swaggerUi = require("swagger-ui-express");
const jsYaml = require("js-yaml");
const fs = require("fs");
const path = require("path");

try {
  const swaggerDocument = jsYaml.load(
    fs.readFileSync(path.join(__dirname, "docs", "openapi.yaml"), "utf8"),
  );
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "School Management API Documentation",
    }),
  );
  logger.info("API documentation available at /api-docs");
} catch (error) {
  logger.warn("API documentation not available", { error: error.message });
}

// API routes
const apiPrefix = config.api.prefix;
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/schools`, schoolsRoutes);
app.use(`${apiPrefix}/teachers`, teachersRoutes);
app.use(`${apiPrefix}/classes`, classesRoutes);
app.use(`${apiPrefix}/students`, studentsRoutes);
app.use(`${apiPrefix}/subjects`, subjectsRoutes);
app.use(`${apiPrefix}/chapters`, chaptersRoutes);
app.use(`${apiPrefix}/academic-years`, academicYearsRoutes);
app.use(`${apiPrefix}/class-subjects`, classSubjectsRoutes);
app.use(`${apiPrefix}/teacher-allocations`, teacherAllocationsRoutes);
app.use(`${apiPrefix}/accountants`, accountantsRoutes);
app.use(`${apiPrefix}/fee-structures`, feeStructuresRoutes);
app.use(`${apiPrefix}/fee-transactions`, feeTransactionsRoutes);
app.use(`${apiPrefix}/student-attendance`, studentAttendanceRoutes);
app.use(`${apiPrefix}/teacher-attendance`, teacherAttendanceRoutes);
app.use(`${apiPrefix}/holidays`, holidaysRoutes);
app.use(`${apiPrefix}/exams`, examsRoutes);
app.use(`${apiPrefix}/exam-results`, examResultsRoutes);
app.use(`${apiPrefix}/syllabus-completion`, syllabusCompletionRoutes);
app.use(`${apiPrefix}/student-promotions`, studentPromotionsRoutes);
app.use(`${apiPrefix}/parents`, parentsRoutes);
app.use(`${apiPrefix}/parent`, parentDashboardRoutes);
app.use(`${apiPrefix}/notifications`, notificationsRoutes);
app.use(`${apiPrefix}/announcements`, announcementsRoutes);

// 404 handler
app.use((req, res) => {
  logger.warn("Route not found", { path: req.path, method: req.method });
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler
app.use(errorHandler);

module.exports = app;
