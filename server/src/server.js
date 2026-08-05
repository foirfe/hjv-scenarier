import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { database } from "./database.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

//Forside
app.get("/", (request, response) => {
  response.json({
    message: "HJV API kører",
    endpoints: [
      "GET /api/health",
      "GET /api/users",
      "GET /api/scenarios",
      "GET /api/scenarios/:id",
      "POST /api/scenarios",
      "PATCH /api/scenarios/:id/status",
      "DELETE /api/scenarios/:id",
    ],
  });
});


//Ping/test af server
app.get("/api/health", async (request, response) => {
  try {
    const result = await database.query(
      "SELECT CURRENT_TIMESTAMP AS database_time"
    );

    response.json({
      status: "ok",
      message: "Serveren kan kontakte PostgreSQL",
      databaseTime: result.rows[0].database_time,
    });
  } catch (error) {
    console.error(error);

    response.status(500).json({
      status: "error",
      message: "Serveren kunne ikke kontakte PostgreSQL",
    });
  }
});

//GET af brugere
app.get("/api/users", async (request, response) => {
  try {
    const result = await database.query(`
      SELECT
        id,
        name,
        email,
        role,
        created_at
      FROM users
      ORDER BY id
    `);

    response.json(result.rows);
  } catch (error) {
    console.error(error);

    response.status(500).json({
      message: "Brugerne kunne ikke hentes",
    });
  }
});


//GET Scenarier
app.get("/api/scenarios", async (request, response) => {
  try {
    const result = await database.query(`
      SELECT
        scenarios.id,
        scenarios.title,
        scenarios.description,
        scenarios.status,
        scenarios.created_at,
        users.id AS created_by_id,
        users.name AS created_by_name
      FROM scenarios
      JOIN users
        ON users.id = scenarios.created_by_id
      ORDER BY scenarios.id
    `);
    response.json(result.rows);
  } catch (error) {
    console.error(error);
    response.status(500).json({
      message: "Scenarierne kunne ikke hentes",
    });
  }
});

//Get Scenarie med opgaver
app.get("/api/scenarios/:id", async (request, response) => {
  const scenarioId = Number(request.params.id);
  if (!Number.isInteger(scenarioId) || scenarioId <= 0) {
    return response.status(400).json({
      message: "Scenario-id skal være et positivt heltal",
    });
  }
  try {
    const scenarioResult = await database.query(
      `
        SELECT
          scenarios.id,
          scenarios.title,
          scenarios.description,
          scenarios.status,
          scenarios.created_at,
          users.id AS created_by_id,
          users.name AS created_by_name
        FROM scenarios
        JOIN users
          ON users.id = scenarios.created_by_id
        WHERE scenarios.id = $1
      `,
      [scenarioId]
    );
    if (scenarioResult.rows.length === 0) {
      return response.status(404).json({
        message: "Scenariet blev ikke fundet",
      });
    }
    const tasksResult = await database.query(
      `
        SELECT
          id,
          title,
          description,
          points,
          sort_order
        FROM tasks
        WHERE scenario_id = $1
        ORDER BY sort_order, id
      `,
      [scenarioId]
    );
    response.json({
      ...scenarioResult.rows[0],
      tasks: tasksResult.rows,
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({
      message: "Scenariet kunne ikke hentes",
    });
  }
});

//Oprettelse af scenarie
app.post("/api/scenarios", async (request, response) => {
  const { title, description = null, createdById } = request.body;
  if (typeof title !== "string" || title.trim().length < 3) {
    return response.status(400).json({
      message: "Titel skal være mindst 3 tegn",
    });
  }
  if (!Number.isInteger(createdById) || createdById <= 0) {
    return response.status(400).json({
      message: "createdById skal være et positivt heltal",
    });
  }
  try {
    const userResult = await database.query(
      `
        SELECT id, role
        FROM users
        WHERE id = $1
      `,
      [createdById]
    );
    if (userResult.rows.length === 0) {
      return response.status(400).json({
        message: "Brugeren findes ikke",
      });
    }
    const allowedRoles = ["ADMIN", "GAMEMASTER"];
    if (!allowedRoles.includes(userResult.rows[0].role)) {
      return response.status(403).json({
        message: "Denne bruger må ikke oprette scenarier",
      });
    }
    const result = await database.query(
      `
        INSERT INTO scenarios (
          title,
          description,
          status,
          created_by_id
        )
        VALUES ($1, $2, 'DRAFT', $3)
        RETURNING
          id,
          title,
          description,
          status,
          created_by_id,
          created_at
      `,
      [title.trim(), description, createdById]
    );
    response.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    response.status(500).json({
      message: "Scenariet kunne ikke oprettes",
    });
  }
});

//Scenarie status
app.patch("/api/scenarios/:id/status", async (request, response) => {
  const scenarioId = Number(request.params.id);
  const { status } = request.body;
  const allowedStatuses = [
    "DRAFT",
    "READY",
    "ACTIVE",
    "COMPLETED",
  ];
  if (!Number.isInteger(scenarioId) || scenarioId <= 0) {
    return response.status(400).json({
      message: "Scenario-id skal være et positivt heltal",
    });
  }
  if (!allowedStatuses.includes(status)) {
    return response.status(400).json({
      message: `Status skal være en af: ${allowedStatuses.join(", ")}`,
    });
  }
  try {
    const result = await database.query(
      `
        UPDATE scenarios
        SET status = $1
        WHERE id = $2
        RETURNING
          id,
          title,
          status
      `,
      [status, scenarioId]
    );
    if (result.rows.length === 0) {
      return response.status(404).json({
        message: "Scenariet blev ikke fundet",
      });
    }
    response.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    response.status(500).json({
      message: "Status kunne ikke opdateres",
    });
  }
});

//Slet Scenarie
app.delete("/api/scenarios/:id", async (request, response) => {
  const scenarioId = Number(request.params.id);
  if (!Number.isInteger(scenarioId) || scenarioId <= 0) {
    return response.status(400).json({
      message: "Scenario-id skal være et positivt heltal",
    });
  }
  try {
    const result = await database.query(
      `
        DELETE FROM scenarios
        WHERE id = $1
        RETURNING id, title
      `,
      [scenarioId]
    );
    if (result.rows.length === 0) {
      return response.status(404).json({
        message: "Scenariet blev ikke fundet",
      });
    }
    response.json({
      message: "Scenariet blev slettet",
      scenario: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({
      message: "Scenariet kunne ikke slettes",
    });
  }
});

//404 Errors
app.use((request, response) => {
  response.status(404).json({
    message: "Endpointet findes ikke",
  });
});

async function startServer() {
  try {
    await database.query("SELECT 1");

    app.listen(port, () => {
      console.log(`Serveren kører på http://localhost:${port}`);
      console.log("Forbindelsen til PostgreSQL virker");
    });
  } catch (error) {
    console.error("Serveren kunne ikke starte:", error.message);
    process.exit(1);
  }
}

startServer();