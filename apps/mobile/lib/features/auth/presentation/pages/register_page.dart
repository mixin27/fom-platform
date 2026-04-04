import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  String _selectedCategory = 'Fashion';

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
              // Step indicator
              Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 4,
                      decoration: BoxDecoration(
                        color: AppColors.softOrange,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Container(
                      height: 4,
                      decoration: BoxDecoration(
                        color: AppColors.softOrangeMid,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Container(
                      height: 4,
                      decoration: BoxDecoration(
                        color: AppColors.border,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 28),

              // Back button equivalent or header text
              Align(
                alignment: Alignment.centerLeft,
                child: IconButton(
                  onPressed: () => context.pop(),
                  icon: const Icon(Icons.arrow_back),
                  padding: EdgeInsets.zero,
                  alignment: Alignment.centerLeft,
                ),
              ),

              // Header
              Text(
                'STEP 2 of 3',
                style: TextTheme.of(context).labelMedium?.copyWith(
                  color: AppColors.softOrange,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.84, // 0.06em approx
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Set up your\nShop',
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
                'Shop Name',
                style: TextTheme.of(context).labelSmall?.copyWith(
                  color: AppColors.textDark,
                  fontWeight: FontWeight.w800,
                  fontSize: 12,
                  letterSpacing: 0.72,
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.storefront, size: 18),
                  hintText: 'e.g. Ma Aye Fashion Shop',
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(
                      AppSpacing.borderRadiusMd,
                    ),
                    borderSide: const BorderSide(
                      color: AppColors.softOrange,
                      width: 2,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              Text(
                'SHOP CATEGORY — ကဏ္ဍ',
                style: TextTheme.of(context).labelSmall?.copyWith(
                  color: AppColors.textLight,
                  fontWeight: FontWeight.w800,
                  fontSize: 12,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 16),

              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                childAspectRatio: 1.5,
                children: [
                  _CategoryCard(
                    emoji: '👗',
                    name: 'Fashion',
                    nameMm: 'အဝတ်အစားများ',
                    isSelected: _selectedCategory == 'Fashion',
                    onTap: () => setState(() => _selectedCategory = 'Fashion'),
                  ),
                  _CategoryCard(
                    emoji: '💄',
                    name: 'Beauty',
                    nameMm: 'အလှကုန်များ',
                    isSelected: _selectedCategory == 'Beauty',
                    onTap: () => setState(() => _selectedCategory = 'Beauty'),
                  ),
                  _CategoryCard(
                    emoji: '🍔',
                    name: 'Food',
                    nameMm: 'စားစရာများ',
                    isSelected: _selectedCategory == 'Food',
                    onTap: () => setState(() => _selectedCategory = 'Food'),
                  ),
                  _CategoryCard(
                    emoji: '📱',
                    name: 'Electronics',
                    nameMm: 'အီလက်ထရောနစ်',
                    isSelected: _selectedCategory == 'Electronics',
                    onTap: () =>
                        setState(() => _selectedCategory = 'Electronics'),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              Text(
                'Facebook Page Link (Optional)',
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
                  prefixIcon: Icon(Icons.link, size: 18),
                  hintText: 'facebook.com/yourshop',
                ),
              ),
              const SizedBox(height: 26),

              ElevatedButton(
                onPressed: () {},
                child: const Text('Continue — ဆက်လက်မည်'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CategoryCard extends StatelessWidget {
  const _CategoryCard({
    required this.emoji,
    required this.name,
    required this.nameMm,
    required this.isSelected,
    required this.onTap,
  });

  final String emoji;
  final String name;
  final String nameMm;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.softOrangeLight : Colors.white,
          border: Border.all(
            color: isSelected ? AppColors.softOrange : AppColors.border,
            width: 2,
          ),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 24)),
            const SizedBox(height: 6),
            Text(
              name,
              style: TextTheme.of(context).labelSmall?.copyWith(
                color: AppColors.textDark,
                fontWeight: FontWeight.w800,
                fontSize: 12,
              ),
            ),
            Text(
              nameMm,
              style: TextTheme.of(
                context,
              ).bodySmall?.copyWith(color: AppColors.textMid, fontSize: 10),
            ),
          ],
        ),
      ),
    );
  }
}
