import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnnouncementsService } from '../announcements/announcements.service';
import { CreatePlatformAnnouncementDto } from '../announcements/dto/create-platform-announcement.dto';
import { ListPlatformAnnouncementsQueryDto } from '../announcements/dto/list-platform-announcements-query.dto';
import { UpdatePlatformAnnouncementDto } from '../announcements/dto/update-platform-announcement.dto';
import { ok } from '../common/http/api-result';
import { AuthGuard } from '../common/http/auth.guard';
import { CurrentUser } from '../common/http/current-user.decorator';
import { RequirePermissions } from '../common/http/permissions.decorator';
import { permissions } from '../common/http/rbac.constants';
import { RbacGuard } from '../common/http/rbac.guard';
import type { AuthenticatedUser } from '../common/http/request-context';
import { CreatePlatformPlanDto } from './dto/create-platform-plan.dto';
import { CreatePlatformShopDto } from './dto/create-platform-shop.dto';
import { CreatePlatformInvoiceDto } from './dto/create-platform-invoice.dto';
import { CreatePlatformSupportIssueDto } from './dto/create-platform-support-issue.dto';
import { ListPlatformPushDevicesQueryDto } from './dto/list-platform-push-devices-query.dto';
import { ListPlatformPushUsersQueryDto } from './dto/list-platform-push-users-query.dto';
import { ListPlatformShopsQueryDto } from './dto/list-platform-shops-query.dto';
import { ListPlatformSubscriptionsQueryDto } from './dto/list-platform-subscriptions-query.dto';
import { ListPlatformUsersQueryDto } from './dto/list-platform-users-query.dto';
import { SearchPlatformOwnerAccountsQueryDto } from './dto/search-platform-owner-accounts-query.dto';
import { UpdatePlatformInvoiceDto } from './dto/update-platform-invoice.dto';
import { UpdatePlatformPlanDto } from './dto/update-platform-plan.dto';
import { UpdatePlatformSettingsProfileDto } from './dto/update-platform-settings-profile.dto';
import { UpdatePlatformShopDto } from './dto/update-platform-shop.dto';
import { UpdatePlatformSubscriptionDto } from './dto/update-platform-subscription.dto';
import { UpdatePlatformSupportIssueDto } from './dto/update-platform-support-issue.dto';
import { UpdatePlatformPaymentProofDto } from './dto/update-platform-payment-proof.dto';
import { PlatformService } from './platform.service';
import { UpdatePublicContactSubmissionDto } from '../public-contact/dto/update-public-contact-submission.dto';
import { PublicContactService } from '../public-contact/public-contact.service';

@Controller('api/v1/platform')
@UseGuards(AuthGuard)
@ApiTags('Platform')
@ApiBearerAuth('access-token')
export class PlatformController {
  constructor(
    private readonly platformService: PlatformService,
    private readonly publicContactService: PublicContactService,
    private readonly announcementsService: AnnouncementsService,
  ) {}

