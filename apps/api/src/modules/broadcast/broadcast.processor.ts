import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Logger } from "@nestjs/common";
import { PrismaService } from "../../common/services/prisma.service";
import { NotificationService } from "../notification/notification.service";

interface BroadcastJobData {
  broadcastId: string;
  recipientIds: string[];
  channel: string;
  title: string;
  content: string;
  mediaUrl?: string;
  actionUrl?: string;
}

@Processor("broadcast-queue")
export class BroadcastProcessor extends WorkerHost {
  private readonly logger = new Logger(BroadcastProcessor.name);
  private readonly BATCH_SIZE = 100;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {
    super();
  }

  async process(job: Job<BroadcastJobData>) {
    const { broadcastId, recipientIds, channel, title, content, mediaUrl, actionUrl } = job.data;

    this.logger.log(
      `Processing broadcast ${broadcastId} for ${recipientIds.length} recipients`,
    );

    await this.prisma.broadcast.update({
      where: { id: broadcastId },
      data: { status: "SENDING" },
    });

    let delivered = 0;
    let failed = 0;

    for (let i = 0; i < recipientIds.length; i += this.BATCH_SIZE) {
      const batch = recipientIds.slice(i, i + this.BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (recipientId) => {
          try {
            const analytics = await this.prisma.broadcastAnalytics.create({
              data: {
                broadcastId,
                userId: recipientId,
              },
            });

            const fullContent = `${content}\n\n— iBidDZ · Reply STOP to opt out`;

            await this.notificationService.create({
              userId: recipientId,
              type: "BROADCAST",
              channel: this.mapChannel(channel),
              title,
              body: fullContent,
              data: {
                broadcastId,
                analyticsId: analytics.id,
                mediaUrl: mediaUrl || null,
              },
              actionUrl: actionUrl || null,
            });

            await this.prisma.broadcastAnalytics.update({
              where: { id: analytics.id },
              data: {
                delivered: true,
                deliveredAt: new Date(),
              },
            });

            return { success: true, recipientId };
          } catch (error) {
            this.logger.error(
              `Failed to deliver to ${recipientId}: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
            return { success: false, recipientId, error };
          }
        }),
      );

      for (const result of results) {
        if (result.status === "fulfilled" && result.value.success) {
          delivered++;
        } else {
          failed++;
        }
      }

      await this.prisma.broadcast.update({
        where: { id: broadcastId },
        data: {
          deliveredCount: delivered,
          sentCount: delivered + failed,
        },
      });
    }

    const finalStatus = failed > recipientIds.length * 0.5 ? "FAILED" : "SENT";

    await this.prisma.broadcast.update({
      where: { id: broadcastId },
      data: {
        status: finalStatus,
        sentAt: new Date(),
        sentCount: delivered + failed,
        deliveredCount: delivered,
      },
    });

    this.logger.log(
      `Broadcast ${broadcastId} completed: ${delivered} delivered, ${failed} failed`,
    );

    return {
      success: finalStatus === "SENT",
      broadcastId,
      delivered,
      failed,
    };
  }

  private mapChannel(channel: string): "PUSH" | "SMS" | "EMAIL" | "IN_APP" {
    switch (channel.toUpperCase()) {
      case "PUSH":
        return "PUSH";
      case "SMS":
        return "SMS";
      case "EMAIL":
        return "EMAIL";
      case "IN_APP":
        return "IN_APP";
      case "WHATSAPP":
        return "IN_APP";
      default:
        return "IN_APP";
    }
  }
}
