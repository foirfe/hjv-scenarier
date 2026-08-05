import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const requiredEnvironmentVariables = [
  "DATABASE_HOST",
  "DATABASE_PORT",
  "DATABASE_NAME",
  "DATABASE_USER",
  "DATABASE_PASSWORD",
];

for (const variableName of requiredEnvironmentVariables) {
  if (!process.env[variableName]) {
    throw new Error(`Miljøvariablen ${variableName} mangler`);
  }
}

export const database = new Pool({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
});

database.on("error", (error) => {
  console.error("Uventet PostgreSQL-fejl:", error);
});