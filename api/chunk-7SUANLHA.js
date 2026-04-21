var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

// src/lib/prisma.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

// src/generated/prisma/client.ts
import * as path from "path";
import { fileURLToPath } from "url";

// src/generated/prisma/internal/class.ts
import * as runtime from "@prisma/client/runtime/client";
var config = {
  "previewFeatures": [],
  "clientVersion": "7.5.0",
  "engineVersion": "280c870be64f457428992c43c1f6d557fab6e29e",
  "activeProvider": "postgresql",
  "inlineSchema": 'enum ActivityAction {\n  CREATE_IDEA\n  UPDATE_IDEA\n  DELETE_IDEA\n  SUBMIT_IDEA\n  APPROVE_IDEA\n  REJECT_IDEA\n  CAST_VOTE\n  REMOVE_VOTE\n  ADD_COMMENT\n  DELETE_COMMENT\n  MAKE_PAYMENT\n  BOOKMARK_IDEA\n  REMOVE_BOOKMARK\n  USER_LOGIN\n  USER_LOGOUT\n  USER_REGISTER\n  ADMIN_ACTION\n}\n\nmodel ActivityLog {\n  id        String         @id @default(uuid())\n  action    ActivityAction\n  details   Json?\n  ipAddress String?\n  userAgent String?\n  createdAt DateTime       @default(now())\n\n  // Foreign Keys\n  userId String\n\n  // Relations\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@index([action])\n  @@index([createdAt])\n  @@map("activity_logs")\n}\n\nenum Role {\n  MEMBER\n  ADMIN\n}\n\nenum AccountStatus {\n  ACTIVE\n  SUSPENDED\n  BANNED\n}\n\nmodel User {\n  id            String        @id @default(uuid())\n  name          String\n  email         String        @unique\n  emailVerified Boolean       @default(false)\n  image         String?\n  role          Role          @default(MEMBER)\n  accountStatus AccountStatus @default(ACTIVE)\n  phone         String?\n  address       String?\n  createdAt     DateTime      @default(now())\n  updatedAt     DateTime      @updatedAt\n\n  // Relations\n  ideas                   Idea[]\n  votes                   Vote[]\n  comments                Comment[]\n  payments                Payment[]\n  bookmarks               Bookmark[]\n  newsletterSubscriptions Newsletter[]\n  commentReports          CommentReport[] @relation("ReporterReports")\n  moderatedReports        CommentReport[] @relation("ModeratorReports")\n  activityLogs            ActivityLog[]\n\n  sessions Session[]\n  accounts Account[]\n\n  @@map("users")\n}\n\nmodel Session {\n  id        String   @id\n  expiresAt DateTime\n  token     String   @unique\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  ipAddress String?\n  userAgent String?\n  userId    String\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@map("sessions")\n}\n\nmodel Account {\n  id                    String    @id\n  accountId             String\n  providerId            String\n  userId                String\n  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)\n  accessToken           String?\n  refreshToken          String?\n  idToken               String?\n  accessTokenExpiresAt  DateTime?\n  refreshTokenExpiresAt DateTime?\n  scope                 String?\n  password              String?\n  createdAt             DateTime  @default(now())\n  updatedAt             DateTime  @updatedAt\n\n  @@index([userId])\n  @@map("accounts")\n}\n\nmodel Verification {\n  id         String   @id\n  identifier String\n  value      String\n  expiresAt  DateTime\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n\n  @@index([identifier])\n  @@map("verifications")\n}\n\nmodel Bookmark {\n  id        String   @id @default(uuid())\n  createdAt DateTime @default(now())\n\n  // Foreign Keys\n  userId String\n  ideaId String\n\n  // Relations\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n  idea Idea @relation(fields: [ideaId], references: [id], onDelete: Cascade)\n\n  @@unique([userId, ideaId])\n  @@index([userId])\n  @@index([ideaId])\n  @@map("bookmarks")\n}\n\nmodel Category {\n  id          String   @id @default(uuid())\n  name        String   @unique\n  slug        String   @unique\n  description String?\n  createdAt   DateTime @default(now())\n  updatedAt   DateTime @updatedAt\n\n  // Relations\n  ideas IdeaCategory[]\n\n  @@map("categories")\n}\n\nmodel IdeaCategory {\n  id         String   @id @default(uuid())\n  ideaId     String\n  categoryId String\n  createdAt  DateTime @default(now())\n\n  idea     Idea     @relation(fields: [ideaId], references: [id], onDelete: Cascade)\n  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)\n\n  @@unique([ideaId, categoryId])\n  @@index([ideaId])\n  @@index([categoryId])\n  @@map("idea_categories")\n}\n\nmodel Comment {\n  id        String   @id @default(uuid())\n  content   String   @db.Text\n  isDeleted Boolean  @default(false)\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  // Foreign Keys\n  userId   String\n  ideaId   String\n  parentId String?\n\n  // Relations\n  user    User            @relation(fields: [userId], references: [id], onDelete: Cascade)\n  idea    Idea            @relation(fields: [ideaId], references: [id], onDelete: Cascade)\n  parent  Comment?        @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)\n  replies Comment[]       @relation("CommentReplies")\n  reports CommentReport[]\n\n  @@index([userId])\n  @@index([ideaId])\n  @@index([parentId])\n  @@index([createdAt])\n  @@map("comments")\n}\n\nmodel CommentReport {\n  id         String       @id @default(uuid())\n  reason     String\n  status     ReportStatus @default(PENDING)\n  createdAt  DateTime     @default(now())\n  resolvedAt DateTime?\n\n  // Foreign Keys\n  commentId   String\n  reporterId  String\n  moderatorId String?\n\n  // Relations\n  comment   Comment @relation(fields: [commentId], references: [id], onDelete: Cascade)\n  reporter  User    @relation("ReporterReports", fields: [reporterId], references: [id], onDelete: Cascade)\n  moderator User?   @relation("ModeratorReports", fields: [moderatorId], references: [id])\n\n  @@index([commentId])\n  @@index([reporterId])\n  @@index([status])\n  @@map("comment_reports")\n}\n\nenum ReportStatus {\n  PENDING\n  RESOLVED\n  DISMISSED\n}\n\nenum IdeaStatus {\n  DRAFT\n  PENDING\n  APPROVED\n  REJECTED\n}\n\nmodel Idea {\n  id               String     @id @default(uuid())\n  title            String\n  problemStatement String     @db.Text\n  solution         String     @db.Text\n  description      String     @db.Text\n  imageUrl         String?\n  status           IdeaStatus @default(DRAFT)\n  isPaid           Boolean    @default(false)\n  price            Float?\n  feedback         String?    @db.Text\n  viewCount        Int        @default(0)\n  publishedAt      DateTime?\n  rejectedAt       DateTime?\n  createdAt        DateTime   @default(now())\n  updatedAt        DateTime   @updatedAt\n\n  // Foreign Keys\n  authorId String\n  author   User   @relation(fields: [authorId], references: [id], onDelete: Cascade)\n\n  // Relations\n  categories IdeaCategory[]\n  votes      Vote[]\n  comments   Comment[]\n  payments   Payment[]\n  bookmarks  Bookmark[]\n\n  @@index([authorId])\n  @@index([status])\n  @@index([createdAt])\n  @@map("ideas")\n}\n\nmodel Newsletter {\n  id             String    @id @default(uuid())\n  email          String    @unique\n  isSubscribed   Boolean   @default(true)\n  subscribedAt   DateTime  @default(now())\n  unsubscribedAt DateTime?\n\n  // Optional: track which user (if registered)\n  userId String?\n  user   User?   @relation(fields: [userId], references: [id], onDelete: SetNull)\n\n  @@index([email])\n  @@index([isSubscribed])\n  @@map("newsletters")\n}\n\nenum PaymentStatus {\n  PENDING\n  COMPLETED\n  FAILED\n  REFUNDED\n}\n\nenum PaymentMethod {\n  SSLCOMMERZ\n  STRIPE\n  SHURJOPAY\n}\n\nmodel Payment {\n  id            String        @id @default(uuid())\n  amount        Float\n  status        PaymentStatus @default(PENDING)\n  transactionId String?       @unique\n  paymentMethod PaymentMethod\n  paidAt        DateTime?\n  createdAt     DateTime      @default(now())\n  updatedAt     DateTime      @updatedAt\n\n  // Foreign Keys\n  userId String\n  ideaId String\n\n  // Relations\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n  idea Idea @relation(fields: [ideaId], references: [id], onDelete: Restrict)\n\n  @@index([userId])\n  @@index([ideaId])\n  @@index([status])\n  @@index([transactionId])\n  @@map("payments")\n}\n\ngenerator client {\n  provider = "prisma-client"\n  output   = "../../src/generated/prisma"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nenum VoteType {\n  UP\n  DOWN\n}\n\nmodel Vote {\n  id        String   @id @default(uuid())\n  voteType  VoteType\n  createdAt DateTime @default(now())\n\n  // Foreign Keys\n  userId String\n  ideaId String\n\n  // Relations\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n  idea Idea @relation(fields: [ideaId], references: [id], onDelete: Cascade)\n\n  @@unique([userId, ideaId])\n  @@index([userId])\n  @@index([ideaId])\n  @@map("votes")\n}\n',
  "runtimeDataModel": {
    "models": {},
    "enums": {},
    "types": {}
  },
  "parameterizationSchema": {
    "strings": [],
    "graph": ""
  }
};
config.runtimeDataModel = JSON.parse('{"models":{"ActivityLog":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"action","kind":"enum","type":"ActivityAction"},{"name":"details","kind":"scalar","type":"Json"},{"name":"ipAddress","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"ActivityLogToUser"}],"dbName":"activity_logs"},"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"emailVerified","kind":"scalar","type":"Boolean"},{"name":"image","kind":"scalar","type":"String"},{"name":"role","kind":"enum","type":"Role"},{"name":"accountStatus","kind":"enum","type":"AccountStatus"},{"name":"phone","kind":"scalar","type":"String"},{"name":"address","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"ideas","kind":"object","type":"Idea","relationName":"IdeaToUser"},{"name":"votes","kind":"object","type":"Vote","relationName":"UserToVote"},{"name":"comments","kind":"object","type":"Comment","relationName":"CommentToUser"},{"name":"payments","kind":"object","type":"Payment","relationName":"PaymentToUser"},{"name":"bookmarks","kind":"object","type":"Bookmark","relationName":"BookmarkToUser"},{"name":"newsletterSubscriptions","kind":"object","type":"Newsletter","relationName":"NewsletterToUser"},{"name":"commentReports","kind":"object","type":"CommentReport","relationName":"ReporterReports"},{"name":"moderatedReports","kind":"object","type":"CommentReport","relationName":"ModeratorReports"},{"name":"activityLogs","kind":"object","type":"ActivityLog","relationName":"ActivityLogToUser"},{"name":"sessions","kind":"object","type":"Session","relationName":"SessionToUser"},{"name":"accounts","kind":"object","type":"Account","relationName":"AccountToUser"}],"dbName":"users"},"Session":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"token","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"ipAddress","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"SessionToUser"}],"dbName":"sessions"},"Account":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"accountId","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"AccountToUser"},{"name":"accessToken","kind":"scalar","type":"String"},{"name":"refreshToken","kind":"scalar","type":"String"},{"name":"idToken","kind":"scalar","type":"String"},{"name":"accessTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"refreshTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"scope","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"accounts"},"Verification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"identifier","kind":"scalar","type":"String"},{"name":"value","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"verifications"},"Bookmark":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"userId","kind":"scalar","type":"String"},{"name":"ideaId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"BookmarkToUser"},{"name":"idea","kind":"object","type":"Idea","relationName":"BookmarkToIdea"}],"dbName":"bookmarks"},"Category":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"slug","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"ideas","kind":"object","type":"IdeaCategory","relationName":"CategoryToIdeaCategory"}],"dbName":"categories"},"IdeaCategory":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"ideaId","kind":"scalar","type":"String"},{"name":"categoryId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"idea","kind":"object","type":"Idea","relationName":"IdeaToIdeaCategory"},{"name":"category","kind":"object","type":"Category","relationName":"CategoryToIdeaCategory"}],"dbName":"idea_categories"},"Comment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"content","kind":"scalar","type":"String"},{"name":"isDeleted","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"userId","kind":"scalar","type":"String"},{"name":"ideaId","kind":"scalar","type":"String"},{"name":"parentId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"CommentToUser"},{"name":"idea","kind":"object","type":"Idea","relationName":"CommentToIdea"},{"name":"parent","kind":"object","type":"Comment","relationName":"CommentReplies"},{"name":"replies","kind":"object","type":"Comment","relationName":"CommentReplies"},{"name":"reports","kind":"object","type":"CommentReport","relationName":"CommentToCommentReport"}],"dbName":"comments"},"CommentReport":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"reason","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"ReportStatus"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"resolvedAt","kind":"scalar","type":"DateTime"},{"name":"commentId","kind":"scalar","type":"String"},{"name":"reporterId","kind":"scalar","type":"String"},{"name":"moderatorId","kind":"scalar","type":"String"},{"name":"comment","kind":"object","type":"Comment","relationName":"CommentToCommentReport"},{"name":"reporter","kind":"object","type":"User","relationName":"ReporterReports"},{"name":"moderator","kind":"object","type":"User","relationName":"ModeratorReports"}],"dbName":"comment_reports"},"Idea":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"problemStatement","kind":"scalar","type":"String"},{"name":"solution","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"imageUrl","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"IdeaStatus"},{"name":"isPaid","kind":"scalar","type":"Boolean"},{"name":"price","kind":"scalar","type":"Float"},{"name":"feedback","kind":"scalar","type":"String"},{"name":"viewCount","kind":"scalar","type":"Int"},{"name":"publishedAt","kind":"scalar","type":"DateTime"},{"name":"rejectedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"authorId","kind":"scalar","type":"String"},{"name":"author","kind":"object","type":"User","relationName":"IdeaToUser"},{"name":"categories","kind":"object","type":"IdeaCategory","relationName":"IdeaToIdeaCategory"},{"name":"votes","kind":"object","type":"Vote","relationName":"IdeaToVote"},{"name":"comments","kind":"object","type":"Comment","relationName":"CommentToIdea"},{"name":"payments","kind":"object","type":"Payment","relationName":"IdeaToPayment"},{"name":"bookmarks","kind":"object","type":"Bookmark","relationName":"BookmarkToIdea"}],"dbName":"ideas"},"Newsletter":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"isSubscribed","kind":"scalar","type":"Boolean"},{"name":"subscribedAt","kind":"scalar","type":"DateTime"},{"name":"unsubscribedAt","kind":"scalar","type":"DateTime"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"NewsletterToUser"}],"dbName":"newsletters"},"Payment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"amount","kind":"scalar","type":"Float"},{"name":"status","kind":"enum","type":"PaymentStatus"},{"name":"transactionId","kind":"scalar","type":"String"},{"name":"paymentMethod","kind":"enum","type":"PaymentMethod"},{"name":"paidAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"userId","kind":"scalar","type":"String"},{"name":"ideaId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"PaymentToUser"},{"name":"idea","kind":"object","type":"Idea","relationName":"IdeaToPayment"}],"dbName":"payments"},"Vote":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"voteType","kind":"enum","type":"VoteType"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"userId","kind":"scalar","type":"String"},{"name":"ideaId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"UserToVote"},{"name":"idea","kind":"object","type":"Idea","relationName":"IdeaToVote"}],"dbName":"votes"}},"enums":{},"types":{}}');
config.parameterizationSchema = {
  strings: JSON.parse('["where","orderBy","cursor","author","idea","ideas","_count","category","categories","user","votes","parent","replies","comment","reporter","moderator","reports","comments","payments","bookmarks","newsletterSubscriptions","commentReports","moderatedReports","activityLogs","sessions","accounts","ActivityLog.findUnique","ActivityLog.findUniqueOrThrow","ActivityLog.findFirst","ActivityLog.findFirstOrThrow","ActivityLog.findMany","data","ActivityLog.createOne","ActivityLog.createMany","ActivityLog.createManyAndReturn","ActivityLog.updateOne","ActivityLog.updateMany","ActivityLog.updateManyAndReturn","create","update","ActivityLog.upsertOne","ActivityLog.deleteOne","ActivityLog.deleteMany","having","_min","_max","ActivityLog.groupBy","ActivityLog.aggregate","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","User.upsertOne","User.deleteOne","User.deleteMany","User.groupBy","User.aggregate","Session.findUnique","Session.findUniqueOrThrow","Session.findFirst","Session.findFirstOrThrow","Session.findMany","Session.createOne","Session.createMany","Session.createManyAndReturn","Session.updateOne","Session.updateMany","Session.updateManyAndReturn","Session.upsertOne","Session.deleteOne","Session.deleteMany","Session.groupBy","Session.aggregate","Account.findUnique","Account.findUniqueOrThrow","Account.findFirst","Account.findFirstOrThrow","Account.findMany","Account.createOne","Account.createMany","Account.createManyAndReturn","Account.updateOne","Account.updateMany","Account.updateManyAndReturn","Account.upsertOne","Account.deleteOne","Account.deleteMany","Account.groupBy","Account.aggregate","Verification.findUnique","Verification.findUniqueOrThrow","Verification.findFirst","Verification.findFirstOrThrow","Verification.findMany","Verification.createOne","Verification.createMany","Verification.createManyAndReturn","Verification.updateOne","Verification.updateMany","Verification.updateManyAndReturn","Verification.upsertOne","Verification.deleteOne","Verification.deleteMany","Verification.groupBy","Verification.aggregate","Bookmark.findUnique","Bookmark.findUniqueOrThrow","Bookmark.findFirst","Bookmark.findFirstOrThrow","Bookmark.findMany","Bookmark.createOne","Bookmark.createMany","Bookmark.createManyAndReturn","Bookmark.updateOne","Bookmark.updateMany","Bookmark.updateManyAndReturn","Bookmark.upsertOne","Bookmark.deleteOne","Bookmark.deleteMany","Bookmark.groupBy","Bookmark.aggregate","Category.findUnique","Category.findUniqueOrThrow","Category.findFirst","Category.findFirstOrThrow","Category.findMany","Category.createOne","Category.createMany","Category.createManyAndReturn","Category.updateOne","Category.updateMany","Category.updateManyAndReturn","Category.upsertOne","Category.deleteOne","Category.deleteMany","Category.groupBy","Category.aggregate","IdeaCategory.findUnique","IdeaCategory.findUniqueOrThrow","IdeaCategory.findFirst","IdeaCategory.findFirstOrThrow","IdeaCategory.findMany","IdeaCategory.createOne","IdeaCategory.createMany","IdeaCategory.createManyAndReturn","IdeaCategory.updateOne","IdeaCategory.updateMany","IdeaCategory.updateManyAndReturn","IdeaCategory.upsertOne","IdeaCategory.deleteOne","IdeaCategory.deleteMany","IdeaCategory.groupBy","IdeaCategory.aggregate","Comment.findUnique","Comment.findUniqueOrThrow","Comment.findFirst","Comment.findFirstOrThrow","Comment.findMany","Comment.createOne","Comment.createMany","Comment.createManyAndReturn","Comment.updateOne","Comment.updateMany","Comment.updateManyAndReturn","Comment.upsertOne","Comment.deleteOne","Comment.deleteMany","Comment.groupBy","Comment.aggregate","CommentReport.findUnique","CommentReport.findUniqueOrThrow","CommentReport.findFirst","CommentReport.findFirstOrThrow","CommentReport.findMany","CommentReport.createOne","CommentReport.createMany","CommentReport.createManyAndReturn","CommentReport.updateOne","CommentReport.updateMany","CommentReport.updateManyAndReturn","CommentReport.upsertOne","CommentReport.deleteOne","CommentReport.deleteMany","CommentReport.groupBy","CommentReport.aggregate","Idea.findUnique","Idea.findUniqueOrThrow","Idea.findFirst","Idea.findFirstOrThrow","Idea.findMany","Idea.createOne","Idea.createMany","Idea.createManyAndReturn","Idea.updateOne","Idea.updateMany","Idea.updateManyAndReturn","Idea.upsertOne","Idea.deleteOne","Idea.deleteMany","_avg","_sum","Idea.groupBy","Idea.aggregate","Newsletter.findUnique","Newsletter.findUniqueOrThrow","Newsletter.findFirst","Newsletter.findFirstOrThrow","Newsletter.findMany","Newsletter.createOne","Newsletter.createMany","Newsletter.createManyAndReturn","Newsletter.updateOne","Newsletter.updateMany","Newsletter.updateManyAndReturn","Newsletter.upsertOne","Newsletter.deleteOne","Newsletter.deleteMany","Newsletter.groupBy","Newsletter.aggregate","Payment.findUnique","Payment.findUniqueOrThrow","Payment.findFirst","Payment.findFirstOrThrow","Payment.findMany","Payment.createOne","Payment.createMany","Payment.createManyAndReturn","Payment.updateOne","Payment.updateMany","Payment.updateManyAndReturn","Payment.upsertOne","Payment.deleteOne","Payment.deleteMany","Payment.groupBy","Payment.aggregate","Vote.findUnique","Vote.findUniqueOrThrow","Vote.findFirst","Vote.findFirstOrThrow","Vote.findMany","Vote.createOne","Vote.createMany","Vote.createManyAndReturn","Vote.updateOne","Vote.updateMany","Vote.updateManyAndReturn","Vote.upsertOne","Vote.deleteOne","Vote.deleteMany","Vote.groupBy","Vote.aggregate","AND","OR","NOT","id","VoteType","voteType","createdAt","userId","ideaId","equals","in","notIn","lt","lte","gt","gte","not","contains","startsWith","endsWith","amount","PaymentStatus","status","transactionId","PaymentMethod","paymentMethod","paidAt","updatedAt","email","isSubscribed","subscribedAt","unsubscribedAt","title","problemStatement","solution","description","imageUrl","IdeaStatus","isPaid","price","feedback","viewCount","publishedAt","rejectedAt","authorId","reason","ReportStatus","resolvedAt","commentId","reporterId","moderatorId","content","isDeleted","parentId","categoryId","name","slug","every","some","none","identifier","value","expiresAt","accountId","providerId","accessToken","refreshToken","idToken","accessTokenExpiresAt","refreshTokenExpiresAt","scope","password","token","ipAddress","userAgent","emailVerified","image","Role","role","AccountStatus","accountStatus","phone","address","ActivityAction","action","details","string_contains","string_starts_with","string_ends_with","array_starts_with","array_ends_with","array_contains","userId_ideaId","ideaId_categoryId","is","isNot","connectOrCreate","upsert","createMany","set","disconnect","delete","connect","updateMany","deleteMany","increment","decrement","multiply","divide"]'),
  graph: "2Qd54AELCQAA5QMAIIICAADnAwAwgwIAADcAEIQCAADnAwAwhQIBAAAAAYgCQADBAwAhiQIBAL8DACHLAgEAwAMAIcwCAQDAAwAh1gIAAOgD1gIi1wIAAOkDACABAAAAAQAgGQMAAOUDACAIAADCAwAgCgAA1AMAIBEAANUDACASAADWAwAgEwAA1wMAIIICAAD-AwAwgwIAAAMAEIQCAAD-AwAwhQIBAL8DACGIAkAAwQMAIZgCAAD_A6gCIp0CQADBAwAhogIBAL8DACGjAgEAvwMAIaQCAQC_AwAhpQIBAL8DACGmAgEAwAMAIagCIADQAwAhqQIIAIAEACGqAgEAwAMAIasCAgCBBAAhrAJAAOQDACGtAkAA5AMAIa4CAQC_AwAhCwMAAOQGACAIAAC0BQAgCgAA1gYAIBEAANcGACASAADYBgAgEwAA2QYAIKYCAACMBAAgqQIAAIwEACCqAgAAjAQAIKwCAACMBAAgrQIAAIwEACAZAwAA5QMAIAgAAMIDACAKAADUAwAgEQAA1QMAIBIAANYDACATAADXAwAgggIAAP4DADCDAgAAAwAQhAIAAP4DADCFAgEAAAABiAJAAMEDACGYAgAA_wOoAiKdAkAAwQMAIaICAQC_AwAhowIBAL8DACGkAgEAvwMAIaUCAQC_AwAhpgIBAMADACGoAiAA0AMAIakCCACABAAhqgIBAMADACGrAgIAgQQAIawCQADkAwAhrQJAAOQDACGuAgEAvwMAIQMAAAADACABAAAEADACAAAFACAJBAAA7gMAIAcAAP0DACCCAgAA_AMAMIMCAAAHABCEAgAA_AMAMIUCAQC_AwAhiAJAAMEDACGKAgEAvwMAIbgCAQC_AwAhAgQAAOUGACAHAADnBgAgCgQAAO4DACAHAAD9AwAgggIAAPwDADCDAgAABwAQhAIAAPwDADCFAgEAAAABiAJAAMEDACGKAgEAvwMAIbgCAQC_AwAh3wIAAPsDACADAAAABwAgAQAACAAwAgAACQAgAwAAAAcAIAEAAAgAMAIAAAkAIAEAAAAHACAKBAAA7gMAIAkAAOUDACCCAgAA-QMAMIMCAAANABCEAgAA-QMAMIUCAQC_AwAhhwIAAPoDhwIiiAJAAMEDACGJAgEAvwMAIYoCAQC_AwAhAgQAAOUGACAJAADkBgAgCwQAAO4DACAJAADlAwAgggIAAPkDADCDAgAADQAQhAIAAPkDADCFAgEAAAABhwIAAPoDhwIiiAJAAMEDACGJAgEAvwMAIYoCAQC_AwAh3gIAAPgDACADAAAADQAgAQAADgAwAgAADwAgEAQAAO4DACAJAADlAwAgCwAA9wMAIAwAANUDACAQAADZAwAgggIAAPYDADCDAgAAEQAQhAIAAPYDADCFAgEAvwMAIYgCQADBAwAhiQIBAL8DACGKAgEAvwMAIZ0CQADBAwAhtQIBAL8DACG2AiAA0AMAIbcCAQDAAwAhBgQAAOUGACAJAADkBgAgCwAA5gYAIAwAANcGACAQAADbBgAgtwIAAIwEACAQBAAA7gMAIAkAAOUDACALAAD3AwAgDAAA1QMAIBAAANkDACCCAgAA9gMAMIMCAAARABCEAgAA9gMAMIUCAQAAAAGIAkAAwQMAIYkCAQC_AwAhigIBAL8DACGdAkAAwQMAIbUCAQC_AwAhtgIgANADACG3AgEAwAMAIQMAAAARACABAAASADACAAATACABAAAAEQAgAwAAABEAIAEAABIAMAIAABMAIA4NAAD1AwAgDgAA5QMAIA8AAOsDACCCAgAA8wMAMIMCAAAXABCEAgAA8wMAMIUCAQC_AwAhiAJAAMEDACGYAgAA9AOxAiKvAgEAvwMAIbECQADkAwAhsgIBAL8DACGzAgEAvwMAIbQCAQDAAwAhBQ0AAOYGACAOAADkBgAgDwAA5AYAILECAACMBAAgtAIAAIwEACAODQAA9QMAIA4AAOUDACAPAADrAwAgggIAAPMDADCDAgAAFwAQhAIAAPMDADCFAgEAAAABiAJAAMEDACGYAgAA9AOxAiKvAgEAvwMAIbECQADkAwAhsgIBAL8DACGzAgEAvwMAIbQCAQDAAwAhAwAAABcAIAEAABgAMAIAABkAIBkFAADTAwAgCgAA1AMAIBEAANUDACASAADWAwAgEwAA1wMAIBQAANgDACAVAADZAwAgFgAA2QMAIBcAANoDACAYAADbAwAgGQAA3AMAIIICAADPAwAwgwIAABsAEIQCAADPAwAwhQIBAL8DACGIAkAAwQMAIZ0CQADBAwAhngIBAL8DACG5AgEAvwMAIc0CIADQAwAhzgIBAMADACHQAgAA0QPQAiLSAgAA0gPSAiLTAgEAwAMAIdQCAQDAAwAhAQAAABsAIAEAAAARACABAAAAFwAgDwQAAO4DACAJAADlAwAgggIAAO8DADCDAgAAHwAQhAIAAO8DADCFAgEAvwMAIYgCQADBAwAhiQIBAL8DACGKAgEAvwMAIZYCCADwAwAhmAIAAPEDmAIimQIBAMADACGbAgAA8gObAiKcAkAA5AMAIZ0CQADBAwAhBAQAAOUGACAJAADkBgAgmQIAAIwEACCcAgAAjAQAIA8EAADuAwAgCQAA5QMAIIICAADvAwAwgwIAAB8AEIQCAADvAwAwhQIBAAAAAYgCQADBAwAhiQIBAL8DACGKAgEAvwMAIZYCCADwAwAhmAIAAPEDmAIimQIBAAAAAZsCAADyA5sCIpwCQADkAwAhnQJAAMEDACEDAAAAHwAgAQAAIAAwAgAAIQAgCQQAAO4DACAJAADlAwAgggIAAO0DADCDAgAAIwAQhAIAAO0DADCFAgEAvwMAIYgCQADBAwAhiQIBAL8DACGKAgEAvwMAIQIEAADlBgAgCQAA5AYAIAoEAADuAwAgCQAA5QMAIIICAADtAwAwgwIAACMAEIQCAADtAwAwhQIBAAAAAYgCQADBAwAhiQIBAL8DACGKAgEAvwMAId4CAADsAwAgAwAAACMAIAEAACQAMAIAACUAIAEAAAAHACABAAAADQAgAQAAABEAIAEAAAAfACABAAAAIwAgAwAAAA0AIAEAAA4AMAIAAA8AIAMAAAARACABAAASADACAAATACADAAAAHwAgAQAAIAAwAgAAIQAgAwAAACMAIAEAACQAMAIAACUAIAoJAADrAwAgggIAAOoDADCDAgAAMAAQhAIAAOoDADCFAgEAvwMAIYkCAQDAAwAhngIBAL8DACGfAiAA0AMAIaACQADBAwAhoQJAAOQDACEDCQAA5AYAIIkCAACMBAAgoQIAAIwEACAKCQAA6wMAIIICAADqAwAwgwIAADAAEIQCAADqAwAwhQIBAAAAAYkCAQDAAwAhngIBAAAAAZ8CIADQAwAhoAJAAMEDACGhAkAA5AMAIQMAAAAwACABAAAxADACAAAyACABAAAAGwAgAwAAABcAIAEAABgAMAIAABkAIAMAAAAXACABAAAYADACAAAZACALCQAA5QMAIIICAADnAwAwgwIAADcAEIQCAADnAwAwhQIBAL8DACGIAkAAwQMAIYkCAQC_AwAhywIBAMADACHMAgEAwAMAIdYCAADoA9YCItcCAADpAwAgBAkAAOQGACDLAgAAjAQAIMwCAACMBAAg1wIAAIwEACADAAAANwAgAQAAOAAwAgAAAQAgDAkAAOUDACCCAgAA5gMAMIMCAAA6ABCEAgAA5gMAMIUCAQC_AwAhiAJAAMEDACGJAgEAvwMAIZ0CQADBAwAhwAJAAMEDACHKAgEAvwMAIcsCAQDAAwAhzAIBAMADACEDCQAA5AYAIMsCAACMBAAgzAIAAIwEACAMCQAA5QMAIIICAADmAwAwgwIAADoAEIQCAADmAwAwhQIBAAAAAYgCQADBAwAhiQIBAL8DACGdAkAAwQMAIcACQADBAwAhygIBAAAAAcsCAQDAAwAhzAIBAMADACEDAAAAOgAgAQAAOwAwAgAAPAAgEQkAAOUDACCCAgAA4wMAMIMCAAA-ABCEAgAA4wMAMIUCAQC_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_ACAnAACEAQAgAQAAADwAIAEAAAA6ACAFBgAAwgUAICwAAMQFACAtAADDBQAgywIAAIwEACDMAgAAjAQAIAuCAgAAxwMAMIMCAACNAQAQhAIAAMcDADCFAgEAjwMAIYgCQACRAwAhiQIBAI8DACGdAkAAkQMAIcACQACRAwAhygIBAI8DACHLAgEAnAMAIcwCAQCcAwAhAwAAADoAIAEAAIwBADArAACNAQAgAwAAADoAIAEAADsAMAIAADwAIAEAAABAACABAAAAQAAgAwAAAD4AIAEAAD8AMAIAAEAAIAMAAAA-ACABAAA_ADACAABAACADAAAAPgAgAQAAPwAwAgAAQAAgDgkAAMEFACCFAgEAAAABiAJAAAAAAYkCAQAAAAGdAkAAAAABwQIBAAAAAcICAQAAAAHDAgEAAAABxAIBAAAAAcUCAQAAAAHGAkAAAAABxwJAAAAAAcgCAQAAAAHJAgEAAAABAR8AAJUBACANhQIBAAAAAYgCQAAAAAGJAgEAAAABnQJAAAAAAcECAQAAAAHCAgEAAAABwwIBAAAAAcQCAQAAAAHFAgEAAAABxgJAAAAAAccCQAAAAAHIAgEAAAAByQIBAAAAAQEfAACXAQAwAR8AAJcBADAOCQAAwAUAIIUCAQCFBAAhiAJAAIcEACGJAgEAhQQAIZ0CQACHBAAhwQIBAIUEACHCAgEAhQQAIcMCAQCUBAAhxAIBAJQEACHFAgEAlAQAIcYCQACWBAAhxwJAAJYEACHIAgEAlAQAIckCAQCUBAAhAgAAAEAAIB8AAJoBACANhQIBAIUEACGIAkAAhwQAIYkCAQCFBAAhnQJAAIcEACHBAgEAhQQAIcICAQCFBAAhwwIBAJQEACHEAgEAlAQAIcUCAQCUBAAhxgJAAJYEACHHAkAAlgQAIcgCAQCUBAAhyQIBAJQEACECAAAAPgAgHwAAnAEAIAIAAAA-ACAfAACcAQAgAwAAAEAAICYAAJUBACAnAACaAQAgAQAAAEAAIAEAAAA-ACAKBgAAvQUAICwAAL8FACAtAAC-BQAgwwIAAIwEACDEAgAAjAQAIMUCAACMBAAgxgIAAIwEACDHAgAAjAQAIMgCAACMBAAgyQIAAIwEACAQggIAAMYDADCDAgAAowEAEIQCAADGAwAwhQIBAI8DACGIAkAAkQMAIYkCAQCPAwAhnQJAAJEDACHBAgEAjwMAIcICAQCPAwAhwwIBAJwDACHEAgEAnAMAIcUCAQCcAwAhxgJAAJ4DACHHAkAAngMAIcgCAQCcAwAhyQIBAJwDACEDAAAAPgAgAQAAogEAMCsAAKMBACADAAAAPgAgAQAAPwAwAgAAQAAgCYICAADFAwAwgwIAAKkBABCEAgAAxQMAMIUCAQAAAAGIAkAAwQMAIZ0CQADBAwAhvgIBAL8DACG_AgEAvwMAIcACQADBAwAhAQAAAKYBACABAAAApgEAIAmCAgAAxQMAMIMCAACpAQAQhAIAAMUDADCFAgEAvwMAIYgCQADBAwAhnQJAAMEDACG-AgEAvwMAIb8CAQC_AwAhwAJAAMEDACEAAwAAAKkBACABAACqAQAwAgAApgEAIAMAAACpAQAgAQAAqgEAMAIAAKYBACADAAAAqQEAIAEAAKoBADACAACmAQAgBoUCAQAAAAGIAkAAAAABnQJAAAAAAb4CAQAAAAG_AgEAAAABwAJAAAAAAQEfAACuAQAgBoUCAQAAAAGIAkAAAAABnQJAAAAAAb4CAQAAAAG_AgEAAAABwAJAAAAAAQEfAACwAQAwAR8AALABADAGhQIBAIUEACGIAkAAhwQAIZ0CQACHBAAhvgIBAIUEACG_AgEAhQQAIcACQACHBAAhAgAAAKYBACAfAACzAQAgBoUCAQCFBAAhiAJAAIcEACGdAkAAhwQAIb4CAQCFBAAhvwIBAIUEACHAAkAAhwQAIQIAAACpAQAgHwAAtQEAIAIAAACpAQAgHwAAtQEAIAMAAACmAQAgJgAArgEAICcAALMBACABAAAApgEAIAEAAACpAQAgAwYAALoFACAsAAC8BQAgLQAAuwUAIAmCAgAAxAMAMIMCAAC8AQAQhAIAAMQDADCFAgEAjwMAIYgCQACRAwAhnQJAAJEDACG-AgEAjwMAIb8CAQCPAwAhwAJAAJEDACEDAAAAqQEAIAEAALsBADArAAC8AQAgAwAAAKkBACABAACqAQAwAgAApgEAIAEAAAAlACABAAAAJQAgAwAAACMAIAEAACQAMAIAACUAIAMAAAAjACABAAAkADACAAAlACADAAAAIwAgAQAAJAAwAgAAJQAgBgQAALkFACAJAAC8BAAghQIBAAAAAYgCQAAAAAGJAgEAAAABigIBAAAAAQEfAADEAQAgBIUCAQAAAAGIAkAAAAABiQIBAAAAAYoCAQAAAAEBHwAAxgEAMAEfAADGAQAwBgQAALgFACAJAAC6BAAghQIBAIUEACGIAkAAhwQAIYkCAQCFBAAhigIBAIUEACECAAAAJQAgHwAAyQEAIASFAgEAhQQAIYgCQACHBAAhiQIBAIUEACGKAgEAhQQAIQIAAAAjACAfAADLAQAgAgAAACMAIB8AAMsBACADAAAAJQAgJgAAxAEAICcAAMkBACABAAAAJQAgAQAAACMAIAMGAAC1BQAgLAAAtwUAIC0AALYFACAHggIAAMMDADCDAgAA0gEAEIQCAADDAwAwhQIBAI8DACGIAkAAkQMAIYkCAQCPAwAhigIBAI8DACEDAAAAIwAgAQAA0QEAMCsAANIBACADAAAAIwAgAQAAJAAwAgAAJQAgCgUAAMIDACCCAgAAvgMAMIMCAADYAQAQhAIAAL4DADCFAgEAAAABiAJAAMEDACGdAkAAwQMAIaUCAQDAAwAhuQIBAAAAAboCAQAAAAEBAAAA1QEAIAEAAADVAQAgCgUAAMIDACCCAgAAvgMAMIMCAADYAQAQhAIAAL4DADCFAgEAvwMAIYgCQADBAwAhnQJAAMEDACGlAgEAwAMAIbkCAQC_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_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_AwAhugIBAL8DACELiwIBAAAAAYwCAQAAAASNAgEAAAAEjgIBAAAAAY8CAQAAAAGQAgEAAAABkQIBAAAAAZICAQCYAwAhkwIBAAAAAZQCAQAAAAGVAgEAAAABC4sCAQAAAAGMAgEAAAAFjQIBAAAABY4CAQAAAAGPAgEAAAABkAIBAAAAAZECAQAAAAGSAgEApQMAIZMCAQAAAAGUAgEAAAABlQIBAAAAAQiLAkAAAAABjAJAAAAABI0CQAAAAASOAkAAAAABjwJAAAAAAZACQAAAAAGRAkAAAAABkgJAAJQDACEDuwIAAAcAILwCAAAHACC9AgAABwAgB4ICAADDAwAwgwIAANIBABCEAgAAwwMAMIUCAQCPAwAhiAJAAJEDACGJAgEAjwMAIYoCAQCPAwAhCYICAADEAwAwgwIAALwBABCEAgAAxAMAMIUCAQCPAwAhiAJAAJEDACGdAkAAkQMAIb4CAQCPAwAhvwIBAI8DACHAAkAAkQMAIQmCAgAAxQMAMIMCAACpAQAQhAIAAMUDADCFAgEAvwMAIYgCQADBAwAhnQJAAMEDACG-AgEAvwMAIb8CAQC_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-ABCEAgAA4wMAMIUCAQC_AwAhiAJAAMEDACGJAgEAvwMAIZ0CQADBAwAhwQIBAL8DACHCAgEAvwMAIcMCAQDAAwAhxAIBAMADACHFAgEAwAMAIcYCQADkAwAhxwJAAOQDACHIAgEAwAMAIckCAQDAAwAhCIsCQAAAAAGMAkAAAAAFjQJAAAAABY4CQAAAAAGPAkAAAAABkAJAAAAAAZECQAAAAAGSAkAAoQMAIRsFAADTAwAgCgAA1AMAIBEAANUDACASAADWAwAgEwAA1wMAIBQAANgDACAVAADZAwAgFgAA2QMAIBcAANoDACAYAADbAwAgGQAA3AMAIIICAADPAwAwgwIAABsAEIQCAADPAwAwhQIBAL8DACGIAkAAwQMAIZ0CQADBAwAhngIBAL8DACG5AgEAvwMAIc0CIADQAwAhzgIBAMADACHQAgAA0QPQAiLSAgAA0gPSAiLTAgEAwAMAIdQCAQDAAwAh4AIAABsAIOECAAAbACAMCQAA5QMAIIICAADmAwAwgwIAADoAEIQCAADmAwAwhQIBAL8DACGIAkAAwQMAIYkCAQC_AwAhnQJAAMEDACHAAkAAwQMAIcoCAQC_AwAhywIBAMADACHMAgEAwAMAIQsJAADlAwAgggIAAOcDADCDAgAANwAQhAIAAOcDADCFAgEAvwMAIYgCQADBAwAhiQIBAL8DACHLAgEAwAMAIcwCAQDAAwAh1gIAAOgD1gIi1wIAAOkDACAEiwIAAADWAgKMAgAAANYCCI0CAAAA1gIIkgIAAOID1gIiDIsCgAAAAAGOAoAAAAABjwKAAAAAAZACgAAAAAGRAoAAAAABkgKAAAAAAdgCAQAAAAHZAgEAAAAB2gIBAAAAAdsCgAAAAAHcAoAAAAAB3QKAAAAAAQoJAADrAwAgggIAAOoDADCDAgAAMAAQhAIAAOoDADCFAgEAvwMAIYkCAQDAAwAhngIBAL8DACGfAiAA0AMAIaACQADBAwAhoQJAAOQDACEbBQAA0wMAIAoAANQDACARAADVAwAgEgAA1gMAIBMAANcDACAUAADYAwAgFQAA2QMAIBYAANkDACAXAADaAwAgGAAA2wMAIBkAANwDACCCAgAAzwMAMIMCAAAbABCEAgAAzwMAMIUCAQC_AwAhiAJAAMEDACGdAkAAwQMAIZ4CAQC_AwAhuQIBAL8DACHNAiAA0AMAIc4CAQDAAwAh0AIAANED0AIi0gIAANID0gIi0wIBAMADACHUAgEAwAMAIeACAAAbACDhAgAAGwAgAokCAQAAAAGKAgEAAAABCQQAAO4DACAJAADlAwAgggIAAO0DADCDAgAAIwAQhAIAAO0DADCFAgEAvwMAIYgCQADBAwAhiQIBAL8DACGKAgEAvwMAIRsDAADlAwAgCAAAwgMAIAoAANQDACARAADVAwAgEgAA1gMAIBMAANcDACCCAgAA_gMAMIMCAAADABCEAgAA_gMAMIUCAQC_AwAhiAJAAMEDACGYAgAA_wOoAiKdAkAAwQMAIaICAQC_AwAhowIBAL8DACGkAgEAvwMAIaUCAQC_AwAhpgIBAMADACGoAiAA0AMAIakCCACABAAhqgIBAMADACGrAgIAgQQAIawCQADkAwAhrQJAAOQDACGuAgEAvwMAIeACAAADACDhAgAAAwAgDwQAAO4DACAJAADlAwAgggIAAO8DADCDAgAAHwAQhAIAAO8DADCFAgEAvwMAIYgCQADBAwAhiQIBAL8DACGKAgEAvwMAIZYCCADwAwAhmAIAAPEDmAIimQIBAMADACGbAgAA8gObAiKcAkAA5AMAIZ0CQADBAwAhCIsCCAAAAAGMAggAAAAEjQIIAAAABI4CCAAAAAGPAggAAAABkAIIAAAAAZECCAAAAAGSAggAqQMAIQSLAgAAAJgCAowCAAAAmAIIjQIAAACYAgiSAgAApwOYAiIEiwIAAACbAgKMAgAAAJsCCI0CAAAAmwIIkgIAAKMDmwIiDg0AAPUDACAOAADlAwAgDwAA6wMAIIICAADzAwAwgwIAABcAEIQCAADzAwAwhQIBAL8DACGIAkAAwQMAIZgCAAD0A7ECIq8CAQC_AwAhsQJAAOQDACGyAgEAvwMAIbMCAQC_AwAhtAIBAMADACEEiwIAAACxAgKMAgAAALECCI0CAAAAsQIIkgIAALoDsQIiEgQAAO4DACAJAADlAwAgCwAA9wMAIAwAANUDACAQAADZAwAgggIAAPYDADCDAgAAEQAQhAIAAPYDADCFAgEAvwMAIYgCQADBAwAhiQIBAL8DACGKAgEAvwMAIZ0CQADBAwAhtQIBAL8DACG2AiAA0AMAIbcCAQDAAwAh4AIAABEAIOECAAARACAQBAAA7gMAIAkAAOUDACALAAD3AwAgDAAA1QMAIBAAANkDACCCAgAA9gMAMIMCAAARABCEAgAA9gMAMIUCAQC_AwAhiAJAAMEDACGJAgEAvwMAIYoCAQC_AwAhnQJAAMEDACG1AgEAvwMAIbYCIADQAwAhtwIBAMADACESBAAA7gMAIAkAAOUDACALAAD3AwAgDAAA1QMAIBAAANkDACCCAgAA9gMAMIMCAAARABCEAgAA9gMAMIUCAQC_AwAhiAJAAMEDACGJAgEAvwMAIYoCAQC_AwAhnQJAAMEDACG1AgEAvwMAIbYCIADQAwAhtwIBAMADACHgAgAAEQAg4QIAABEAIAKJAgEAAAABigIBAAAAAQoEAADuAwAgCQAA5QMAIIICAAD5AwAwgwIAAA0AEIQCAAD5AwAwhQIBAL8DACGHAgAA-gOHAiKIAkAAwQMAIYkCAQC_AwAhigIBAL8DACEEiwIAAACHAgKMAgAAAIcCCI0CAAAAhwIIkgIAAJYDhwIiAooCAQAAAAG4AgEAAAABCQQAAO4DACAHAAD9AwAgggIAAPwDADCDAgAABwAQhAIAAPwDADCFAgEAvwMAIYgCQADBAwAhigIBAL8DACG4AgEAvwMAIQwFAADCAwAgggIAAL4DADCDAgAA2AEAEIQCAAC-AwAwhQIBAL8DACGIAkAAwQMAIZ0CQADBAwAhpQIBAMADACG5AgEAvwMAIboCAQC_AwAh4AIAANgBACDhAgAA2AEAIBkDAADlAwAgCAAAwgMAIAoAANQDACARAADVAwAgEgAA1gMAIBMAANcDACCCAgAA_gMAMIMCAAADABCEAgAA_gMAMIUCAQC_AwAhiAJAAMEDACGYAgAA_wOoAiKdAkAAwQMAIaICAQC_AwAhowIBAL8DACGkAgEAvwMAIaUCAQC_AwAhpgIBAMADACGoAiAA0AMAIakCCACABAAhqgIBAMADACGrAgIAgQQAIawCQADkAwAhrQJAAOQDACGuAgEAvwMAIQSLAgAAAKgCAowCAAAAqAIIjQIAAACoAgiSAgAAtgOoAiIIiwIIAAAAAYwCCAAAAAWNAggAAAAFjgIIAAAAAY8CCAAAAAGQAggAAAABkQIIAAAAAZICCAC0AwAhCIsCAgAAAAGMAgIAAAAEjQICAAAABI4CAgAAAAGPAgIAAAABkAICAAAAAZECAgAAAAGSAgIAkwMAIQAAAAHlAgEAAAABAeUCAAAAhwICAeUCQAAAAAEFJgAA0gcAICcAANgHACDiAgAA0wcAIOMCAADXBwAg6AIAAGIAIAUmAADQBwAgJwAA1QcAIOICAADRBwAg4wIAANQHACDoAgAABQAgAyYAANIHACDiAgAA0wcAIOgCAABiACADJgAA0AcAIOICAADRBwAg6AIAAAUAIAAAAAAAAAXlAggAAAAB6wIIAAAAAewCCAAAAAHtAggAAAAB7gIIAAAAAQHlAgAAAJgCAgHlAgEAAAABAeUCAAAAmwICAeUCQAAAAAEFJgAAyAcAICcAAM4HACDiAgAAyQcAIOMCAADNBwAg6AIAAGIAIAUmAADGBwAgJwAAywcAIOICAADHBwAg4wIAAMoHACDoAgAABQAgAyYAAMgHACDiAgAAyQcAIOgCAABiACADJgAAxgcAIOICAADHBwAg6AIAAAUAIAAAAAHlAiAAAAABByYAAMEHACAnAADEBwAg4gIAAMIHACDjAgAAwwcAIOYCAAAbACDnAgAAGwAg6AIAAGIAIAMmAADBBwAg4gIAAMIHACDoAgAAYgAgAAAAAAAB5QIAAACoAgIF5QIIAAAAAesCCAAAAAHsAggAAAAB7QIIAAAAAe4CCAAAAAEF5QICAAAAAesCAgAAAAHsAgIAAAAB7QICAAAAAe4CAgAAAAEFJgAAkgcAICcAAL8HACDiAgAAkwcAIOMCAAC-BwAg6AIAAGIAIAsmAACFBQAwJwAAigUAMOICAACGBQAw4wIAAIcFADDkAgAAiAUAIOUCAACJBQAw5gIAAIkFADDnAgAAiQUAMOgCAACJBQAw6QIAAIsFADDqAgAAjAUAMAsmAAD5BAAwJwAA_gQAMOICAAD6BAAw4wIAAPsEADDkAgAA_AQAIOUCAAD9BAAw5gIAAP0EADDnAgAA_QQAMOgCAAD9BAAw6QIAAP8EADDqAgAAgAUAMAsmAADJBAAwJwAAzgQAMOICAADKBAAw4wIAAMsEADDkAgAAzAQAIOUCAADNBAAw5gIAAM0EADDnAgAAzQQAMOgCAADNBAAw6QIAAM8EADDqAgAA0AQAMAsmAAC9BAAwJwAAwgQAMOICAAC-BAAw4wIAAL8EADDkAgAAwAQAIOUCAADBBAAw5gIAAMEEADDnAgAAwQQAMOgCAADBBAAw6QIAAMMEADDqAgAAxAQAMAsmAACvBAAwJwAAtAQAMOICAACwBAAw4wIAALEEADDkAgAAsgQAIOUCAACzBAAw5gIAALMEADDnAgAAswQAMOgCAACzBAAw6QIAALUEADDqAgAAtgQAMAQJAAC8BAAghQIBAAAAAYgCQAAAAAGJAgEAAAABAgAAACUAICYAALsEACADAAAAJQAgJgAAuwQAICcAALkEACABHwAAvQcAMAoEAADuAwAgCQAA5QMAIIICAADtAwAwgwIAACMAEIQCAADtAwAwhQIBAAAAAYgCQADBAwAhiQIBAL8DACGKAgEAvwMAId4CAADsAwAgAgAAACUAIB8AALkEACACAAAAtwQAIB8AALgEACAHggIAALYEADCDAgAAtwQAEIQCAAC2BAAwhQIBAL8DACGIAkAAwQMAIYkCAQC_AwAhigIBAL8DACEHggIAALYEADCDAgAAtwQAEIQCAAC2BAAwhQIBAL8DACGIAkAAwQMAIYkCAQC_AwAhigIBAL8DACEDhQIBAIUEACGIAkAAhwQAIYkCAQCFBAAhBAkAALoEACCFAgEAhQQAIYgCQACHBAAhiQIBAIUEACEFJgAAuAcAICcAALsHACDiAgAAuQcAIOMCAAC6BwAg6AIAAGIAIAQJAAC8BAAghQIBAAAAAYgCQAAAAAGJAgEAAAABAyYAALgHACDiAgAAuQcAIOgCAABiACAKCQAAmQQAIIUCAQAAAAGIAkAAAAABiQIBAAAAAZYCCAAAAAGYAgAAAJgCApkCAQAAAAGbAgAAAJsCApwCQAAAAAGdAkAAAAABAgAAACEAICYAAMgEACADAAAAIQAgJgAAyAQAICcAAMcEACABHwAAtwcAMA8EAADuAwAgCQAA5QMAIIICAADvAwAwgwIAAB8AEIQCAADvAwAwhQIBAAAAAYgCQADBAwAhiQIBAL8DACGKAgEAvwMAIZYCCADwAwAhmAIAAPEDmAIimQIBAAAAAZsCAADyA5sCIpwCQADkAwAhnQJAAMEDACECAAAAIQAgHwAAxwQAIAIAAADFBAAgHwAAxgQAIA2CAgAAxAQAMIMCAADFBAAQhAIAAMQEADCFAgEAvwMAIYgCQADBAwAhiQIBAL8DACGKAgEAvwMAIZYCCADwAwAhmAIAAPEDmAIimQIBAMADACGbAgAA8gObAiKcAkAA5AMAIZ0CQADBAwAhDYICAADEBAAwgwIAAMUEABCEAgAAxAQAMIUCAQC_AwAhiAJAAMEDACGJAgEAvwMAIYoCAQC_AwAhlgIIAPADACGYAgAA8QOYAiKZAgEAwAMAIZsCAADyA5sCIpwCQADkAwAhnQJAAMEDACEJhQIBAIUEACGIAkAAhwQAIYkCAQCFBAAhlgIIAJIEACGYAgAAkwSYAiKZAgEAlAQAIZsCAACVBJsCIpwCQACWBAAhnQJAAIcEACEKCQAAlwQAIIUCAQCFBAAhiAJAAIcEACGJAgEAhQQAIZYCCACSBAAhmAIAAJMEmAIimQIBAJQEACGbAgAAlQSbAiKcAkAAlgQAIZ0CQACHBAAhCgkAAJkEACCFAgEAAAABiAJAAAAAAYkCAQAAAAGWAggAAAABmAIAAACYAgKZAgEAAAABmwIAAACbAgKcAkAAAAABnQJAAAAAAQsJAADzBAAgCwAA-AQAIAwAAPUEACAQAAD2BAAghQIBAAAAAYgCQAAAAAGJAgEAAAABnQJAAAAAAbUCAQAAAAG2AiAAAAABtwIBAAAAAQIAAAATACAmAAD3BAAgAwAAABMAICYAAPcEACAnAADTBAAgAR8AALYHADAQBAAA7gMAIAkAAOUDACALAAD3AwAgDAAA1QMAIBAAANkDACCCAgAA9gMAMIMCAAARABCEAgAA9gMAMIUCAQAAAAGIAkAAwQMAIYkCAQC_AwAhigIBAL8DACGdAkAAwQMAIbUCAQC_AwAhtgIgANADACG3AgEAwAMAIQIAAAATACAfAADTBAAgAgAAANEEACAfAADSBAAgC4ICAADQBAAwgwIAANEEABCEAgAA0AQAMIUCAQC_AwAhiAJAAMEDACGJAgEAvwMAIYoCAQC_AwAhnQJAAMEDACG1AgEAvwMAIbYCIADQAwAhtwIBAMADACELggIAANAEADCDAgAA0QQAEIQCAADQBAAwhQIBAL8DACGIAkAAwQMAIYkCAQC_AwAhigIBAL8DACGdAkAAwQMAIbUCAQC_AwAhtgIgANADACG3AgEAwAMAIQeFAgEAhQQAIYgCQACHBAAhiQIBAIUEACGdAkAAhwQAIbUCAQCFBAAhtgIgAJ4EACG3AgEAlAQAIQsJAADUBAAgCwAA1QQAIAwAANYEACAQAADXBAAghQIBAIUEACGIAkAAhwQAIYkCAQCFBAAhnQJAAIcEACG1AgEAhQQAIbYCIACeBAAhtwIBAJQEACEFJgAAnwcAICcAALQHACDiAgAAoAcAIOMCAACzBwAg6AIAAGIAIAcmAACbBwAgJwAAsQcAIOICAACcBwAg4wIAALAHACDmAgAAEQAg5wIAABEAIOgCAAATACALJgAA6QQAMCcAAO0EADDiAgAA6gQAMOMCAADrBAAw5AIAAOwEACDlAgAAzQQAMOYCAADNBAAw5wIAAM0EADDoAgAAzQQAMOkCAADuBAAw6gIAANAEADALJgAA2AQAMCcAAN0EADDiAgAA2QQAMOMCAADaBAAw5AIAANsEACDlAgAA3AQAMOYCAADcBAAw5wIAANwEADDoAgAA3AQAMOkCAADeBAAw6gIAAN8EADAJDgAA5wQAIA8AAOgEACCFAgEAAAABiAJAAAAAAZgCAAAAsQICrwIBAAAAAbECQAAAAAGzAgEAAAABtAIBAAAAAQIAAAAZACAmAADmBAAgAwAAABkAICYAAOYEACAnAADjBAAgAR8AAK8HADAODQAA9QMAIA4AAOUDACAPAADrAwAgggIAAPMDADCDAgAAFwAQhAIAAPMDADCFAgEAAAABiAJAAMEDACGYAgAA9AOxAiKvAgEAvwMAIbECQADkAwAhsgIBAL8DACGzAgEAvwMAIbQCAQDAAwAhAgAAABkAIB8AAOMEACACAAAA4AQAIB8AAOEEACALggIAAN8EADCDAgAA4AQAEIQCAADfBAAwhQIBAL8DACGIAkAAwQMAIZgCAAD0A7ECIq8CAQC_AwAhsQJAAOQDACGyAgEAvwMAIbMCAQC_AwAhtAIBAMADACELggIAAN8EADCDAgAA4AQAEIQCAADfBAAwhQIBAL8DACGIAkAAwQMAIZgCAAD0A7ECIq8CAQC_AwAhsQJAAOQDACGyAgEAvwMAIbMCAQC_AwAhtAIBAMADACEHhQIBAIUEACGIAkAAhwQAIZgCAADiBLECIq8CAQCFBAAhsQJAAJYEACGzAgEAhQQAIbQCAQCUBAAhAeUCAAAAsQICCQ4AAOQEACAPAADlBAAghQIBAIUEACGIAkAAhwQAIZgCAADiBLECIq8CAQCFBAAhsQJAAJYEACGzAgEAhQQAIbQCAQCUBAAhBSYAAKcHACAnAACtBwAg4gIAAKgHACDjAgAArAcAIOgCAABiACAHJgAApQcAICcAAKoHACDiAgAApgcAIOMCAACpBwAg5gIAABsAIOcCAAAbACDoAgAAYgAgCQ4AAOcEACAPAADoBAAghQIBAAAAAYgCQAAAAAGYAgAAALECAq8CAQAAAAGxAkAAAAABswIBAAAAAbQCAQAAAAEDJgAApwcAIOICAACoBwAg6AIAAGIAIAMmAAClBwAg4gIAAKYHACDoAgAAYgAgCwQAAPQEACAJAADzBAAgDAAA9QQAIBAAAPYEACCFAgEAAAABiAJAAAAAAYkCAQAAAAGKAgEAAAABnQJAAAAAAbUCAQAAAAG2AiAAAAABAgAAABMAICYAAPIEACADAAAAEwAgJgAA8gQAICcAAPAEACABHwAApAcAMAIAAAATACAfAADwBAAgAgAAANEEACAfAADvBAAgB4UCAQCFBAAhiAJAAIcEACGJAgEAhQQAIYoCAQCFBAAhnQJAAIcEACG1AgEAhQQAIbYCIACeBAAhCwQAAPEEACAJAADUBAAgDAAA1gQAIBAAANcEACCFAgEAhQQAIYgCQACHBAAhiQIBAIUEACGKAgEAhQQAIZ0CQACHBAAhtQIBAIUEACG2AiAAngQAIQUmAACdBwAgJwAAogcAIOICAACeBwAg4wIAAKEHACDoAgAABQAgCwQAAPQEACAJAADzBAAgDAAA9QQAIBAAAPYEACCFAgEAAAABiAJAAAAAAYkCAQAAAAGKAgEAAAABnQJAAAAAAbUCAQAAAAG2AiAAAAABAyYAAJ8HACDiAgAAoAcAIOgCAABiACADJgAAnQcAIOICAACeBwAg6AIAAAUAIAQmAADpBAAw4gIAAOoEADDkAgAA7AQAIOgCAADNBAAwBCYAANgEADDiAgAA2QQAMOQCAADbBAAg6AIAANwEADALCQAA8wQAIAsAAPgEACAMAAD1BAAgEAAA9gQAIIUCAQAAAAGIAkAAAAABiQIBAAAAAZ0CQAAAAAG1AgEAAAABtgIgAAAAAbcCAQAAAAEDJgAAmwcAIOICAACcBwAg6AIAABMAIAUJAACKBAAghQIBAAAAAYcCAAAAhwICiAJAAAAAAYkCAQAAAAECAAAADwAgJgAAhAUAIAMAAAAPACAmAACEBQAgJwAAgwUAIAEfAACaBwAwCwQAAO4DACAJAADlAwAgggIAAPkDADCDAgAADQAQhAIAAPkDADCFAgEAAAABhwIAAPoDhwIiiAJAAMEDACGJAgEAvwMAIYoCAQC_AwAh3gIAAPgDACACAAAADwAgHwAAgwUAIAIAAACBBQAgHwAAggUAIAiCAgAAgAUAMIMCAACBBQAQhAIAAIAFADCFAgEAvwMAIYcCAAD6A4cCIogCQADBAwAhiQIBAL8DACGKAgEAvwMAIQiCAgAAgAUAMIMCAACBBQAQhAIAAIAFADCFAgEAvwMAIYcCAAD6A4cCIogCQADBAwAhiQIBAL8DACGKAgEAvwMAIQSFAgEAhQQAIYcCAACGBIcCIogCQACHBAAhiQIBAIUEACEFCQAAiAQAIIUCAQCFBAAhhwIAAIYEhwIiiAJAAIcEACGJAgEAhQQAIQUJAACKBAAghQIBAAAAAYcCAAAAhwICiAJAAAAAAYkCAQAAAAEEBwAAkgUAIIUCAQAAAAGIAkAAAAABuAIBAAAAAQIAAAAJACAmAACRBQAgAwAAAAkAICYAAJEFACAnAACPBQAgAR8AAJkHADAKBAAA7gMAIAcAAP0DACCCAgAA_AMAMIMCAAAHABCEAgAA_AMAMIUCAQAAAAGIAkAAwQMAIYoCAQC_AwAhuAIBAL8DACHfAgAA-wMAIAIAAAAJACAfAACPBQAgAgAAAI0FACAfAACOBQAgB4ICAACMBQAwgwIAAI0FABCEAgAAjAUAMIUCAQC_AwAhiAJAAMEDACGKAgEAvwMAIbgCAQC_AwAhB4ICAACMBQAwgwIAAI0FABCEAgAAjAUAMIUCAQC_AwAhiAJAAMEDACGKAgEAvwMAIbgCAQC_AwAhA4UCAQCFBAAhiAJAAIcEACG4AgEAhQQAIQQHAACQBQAghQIBAIUEACGIAkAAhwQAIbgCAQCFBAAhBSYAAJQHACAnAACXBwAg4gIAAJUHACDjAgAAlgcAIOgCAADVAQAgBAcAAJIFACCFAgEAAAABiAJAAAAAAbgCAQAAAAEDJgAAlAcAIOICAACVBwAg6AIAANUBACADJgAAkgcAIOICAACTBwAg6AIAAGIAIAQmAACFBQAw4gIAAIYFADDkAgAAiAUAIOgCAACJBQAwBCYAAPkEADDiAgAA-gQAMOQCAAD8BAAg6AIAAP0EADAEJgAAyQQAMOICAADKBAAw5AIAAMwEACDoAgAAzQQAMAQmAAC9BAAw4gIAAL4EADDkAgAAwAQAIOgCAADBBAAwBCYAAK8EADDiAgAAsAQAMOQCAACyBAAg6AIAALMEADAAAAAFJgAAjQcAICcAAJAHACDiAgAAjgcAIOMCAACPBwAg6AIAABMAIAMmAACNBwAg4gIAAI4HACDoAgAAEwAgAAAAAAAABSYAAIgHACAnAACLBwAg4gIAAIkHACDjAgAAigcAIOgCAAAFACADJgAAiAcAIOICAACJBwAg6AIAAAUAIAAAAAsmAACqBQAwJwAArgUAMOICAACrBQAw4wIAAKwFADDkAgAArQUAIOUCAACJBQAw5gIAAIkFADDnAgAAiQUAMOgCAACJBQAw6QIAAK8FADDqAgAAjAUAMAQEAAClBQAghQIBAAAAAYgCQAAAAAGKAgEAAAABAgAAAAkAICYAALIFACADAAAACQAgJgAAsgUAICcAALEFACABHwAAhwcAMAIAAAAJACAfAACxBQAgAgAAAI0FACAfAACwBQAgA4UCAQCFBAAhiAJAAIcEACGKAgEAhQQAIQQEAACkBQAghQIBAIUEACGIAkAAhwQAIYoCAQCFBAAhBAQAAKUFACCFAgEAAAABiAJAAAAAAYoCAQAAAAEEJgAAqgUAMOICAACrBQAw5AIAAK0FACDoAgAAiQUAMAAAAAAFJgAAggcAICcAAIUHACDiAgAAgwcAIOMCAACEBwAg6AIAAAUAIAMmAACCBwAg4gIAAIMHACDoAgAABQAgAAAAAAAABSYAAP0GACAnAACABwAg4gIAAP4GACDjAgAA_wYAIOgCAABiACADJgAA_QYAIOICAAD-BgAg6AIAAGIAIAAAAAUmAAD4BgAgJwAA-wYAIOICAAD5BgAg4wIAAPoGACDoAgAAYgAgAyYAAPgGACDiAgAA-QYAIOgCAABiACAAAAAB5QIAAADQAgIB5QIAAADSAgILJgAAvgYAMCcAAMMGADDiAgAAvwYAMOMCAADABgAw5AIAAMEGACDlAgAAwgYAMOYCAADCBgAw5wIAAMIGADDoAgAAwgYAMOkCAADEBgAw6gIAAMUGADALJgAAtQYAMCcAALkGADDiAgAAtgYAMOMCAAC3BgAw5AIAALgGACDlAgAA_QQAMOYCAAD9BAAw5wIAAP0EADDoAgAA_QQAMOkCAAC6BgAw6gIAAIAFADALJgAArAYAMCcAALAGADDiAgAArQYAMOMCAACuBgAw5AIAAK8GACDlAgAAzQQAMOYCAADNBAAw5wIAAM0EADDoAgAAzQQAMOkCAACxBgAw6gIAANAEADALJgAAowYAMCcAAKcGADDiAgAApAYAMOMCAAClBgAw5AIAAKYGACDlAgAAwQQAMOYCAADBBAAw5wIAAMEEADDoAgAAwQQAMOkCAACoBgAw6gIAAMQEADALJgAAmgYAMCcAAJ4GADDiAgAAmwYAMOMCAACcBgAw5AIAAJ0GACDlAgAAswQAMOYCAACzBAAw5wIAALMEADDoAgAAswQAMOkCAACfBgAw6gIAALYEADALJgAAjgYAMCcAAJMGADDiAgAAjwYAMOMCAACQBgAw5AIAAJEGACDlAgAAkgYAMOYCAACSBgAw5wIAAJIGADDoAgAAkgYAMOkCAACUBgAw6gIAAJUGADALJgAAhQYAMCcAAIkGADDiAgAAhgYAMOMCAACHBgAw5AIAAIgGACDlAgAA3AQAMOYCAADcBAAw5wIAANwEADDoAgAA3AQAMOkCAACKBgAw6gIAAN8EADALJgAA_AUAMCcAAIAGADDiAgAA_QUAMOMCAAD-BQAw5AIAAP8FACDlAgAA3AQAMOYCAADcBAAw5wIAANwEADDoAgAA3AQAMOkCAACBBgAw6gIAAN8EADALJgAA7wUAMCcAAPQFADDiAgAA8AUAMOMCAADxBQAw5AIAAPIFACDlAgAA8wUAMOYCAADzBQAw5wIAAPMFADDoAgAA8wUAMOkCAAD1BQAw6gIAAPYFADALJgAA4wUAMCcAAOgFADDiAgAA5AUAMOMCAADlBQAw5AIAAOYFACDlAgAA5wUAMOYCAADnBQAw5wIAAOcFADDoAgAA5wUAMOkCAADpBQAw6gIAAOoFADALJgAA1wUAMCcAANwFADDiAgAA2AUAMOMCAADZBQAw5AIAANoFACDlAgAA2wUAMOYCAADbBQAw5wIAANsFADDoAgAA2wUAMOkCAADdBQAw6gIAAN4FADAMhQIBAAAAAYgCQAAAAAGdAkAAAAABwQIBAAAAAcICAQAAAAHDAgEAAAABxAIBAAAAAcUCAQAAAAHGAkAAAAABxwJAAAAAAcgCAQAAAAHJAgEAAAABAgAAAEAAICYAAOIFACADAAAAQAAgJgAA4gUAICcAAOEFACABHwAA9wYAMBEJAADlAwAgggIAAOMDADCDAgAAPgAQhAIAAOMDADCFAgEAAAABiAJAAMEDACGJAgEAvwMAIZ0CQADBAwAhwQIBAL8DACHCAgEAvwMAIcMCAQDAAwAhxAIBAMADACHFAgEAwAMAIcYCQADkAwAhxwJAAOQDACHIAgEAwAMAIckCAQDAAwAhAgAAAEAAIB8AAOEFACACAAAA3wUAIB8AAOAFACAQggIAAN4FADCDAgAA3wUAEIQCAADeBQAwhQIBAL8DACGIAkAAwQMAIYkCAQC_AwAhnQJAAMEDACHBAgEAvwMAIcICAQC_AwAhwwIBAMADACHEAgEAwAMAIcUCAQDAAwAhxgJAAOQDACHHAkAA5AMAIcgCAQDAAwAhyQIBAMADACEQggIAAN4FADCDAgAA3wUAEIQCAADeBQAwhQIBAL8DACGIAkAAwQMAIYkCAQC_AwAhnQJAAMEDACHBAgEAvwMAIcICAQC_AwAhwwIBAMADACHEAgEAwAMAIcUCAQDAAwAhxgJAAOQDACHHAkAA5AMAIcgCAQDAAwAhyQIBAMADACEMhQIBAIUEACGIAkAAhwQAIZ0CQACHBAAhwQIBAIUEACHCAgEAhQQAIcMCAQCUBAAhxAIBAJQEACHFAgEAlAQAIcYCQACWBAAhxwJAAJYEACHIAgEAlAQAIckCAQCUBAAhDIUCAQCFBAAhiAJAAIcEACGdAkAAhwQAIcECAQCFBAAhwgIBAIUEACHDAgEAlAQAIcQCAQCUBAAhxQIBAJQEACHGAkAAlgQAIccCQACWBAAhyAIBAJQEACHJAgEAlAQAIQyFAgEAAAABiAJAAAAAAZ0CQAAAAAHBAgEAAAABwgIBAAAAAcMCAQAAAAHEAgEAAAABxQIBAAAAAcYCQAAAAAHHAkAAAAAByAIBAAAAAckCAQAAAAEHhQIBAAAAAYgCQAAAAAGdAkAAAAABwAJAAAAAAcoCAQAAAAHLAgEAAAABzAIBAAAAAQIAAAA8ACAmAADuBQAgAwAAADwAICYAAO4FACAnAADtBQAgAR8AAPYGADAMCQAA5QMAIIICAADmAwAwgwIAADoAEIQCAADmAwAwhQIBAAAAAYgCQADBAwAhiQIBAL8DACGdAkAAwQMAIcACQADBAwAhygIBAAAAAcsCAQDAAwAhzAIBAMADACECAAAAPAAgHwAA7QUAIAIAAADrBQAgHwAA7AUAIAuCAgAA6gUAMIMCAADrBQAQhAIAAOoFADCFAgEAvwMAIYgCQADBAwAhiQIBAL8DACGdAkAAwQMAIcACQADBAwAhygIBAL8DACHLAgEAwAMAIcwCAQDAAwAhC4ICAADqBQAwgwIAAOsFABCEAgAA6gUAMIUCAQC_AwAhiAJAAMEDACGJAgEAvwMAIZ0CQADBAwAhwAJAAMEDACHKAgEAvwMAIcsCAQDAAwAhzAIBAMADACEHhQIBAIUEACGIAkAAhwQAIZ0CQACHBAAhwAJAAIcEACHKAgEAhQQAIcsCAQCUBAAhzAIBAJQEACEHhQIBAIUEACGIAkAAhwQAIZ0CQACHBAAhwAJAAIcEACHKAgEAhQQAIcsCAQCUBAAhzAIBAJQEACEHhQIBAAAAAYgCQAAAAAGdAkAAAAABwAJAAAAAAcoCAQAAAAHLAgEAAAABzAIBAAAAAQaFAgEAAAABiAJAAAAAAcsCAQAAAAHMAgEAAAAB1gIAAADWAgLXAoAAAAABAgAAAAEAICYAAPsFACADAAAAAQAgJgAA-wUAICcAAPoFACABHwAA9QYAMAsJAADlAwAgggIAAOcDADCDAgAANwAQhAIAAOcDADCFAgEAAAABiAJAAMEDACGJAgEAvwMAIcsCAQDAAwAhzAIBAMADACHWAgAA6APWAiLXAgAA6QMAIAIAAAABACAfAAD6BQAgAgAAAPcFACAfAAD4BQAgCoICAAD2BQAwgwIAAPcFABCEAgAA9gUAMIUCAQC_AwAhiAJAAMEDACGJAgEAvwMAIcsCAQDAAwAhzAIBAMADACHWAgAA6APWAiLXAgAA6QMAIAqCAgAA9gUAMIMCAAD3BQAQhAIAAPYFADCFAgEAvwMAIYgCQADBAwAhiQIBAL8DACHLAgEAwAMAIcwCAQDAAwAh1gIAAOgD1gIi1wIAAOkDACAGhQIBAIUEACGIAkAAhwQAIcsCAQCUBAAhzAIBAJQEACHWAgAA-QXWAiLXAoAAAAABAeUCAAAA1gICBoUCAQCFBAAhiAJAAIcEACHLAgEAlAQAIcwCAQCUBAAh1gIAAPkF1gIi1wKAAAAAAQaFAgEAAAABiAJAAAAAAcsCAQAAAAHMAgEAAAAB1gIAAADWAgLXAoAAAAABCQ0AAJ0FACAOAADnBAAghQIBAAAAAYgCQAAAAAGYAgAAALECAq8CAQAAAAGxAkAAAAABsgIBAAAAAbMCAQAAAAECAAAAGQAgJgAAhAYAIAMAAAAZACAmAACEBgAgJwAAgwYAIAEfAAD0BgAwAgAAABkAIB8AAIMGACACAAAA4AQAIB8AAIIGACAHhQIBAIUEACGIAkAAhwQAIZgCAADiBLECIq8CAQCFBAAhsQJAAJYEACGyAgEAhQQAIbMCAQCFBAAhCQ0AAJwFACAOAADkBAAghQIBAIUEACGIAkAAhwQAIZgCAADiBLECIq8CAQCFBAAhsQJAAJYEACGyAgEAhQQAIbMCAQCFBAAhCQ0AAJ0FACAOAADnBAAghQIBAAAAAYgCQAAAAAGYAgAAALECAq8CAQAAAAGxAkAAAAABsgIBAAAAAbMCAQAAAAEJDQAAnQUAIA8AAOgEACCFAgEAAAABiAJAAAAAAZgCAAAAsQICrwIBAAAAAbECQAAAAAGyAgEAAAABtAIBAAAAAQIAAAAZACAmAACNBgAgAwAAABkAICYAAI0GACAnAACMBgAgAR8AAPMGADACAAAAGQAgHwAAjAYAIAIAAADgBAAgHwAAiwYAIAeFAgEAhQQAIYgCQACHBAAhmAIAAOIEsQIirwIBAIUEACGxAkAAlgQAIbICAQCFBAAhtAIBAJQEACEJDQAAnAUAIA8AAOUEACCFAgEAhQQAIYgCQACHBAAhmAIAAOIEsQIirwIBAIUEACGxAkAAlgQAIbICAQCFBAAhtAIBAJQEACEJDQAAnQUAIA8AAOgEACCFAgEAAAABiAJAAAAAAZgCAAAAsQICrwIBAAAAAbECQAAAAAGyAgEAAAABtAIBAAAAAQWFAgEAAAABngIBAAAAAZ8CIAAAAAGgAkAAAAABoQJAAAAAAQIAAAAyACAmAACZBgAgAwAAADIAICYAAJkGACAnAACYBgAgAR8AAPIGADAKCQAA6wMAIIICAADqAwAwgwIAADAAEIQCAADqAwAwhQIBAAAAAYkCAQDAAwAhngIBAAAAAZ8CIADQAwAhoAJAAMEDACGhAkAA5AMAIQIAAAAyACAfAACYBgAgAgAAAJYGACAfAACXBgAgCYICAACVBgAwgwIAAJYGABCEAgAAlQYAMIUCAQC_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-AwAwgwIAAAMAEIQCAAD-AwAwhQIBAAAAAYgCQADBAwAhmAIAAP8DqAIinQJAAMEDACGiAgEAvwMAIaMCAQC_AwAhpAIBAL8DACGlAgEAvwMAIaYCAQDAAwAhqAIgANADACGpAggAgAQAIaoCAQDAAwAhqwICAIEEACGsAkAA5AMAIa0CQADkAwAhrgIBAL8DACECAAAABQAgHwAAyAYAIAIAAADGBgAgHwAAxwYAIBOCAgAAxQYAMIMCAADGBgAQhAIAAMUGADCFAgEAvwMAIYgCQADBAwAhmAIAAP8DqAIinQJAAMEDACGiAgEAvwMAIaMCAQC_AwAhpAIBAL8DACGlAgEAvwMAIaYCAQDAAwAhqAIgANADACGpAggAgAQAIaoCAQDAAwAhqwICAIEEACGsAkAA5AMAIa0CQADkAwAhrgIBAL8DACETggIAAMUGADCDAgAAxgYAEIQCAADFBgAwhQIBAL8DACGIAkAAwQMAIZgCAAD_A6gCIp0CQADBAwAhogIBAL8DACGjAgEAvwMAIaQCAQC_AwAhpQIBAL8DACGmAgEAwAMAIagCIADQAwAhqQIIAIAEACGqAgEAwAMAIasCAgCBBAAhrAJAAOQDACGtAkAA5AMAIa4CAQC_AwAhD4UCAQCFBAAhiAJAAIcEACGYAgAApgSoAiKdAkAAhwQAIaICAQCFBAAhowIBAIUEACGkAgEAhQQAIaUCAQCFBAAhpgIBAJQEACGoAiAAngQAIakCCACnBAAhqgIBAJQEACGrAgIAqAQAIawCQACWBAAhrQJAAJYEACEUCAAAqgQAIAoAAKsEACARAACsBAAgEgAArQQAIBMAAK4EACCFAgEAhQQAIYgCQACHBAAhmAIAAKYEqAIinQJAAIcEACGiAgEAhQQAIaMCAQCFBAAhpAIBAIUEACGlAgEAhQQAIaYCAQCUBAAhqAIgAJ4EACGpAggApwQAIaoCAQCUBAAhqwICAKgEACGsAkAAlgQAIa0CQACWBAAhFAgAAJQFACAKAACVBQAgEQAAlgUAIBIAAJcFACATAACYBQAghQIBAAAAAYgCQAAAAAGYAgAAAKgCAp0CQAAAAAGiAgEAAAABowIBAAAAAaQCAQAAAAGlAgEAAAABpgIBAAAAAagCIAAAAAGpAggAAAABqgIBAAAAAasCAgAAAAGsAkAAAAABrQJAAAAAAQQmAAC-BgAw4gIAAL8GADDkAgAAwQYAIOgCAADCBgAwBCYAALUGADDiAgAAtgYAMOQCAAC4BgAg6AIAAP0EADAEJgAArAYAMOICAACtBgAw5AIAAK8GACDoAgAAzQQAMAQmAACjBgAw4gIAAKQGADDkAgAApgYAIOgCAADBBAAwBCYAAJoGADDiAgAAmwYAMOQCAACdBgAg6AIAALMEADAEJgAAjgYAMOICAACPBgAw5AIAAJEGACDoAgAAkgYAMAQmAACFBgAw4gIAAIYGADDkAgAAiAYAIOgCAADcBAAwBCYAAPwFADDiAgAA_QUAMOQCAAD_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-AYAIAMAAAAbACAmAAD4BgAgJwAA_AYAIBcAAAAbACAFAADMBQAgCgAAzQUAIBEAAM4FACASAADPBQAgEwAA0AUAIBQAANEFACAVAADSBQAgFgAA0wUAIBcAANQFACAZAADWBQAgHwAA_AYAIIUCAQCFBAAhiAJAAIcEACGdAkAAhwQAIZ4CAQCFBAAhuQIBAIUEACHNAiAAngQAIc4CAQCUBAAh0AIAAMoF0AIi0gIAAMsF0gIi0wIBAJQEACHUAgEAlAQAIRUFAADMBQAgCgAAzQUAIBEAAM4FACASAADPBQAgEwAA0AUAIBQAANEFACAVAADSBQAgFgAA0wUAIBcAANQFACAZAADWBQAghQIBAIUEACGIAkAAhwQAIZ0CQACHBAAhngIBAIUEACG5AgEAhQQAIc0CIACeBAAhzgIBAJQEACHQAgAAygXQAiLSAgAAywXSAiLTAgEAlAQAIdQCAQCUBAAhFQUAAMoGACAKAADLBgAgEQAAzAYAIBIAAM0GACATAADOBgAgFAAAzwYAIBUAANAGACAWAADRBgAgFwAA0gYAIBgAANMGACCFAgEAAAABiAJAAAAAAZ0CQAAAAAGeAgEAAAABuQIBAAAAAc0CIAAAAAHOAgEAAAAB0AIAAADQAgLSAgAAANICAtMCAQAAAAHUAgEAAAABAgAAAGIAICYAAP0GACADAAAAGwAgJgAA_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_1AE9gAHWAQWBAdcBBYIB2gEFgwHbAQWEAdwBBYUB3gEFhgHgARKHAeEBPogB4wEFiQHlARKKAeYBP4sB5wEFjAHoAQWNAekBEo4B7AFAjwHtAUSQAe4BBJEB7wEEkgHwAQSTAfEBBJQB8gEElQH0AQSWAfYBEpcB9wFFmAH5AQSZAfsBEpoB_AFGmwH9AQScAf4BBJ0B_wESngGCAkefAYMCS6ABhAIIoQGFAgiiAYYCCKMBhwIIpAGIAgilAYoCCKYBjAISpwGNAkyoAZACCKkBkgISqgGTAk2rAZUCCKwBlgIIrQGXAhKuAZoCTq8BmwJSsAGcAgmxAZ0CCbIBngIJswGfAgm0AaACCbUBogIJtgGkAhK3AaUCU7gBqAIJuQGqAhK6AasCVLsBrQIJvAGuAgm9Aa8CEr4BsgJVvwGzAlnAAbQCA8EBtQIDwgG2AgPDAbcCA8QBuAIDxQG6AgPGAbwCEscBvQJayAG_AgPJAcECEsoBwgJbywHDAgPMAcQCA80BxQIS0AHIAlzRAckCYtIBygIO0wHLAg7UAcwCDtUBzQIO1gHOAg7XAdACDtgB0gIS2QHTAmPaAdYCDtsB2AIS3AHZAmTdAdsCDt4B3AIO3wHdAhLgAeACZeEB4QJp4gHiAgvjAeMCC-QB5AIL5QHlAgvmAeYCC-cB6AIL6AHqAhLpAesCauoB7QIL6wHvAhLsAfACa-0B8QIL7gHyAgvvAfMCEvAB9gJs8QH3AnLyAfgCB_MB-QIH9AH6Agf1AfsCB_YB_AIH9wH-Agf4AYADEvkBgQNz-gGDAwf7AYUDEvwBhgN0_QGHAwf-AYgDB_8BiQMSgAKMA3WBAo0DeQ"
};
async function decodeBase64AsWasm(wasmBase64) {
  const { Buffer: Buffer2 } = await import("buffer");
  const wasmArray = Buffer2.from(wasmBase64, "base64");
  return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
  getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs"),
  getQueryCompilerWasmModule: async () => {
    const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs");
    return await decodeBase64AsWasm(wasm);
  },
  importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
  return runtime.getPrismaClient(config);
}

