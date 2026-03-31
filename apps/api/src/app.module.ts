import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { ListingModule } from "./modules/listing/listing.module";
import { AuctionModule } from "./modules/auction/auction.module";
import { OrderModule } from "./modules/order/order.module";
import { CourierModule } from "./modules/courier/courier.module";
import { TrustModule } from "./modules/trust/trust.module";
import { CommissionModule } from "./modules/commission/commission.module";
import { WalletModule } from "./modules/wallet/wallet.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { ChatModule } from "./modules/chat/chat.module";
import { AdminModule } from "./modules/admin/admin.module";
import { BroadcastModule } from "./modules/broadcast/broadcast.module";
import { ReviewModule } from "./modules/review/review.module";
import { NotificationModule } from "./modules/notification/notification.module";
import { SubscriptionModule } from "./modules/subscription/subscription.module";
import { UserProfileModule } from "./modules/user-profile/user-profile.module";
import { appConfig } from "./config/app.config";
import { databaseConfig } from "./config/database.config";
import { redisConfig } from "./config/redis.config";
import { jwtConfig } from "./config/jwt.config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, jwtConfig],
      envFilePath: [".env.local", ".env"],
    }),
    AuthModule,
    UsersModule,
    ListingModule,
    AuctionModule,
    OrderModule,
    CourierModule,
    TrustModule,
    CommissionModule,
    WalletModule,
    PaymentsModule,
    ChatModule,
    AdminModule,
    BroadcastModule,
    ReviewModule,
    NotificationModule,
    SubscriptionModule,
    UserProfileModule,
  ],
})
export class AppModule {}
