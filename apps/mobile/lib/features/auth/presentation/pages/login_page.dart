import 'package:app_localizations/app_localizations.dart';
import 'package:app_network/app_network.dart';
import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fom_mobile/features/announcements/feature_announcements.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/di/injection_container.dart';
import '../../../../app/router/app_router.dart';
import '../bloc/auth_bloc.dart';
import '../bloc/auth_event.dart';
import '../bloc/auth_state.dart';
import '../widgets/auth_page_header.dart';

class LoginPage extends StatelessWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<AuthBloc>.value(
      value: getIt<AuthBloc>(),
      child: const _LoginView(),
    );
  }
}

class _LoginView extends StatefulWidget {
  const _LoginView();

  @override
  State<_LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends State<_LoginView> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final connectionService = getIt<NetworkConnectionService>();
    final l10n = context.l10n;

    return BlocConsumer<AuthBloc, AuthState>(
      listenWhen: (previous, current) =>
          previous.errorMessage != current.errorMessage &&
          current.errorMessage != null,
      listener: (context, state) {
        final message = state.errorMessage;
        if (message == null || message.isEmpty) {
          return;
        }

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
        );
      },
      builder: (context, state) {
        return StreamBuilder<NetworkConnectionStatus>(
          stream: connectionService.statusStream,
          initialData: connectionService.currentStatus,
          builder: (context, snapshot) {
            final networkStatus =
                snapshot.data ?? NetworkConnectionStatus.unknown();
            final canSubmit = !state.isSubmitting && networkStatus.isOnline;

            return Scaffold(
              backgroundColor: AppColors.background,
              body: SafeArea(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 28,
                  ),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Align(
                          alignment: Alignment.centerLeft,
                          child: IconButton(
                            onPressed: context.canPop()
                                ? () => context.pop()
                                : null,
                            icon: const Icon(Icons.arrow_back),
                          ),
                        ),
                        const SizedBox(height: 8),
                        AuthPageHeader(
                          badge: l10n.loginBadgeWelcomeBack,
                          title: l10n.loginTitleShop,
                          subtitle: l10n.loginSubtitleOrders,
                        ),
                        const SizedBox(height: 16),
                        AppConnectionBanner(
                          isOnline: networkStatus.isOnline,
                          transportLabel: networkStatus.primaryTransportLabel,
                        ),
                        const AnnouncementBannerHost.publicAuth(
                          padding: EdgeInsets.only(top: 16),
                        ),
                        const SizedBox(height: 20),
                        AppTextField(
                          controller: _emailController,
                          label: l10n.authEmailLabel,
                          hintText: 'maaye@example.com',
                          keyboardType: TextInputType.emailAddress,
                          textInputAction: TextInputAction.next,
                          prefixIcon: const Icon(
                            Icons.alternate_email,
                            size: 18,
                          ),
                          validator: _validateEmail,
                        ),
                        const SizedBox(height: 16),
                        AppTextField(
                          controller: _passwordController,
                          label: l10n.passwordLabel,
                          hintText: l10n.authEnterPasswordHint,
                          obscureText: true,
                          textInputAction: TextInputAction.done,
                          prefixIcon: const Icon(Icons.lock_outline, size: 18),
                          validator: _validatePassword,
                        ),
                        const SizedBox(height: 20),
                        if (state.sessionConflict != null) ...[
                          AppAlertBanner(
                            title: l10n.authSessionConflictTitle,
                            message: _buildSessionConflictMessage(
                              state.sessionConflict!,
                            ),
                            icon: const Icon(
                              Icons.shield_outlined,
                              size: 20,
                              color: Color(0xFF92400E),
                            ),
                          ),
                          const SizedBox(height: 16),
                          AppButton(
                            text: l10n.authLogoutOtherDevice,
                            variant: AppButtonVariant.secondary,
                            isLoading: state.isSubmitting,
                            onPressed: canSubmit
                                ? () {
                                    context.read<AuthBloc>().add(
                                      const AuthLoginTakeoverRequested(),
                                    );
                                  }
                                : null,
                          ),
                          const SizedBox(height: 12),
                        ],
                        AppButton(
                          text: l10n.signIn,
                          isLoading: state.isSubmitting,
                          onPressed: canSubmit ? _onSignInPressed : null,
                        ),
                        const SizedBox(height: 20),
                        GestureDetector(
                          onTap: () => context.push(AppRouter.registerPath),
                          child: Text.rich(
                            TextSpan(
                              text: l10n.authNoAccountPrompt,
                              style: Theme.of(context).textTheme.bodyMedium
                                  ?.copyWith(
                                    color: AppColors.textMid,
                                    fontWeight: FontWeight.w600,
                                  ),
                              children: [
                                TextSpan(
                                  text: l10n.authCreateOneAction,
                                  style: const TextStyle(
                                    color: AppColors.softOrange,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ],
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _onSignInPressed() {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    context.read<AuthBloc>().add(
      AuthLoginSubmitted(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      ),
    );
  }

  String? _validateEmail(String? value) {
    final l10n = context.l10n;
    final normalized = (value ?? '').trim();
    if (normalized.isEmpty) {
      return l10n.validationEmailRequired;
    }

    final emailRegex = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
    if (!emailRegex.hasMatch(normalized)) {
      return l10n.validationEmailInvalid;
    }

    return null;
  }

  String? _validatePassword(String? value) {
    final l10n = context.l10n;
    final raw = value ?? '';
    if (raw.isEmpty) {
      return l10n.validationPasswordRequired;
    }

    if (raw.length < 8) {
      return l10n.validationPasswordMinLength;
    }

    return null;
  }

  String _buildSessionConflictMessage(AuthSessionConflict conflict) {
    final parts = <String>[
      conflict.deviceName,
      if (conflict.lastSeenAt != null)
        _formatConflictTimestamp(conflict.lastSeenAt!),
      if ((conflict.ipAddress ?? '').trim().isNotEmpty)
        'IP ${conflict.ipAddress!.trim()}',
    ];

    return parts.join(' • ');
  }

  String _formatConflictTimestamp(DateTime value) {
    final localValue = value.toLocal();
    final hour = localValue.hour % 12 == 0 ? 12 : localValue.hour % 12;
    final minute = localValue.minute.toString().padLeft(2, '0');
    final suffix = localValue.hour >= 12 ? 'PM' : 'AM';

    return '${localValue.day}/${localValue.month}/${localValue.year} $hour:$minute $suffix';
  }
}
