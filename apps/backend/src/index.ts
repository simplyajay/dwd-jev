import express from "express";
import { env } from "./env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { responseShape } from "./middleware/responseShape.js";
import { router } from "./routes/index.js";

const app = express();

app.use(express.json());
app.use(requestLogger);
app.use(responseShape);

app.use("/api", router);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Server listening on port ${env.PORT}`);
});
