-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'CLEANER', 'ADMIN', 'OWNER');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ServiceFrequency" AS ENUM ('ONE_TIME', 'WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CREDIT_CARD', 'CASH', 'ZELLE', 'VENMO', 'OTHER');

-- CreateEnum
CREATE TYPE "PricingRuleType" AS ENUM ('BASE_PRICE', 'SQFT_RATE', 'BEDROOM_RATE', 'BATHROOM_RATE', 'EXTRA_SERVICE', 'TIME_ESTIMATE');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BookingImageType" AS ENUM ('BEFORE', 'AFTER', 'DURING');

-- CreateEnum
CREATE TYPE "AccountingCategory" AS ENUM ('INCOME', 'EXPENSE', 'ASSET', 'LIABILITY', 'EQUITY');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "color" TEXT,
    "stripeCustomerId" TEXT,
    "stripeDefaultPaymentMethodId" TEXT,
    "temporaryPassword" TEXT,
    "hasResetPassword" BOOLEAN NOT NULL DEFAULT false,
    "adminPermissions" JSONB,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" INTEGER NOT NULL,
    "cleanerId" INTEGER,
    "serviceType" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "scheduledTime" TEXT NOT NULL,
    "durationHours" DOUBLE PRECISION,
    "address" TEXT NOT NULL,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "placeId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "specialInstructions" TEXT,
    "privateBookingNote" TEXT,
    "privateCustomerNote" TEXT,
    "providerNote" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "finalPrice" DOUBLE PRECISION,
    "selectedExtras" JSONB,
    "recurrenceId" TEXT,
    "occurrenceNumber" INTEGER,
    "cancellationFeeApplied" BOOLEAN DEFAULT false,
    "serviceFrequency" "ServiceFrequency",
    "houseSquareFootage" INTEGER,
    "basementSquareFootage" INTEGER,
    "numberOfBedrooms" INTEGER,
    "numberOfBathrooms" INTEGER,
    "numberOfCleanersRequested" INTEGER,
    "cleanerPaymentAmount" DOUBLE PRECISION,
    "paymentMethod" "PaymentMethod",
    "paymentDetails" TEXT,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingCleaner" (
    "bookingId" INTEGER NOT NULL,
    "cleanerId" INTEGER NOT NULL,

    CONSTRAINT "BookingCleaner_pkey" PRIMARY KEY ("bookingId","cleanerId")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bookingId" INTEGER NOT NULL,
    "cleanerId" INTEGER,
    "amount" DOUBLE PRECISION NOT NULL,
    "paidAt" TIMESTAMP(3),
    "description" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingInquiry" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "howHeardAbout" TEXT NOT NULL,
    "message" TEXT,
    "smsConsent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BookingInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistTemplate" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,

    CONSTRAINT "ChecklistTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItemTemplate" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "ChecklistItemTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingChecklist" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bookingId" INTEGER NOT NULL,
    "templateId" INTEGER NOT NULL,

    CONSTRAINT "BookingChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingChecklistItem" (
    "id" SERIAL NOT NULL,
    "checklistId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "completedBy" INTEGER,

    CONSTRAINT "BookingChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallLog" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "contactId" INTEGER,
    "callSid" TEXT,
    "fromNumber" TEXT NOT NULL,
    "toNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "duration" INTEGER,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "recordingUrl" TEXT,
    "externalId" TEXT,
    "summary" TEXT,
    "transcript" TEXT,
    "voicemailUrl" TEXT,

    CONSTRAINT "CallLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingRule" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "ruleType" "PricingRuleType" NOT NULL,
    "serviceType" TEXT,
    "priceAmount" DOUBLE PRECISION,
    "ratePerUnit" DOUBLE PRECISION,
    "timeAmount" DOUBLE PRECISION,
    "timePerUnit" DOUBLE PRECISION,
    "extraName" TEXT,
    "extraDescription" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "priceRangeMin" DOUBLE PRECISION,
    "priceRangeMax" DOUBLE PRECISION,

    CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeOffRequest" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cleanerId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" INTEGER,
    "reviewedAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "isCleared" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TimeOffRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeEntry" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "bookingId" INTEGER,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "locationNote" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "senderId" INTEGER NOT NULL,
    "recipientId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "externalId" TEXT,
    "openPhoneId" TEXT,
    "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualTask" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "assignedToId" INTEGER,

    CONSTRAINT "ManualTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemLog" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" INTEGER,
    "before" JSONB,
    "after" JSONB,

    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleanerAvailability" (
    "id" SERIAL NOT NULL,
    "cleanerId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CleanerAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingImage" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bookingId" INTEGER NOT NULL,
    "uploaderId" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageType" "BookingImageType" NOT NULL,
    "caption" TEXT,

    CONSTRAINT "BookingImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringBookingTemplate" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" INTEGER NOT NULL,
    "serviceType" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "specialInstructions" TEXT,
    "serviceFrequency" "ServiceFrequency" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "bookingTime" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,

    CONSTRAINT "RecurringBookingTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recipientId" INTEGER NOT NULL,
    "templateId" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingEntry" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" "AccountingCategory" NOT NULL,
    "relatedBookingId" INTEGER,
    "mercuryTransactionId" INTEGER,

    CONSTRAINT "AccountingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" "AccountingCategory" NOT NULL,
    "vendor" TEXT,
    "receiptUrl" TEXT,
    "reference" TEXT,
    "accountingEntryId" INTEGER,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "holdDelayHours" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripePayment" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bookingId" INTEGER,
    "stripeIntentId" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "StripePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MercuryAccount" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT,
    "status" TEXT,
    "balance" DOUBLE PRECISION DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MercuryAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MercuryTransaction" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactionAt" TIMESTAMP(3),
    "description" TEXT,
    "category" TEXT,
    "amount" DOUBLE PRECISION,
    "status" TEXT,
    "accountId" INTEGER,

    CONSTRAINT "MercuryTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AITranscript" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "callId" INTEGER NOT NULL,
    "transcript" TEXT NOT NULL,
    "analysis" JSONB,

    CONSTRAINT "AITranscript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialMediaPost" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "platform" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "postedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,

    CONSTRAINT "SocialMediaPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "type" "DiscountType" NOT NULL DEFAULT 'PERCENT',
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "label" TEXT NOT NULL DEFAULT 'Get Discount',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscountConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpVerification" (
    "id" SERIAL NOT NULL,
    "phone" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "resendCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "supersededAt" TIMESTAMP(3),

    CONSTRAINT "OtpVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleanQuizSubmission" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "cleanType" TEXT,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "messiness" INTEGER,
    "kids" BOOLEAN,
    "pets" BOOLEAN,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "placeId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "extras" JSONB,
    "recommendedCleanType" TEXT,
    "recommendedDurationHours" DOUBLE PRECISION,
    "originalTotalCents" INTEGER,
    "discountCents" INTEGER,
    "finalTotalCents" INTEGER,
    "stripeCustomerId" TEXT,
    "stripeSetupIntentId" TEXT,
    "stripePaymentMethodId" TEXT,
    "stripePaymentIntentId" TEXT,
    "appointmentDateTime" TIMESTAMP(3),
    "willBeHome" BOOLEAN,
    "homeType" TEXT,
    "parkingNotes" TEXT,
    "entryInstructions" TEXT,
    "cleaningInstructions" TEXT,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'draft',

    CONSTRAINT "CleanQuizSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOMetadata" (
    "id" SERIAL NOT NULL,
    "path" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "keywords" TEXT NOT NULL,

    CONSTRAINT "SEOMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingVideo" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,

    CONSTRAINT "TrainingVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleanerTrainingProgress" (
    "id" SERIAL NOT NULL,
    "cleanerId" INTEGER NOT NULL,
    "videoId" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "score" DOUBLE PRECISION,

    CONSTRAINT "CleanerTrainingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FAQ" (
    "id" SERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "debit" DOUBLE PRECISION,
    "credit" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadSourceCategory" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "LeadSourceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BookingChecklist_bookingId_key" ON "BookingChecklist"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "CallLog_callSid_key" ON "CallLog"("callSid");

-- CreateIndex
CREATE UNIQUE INDEX "CallLog_externalId_key" ON "CallLog"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_externalId_key" ON "Message"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_name_key" ON "EmailTemplate"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingEntry_mercuryTransactionId_key" ON "AccountingEntry"("mercuryTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_accountingEntryId_key" ON "Expense"("accountingEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "StripePayment_stripeIntentId_key" ON "StripePayment"("stripeIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "MercuryAccount_externalId_key" ON "MercuryAccount"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "MercuryTransaction_externalId_key" ON "MercuryTransaction"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "SEOMetadata_path_key" ON "SEOMetadata"("path");

-- CreateIndex
CREATE UNIQUE INDEX "LeadSourceCategory_name_key" ON "LeadSourceCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_key" ON "Review"("bookingId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingCleaner" ADD CONSTRAINT "BookingCleaner_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingCleaner" ADD CONSTRAINT "BookingCleaner_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingInquiry" ADD CONSTRAINT "BookingInquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItemTemplate" ADD CONSTRAINT "ChecklistItemTemplate_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ChecklistTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingChecklist" ADD CONSTRAINT "BookingChecklist_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingChecklist" ADD CONSTRAINT "BookingChecklist_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ChecklistTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingChecklistItem" ADD CONSTRAINT "BookingChecklistItem_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "BookingChecklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeOffRequest" ADD CONSTRAINT "TimeOffRequest_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeOffRequest" ADD CONSTRAINT "TimeOffRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualTask" ADD CONSTRAINT "ManualTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemLog" ADD CONSTRAINT "SystemLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerAvailability" ADD CONSTRAINT "CleanerAvailability_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingImage" ADD CONSTRAINT "BookingImage_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingImage" ADD CONSTRAINT "BookingImage_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringBookingTemplate" ADD CONSTRAINT "RecurringBookingTemplate_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EmailTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingEntry" ADD CONSTRAINT "AccountingEntry_mercuryTransactionId_fkey" FOREIGN KEY ("mercuryTransactionId") REFERENCES "MercuryTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingEntry" ADD CONSTRAINT "AccountingEntry_relatedBookingId_fkey" FOREIGN KEY ("relatedBookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_accountingEntryId_fkey" FOREIGN KEY ("accountingEntryId") REFERENCES "AccountingEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StripePayment" ADD CONSTRAINT "StripePayment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MercuryTransaction" ADD CONSTRAINT "MercuryTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MercuryAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AITranscript" ADD CONSTRAINT "AITranscript_callId_fkey" FOREIGN KEY ("callId") REFERENCES "CallLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerTrainingProgress" ADD CONSTRAINT "CleanerTrainingProgress_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerTrainingProgress" ADD CONSTRAINT "CleanerTrainingProgress_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "TrainingVideo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