  @Get('dashboard')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformDashboardRead)
  @ApiOperation({ summary: 'Get platform dashboard metrics' })
  getDashboard() {
    return ok(this.platformService.getDashboard());
  }

  @Get('shops')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformShopsRead)
  @ApiOperation({ summary: 'List shops for the platform workspace' })
  listShops(@Query() query: ListPlatformShopsQueryDto) {
    return this.platformService.listShops(query);
  }

  @Get('users')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformShopsRead)
  @ApiOperation({ summary: 'List users across the platform workspace' })
  listUsers(@Query() query: ListPlatformUsersQueryDto) {
    return this.platformService.listUsers(query);
  }

  @Get('push-notifications')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformShopsRead)
  @ApiOperation({
    summary: 'List push-capable devices across the platform workspace',
  })
  getPushNotifications(@Query() query: ListPlatformPushDevicesQueryDto) {
    return ok(this.platformService.getPushNotifications(query));
  }

  @Get('push-notifications/users')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformShopsRead)
  @ApiOperation({
    summary: 'List user push coverage across the platform workspace',
  })
  getPushNotificationUsers(@Query() query: ListPlatformPushUsersQueryDto) {
    return ok(this.platformService.getPushNotificationUsers(query));
  }

  @Get('users/:userId')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformShopsRead)
  @ApiOperation({ summary: 'Get a single user from the platform workspace' })
  getUser(@Param('userId') userId: string) {
    return ok(this.platformService.getUser(userId));
  }

  @Get('owner-accounts')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformShopsRead)
  @ApiOperation({
    summary: 'Search existing owner accounts for platform shop assignment',
  })
  searchOwnerAccounts(@Query() query: SearchPlatformOwnerAccountsQueryDto) {
    return ok(this.platformService.searchOwnerAccounts(query));
  }

  @Get('shops/:shopId')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformShopsRead)
  @ApiOperation({ summary: 'Get a single shop from the platform workspace' })
  getShop(@Param('shopId') shopId: string) {
    return ok(this.platformService.getShop(shopId));
  }

  @Post('shops')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformShopsWrite)
  @ApiOperation({ summary: 'Create a shop from the platform workspace' })
  createShop(@Body() body: CreatePlatformShopDto) {
    return ok(this.platformService.createShop(body));
  }

  @Patch('shops/:shopId')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformShopsWrite)
  @ApiOperation({ summary: 'Update a shop from the platform workspace' })
  updateShop(
    @Param('shopId') shopId: string,
    @Body() body: UpdatePlatformShopDto,
  ) {
    return ok(this.platformService.updateShop(shopId, body));
  }

  @Delete('shops/:shopId')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformShopsWrite)
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a shop and all shop-scoped data' })
  async deleteShop(@Param('shopId') shopId: string) {
    await this.platformService.deleteShop(shopId);
  }

  @Get('subscriptions')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformSubscriptionsRead)
  @ApiOperation({ summary: 'Get subscription, invoice, and renewal data' })
  getSubscriptions(@Query() query: ListPlatformSubscriptionsQueryDto) {
    return ok(this.platformService.getSubscriptions(query));
  }

  @Get('payments')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformSubscriptionsRead)
  @ApiOperation({ summary: 'Get payment and invoice records' })
  getPayments(@Query() query: ListPlatformSubscriptionsQueryDto) {
    return ok(this.platformService.getPayments(query));
  }

  @Get('payments/:invoiceId')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformSubscriptionsRead)
  @ApiOperation({ summary: 'Get payment details for a single invoice' })
  getPayment(@Param('invoiceId') invoiceId: string) {
    return ok(this.platformService.getPayment(invoiceId));
  }

  @Get('announcements/live')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformDashboardRead)
  @ApiOperation({
    summary: 'Get active platform announcements for the admin portal',
  })
  getLiveAnnouncements() {
    return ok(this.announcementsService.listPlatformSurfaceAnnouncements());
  }

  @Get('announcements')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformDashboardRead)
  @ApiOperation({ summary: 'List platform announcements and workflow states' })
  listAnnouncements(@Query() query: ListPlatformAnnouncementsQueryDto) {
    return ok(this.announcementsService.listPlatformAnnouncements(query));
  }

  @Get('announcements/:announcementId')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformDashboardRead)
  @ApiOperation({ summary: 'Get announcement details' })
  getAnnouncement(@Param('announcementId') announcementId: string) {
    return ok(this.announcementsService.getAnnouncementById(announcementId));
  }

  @Post('announcements')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformSettingsWrite)
  @ApiOperation({ summary: 'Create a new platform announcement' })
  createAnnouncement(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() body: CreatePlatformAnnouncementDto,
  ) {
    return ok(this.announcementsService.createAnnouncement(currentUser, body));
  }

  @Patch('announcements/:announcementId')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformSettingsWrite)
  @ApiOperation({ summary: 'Update a platform announcement' })
  updateAnnouncement(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('announcementId') announcementId: string,
    @Body() body: UpdatePlatformAnnouncementDto,
  ) {
    return ok(
      this.announcementsService.updateAnnouncement(
        currentUser,
        announcementId,
        body,
      ),
    );
  }

  @Delete('announcements/:announcementId')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformSettingsWrite)
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a platform announcement' })
  async deleteAnnouncement(@Param('announcementId') announcementId: string) {
    await this.announcementsService.deleteAnnouncement(announcementId);
  }

  @Patch('subscriptions/:subscriptionId')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformSubscriptionsWrite)
  @ApiOperation({
    summary: 'Update a shop subscription from the platform workspace',
  })
  updateSubscription(
    @Param('subscriptionId') subscriptionId: string,
    @Body() body: UpdatePlatformSubscriptionDto,
  ) {
    return ok(this.platformService.updateSubscription(subscriptionId, body));
  }

  @Post('subscriptions/:subscriptionId/invoices')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformSubscriptionsWrite)
  @ApiOperation({ summary: 'Create an invoice for a subscription' })
  createInvoice(
    @Param('subscriptionId') subscriptionId: string,
    @Body() body: CreatePlatformInvoiceDto,
  ) {
    return ok(this.platformService.createInvoice(subscriptionId, body));
  }

  @Patch('invoices/:invoiceId')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformSubscriptionsWrite)
  @ApiOperation({ summary: 'Update an invoice from the platform workspace' })
  updateInvoice(
    @Param('invoiceId') invoiceId: string,
    @Body() body: UpdatePlatformInvoiceDto,
  ) {
    return ok(this.platformService.updateInvoice(invoiceId, body));
  }

  @Get('support')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformSupportRead)
  @ApiOperation({ summary: 'Get platform support and operator queue data' })
  getSupport() {
    return ok(this.platformService.getSupport());
  }

  @Get('public-contact-submissions')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformSupportRead)
  @ApiOperation({ summary: 'Get public website contact submissions' })
  listPublicContactSubmissions() {
    return ok(
      this.publicContactService.listInboxForPlatform({ includeArchived: true }),
    );
  }

  @Get('public-contact-submissions/:submissionId')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformSupportRead)
  @ApiOperation({ summary: 'Get a single public contact submission' })
  getPublicContactSubmission(@Param('submissionId') submissionId: string) {
    return ok(this.publicContactService.getSubmissionForPlatform(submissionId));
  }

  @Post('support/issues')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformSupportWrite)
  @ApiOperation({ summary: 'Create a support issue in the platform workspace' })
  createSupportIssue(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() body: CreatePlatformSupportIssueDto,
  ) {
    return ok(this.platformService.createSupportIssue(currentUser, body));
  }

  @Patch('support/issues/:issueId')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformSupportWrite)
  @ApiOperation({ summary: 'Update support issue workflow state' })
  updateSupportIssue(
    @Param('issueId') issueId: string,
    @Body() body: UpdatePlatformSupportIssueDto,
  ) {
    return ok(this.platformService.updateSupportIssue(issueId, body));
  }

  @Patch('public-contact-submissions/:submissionId')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformSupportWrite)
  @ApiOperation({
    summary: 'Update notes or archive a public website contact submission',
  })
  updatePublicContactSubmission(
    @Param('submissionId') submissionId: string,
    @Body() body: UpdatePublicContactSubmissionDto,
  ) {
    return ok(
      this.publicContactService.updateSubmissionAsPlatform(submissionId, body),
    );
  }

  @Patch('payment-proofs/:proofId')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformSupportWrite)
  @ApiOperation({
    summary: 'Retired manual payment proof review endpoint',
  })
  updatePaymentProof(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('proofId') proofId: string,
    @Body() body: UpdatePlatformPaymentProofDto,
  ) {
    return ok(
      this.platformService.updatePaymentProof(currentUser, proofId, body),
    );
  }

  @Get('settings')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformSettingsWrite)
  @ApiOperation({ summary: 'Get platform admin settings data' })
  getSettings(@CurrentUser() currentUser: AuthenticatedUser) {
    return ok(this.platformService.getSettings(currentUser));
  }

  @Patch('settings/profile')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformSettingsWrite)
  @ApiOperation({ summary: 'Update platform owner profile settings' })
  updateSettingsProfile(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() body: UpdatePlatformSettingsProfileDto,
  ) {
    return ok(this.platformService.updateSettingsProfile(currentUser, body));
  }

  @Patch('settings/plans/:planId')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformSettingsWrite)
  @ApiOperation({ summary: 'Update a billing plan from platform settings' })
  updateSettingsPlan(
    @Param('planId') planId: string,
    @Body() body: UpdatePlatformPlanDto,
  ) {
    return ok(this.platformService.updateSettingsPlan(planId, body));
  }

  @Post('settings/plans')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformSettingsWrite)
  @ApiOperation({ summary: 'Create a billing plan from platform settings' })
  createSettingsPlan(@Body() body: CreatePlatformPlanDto) {
    return ok(this.platformService.createSettingsPlan(body));
  }

  @Delete('settings/plans/:planId')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformSettingsWrite)
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete an unused billing plan from platform settings',
  })
  async deleteSettingsPlan(@Param('planId') planId: string) {
    await this.platformService.deleteSettingsPlan(planId);
  }
}
