import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/di/injection_container.dart';
import '../../../../app/router/app_route_paths.dart';
import '../bloc/auth_bloc.dart';
import '../bloc/auth_event.dart';
import '../bloc/auth_state.dart';

class ShopSelectionPage extends StatelessWidget {
  const ShopSelectionPage({super.key, this.returnTo});

  final String? returnTo;

  @override
  Widget build(BuildContext context) {
    return BlocProvider<AuthBloc>.value(
      value: getIt<AuthBloc>(),
      child: _ShopSelectionView(returnTo: returnTo),
    );
  }
}

class _ShopSelectionView extends StatelessWidget {
  const _ShopSelectionView({this.returnTo});

  final String? returnTo;

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<AuthBloc, AuthState>(
      listenWhen: (previous, current) =>
          previous.errorMessage != current.errorMessage ||
          previous.activeShopId != current.activeShopId,
      listener: (context, state) {
        final message = state.errorMessage;
        if (message == null || message.isEmpty) {
          if (state.activeShop != null) {
            context.go(returnTo ?? AppRoutePaths.orders);
          }
          return;
        }

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
        );
      },
      builder: (context, state) {
        final shops = state.user?.shopAccesses ?? const [];
        final activeShop = state.activeShop;

        return Scaffold(
          backgroundColor: AppColors.background,
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    shops.isEmpty ? 'No shop access yet' : 'Choose a shop',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.w900,
                      color: AppColors.textDark,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    shops.isEmpty
                        ? 'This account is signed in, but it does not have any linked shop yet. Complete the first-shop setup on web or ask the platform owner to assign access.'
                        : 'This account has access to multiple shops. Pick one workspace to continue and we will remember it on this device.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textMid,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 20),
                  if (shops.isEmpty)
                    AppCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Signed in as ${state.user?.name ?? 'User'}',
                            style: Theme.of(context).textTheme.titleMedium
                                ?.copyWith(
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.textDark,
                                ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            state.user?.email ??
                                state.user?.phone ??
                                'No contact',
                            style: Theme.of(context).textTheme.bodyMedium
                                ?.copyWith(color: AppColors.textMid),
                          ),
                          const SizedBox(height: 20),
                          AppButton(
                            text: 'Log out',
                            variant: AppButtonVariant.secondary,
                            onPressed: () {
                              context.read<AuthBloc>().add(
                                const AuthLogoutRequested(),
                              );
                            },
                          ),
                        ],
                      ),
                    )
                  else
                    Column(
                      children: shops
                          .map((shop) {
                            final isSelected =
                                activeShop?.shopId == shop.shopId;

                            return Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: GestureDetector(
                                onTap: () {
                                  context.read<AuthBloc>().add(
                                    AuthShopSelected(shopId: shop.shopId),
                                  );
                                },
                                child: AppCard(
                                  color: isSelected
                                      ? AppColors.softOrange.withValues(
                                          alpha: 0.08,
                                        )
                                      : Colors.white,
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 52,
                                        height: 52,
                                        decoration: BoxDecoration(
                                          color: isSelected
                                              ? AppColors.softOrange
                                              : AppColors.softOrangeLight,
                                          borderRadius: BorderRadius.circular(
                                            18,
                                          ),
                                        ),
                                        alignment: Alignment.center,
                                        child: Text(
                                          shop.shopName.trim().isEmpty
                                              ? 'S'
                                              : shop.shopName
                                                    .trim()[0]
                                                    .toUpperCase(),
                                          style: Theme.of(context)
                                              .textTheme
                                              .titleLarge
                                              ?.copyWith(
                                                color: isSelected
                                                    ? Colors.white
                                                    : AppColors.softOrange,
                                                fontWeight: FontWeight.w900,
                                              ),
                                        ),
                                      ),
                                      const SizedBox(width: 14),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              shop.shopName,
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .titleMedium
                                                  ?.copyWith(
                                                    fontWeight: FontWeight.w800,
                                                    color: AppColors.textDark,
                                                  ),
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              '${_formatRoleLabel(shop.role)} · ${shop.permissions.length} permissions',
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .bodySmall
                                                  ?.copyWith(
                                                    color: AppColors.textMid,
                                                    fontWeight: FontWeight.w700,
                                                  ),
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              shop.timezone,
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .bodySmall
                                                  ?.copyWith(
                                                    color: AppColors.textLight,
                                                  ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Icon(
                                        isSelected
                                            ? Icons.check_circle
                                            : Icons.radio_button_unchecked,
                                        color: isSelected
                                            ? AppColors.softOrange
                                            : AppColors.textLight,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          })
                          .toList(growable: false),
                    ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

String _formatRoleLabel(String? role) {
  final normalized = (role ?? '').trim().toLowerCase();

  switch (normalized) {
    case 'owner':
      return 'Owner';
    case 'staff':
      return 'Staff';
    default:
      return normalized.isEmpty ? 'Member' : normalized;
  }
}
