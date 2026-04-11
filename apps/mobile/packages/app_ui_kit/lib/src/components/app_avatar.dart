import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../tokens/app_colors.dart';
import '../tokens/app_spacing.dart';

/// A rounded square avatar container for images or icon placeholders.
class AppAvatar extends StatelessWidget {
  const AppAvatar({
    super.key,
    this.imageUrl,
    this.icon,
    this.size = 42,
    this.borderRadius,
    this.backgroundColor,
  });

  /// Optional image URL to display.
  final String? imageUrl;

  /// Optional icon to display if no image is provided.
  final Widget? icon;

  /// The size (width and height) of the avatar.
  final double size;

  /// Optional custom border radius.
  final double? borderRadius;

  /// Optional custom background color.
  final Color? backgroundColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: backgroundColor ?? AppColors.softOrangeLight,
        borderRadius: BorderRadius.circular(
          borderRadius ?? AppSpacing.borderRadiusMd,
        ),
        image: imageUrl != null
            ? DecorationImage(
                image: CachedNetworkImageProvider(imageUrl!),
                fit: BoxFit.cover,
              )
            : null,
      ),
      child: imageUrl == null
          ? Center(
              child: IconTheme(
                data: IconThemeData(
                  size: size * 0.5,
                  color: AppColors.softOrange,
                ),
                child: icon ?? const Icon(Icons.person),
              ),
            )
          : null,
    );
  }
}
