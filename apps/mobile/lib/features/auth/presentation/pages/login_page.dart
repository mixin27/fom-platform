import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';
import 'package:fom_mobile/app/router/app_router.dart';
import 'package:go_router/go_router.dart';

class LoginPage extends StatelessWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Back Button
              Align(
                alignment: Alignment.centerLeft,
                child: InkWell(
                  onTap: () => context.pop(),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border.all(color: AppColors.border, width: 2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.arrow_back,
                      color: AppColors.textDark,
                      size: 18,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 28),

              // Header
              Text(
                '👋 Welcome back',
                style: TextTheme.of(context).labelMedium?.copyWith(
                  color: AppColors.softOrange,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.84, // 0.06em approx
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Sign in to\nyour shop',
                style: TextTheme.of(context).headlineMedium?.copyWith(
                  color: AppColors.textDark,
                  fontWeight: FontWeight.w900,
                  height: 1.2,
                  fontSize: 28,
                ),
              ),
              const SizedBox(height: 32),

              // Form
              Text(
                'Phone / Email',
                style: TextTheme.of(context).labelSmall?.copyWith(
                  color: AppColors.textDark,
                  fontWeight: FontWeight.w800,
                  fontSize: 12,
                  letterSpacing: 0.72,
                ),
              ),
              const SizedBox(height: 8),
              const TextField(
                decoration: InputDecoration(
                  prefixIcon: Icon(Icons.phone_android, size: 18),
                  hintText: '09xxxxxxxxx or email',
                ),
              ),
              const SizedBox(height: 18),

              Text(
                'Password',
                style: TextTheme.of(context).labelSmall?.copyWith(
                  color: AppColors.textDark,
                  fontWeight: FontWeight.w800,
                  fontSize: 12,
                  letterSpacing: 0.72,
                ),
              ),
              const SizedBox(height: 8),
              const TextField(
                obscureText: true,
                decoration: InputDecoration(
                  prefixIcon: Icon(Icons.lock_outline, size: 18),
                  hintText: 'Enter password',
                ),
              ),
              const SizedBox(height: 6),
              Align(
                alignment: Alignment.centerRight,
                child: Text(
                  'Forgot password?',
                  style: TextTheme.of(context).labelSmall?.copyWith(
                    color: AppColors.softOrange,
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                  ),
                ),
              ),
              const SizedBox(height: 18),

              ElevatedButton(
                onPressed: () {
                  context.go(AppRouter.ordersPath);
                },
                child: const Text('Sign In — ဝင်ရောက်မည်'),
              ),

              const SizedBox(height: 22),
              Row(
                children: [
                  const Expanded(
                    child: Divider(color: AppColors.border, thickness: 1),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'OR',
                    style: TextTheme.of(context).labelSmall?.copyWith(
                      color: AppColors.textLight,
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Divider(color: AppColors.border, thickness: 1),
                  ),
                ],
              ),
              const SizedBox(height: 22),

              // Facebook Button
              ElevatedButton.icon(
                onPressed: () {},
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.facebookBlue,
                  shadowColor: Colors.transparent,
                ),
                icon: const Icon(Icons.facebook, color: Colors.white),
                label: const Text('Continue with Facebook'),
              ),

              const SizedBox(height: 20),
              // Trial Badge
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  color: AppColors.tealLight,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  children: [
                    const Text('🎉', style: TextStyle(fontSize: 22)),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '7-Day Free Trial',
                            style: TextTheme.of(context).labelLarge?.copyWith(
                              color: AppColors.teal,
                              fontWeight: FontWeight.w800,
                              fontSize: 13,
                            ),
                          ),
                          Text(
                            'No credit card needed — just sign up and start',
                            style: TextTheme.of(context).bodySmall?.copyWith(
                              color: AppColors.teal,
                              fontWeight: FontWeight.w700,
                              fontSize: 12,
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 22),
              GestureDetector(
                onTap: () {
                  context.push('/register');
                },
                child: Text.rich(
                  TextSpan(
                    text: 'Don\'t have an account? ',
                    style: TextTheme.of(context).bodyMedium?.copyWith(
                      color: AppColors.textMid,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                    children: const [
                      TextSpan(
                        text: 'Sign up free',
                        style: TextStyle(
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
    );
  }
}