// src/generated/prisma/internal/prismaNamespace.ts
var prismaNamespace_exports = {};
__export(prismaNamespace_exports, {
  AccountScalarFieldEnum: () => AccountScalarFieldEnum,
  ActivityLogScalarFieldEnum: () => ActivityLogScalarFieldEnum,
  AnyNull: () => AnyNull2,
  BookmarkScalarFieldEnum: () => BookmarkScalarFieldEnum,
  CategoryScalarFieldEnum: () => CategoryScalarFieldEnum,
  CommentReportScalarFieldEnum: () => CommentReportScalarFieldEnum,
  CommentScalarFieldEnum: () => CommentScalarFieldEnum,
  DbNull: () => DbNull2,
  Decimal: () => Decimal2,
  IdeaCategoryScalarFieldEnum: () => IdeaCategoryScalarFieldEnum,
  IdeaScalarFieldEnum: () => IdeaScalarFieldEnum,
  JsonNull: () => JsonNull2,
  JsonNullValueFilter: () => JsonNullValueFilter,
  ModelName: () => ModelName,
  NewsletterScalarFieldEnum: () => NewsletterScalarFieldEnum,
  NullTypes: () => NullTypes2,
  NullableJsonNullValueInput: () => NullableJsonNullValueInput,
  NullsOrder: () => NullsOrder,
  PaymentScalarFieldEnum: () => PaymentScalarFieldEnum,
  PrismaClientInitializationError: () => PrismaClientInitializationError2,
  PrismaClientKnownRequestError: () => PrismaClientKnownRequestError2,
  PrismaClientRustPanicError: () => PrismaClientRustPanicError2,
  PrismaClientUnknownRequestError: () => PrismaClientUnknownRequestError2,
  PrismaClientValidationError: () => PrismaClientValidationError2,
  QueryMode: () => QueryMode,
  SessionScalarFieldEnum: () => SessionScalarFieldEnum,
  SortOrder: () => SortOrder,
  Sql: () => Sql2,
  TransactionIsolationLevel: () => TransactionIsolationLevel,
  UserScalarFieldEnum: () => UserScalarFieldEnum,
  VerificationScalarFieldEnum: () => VerificationScalarFieldEnum,
  VoteScalarFieldEnum: () => VoteScalarFieldEnum,
  defineExtension: () => defineExtension,
  empty: () => empty2,
  getExtensionContext: () => getExtensionContext,
  join: () => join2,
  prismaVersion: () => prismaVersion,
  raw: () => raw2,
  sql: () => sql
});
import * as runtime2 from "@prisma/client/runtime/client";
var PrismaClientKnownRequestError2 = runtime2.PrismaClientKnownRequestError;
var PrismaClientUnknownRequestError2 = runtime2.PrismaClientUnknownRequestError;
var PrismaClientRustPanicError2 = runtime2.PrismaClientRustPanicError;
var PrismaClientInitializationError2 = runtime2.PrismaClientInitializationError;
var PrismaClientValidationError2 = runtime2.PrismaClientValidationError;
var sql = runtime2.sqltag;
var empty2 = runtime2.empty;
var join2 = runtime2.join;
var raw2 = runtime2.raw;
var Sql2 = runtime2.Sql;
var Decimal2 = runtime2.Decimal;
var getExtensionContext = runtime2.Extensions.getExtensionContext;
var prismaVersion = {
  client: "7.5.0",
  engine: "280c870be64f457428992c43c1f6d557fab6e29e"
};
var NullTypes2 = {
  DbNull: runtime2.NullTypes.DbNull,
  JsonNull: runtime2.NullTypes.JsonNull,
  AnyNull: runtime2.NullTypes.AnyNull
};
var DbNull2 = runtime2.DbNull;
var JsonNull2 = runtime2.JsonNull;
var AnyNull2 = runtime2.AnyNull;
var ModelName = {
  ActivityLog: "ActivityLog",
  User: "User",
  Session: "Session",
  Account: "Account",
  Verification: "Verification",
  Bookmark: "Bookmark",
  Category: "Category",
  IdeaCategory: "IdeaCategory",
  Comment: "Comment",
  CommentReport: "CommentReport",
  Idea: "Idea",
  Newsletter: "Newsletter",
  Payment: "Payment",
  Vote: "Vote"
};
var TransactionIsolationLevel = runtime2.makeStrictEnum({
  ReadUncommitted: "ReadUncommitted",
  ReadCommitted: "ReadCommitted",
  RepeatableRead: "RepeatableRead",
  Serializable: "Serializable"
});
var ActivityLogScalarFieldEnum = {
  id: "id",
  action: "action",
  details: "details",
  ipAddress: "ipAddress",
  userAgent: "userAgent",
  createdAt: "createdAt",
  userId: "userId"
};
var UserScalarFieldEnum = {
  id: "id",
  name: "name",
  email: "email",
  emailVerified: "emailVerified",
  image: "image",
  role: "role",
  accountStatus: "accountStatus",
  phone: "phone",
  address: "address",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var SessionScalarFieldEnum = {
  id: "id",
  expiresAt: "expiresAt",
  token: "token",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  ipAddress: "ipAddress",
  userAgent: "userAgent",
  userId: "userId"
};
var AccountScalarFieldEnum = {
  id: "id",
  accountId: "accountId",
  providerId: "providerId",
  userId: "userId",
  accessToken: "accessToken",
  refreshToken: "refreshToken",
  idToken: "idToken",
  accessTokenExpiresAt: "accessTokenExpiresAt",
  refreshTokenExpiresAt: "refreshTokenExpiresAt",
  scope: "scope",
  password: "password",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var VerificationScalarFieldEnum = {
  id: "id",
  identifier: "identifier",
  value: "value",
  expiresAt: "expiresAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var BookmarkScalarFieldEnum = {
  id: "id",
  createdAt: "createdAt",
  userId: "userId",
  ideaId: "ideaId"
};
var CategoryScalarFieldEnum = {
  id: "id",
  name: "name",
  slug: "slug",
  description: "description",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var IdeaCategoryScalarFieldEnum = {
  id: "id",
  ideaId: "ideaId",
  categoryId: "categoryId",
  createdAt: "createdAt"
};
var CommentScalarFieldEnum = {
  id: "id",
  content: "content",
  isDeleted: "isDeleted",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  userId: "userId",
  ideaId: "ideaId",
  parentId: "parentId"
};
var CommentReportScalarFieldEnum = {
  id: "id",
  reason: "reason",
  status: "status",
  createdAt: "createdAt",
  resolvedAt: "resolvedAt",
  commentId: "commentId",
  reporterId: "reporterId",
  moderatorId: "moderatorId"
};
var IdeaScalarFieldEnum = {
  id: "id",
  title: "title",
  problemStatement: "problemStatement",
  solution: "solution",
  description: "description",
  imageUrl: "imageUrl",
  status: "status",
  isPaid: "isPaid",
  price: "price",
  feedback: "feedback",
  viewCount: "viewCount",
  publishedAt: "publishedAt",
  rejectedAt: "rejectedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  authorId: "authorId"
};
var NewsletterScalarFieldEnum = {
  id: "id",
  email: "email",
  isSubscribed: "isSubscribed",
  subscribedAt: "subscribedAt",
  unsubscribedAt: "unsubscribedAt",
  userId: "userId"
};
var PaymentScalarFieldEnum = {
  id: "id",
  amount: "amount",
  status: "status",
  transactionId: "transactionId",
  paymentMethod: "paymentMethod",
  paidAt: "paidAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  userId: "userId",
  ideaId: "ideaId"
};
var VoteScalarFieldEnum = {
  id: "id",
  voteType: "voteType",
  createdAt: "createdAt",
  userId: "userId",
  ideaId: "ideaId"
};
var SortOrder = {
  asc: "asc",
  desc: "desc"
};
var NullableJsonNullValueInput = {
  DbNull: DbNull2,
  JsonNull: JsonNull2
};
var QueryMode = {
  default: "default",
  insensitive: "insensitive"
};
var JsonNullValueFilter = {
  DbNull: DbNull2,
  JsonNull: JsonNull2,
  AnyNull: AnyNull2
};
var NullsOrder = {
  first: "first",
  last: "last"
};
var defineExtension = runtime2.Extensions.defineExtension;

// src/generated/prisma/enums.ts
var Role = {
  MEMBER: "MEMBER",
  ADMIN: "ADMIN"
};

// src/generated/prisma/client.ts
globalThis["__dirname"] = path.dirname(fileURLToPath(import.meta.url));
var PrismaClient = getPrismaClientClass();

// src/lib/prisma.ts
var connectionString = `${process.env.DATABASE_URL}`;
var adapter = new PrismaPg({ connectionString });
var prisma = new PrismaClient({ adapter });

// src/lib/auth.ts
import nodemailer from "nodemailer";
import { bearer } from "better-auth/plugins";
var transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.APP_USER,
    pass: process.env.APP_PASSWORD
  }
});
var auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  plugins: [
    bearer()
  ],
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    "http://localhost:3000",
    "https://greenspark.vercel.app"
  ],
  cookie: {
    name: "better-auth",
    attributes: {
      // For localhost: use 'lax', for production: use 'none'
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      // For localhost: false, for production: true
      secure: process.env.NODE_ENV === "production"
    }
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "CUSTOMER",
        required: false
      },
      phone: {
        type: "string",
        required: false
      },
      address: {
        type: "string",
        required: false
      },
      isActive: {
        type: "boolean",
        defaultValue: true,
        required: false
      }
    }
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false
  },
  emailVerification: {
    sendOnSignUp: false,
    autoSignInAfterVerification: false,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      try {
        const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`;
        const info = await transporter.sendMail({
          from: '"GreenSpark" <greenspark.support@gmail.com>',
          to: user.email,
          subject: "Verify Your Email \u2714",
          html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - GreenSpark</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; margin-top: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <!-- Header -->
        <tr>
            <td style="padding: 30px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">GreenSpark</h1>
                <p style="color: #e0e7ff; margin: 5px 0 0; font-size: 16px;">Your Trusted Online Medicine Shop</p>
            </td>
        </tr>
        
        <!-- Main Content -->
        <tr>
            <td style="padding: 40px;">
                <h2 style="color: #333333; margin: 0 0 20px; font-size: 24px;">Verify Your Email Address</h2>
                
                <p style="color: #666666; line-height: 1.6; margin: 0 0 15px;">Hello ${user.name},</p>
                
                <p style="color: #666666; line-height: 1.6; margin: 0 0 20px;">Thank you for signing up with <strong style="color: #667eea;">GreenSpark</strong>! To complete your registration and start exploring our wide range of medicines, please verify your email address by clicking the button below:</p>
                
                <!-- Verification Button -->
                <table cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50px; text-align: center; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                            <a href="${verificationUrl}" style="display: inline-block; padding: 14px 40px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; letter-spacing: 0.5px;">Verify Email Address</a>
                        </td>
                    </tr>
                </table>
                
                <!-- Alternative Link -->
                <p style="color: #666666; line-height: 1.6; margin: 0 0 20px;">Or copy and paste this link into your browser:</p>
                <p style="background-color: #f8f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; word-break: break-all; margin: 0 0 20px;">
                    <a href="${verificationUrl}" style="color: #667eea; text-decoration: none; font-size: 14px;">${verificationUrl}</a>
                </p>
                
                <!-- Expiry Notice -->
                <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800; margin: 25px 0;">
                    <p style="color: #e65100; margin: 0; font-size: 14px;">
                        <strong>\u26A0\uFE0F Link Expires in 24 Hours</strong><br>
                        This verification link will expire in 24 hours for security reasons.
                    </p>
                </div>
                
                <!-- Alternative Instructions -->
                <p style="color: #666666; line-height: 1.6; margin: 20px 0 0;">If you didn't create an account with GreenSpark, you can safely ignore this email.</p>
            </td>
        </tr>
        
        <!-- Benefits Section -->
        <tr>
            <td style="padding: 0 40px 30px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="border-top: 1px solid #eaeef2; padding-top: 25px;">
                            <h3 style="color: #333333; margin: 0 0 20px; font-size: 18px; text-align: center;">What you can do with GreenSpark:</h3>
                            
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td width="33%" style="text-align: center; padding: 10px;">
                                        <div style="background-color: #f0f4ff; width: 50px; height: 50px; line-height: 50px; border-radius: 50%; margin: 0 auto 10px; font-size: 24px;">\u{1F48A}</div>
                                        <p style="color: #666666; margin: 0; font-size: 14px;">Browse Medicines</p>
                                    </td>
                                    <td width="33%" style="text-align: center; padding: 10px;">
                                        <div style="background-color: #f0f4ff; width: 50px; height: 50px; line-height: 50px; border-radius: 50%; margin: 0 auto 10px; font-size: 24px;">\u{1F69A}</div>
                                        <p style="color: #666666; margin: 0; font-size: 14px;">Fast Delivery</p>
                                    </td>
                                    <td width="33%" style="text-align: center; padding: 10px;">
                                        <div style="background-color: #f0f4ff; width: 50px; height: 50px; line-height: 50px; border-radius: 50%; margin: 0 auto 10px; font-size: 24px;">\u{1F4B0}</div>
                                        <p style="color: #666666; margin: 0; font-size: 14px;">Best Prices</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        
        <!-- Footer -->
        <tr>
            <td style="background-color: #2d3748; padding: 30px 40px; border-radius: 0 0 10px 10px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="text-align: center;">
                            <p style="color: #a0aec0; margin: 0 0 10px; font-size: 14px;">\xA9 2026 GreenSpark. All rights reserved.</p>
                            <p style="color: #a0aec0; margin: 0 0 15px; font-size: 14px;">123 Health Street, Wellness City, HC 12345</p>
                            
                            <!-- Social Links -->
                            <table cellpadding="0" cellspacing="0" style="margin: 0 auto 20px;">
                                <tr>
                                    <td style="padding: 0 8px;">
                                        <a href="#" style="color: #a0aec0; text-decoration: none; font-size: 14px;">Facebook</a>
                                    </td>
                                    <td style="padding: 0 8px;">
                                        <a href="#" style="color: #a0aec0; text-decoration: none; font-size: 14px;">Twitter</a>
                                    </td>
                                    <td style="padding: 0 8px;">
                                        <a href="#" style="color: #a0aec0; text-decoration: none; font-size: 14px;">Instagram</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #718096; margin: 0; font-size: 12px;">This email was sent to {{email}}. If you didn't create an account, please ignore this email.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`
        });
      } catch (error) {
        console.error(error);
        throw error;
      }
    }
  },
  socialProviders: {
    google: {
      prompt: "select_account consent",
      accessType: "offline",
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60
      // 5 minutes
    }
  },
  advanced: {
    cookiePrefix: "better-auth",
    useSecureCookies: process.env.NODE_ENV === "production",
    crossSubDomainCookies: {
      enabled: false
    },
    disableCSRFCheck: true
  }
});

export {
  prismaNamespace_exports,
  Role,
  prisma,
  auth
};
