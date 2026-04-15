import 'package:app_localizations/app_localizations.dart';
import 'package:app_network/app_network.dart';
import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/config/app_locale_controller.dart';
import '../../../../app/di/injection_container.dart';
import '../../../../app/router/app_router.dart';
import '../bloc/auth_bloc.dart';
import '../bloc/auth_event.dart';
import '../bloc/auth_state.dart';
import '../widgets/auth_page_header.dart';

class RegisterPage extends StatelessWidget {
  const RegisterPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<AuthBloc>.value(
      value: getIt<AuthBloc>(),
      child: const _RegisterView(),
    );
  }
}

class _RegisterView extends StatefulWidget {
  const _RegisterView();

  @override
  State<_RegisterView> createState() => _RegisterViewState();
}

class _RegisterViewState extends State<_RegisterView> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
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
                            onPressed: () => context.pop(),
                            icon: const Icon(Icons.arrow_back),
                          ),
                        ),
                        const SizedBox(height: 8),
                        AuthPageHeader(
                          badge: l10n.registerBadgeCreateAccount,
                          title: l10n.registerTitleSellerAccount,
                          subtitle: l10n.registerSubtitleBackend,
                        ),
                        const SizedBox(height: 16),
                        AppConnectionBanner(
                          isOnline: networkStatus.isOnline,
                          transportLabel: networkStatus.primaryTransportLabel,
                        ),
                        const SizedBox(height: 20),
                        AppTextField(
                          controller: _nameController,
                          label: l10n.authFullNameLabel,
                          hintText: l10n.authFullNameHint,
                          textInputAction: TextInputAction.next,
                          prefixIcon: const Icon(
                            Icons.person_outline,
                            size: 18,
                          ),
                          validator: _validateName,
                        ),
                        const SizedBox(height: 16),
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
                          controller: _phoneController,
                          label: l10n.authPhoneOptionalLabel,
                          hintText: l10n.authPhoneHint,
                          keyboardType: TextInputType.phone,
                          textInputAction: TextInputAction.next,
                          prefixIcon: const Icon(
                            Icons.phone_outlined,
                            size: 18,
                          ),
                        ),
                        const SizedBox(height: 16),
                        AppTextField(
                          controller: _passwordController,
                          label: l10n.passwordLabel,
                          hintText: l10n.authPasswordCreateHint,
                          obscureText: true,
                          textInputAction: TextInputAction.next,
                          prefixIcon: const Icon(Icons.lock_outline, size: 18),
                          validator: _validatePassword,
                        ),
                        const SizedBox(height: 16),
                        AppTextField(
                          controller: _confirmPasswordController,
                          label: l10n.authConfirmPasswordLabel,
                          hintText: l10n.authConfirmPasswordHint,
                          obscureText: true,
                          textInputAction: TextInputAction.done,
                          prefixIcon: const Icon(
                            Icons.lock_person_outlined,
                            size: 18,
                          ),
                          validator: _validateConfirmPassword,
                        ),
                        const SizedBox(height: 20),
                        AppButton(
                          text: l10n.authCreateAccountCta,
                          isLoading: state.isSubmitting,
                          onPressed: canSubmit ? _onRegisterPressed : null,
                        ),
                        const SizedBox(height: 20),
                        GestureDetector(
                          onTap: () => context.go(AppRouter.authPath),
                          child: Text.rich(
                            TextSpan(
                              text: l10n.authAlreadyHaveAccountPrompt,
                              style: Theme.of(context).textTheme.bodyMedium
                                  ?.copyWith(
                                    color: AppColors.textMid,
                                    fontWeight: FontWeight.w600,
                                  ),
                              children: [
                                TextSpan(
                                  text: l10n.authAlreadyHaveAccountAction,
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

  void _onRegisterPressed() {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final localeCode =
        getIt<AppLocaleController>().locale?.languageCode ??
        Localizations.localeOf(context).languageCode;

    context.read<AuthBloc>().add(
      AuthRegisterSubmitted(
        name: _nameController.text.trim(),
        email: _emailController.text.trim(),
        password: _passwordController.text,
        phone: _phoneController.text.trim().isEmpty
            ? null
            : _phoneController.text.trim(),
        locale: localeCode == 'en' ? 'en' : 'my',
      ),
    );
  }

  String? _validateName(String? value) {
    final l10n = context.l10n;
    final normalized = (value ?? '').trim();
    if (normalized.isEmpty) {
      return l10n.validationNameRequired;
    }

    if (normalized.length < 2) {
      return l10n.validationNameMinLength;
    }

    return null;
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

    final hasUppercase = raw.contains(RegExp(r'[A-Z]'));
    final hasLowercase = raw.contains(RegExp(r'[a-z]'));
    final hasDigit = raw.contains(RegExp(r'\d'));

    if (!hasUppercase || !hasLowercase || !hasDigit) {
      return l10n.authPasswordCreateHint;
    }

    return null;
  }

  String? _validateConfirmPassword(String? value) {
    final l10n = context.l10n;
    if ((value ?? '').isEmpty) {
      return l10n.validationConfirmPasswordRequired;
    }

    if (value != _passwordController.text) {
      return l10n.validationPasswordMismatch;
    }

    return null;
  }
}
