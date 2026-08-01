import "server-only";

import { readWebEnvironment } from "@atlas/config";
import { createDatabase } from "@atlas/database";

const connection = createDatabase(readWebEnvironment().DATABASE_URL);

export const database = connection.db;
