import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class EditShopProfilePage extends StatefulWidget {
  const EditShopProfilePage({super.key});

  @override
  State<EditShopProfilePage> createState() => _EditShopProfilePageState();
}

class _EditShopProfilePageState extends State<EditShopProfilePage> {
  // Mock State
  String _selectedCategory = 'fashion';
  String _selectedLanguage = 'my';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // Standard App Custom Plain Header
            _buildTopHeader(),

            // Scrollable forms body
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.only(
                  left: 16,
                  right: 16,
                  top: 20,
                  bottom: 90,
                ),
                child: Column(
                  children: [
                    // Avatar Upload
                    _buildAvatarUpload(),

                    // Forms
                    const _FormLabel(label: 'Shop Name *'),
                    const AppTextField(
                      controller:
                          null, // Would use TextEditingController(text: 'Ma Aye Shop')
                      hintText: 'Ma Aye Shop',
                      prefixIcon: Text('🏪', style: TextStyle(fontSize: 16)),
                      keyboardType: TextInputType.name,
                    ),

                    const _FormLabel(label: 'Phone Number'),
                    const AppTextField(
                      controller: null,
                      hintText: '09 7812 3456',
                      prefixIcon: Text('📞', style: TextStyle(fontSize: 16)),
                      keyboardType: TextInputType.phone,
                    ),

                    const _FormLabel(label: 'Facebook Page'),
                    const AppTextField(
                      hintText: 'facebook.com/yourshop',
                      prefixIcon: Text('🔗', style: TextStyle(fontSize: 16)),
                      keyboardType: TextInputType.url,
                    ),

                    const _FormLabel(label: 'Shop Category — ကဏ္ဍ'),
                    _buildCategoryGrid(),

                    const _FormLabel(label: 'App Language — ဘာသာစကား'),
                    _buildLanguageRow(),

                    const _FormLabel(label: 'Default Delivery Fee'),
                    const AppTextField(
                      controller: null,
                      hintText: '3000',
                      prefixIcon: Text('🚚', style: TextStyle(fontSize: 16)),
                      keyboardType: TextInputType.number,
                    ),

                    // Danger Zone
                    _buildDangerZone(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      decoration: const BoxDecoration(
        color: AppColors.warmWhite,
        border: Border(bottom: BorderSide(color: AppColors.border, width: 1.5)),
      ),
      child: Row(
        children: [
          AppIconButton(
            icon: const Icon(Icons.arrow_back_rounded),
            onPressed: () => context.pop(),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Edit Shop Profile',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: AppColors.textDark,
                  ),
                ),
                Text(
                  'ဆိုင်အချက်အလက် ပြင်မည်',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textLight,
                    fontFamily: 'NotoSansMyanmar',
                  ),
                ),
              ],
            ),
          ),
          AppButton(
            text: 'Save',
            onPressed: () {
              // Action triggers
              context.pop();
            },
          ),
        ],
      ),
    );
  }

  Widget _buildAvatarUpload() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              gradient: const LinearGradient(
                colors: [AppColors.softOrange, Color(0xFFFF8C5A)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              boxShadow: [
                BoxShadow(
                  color: AppColors.softOrange.withValues(alpha: 0.25),
                  blurRadius: 24,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                const Center(child: Text('👗', style: TextStyle(fontSize: 38))),
                Positioned(
                  bottom: -4,
                  right: -4,
                  child: Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: AppColors.textDark,
                      border: Border.all(color: Colors.white, width: 2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    alignment: Alignment.center,
                    child: const Text(
                      '✎',
                      style: TextStyle(fontSize: 12, color: Colors.white),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          const Text(
            'Tap to change shop icon',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: AppColors.textLight,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryGrid() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: GridView.count(
        crossAxisCount: 2,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        childAspectRatio: 1.8, // ~ Match layout ratio
        children: [
          AppSelectionOption(
            icon: const Text('👗', style: TextStyle(fontSize: 22)),
            label: 'Fashion',
            subtitle: 'အဝတ်အစားများ',
            isSelected: _selectedCategory == 'fashion',
            onTap: () => setState(() => _selectedCategory = 'fashion'),
          ),
          AppSelectionOption(
            icon: const Text('💄', style: TextStyle(fontSize: 22)),
            label: 'Beauty',
            subtitle: 'အလှကုန်များ',
            isSelected: _selectedCategory == 'beauty',
            onTap: () => setState(() => _selectedCategory = 'beauty'),
          ),
          AppSelectionOption(
            icon: const Text('🍔', style: TextStyle(fontSize: 22)),
            label: 'Food',
            subtitle: 'စားစရာများ',
            isSelected: _selectedCategory == 'food',
            onTap: () => setState(() => _selectedCategory = 'food'),
          ),
          AppSelectionOption(
            icon: const Text('📦', style: TextStyle(fontSize: 22)),
            label: 'Other',
            subtitle: 'အခြား',
            isSelected: _selectedCategory == 'other',
            onTap: () => setState(() => _selectedCategory = 'other'),
          ),
        ],
      ),
    );
  }

  Widget _buildLanguageRow() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        children: [
          _buildLangOpt('English', 'en'),
          const SizedBox(width: 8),
          _buildLangOpt('မြန်မာ', 'my'),
          const SizedBox(width: 8),
          _buildLangOpt('Both', 'both'),
        ],
      ),
    );
  }

  Widget _buildLangOpt(String label, String key) {
    final selected = _selectedLanguage == key;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedLanguage = key),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: selected ? AppColors.tealLight : Colors.white,
            border: Border.all(
              color: selected ? AppColors.teal : AppColors.border,
              width: 2,
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w800,
              color: selected ? AppColors.teal : AppColors.textMid,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDangerZone() {
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFEE2E2), // Red light
        border: Border.all(color: const Color(0xFFFECACA), width: 1.5),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            '⚠️ Danger Zone',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w900,
              color: Color(0xFFEF4444), // Red
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Deleting your account will permanently remove all orders and customer data.',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: Color(0xFFB91C1C),
            ),
          ),
          const SizedBox(height: 12),
          InkWell(
            onTap: () {},
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFECACA), width: 2),
              ),
              alignment: Alignment.center,
              child: const Text(
                '🗑 Delete Account',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFFEF4444), // Red
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FormLabel extends StatelessWidget {
  const _FormLabel({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    // RichText check for asterisk
    final List<TextSpan> spans = [];
    if (label.contains('*')) {
      final parts = label.split('*');
      spans.add(TextSpan(text: parts[0]));
      spans.add(
        const TextSpan(
          text: '*',
          style: TextStyle(color: AppColors.softOrange),
        ),
      );
      spans.add(TextSpan(text: parts[1]));
    } else {
      spans.add(TextSpan(text: label));
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Align(
        alignment: Alignment.centerLeft,
        child: RichText(
          text: TextSpan(
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: AppColors.textDark,
              letterSpacing: 0.06,
            ),
            children: spans,
          ),
        ),
      ),
    );
  }
}
