import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import * as helmet from "helmet";
import * as compression from "compression";
import { rateLimit } from "express-rate-limit";
import { AppModule } from "./app.module";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === "production" ? ["error", "warn", "log"] : ["log"],
  });

  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  });

  app.use(helmet.default());
  app.use(compression());

  app.use(
    rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: "Too many requests, please try again later.",
        statusCode: 429,
      },
    })
  );

  app.setGlobalPrefix("v1");

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  const config = new DocumentBuilder()
    .setTitle("iBidDZ API")
    .setDescription("Algerian iPhone Marketplace API")
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header",
      },
      "JWT-auth"
    )
    .addTag("auth", "Authentication endpoints")
    .addTag("users", "User management")
    .addTag("listings", "Listing management")
    .addTag("auctions", "Auction management")
    .addTag("orders", "Order management")
    .addTag("payments", "Payment processing")
    .addTag("chat", "Messaging")
    .addTag("admin", "Admin operations")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const redisPubClient = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
  });
  const redisSubClient = redisPubClient.duplicate();

  await Promise.all([redisPubClient.connect(), redisSubClient.connect()]);

  app.useWebSocketAdapter(new IoAdapter(app));

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 iBidDZ API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);

  process.on("SIGTERM", async () => {
    console.log("SIGTERM received. Shutting down gracefully...");
    await Promise.all([redisPubClient.quit(), redisSubClient.quit()]);
    await app.close();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    console.log("SIGINT received. Shutting down gracefully...");
    await Promise.all([redisPubClient.quit(), redisSubClient.quit()]);
    await app.close();
    process.exit(0);
  });
}

bootstrap();
