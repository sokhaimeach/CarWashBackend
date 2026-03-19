const dotenv = require("dotenv");
dotenv.config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME || "SshinzCarWash",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "", // 👈 ADD THIS
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    dialect: "mysql",
    logging: false,
  },
);

// TEST connection
if (process.env.NODE_ENV !== "test") {
  sequelize
    .authenticate()
    .then(() => console.log("✅ Sequelize connected.."))
    .catch((err) => console.log("❌ DB Error:", err));
}

module.exports = sequelize;
