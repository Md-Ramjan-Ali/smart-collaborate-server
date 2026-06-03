"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("../../generated/prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const config_1 = __importDefault(require("../config"));
// Initialize PostgreSQL connection pool using pg
const pool = new pg_1.Pool({
    connectionString: config_1.default.database_url,
});
// Create Prisma PG adapter for compatibility with Prisma 7
const adapter = new adapter_pg_1.PrismaPg(pool);
// Export single PrismaClient instance
exports.prisma = new client_1.PrismaClient({ adapter });
exports.default = exports.prisma;
