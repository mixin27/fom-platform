import 'package:flutter/material.dart';

import '../tokens/app_colors.dart';
import 'app_avatar.dart';

class AppCustomerCard extends StatelessWidget {
  const AppCustomerCard({
    required this.name,
    required this.phone,
    required this.spentText,
    required this.ordersText,
    required this.lastActiveText,
    super.key,
    this.township,
    this.imageUrl,
    this.onTap,
    this.isVip = false,
    this.isNewThisWeek = false,
    this.avatarBackgroundColor,
  });

  final String name;
  final String phone;
  final String? township;
  final String spentText;
  final String ordersText;
  final String lastActiveText;
  final String? imageUrl;
  final VoidCallback? onTap;
  final bool isVip;
  final bool isNewThisWeek;
  final Color? avatarBackgroundColor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.border, width: 1.5),
          ),
          child: Row(
            children: [
              SizedBox(
                width: 48,
                height: 48,
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    AppAvatar(
                      size: 46,
                      imageUrl: imageUrl,
                      backgroundColor: avatarBackgroundColor,
                      borderRadius: 15,
                      icon: const Icon(Icons.person_rounded),
                    ),
                    if (isVip || isNewThisWeek)
                      Positioned(
                        bottom: -3,
                        right: -3,
                        child: _CustomerBadge(
                          isVip: isVip,
                          isNewThisWeek: isNewThisWeek,
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.bodyLarge?.copyWith(
                              fontWeight: FontWeight.w900,
                              color: AppColors.textDark,
                              fontSize: 14,
                            ),
                          ),
                        ),
                        if (isVip)
                          const _CustomerChip(
                            label: 'VIP',
                            backgroundColor: Color(0xFFFEF3C7),
                            foregroundColor: Color(0xFFD97706),
                          ),
                        if (!isVip && isNewThisWeek)
                          const _CustomerChip(
                            label: 'NEW',
                            backgroundColor: AppColors.tealLight,
                            foregroundColor: AppColors.teal,
                          ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        const Icon(
                          Icons.call_outlined,
                          size: 12,
                          color: AppColors.textLight,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          phone,
                          style: theme.textTheme.labelSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColors.textLight,
                            fontSize: 11,
                          ),
                        ),
                        if ((township ?? '').trim().isNotEmpty) ...[
                          Container(
                            width: 3,
                            height: 3,
                            margin: const EdgeInsets.symmetric(horizontal: 6),
                            decoration: const BoxDecoration(
                              color: AppColors.border,
                              shape: BoxShape.circle,
                            ),
                          ),
                          Flexible(
                            child: Text(
                              township!,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: theme.textTheme.labelSmall?.copyWith(
                                fontWeight: FontWeight.w600,
                                color: AppColors.textLight,
                                fontSize: 11,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    spentText,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w900,
                      color: AppColors.textDark,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    ordersText,
                    style: theme.textTheme.labelSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.textLight,
                      fontSize: 10,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    lastActiveText,
                    style: theme.textTheme.labelSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.teal,
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CustomerChip extends StatelessWidget {
  const _CustomerChip({
    required this.label,
    required this.backgroundColor,
    required this.foregroundColor,
  });

  final String label;
  final Color backgroundColor;
  final Color foregroundColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(left: 4),
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          fontWeight: FontWeight.w800,
          color: foregroundColor,
          fontSize: 9,
        ),
      ),
    );
  }
}

class _CustomerBadge extends StatelessWidget {
  const _CustomerBadge({required this.isVip, required this.isNewThisWeek});

  final bool isVip;
  final bool isNewThisWeek;

  @override
  Widget build(BuildContext context) {
    final backgroundColor = isVip ? const Color(0xFFFCD34D) : AppColors.teal;

    return Container(
      width: 18,
      height: 18,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: backgroundColor,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 2),
      ),
      child: isVip
          ? const Icon(Icons.star_rounded, size: 9, color: Color(0xFF7C2D12))
          : Text(
              isNewThisWeek ? 'N' : '',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                fontWeight: FontWeight.w900,
                color: Colors.white,
                fontSize: 8,
              ),
            ),
    );
  }
}
